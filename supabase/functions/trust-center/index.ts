import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type User } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^20.4.1";
import JSZip from "npm:jszip@^3.10.1";

type Json = Record<string, unknown>;

const allowedOrigins = new Set([
  "https://wersee.com",
  "https://www.wersee.com",
  "https://app.wersee.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const originAllowed = (origin: string) => allowedOrigins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const corsHeaders = (request: Request) => {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": originAllowed(origin) ? origin : "https://wersee.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

const respond = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const supabaseUrl = requiredEnv("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || requiredEnv("SUPABASE_ANON_KEY");
const stripeKey = requiredEnv("STRIPE_SECRET_KEY");
const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-12-15.preview" as any,
  httpClient: Stripe.createFetchHttpClient(),
});

const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const userClient = (request: Request) => createClient(supabaseUrl, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: request.headers.get("Authorization") || "" } },
});

async function optionalUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const { data, error } = await userClient(request).auth.getUser();
  return error ? null : data.user;
}

async function requireUser(request: Request) {
  const user = await optionalUser(request);
  if (!user) throw new HttpError(401, "Sign in to continue", "AUTHENTICATION_REQUIRED");
  return user;
}

class HttpError extends Error {
  constructor(public status: number, message: string, public code: string, public details?: unknown) {
    super(message);
  }
}

const asRecord = (value: unknown): Json => value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const asString = (value: unknown, maximum = 500) => String(value ?? "").trim().slice(0, maximum);
const asBoolean = (value: unknown) => value === true;
const asUuid = (value: unknown, field: string) => {
  const stringValue = asString(value, 64);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stringValue)) {
    throw new HttpError(400, `${field} must be a valid ID`, "INVALID_INPUT");
  }
  return stringValue;
};

const safeReturnUrl = (value: unknown, fallback: string) => {
  const candidate = asString(value, 1000) || fallback;
  try {
    const parsed = new URL(candidate);
    if (!originAllowed(parsed.origin) || parsed.protocol !== "https:" && !parsed.hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
      throw new Error("origin not allowed");
    }
    return candidate;
  } catch {
    throw new HttpError(400, "The checkout return URL is not allowed", "INVALID_RETURN_URL");
  }
};

