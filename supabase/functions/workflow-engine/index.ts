import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import { createAiProvider, toPublicProviderError } from "../wersee-ai/provider.ts";
import { executeRun, nextScheduledRun, testConnection } from "./executor.ts";
import {
  connectionInputSchema,
  createWorkflowSchema,
  proposalInputSchema,
  saveWorkflowSchema,
  workflowDefinitionSchema,
  workflowStatusSchema,
  type WorkflowDefinition,
} from "./schemas.ts";
import { assertPublicHttpUrl, sha256Hex, toPublicError } from "./utils.ts";

const allowedOrigin = (request: Request) => {
  const origin = request.headers.get("origin") || "";
  const configured = (Deno.env.get("WERSEE_ALLOWED_ORIGINS") || "https://wersee.com,https://www.wersee.com")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (configured.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return configured[0] || "https://wersee.com";
};

const corsHeaders = (request: Request) => ({
  "access-control-allow-origin": allowedOrigin(request),
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-workflow-worker-token, x-idempotency-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-max-age": "86400",
  vary: "Origin",
});

const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(request), "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const requireEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error("WORKFLOW_SERVER_MISCONFIGURED");
  return value;
};

const getAdmin = () => createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const authenticate = async (request: Request, admin: SupabaseClient): Promise<User> => {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  const token = authorization.slice(7).trim();
  if (!token) throw new Error("AUTH_REQUIRED");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user || data.user.role !== "authenticated") throw new Error("INVALID_ACCESS_TOKEN");
  return data.user;
};

const requestObject = async (request: Request) => {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error("INVALID_JSON");
  const value = await request.json();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_JSON");
  return value as Record<string, unknown>;
};

const hasBusinessAccess = async (
  admin: SupabaseClient,
  userId: string,
  businessId: string | null | undefined,
  manage = false,
) => {
  if (!businessId) return true;
  const { data: business } = await admin.from("businesses").select("id,user_id").eq("id", businessId).maybeSingle();
  if (!business) return false;
  if (business.user_id === userId) return true;
  const { data: member } = await admin.from("team_members").select("role,status")
    .eq("business_id", businessId).eq("user_id", userId)
    .in("status", ["active", "accepted", "joined"]).maybeSingle();
  if (!member) return false;
  return !manage || ["owner", "admin", "manager", "editor"].includes(String(member.role || "").toLowerCase());
};

const resolveBusinessId = async (admin: SupabaseClient, userId: string, requested?: string | null) => {
  if (requested) {
    if (!await hasBusinessAccess(admin, userId, requested, true)) throw new Error("BUSINESS_ACCESS_DENIED");
    return requested;
  }
  const { data: owned } = await admin.from("businesses").select("id").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (owned?.id) return owned.id as string;
  const { data: member } = await admin.from("team_members").select("business_id,role,status")
    .eq("user_id", userId).in("status", ["active", "accepted", "joined"])
    .not("business_id", "is", null).limit(1).maybeSingle();
  if (member?.business_id && ["owner", "admin", "manager", "editor"].includes(String(member.role || "").toLowerCase())) {
    return member.business_id as string;
  }
  return null;
};

const requireWorkflow = async (admin: SupabaseClient, userId: string, workflowId: string, manage = true) => {
  const { data: workflow, error } = await admin.from("workflows").select("*").eq("id", workflowId).maybeSingle();
  if (error || !workflow) throw new Error("WORKFLOW_NOT_FOUND");
  if (workflow.owner_id !== userId && !await hasBusinessAccess(admin, userId, workflow.business_id, manage)) {
    throw new Error("WORKFLOW_NOT_FOUND");
  }
  return workflow;
};

const nextVersionNumber = async (admin: SupabaseClient, workflowId: string) => {
  const { data } = await admin.from("workflow_versions").select("version_number")
    .eq("workflow_id", workflowId).order("version_number", { ascending: false }).limit(1).maybeSingle();
  return Number(data?.version_number || 0) + 1;
};

const saveVersion = async (
  admin: SupabaseClient,
  workflowId: string,
  userId: string,
  definition: WorkflowDefinition,
  summary: string,
  publish = false,
) => {
  const versionNumber = await nextVersionNumber(admin, workflowId);
  const { data, error } = await admin.from("workflow_versions").insert({
    workflow_id: workflowId,
    version_number: versionNumber,
    definition,
    change_summary: summary,
    created_by: userId,
    published_at: publish ? new Date().toISOString() : null,
  }).select("*").single();
  if (error) throw error;
  return data;
};

