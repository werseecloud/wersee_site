import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "zod";
import {
  approveAction,
  cancelRun,
  handleChat,
  rejectAction,
  undoAction,
} from "./orchestrator.ts";
import {
  archiveConversation,
  analyzeSiteComputer,
  createConversation,
  deleteInstruction,
  generateListingDraft,
  generateText,
  getPermissions,
  getUsage,
  listActivity,
  listConversations,
  listInstructions,
  listMessages,
  saveInstruction,
  updatePermissions,
} from "./api.ts";

const configuredOrigins = (Deno.env.get("WERSEE_ALLOWED_ORIGINS") || Deno.env.get("WERSEE_ALLOWED_ORIGIN") || "")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set(["https://wersee.com", "https://www.wersee.com", "http://localhost:3000", "http://127.0.0.1:3000", ...configuredOrigins]);
const corsHeadersFor = (req: Request) => ({
  "access-control-allow-origin": allowedOrigins.has(req.headers.get("origin") || "") ? req.headers.get("origin")! : "https://wersee.com",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "vary": "Origin",
});

const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeadersFor(req), "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const errorResponse = (req: Request, error: unknown) => {
  console.error("wersee-ai request failed", error instanceof Error ? error.message : "unknown");
  if (error instanceof z.ZodError) return json(req, { error: { code: "VALIDATION_FAILED", message: "The request did not match the expected format.", retryable: false } }, 400);
  const code = error instanceof Error ? error.message : "AI_REQUEST_FAILED";
  const statuses: Record<string, number> = {
    UNAUTHORIZED: 401,
    AUTH_REQUIRED: 401,
    INVALID_ACCESS_TOKEN: 401,
    BUSINESS_NOT_FOUND: 404,
    BUSINESS_ACCESS_DENIED: 403,
    CONVERSATION_NOT_FOUND: 404,
    ACTION_NOT_FOUND: 404,
    INSTRUCTION_NOT_FOUND: 404,
    ACTION_NOT_PENDING: 409,
    ACTION_NOT_REVERSIBLE: 409,
    APPROVAL_EXPIRED: 409,
    UNDO_EXPIRED: 409,
    AI_RATE_LIMITED: 429,
  };
  const publicMessages: Record<string, string> = {
    UNAUTHORIZED: "Sign in again to use Wersee AI.",
    AUTH_REQUIRED: "Sign in to use Wersee AI.",
    INVALID_ACCESS_TOKEN: "Your session is no longer valid. Sign in again.",
    BUSINESS_NOT_FOUND: "The selected business was not found.",
    BUSINESS_ACCESS_DENIED: "You do not have access to that business.",
    CONVERSATION_NOT_FOUND: "That conversation was not found.",
    ACTION_NOT_FOUND: "That action was not found.",
    INSTRUCTION_NOT_FOUND: "That saved instruction was not found.",
    ACTION_NOT_PENDING: "That action is no longer waiting for approval.",
    ACTION_NOT_REVERSIBLE: "That action cannot be undone.",
    APPROVAL_EXPIRED: "That approval request expired. Ask Wersee AI to prepare it again.",
    UNDO_EXPIRED: "The undo window for that action has expired.",
    AI_RATE_LIMITED: "Too many AI requests. Try again in a minute.",
    INVALID_JSON: "The request body is invalid.",
    PROMPT_REQUIRED: "Enter a prompt first.",
  };
  return json(req, { error: { code: publicMessages[code] ? code : "AI_REQUEST_FAILED", message: publicMessages[code] || "Wersee AI could not complete the request.", retryable: (statuses[code] || 500) >= 429 } }, statuses[code] || 500);
};

const pathAfterFunctionName = (url: URL) => {
  const marker = "/wersee-ai";
  const index = url.pathname.lastIndexOf(marker);
  return index >= 0 ? url.pathname.slice(index + marker.length) || "/" : url.pathname;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeadersFor(req) });
  const url = new URL(req.url);
  const path = pathAfterFunctionName(url);
  const respond = (body: unknown, status = 200) => json(req, body, status);
  try {
    if (req.method === "GET" && path === "/health") return respond({ ok: true, service: "wersee-ai" });
    if (req.method === "POST" && path === "/chat") {
      const response = await handleChat(req);
      Object.entries(corsHeadersFor(req)).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }
    if (req.method === "GET" && path === "/conversations") return respond(await listConversations(req, url));
    if (req.method === "POST" && path === "/conversations") return respond(await createConversation(req), 201);
    const messagesMatch = path.match(/^\/conversations\/([0-9a-f-]+)\/messages$/i);
    if (req.method === "GET" && messagesMatch) return respond(await listMessages(req, messagesMatch[1], url));
    const conversationMatch = path.match(/^\/conversations\/([0-9a-f-]+)$/i);
    if (req.method === "DELETE" && conversationMatch) return respond(await archiveConversation(req, conversationMatch[1]));

    const actionMatch = path.match(/^\/actions\/([0-9a-f-]+)\/(approve|reject|undo)$/i);
    if (req.method === "POST" && actionMatch) {
      if (actionMatch[2] === "approve") return respond(await approveAction(req, actionMatch[1]));
      if (actionMatch[2] === "reject") return respond(await rejectAction(req, actionMatch[1]));
      return respond(await undoAction(req, actionMatch[1]));
    }
    const runMatch = path.match(/^\/runs\/([0-9a-f-]+)\/cancel$/i);
    if (req.method === "POST" && runMatch) return respond(await cancelRun(req, runMatch[1]));

    if (req.method === "GET" && path === "/permissions") return respond(await getPermissions(req, url));
    if (req.method === "PUT" && path === "/permissions") return respond(await updatePermissions(req));
    if (req.method === "GET" && path === "/activity") return respond(await listActivity(req, url));
    if (req.method === "GET" && path === "/usage") return respond(await getUsage(req, url));
    if (req.method === "GET" && path === "/instructions") return respond(await listInstructions(req, url));
    if (req.method === "POST" && path === "/instructions") return respond(await saveInstruction(req), 201);
    const instructionMatch = path.match(/^\/instructions\/([0-9a-f-]+)$/i);
    if (req.method === "DELETE" && instructionMatch) return respond(await deleteInstruction(req, instructionMatch[1]));
    if (req.method === "POST" && path === "/generate") return respond(await generateText(req));
    if (req.method === "POST" && path === "/site-computer/analyze") return respond(await analyzeSiteComputer(req));
    if (req.method === "POST" && path === "/listing-draft") return respond(await generateListingDraft(req));
    return respond({ error: { code: "NOT_FOUND", message: "Wersee AI endpoint not found.", retryable: false } }, 404);
  } catch (error) {
    return errorResponse(req, error);
  }
});