const hashValue = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const requestFingerprint = async (request: Request) => ({
  ipHash: await hashValue((request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown").split(",")[0].trim()),
  deviceHash: await hashValue(request.headers.get("user-agent") || "unknown"),
});

const digitalTypes = new Set(["digital", "course", "software", "asset_3d", "music", "beat", "template", "virtual", "community"]);
const physicalTypes = new Set(["physical", "pos"]);
const supportedCurrencies = new Set(["EUR", "USD", "GBP", "CHF", "NOK", "SEK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "CAD", "AUD", "NZD", "JPY", "SGD", "HKD"]);

const numberAmount = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const currencyCode = (value: unknown, fallback = "EUR") => {
  const normalized = asString(value, 3).toUpperCase();
  return supportedCurrencies.has(normalized) ? normalized : fallback;
};

async function convertAmount(amount: number, source: string, target: string) {
  if (source === target || amount === 0) return amount;
  try {
    const response = await fetch(`https://api.frankfurter.app/latest?amount=${encodeURIComponent(String(amount))}&from=${source}&to=${target}`, {
      headers: { "User-Agent": "Wersee-Trust-Center/1.0" },
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return amount;
    const payload = await response.json();
    const converted = Number(payload?.rates?.[target]);
    return Number.isFinite(converted) && converted >= 0 ? converted : amount;
  } catch {
    return amount;
  }
}

async function evaluate(actorId: string | null, action: string, context: Json) {
  const { data, error } = await admin.rpc("trust_service_evaluate", {
    actor_id: actorId,
    requested_action: action,
    supplied_context: context,
  });
  if (error) throw new HttpError(400, error.message, "COMPLIANCE_EVALUATION_FAILED");
  return asRecord(data);
}

async function recordConsent(request: Request, input: Json) {
  const user = await optionalUser(request);
  const anonymousId = asString(input.anonymousId, 100);
  if (!user && !anonymousId) throw new HttpError(400, "An anonymous consent ID is required", "ANONYMOUS_ID_REQUIRED");
  const fingerprint = await requestFingerprint(request);
  const eventType = input.eventType === "withdrawn" ? "withdrawn" : "set";
  const categories = asRecord(input.categories);
  const row = {
    user_id: user?.id || null,
    anonymous_id: anonymousId || null,
    consent_version: asString(input.consentVersion, 50) || "2026-07-22-v1",
    region: asString(input.region, 16) || request.headers.get("cf-ipcountry") || null,
    necessary: true,
    preferences: eventType === "withdrawn" ? false : asBoolean(categories.preferences),
    analytics: eventType === "withdrawn" ? false : asBoolean(categories.analytics),
    marketing: eventType === "withdrawn" ? false : asBoolean(categories.marketing),
    personalization: eventType === "withdrawn" ? false : asBoolean(categories.personalization),
    privacy_signal: asString(input.privacySignal, 80) || null,
    source: ["account_settings", "footer", "browser_signal"].includes(asString(input.source, 30)) ? asString(input.source, 30) : "consent_sheet",
    event_type: eventType,
    ip_hash: fingerprint.ipHash,
    device_hash: fingerprint.deviceHash,
    country_code: request.headers.get("cf-ipcountry") || null,
    created_by: user?.id || null,
  };
  const { data, error } = await admin.from("consent_records").insert(row).select("id,created_at").single();
  if (error) throw new HttpError(400, error.message, "CONSENT_SAVE_FAILED");
  return { consent: data };
}

async function createCheckout(request: Request, input: Json) {
  const user = await optionalUser(request);
  const listingId = asUuid(input.listingId, "listingId");
  const anonymousId = user ? "" : asString(input.anonymousId, 100);
  if (!user && !anonymousId) throw new HttpError(400, "An anonymous checkout ID is required", "ANONYMOUS_ID_REQUIRED");
  const email = asString(input.customerEmail || user?.email, 320).toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email address", "EMAIL_REQUIRED");

  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("*, product_offers(*)")
    .eq("id", listingId)
    .maybeSingle();
  if (listingError || !listing || !["active", "published"].includes(String(listing.status))) {
    throw new HttpError(404, "This item is not available", "LISTING_UNAVAILABLE");
  }

  const listingType = asString(listing.type, 60).toLowerCase();
  const isDigital = digitalTypes.has(listingType);
  const isPhysical = physicalTypes.has(listingType);
  const immediateDeliveryRequested = asBoolean(input.immediateDeliveryRequested);
  const withdrawalEffectAcknowledged = asBoolean(input.withdrawalEffectAcknowledged);
  const buyerCountry = asString(input.countryCode || request.headers.get("cf-ipcountry"), 2).toUpperCase();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  const decision = await evaluate(user?.id || null, "checkout", {
    listing_id: listingId,
    country_code: buyerCountry,
    immediate_delivery_requested: immediateDeliveryRequested,
    withdrawal_effect_acknowledged: withdrawalEffectAcknowledged,
    request_id: requestId,
  });
  if (decision.allowed !== true) {
    throw new HttpError(409, "Checkout requirements are incomplete", "COMPLIANCE_BLOCKED", decision);
  }

  let title = asString(listing.title, 180) || "Wersee product";
  let baseAmount = numberAmount(listing.price);
  let baseCurrency = currencyCode(listing.currency || listing.base_currency, "EUR");
  let billingInterval = asString(listing.billing_interval || listing.metadata?.subscription_interval, 20).toLowerCase();
  let offerReference: string | null = null;
  let referencePrice = numberAmount(listing.original_price || listing.price);

  const plans = Array.isArray(listing.plans) ? listing.plans : Array.isArray(listing.metadata?.plans) ? listing.metadata.plans : [];
  if (input.planIndex !== undefined && input.planIndex !== null) {
    const planIndex = Number(input.planIndex);
    if (!Number.isInteger(planIndex) || planIndex < 0 || !plans[planIndex]) throw new HttpError(400, "The selected plan is unavailable", "PLAN_UNAVAILABLE");
    const plan = plans[planIndex];
    baseAmount = numberAmount(plan.price);
    baseCurrency = currencyCode(plan.currency, baseCurrency);
    billingInterval = asString(plan.billing_interval || plan.interval, 20).toLowerCase() || billingInterval;
    title = `${title} - ${asString(plan.name, 80)}`;
  }

  if (listingType === "asset_3d") {
    const licenseId = asUuid(input.licenseId, "licenseId");
    const { data: license, error } = await admin
      .from("product_3d_licenses")
      .select("*, product_3d_license_prices(*)")
      .eq("id", licenseId)
      .eq("listing_id", listingId)
      .eq("active", true)
      .maybeSingle();
    if (error || !license) throw new HttpError(400, "The selected license is unavailable", "LICENSE_UNAVAILABLE");
    const licensePrice = license.product_3d_license_prices?.[0];
    baseAmount = numberAmount(licensePrice?.sale_price_minor ?? licensePrice?.price_minor) / 100;
    baseCurrency = currencyCode(licensePrice?.currency, baseCurrency);
    title = `${title} - ${asString(license.name, 80)}`;
  } else {
    const now = Date.now();
    const requestedOfferId = asString(input.offerId, 64);
    const activeOffers = (Array.isArray(listing.product_offers) ? listing.product_offers : []).filter((offer: any) => {
      const withinSchedule = new Date(offer.starts_at).getTime() <= now && new Date(offer.ends_at).getTime() > now;
      const withinLimit = !offer.max_redemptions || Number(offer.redemption_count) < Number(offer.max_redemptions);
      return offer.is_active && withinSchedule && withinLimit;
    });
    const offer = requestedOfferId ? activeOffers.find((item: any) => item.id === requestedOfferId) : activeOffers[0];
    if (requestedOfferId && !offer) throw new HttpError(409, "This offer has ended", "OFFER_UNAVAILABLE");
    if (offer) {
      referencePrice = baseAmount;
      baseAmount = numberAmount(offer.sale_price, baseAmount);
      offerReference = offer.id;
    } else if (listing.sale_price !== null && listing.sale_price !== undefined) {
      referencePrice = numberAmount(listing.original_price, baseAmount);
      baseAmount = numberAmount(listing.sale_price, baseAmount);
    }
  }

  if (baseAmount < 0 || !Number.isFinite(baseAmount)) throw new HttpError(400, "The server could not validate the price", "INVALID_PRICE");

  const preferredCurrency = currencyCode(input.preferredCurrency, baseCurrency);
  const convertedAmount = await convertAmount(baseAmount, baseCurrency, preferredCurrency);
  const checkoutCurrency = convertedAmount === baseAmount && preferredCurrency !== baseCurrency ? baseCurrency : preferredCurrency;
  const priceMinor = Math.round((checkoutCurrency === baseCurrency ? baseAmount : convertedAmount) * 100);
  const shippingMinor = isPhysical ? Math.round(numberAmount(listing.metadata?.shipping_fee) * 100) : 0;
  const subtotalMinor = priceMinor + shippingMinor;
  const fingerprint = await requestFingerprint(request);

  const { data: dsaSeller } = await admin
    .from("dsa_seller_verifications")
    .select("trader_status,country_code,status")
    .eq("seller_id", listing.seller_id)
    .maybeSingle();
  const sellerCapacity = dsaSeller?.trader_status === "business" ? "business seller" : "private seller";
  const sellerCountry = asString(dsaSeller?.country_code, 2).toUpperCase() || null;
  const consentWording = "I request immediate access to this digital content. I understand that once delivery begins, my statutory withdrawal right may be affected or lost where applicable.";
  const checkoutCopy = {
    orderButton: baseAmount === 0 ? "Get access" : billingInterval ? "Subscribe and pay" : "Pay now",
    sellerDisclosure: `Sold by a ${sellerCapacity}.`,
    paymentProvider: "Stripe processes this payment. Wersee is not a bank or escrow provider.",
    digitalConsent: isDigital ? consentWording : null,
    taxes: "Applicable tax is calculated from the delivery or billing address and shown by Stripe before the final payment confirmation.",
  };
  const policyVersions = { buyerTerms: decision.policyVersion, privacy: "2026-07-22-privacy", cookies: "2026-07-22-cookies" };
  const actorReference = user?.id || anonymousId;
  const idempotencyKey = asString(input.idempotencyKey, 160) || await hashValue([
    "checkout", actorReference, listingId, input.planIndex ?? "", input.licenseId ?? "", offerReference ?? "", Math.floor(Date.now() / 600000),
  ].join(":"));

  const { data: existingSnapshot } = await admin.from("checkout_snapshots")
    .select("id,status,provider_session_id,order_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingSnapshot?.provider_session_id) {
    const session = await stripe.checkout.sessions.retrieve(existingSnapshot.provider_session_id);
    if (session.status === "open" && session.client_secret) {
      return { clientSecret: session.client_secret, snapshotId: existingSnapshot.id, decision, reused: true };
    }
  }

  const { data: snapshot, error: snapshotError } = await admin.from("checkout_snapshots").insert({
    user_id: user?.id || null,
    anonymous_id: anonymousId || null,
    listing_id: listingId,
    seller_id: listing.seller_id,
    buyer_country: buyerCountry || null,
    seller_country: sellerCountry,
    seller_capacity: sellerCapacity,
    product_type: listingType,
    price_minor: priceMinor,
    tax_minor: 0,
    fee_minor: 0,
    shipping_minor: shippingMinor,
    total_minor: subtotalMinor,
    currency: checkoutCurrency.toLowerCase(),
    billing_frequency: billingInterval || null,
    offer_reference: offerReference,
    reference_price_minor: Math.round(referencePrice * 100),
    checkout_copy: checkoutCopy,
    policy_versions: policyVersions,
    idempotency_key: idempotencyKey,
    created_by: user?.id || null,
  }).select().single();
  if (snapshotError) throw new HttpError(400, snapshotError.message, "CHECKOUT_SNAPSHOT_FAILED");

  if (isDigital) {
    const { error } = await admin.from("digital_delivery_consents").insert({
      checkout_snapshot_id: snapshot.id,
      user_id: user?.id || null,
      anonymous_id: anonymousId || null,
      listing_id: listingId,
      immediate_delivery_requested: immediateDeliveryRequested,
      withdrawal_effect_acknowledged: withdrawalEffectAcknowledged,
      exact_wording: consentWording,
      policy_version: String(decision.policyVersion || "trust-core-2026-07-22"),
      ip_hash: fingerprint.ipHash,
      device_hash: fingerprint.deviceHash,
      created_by: user?.id || null,
    });
    if (error) throw new HttpError(400, error.message, "DIGITAL_CONSENT_FAILED");
  }

  if (subtotalMinor === 0) {
    if (!user) throw new HttpError(401, "Sign in to add free content to your library", "AUTHENTICATION_REQUIRED");
    const { data: order, error } = await admin.from("orders").insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listingId,
      amount: 0,
      currency: checkoutCurrency.toLowerCase(),
      status: "completed",
      net_amount: 0,
      metadata: { trust_snapshot_id: snapshot.id, offer_id: offerReference },
    }).select("id").single();
    if (error) throw new HttpError(400, error.message, "FREE_ORDER_FAILED");
    await admin.from("checkout_snapshots").update({ order_id: order.id, status: "completed" }).eq("id", snapshot.id);
    return { free: true, orderId: order.id, snapshotId: snapshot.id, decision };
  }

  const { data: sellerProfile, error: sellerError } = await admin.from("profiles")
    .select("stripe_account_id")
    .eq("id", listing.seller_id)
    .maybeSingle();
  if (sellerError || !sellerProfile?.stripe_account_id) throw new HttpError(409, "This seller cannot accept payments yet", "SELLER_PAYMENTS_DISABLED");
  const stripeAccount = await stripe.accounts.retrieve(sellerProfile.stripe_account_id);
  if (("deleted" in stripeAccount && stripeAccount.deleted) || !("charges_enabled" in stripeAccount) || !stripeAccount.charges_enabled || stripeAccount.requirements?.disabled_reason || (stripeAccount.requirements?.currently_due?.length || 0) > 0) {
    throw new HttpError(409, "This seller cannot accept payments until Stripe verification is complete", "STRIPE_ONBOARDING_INCOMPLETE");
  }

  const intervalMap: Record<string, Stripe.Price.Recurring.Interval> = {
    day: "day", daily: "day", week: "week", weekly: "week", month: "month", monthly: "month", year: "year", yearly: "year", annual: "year",
  };
  const recurringInterval = intervalMap[billingInterval] || null;
  const mode: Stripe.Checkout.SessionCreateParams.Mode = recurringInterval ? "subscription" : "payment";
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
    quantity: 1,
    price_data: {
      currency: checkoutCurrency.toLowerCase(),
      unit_amount: priceMinor,
      product_data: {
        name: title,
        description: asString(listing.description, 255) || undefined,
        images: Array.isArray(listing.images) ? listing.images.slice(0, 1) : undefined,
      },
      ...(recurringInterval ? { recurring: { interval: recurringInterval } } : {}),
    },
  }];
  if (shippingMinor > 0) {
    lineItems.push({ quantity: 1, price_data: { currency: checkoutCurrency.toLowerCase(), unit_amount: shippingMinor, product_data: { name: "Shipping" } } });
  }

  const successUrl = `https://wersee.com/payment-success?order_id={CHECKOUT_SESSION_ID}&listingId=${listingId}`;
  const commonMetadata: Record<string, string> = {
    wersee_kind: "listing_checkout",
    listing_id: listingId,
    seller_id: listing.seller_id,
    buyer_id: user?.id || "",
    trust_snapshot_id: snapshot.id,
    offer_id: offerReference || "",
  };
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    ui_mode: "embedded",
    mode,
    return_url: safeReturnUrl(input.successUrl, successUrl),
    customer_email: email,
    line_items: lineItems,
    billing_address_collection: "required",
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    metadata: commonMetadata,
    ...(isPhysical ? { shipping_address_collection: { allowed_countries: ["NL", "BE", "DE", "FR", "LU", "AT", "ES", "IT", "PT", "IE", "DK", "SE", "FI", "PL", "CZ"] as any } } : {}),
    ...(mode === "payment" ? {
      payment_intent_data: {
        application_fee_amount: Math.round(priceMinor * 0.05),
        transfer_data: { destination: sellerProfile.stripe_account_id },
        metadata: commonMetadata,
      },
    } : {
      subscription_data: {
        application_fee_percent: 5,
        transfer_data: { destination: sellerProfile.stripe_account_id },
        metadata: commonMetadata,
      },
    }),
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey: `wersee-trust:${idempotencyKey}` });
  } catch (error) {
    await admin.from("checkout_snapshots").update({ status: "cancelled" }).eq("id", snapshot.id);
    throw error;
  }

  const { data: order, error: orderError } = await admin.from("orders").insert({
    buyer_id: user?.id || null,
    seller_id: listing.seller_id,
    listing_id: listingId,
    amount: subtotalMinor / 100,
    currency: checkoutCurrency.toLowerCase(),
    status: "pending",
    stripe_payment_intent_id: session.id,
    buyer_country: buyerCountry || null,
    wersee_fee: priceMinor * 0.05 / 100,
    net_amount: priceMinor * 0.95 / 100,
    metadata: { trust_snapshot_id: snapshot.id, offer_id: offerReference, digital_consent: isDigital },
  }).select("id").single();
  if (orderError) {
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
    await admin.from("checkout_snapshots").update({ status: "cancelled" }).eq("id", snapshot.id);
    throw new HttpError(400, orderError.message, "ORDER_CREATE_FAILED");
  }

  await admin.from("checkout_snapshots").update({
    order_id: order.id,
    provider_session_id: session.id,
    status: "session_created",
  }).eq("id", snapshot.id);

  return { clientSecret: session.client_secret, orderId: order.id, snapshotId: snapshot.id, decision };
}