const createWorkflow = async (
  admin: SupabaseClient,
  user: User,
  input: z.infer<typeof createWorkflowSchema>,
) => {
  const businessId = await resolveBusinessId(admin, user.id, input.businessId);
  const definition = workflowDefinitionSchema.parse(input.definition);
  const name = input.name || definition.name || "Untitled workflow";
  const { data: workflow, error } = await admin.from("workflows").insert({
    owner_id: user.id,
    business_id: businessId,
    name,
    description: input.description || definition.summary,
    trigger_type: definition.trigger.type,
    trigger_config: definition.trigger.config,
    draft_definition: definition,
    status: "draft",
  }).select("*").single();
  if (error) throw error;

  const version = await saveVersion(admin, workflow.id, user.id, definition, "Initial workflow draft");
  const { data: updated, error: updateError } = await admin.from("workflows")
    .update({ current_version_id: version.id }).eq("id", workflow.id).select("*").single();
  if (updateError) throw updateError;
  return { workflow: updated, version };
};

const aiProposalSchema = z.object({
  definition: workflowDefinitionSchema,
  explanation: z.string().trim().min(1).max(3000),
  risks: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  permissions: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  missingInformation: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
}).strict();

const proposeWorkflow = async (input: z.infer<typeof proposalInputSchema>) => {
  const provider = createAiProvider();
  const toolName = "workflows.propose_draft";
  const current = input.currentDefinition ? JSON.stringify(input.currentDefinition) : "No current workflow.";
  let validationFeedback = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const plan = await provider.createToolPlan({
      request: `${input.currentDefinition ? "Modify the current draft" : "Create a new workflow draft"} from this plain-language request: ${input.prompt}\nCURRENT_DRAFT: ${current}${validationFeedback}`,
      mode: "assistant",
      trustedContext: {
        product: "Wersee Workflows",
        defaultMode: "simple",
        allowedNodeTypes: ["trigger", "email", "notification", "ai", "http", "mcp", "condition", "delay", "approval", "loop", "transform"],
      },
      untrustedContext: [],
      tools: [{
        name: toolName,
        description: "Propose, but never activate, one valid Wersee workflow. Use readable titles. Automatically map common customer, product and order data with {{trigger.field}} variables. Include exactly one trigger node and valid directed edges. Use safe defaults. Return the complete proposal as this tool input.",
        riskLevel: "low",
        requiredScopes: [],
        inputHint: "{definition:{schemaVersion:1,name,summary,trigger:{type,label,config},nodes:[{id,type,title,description?,config,position:{x,y}}],edges:[{id,source,target,sourceHandle?}],requiredConnections:[],dataAccess:[],estimatedUsage:{emailsPerRun,aiActionsPerRun}},explanation,risks:[],permissions:[],missingInformation:[]}",
      }],
    });
    const call = plan.toolCalls.find((item) => item.name === toolName);
    if (!call) {
      validationFeedback = "\nRETRY_REQUIREMENT: Your previous response did not call workflows.propose_draft. Call it exactly once with the complete proposal.";
      continue;
    }
    const parsed = aiProposalSchema.safeParse(call.input);
    if (parsed.success) {
      return { ...parsed.data, provider: provider.name, model: provider.model };
    }
    const issues = parsed.error.issues.slice(0, 12)
      .map((issue) => `${issue.path.join(".") || "proposal"}: ${issue.message}`)
      .join("; ");
    validationFeedback = `\nRETRY_REQUIREMENT: The previous proposal failed validation (${issues}). Return a corrected complete proposal only through ${toolName}.`;
  }
  throw new Error("AI_WORKFLOW_INVALID_RESPONSE");
};

const missingConnections = async (admin: SupabaseClient, workflow: any, definition: WorkflowDefinition) => {
  const requiredProviders = new Set<string>();
  if (definition.nodes.some((node) => node.type === "email") && !Deno.env.get("RESEND_API_KEY")) requiredProviders.add("resend");
  const explicitConnectionIds = definition.nodes
    .filter((node) => ["email", "mcp", "http"].includes(node.type))
    .map((node) => node.config.connectionId)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (explicitConnectionIds.length) {
    const { data } = await admin.from("workflow_connections").select("id,status").in("id", explicitConnectionIds);
    const connected = new Set((data || []).filter((item) => item.status === "connected").map((item) => item.id));
    explicitConnectionIds.forEach((id) => { if (!connected.has(id)) requiredProviders.add("connection"); });
  }

  if (requiredProviders.has("resend")) {
    let query = admin.from("workflow_connections").select("id").eq("provider", "resend").eq("status", "connected");
    query = workflow.business_id ? query.eq("business_id", workflow.business_id) : query.eq("user_id", workflow.owner_id);
    const { data } = await query.limit(1);
    if (data?.length) requiredProviders.delete("resend");
  }
  return [...requiredProviders];
};

