import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type User } from "@supabase/supabase-js";
import Stripe from "stripe";

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

async function requireUser(request: Request): Promise<User> {
  const { data, error } = await userClientFor(request).auth.getUser();
  if (error || !data.user) throw Object.assign(new Error("Authentication required"), { status: 401 });
  return data.user;
}

const cleanUsername = (value: unknown, userId: string) => {
  const normalized = String(value || "")
    .replace(/^@+/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "");
  return normalized || `user-${userId.slice(0, 8)}`;
};

const cleanCurrency = (value: unknown) => {
  const currency = String(value || "eur").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) throw Object.assign(new Error("Invalid currency"), { status: 400 });
  return currency;
};

const cleanEmail = (value: unknown) => {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw Object.assign(new Error("A valid email address is required"), { status: 400 });
  }
  return email;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const appBaseUrl = () => {
  const raw = Deno.env.get("APP_URL") || Deno.env.get("VITE_APP_URL") || "https://wersee.com";
  const parsed = new URL(raw);
  if (!["wersee.com", "www.wersee.com"].includes(parsed.hostname) && parsed.hostname !== "localhost") {
    return "https://wersee.com";
  }
  return parsed.origin;
};

const paymentBaseUrl = () => {
  const raw = Deno.env.get("WERSEE_PAY_SITE_URL") || "https://pay.wersee.com";
  const parsed = new URL(raw);
  if (parsed.hostname !== "pay.wersee.com" && parsed.hostname !== "localhost") {
    return "https://pay.wersee.com";
  }
  return parsed.origin;
};