async function createPrivacyRequest(request: Request, input: Json) {
  const user = await requireUser(request);
  const requestType = asString(input.requestType, 40);
  const allowedTypes = new Set(["access", "correction", "export", "deletion", "object", "restrict", "withdraw_consent", "automated_decision_review"]);
  if (!allowedTypes.has(requestType)) throw new HttpError(400, "Choose a valid privacy request type", "INVALID_REQUEST_TYPE");
  const decision = await evaluate(user.id, requestType === "deletion" ? "account_delete" : "data_export", { request_id: request.headers.get("x-request-id") || crypto.randomUUID() });
  if (decision.allowed !== true) throw new HttpError(409, "This request needs another step", "COMPLIANCE_BLOCKED", decision);
  const { data, error } = await admin.from("privacy_requests").insert({
    user_id: user.id,
    request_type: requestType,
    jurisdiction: asString(input.countryCode, 2).toUpperCase() || null,
    policy_version: decision.policyVersion,
    created_by: user.id,
  }).select().single();
  if (error) throw new HttpError(400, error.message, "PRIVACY_REQUEST_FAILED");
  return { request: data, decision };
}

async function requestExport(request: Request, input: Json) {
  const user = await requireUser(request);
  const decision = await evaluate(user.id, "data_export", { request_id: request.headers.get("x-request-id") || crypto.randomUUID() });
  if (decision.allowed !== true) throw new HttpError(409, "Export requirements are incomplete", "COMPLIANCE_BLOCKED", decision);
  const exportType = ["full", "files", "marketplace", "developer", "configuration"].includes(asString(input.exportType, 30)) ? asString(input.exportType, 30) : "full";
  const dayKey = new Date().toISOString().slice(0, 10);
  const idempotencyKey = `data-export:${user.id}:${exportType}:${dayKey}`;
  const { data: existing } = await admin.from("data_exports").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existing && ["queued", "running", "ready"].includes(existing.status)) return { export: existing, decision, reused: true };

  const { data: privacyRequest, error: privacyError } = await admin.from("privacy_requests").insert({
    user_id: user.id,
    request_type: "export",
    policy_version: decision.policyVersion,
    created_by: user.id,
  }).select().single();
  if (privacyError) throw new HttpError(400, privacyError.message, "EXPORT_REQUEST_FAILED");
  const { data: exportJob, error } = await admin.from("data_exports").insert({
    privacy_request_id: privacyRequest.id,
    user_id: user.id,
    export_type: exportType,
    format: "zip",
    idempotency_key: idempotencyKey,
    created_by: user.id,
  }).select().single();
  if (error) throw new HttpError(400, error.message, "EXPORT_REQUEST_FAILED");

  EdgeRuntime.waitUntil(generateExport(exportJob.id, user.id, exportType));
  return { export: exportJob, decision };
}