const runWorkflow = async (admin: SupabaseClient, user: User, workflow: any, testMode: boolean, payload: Record<string, unknown>) => {
  if (!testMode && (workflow.status !== "active" || !workflow.published_version_id)) throw new Error("WORKFLOW_NOT_PUBLISHED");
  const definition = workflowDefinitionSchema.parse(workflow.draft_definition);
  const { data: run, error } = await admin.from("workflow_runs").insert({
    workflow_id: workflow.id,
    version_id: testMode ? null : workflow.published_version_id,
    initiated_by: user.id,
    status: "running",
    trigger_type: testMode ? "manual" : workflow.trigger_type,
    test_mode: testMode,
    input: payload,
    execution_context: testMode ? { definition } : {},
    idempotency_key: `manual:${crypto.randomUUID()}`,
    started_at: new Date().toISOString(),
  }).select("*").single();
  if (error) throw error;
  return executeRun(admin, run);
};

const handleDrain = async (request: Request, admin: SupabaseClient) => {
  const token = request.headers.get("x-workflow-worker-token") || "";
  const { data: valid, error: verifyError } = await admin.rpc("verify_workflow_worker_token", { p_token: token });
  if (verifyError || valid !== true) return json(request, { error: { code: "UNAUTHORIZED", message: "Worker authentication failed." } }, 401);

  const { data: schedules, error: scheduleError } = await admin.rpc("claim_due_workflow_schedules", { p_limit: 25 });
  if (scheduleError) throw scheduleError;
  let scheduled = 0;
  for (const workflow of schedules || []) {
    const scheduledAt = new Date().toISOString();
    const key = `schedule:${workflow.id}:${workflow.next_run_at || scheduledAt}`;
    const { error } = await admin.from("workflow_runs").insert({
      workflow_id: workflow.id,
      version_id: workflow.published_version_id,
      status: "queued",
      trigger_type: "schedule",
      input: { scheduled_at: scheduledAt, timezone: workflow.trigger_config?.timezone || "UTC" },
      idempotency_key: key,
    });
    if (!error) scheduled += 1;
    const nextRunAt = nextScheduledRun(workflow.trigger_config || {}, new Date(Date.now() + 1000));
    await admin.from("workflows").update({ next_run_at: nextRunAt }).eq("id", workflow.id);
  }

  const { data: runs, error: claimError } = await admin.rpc("claim_workflow_runs", { p_limit: 6 });
  if (claimError) throw claimError;
  const results = await Promise.allSettled((runs || []).map((run: any) => executeRun(admin, run)));
  return json(request, {
    ok: true,
    scheduled,
    claimed: (runs || []).length,
    completed: results.filter((result) => result.status === "fulfilled").length,
    failedToDispatch: results.filter((result) => result.status === "rejected").length,
  });
};

