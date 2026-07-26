import { z } from "zod";
import { createToolContext } from "./auth.ts";
import { writeAuditLog, sanitizeForAudit } from "./audit.ts";
import { sanitizePageContext, sanitizeUntrustedText, promptInjectionNotice } from "./contextBuilder.ts";
import { getAiEnv } from "./env.ts";
import { decideToolPolicy } from "./policyEngine.ts";
import { createAiProvider, toPublicProviderError } from "./provider.ts";
import { createDeterministicFallbackPlan, getRegisteredTool, getToolDescriptors } from "./toolRegistry.ts";
import type { AiMode, AiStreamEvent, AiToolPlan, SafeActionResult, ToolContext, WerseeAiTool } from "./types.ts";

const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(240),
  type: z.enum(["image", "file", "context"]),
  storagePath: z.string().trim().max(800).optional(),
  excerpt: z.string().max(4000).optional(),
}).strict();

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(12000),
  mode: z.enum(["assistant", "agent"]).default("assistant"),
  context: z.unknown().optional(),
  attachments: z.array(attachmentSchema).max(10).default([]),
  idempotencyKey: z.string().trim().min(8).max(160),
}).strict();

const parseJsonBody = async (req: Request) => {
  try { return await req.json(); } catch { throw new Error("INVALID_JSON"); }
};

const insertControlRow = async (context: ToolContext, table: string, payload: Record<string, unknown>) => {
  const { data, error } = await context.adminClient.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
};

const updateControlRow = async (context: ToolContext, table: string, id: string, payload: Record<string, unknown>) => {
  const { data, error } = await context.adminClient.from(table).update(payload).eq("id", id).eq("user_id", context.user.id).select().maybeSingle();
  if (error) throw error;
  return data;
};