async function queryRows(table: string, columns: string, userColumn: string, userId: string) {
  const { data, error } = await admin.from(table).select(columns).eq(userColumn, userId).limit(10000);
  if (error) return { unavailable: true, reason: error.code || "query_failed" };
  return data || [];
}

async function generateExport(exportId: string, userId: string, exportType: string) {
  try {
    await admin.from("data_exports").update({ status: "running", progress: 5, attempts: 1 }).eq("id", exportId);
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const [profile, consents, privacyRequests, integrations, files, listings, buyerOrders, sellerOrders, subscriptions, reports, appeals, aiReviews, auditEvents] = await Promise.all([
      admin.from("profiles").select("id,username,full_name,first_name,last_name,country,phone_number,account_type,company_name,website,bio,created_at,theme,email_notifications,push_notifications,is_public,is_indexable").eq("id", userId).maybeSingle(),
      queryRows("consent_records", "id,consent_version,region,necessary,preferences,analytics,marketing,personalization,privacy_signal,source,event_type,country_code,created_at", "user_id", userId),
      queryRows("privacy_requests", "id,case_id,request_type,status,identity_verification_status,submitted_at,due_at,exception_reason,completion_summary,completed_at,jurisdiction,policy_version,created_at,updated_at", "user_id", userId),
      queryRows("user_integrations", "id,provider,provider_user_id,scopes,status,connected_at,last_used_at", "user_id", userId),
      queryRows("files", "id,name,size,mime_type,created_at,updated_at", "user_id", userId),
      queryRows("listings", "id,title,description,price,type,category,status,created_at,currency,pricing_type,billing_interval", "seller_id", userId),
      queryRows("orders", "id,seller_id,listing_id,amount,currency,status,created_at,updated_at,refund_status,dispute_status", "buyer_id", userId),
      queryRows("orders", "id,buyer_id,listing_id,amount,currency,status,created_at,updated_at,refund_status,dispute_status", "seller_id", userId),
      queryRows("user_subscriptions", "id,subscription_id,status,current_period_end,cancel_at_period_end,created_at,updated_at", "user_id", userId),
      queryRows("content_reports", "id,case_id,content_type,content_id,category,explanation,status,created_at,updated_at", "reporter_id", userId),
      queryRows("appeals", "id,case_id,appeal_type,explanation,status,decision_reason,decided_at,created_at,updated_at", "appellant_id", userId),
      queryRows("ai_decision_reviews", "id,decision_type,target_type,target_id,decision_summary,challenge_reason,status,review_outcome,created_at,updated_at", "user_id", userId),
      queryRows("compliance_audit_events", "id,action,target_type,target_id,reason,source,model_version,created_at", "actor_id", userId),
    ]);
    await admin.from("data_exports").update({ progress: 45 }).eq("id", exportId);

    const datasets: Record<string, unknown> = {
      "account/account.json": {
        id: authUser?.user?.id,
        email: authUser?.user?.email,
        phone: authUser?.user?.phone,
        created_at: authUser?.user?.created_at,
        last_sign_in_at: authUser?.user?.last_sign_in_at,
      },
      "account/profile.json": profile.data || {},
      "privacy/consents.json": consents,
      "privacy/requests.json": privacyRequests,
      "integrations/connections.json": integrations,
      "files/metadata.json": files,
      "marketplace/listings.json": listings,
      "marketplace/purchases.json": buyerOrders,
      "marketplace/sales.json": sellerOrders,
      "billing/subscriptions.json": subscriptions,
      "trust/reports.json": reports,
      "trust/appeals.json": appeals,
      "trust/automated-decision-reviews.json": aiReviews,
      "trust/audit-events.json": auditEvents,
    };
    const selected = exportType === "full" ? datasets : Object.fromEntries(Object.entries(datasets).filter(([path]) => {
      if (exportType === "files") return path.startsWith("files/");
      if (exportType === "marketplace") return path.startsWith("marketplace/") || path.startsWith("billing/");
      if (exportType === "developer") return path.startsWith("integrations/");
      if (exportType === "configuration") return path.startsWith("account/") || path.startsWith("privacy/") || path.startsWith("integrations/");
      return true;
    }));
    const manifest = {
      format: "Wersee Portable Export",
      version: "1.0",
      generatedAt: new Date().toISOString(),
      exportId,
      exportType,
      encoding: "UTF-8 JSON",
      datasets: Object.keys(selected).map((path) => ({ path, mediaType: "application/json" })),
      excluded: ["password hashes", "authentication tokens", "API secrets", "provider secret keys", "internal anti-fraud signals"],
    };
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("README.txt", "This machine-readable export uses UTF-8 JSON files. The manifest lists every included dataset. Contact privacy@wersee.com for help.");
    for (const [path, value] of Object.entries(selected)) zip.file(path, JSON.stringify(value, null, 2));
    const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
    await admin.from("data_exports").update({ progress: 80 }).eq("id", exportId);
    const objectPath = `${userId}/${exportId}/wersee-export-${new Date().toISOString().slice(0, 10)}.zip`;
    const upload = await admin.storage.from("trust-exports").upload(objectPath, archive, { contentType: "application/zip", upsert: false });
    if (upload.error) throw upload.error;
    await admin.from("data_exports").update({
      status: "ready",
      progress: 100,
      object_path: objectPath,
      package_manifest: manifest,
      file_size: archive.byteLength,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    }).eq("id", exportId);
    await admin.from("privacy_requests").update({ status: "completed", completion_summary: "Portable export package generated", completed_at: new Date().toISOString() }).eq("id", (await admin.from("data_exports").select("privacy_request_id").eq("id", exportId).single()).data?.privacy_request_id);
    await admin.from("notifications").insert({ user_id: userId, type: "privacy_export_ready", category: "legal", title: "Your privacy export is ready", message: "Download it from Privacy & Data within seven days.", read: false, data: { exportId, url: "/workspace/settings/privacy" } });
  } catch (error) {
    await admin.from("data_exports").update({ status: "failed", last_error: error instanceof Error ? error.message.slice(0, 500) : "Export generation failed" }).eq("id", exportId);
  }
}

