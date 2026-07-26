import type { SupabaseClient } from "@supabase/supabase-js";
import { Cron } from "croner";
import { createAiProvider } from "../wersee-ai/provider.ts";
import type { WorkflowDefinition, WorkflowEdge, WorkflowNode } from "./schemas.ts";
import { assertPublicHttpUrl, getPath, redact, resolveTemplates, toPublicError } from "./utils.ts";

type JsonObject = Record<string, unknown>;
type PendingStep = { nodeId: string; loop?: { item: unknown; index: number } };

interface RunRecord {
  id: string;
  workflow_id: string;
  version_id?: string | null;
  status: string;
  test_mode: boolean;
  input: JsonObject;
  execution_context: JsonObject;
  started_at?: string | null;
}

interface WorkflowRecord {
  id: string;
  owner_id: string;
  business_id?: string | null;
  name: string;
  status: string;
  settings: JsonObject;
  draft_definition: WorkflowDefinition;
  published_version_id?: string | null;
}

const asObject = (value: unknown): JsonObject => value && typeof value === "object" && !Array.isArray(value)
  ? value as JsonObject
  : {};

const safeMessage = (error: unknown) => error instanceof Error ? error.message.slice(0, 1000) : "Unknown workflow error";

const readConnectionSecret = async (admin: SupabaseClient, connectionId: string) => {
  const { data, error } = await admin.rpc("read_workflow_connection_secret", { p_connection_id: connectionId });
  if (error) throw error;
  if (typeof data !== "string" || !data) return {};
  try { return asObject(JSON.parse(data)); } catch { return { accessKey: data }; }
};

const parseRpcResponse = async (response: Response) => {
  const text = await response.text();
  if (!response.ok) throw new Error("CONNECTION_FAILED");
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const payloads = text.split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);
    if (!payloads.length) throw new Error("CONNECTION_FAILED");
    return JSON.parse(payloads[payloads.length - 1]);
  }
  return JSON.parse(text);
};

const safeConnectionHeaders = (input: unknown) => {
  const headers = asObject(input);
  const blocked = /^(host|content-length|connection|cookie|set-cookie|transfer-encoding)$/i;
  return Object.fromEntries(Object.entries(headers)
    .filter(([key, value]) => !blocked.test(key) && typeof value === "string")
    .slice(0, 30)) as Record<string, string>;
};

const callMcp = async ({
  url,
  headers,
  method,
  params,
}: {
  url: string;
  headers: Record<string, string>;
  method: string;
  params?: JsonObject;
}) => {
  await assertPublicHttpUrl(url);
  const initializeResponse = await fetch(url, {
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
    headers: {
      ...headers,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "Wersee Workflows", version: "1.0.0" },
      },
    }),
  });
  const initialized = await parseRpcResponse(initializeResponse);
  if (initialized?.error) throw new Error("CONNECTION_FAILED");
  const sessionId = initializeResponse.headers.get("mcp-session-id");
  const sessionHeaders = sessionId ? { ...headers, "mcp-session-id": sessionId } : headers;

  await fetch(url, {
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
    headers: {
      ...sessionHeaders,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
  }).catch(() => undefined);

  const response = await fetch(url, {
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
    headers: {
      ...sessionHeaders,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params: params || {} }),
  });
  const payload = await parseRpcResponse(response);
  if (payload?.error) throw new Error("CONNECTION_FAILED");
  return payload?.result;
};

export const testConnection = async (admin: SupabaseClient, connection: any) => {
  const secret = await readConnectionSecret(admin, connection.id);
  if (connection.provider === "mcp") {
    const headers = safeConnectionHeaders(secret.headers);
    const result = await callMcp({ url: connection.base_url, headers, method: "tools/list" });
    const tools = Array.isArray(result?.tools) ? result.tools.slice(0, 200).map((tool: any) => ({
      name: String(tool?.name || "Unnamed tool").slice(0, 160),
      description: String(tool?.description || "Action provided by this tool connection.").slice(0, 1000),
      inputSchema: tool?.inputSchema && typeof tool.inputSchema === "object" ? tool.inputSchema : {},
    })) : [];
    return { ok: true, tools, message: `Connected. Wersee found ${tools.length} available action${tools.length === 1 ? "" : "s"}.` };
  }

  if (connection.provider === "resend") {
    const apiKey = typeof secret.apiKey === "string" ? secret.apiKey : Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("EMAIL_CONNECTION_REQUIRED");
    const response = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("CONNECTION_FAILED");
    return { ok: true, tools: [], message: "Email is connected and ready to send." };
  }

  if (!connection.base_url) throw new Error("CONNECTION_URL_INVALID");
  const url = await assertPublicHttpUrl(connection.base_url);
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    headers: safeConnectionHeaders(secret.headers),
  });
  if (response.status >= 500) throw new Error("CONNECTION_FAILED");
  return { ok: true, tools: [], message: "This service is reachable and ready to use." };
};

