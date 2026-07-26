import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env.ts";
import type { BusinessAccess, ToolContext } from "./types.ts";

export class AuthError extends Error {
  constructor(public code: string, message: string, public status = 401) {
    super(message);
  }
}

export interface AuthenticatedRequest {
  user: User;
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
  token: string;
}

export const authenticateRequest = async (req: Request): Promise<AuthenticatedRequest> => {
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    throw new AuthError("AUTH_REQUIRED", "Sign in to use Wersee AI.");
  }

  const token = authorization.slice(7).trim();
  if (!token) throw new AuthError("AUTH_REQUIRED", "Sign in to use Wersee AI.");

  const env = getSupabaseEnv();
  const userClient = createClient(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) throw new AuthError("INVALID_ACCESS_TOKEN", "Your session is no longer valid.");

  // Constructed only after the caller has been authenticated. Domain operations
  // continue to use userClient so RLS remains active.
  const adminClient = createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { user: data.user, userClient, adminClient, token };
};

export const resolveBusinessAccess = async (
  auth: AuthenticatedRequest,
  requestedBusinessId?: string | null,
): Promise<BusinessAccess | null> => {
  let businessId = requestedBusinessId || null;
  if (!businessId) return null;

  const { data: business, error: businessError } = await auth.userClient
    .from("businesses")
    .select("id,name,user_id")
    .eq("id", businessId)
    .maybeSingle();
  if (businessError || !business) throw new AuthError("BUSINESS_NOT_FOUND", "The selected business was not found.", 404);

  if (business.user_id === auth.user.id) {
    return { id: business.id, name: business.name, role: "owner", isOwner: true };
  }

  const { data: member } = await auth.userClient
    .from("team_members")
    .select("role,status")
    .eq("business_id", business.id)
    .eq("user_id", auth.user.id)
    .in("status", ["active", "accepted", "joined"])
    .maybeSingle();

  if (!member) throw new AuthError("BUSINESS_ACCESS_DENIED", "You do not have access to this business.", 403);
  return { id: business.id, name: business.name, role: member.role || "member", isOwner: false };
};

export const createToolContext = async (
  req: Request,
  requestedBusinessId?: string | null,
): Promise<ToolContext> => {
  const auth = await authenticateRequest(req);
  const business = await resolveBusinessAccess(auth, requestedBusinessId);
  return {
    user: auth.user,
    userClient: auth.userClient,
    adminClient: auth.adminClient,
    business,
    requestId: req.headers.get("x-request-id") || crypto.randomUUID(),
    signal: req.signal,
  };
};