async function downloadExport(request: Request, input: Json) {
  const user = await requireUser(request);
  const exportId = asUuid(input.exportId, "exportId");
  const { data: exportJob, error } = await admin.from("data_exports").select("id,user_id,status,object_path,expires_at").eq("id", exportId).maybeSingle();
  if (error || !exportJob || exportJob.user_id !== user.id) throw new HttpError(404, "Export not found", "EXPORT_NOT_FOUND");
  if (exportJob.status !== "ready" || !exportJob.object_path || new Date(exportJob.expires_at).getTime() <= Date.now()) {
    throw new HttpError(409, "This export is not ready or has expired", "EXPORT_UNAVAILABLE");
  }
  const { data, error: signedError } = await admin.storage.from("trust-exports").createSignedUrl(exportJob.object_path, 120, { download: true });
  if (signedError) throw new HttpError(400, signedError.message, "EXPORT_DOWNLOAD_FAILED");
  return { signedUrl: data.signedUrl, expiresIn: 120 };
}

async function requestDeletion(request: Request, input: Json) {
  const user = await requireUser(request);
  const decision = await evaluate(user.id, "account_delete", { request_id: request.headers.get("x-request-id") || crypto.randomUUID() });
  if (decision.allowed !== true) throw new HttpError(409, "Deletion requirements are incomplete", "COMPLIANCE_BLOCKED", decision);
  const idempotencyKey = `account-delete:${user.id}`;
  const { data: existing } = await admin.from("deletion_jobs").select("*").eq("idempotency_key", idempotencyKey).in("status", ["queued", "scheduled", "due", "running", "waiting_review"]).maybeSingle();
  if (existing) return { deletion: existing, decision, reused: true };
  const { data: privacyRequest, error: privacyError } = await admin.from("privacy_requests").insert({
    user_id: user.id,
    request_type: "deletion",
    jurisdiction: asString(input.countryCode, 2).toUpperCase() || null,
    policy_version: decision.policyVersion,
    created_by: user.id,
  }).select().single();
  if (privacyError) throw new HttpError(400, privacyError.message, "DELETION_REQUEST_FAILED");
  const scheduledFor = new Date(Date.now() + 30 * 86400000).toISOString();
  const { data: deletion, error } = await admin.from("deletion_jobs").insert({
    privacy_request_id: privacyRequest.id,
    user_id: user.id,
    job_type: "account_delete",
    status: "scheduled",
    scheduled_for: scheduledFor,
    idempotency_key: idempotencyKey,
    created_by: user.id,
  }).select().single();
  if (error) throw new HttpError(400, error.message, "DELETION_REQUEST_FAILED");
  await admin.from("notifications").insert({ user_id: user.id, type: "account_deletion_scheduled", category: "legal", title: "Account deletion scheduled", message: `Your deletion request is scheduled for ${new Date(scheduledFor).toLocaleDateString("en-GB")}. You can cancel it before processing begins.`, read: false, data: { deletionId: deletion.id, url: "/workspace/settings/privacy" } });
  return { deletion, decision };
}

