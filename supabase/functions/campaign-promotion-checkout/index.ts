import { createClient } from "npm:@supabase/supabase-js@2.110.3";
import Stripe from "npm:stripe@20.0.0";

const allowedOrigins = new Set([
  "https://wersee.com",
  "https://www.wersee.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const cors = (request: Request) => {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://wersee.com",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

const json = (request: Request, body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(request), "Content-Type": "application/json; charset=utf-8" },
  });

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(request, { error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || Deno.env.get("VITE_STRIPE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey || !publishableKey) {
    return json(request, { error: "Campaign payments are not configured" }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json(request, { error: "Invalid session" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json(request, { error: "Invalid JSON" }, 400);
  }

  const campaignId = String(payload.campaignId || "");
  const action = payload.action === "status" ? "status" : "create";
  if (!uuidPattern.test(campaignId)) return json(request, { error: "Invalid campaign" }, 400);

  const { data: campaign, error: campaignError } = await admin
    .from("ads_campaigns")
    .select("id,user_id,title,budget_daily,promote_on_wersee,promotion_status,promotion_payment_id")
    .eq("id", campaignId)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (campaignError) return json(request, { error: campaignError.message }, 500);
  if (!campaign) return json(request, { error: "Campaign not found" }, 404);
  if (!campaign.promote_on_wersee) return json(request, { error: "Wersee promotion is not enabled" }, 409);

  const stripe = new Stripe(stripeSecretKey);
  let { data: payment } = await admin
    .from("campaign_promotion_payments")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("user_id", userData.user.id)
    .in("status", ["pending", "processing", "paid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (action === "status") {
    if (!payment?.stripe_payment_intent_id) return json(request, { status: "pending" });
    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    const status = intent.status === "succeeded" ? "paid" : intent.status === "processing" ? "processing" : intent.status;
    await admin.from("campaign_promotion_payments").update({
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
    await admin.from("ads_campaigns").update({
      promotion_status: status === "paid" ? "active" : status,
      promotion_started_at: status === "paid" ? new Date().toISOString() : null,
      status: status === "paid" ? "active" : "paused",
      updated_at: new Date().toISOString(),
    }).eq("id", campaign.id).eq("user_id", userData.user.id);
    return json(request, { status, campaignId: campaign.id });
  }

  if (payment?.status === "paid") return json(request, { status: "paid", campaignId: campaign.id });

  const amountMinor = Math.max(1000, Math.round(Number(campaign.budget_daily || 0) * 7 * 100));
  if (!Number.isFinite(amountMinor) || amountMinor > 1_000_000) {
    return json(request, { error: "Campaign budget is outside the supported range" }, 400);
  }

  if (!payment) {
    const { data: createdPayment, error: insertError } = await admin
      .from("campaign_promotion_payments")
      .insert({
        campaign_id: campaign.id,
        user_id: userData.user.id,
        amount_minor: amountMinor,
        currency: "eur",
        status: "pending",
        idempotency_key: `campaign:${campaign.id}:seven-day-launch:v1`,
      })
      .select("*")
      .single();
    if (insertError) return json(request, { error: insertError.message }, 500);
    payment = createdPayment;
  }

  let intent: Stripe.PaymentIntent;
  if (payment.stripe_payment_intent_id) {
    intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
  } else {
    intent = await stripe.paymentIntents.create({
      amount: payment.amount_minor,
      currency: payment.currency,
      automatic_payment_methods: { enabled: true },
      description: `Wersee promotion: ${String(campaign.title).slice(0, 120)}`,
      metadata: {
        wersee_purpose: "campaign_promotion",
        wersee_campaign_id: campaign.id,
        wersee_payment_id: payment.id,
        wersee_user_id: userData.user.id,
      },
    }, { idempotencyKey: `campaign-promotion-${payment.id}` });
    await admin.from("campaign_promotion_payments").update({
      stripe_payment_intent_id: intent.id,
      status: intent.status === "processing" ? "processing" : "pending",
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
    await admin.from("ads_campaigns").update({
      promotion_payment_id: payment.id,
      promotion_status: "pending_payment",
      status: "paused",
      updated_at: new Date().toISOString(),
    }).eq("id", campaign.id).eq("user_id", userData.user.id);
  }

  if (!intent.client_secret) return json(request, { error: "Stripe did not return a client secret" }, 502);
  return json(request, {
    campaignId: campaign.id,
    status: intent.status,
    clientSecret: intent.client_secret,
    publishableKey,
    amountMinor: payment.amount_minor,
    currency: payment.currency,
  });
});
