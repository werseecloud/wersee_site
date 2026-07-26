import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  getPayoutEligibility,
  normalizePayoutCurrency,
  parsePayoutAmountMinor,
  summarizeStripeBalance,
} from "./payoutBalance.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const supabaseUrl = requiredEnv("SUPABASE_URL");
const anonKey = requiredEnv("SUPABASE_ANON_KEY");
const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Input = Record<string, unknown> & { action?: string };

const userClientFor = (request: Request) =>
  createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: request.headers.get("Authorization") || "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

async function requireUser(request: Request) {
  const client = userClientFor(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Response("Authentication required", { status: 401 });
  return data.user;
}

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

const orderAmountMinor = (order: Record<string, unknown>) =>
  Math.max(
    0,
    Math.round(
      Number(order.total_amount ?? order.amount ?? order.net_amount ?? 0) * 100,
    ),
  );

async function getStripeAccount(userId: string) {
  const [{ data: profile }, { data: payoutProfile }] = await Promise.all([
    admin
      .from("profiles")
      .select("stripe_account_id,stripe_onboarding_complete")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("seller_payout_profiles")
      .select("stripe_account_id,payouts_enabled,charges_enabled,details_submitted,requirements_due")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const accountId = payoutProfile?.stripe_account_id || profile?.stripe_account_id || null;
  if (!accountId || accountId === "sandbox") {
    return {
      accountId: null,
      connected: false,
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: false,
      requirementsDue: [],
    };
  }

  const account = await stripe.accounts.retrieve(accountId);
  if (account.deleted) {
    return {
      accountId: null,
      connected: false,
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: false,
      requirementsDue: [],
    };
  }

  const snapshot = {
    accountId,
    connected: true,
    payoutsEnabled: Boolean(account.payouts_enabled),
    chargesEnabled: Boolean(account.charges_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    requirementsDue: account.requirements?.currently_due || [],
  };

  await admin.from("seller_payout_profiles").upsert(
    {
      user_id: userId,
      stripe_account_id: accountId,
      kyc_status: snapshot.detailsSubmitted ? "verified" : "pending",
      payouts_enabled: snapshot.payoutsEnabled,
      charges_enabled: snapshot.chargesEnabled,
      details_submitted: snapshot.detailsSubmitted,
      requirements_due: snapshot.requirementsDue,
      default_currency: account.default_currency || "eur",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return snapshot;
}

async function reconcileRecentOrders(userId: string, accountId: string) {
  const { data: orders, error } = await admin
    .from("orders")
    .select("id,created_at,amount,total_amount,net_amount,currency,status,payment_status,stripe_payment_intent_id,listings(title)")
    .eq("seller_id", userId)
    .not("stripe_payment_intent_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;

  const approved: Record<string, unknown>[] = [];
  for (const order of orders || []) {
    const paymentIntentId = String(order.stripe_payment_intent_id || "");
    let status: "matched" | "rejected" | "pending" = "pending";
    let reasonCode: string | null = null;
    let stripeAmountMinor: number | null = null;
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        stripeAccount: accountId,
      });
      stripeAmountMinor = intent.amount_received || intent.amount;
      const supabaseAmountMinor = orderAmountMinor(order);
      const currencyMatches =
        String(intent.currency).toLowerCase() === String(order.currency || "eur").toLowerCase();
      const amountMatches = stripeAmountMinor === supabaseAmountMinor;
      const succeeded = intent.status === "succeeded";
      status = succeeded && amountMatches && currencyMatches ? "matched" : succeeded ? "rejected" : "pending";
      reasonCode = !succeeded
        ? `stripe_${intent.status}`
        : !amountMatches
          ? "amount_mismatch"
          : !currencyMatches
            ? "currency_mismatch"
            : null;

      await admin.from("finance_reconciliations").upsert({
        order_id: order.id,
        seller_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        stripe_account_id: accountId,
        supabase_amount_minor: supabaseAmountMinor,
        stripe_amount_minor: stripeAmountMinor,
        currency: String(order.currency || intent.currency || "eur").toLowerCase(),
        status,
        reason_code: reasonCode,
        checked_at: new Date().toISOString(),
      });

      if (status === "matched") {
        await admin.rpc("award_reconciled_sale_points", { p_order_id: order.id });
        approved.push({
          ...order,
          verified: true,
          stripe_status: intent.status,
          stripe_amount_minor: stripeAmountMinor,
        });
      }
    } catch (error) {
      await admin.from("finance_reconciliations").upsert({
        order_id: order.id,
        seller_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        stripe_account_id: accountId,
        supabase_amount_minor: orderAmountMinor(order),
        stripe_amount_minor: stripeAmountMinor,
        currency: String(order.currency || "eur").toLowerCase(),
        status: "pending",
        reason_code: error instanceof Error ? "stripe_lookup_failed" : "unknown",
        checked_at: new Date().toISOString(),
      });
    }
  }
  return approved.slice(0, 10);
}

async function financeOverview(request: Request) {
  const user = await requireUser(request);
  const account = await getStripeAccount(user.id);
  const { data: preference } = await admin
    .from("finance_preferences")
    .select("settlement_mode,wizard_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account.accountId) {
    return {
      account,
      preference,
      balance: { available: [], pending: [] },
      transactions: [],
    };
  }

  const [balance, transactions] = await Promise.all([
    stripe.balance.retrieve({ stripeAccount: account.accountId }),
    reconcileRecentOrders(user.id, account.accountId),
  ]);

  return { account, preference, balance, transactions };
}

async function listPayouts(request: Request) {
  const user = await requireUser(request);
  const account = await getStripeAccount(user.id);
  const [{ data: requests }, stripePayouts] = await Promise.all([
    admin
      .from("finance_payout_requests")
      .select("*, payout_recipients(name,email)")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    account.accountId
      ? stripe.payouts.list({ limit: 100 }, { stripeAccount: account.accountId })
      : Promise.resolve({ data: [] as Stripe.Payout[] }),
  ]);

  return { account, stripePayouts: stripePayouts.data, requests: requests || [] };
}

async function getOwnPayoutCheck(request: Request, input: Input) {
  const user = await requireUser(request);
  const account = await getStripeAccount(user.id);
  if (!account.accountId || !account.payoutsEnabled || !account.detailsSubmitted) {
    return json({
      error: "Complete Stripe Connect before requesting a payout.",
      code: "STRIPE_ONBOARDING_REQUIRED",
    }, 409);
  }

  let amountMinor: number;
  let currency: string;
  try {
    amountMinor = input.amountMinor !== undefined
      ? parsePayoutAmountMinor(input.amountMinor)
      : parsePayoutAmountMinor(String(input.amount ?? ""));
    currency = normalizePayoutCurrency(input.currency);
  } catch {
    return json({ error: "Enter a valid payout amount.", code: "INVALID_AMOUNT" }, 400);
  }
  if (amountMinor < 100) {
    return json({ error: "The minimum payout is 1.00.", code: "INVALID_AMOUNT" }, 400);
  }

  const balance = await stripe.balance.retrieve({ stripeAccount: account.accountId });
  const { availableMinor, pendingMinor } = summarizeStripeBalance(balance, currency);
  const eligibility = getPayoutEligibility(amountMinor, availableMinor);
  return json({
    ...eligibility,
    amountMinor,
    availableMinor,
    pendingMinor,
    currency,
  });
}

async function createOwnPayout(request: Request, input: Input) {
  const user = await requireUser(request);
  const account = await getStripeAccount(user.id);
  if (!account.accountId || !account.payoutsEnabled || !account.detailsSubmitted) {
    return json({ error: "Complete Stripe Connect before requesting a payout.", code: "STRIPE_ONBOARDING_REQUIRED" }, 409);
  }

  let amountMinor: number;
  let currency: string;
  try {
    amountMinor = input.amountMinor !== undefined
      ? parsePayoutAmountMinor(input.amountMinor)
      : parsePayoutAmountMinor(String(input.amount ?? ""));
    currency = normalizePayoutCurrency(input.currency);
  } catch {
    return json({ error: "Enter a valid payout amount.", code: "INVALID_AMOUNT" }, 400);
  }
  if (amountMinor < 100) {
    return json({ error: "The minimum payout is 1.00.", code: "INVALID_AMOUNT" }, 400);
  }

  // This is intentionally repeated after the UI preflight. A connected balance can
  // change between checking and confirming, so only this server-side check is trusted.
  const balance = await stripe.balance.retrieve({ stripeAccount: account.accountId });
  const { availableMinor, pendingMinor } = summarizeStripeBalance(balance, currency);
  const eligibility = getPayoutEligibility(amountMinor, availableMinor);
  if (!eligibility.eligible) {
    return json({
      error: "Your available Stripe balance is lower than this payout.",
      code: "INSUFFICIENT_AVAILABLE_BALANCE",
      ...eligibility,
      amountMinor,
      availableMinor,
      pendingMinor,
      currency,
    }, 409);
  }

  const requestRow = await admin
    .from("finance_payout_requests")
    .insert({
      owner_user_id: user.id,
      payout_kind: "own_bank",
      amount_minor: amountMinor,
      currency,
      status: "processing",
    })
    .select()
    .single();
  if (requestRow.error) throw requestRow.error;

  try {
    const payout = await stripe.payouts.create(
      {
        amount: amountMinor,
        currency,
        metadata: { wersee_payout_request_id: requestRow.data.id, owner_user_id: user.id },
      },
      {
        stripeAccount: account.accountId,
        idempotencyKey: `wersee-own-payout-${requestRow.data.id}`,
      },
    );
    await admin
      .from("finance_payout_requests")
      .update({
        stripe_payout_id: payout.id,
        status: payout.status === "paid" ? "paid" : "in_transit",
        estimated_arrival_at: payout.arrival_date
          ? new Date(payout.arrival_date * 1000).toISOString()
          : null,
        delivered_at: payout.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", requestRow.data.id);
    return json({
      payout,
      balance: { amountMinor, availableMinor, pendingMinor, currency },
    });
  } catch (error) {
    await admin
      .from("finance_payout_requests")
      .update({
        status: "failed",
        failure_code: error instanceof Error ? "stripe_payout_failed" : "unknown",
      })
      .eq("id", requestRow.data.id);
    throw error;
  }
}

async function cashOutPoints(request: Request, input: Input) {
  const user = await requireUser(request);
  const account = await getStripeAccount(user.id);
  if (!account.accountId || !account.payoutsEnabled || !account.detailsSubmitted) {
    return json({
      error: "Connect and complete Stripe onboarding to cash out Points. No additional Wersee KYC is required.",
      code: "STRIPE_ONBOARDING_REQUIRED",
    }, 409);
  }

  const amountPoints = Math.trunc(Number(input.amountPoints));
  if (!Number.isSafeInteger(amountPoints) || amountPoints < 100) {
    return json({ error: "The minimum cashout is 100 Points.", code: "INVALID_AMOUNT" }, 400);
  }
  const { data: wallet, error: walletError } = await admin
    .from("points_wallets")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();
  if (walletError) throw walletError;
  const { data: ledgerRows, error: ledgerReadError } = await admin
    .from("points_ledger")
    .select("amount_points")
    .eq("user_id", user.id)
    .eq("wallet_id", wallet?.id || "")
    .eq("status", "approved");
  if (ledgerReadError) throw ledgerReadError;
  const balancePoints = (ledgerRows || []).reduce((sum, row) => sum + Number(row.amount_points), 0);
  if (!wallet || balancePoints < amountPoints) {
    return json({ error: "Insufficient Wersee Points.", code: "INSUFFICIENT_POINTS" }, 409);
  }

  const requestRow = await admin
    .from("finance_payout_requests")
    .insert({
      owner_user_id: user.id,
      payout_kind: "points_cashout",
      amount_minor: amountPoints,
      currency: "eur",
      status: "processing",
    })
    .select()
    .single();
  if (requestRow.error) throw requestRow.error;

  try {
    const payout = await stripe.payouts.create(
      {
        amount: amountPoints,
        currency: "eur",
        metadata: { wersee_payout_request_id: requestRow.data.id, points_cashout: "true" },
      },
      {
        stripeAccount: account.accountId,
        idempotencyKey: `wersee-points-cashout-${requestRow.data.id}`,
      },
    );

    const ledger = await admin.from("points_ledger").insert({
      user_id: user.id,
      wallet_id: wallet.id,
      amount_points: -amountPoints,
      entry_type: "cashout",
      status: "approved",
      idempotency_key: `points:cashout:${requestRow.data.id}`,
      description: "Cash out through Stripe",
      metadata: { stripe_payout_id: payout.id },
    });
    if (ledger.error && ledger.error.code !== "23505") throw ledger.error;
    if (!ledger.error) {
      await admin.from("profiles").update({
        wersee_points: Math.max(0, balancePoints - amountPoints),
      }).eq("id", user.id);
      await admin.from("points_activity").insert({
        user_id: user.id,
        amount: -amountPoints,
        description: "Cash out through Stripe",
      });
    }
    await admin.from("finance_payout_requests").update({
      stripe_payout_id: payout.id,
      status: payout.status === "paid" ? "paid" : "in_transit",
      estimated_arrival_at: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      delivered_at: payout.status === "paid" ? new Date().toISOString() : null,
    }).eq("id", requestRow.data.id);
    return json({ payout });
  } catch (error) {
    await admin.from("finance_payout_requests").update({
      status: "failed",
      failure_code: "points_cashout_failed",
    }).eq("id", requestRow.data.id);
    throw error;
  }
}

async function prepareOtherRecipient(request: Request, input: Input) {
  const user = await requireUser(request);
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const amountMinor = Math.round(Number(input.amount) * 100);
  const accepted = input.responsibilityAccepted === true;
  if (name.length < 2 || !email.includes("@") || !Number.isSafeInteger(amountMinor) || amountMinor < 100) {
    return json({ error: "Enter a valid recipient, email, and amount.", code: "INVALID_RECIPIENT" }, 400);
  }
  if (!accepted) {
    return json({ error: "Responsibility acknowledgement is required.", code: "ACKNOWLEDGEMENT_REQUIRED" }, 400);
  }

  const existing = await admin
    .from("payout_recipients")
    .select("*")
    .eq("owner_user_id", user.id)
    .eq("email", email)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const lookup = await admin.rpc("lookup_payout_recipient_account", { p_email: email });
  if (lookup.error) throw lookup.error;
  const matchedUser = Array.isArray(lookup.data) ? lookup.data[0] : lookup.data;
  let connectedAccountId =
    (existing.data?.stripe_connected_account_id as string | undefined)
    || (matchedUser?.stripe_account_id as string | undefined);
  let recipientReady = false;

  if (connectedAccountId && connectedAccountId !== "sandbox") {
    const account = await stripe.accounts.retrieve(connectedAccountId);
    recipientReady = !account.deleted
      && account.details_submitted === true
      && account.capabilities?.transfers === "active";
    if (account.deleted) connectedAccountId = undefined;
  }

  const rawInviteToken = recipientReady ? null : `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const inviteTokenHash = rawInviteToken ? await sha256Hex(rawInviteToken) : null;
  const inviteExpiresAt = rawInviteToken
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const recipient = await admin
    .from("payout_recipients")
    .upsert({
      owner_user_id: user.id,
      name,
      email,
      recipient_user_id: matchedUser?.recipient_user_id || existing.data?.recipient_user_id || null,
      stripe_connected_account_id: connectedAccountId || null,
      onboarding_status: recipientReady ? "ready" : "invited",
      invite_token_hash: inviteTokenHash,
      invite_expires_at: inviteExpiresAt,
      claimed_at: recipientReady ? new Date().toISOString() : existing.data?.claimed_at || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "owner_user_id,email" })
    .select()
    .single();
  if (recipient.error) throw recipient.error;

  const payoutRequest = await admin
    .from("finance_payout_requests")
    .insert({
      owner_user_id: user.id,
      recipient_id: recipient.data.id,
      payout_kind: "other_recipient",
      amount_minor: amountMinor,
      currency: String(input.currency || "eur").toLowerCase(),
      status: recipientReady ? "pending" : "recipient_onboarding",
      responsibility_accepted_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (payoutRequest.error) throw payoutRequest.error;

  const origin = safeAppOrigin(input.returnOrigin);
  const inviteUrl = rawInviteToken
    ? `${origin}/payout/setup/${encodeURIComponent(rawInviteToken)}`
    : null;

  return json({
    requestId: payoutRequest.data.id,
    recipientReady,
    recipientAccountFound: Boolean(matchedUser?.recipient_user_id),
    inviteUrl,
    inviteExpiresAt,
    message: recipientReady
      ? "The recipient already has a Stripe-verified Wersee account."
      : "Send the Wersee invitation link to the recipient. They enter payout details themselves.",
  });
}

async function updatePayoutSchedule(request: Request, input: Input) {
  const user = await requireUser(request);
  const account = await getStripeAccount(user.id);
  if (!account.accountId || !account.detailsSubmitted) {
    return json({ error: "Complete Stripe Connect before changing the payout schedule.", code: "STRIPE_ONBOARDING_REQUIRED" }, 409);
  }
  const interval = String(input.interval || "");
  if (!["daily", "weekly", "monthly"].includes(interval)) {
    return json({ error: "Invalid payout interval" }, 400);
  }
  const schedule: Record<string, unknown> = { interval };
  if (interval === "weekly") schedule.weekly_payout_days = ["monday"];
  if (interval === "monthly") schedule.monthly_payout_days = [1];
  await (stripe as any).balanceSettings.update({
    payments: { payouts: { schedule } },
  }, { stripeAccount: account.accountId });
  await admin.from("profiles").update({
    payout_schedule: interval,
    payout_schedule_configured: true,
  }).eq("id", user.id);
  return json({ success: true, interval });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const input = await request.json() as Input;
    switch (input.action) {
      case "overview":
        return json(await financeOverview(request));
      case "list-payouts":
        return json(await listPayouts(request));
      case "check-own-payout":
        return await getOwnPayoutCheck(request, input);
      case "create-own-payout":
        return await createOwnPayout(request, input);
      case "cashout-points":
        return await cashOutPoints(request, input);
      case "prepare-other-recipient":
        return await prepareOtherRecipient(request, input);
      case "update-payout-schedule":
        return await updatePayoutSchedule(request, input);
      default:
        return json({ error: "Unknown finance action" }, 400);
    }
  } catch (error) {
    if (error instanceof Response) return json({ error: await error.text() }, error.status);
    console.error("finance-api", error);
    const stripeError = error as Stripe.errors.StripeError;
    const insufficientBalance = stripeError?.code === "balance_insufficient"
      || stripeError?.code === "insufficient_funds";
    return json({
      error: insufficientBalance
        ? "Your available Stripe balance is lower than this payout."
        : "The finance request could not be completed. Please try again.",
      code: insufficientBalance ? "INSUFFICIENT_AVAILABLE_BALANCE" : "FINANCE_ERROR",
    }, insufficientBalance ? 409 : (stripeError?.statusCode || 500));
  }
});