export const nextScheduledRun = (triggerConfig: JsonObject, after = new Date()) => {
  const expression = typeof triggerConfig.cron === "string" ? triggerConfig.cron : "0 9 * * *";
  const timezone = typeof triggerConfig.timezone === "string" ? triggerConfig.timezone : "UTC";
  try {
    const cron = new Cron(expression, { timezone, paused: true });
    const next = cron.nextRun(after);
    if (!next) throw new Error("INVALID_SCHEDULE");
    return next.toISOString();
  } catch {
    throw new Error("INVALID_SCHEDULE");
  }
};

const compareCondition = (left: unknown, operator: string, right: unknown) => {
  switch (operator) {
    case "equals": return left === right || String(left) === String(right);
    case "not_equals": return left !== right && String(left) !== String(right);
    case "greater_than": return Number(left) > Number(right);
    case "greater_or_equal": return Number(left) >= Number(right);
    case "less_than": return Number(left) < Number(right);
    case "less_or_equal": return Number(left) <= Number(right);
    case "contains": return Array.isArray(left) ? left.includes(right) : String(left ?? "").includes(String(right ?? ""));
    case "exists": return left !== null && left !== undefined && left !== "";
    case "not_exists": return left === null || left === undefined || left === "";
    default: return false;
  }
};

const durationMs = (config: JsonObject) => {
  const amount = Math.max(0, Math.min(Number(config.amount || 0), 365));
  const unit = typeof config.unit === "string" ? config.unit : "minutes";
  const multiplier = unit === "seconds" ? 1000
    : unit === "hours" ? 60 * 60 * 1000
    : unit === "days" ? 24 * 60 * 60 * 1000
    : 60 * 1000;
  return amount * multiplier;
};

const usageEvent = async (
  admin: SupabaseClient,
  workflow: WorkflowRecord,
  runId: string,
  type: string,
  metadata: JsonObject = {},
) => {
  await admin.from("workflow_usage_events").insert({
    workflow_id: workflow.id,
    run_id: runId,
    user_id: workflow.owner_id,
    business_id: workflow.business_id || null,
    event_type: type,
    quantity: 1,
    metadata: redact(metadata),
  });
};

