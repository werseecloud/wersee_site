import type { ToolContext } from "./types.ts";

const SENSITIVE_KEYS = /(password|secret|token|authorization|cookie|private.?key|service.?role|bank|card|cvv|stripe.?account.?id)/i;

export const sanitizeForAudit = (value: unknown, depth = 0): unknown => {
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeForAudit(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEYS.test(key))
      .slice(0, 60)
      .map(([key, item]) => [key, sanitizeForAudit(item, depth + 1)]));
  }
  if (typeof value === "string") return value.slice(0, 4000);
  return value;
};

const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const writeAuditLog = async (
  context: ToolContext,
  event: {
    runId?: string;
    toolCallId?: string;
    eventType: string;
    toolName?: string;
    riskLevel?: string;
    status: string;
    arguments?: unknown;
    result?: unknown;
    errorCode?: string;
    userAgent?: string;
    ip?: string;
  },
) => {
  const payload = {
    run_id: event.runId || null,
    tool_call_id: event.toolCallId || null,
    user_id: context.user.id,
    business_id: context.business?.id || null,
    event_type: event.eventType,
    tool_name: event.toolName || null,
    risk_level: event.riskLevel || null,
    status: event.status,
    sanitized_arguments: sanitizeForAudit(event.arguments || {}),
    sanitized_result: event.result ? sanitizeForAudit(event.result) : null,
    error_code: event.errorCode || null,
    request_id: context.requestId,
    ip_hash: event.ip ? await sha256(event.ip) : null,
    user_agent_hash: event.userAgent ? await sha256(event.userAgent) : null,
  };
  const { error } = await context.adminClient.from("ai_audit_logs").insert(payload);
  if (error) console.error("AI audit write failed", { code: error.code, requestId: context.requestId });
};