async function cancelDeletion(request: Request, input: Json) {
  const user = await requireUser(request);
  const deletionId = asUuid(input.deletionId, "deletionId");
  const { data, error } = await admin.from("deletion_jobs").update({ status: "cancelled" })
    .eq("id", deletionId).eq("user_id", user.id).in("status", ["queued", "scheduled", "due"]).select().maybeSingle();
  if (error || !data) throw new HttpError(409, "This deletion can no longer be cancelled", "DELETION_NOT_CANCELLABLE");
  if (data.privacy_request_id) await admin.from("privacy_requests").update({ status: "cancelled" }).eq("id", data.privacy_request_id);
  return { deletion: data };
}

async function cancelSubscription(request: Request, input: Json) {
  const user = await requireUser(request);
  const userSubscriptionId = asUuid(input.userSubscriptionId, "userSubscriptionId");
  const decision = await evaluate(user.id, "subscription_cancel", { request_id: request.headers.get("x-request-id") || crypto.randomUUID() });
  if (decision.allowed !== true) throw new HttpError(409, "Cancellation requirements are incomplete", "COMPLIANCE_BLOCKED", decision);
  const { data: subscription, error } = await admin.from("user_subscriptions")
    .select("id,user_id,stripe_subscription_id,status,current_period_end,cancel_at_period_end")
    .eq("id", userSubscriptionId).eq("user_id", user.id).maybeSingle();
  if (error || !subscription) throw new HttpError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  const idempotencyKey = `subscription-cancel:${userSubscriptionId}`;
  const { data: existing } = await admin.from("subscription_cancellations").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existing && !["failed", "reversed"].includes(existing.status)) return { cancellation: existing, decision, reused: true };

  let effectiveAt = subscription.current_period_end;
  let providerSubscriptionId = subscription.stripe_subscription_id;
  try {
    if (providerSubscriptionId) {
      const updated = await stripe.subscriptions.update(providerSubscriptionId, { cancel_at_period_end: true });
      const periodEnd = (updated as unknown as { current_period_end?: number }).current_period_end
        || updated.items.data[0]?.current_period_end;
      effectiveAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : effectiveAt;
    }
    const { data: cancellation, error: cancellationError } = await admin.from("subscription_cancellations").upsert({
      user_id: user.id,
      user_subscription_id: userSubscriptionId,
      provider_subscription_id: providerSubscriptionId,
      status: "scheduled",
      effective_at: effectiveAt,
      reason_category: asString(input.reasonCategory, 80) || null,
      confirmation_sent_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
      policy_version: decision.policyVersion,
      created_by: user.id,
    }, { onConflict: "idempotency_key" }).select().single();
    if (cancellationError) throw cancellationError;
    await admin.from("user_subscriptions").update({ cancel_at_period_end: true, status: subscription.status }).eq("id", userSubscriptionId);
    await admin.from("notifications").insert({ user_id: user.id, type: "subscription_cancelled", category: "billing", title: "Subscription cancellation confirmed", message: effectiveAt ? `Your subscription ends on ${new Date(effectiveAt).toLocaleDateString("en-GB")}.` : "Your subscription will end at the close of the current billing period.", read: false, data: { userSubscriptionId, effectiveAt, url: "/workspace/money/subscriptions" } });
    return { cancellation, decision };
  } catch (providerError) {
    await admin.from("subscription_cancellations").upsert({
      user_id: user.id,
      user_subscription_id: userSubscriptionId,
      provider_subscription_id: providerSubscriptionId,
      status: "failed",
      idempotency_key: idempotencyKey,
      policy_version: decision.policyVersion,
      created_by: user.id,
    }, { onConflict: "idempotency_key" });
    throw new HttpError(502, providerError instanceof Error ? providerError.message : "The payment provider could not schedule cancellation", "PROVIDER_CANCELLATION_FAILED");
  }
}