async function getProfile(userId: string) {
  const { data, error } = await admin
    .from("profiles")
    .select("id,username,name,full_name,company_name,stripe_account_id,stripe_onboarding_complete")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function resolveStripeAccount(userId: string) {
  const [{ data: profile }, { data: payout }, { data: business }] = await Promise.all([
    admin
      .from("profiles")
      .select("stripe_account_id,stripe_onboarding_complete")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("seller_payout_profiles")
      .select("stripe_account_id,charges_enabled,details_submitted")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("businesses")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .not("stripe_account_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const accountId =
    payout?.stripe_account_id ||
    profile?.stripe_account_id ||
    business?.stripe_account_id ||
    null;

  if (!accountId || accountId === "sandbox") {
    throw Object.assign(new Error("Connect Stripe before using this Finance feature."), {
      status: 409,
      code: "STRIPE_CONNECT_REQUIRED",
    });
  }

  const account = await stripe.accounts.retrieve(accountId);
  if (account.deleted || !account.charges_enabled) {
    throw Object.assign(new Error("Complete Stripe onboarding before accepting payments."), {
      status: 409,
      code: "STRIPE_ONBOARDING_REQUIRED",
    });
  }
  return { accountId, account };
}

async function assertOwnerAccount(userId: string, requestedAccount: unknown) {
  const resolved = await resolveStripeAccount(userId);
  if (requestedAccount && String(requestedAccount) !== resolved.accountId) {
    throw Object.assign(new Error("The requested Stripe account is not connected to this user."), {
      status: 403,
      code: "STRIPE_ACCOUNT_MISMATCH",
    });
  }
  return resolved;
}

async function createSubscription(request: Request, input: Input) {
  const user = await requireUser(request);
  const { accountId } = await assertOwnerAccount(user.id, input.accountId);
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const amount = Number(input.price ?? input.amount);
  const currency = cleanCurrency(input.currency);
  const period = String(input.billing_period || "monthly");
  const intervalMap: Record<string, Stripe.PriceCreateParams.Recurring.Interval> = {
    daily: "day",
    weekly: "week",
    monthly: "month",
    yearly: "year",
  };
  if (name.length < 2 || name.length > 160) throw Object.assign(new Error("Enter a plan name."), { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    throw Object.assign(new Error("Enter a valid subscription price above zero."), { status: 400 });
  }
  if (!intervalMap[period]) throw Object.assign(new Error("Invalid billing period."), { status: 400 });

  const slugBase = String(input.slug || name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const slug = slugBase || `plan-${crypto.randomUUID().slice(0, 8)}`;
  const profile = await getProfile(user.id);
  const username = cleanUsername(profile?.username || user.user_metadata?.username, user.id);
  const operationKey = `subscription:${user.id}:${slug}`;

  const existing = await admin
    .from("subscriptions")
    .select("*")
    .eq("seller_id", user.id)
    .eq("slug", slug)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return json({ subscription: existing.data, alreadyExists: true });

  const product = await stripe.products.create(
    {
      name,
      description: description || undefined,
      images: input.image_url ? [String(input.image_url)] : undefined,
      metadata: { wersee_owner_id: user.id, wersee_subscription_slug: slug },
    },
    { stripeAccount: accountId, idempotencyKey: `${operationKey}:product` },
  );
  const price = await stripe.prices.create(
    {
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency,
      recurring: { interval: intervalMap[period] },
      metadata: { wersee_owner_id: user.id, wersee_subscription_slug: slug },
    },
    { stripeAccount: accountId, idempotencyKey: `${operationKey}:price` },
  );

  const row = await admin
    .from("subscriptions")
    .insert({
      seller_id: user.id,
      username,
      name,
      description: description || null,
      amount,
      price: amount,
      currency,
      interval: intervalMap[period],
      billing_period: period,
      trial_period_days: Math.max(0, Math.min(365, Number(input.trial_period_days) || 0)),
      image_url: input.image_url || null,
      features: Array.isArray(input.features) ? input.features.map(String).filter(Boolean).slice(0, 50) : [],
      slug,
      stripe_product_id: product.id,
      stripe_price_id: price.id,
      success_url: input.success_url || null,
      settings: typeof input.settings === "object" && input.settings ? input.settings : {},
    })
    .select()
    .single();
  if (row.error) throw row.error;
  return json({ subscription: row.data, product, price });
}

async function couponAction(request: Request, input: Input) {
  const user = await requireUser(request);
  const { accountId } = await assertOwnerAccount(user.id, input.accountId);

  if (input.action === "coupon-list") {
    const result = await stripe.coupons.list({ limit: 100 }, { stripeAccount: accountId });
    return json({ data: result.data, hasMore: result.has_more });
  }
  if (input.action === "promotion-code-list") {
    const [result, couponResult] = await Promise.all([
      stripe.promotionCodes.list({ limit: 100, active: true }, { stripeAccount: accountId }),
      stripe.coupons.list({ limit: 100 }, { stripeAccount: accountId }),
    ]);
    const couponsById = new Map(couponResult.data.map((coupon) => [coupon.id, coupon]));
    const data = result.data.map((promotionCode) => {
      const promotionCoupon = promotionCode.promotion?.type === "coupon"
        ? promotionCode.promotion.coupon
        : null;
      const couponId = typeof promotionCoupon === "string" ? promotionCoupon : promotionCoupon?.id;
      return { ...promotionCode, coupon: couponId ? couponsById.get(couponId) || promotionCoupon : null };
    });
    return json({ data, hasMore: result.has_more });
  }
  if (input.action === "coupon-create") {
    const percent = input.percent_off === undefined ? null : Number(input.percent_off);
    const amount = input.amount_off === undefined ? null : Number(input.amount_off);
    if ((percent === null) === (amount === null)) {
      throw Object.assign(new Error("Choose either a percentage or fixed discount."), { status: 400 });
    }
    if (percent !== null && (!Number.isFinite(percent) || percent <= 0 || percent > 100)) {
      throw Object.assign(new Error("Percentage must be between 0 and 100."), { status: 400 });
    }
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      throw Object.assign(new Error("Fixed discount must be above zero."), { status: 400 });
    }
    const duration = String(input.duration || "once") as Stripe.CouponCreateParams.Duration;
    if (!["once", "forever", "repeating"].includes(duration)) {
      throw Object.assign(new Error("Invalid discount duration."), { status: 400 });
    }
    const params: Stripe.CouponCreateParams = {
      name: String(input.name || "").trim() || undefined,
      duration,
      percent_off: percent ?? undefined,
      amount_off: amount === null ? undefined : Math.round(amount * 100),
      currency: amount === null ? undefined : cleanCurrency(input.currency),
      max_redemptions: input.max_redemptions ? Number(input.max_redemptions) : undefined,
      duration_in_months:
        duration === "repeating" ? Math.max(1, Number(input.duration_in_months) || 1) : undefined,
      metadata: { wersee_owner_id: user.id },
    };
    const result = await stripe.coupons.create(params, { stripeAccount: accountId });
    return json({ coupon: result });
  }

  const couponId = String(input.coupon_id || "");
  if (!couponId) throw Object.assign(new Error("Coupon is required."), { status: 400 });
  const params: Stripe.PromotionCodeCreateParams = {
    promotion: { type: "coupon", coupon: couponId },
    code: String(input.code || "").trim().toUpperCase() || undefined,
    active: input.active !== false,
    max_redemptions: input.max_redemptions ? Number(input.max_redemptions) : undefined,
    metadata: { wersee_owner_id: user.id },
  };
  const result = await stripe.promotionCodes.create(params, { stripeAccount: accountId });
  return json({ promotionCode: result });
}

const allowedPaymentMethods = new Set([
  "card",
  "ideal",
  "bancontact",
  "klarna",
  "eps",
  "p24",
  "link",
  "sepa_debit",
]);

async function invoiceCheckout(input: Input) {
  const invoiceId = String(input.invoiceId || input.id || "");
  if (!invoiceId) throw Object.assign(new Error("Invoice is required."), { status: 400 });
  const { data: invoice, error } = await admin
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) throw error;
  if (!invoice || ["draft", "void", "paid", "uncollectible"].includes(String(invoice.status))) {
    throw Object.assign(new Error("This invoice is not available for payment."), { status: 409 });
  }
  const { accountId } = await resolveStripeAccount(invoice.user_id);
  const amount = Number(invoice.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error("This invoice has no payable amount."), { status: 409 });
  }
  const configured = Array.isArray(invoice.metadata?.payment_methods)
    ? invoice.metadata.payment_methods.map(String).filter((method: string) => allowedPaymentMethods.has(method))
    : [];
  const methods = [...new Set(configured.length ? configured : ["card"])];
  const origin = paymentBaseUrl();
  const username = cleanUsername(invoice.username, invoice.user_id);
  const invoiceNumber = encodeURIComponent(invoice.invoice_number || invoice.id);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: methods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      line_items: [{
        price_data: {
          currency: cleanCurrency(invoice.currency),
          product_data: {
            name: `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)}`,
            description: invoice.memo || invoice.metadata?.memo || undefined,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      customer_email: invoice.customer_email || undefined,
      success_url: `${origin}/pay/invoice/${encodeURIComponent(username)}/${invoiceNumber}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay/invoice/${encodeURIComponent(username)}/${invoiceNumber}`,
      metadata: {
        type: "wersee_invoice",
        invoice_id: invoice.id,
        owner_user_id: invoice.user_id,
      },
    },
    {
      stripeAccount: accountId,
      idempotencyKey: `invoice-checkout:${invoice.id}:${invoice.updated_at || invoice.created_at}`,
    },
  );
  return json({ url: session.url, sessionId: session.id });
}

async function createOutboxRow(input: {
  eventKey: string;
  kind: "invoice" | "contract_quick_pay";
  sourceId: string;
  ownerUserId: string;
  recipient: string;
  sender: string;
}) {
  const { data, error } = await admin
    .from("finance_email_outbox")
    .upsert({
      event_key: input.eventKey,
      kind: input.kind,
      source_id: input.sourceId,
      owner_user_id: input.ownerUserId,
      recipient_email: input.recipient,
      sender_email: input.sender,
      status: "pending",
      updated_at: new Date().toISOString(),
    }, { onConflict: "event_key", ignoreDuplicates: true })
    .select()
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const existing = await admin.from("finance_email_outbox").select("*").eq("event_key", input.eventKey).single();
  if (existing.error) throw existing.error;
  return existing.data;
}

async function sendOutboxEmail(input: {
  row: Record<string, unknown>;
  subject: string;
  html: string;
  text: string;
}) {
  if (input.row.status === "sent") return { alreadySent: true, row: input.row };
  const apiKey = requiredEnv("RESEND_API_KEY");
  await admin.from("finance_email_outbox").update({
    status: "processing",
    attempts: Number(input.row.attempts || 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq("id", input.row.id);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": String(input.row.event_key),
    },
    body: JSON.stringify({
      from: `Wersee <${input.row.sender_email}>`,
      to: [input.row.recipient_email],
      reply_to: "support@wersee.com",
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: [
        { name: "category", value: String(input.row.kind) },
        { name: "source", value: "finance_outbox" },
      ],
    }),
  });
  const raw = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = {};
  }
  if (!response.ok) {
    await admin.from("finance_email_outbox").update({
      status: "failed",
      last_error_code: `RESEND_${response.status}`,
      last_error_message: "Email provider rejected the message.",
      updated_at: new Date().toISOString(),
    }).eq("id", input.row.id);
    throw Object.assign(new Error("Invoice email could not be delivered."), { status: 502 });
  }
  await admin.from("finance_email_outbox").update({
    status: "sent",
    resend_email_id: parsed.id || null,
    sent_at: new Date().toISOString(),
    last_error_code: null,
    last_error_message: null,
    updated_at: new Date().toISOString(),
  }).eq("id", input.row.id);
  return { alreadySent: false, emailId: parsed.id };
}

const emailShell = (content: string) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f4f4f5;color:#18181b;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:20px">
<tr><td style="padding:36px">${content}</td></tr></table>
</td></tr></table></body></html>`;

async function sendInvoiceEmail(request: Request, input: Input) {
  const user = await requireUser(request);
  const invoiceId = String(input.invoiceId || "");
  const invoiceResult = await admin.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (invoiceResult.error) throw invoiceResult.error;
  const invoice = invoiceResult.data;
  if (!invoice || invoice.user_id !== user.id) {
    throw Object.assign(new Error("Invoice not found."), { status: 404 });
  }
  if (invoice.status === "draft") throw Object.assign(new Error("Finalize the invoice before sending it."), { status: 409 });
  const recipient = cleanEmail(invoice.customer_email);
  const origin = paymentBaseUrl();
  const username = cleanUsername(invoice.username, user.id);
  const paymentUrl = `${origin}/pay/invoice/${encodeURIComponent(username)}/${encodeURIComponent(invoice.invoice_number || invoice.id)}`;
  const pdfUrl = invoice.pdf_url || `${paymentUrl}?download=true`;
  const amount = new Intl.NumberFormat("en", {
    style: "currency",
    currency: String(invoice.currency || "EUR").toUpperCase(),
  }).format(Number(invoice.amount || 0));
  const businessName = escapeHtml(invoice.metadata?.business_name || "Wersee seller");
  const outbox = await createOutboxRow({
    eventKey: `invoice:${invoice.id}:v1`,
    kind: "invoice",
    sourceId: invoice.id,
    ownerUserId: user.id,
    recipient,
    sender: "invoice@wersee.com",
  });
  const html = emailShell(`
    <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;margin:0 0 12px">Invoice</p>
    <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">${businessName} sent you an invoice</h1>
    <p style="font-size:16px;line-height:1.6;color:#52525b;margin:0 0 24px">Invoice ${escapeHtml(invoice.invoice_number)} is ready for ${escapeHtml(amount)}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#18181b" style="border-radius:12px;text-align:center">
      <a href="${escapeHtml(paymentUrl)}" style="display:block;padding:14px 20px;color:#fff;text-decoration:none;font-weight:700">View and pay invoice</a>
    </td></tr><tr><td style="padding-top:12px;text-align:center">
      <a href="${escapeHtml(pdfUrl)}" style="color:#52525b;font-size:14px">Download PDF</a>
    </td></tr></table>
  `);
  const result = await sendOutboxEmail({
    row: outbox,
    subject: `Invoice ${invoice.invoice_number || ""} from ${invoice.metadata?.business_name || "Wersee"}`,
    html,
    text: `Invoice ${invoice.invoice_number || ""}\nAmount: ${amount}\nPay: ${paymentUrl}\nPDF: ${pdfUrl}`,
  });
  return json({ success: true, ...result });
}

async function contractSignedQuickPay(input: Input) {
  const contractId = String(input.contractId || "");
  const contractResult = await admin.from("contracts").select("*").eq("id", contractId).maybeSingle();
  if (contractResult.error) throw contractResult.error;
  const contract = contractResult.data;
  if (!contract || contract.status !== "signed") {
    throw Object.assign(new Error("Signed contract not found."), { status: 404 });
  }
  const signatureResult = await admin
    .from("contract_signatures")
    .select("signer_name,signer_email,signed_at")
    .eq("contract_id", contract.id)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (signatureResult.error) throw signatureResult.error;
  const signature = signatureResult.data;
  if (!signature) throw Object.assign(new Error("Contract signature not found."), { status: 409 });
  const recipient = cleanEmail(signature.signer_email);
  if (input.signerEmail && cleanEmail(input.signerEmail) !== recipient) {
    throw Object.assign(new Error("Signer does not match."), { status: 403 });
  }
  const quickPay = contract.metadata?.auto_quick_link === true;
  const amount = Number(contract.metadata?.payment_amount || 0);
  if (!quickPay || !Number.isFinite(amount) || amount <= 0) {
    return json({ success: true, quickPayCreated: false });
  }
  await resolveStripeAccount(contract.user_id);
  const profile = await getProfile(contract.user_id);
  const username = cleanUsername(profile?.username, contract.user_id);
  const invoiceNumber = `CTR-${contract.id.slice(0, 8).toUpperCase()}`;
  let invoice = await admin
    .from("invoices")
    .select("*")
    .eq("user_id", contract.user_id)
    .eq("invoice_number", invoiceNumber)
    .maybeSingle();
  if (invoice.error) throw invoice.error;
  if (!invoice.data) {
    invoice = await admin
      .from("invoices")
      .insert({
        user_id: contract.user_id,
        username,
        invoice_number: invoiceNumber,
        customer_name: signature.signer_name,
        customer_email: recipient,
        amount,
        currency: cleanCurrency(contract.metadata?.payment_currency),
        status: "sent",
        slug: invoiceNumber.toLowerCase(),
        memo: `Payment for signed contract: ${contract.title}`,
        metadata: {
          contract_id: contract.id,
          contract_title: contract.title,
          auto_quick_link: true,
          payment_methods: ["card", "ideal"],
        },
      })
      .select()
      .single();
    if (invoice.error) throw invoice.error;
  }
  const paymentOrigin = paymentBaseUrl();
  const paymentUrl = `${paymentOrigin}/pay/invoice/${encodeURIComponent(username)}/${encodeURIComponent(invoiceNumber)}`;
  const contractUrl = `${appBaseUrl()}/contract/${contract.id}?download=true`;
  await admin.from("contracts").update({
    metadata: {
      ...(contract.metadata || {}),
      quick_pay_invoice_id: invoice.data.id,
      quick_pay_url: paymentUrl,
    },
  }).eq("id", contract.id);
  const outbox = await createOutboxRow({
    eventKey: `contract-quick-pay:${contract.id}:v1`,
    kind: "contract_quick_pay",
    sourceId: contract.id,
    ownerUserId: contract.user_id,
    recipient,
    sender: "pay@wersee.com",
  });
  const amountLabel = new Intl.NumberFormat("en", {
    style: "currency",
    currency: String(invoice.data.currency || "EUR").toUpperCase(),
  }).format(Number(invoice.data.amount));
  const html = emailShell(`
    <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#10b981;margin:0 0 12px">Contract signed</p>
    <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">Your secure payment page is ready</h1>
    <p style="font-size:16px;line-height:1.6;color:#52525b;margin:0 0 24px">Thanks ${escapeHtml(signature.signer_name)}. Pay ${escapeHtml(amountLabel)} and review the signed contract from the same page.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#18181b" style="border-radius:12px;text-align:center">
      <a href="${escapeHtml(paymentUrl)}" style="display:block;padding:14px 20px;color:#fff;text-decoration:none;font-weight:700">Open payment page</a>
    </td></tr><tr><td style="padding-top:12px;text-align:center">
      <a href="${escapeHtml(contractUrl)}" style="color:#52525b;font-size:14px">Download signed contract PDF</a>
    </td></tr></table>
  `);
  const result = await sendOutboxEmail({
    row: outbox,
    subject: `Payment link for signed contract: ${contract.title}`,
    html,
    text: `Your contract is signed.\nPay ${amountLabel}: ${paymentUrl}\nSigned contract: ${contractUrl}`,
  });
  return json({ success: true, quickPayCreated: true, paymentUrl, invoiceId: invoice.data.id, ...result });
}

async function taxSummary(request: Request) {
  const user = await requireUser(request);
  const { accountId } = await resolveStripeAccount(user.id);
  const { data: rows, error } = await admin
    .from("orders")
    .select("id,created_at,amount,total_amount,currency,status,payment_status,stripe_payment_intent_id,stripe_fee,wersee_fee,tax_amount")
    .eq("seller_id", user.id)
    .not("stripe_payment_intent_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const verified: Array<Record<string, unknown>> = [];
  for (const order of rows || []) {
    try {
      const intent = await stripe.paymentIntents.retrieve(
        String(order.stripe_payment_intent_id),
        {},
        { stripeAccount: accountId },
      );
      if (intent.status !== "succeeded") continue;
      const supabaseMinor = Math.round(Number(order.total_amount ?? order.amount ?? 0) * 100);
      const stripeMinor = Number(intent.amount_received || intent.amount);
      if (supabaseMinor !== stripeMinor || String(order.currency || "eur").toLowerCase() !== intent.currency) continue;
      verified.push({
        id: order.id,
        created_at: order.created_at,
        amount: stripeMinor / 100,
        currency: intent.currency,
        stripe_fee: Number(order.stripe_fee || 0),
        wersee_fee: Number(order.wersee_fee || 0),
        tax_amount: Number(order.tax_amount || 0),
      });
    } catch {
      // A row is excluded unless Stripe and Supabase both confirm it.
    }
  }
  const year = new Date().getUTCFullYear();
  const sumYear = (target: number, key: string) =>
    verified
      .filter((row) => new Date(String(row.created_at)).getUTCFullYear() === target)
      .reduce((sum, row) => sum + Number(row[key] || 0), 0);
  const currentRevenue = sumYear(year, "amount");
  const previousRevenue = sumYear(year - 1, "amount");
  const stripeFees = sumYear(year, "stripe_fee");
  const werseeFees = sumYear(year, "wersee_fee");
  const taxAmount = sumYear(year, "tax_amount");
  const trendPercent = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : null;
  return json({
    source: "stripe_supabase_reconciled",
    year,
    currentRevenue,
    previousRevenue,
    trendPercent,
    stripeFees,
    werseeFees,
    taxAmount,
    netProfit: currentRevenue - stripeFees - werseeFees - taxAmount,
    transactionCount: verified.filter((row) => new Date(String(row.created_at)).getUTCFullYear() === year).length,
    transactions: verified,
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const input = await request.json() as Input;
    switch (input.action) {
      case "subscription-create":
        return await createSubscription(request, input);
      case "coupon-list":
      case "promotion-code-list":
      case "coupon-create":
      case "promotion-code-create":
        return await couponAction(request, input);
      case "invoice-checkout":
        return await invoiceCheckout(input);
      case "invoice-send":
        return await sendInvoiceEmail(request, input);
      case "contract-signed-quick-pay":
        return await contractSignedQuickPay(input);
      case "tax-summary":
        return await taxSummary(request);
      default:
        return json({ error: "Unknown Finance workflow action" }, 400);
    }
  } catch (error) {
    const stripeError = error as Stripe.errors.StripeError;
    const status = Number(
      (error as { status?: number }).status ||
      stripeError?.statusCode ||
      500,
    );
    console.error("finance-workflows", {
      message: error instanceof Error ? error.message : "unknown",
      code: stripeError?.code,
      status,
    });
    return json({
      error: stripeError?.message || (error instanceof Error ? error.message : "Finance workflow failed"),
      code: (error as { code?: string }).code || stripeError?.code || "FINANCE_WORKFLOW_ERROR",
    }, status);
  }
});