const findConnection = async (
  admin: SupabaseClient,
  workflow: WorkflowRecord,
  provider: string,
  connectionId?: string,
) => {
  let query = admin.from("workflow_connections").select("*").eq("status", "connected");
  if (connectionId) query = query.eq("id", connectionId);
  else {
    query = query.eq("provider", provider);
    query = workflow.business_id ? query.eq("business_id", workflow.business_id) : query.eq("user_id", workflow.owner_id);
  }
  const { data, error } = await query.order("last_checked_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
};

const executeNode = async ({
  admin,
  workflow,
  run,
  node,
  context,
}: {
  admin: SupabaseClient;
  workflow: WorkflowRecord;
  run: RunRecord;
  node: WorkflowNode;
  context: JsonObject;
}): Promise<{ output: JsonObject; branch?: boolean; waitUntil?: string; approval?: JsonObject; aiActions?: number }> => {
  const config = resolveTemplates(node.config, context) as JsonObject;

  if (node.type === "trigger" || node.type === "note") return { output: {} };

  if (node.type === "condition") {
    const field = typeof node.config.field === "string" ? node.config.field : "";
    const left = getPath(context, field);
    const result = compareCondition(left, String(node.config.operator || "equals"), resolveTemplates(node.config.value, context));
    return { output: { matched: result, value: redact(left) }, branch: result };
  }

  if (node.type === "delay") {
    if (run.test_mode) return { output: { skippedInTest: true, message: `${node.title} was skipped in test mode.` } };
    return { output: { waiting: true }, waitUntil: new Date(Date.now() + durationMs(config)).toISOString() };
  }

  if (node.type === "approval") {
    if (run.test_mode) return { output: { approvedForTest: true, message: "Approval was previewed and automatically continued in test mode." } };
    return {
      output: { waitingForApproval: true },
      approval: {
        title: node.title,
        description: String(config.description || "Review this workflow step before it continues.").slice(0, 2000),
        assignedTo: typeof config.assignedTo === "string" ? config.assignedTo : workflow.owner_id,
        preview: redact(asObject(config.preview || run.input)),
      },
    };
  }

  if (node.type === "transform") {
    return { output: asObject(resolveTemplates(config.fields || config, context)) };
  }

  if (node.type === "notification") {
    const title = String(config.title || node.title).slice(0, 180);
    const message = String(config.message || "Workflow completed this step.").slice(0, 2000);
    if (run.test_mode) return { output: { preview: true, title, message } };
    const recipient = typeof config.userId === "string" ? config.userId : workflow.owner_id;
    const { data, error } = await admin.from("notifications").insert({
      user_id: recipient,
      type: "workflow",
      category: "workflow",
      title,
      message,
      data: { workflow_id: workflow.id, run_id: run.id, node_id: node.id },
    }).select("id").single();
    if (error) throw error;
    return { output: { notificationId: data.id, delivered: true } };
  }

  if (node.type === "email") {
    const to = String(config.to || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(to)) throw new Error("EMAIL_RECIPIENT_MISSING");
    const subject = String(config.subject || node.title).slice(0, 998);
    const body = String(config.body || "").slice(0, 100000);
    if (run.test_mode) return { output: { preview: true, to, subject, body } };

    const connection = await findConnection(admin, workflow, "resend", typeof config.connectionId === "string" ? config.connectionId : undefined);
    const secret = connection ? await readConnectionSecret(admin, connection.id) : {};
    const apiKey = typeof secret.apiKey === "string" ? secret.apiKey : Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("EMAIL_CONNECTION_REQUIRED");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: typeof config.from === "string" ? config.from : Deno.env.get("WERSEE_WORKFLOW_EMAIL_FROM") || "Wersee <workflows@wersee.com>",
        to: [to],
        subject,
        html: body.includes("<") ? body : body.replaceAll("\n", "<br>"),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error("CONNECTION_FAILED");
    await usageEvent(admin, workflow, run.id, "email", { nodeId: node.id });
    return { output: { messageId: payload?.id, delivered: true, to } };
  }

  if (node.type === "ai") {
    const prompt = String(config.prompt || "").trim().slice(0, 16000);
    if (!prompt) throw new Error("AI_PROMPT_REQUIRED");
    const provider = createAiProvider();
    let text = "";
    for await (const event of provider.streamCompletion({
      system: "You are Wersee AI executing one approved workflow step. Use only the supplied workflow data, do not claim external actions happened, do not reveal hidden reasoning, and return the requested result directly.",
      messages: [{ role: "user", content: prompt }],
      temperature: typeof config.temperature === "number" ? config.temperature : 0.3,
      maxTokens: typeof config.maxTokens === "number" ? Math.min(config.maxTokens, 4000) : 1200,
    })) text += event.text;
    await usageEvent(admin, workflow, run.id, "ai_action", { nodeId: node.id, provider: provider.name, model: provider.model });
    return { output: { text, provider: provider.name, model: provider.model }, aiActions: 1 };
  }

  if (node.type === "http") {
    const url = String(config.url || "");
    await assertPublicHttpUrl(url, Boolean(config.allowHttp));
    const method = String(config.method || "GET").toUpperCase();
    if (!new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]).has(method)) throw new Error("HTTP_METHOD_NOT_ALLOWED");
    if (run.test_mode) return { output: { preview: true, method, url, message: "The request was not sent in test mode." } };

    const connection = typeof config.connectionId === "string" ? await findConnection(admin, workflow, "http", config.connectionId) : null;
    const secret = connection ? await readConnectionSecret(admin, connection.id) : {};
    const headers = {
      ...safeConnectionHeaders(secret.headers),
      ...safeConnectionHeaders(config.headers),
    };
    const response = await fetch(url, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(Math.min(Math.max(Number(config.timeoutMs || 20000), 1000), 60000)),
      headers: { ...headers, "content-type": headers["content-type"] || "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(config.body ?? {}),
    });
    const responseText = (await response.text()).slice(0, 50000);
    if (!response.ok) throw new Error("CONNECTION_FAILED");
    let responseBody: unknown = responseText;
    try { responseBody = JSON.parse(responseText); } catch { /* Text response is valid. */ }
    await usageEvent(admin, workflow, run.id, "http_request", { nodeId: node.id, status: response.status });
    return { output: { status: response.status, body: redact(responseBody) } };
  }

  if (node.type === "mcp") {
    const connectionId = String(config.connectionId || "");
    const toolName = String(config.toolName || "");
    if (!connectionId || !toolName) throw new Error("WORKFLOW_CONNECTION_NOT_FOUND");
    if (run.test_mode) return { output: { preview: true, toolName, message: "The external tool was not changed in test mode." } };
    const connection = await findConnection(admin, workflow, "mcp", connectionId);
    if (!connection) throw new Error("WORKFLOW_CONNECTION_NOT_FOUND");
    const secret = await readConnectionSecret(admin, connection.id);
    const result = await callMcp({
      url: connection.base_url,
      headers: safeConnectionHeaders(secret.headers),
      method: "tools/call",
      params: { name: toolName, arguments: asObject(config.arguments) },
    });
    await usageEvent(admin, workflow, run.id, "mcp_tool", { nodeId: node.id, toolName });
    return { output: { result: redact(result) } };
  }

  throw new Error("WORKFLOW_NODE_NOT_SUPPORTED");
};

