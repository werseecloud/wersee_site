const secretKeyPattern = /(authorization|api[-_]?key|token|secret|password|cookie|credential)/i;

export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 8) return "[Truncated]";
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redact(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([key, item]) => [key, secretKeyPattern.test(key) ? "[Redacted]" : redact(item, depth + 1)]),
    );
  }
  if (typeof value === "string") return value.length > 5000 ? `${value.slice(0, 5000)}…` : value;
  return value;
};

export const getPath = (source: unknown, path: string): unknown => {
  const normalized = path.replace(/^\$\.?/, "").replace(/^\./, "");
  if (!normalized) return source;
  return normalized.split(".").reduce<unknown>((value, part) => {
    if (value === null || value === undefined) return undefined;
    if (Array.isArray(value) && /^\d+$/.test(part)) return value[Number(part)];
    if (typeof value === "object") return (value as Record<string, unknown>)[part];
    return undefined;
  }, source);
};

const templatePattern = /\{\{\s*([^{}]+?)\s*\}\}/g;

export const resolveTemplates = (value: unknown, context: Record<string, unknown>): unknown => {
  if (Array.isArray(value)) return value.map((item) => resolveTemplates(item, context));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, resolveTemplates(item, context)]));
  }
  if (typeof value !== "string") return value;

  const exact = value.match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
  if (exact) return getPath(context, exact[1]);

  return value.replace(templatePattern, (_match, path: string) => {
    const resolved = getPath(context, path);
    if (resolved === null || resolved === undefined) return "";
    return typeof resolved === "string" ? resolved : JSON.stringify(resolved);
  });
};

export const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const isPrivateIpv4 = (address: string) => {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || parts[0] === 127
    || parts[0] === 0
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    || parts[0] >= 224;
};

const isPrivateIpv6 = (address: string) => {
  const normalized = address.toLowerCase();
  return normalized === "::1"
    || normalized === "::"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || normalized.startsWith("::ffff:127.")
    || normalized.startsWith("::ffff:10.")
    || normalized.startsWith("::ffff:192.168.");
};

export const assertPublicHttpUrl = async (rawUrl: string, allowHttp = false) => {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error("CONNECTION_URL_INVALID"); }
  if (url.username || url.password) throw new Error("CONNECTION_URL_CREDENTIALS_NOT_ALLOWED");
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) throw new Error("CONNECTION_HTTPS_REQUIRED");

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("CONNECTION_PRIVATE_HOST_BLOCKED");
  }
  if (isPrivateIpv4(host) || isPrivateIpv6(host)) throw new Error("CONNECTION_PRIVATE_HOST_BLOCKED");

  try {
    const records = await Promise.allSettled([
      Deno.resolveDns(host, "A"),
      Deno.resolveDns(host, "AAAA"),
    ]);
    const addresses = records.flatMap((record) => record.status === "fulfilled" ? record.value : []);
    if (addresses.some((address) => isPrivateIpv4(address) || isPrivateIpv6(address))) {
      throw new Error("CONNECTION_PRIVATE_HOST_BLOCKED");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "CONNECTION_PRIVATE_HOST_BLOCKED") throw error;
    // DNS resolution errors are surfaced by fetch with a user-safe connection error.
  }
  return url;
};

export const parseJsonObject = (text: string): Record<string, unknown> => {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI_WORKFLOW_INVALID_RESPONSE");
  const value = JSON.parse(cleaned.slice(start, end + 1));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AI_WORKFLOW_INVALID_RESPONSE");
  return value as Record<string, unknown>;
};

export const toPublicError = (error: unknown) => {
  const code = error instanceof Error ? error.message : "WORKFLOW_REQUEST_FAILED";
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Sign in again to use Workflows.",
    INVALID_ACCESS_TOKEN: "Your session is no longer valid. Sign in again.",
    BUSINESS_ACCESS_DENIED: "You do not have permission to manage workflows in this workspace.",
    WORKFLOW_NOT_FOUND: "That workflow was not found or you no longer have access.",
    WORKFLOW_NOT_PUBLISHED: "Activate this workflow before running it live.",
    WORKFLOW_CONNECTION_NOT_FOUND: "That connection was not found.",
    CONNECTION_URL_INVALID: "Enter a valid connection URL.",
    CONNECTION_HTTPS_REQUIRED: "Use a secure HTTPS connection URL.",
    CONNECTION_URL_CREDENTIALS_NOT_ALLOWED: "Remove the username and password from the URL and use the access-key field.",
    CONNECTION_PRIVATE_HOST_BLOCKED: "For security, Workflows cannot connect to private or local network addresses.",
    CONNECTION_FAILED: "Wersee could not connect to this tool. Check the URL and access key, then try again.",
    EMAIL_CONNECTION_REQUIRED: "Connect your email account before activating this step.",
    EMAIL_RECIPIENT_MISSING: "Wersee could not find an email address for this step.",
    AI_PROVIDER_NOT_CONFIGURED: "Wersee AI is not configured for this workspace yet.",
    AI_WORKFLOW_INVALID_RESPONSE: "Wersee AI could not turn that request into a safe workflow. Try describing the result more clearly.",
    WORKFLOW_APPROVAL_NOT_PENDING: "This approval has already been handled.",
    WORKFLOW_LIMIT_REACHED: "This run reached its safe step limit and was stopped.",
    TEST_BLOCKED_DESTRUCTIVE_ACTION: "This action was previewed but not sent because the workflow is in test mode.",
  };
  return {
    code: messages[code] ? code : "WORKFLOW_REQUEST_FAILED",
    message: messages[code] || "Wersee could not complete this workflow request.",
    retryable: ["CONNECTION_FAILED", "WORKFLOW_REQUEST_FAILED"].includes(code),
  };
};
