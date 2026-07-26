import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const stripe = new Stripe(env("STRIPE_SECRET_KEY"));

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const safeAppOrigin = (value: unknown) => {
  try {
    const url = new URL(String(value || "https://wersee.com"));
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const wersee = url.hostname === "wersee.com" || url.hostname.endsWith(".wersee.com");
    return local || wersee ? url.origin : "https://wersee.com";
  } catch {
    return "https://wersee.com";
  }
};

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
};

async function loadInvitation(rawToken: string) {
  if (rawToken.length < 50 || rawToken.length > 200) {
    throw new Response("Invitation not found", { status: 404 });
  }
  const tokenHash = await sha256Hex(rawToken);
  const { data: recipient, error } = await admin
    .from("payout_recipients")
    .select("id,owner_user_id,recipient_user_id,name,email,stripe_connected_account_id,onboarding_status,invite_expires_at,claimed_at")
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();
  if (error) throw error;
  if (!recipient || !recipient.invite_expires_at || new Date(recipient.invite_expires_at) <= new Date()) {
    throw new Response("Invitation is invalid or expired", { status: 410 });
  }
  const { data: payoutRequest, error: requestError } = await admin
    .from("finance_payout_requests")
    .select("id,amount_minor,currency,status,created_at")
    .eq("recipient_id", recipient.id)
    .eq("payout_kind", "other_recipient")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (requestError) throw requestError;
  if (!payoutRequest) throw new Response("Payout request not found", { status: 404 });
  return { recipient, payoutRequest };
}

async function refreshRecipientStatus(recipient: Record<string, any>, payoutRequestId: string) {
  const accountId = recipient.stripe_connected_account_id as string | null;
  if (!accountId || accountId === "sandbox") return false;
  const account = await stripe.accounts.retrieve(accountId);
  const ready = !account.deleted
    && account.details_submitted === true
    && account.capabilities?.transfers === "active";
  await admin.from("payout_recipients").update({
    onboarding_status: ready ? "ready" : "onboarding",
    updated_at: new Date().toISOString(),
  }).eq("id", recipient.id);
  if (ready) {
    await admin.from("finance_payout_requests").update({ status: "pending" }).eq("id", payoutRequestId);
  }
  return ready;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const input = await request.json();
    const action = String(input.action || "inspect");
    const rawToken = String(input.token || "");
    const { recipient, payoutRequest } = await loadInvitation(rawToken);
    const ready = await refreshRecipientStatus(recipient, payoutRequest.id);

    if (action === "inspect") {
      return json({
        recipientName: recipient.name,
        recipientEmail: maskEmail(recipient.email),
        amountMinor: payoutRequest.amount_minor,
        currency: payoutRequest.currency,
        status: ready ? "ready" : recipient.onboarding_status,
        ready,
      });
    }
    if (action !== "start") return json({ error: "Unknown action" }, 400);

    const authHeader = request.headers.get("Authorization") || "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "");
    const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
    const user = authData.user;
    if (authError || !user) return json({ error: "Sign in to accept this invitation", code: "AUTH_REQUIRED" }, 401);
    if (!user.email_confirmed_at) {
      return json({ error: "Confirm your email address before continuing", code: "EMAIL_CONFIRMATION_REQUIRED" }, 403);
    }
    if (!user.email || user.email.toLowerCase() !== recipient.email.toLowerCase()) {
      return json({ error: "This invitation belongs to another email address", code: "EMAIL_MISMATCH" }, 403);
    }
    if (ready) return json({ ready: true, message: "Your payout account is ready." });

    const lookup = await admin.rpc("lookup_payout_recipient_account", { p_email: recipient.email });
    if (lookup.error) throw lookup.error;
    const matched = Array.isArray(lookup.data) ? lookup.data[0] : lookup.data;
    let accountId = recipient.stripe_connected_account_id || matched?.stripe_account_id;

    if (!accountId || accountId === "sandbox") {
      const account = await stripe.accounts.create({
        type: "express",
        email: recipient.email,
        business_type: "individual",
        business_profile: { name: recipient.name },
        capabilities: { transfers: { requested: true } },
        metadata: {
          wersee_recipient_user: user.id,
          wersee_payout_recipient: recipient.id,
        },
      });
      accountId = account.id;
    }

    await admin.from("payout_recipients").update({
      recipient_user_id: user.id,
      stripe_connected_account_id: accountId,
      onboarding_status: "onboarding",
      claimed_at: recipient.claimed_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", recipient.id);

    const origin = safeAppOrigin(input.returnOrigin);
    const returnPath = `/payout/setup/${encodeURIComponent(rawToken)}`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      collection_options: { fields: "eventually_due" },
      refresh_url: `${origin}${returnPath}?stripe=refresh`,
      return_url: `${origin}${returnPath}?stripe=return`,
    });

    return json({ ready: false, onboardingUrl: accountLink.url });
  } catch (error) {
    if (error instanceof Response) return json({ error: await error.text() }, error.status);
    const stripeError = error as Stripe.errors.StripeError;
    console.error("payout-recipient-onboarding", error);
    return json({
      error: stripeError?.message || (error instanceof Error ? error.message : "Invitation failed"),
      code: stripeError?.code || "PAYOUT_INVITATION_ERROR",
    }, stripeError?.statusCode || 500);
  }
});
