import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, "Content-Type": "application/json" },
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
const allowedTypes = new Set([
  "card", "ideal", "bancontact", "klarna", "affirm", "eps", "alipay",
  "sepa_debit", "afterpay_clearpay", "p24", "wechat_pay", "link",
  "us_bank_account", "boleto", "cashapp",
]);
const unavailablePaymentMethod = (error: unknown) => {
  const stripeError = error as Stripe.errors.StripeError;
  if (stripeError?.statusCode !== 400) return null;
  const match = stripeError.message?.match(/payment method type ["']([^"']+)["']/i);
  const method = match?.[1];
  return method && allowedTypes.has(method) ? method : null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await request.json();
    const linkId = String(body.linkId || "");
    const requestedEnvironment = String(body.environment || "");
    if (!["test", "live"].includes(requestedEnvironment)) {
      return json({ error: "Payment link environment is required", code: "LINK_ENVIRONMENT_REQUIRED" }, 400);
    }
    const { data: link, error } = await admin
      .from("quick_pay_links")
      .select("id,user_id,product_name,price,currency,stripe_account_id,active,status,settings,environment")
      .eq("id", linkId)
      .maybeSingle();
    if (error) throw error;
    if (!link || !link.active || link.status === "draft") return json({ error: "Payment link not found" }, 404);
    if (link.environment !== requestedEnvironment) {
      return json({
        error: `This is a ${link.environment} payment link. Open its ${link.environment} URL.`,
        code: "LINK_ENVIRONMENT_MISMATCH",
        expected_environment: link.environment,
      }, 409);
    }
    if (link.environment === "test") {
      return json({ error: "This is a sandbox payment link", code: "SANDBOX_LINK" }, 409);
    }
    if (!link.stripe_account_id || link.stripe_account_id === "sandbox") {
      return json({ error: "Live Stripe account is unavailable", code: "LIVE_ACCOUNT_REQUIRED" }, 409);
    }

    const pricingType = link.settings?.pricing_type || "fixed";
    const requestedAmount = Number(body.amount);
    const fixedAmount = Number(link.price || 0);
    const minimumAmount = Number(link.settings?.min_amount || 1);
    const amount = pricingType === "fixed" ? fixedAmount : requestedAmount;
    if (!Number.isFinite(amount) || amount < minimumAmount || amount > 1_000_000) {
      return json({ error: "Invalid payment amount" }, 400);
    }

    const selected = Array.isArray(link.settings?.payment_methods)
      ? link.settings.payment_methods.map(String).filter((method: string) => allowedTypes.has(method))
      : [];
    const includedProductIds = Array.isArray(link.settings?.included_product_ids)
      ? link.settings.included_product_ids.map(String).filter(Boolean).slice(0, 20)
      : [];
    let paymentMethodTypes = [...new Set(selected.length ? selected : ["card"])];
    const unavailablePaymentMethods: string[] = [];
    const requestId = crypto.randomUUID();
    let intent: Stripe.PaymentIntent | null = null;

    // A saved payment method can later become unavailable on a connected
    // account. Stripe rejects the entire PaymentIntent in that case, so retry
    // with the other seller-selected methods instead of blocking checkout.
    while (paymentMethodTypes.length > 0) {
      try {
        intent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: String(link.currency || "eur").toLowerCase(),
          description: link.product_name,
          payment_method_types: paymentMethodTypes as Stripe.PaymentIntentCreateParams.PaymentMethodType[],
          metadata: {
            type: "quick_pay",
            environment: "live",
            link_id: link.id,
            seller_id: link.user_id,
            included_product_ids: includedProductIds.join(",").slice(0, 500),
            bundle_size: String(includedProductIds.length),
          },
        }, {
          stripeAccount: link.stripe_account_id,
          idempotencyKey: `quick-pay-${link.id}-${requestId}-${unavailablePaymentMethods.length}`,
        });
        break;
      } catch (intentError) {
        const unavailable = unavailablePaymentMethod(intentError);
        if (!unavailable || !paymentMethodTypes.includes(unavailable)) throw intentError;
        unavailablePaymentMethods.push(unavailable);
        paymentMethodTypes = paymentMethodTypes.filter((method) => method !== unavailable);
        console.warn("quick-pay-payment removed unavailable payment method", {
          link_id: link.id,
          method: unavailable,
        });
      }
    }

    if (!intent) {
      return json({
        error: "None of the selected payment methods are currently available",
        code: "NO_AVAILABLE_PAYMENT_METHODS",
      }, 409);
    }

    return json({
      client_secret: intent.client_secret,
      stripe_account_id: link.stripe_account_id,
      payment_method_types: paymentMethodTypes,
      unavailable_payment_method_types: unavailablePaymentMethods,
    });
  } catch (error) {
    const stripeError = error as Stripe.errors.StripeError;
    console.error("quick-pay-payment", error);
    return json({
      error: stripeError?.message || (error instanceof Error ? error.message : "Payment could not start"),
      code: stripeError?.code || "QUICK_PAY_ERROR",
    }, stripeError?.statusCode || 500);
  }
});