const outgoingFor = (edges: WorkflowEdge[], nodeId: string, branch?: boolean) => edges
  .filter((edge) => edge.source === nodeId)
  .filter((edge) => branch === undefined
    ? !edge.sourceHandle || edge.sourceHandle === "default"
    : !edge.sourceHandle || edge.sourceHandle === String(branch))
  .map((edge) => edge.target);

const finishRun = async (
  admin: SupabaseClient,
  run: RunRecord,
  workflow: WorkflowRecord,
  status: "succeeded" | "failed" | "cancelled",
  output: JsonObject,
  publicError: string | null,
  internalError: string | null,
  aiActions: number,
) => {
  const started = run.started_at ? new Date(run.started_at).getTime() : Date.now();
  const { error } = await admin.rpc("complete_workflow_run", {
    p_run_id: run.id,
    p_status: status,
    p_output: output,
    p_public_error: publicError,
    p_internal_error: internalError,
    p_ai_actions_used: aiActions,
    p_duration_ms: Math.max(0, Date.now() - started),
  });
  if (error) throw error;
  await usageEvent(admin, workflow, run.id, "run", { status, testMode: run.test_mode });
};

export const executeRun = async (admin: SupabaseClient, inputRun: RunRecord) => {
  const { data: workflowData, error: workflowError } = await admin.from("workflows").select("*").eq("id", inputRun.workflow_id).single();
  if (workflowError || !workflowData) throw workflowError || new Error("WORKFLOW_NOT_FOUND");
  const workflow = workflowData as WorkflowRecord;

  let definition: WorkflowDefinition;
  const savedContext = asObject(inputRun.execution_context);
  if (savedContext.definition) {
    definition = savedContext.definition as WorkflowDefinition;
  } else if (inputRun.version_id) {
    const { data: version, error } = await admin.from("workflow_versions").select("definition").eq("id", inputRun.version_id).single();
    if (error || !version) throw error || new Error("WORKFLOW_NOT_PUBLISHED");
    definition = version.definition as WorkflowDefinition;
  } else {
    definition = workflow.draft_definition;
  }

  const nodeById = new Map(definition.nodes.map((node) => [node.id, node]));
  const triggerNode = definition.nodes.find((node) => node.type === "trigger");
  if (!triggerNode) throw new Error("WORKFLOW_TRIGGER_MISSING");

  const { data: ownerResult } = await admin.auth.admin.getUserById(workflow.owner_id);
  const baseContext: JsonObject = {
    trigger: inputRun.input,
    owner: { id: workflow.owner_id, email: ownerResult?.user?.email || "" },
    steps: asObject(savedContext.steps),
  };
  let pending: PendingStep[] = Array.isArray(savedContext.pending)
    ? savedContext.pending as PendingStep[]
    : outgoingFor(definition.edges, triggerNode.id).map((nodeId) => ({ nodeId }));
  let processed = Number(savedContext.processed || 0);
  let aiActions = Number(savedContext.aiActions || 0);
  let currentStepId: string | null = null;

  if (savedContext.waitingStepId) {
    await admin.from("workflow_run_steps").update({
      status: "succeeded",
      output_preview: { resumed: true },
      finished_at: new Date().toISOString(),
    }).eq("id", String(savedContext.waitingStepId)).eq("status", "waiting");
    delete savedContext.waitingStepId;
  }

  try {
    await admin.from("workflow_runs").update({ status: "running", started_at: inputRun.started_at || new Date().toISOString() }).eq("id", inputRun.id);

    while (pending.length) {
      const maxSteps = Math.min(Math.max(Number(workflow.settings?.maxSteps || 100), 1), 250);
      if (++processed > maxSteps) throw new Error("WORKFLOW_LIMIT_REACHED");
      const current = pending.shift()!;
      const node = nodeById.get(current.nodeId);
      if (!node) throw new Error("WORKFLOW_STEP_MISSING");
      const nodeContext = { ...baseContext, loop: current.loop || null };
      const resolvedInput = asObject(resolveTemplates(node.config, nodeContext));
      const startedAt = new Date();
      const { data: step, error: stepError } = await admin.from("workflow_run_steps").insert({
        run_id: inputRun.id,
        workflow_id: workflow.id,
        node_id: node.id,
        node_type: node.type,
        node_title: node.title,
        status: "running",
        input_preview: redact(resolvedInput),
        started_at: startedAt.toISOString(),
      }).select("id").single();
      if (stepError) throw stepError;
      currentStepId = step.id;
      await admin.from("workflow_runs").update({ current_node_id: node.id }).eq("id", inputRun.id);

      if (node.type === "loop") {
        const itemsPath = typeof node.config.itemsPath === "string" ? node.config.itemsPath : "trigger.items";
        const items = getPath(nodeContext, itemsPath);
        const targets = outgoingFor(definition.edges, node.id);
        if (Array.isArray(items)) {
          const limited = items.slice(0, Math.min(Math.max(Number(node.config.maxItems || 25), 1), 100));
          pending = [
            ...limited.flatMap((item, index) => targets.map((nodeId) => ({ nodeId, loop: { item, index } }))),
            ...pending,
          ];
        }
        const loopOutput = { itemCount: Array.isArray(items) ? Math.min(items.length, 100) : 0 };
        (baseContext.steps as JsonObject)[node.id] = loopOutput;
        await admin.from("workflow_run_steps").update({
          status: "succeeded",
          output_preview: loopOutput,
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - startedAt.getTime(),
        }).eq("id", step.id);
        continue;
      }

      const result = await executeNode({ admin, workflow, run: inputRun, node, context: nodeContext });
      aiActions += result.aiActions || 0;
      (baseContext.steps as JsonObject)[node.id] = result.output;
      const next = outgoingFor(definition.edges, node.id, result.branch).map((nodeId) => ({ nodeId, loop: current.loop }));
      pending = [...next, ...pending];

      if (result.waitUntil) {
        await admin.from("workflow_run_steps").update({
          status: "waiting",
          output_preview: result.output,
          duration_ms: Date.now() - startedAt.getTime(),
        }).eq("id", step.id);
        await admin.from("workflow_runs").update({
          status: "waiting",
          resume_at: result.waitUntil,
          execution_context: { pending, steps: baseContext.steps, processed, aiActions, waitingStepId: step.id },
        }).eq("id", inputRun.id);
        return { status: "waiting", runId: inputRun.id };
      }

      if (result.approval) {
        const { error: approvalError } = await admin.from("workflow_approvals").insert({
          workflow_id: workflow.id,
          run_id: inputRun.id,
          step_id: step.id,
          requested_by: workflow.owner_id,
          assigned_to: result.approval.assignedTo,
          title: result.approval.title,
          description: result.approval.description,
          preview: result.approval.preview,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        if (approvalError) throw approvalError;
        await admin.from("workflow_run_steps").update({ status: "waiting", output_preview: result.output }).eq("id", step.id);
        await admin.from("workflow_runs").update({
          status: "waiting_approval",
          execution_context: { pending, steps: baseContext.steps, processed, aiActions, waitingStepId: step.id },
        }).eq("id", inputRun.id);
        return { status: "waiting_approval", runId: inputRun.id };
      }

      await admin.from("workflow_run_steps").update({
        status: "succeeded",
        output_preview: redact(result.output),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt.getTime(),
      }).eq("id", step.id);
      currentStepId = null;

      await admin.from("workflow_runs").update({
        execution_context: { pending, steps: baseContext.steps, processed, aiActions },
        ai_actions_used: aiActions,
      }).eq("id", inputRun.id);
    }

    const output = { steps: redact(baseContext.steps), message: "Workflow completed successfully." };
    await finishRun(admin, inputRun, workflow, "succeeded", output, null, null, aiActions);
    return { status: "succeeded", runId: inputRun.id, output };
  } catch (error) {
    const publicError = toPublicError(error);
    if (currentStepId) {
      await admin.from("workflow_run_steps").update({
        status: "failed",
        error_message: publicError.message,
        finished_at: new Date().toISOString(),
      }).eq("id", currentStepId);
    }
    await finishRun(admin, inputRun, workflow, "failed", {}, publicError.message, safeMessage(error), aiActions);
    return { status: "failed", runId: inputRun.id, error: publicError };
  }
};