const handleWebhook = async (request: Request, admin: SupabaseClient, body: Record<string, unknown>) => {
  const workflowId = z.string().uuid().parse(body.workflowId);
  const token = z.string().min(20).max(500).parse(body.token);
  const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
    ? body.payload as Record<string, unknown>
    : {};
  const { data: workflow } = await admin.from("workflows").select("*").eq("id", workflowId).maybeSingle();
  if (!workflow || workflow.status !== "active" || workflow.trigger_type !== "webhook" || !workflow.webhook_token_hash) {
    return json(request, { error: { code: "WEBHOOK_NOT_FOUND", message: "This workflow webhook is not available." } }, 404);
  }
  if (await sha256Hex(token) !== workflow.webhook_token_hash) {
    return json(request, { error: { code: "WEBHOOK_NOT_FOUND", message: "This workflow webhook is not available." } }, 404);
  }
  const eventId = String(body.eventId || request.headers.get("x-idempotency-key") || crypto.randomUUID()).slice(0, 300);
  const { data: run, error } = await admin.from("workflow_runs").insert({
    workflow_id: workflow.id,
    version_id: workflow.published_version_id,
    status: "queued",
    trigger_type: "webhook",
    input: payload,
    idempotency_key: `webhook:${eventId}`,
  }).select("id,status").single();
  if (error?.code === "23505") return json(request, { accepted: true, duplicate: true }, 202);
  if (error) throw error;
  return json(request, { accepted: true, run }, 202);
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } }, 405);

  const admin = getAdmin();
  try {
    const body = await requestObject(request);
    const action = z.string().trim().min(1).max(80).parse(body.action);

    if (action === "drain") return await handleDrain(request, admin);
    if (action === "webhook") return await handleWebhook(request, admin, body);

    const user = await authenticate(request, admin);

    if (action === "propose") {
      const proposal = await proposeWorkflow(proposalInputSchema.parse({
        prompt: body.prompt,
        businessId: body.businessId,
        currentDefinition: body.currentDefinition,
      }));
      return json(request, { proposal, mutationPerformed: false });
    }

    if (action === "create") {
      const result = await createWorkflow(admin, user, createWorkflowSchema.parse({
        name: body.name,
        description: body.description || "",
        businessId: body.businessId,
        definition: body.definition,
      }));
      return json(request, result, 201);
    }

    if (action === "save") {
      const input = saveWorkflowSchema.parse({
        workflowId: body.workflowId,
        name: body.name,
        description: body.description || "",
        definition: body.definition,
        snapshot: body.snapshot || false,
        changeSummary: body.changeSummary || "Saved workflow version",
      });
      await requireWorkflow(admin, user.id, input.workflowId);
      const definition = workflowDefinitionSchema.parse(input.definition);
      let version = null;
      if (input.snapshot) version = await saveVersion(admin, input.workflowId, user.id, definition, input.changeSummary);
      const updatePayload: Record<string, unknown> = {
        name: input.name,
        description: input.description,
        trigger_type: definition.trigger.type,
        trigger_config: definition.trigger.config,
        draft_definition: definition,
      };
      if (version?.id) updatePayload.current_version_id = version.id;
      const { data: workflow, error } = await admin.from("workflows").update(updatePayload)
        .eq("id", input.workflowId).select("*").single();
      if (error) throw error;
      return json(request, { workflow, version, savedAt: new Date().toISOString() });
    }

    if (action === "publish") {
      const workflowId = z.string().uuid().parse(body.workflowId);
      const workflow = await requireWorkflow(admin, user.id, workflowId);
      const definition = workflowDefinitionSchema.parse(body.definition || workflow.draft_definition);
      const missing = await missingConnections(admin, workflow, definition);
      if (missing.length) {
        return json(request, { error: { code: "WORKFLOW_CONNECTIONS_MISSING", message: "Connect the required account before activating this workflow.", missingConnections: missing } }, 409);
      }
      const version = await saveVersion(admin, workflowId, user.id, definition, String(body.changeSummary || "Published workflow"), true);
      let webhookToken: string | null = null;
      let webhookTokenHash = workflow.webhook_token_hash;
      if (definition.trigger.type === "webhook" && !webhookTokenHash) {
        webhookToken = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
        webhookTokenHash = await sha256Hex(webhookToken);
      }
      const nextRunAt = definition.trigger.type === "schedule" ? nextScheduledRun(definition.trigger.config) : null;
      const { data: updated, error } = await admin.from("workflows").update({
        status: "active",
        trigger_type: definition.trigger.type,
        trigger_config: definition.trigger.config,
        draft_definition: definition,
        current_version_id: version.id,
        published_version_id: version.id,
        webhook_token_hash: webhookTokenHash,
        next_run_at: nextRunAt,
        archived_at: null,
      }).eq("id", workflowId).select("*").single();
      if (error) throw error;
      const webhookUrl = webhookToken
        ? `${requireEnv("SUPABASE_URL")}/functions/v1/workflow-engine`
        : null;
      return json(request, { workflow: updated, version, webhookToken, webhookUrl });
    }

    if (action === "set-status") {
      const workflowId = z.string().uuid().parse(body.workflowId);
      const status = workflowStatusSchema.parse(body.status);
      const workflow = await requireWorkflow(admin, user.id, workflowId);
      if (status === "active" && !workflow.published_version_id) throw new Error("WORKFLOW_NOT_PUBLISHED");
      const nextRunAt = status === "active" && workflow.trigger_type === "schedule"
        ? nextScheduledRun(workflow.trigger_config || {})
        : status === "paused" || status === "disabled" || status === "archived" ? null : workflow.next_run_at;
      const { data, error } = await admin.from("workflows").update({
        status,
        next_run_at: nextRunAt,
        archived_at: status === "archived" ? new Date().toISOString() : null,
      }).eq("id", workflowId).select("*").single();
      if (error) throw error;
      return json(request, { workflow: data });
    }

    if (action === "duplicate") {
      const workflowId = z.string().uuid().parse(body.workflowId);
      const workflow = await requireWorkflow(admin, user.id, workflowId, false);
      const result = await createWorkflow(admin, user, createWorkflowSchema.parse({
        name: `${workflow.name} copy`.slice(0, 160),
        description: workflow.description || "",
        businessId: workflow.business_id,
        definition: { ...workflow.draft_definition, name: `${workflow.name} copy`.slice(0, 160) },
      }));
      return json(request, result, 201);
    }

    if (action === "run") {
      const workflowId = z.string().uuid().parse(body.workflowId);
      const workflow = await requireWorkflow(admin, user.id, workflowId);
      const testMode = body.testMode !== false;
      const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
        ? body.payload as Record<string, unknown>
        : {};
      return json(request, { run: await runWorkflow(admin, user, workflow, testMode, payload) });
    }

    if (action === "approval-decision") {
      const approvalId = z.string().uuid().parse(body.approvalId);
      const decision = z.enum(["approved", "rejected"]).parse(body.decision);
      const { data: approval } = await admin.from("workflow_approvals").select("*,workflow_runs(*)").eq("id", approvalId).maybeSingle();
      if (!approval || approval.status !== "pending") throw new Error("WORKFLOW_APPROVAL_NOT_PENDING");
      await requireWorkflow(admin, user.id, approval.workflow_id);
      const now = new Date().toISOString();
      await admin.from("workflow_approvals").update({
        status: decision,
        decision_note: String(body.note || "").slice(0, 2000),
        decided_by: user.id,
        decided_at: now,
      }).eq("id", approvalId);
      if (decision === "approved") {
        await admin.from("workflow_run_steps").update({ status: "succeeded", output_preview: { approved: true }, finished_at: now }).eq("id", approval.step_id);
        const { data: resumedRun, error: resumeError } = await admin.from("workflow_runs")
          .update({ status: "running", resume_at: null }).eq("id", approval.run_id).eq("status", "waiting_approval")
          .select("*").single();
        if (resumeError) throw resumeError;
        return json(request, { approval: { ...approval, status: decision }, run: await executeRun(admin, resumedRun) });
      }
      await admin.from("workflow_run_steps").update({ status: "failed", error_message: "The approval was rejected.", finished_at: now }).eq("id", approval.step_id);
      await admin.rpc("complete_workflow_run", {
        p_run_id: approval.run_id,
        p_status: "cancelled",
        p_output: {},
        p_public_error: "The workflow stopped because the approval was rejected.",
        p_internal_error: null,
        p_ai_actions_used: approval.workflow_runs?.ai_actions_used || 0,
        p_duration_ms: null,
      });
      return json(request, { approval: { ...approval, status: decision }, run: { status: "cancelled", runId: approval.run_id } });
    }

    if (action === "connect") {
      const input = connectionInputSchema.parse({
        businessId: body.businessId,
        provider: body.provider,
        name: body.name,
        baseUrl: body.baseUrl,
        transport: body.transport || "https",
        accessKey: body.accessKey,
        headers: body.headers || {},
        metadata: body.metadata || {},
      });
      const businessId = await resolveBusinessId(admin, user.id, input.businessId);
      if (input.provider !== "resend" && !input.baseUrl) throw new Error("CONNECTION_URL_INVALID");
      if (input.baseUrl) await assertPublicHttpUrl(input.baseUrl);
      const { data: connection, error } = await admin.from("workflow_connections").insert({
        business_id: businessId,
        user_id: user.id,
        provider: input.provider,
        name: input.name,
        status: "connecting",
        transport: input.transport,
        base_url: input.baseUrl || null,
        metadata: input.metadata,
      }).select("*").single();
      if (error) throw error;
      const secret = input.provider === "resend"
        ? { apiKey: input.accessKey || "" }
        : { headers: { ...input.headers, ...(input.accessKey ? { Authorization: `Bearer ${input.accessKey}` } : {}) } };
      if (input.accessKey || Object.keys(input.headers).length) {
        const { error: secretError } = await admin.rpc("store_workflow_connection_secret", {
          p_connection_id: connection.id,
          p_value: JSON.stringify(secret),
        });
        if (secretError) throw secretError;
      }
      try {
        const test = await testConnection(admin, connection);
        const { data: updated, error: updateError } = await admin.from("workflow_connections").update({
          status: "connected",
          discovered_tools: test.tools,
          last_checked_at: new Date().toISOString(),
          last_error: null,
        }).eq("id", connection.id).select("*").single();
        if (updateError) throw updateError;
        return json(request, { connection: updated, test }, 201);
      } catch (error) {
        const publicError = toPublicError(error);
        const { data: updated } = await admin.from("workflow_connections").update({
          status: "needs_attention",
          last_checked_at: new Date().toISOString(),
          last_error: publicError.message,
        }).eq("id", connection.id).select("*").single();
        return json(request, { connection: updated, test: { ok: false, error: publicError } }, 201);
      }
    }

    if (action === "test-connection") {
      const connectionId = z.string().uuid().parse(body.connectionId);
      const { data: connection } = await admin.from("workflow_connections").select("*").eq("id", connectionId).maybeSingle();
      if (!connection || (connection.user_id !== user.id && !await hasBusinessAccess(admin, user.id, connection.business_id))) {
        throw new Error("WORKFLOW_CONNECTION_NOT_FOUND");
      }
      try {
        const test = await testConnection(admin, connection);
        const { data: updated } = await admin.from("workflow_connections").update({
          status: "connected", discovered_tools: test.tools, last_checked_at: new Date().toISOString(), last_error: null,
        }).eq("id", connection.id).select("*").single();
        return json(request, { connection: updated, test });
      } catch (error) {
        const publicError = toPublicError(error);
        const { data: updated } = await admin.from("workflow_connections").update({
          status: "needs_attention", last_checked_at: new Date().toISOString(), last_error: publicError.message,
        }).eq("id", connection.id).select("*").single();
        return json(request, { connection: updated, test: { ok: false, error: publicError } });
      }
    }

    if (action === "delete-connection") {
      const connectionId = z.string().uuid().parse(body.connectionId);
      const { data: connection } = await admin.from("workflow_connections").select("*").eq("id", connectionId).maybeSingle();
      if (!connection || (connection.user_id !== user.id && !await hasBusinessAccess(admin, user.id, connection.business_id, true))) {
        throw new Error("WORKFLOW_CONNECTION_NOT_FOUND");
      }
      await admin.rpc("delete_workflow_connection_secret", { p_connection_id: connectionId });
      const { error } = await admin.from("workflow_connections").delete().eq("id", connectionId);
      if (error) throw error;
      return json(request, { deleted: true });
    }

    if (action === "rotate-webhook") {
      const workflowId = z.string().uuid().parse(body.workflowId);
      const workflow = await requireWorkflow(admin, user.id, workflowId);
      if (workflow.trigger_type !== "webhook") throw new Error("WORKFLOW_TRIGGER_NOT_WEBHOOK");
      const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
      const { error } = await admin.from("workflows").update({ webhook_token_hash: await sha256Hex(token) }).eq("id", workflowId);
      if (error) throw error;
      return json(request, { webhookToken: token, webhookUrl: `${requireEnv("SUPABASE_URL")}/functions/v1/workflow-engine` });
    }

    return json(request, { error: { code: "ACTION_NOT_FOUND", message: "Workflow action not found." } }, 404);
  } catch (error) {
    console.error("workflow-engine request failed", error instanceof Error ? error.message : "unknown");
    if (error instanceof z.ZodError) {
      return json(request, { error: { code: "VALIDATION_FAILED", message: "Check the highlighted workflow settings and try again.", details: error.issues.slice(0, 12).map((issue) => ({ path: issue.path.join("."), message: issue.message })) } }, 400);
    }
    const providerError = toPublicProviderError(error);
    if (providerError.code !== "AI_PROVIDER_FAILED" || (error instanceof Error && error.message.startsWith("AI_PROVIDER"))) {
      return json(request, { error: providerError }, providerError.retryable ? 503 : 400);
    }
    const publicError = toPublicError(error);
    const status = publicError.code === "AUTH_REQUIRED" || publicError.code === "INVALID_ACCESS_TOKEN" ? 401
      : publicError.code === "BUSINESS_ACCESS_DENIED" ? 403
      : publicError.code === "WORKFLOW_NOT_FOUND" ? 404
      : 400;
    return json(request, { error: publicError }, status);
  }
});