async function createConsumerRightsRequest(request: Request, input: Json) {
  const user = await requireUser(request);
  const orderId = asUuid(input.orderId, "orderId");
  const requestType = asString(input.requestType, 40);
  if (!["withdrawal", "refund", "return", "complaint", "warranty"].includes(requestType)) {
    throw new HttpError(400, "Choose a valid purchase-rights request", "INVALID_REQUEST_TYPE");
  }
  const { data: order, error: orderError } = await admin.from("orders")
    .select("id,buyer_id,listing_id,status,created_at")
    .eq("id", orderId).eq("buyer_id", user.id).maybeSingle();
  if (orderError || !order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  const { data: existing } = await admin.from("consumer_rights_requests").select("*")
    .eq("user_id", user.id).eq("order_id", orderId).eq("request_type", requestType)
    .in("status", ["submitted", "under_review", "approved", "return_in_transit"]).maybeSingle();
  if (existing) return { request: existing, reused: true };
  const withdrawalDeadline = new Date(new Date(order.created_at).getTime() + 14 * 86400000).toISOString();
  const { data: digitalConsent } = await admin.from("digital_delivery_consents")
    .select("id,immediate_delivery_requested,withdrawal_effect_acknowledged")
    .eq("user_id", user.id).eq("listing_id", order.listing_id).maybeSingle();
  const { data: rightsRequest, error } = await admin.from("consumer_rights_requests").insert({
    user_id: user.id,
    order_id: orderId,
    request_type: requestType,
    reason: asString(input.reason, 2000) || null,
    country_code: asString(input.countryCode || request.headers.get("cf-ipcountry"), 2).toUpperCase() || null,
    withdrawal_deadline: withdrawalDeadline,
    status: "submitted",
    policy_version: "2026-07-22-buyer_terms",
    created_by: user.id,
  }).select().single();
  if (error) throw new HttpError(400, error.message, "RIGHTS_REQUEST_FAILED");
  await admin.from("notifications").insert({
    user_id: user.id, type: "consumer_rights_request", category: "legal", title: "Purchase-rights request received",
    message: digitalConsent && requestType === "withdrawal" ? "Your request is under review. Your recorded immediate-delivery choice will be considered under the applicable law." : "Your request is under review and has an auditable case record.",
    read: false, data: { caseId: rightsRequest.case_id, orderId, url: "/workspace/trust" },
  });
  return { request: rightsRequest, eligibility: { standardWithdrawalDeadline: withdrawalDeadline, digitalDeliveryConsentRecorded: Boolean(digitalConsent), automaticDecision: false } };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return respond(request, { error: "Method not allowed" }, 405);
  try {
    const body = asRecord(await request.json());
    const action = asString(body.action, 60);
    const input = asRecord(body.input);
    let result: unknown;
    if (action === "evaluate") {
      const user = await optionalUser(request);
      result = { decision: await evaluate(user?.id || null, asString(input.action, 60), asRecord(input.context)) };
    } else if (action === "record-consent") result = await recordConsent(request, input);
    else if (action === "create-checkout") result = await createCheckout(request, input);
    else if (action === "privacy-request") result = await createPrivacyRequest(request, input);
    else if (action === "request-export") result = await requestExport(request, input);
    else if (action === "download-export") result = await downloadExport(request, input);
    else if (action === "request-deletion") result = await requestDeletion(request, input);
    else if (action === "cancel-deletion") result = await cancelDeletion(request, input);
    else if (action === "cancel-subscription") result = await cancelSubscription(request, input);
    else if (action === "consumer-rights-request") result = await createConsumerRightsRequest(request, input);
    else throw new HttpError(400, "Unknown Trust Center action", "UNKNOWN_ACTION");
    return respond(request, { success: true, ...asRecord(result) });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Trust Center request failed";
    const code = error instanceof HttpError ? error.code : "TRUST_CENTER_ERROR";
    const details = error instanceof HttpError ? error.details : undefined;
    console.error("Trust Center request failed", { code, status, message });
    return respond(request, { success: false, error: message, code, details }, status);
  }
});