const getPermissions = async (context: ToolContext) => {
  let query = context.adminClient.from("ai_permissions").select("agent_enabled,memory_enabled,scopes")
    .eq("user_id", context.user.id);
  query = context.business ? query.eq("business_id", context.business.id) : query.is("business_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return { agentEnabled: Boolean(data?.agent_enabled), memoryEnabled: data?.memory_enabled !== false, scopes: Array.isArray(data?.scopes) ? data.scopes : [] };
};

const enforceUsageLimits = async (context: ToolContext) => {
  const env = getAiEnv();
  const now = Date.now();
  const minuteAgo = new Date(now - 60000).toISOString();
  const dayAgo = new Date(now - 86400000).toISOString();
  const [{ count: minuteCount, error: minuteError }, { count: dayCount, error: dayError }] = await Promise.all([
    context.adminClient.from("ai_runs").select("id", { count: "exact", head: true }).eq("user_id", context.user.id).gte("created_at", minuteAgo),
    context.adminClient.from("ai_runs").select("id", { count: "exact", head: true }).eq("user_id", context.user.id).gte("created_at", dayAgo),
  ]);
  if (minuteError) throw minuteError;
  if (dayError) throw dayError;
  if ((minuteCount || 0) >= env.perMinuteLimit) throw new Error("AI_RATE_LIMITED");
  if ((dayCount || 0) >= env.dailyRunLimit) throw new Error("AI_DAILY_LIMIT_REACHED");
};

const ensureConversation = async (
  context: ToolContext,
  conversationId: string | undefined,
  title: string,
  mode: AiMode,
) => {
  if (conversationId) {
    const { data, error } = await context.userClient.from("ai_conversations").select("id")
      .eq("id", conversationId).eq("user_id", context.user.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("CONVERSATION_NOT_FOUND");
    return conversationId;
  }
  const { data, error } = await context.userClient.from("ai_conversations").insert({
    user_id: context.user.id,
    business_id: context.business?.id || null,
    title: title.slice(0, 80),
    mode,
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
};

const persistMessage = async (
  context: ToolContext,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  runId?: string,
  components: unknown[] = [],
) => {
  const { error } = await context.userClient.from("ai_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    run_id: runId || null,
    components,
    content_blocks: components,
    metadata: {},
  });
  if (error) throw error;
  await context.userClient.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
};

const loadConversationContext = async (context: ToolContext, conversationId: string, memoryEnabled: boolean) => {
  const { data: messages, error } = await context.userClient.from("ai_messages")
    .select("role,content,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  let instructionQuery = context.userClient.from("ai_saved_instructions")
    .select("label,instruction")
    .eq("user_id", context.user.id)
    .eq("is_active", true);
  instructionQuery = context.business
    ? instructionQuery.or(`business_id.is.null,business_id.eq.${context.business.id}`)
    : instructionQuery.is("business_id", null);
  const { data: instructions, error: instructionError } = memoryEnabled
    ? await instructionQuery.limit(20)
    : { data: [], error: null };
  if (instructionError) throw instructionError;

  return {
    history: (messages || []).reverse().map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: sanitizeUntrustedText(String(message.content || "")).slice(0, 3000),
    })),
    instructions: (instructions || []).map((item) => ({
      source: `saved_instruction:${item.label}`,
      content: sanitizeUntrustedText(item.instruction),
    })),
  };
};

const publicError = (error: unknown) => {
  const code = error instanceof Error ? error.message : "AI_RUN_FAILED";
  const known: Record<string, { message: string; retryable: boolean }> = {
    AI_RATE_LIMITED: { message: "Too many AI requests. Try again in a minute.", retryable: true },
    AI_DAILY_LIMIT_REACHED: { message: "Your daily Wersee AI usage limit has been reached.", retryable: false },
    CONVERSATION_NOT_FOUND: { message: "That conversation is no longer available.", retryable: false },
    LISTING_NOT_FOUND: { message: "That listing was not found or is not yours.", retryable: false },
    BUSINESS_CONTEXT_REQUIRED: { message: "Select a business before running this action.", retryable: false },
    STRIPE_CONNECTION_REQUIRED: { message: "Connect Wersee Pay before creating a payment link.", retryable: false },
    INVALID_JSON: { message: "The request body is invalid.", retryable: false },
  };
  const match = known[code];
  return { code: match ? code : "AI_RUN_FAILED", message: match?.message || "Wersee AI could not complete this request.", retryable: match?.retryable ?? true };
};

const executeToolCall = async ({
  context,
  tool,
  input,
  runId,
  stepId,
  toolCallId,
  idempotencyKey,
}: {
  context: ToolContext;
  tool: WerseeAiTool;
  input: unknown;
  runId: string;
  stepId: string;
  toolCallId: string;
  idempotencyKey: string;
}): Promise<SafeActionResult> => {
  await updateControlRow(context, "ai_tool_calls", toolCallId, { status: "running", started_at: new Date().toISOString() });
  await updateControlRow(context, "ai_run_steps", stepId, { status: "running", started_at: new Date().toISOString() });
  await writeAuditLog(context, { runId, toolCallId, eventType: "tool.started", toolName: tool.name, riskLevel: tool.riskLevel, status: "running", arguments: input });
  try {
    const result = await tool.execute(context, input as never, idempotencyKey);
    const undo = tool.createUndoOperation?.(result) || null;
    await updateControlRow(context, "ai_tool_calls", toolCallId, {
      status: "completed",
      approval_status: "approved",
      sanitized_result: sanitizeForAudit(result),
      reversible: Boolean(undo),
      undo_payload: undo,
      completed_at: new Date().toISOString(),
    });
    await updateControlRow(context, "ai_run_steps", stepId, { status: "completed", safe_result: sanitizeForAudit(result), completed_at: new Date().toISOString() });
    await writeAuditLog(context, { runId, toolCallId, eventType: "tool.completed", toolName: tool.name, riskLevel: tool.riskLevel, status: "completed", arguments: input, result });
    return result;
  } catch (error) {
    const safe = publicError(error);
    await updateControlRow(context, "ai_tool_calls", toolCallId, { status: "failed", error_code: safe.code, completed_at: new Date().toISOString() });
    await updateControlRow(context, "ai_run_steps", stepId, { status: "failed", error_code: safe.code, completed_at: new Date().toISOString() });
    await writeAuditLog(context, { runId, toolCallId, eventType: "tool.failed", toolName: tool.name, riskLevel: tool.riskLevel, status: "failed", arguments: input, errorCode: safe.code });
    throw error;
  }
};

const findExistingToolCall = async (context: ToolContext, idempotencyKey: string) => {
  const { data, error } = await context.adminClient.from("ai_tool_calls")
    .select("id,run_id,step_id,status,approval_status,preview,sanitized_result")
    .eq("user_id", context.user.id).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (error) throw error;
  return data;
};

export const handleChat = async (req: Request): Promise<Response> => {
  const raw = await parseJsonBody(req);
  const body = chatSchema.parse(raw);
  const pageContext = sanitizePageContext(body.context);
  const businessId = typeof pageContext.businessId === "string" ? pageContext.businessId : undefined;
  const context = await createToolContext(req, businessId);
  await enforceUsageLimits(context);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let runId: string | undefined;
      const send = (event: AiStreamEvent) => controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
      try {
        const permissions = await getPermissions(context);
        const conversationId = await ensureConversation(context, body.conversationId, body.message, body.mode);
        const conversationContext = await loadConversationContext(context, conversationId, permissions.memoryEnabled);
        await persistMessage(context, conversationId, "user", body.message);
        const run = await insertControlRow(context, "ai_runs", {
          conversation_id: conversationId,
          user_id: context.user.id,
          business_id: context.business?.id || null,
          mode: body.mode,
          status: "running",
          started_at: new Date().toISOString(),
        });
        const activeRunId = String(run.id);
        runId = activeRunId;
        send({ type: "run.started", runId: activeRunId, conversationId });

        const contextStep = await insertControlRow(context, "ai_run_steps", { run_id: activeRunId, user_id: context.user.id, position: 0, kind: "context", label: "Checking workspace context", status: "running", started_at: new Date().toISOString() });
        send({ type: "step.started", stepId: contextStep.id, label: contextStep.label });
        await insertControlRow(context, "ai_context_snapshots", { run_id: activeRunId, user_id: context.user.id, business_id: context.business?.id || null, page: pageContext.page || null, entity_type: pageContext.entityType || null, entity_id: pageContext.entityId || null, sanitized_context: pageContext });
        await updateControlRow(context, "ai_run_steps", contextStep.id, { status: "completed", completed_at: new Date().toISOString() });
        send({ type: "step.completed", stepId: contextStep.id });

        const provider = createAiProvider();
        await updateControlRow(context, "ai_runs", activeRunId, { provider: provider.name, model: provider.model });
        const untrustedContext = [
          ...conversationContext.history.map((message, index) => ({ source: `conversation_history:${index}:${message.role}`, content: message.content })),
          ...conversationContext.instructions,
          ...body.attachments.map((attachment) => ({ source: `${attachment.type}:${attachment.name}`, content: sanitizeUntrustedText(attachment.excerpt || "Attached item; content not automatically trusted or executed.") })),
        ];
        let plan: AiToolPlan | null = null;
        try {
          plan = await provider.createToolPlan({ request: body.message, mode: body.mode, trustedContext: pageContext, untrustedContext, tools: getToolDescriptors(), signal: req.signal });
        } catch (providerError) {
          plan = createDeterministicFallbackPlan(body.message, pageContext);
          if (!plan) throw providerError;
        }
        if (!plan) throw new Error("AI_PROVIDER_FAILED");

        const results: SafeActionResult[] = [];
        const components: unknown[] = [];
        let waitingForApproval = false;
        for (let index = 0; index < plan.toolCalls.length; index += 1) {
          const planned = plan.toolCalls[index];
          const tool = getRegisteredTool(planned.name);
          if (!tool) continue;
          const parsed = tool.inputSchema.safeParse(planned.input);
          if (!parsed.success) {
            const actionId = crypto.randomUUID();
            send({ type: "action.failed", actionId, error: { code: "TOOL_INPUT_INVALID", message: `Wersee AI produced invalid input for ${tool.name}.`, retryable: true } });
            continue;
          }

          const policy = decideToolPolicy({ tool, mode: body.mode, grantedScopes: permissions.scopes, agentEnabled: permissions.agentEnabled, isOwner: context.business?.isOwner ?? true });
          if (!policy.allowed) {
            const actionId = crypto.randomUUID();
            send({ type: "action.failed", actionId, error: { code: "TOOL_RESTRICTED", message: policy.reason || "This action is restricted.", retryable: false } });
            continue;
          }

          const toolIdempotencyKey = `${body.idempotencyKey}:${index}:${tool.name}`;
          const existing = await findExistingToolCall(context, toolIdempotencyKey);
          if (existing) {
            if (existing.status === "completed" && existing.sanitized_result) {
              const result = existing.sanitized_result as SafeActionResult;
              results.push(result);
              send({ type: "action.completed", actionId: existing.id, result });
            } else if (existing.approval_status === "pending") {
              waitingForApproval = true;
              send({ type: "action.proposed", action: { id: existing.id, toolName: tool.name, riskLevel: tool.riskLevel, preview: existing.preview, requiredScopes: tool.requiredScopes } });
              send({ type: "action.waiting_for_approval", actionId: existing.id });
            }
            continue;
          }

          const preview = tool.preview ? await tool.preview(context, parsed.data) : null;
          const step = await insertControlRow(context, "ai_run_steps", { run_id: activeRunId, user_id: context.user.id, position: index + 1, kind: "tool", label: tool.description, status: policy.requiresApproval ? "waiting_for_approval" : "pending" });
          const toolCall = await insertControlRow(context, "ai_tool_calls", {
            run_id: activeRunId,
            step_id: step.id,
            conversation_id: conversationId,
            user_id: context.user.id,
            business_id: context.business?.id || null,
            tool_name: tool.name,
            category: tool.category,
            validated_arguments: parsed.data,
            risk_level: tool.riskLevel,
            required_scopes: tool.requiredScopes,
            status: policy.requiresApproval ? "waiting_for_approval" : "proposed",
            approval_status: policy.requiresApproval ? "pending" : "not_required",
            preview,
            reversible: Boolean(tool.createUndoOperation),
            idempotency_key: toolIdempotencyKey,
          });

          if (policy.requiresApproval) {
            waitingForApproval = true;
            await insertControlRow(context, "ai_action_approvals", { tool_call_id: toolCall.id, user_id: context.user.id, business_id: context.business?.id || null, status: "pending" });
            await writeAuditLog(context, { runId: activeRunId, toolCallId: toolCall.id, eventType: "action.proposed", toolName: tool.name, riskLevel: tool.riskLevel, status: "waiting_for_approval", arguments: parsed.data });
            const action = { id: toolCall.id, toolName: tool.name, title: preview?.title || tool.description, category: tool.category, riskLevel: tool.riskLevel, requiredScopes: tool.requiredScopes, preview, arguments: parsed.data, status: "waiting_for_approval" };
            components.push({ type: "action", action });
            send({ type: "action.proposed", action });
            send({ type: "action.waiting_for_approval", actionId: toolCall.id });
          } else {
            send({ type: "action.started", actionId: toolCall.id });
            const result = await executeToolCall({ context, tool, input: parsed.data, runId: activeRunId, stepId: step.id, toolCallId: toolCall.id, idempotencyKey: toolIdempotencyKey });
            results.push(result);
            components.push({ type: "result", toolName: tool.name, result });
            send({ type: "action.completed", actionId: toolCall.id, result });
          }
        }

        let responseText = plan.assistantMessage || "";
        if (waitingForApproval) {
          responseText = responseText || "I prepared the requested changes. Review the action cards before anything is changed.";
        } else if (results.length) {
          responseText = "";
          const system = `You are Wersee AI. Summarize only the confirmed TOOL_RESULTS. Do not invent numbers, identifiers, URLs, or completion states. Mention date ranges and data sources when present. ${promptInjectionNotice} Do not reveal chain-of-thought.`;
          for await (const event of provider.streamCompletion({ system, messages: [{ role: "user", content: body.message }, { role: "assistant", content: `TOOL_RESULTS: ${JSON.stringify(results)}` }], maxTokens: 1000, temperature: 0.2, signal: req.signal })) {
            responseText += event.text;
            send({ type: "message.delta", text: event.text });
          }
        }
        if (!responseText) responseText = results.map((result) => result.summary).join("\n\n") || "I couldn't match that request to a safe Wersee action yet.";
        if (!results.length || waitingForApproval) send({ type: "message.delta", text: responseText });

        await persistMessage(context, conversationId, "assistant", responseText, activeRunId, components);
        await insertControlRow(context, "ai_usage_events", {
          run_id: activeRunId,
          user_id: context.user.id,
          business_id: context.business?.id || null,
          provider: provider.name,
          model: provider.model,
          input_tokens: Math.ceil(body.message.length / 4),
          output_tokens: Math.ceil(responseText.length / 4),
          tool_calls: plan.toolCalls.length,
        });
        const finalStatus = waitingForApproval ? "waiting_for_approval" : "completed";
        await updateControlRow(context, "ai_runs", activeRunId, { status: finalStatus, completed_at: waitingForApproval ? null : new Date().toISOString() });
        if (!waitingForApproval) send({ type: "run.completed", runId: activeRunId });
      } catch (error) {
        const providerError = toPublicProviderError(error);
        const safe = providerError.code !== "AI_PROVIDER_FAILED" ? providerError : publicError(error);
        if (runId) {
          await updateControlRow(context, "ai_runs", runId, { status: req.signal.aborted ? "cancelled" : "failed", error_code: safe.code, error_message: safe.message, completed_at: new Date().toISOString() }).catch(() => null);
          send({ type: "run.failed", runId, error: safe });
        } else {
          send({ type: "run.failed", runId: "unstarted", error: safe });
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      // Request cancellation propagates through req.signal to provider fetches.
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" },
  });
};

export const approveAction = async (req: Request, actionId: string) => {
  const body = z.object({ editedArguments: z.record(z.string(), z.unknown()).optional() }).strict().parse(await parseJsonBody(req).catch(() => ({})));
  const context = await createToolContext(req);
  const { data: call, error } = await context.adminClient.from("ai_tool_calls")
    .select("*,ai_action_approvals(*)").eq("id", actionId).eq("user_id", context.user.id).maybeSingle();
  if (error) throw error;
  if (!call) throw new Error("ACTION_NOT_FOUND");
  if (call.status === "completed") return { actionId, result: call.sanitized_result, idempotentReplay: true };
  if (call.approval_status !== "pending" || call.status !== "waiting_for_approval") throw new Error("ACTION_NOT_PENDING");
  const approval = Array.isArray(call.ai_action_approvals) ? call.ai_action_approvals[0] : call.ai_action_approvals;
  if (!approval || approval.status !== "pending" || new Date(approval.expires_at) <= new Date()) throw new Error("APPROVAL_EXPIRED");

  const businessContext = await createToolContext(req, call.business_id);
  const tool = getRegisteredTool(call.tool_name);
  if (!tool || tool.riskLevel === "restricted") throw new Error("TOOL_RESTRICTED");
  const input = body.editedArguments || call.validated_arguments;
  const parsed = tool.inputSchema.parse(input);
  await businessContext.adminClient.from("ai_action_approvals").update({ status: "approved", approver_id: context.user.id, decided_at: new Date().toISOString(), edited_arguments: body.editedArguments || null }).eq("id", approval.id).eq("user_id", context.user.id);
  await updateControlRow(businessContext, "ai_tool_calls", actionId, { approval_status: "approved", validated_arguments: parsed });
  const result = await executeToolCall({ context: businessContext, tool, input: parsed, runId: call.run_id, stepId: call.step_id, toolCallId: actionId, idempotencyKey: call.idempotency_key });

  const { count } = await businessContext.adminClient.from("ai_tool_calls").select("id", { count: "exact", head: true })
    .eq("run_id", call.run_id).in("status", ["waiting_for_approval", "running", "proposed"]);
  if (!count) await updateControlRow(businessContext, "ai_runs", call.run_id, { status: "completed", completed_at: new Date().toISOString() });
  return { actionId, result };
};

export const rejectAction = async (req: Request, actionId: string) => {
  const context = await createToolContext(req);
  const { data: call, error } = await context.adminClient.from("ai_tool_calls").select("id,run_id,step_id,tool_name,risk_level,status")
    .eq("id", actionId).eq("user_id", context.user.id).maybeSingle();
  if (error) throw error;
  if (!call) throw new Error("ACTION_NOT_FOUND");
  if (call.status === "rejected") return { actionId, status: "rejected", idempotentReplay: true };
  if (call.status !== "waiting_for_approval") throw new Error("ACTION_NOT_PENDING");
  await context.adminClient.from("ai_action_approvals").update({ status: "rejected", approver_id: context.user.id, decided_at: new Date().toISOString() }).eq("tool_call_id", actionId).eq("user_id", context.user.id);
  await updateControlRow(context, "ai_tool_calls", actionId, { status: "rejected", approval_status: "rejected", completed_at: new Date().toISOString() });
  await updateControlRow(context, "ai_run_steps", call.step_id, { status: "cancelled", completed_at: new Date().toISOString() });
  await writeAuditLog(context, { runId: call.run_id, toolCallId: actionId, eventType: "action.rejected", toolName: call.tool_name, riskLevel: call.risk_level, status: "rejected" });
  return { actionId, status: "rejected" };
};

export const undoAction = async (req: Request, actionId: string) => {
  const context = await createToolContext(req);
  const { data: call, error } = await context.adminClient.from("ai_tool_calls").select("*")
    .eq("id", actionId).eq("user_id", context.user.id).maybeSingle();
  if (error) throw error;
  if (!call) throw new Error("ACTION_NOT_FOUND");
  if (call.status === "undone") return { actionId, status: "undone", idempotentReplay: true };
  if (call.status !== "completed" || !call.reversible || !call.undo_payload) throw new Error("ACTION_NOT_REVERSIBLE");
  const undo = call.undo_payload as { toolName?: string; input?: Record<string, unknown>; expiresAt?: string };
  if (undo.expiresAt && new Date(undo.expiresAt) <= new Date()) throw new Error("UNDO_EXPIRED");
  const originalTool = getRegisteredTool(call.tool_name);
  let result: SafeActionResult;
  if (originalTool?.undo) result = await originalTool.undo(context, undo.input || {});
  else {
    const undoTool = undo.toolName ? getRegisteredTool(undo.toolName) : null;
    if (!undoTool) throw new Error("UNDO_NOT_SUPPORTED");
    const parsed = undoTool.inputSchema.parse(undo.input || {});
    result = await undoTool.execute(context, parsed as never, `${call.idempotency_key}:undo`);
  }
  await updateControlRow(context, "ai_tool_calls", actionId, { status: "undone", sanitized_result: { original: call.sanitized_result, undo: sanitizeForAudit(result) }, completed_at: new Date().toISOString() });
  await writeAuditLog(context, { runId: call.run_id, toolCallId: actionId, eventType: "action.undone", toolName: call.tool_name, riskLevel: call.risk_level, status: "undone", result });
  return { actionId, status: "undone", result };
};

export const cancelRun = async (req: Request, runId: string) => {
  const context = await createToolContext(req);
  const { data, error } = await context.adminClient.from("ai_runs").update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", runId).eq("user_id", context.user.id).in("status", ["queued", "running", "waiting_for_approval"]).select("id,status").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("RUN_NOT_CANCELLABLE");
  await context.adminClient.from("ai_run_steps").update({ status: "cancelled", completed_at: new Date().toISOString() }).eq("run_id", runId).eq("user_id", context.user.id).in("status", ["pending", "running", "waiting_for_approval"]);
  await context.adminClient.from("ai_tool_calls").update({ status: "cancelled", completed_at: new Date().toISOString() }).eq("run_id", runId).eq("user_id", context.user.id).in("status", ["proposed", "running", "waiting_for_approval"]);
  return data;
};
