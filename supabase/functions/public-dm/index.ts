import { createClient } from "npm:@supabase/supabase-js@2.110.3";

type AccessMode = "everyone" | "authenticated" | "verified" | "secret_link" | "nobody";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";
const turnstileSiteKey = Deno.env.get("TURNSTILE_SITE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

const cleanText = (value: FormDataEntryValue | null, maximum = 500) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

const normalizeUsername = (value: string) =>
  value.trim().replace(/^@/, "").toLowerCase();

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const httpUrlPattern = /^https?:\/\/[^\s]+$/i;
const messageUrlPattern = /(?:https?:\/\/|www\.)[^\s]+/gi;
const forbiddenFilePattern = /\.(?:exe|dll|bat|cmd|com|scr|msi|ps1|sh|js|jar|apk|dmg)$/i;
const allowedFileTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const optionalViewer = async (request: Request) => {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === serviceRoleKey) return null;

  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
};

const getContext = async (usernameValue: string) => {
  const username = normalizeUsername(usernameValue);
  if (!username || username.length > 80) return null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username, full_name, name, avatar_url, company_name")
    .ilike("username", username)
    .maybeSingle();
  if (profileError || !profile) return null;

  const { data: settings, error: settingsError } = await admin
    .from("public_dm_settings")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (settingsError || !settings) return null;

  return { profile, settings };
};

const hasAccess = (
  mode: AccessMode,
  viewer: Awaited<ReturnType<typeof optionalViewer>>,
  suppliedSecret: string,
  storedSecret: string,
) => {
  if (mode === "nobody") return false;
  if (mode === "everyone") return true;
  if (mode === "authenticated") return Boolean(viewer);
  if (mode === "verified") return Boolean(viewer?.email_confirmed_at);
  if (mode === "secret_link") return suppliedSecret.length > 0 && suppliedSecret === storedSecret;
  return false;
};

const publicConfig = (profile: Record<string, unknown>, settings: Record<string, unknown>) => ({
  username: profile.username,
  displayName: settings.show_full_name
    ? profile.full_name || profile.name || profile.username
    : profile.username,
  avatarUrl: settings.show_avatar ? profile.avatar_url : null,
  companyName: profile.company_name,
  title: settings.title,
  description: settings.description,
  logoUrl: settings.logo_url,
  accentColor: settings.accent_color,
  presetTopics: settings.preset_topics,
  thankYouMessage: settings.thank_you_message,
  requirements: {
    name: settings.require_name,
    // Email is always optional on the public form. The legacy setting is kept
    // in the schema so existing rows remain compatible.
    email: false,
    subject: settings.require_subject,
    company: settings.company_requirement,
    website: settings.allow_website,
    attachments: settings.allow_attachments,
    maximumLength: settings.maximum_length,
    customQuestions: settings.custom_questions,
  },
  consentMessage: settings.consent_message,
  captcha: {
    enabled: settings.captcha_enabled,
    siteKey: settings.captcha_enabled ? turnstileSiteKey : "",
    available: !settings.captcha_enabled || Boolean(turnstileSecret && turnstileSiteKey),
  },
});

const verifyCaptcha = async (token: string, remoteIp: string) => {
  if (!turnstileSecret) return false;

  const body = new URLSearchParams({ secret: turnstileSecret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const result = await response.json().catch(() => ({}));
  return response.ok && result?.success === true;
};

const detectLabel = (text: string, spam: boolean) => {
  if (spam) return "spam";
  if (/\b(samenwerk|collab|partnership|project|budget|campagne|business)\b/i.test(text)) {
    return "collaboration";
  }
  if (/\b(support|help|hulp|probleem|storing|werkt niet|refund|terugbetaling)\b/i.test(text)) {
    return "support";
  }
  return "question";
};

const removeUploadedFiles = async (paths: string[]) => {
  if (paths.length === 0) return;
  await admin.storage.from("public-dm-attachments").remove(paths);
};

const loadConversation = async (
  ownerId: string,
  submissionId: string,
  token: string,
) => {
  if (!submissionId || !token) return null;
  const tokenHash = await sha256(`${serviceRoleKey}:${token}`);
  const { data: submission } = await admin
    .from("public_dm_submissions")
    .select("id, owner_id, sender_user_id, guest_name, guest_email, subject, message, status, created_at, receipt_token_hash")
    .eq("id", submissionId)
    .eq("owner_id", ownerId)
    .eq("receipt_token_hash", tokenHash)
    .maybeSingle();
  if (!submission) return null;

  const { data: messages, error: messagesError } = await admin
    .from("public_dm_messages")
    .select("id, sender_type, content, created_at")
    .eq("submission_id", submission.id)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (messagesError) return null;

  return {
    submission,
    messages: messages ?? [],
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Public DM service is not configured." }, 503);
  }

  const url = new URL(request.url);
  const username = url.searchParams.get("username") ?? "";
  const suppliedSecret = url.searchParams.get("key") ?? "";
  const receiptId = url.searchParams.get("receipt") ?? "";
  const receiptQueryToken = url.searchParams.get("token") ?? "";
  const conversationId = url.searchParams.get("conversation") ?? "";
  const context = await getContext(username);
  if (!context) {
    return json({ error: "This public inbox is not available." }, 404);
  }

  if (request.method === "GET" && receiptId && receiptQueryToken && context.settings.read_receipts) {
    const receiptTokenHash = await sha256(`${serviceRoleKey}:${receiptQueryToken}`);
    const { data: receipt } = await admin
      .from("public_dm_submissions")
      .select("status, read_at, created_at")
      .eq("id", receiptId)
      .eq("owner_id", context.profile.id)
      .eq("receipt_token_hash", receiptTokenHash)
      .maybeSingle();
    if (!receipt) return json({ error: "This delivery receipt is invalid or has expired." }, 404);
    return json({
      receipt: {
        status: receipt.status === "new" ? "delivered" : receipt.status,
        readAt: receipt.read_at,
        createdAt: receipt.created_at,
      },
    });
  }

  if (request.method === "GET" && conversationId && receiptQueryToken) {
    const thread = await loadConversation(context.profile.id, conversationId, receiptQueryToken);
    if (!thread) return json({ error: "This conversation link is invalid or has expired." }, 404);
    return json({
      config: publicConfig(context.profile, context.settings),
      conversation: {
        submissionId: thread.submission.id,
        subject: thread.submission.subject,
        guestName: thread.submission.guest_name,
        initialMessage: thread.submission.message,
        createdAt: thread.submission.created_at,
        status: thread.submission.status,
        messages: thread.messages.map((message) => ({
          id: message.id,
          senderType: message.sender_type,
          content: message.content,
          createdAt: message.created_at,
        })),
      },
    });
  }

  if (request.method === "POST" && conversationId && receiptQueryToken) {
    const thread = await loadConversation(context.profile.id, conversationId, receiptQueryToken);
    if (!thread) return json({ error: "This conversation link is invalid or has expired." }, 404);
    if (thread.submission.status === "spam") {
      return json({ error: "This conversation is no longer accepting replies." }, 403);
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const remoteIp = request.headers.get("cf-connecting-ip")
      || forwardedFor
      || request.headers.get("x-real-ip")
      || "unknown";
    const ipHash = await sha256(`${serviceRoleKey}:${remoteIp}:${request.headers.get("user-agent") ?? ""}`);
    const { data: ipAllowed, error: ipLimitError } = await admin.rpc("consume_public_dm_rate_limit", {
      p_owner_id: context.profile.id,
      p_key_type: "ip",
      p_key_hash: ipHash,
      p_limit: Math.min(100, Math.max(10, Number(context.settings.rate_limit_per_hour) * 6)),
    });
    if (ipLimitError) return json({ error: "Rate limiting is temporarily unavailable." }, 503);
    if (!ipAllowed) return json({ error: "Too many replies. Please try again in one hour." }, 429);

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.message === "string" ? body.message.trim().slice(0, 3000) : "";
    if (!content) return json({ error: "Write a message before sending." }, 422);

    const viewer = await optionalViewer(request);
    const { data: inserted, error: insertReplyError } = await admin
      .from("public_dm_messages")
      .insert({
        submission_id: conversationId,
        owner_id: context.profile.id,
        sender_type: "guest",
        sender_user_id: viewer?.id ?? thread.submission.sender_user_id ?? null,
        content,
      })
      .select("id, sender_type, content, created_at")
      .single();
    if (insertReplyError || !inserted) {
      return json({ error: "Your reply could not be sent." }, 503);
    }
    return json({
      ok: true,
      message: {
        id: inserted.id,
        senderType: inserted.sender_type,
        content: inserted.content,
        createdAt: inserted.created_at,
      },
    }, 201);
  }

  if (!context.settings.enabled || !context.settings.wizard_completed) {
    return json({ error: "This public inbox is not available." }, 404);
  }

  const viewer = await optionalViewer(request);
  const mode = context.settings.access_mode as AccessMode;
  if (!hasAccess(mode, viewer, suppliedSecret, String(context.settings.secret_token))) {
    const status = mode === "authenticated" || mode === "verified" ? 401 : 403;
    return json({
      error: mode === "verified"
        ? "Sign in with a verified Wersee account to send a message."
        : mode === "authenticated"
          ? "Sign in to Wersee to send a message."
          : "This link does not provide access to the public inbox.",
      requiresAuthentication: mode === "authenticated" || mode === "verified",
    }, status);
  }

  if (request.method === "GET") {
    return json({ config: publicConfig(context.profile, context.settings) });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const remoteIp = request.headers.get("cf-connecting-ip")
    || forwardedFor
    || request.headers.get("x-real-ip")
    || "unknown";
  const countryCode = (
    request.headers.get("cf-ipcountry")
    || request.headers.get("x-vercel-ip-country")
    || ""
  ).toUpperCase().slice(0, 2);

  if (
    countryCode
    && (context.settings.blocked_countries as string[]).map((code) => code.toUpperCase()).includes(countryCode)
  ) {
    return json({ error: "Messages from your region are not accepted." }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid message form." }, 400);
  }

  const name = cleanText(form.get("name"), 120);
  const email = cleanText(form.get("email"), 254).toLowerCase();
  const subject = cleanText(form.get("subject"), 180);
  const companyName = cleanText(form.get("companyName"), 160);
  const websiteUrl = cleanText(form.get("websiteUrl"), 500);
  const message = cleanText(form.get("message"), 10000);
  const topic = cleanText(form.get("topic"), 100);
  const consent = cleanText(form.get("consent"), 10) === "true";
  const captchaToken = cleanText(form.get("captchaToken"), 4096);
  const customAnswersRaw = cleanText(form.get("customAnswers"), 12000);
  const files = form.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);

  let customAnswers: Record<string, string> = {};
  if (customAnswersRaw) {
    try {
      const parsed = JSON.parse(customAnswersRaw);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
      customAnswers = Object.fromEntries(
        Object.entries(parsed)
          .slice(0, 10)
          .map(([key, value]) => [String(key).slice(0, 100), String(value ?? "").trim().slice(0, 1000)]),
      );
    } catch {
      return json({ error: "The answers to custom questions are invalid." }, 400);
    }
  }

  if (!consent) return json({ error: "Consent to process personal data is required." }, 422);
  if (context.settings.require_name && !name) return json({ error: "Name is required." }, 422);
  if (email && !emailPattern.test(email)) return json({ error: "Enter a valid email address." }, 422);
  if (context.settings.require_subject && !subject) return json({ error: "Subject is required." }, 422);
  if (context.settings.company_requirement === "required" && !companyName) {
    return json({ error: "Company name is required." }, 422);
  }
  if (websiteUrl && (!context.settings.allow_website || !httpUrlPattern.test(websiteUrl))) {
    return json({ error: "This website or social media link is not allowed." }, 422);
  }
  if (!message || message.length > context.settings.maximum_length) {
    return json({ error: `Your message must be between 1 and ${context.settings.maximum_length} characters.` }, 422);
  }

  const requiredQuestions = (context.settings.custom_questions as Array<Record<string, unknown>>)
    .filter((question) => question.required === true);
  const missingQuestion = requiredQuestions.find((question) => !customAnswers[String(question.id)]);
  if (missingQuestion) return json({ error: `Please answer: ${String(missingQuestion.label || "required question")}.` }, 422);

  if (context.settings.captcha_enabled) {
    if (!turnstileSecret || !turnstileSiteKey) {
      return json({ error: "CAPTCHA has not been configured on the server for this inbox yet." }, 503);
    }
    if (!captchaToken || !await verifyCaptcha(captchaToken, remoteIp)) {
      return json({ error: "The CAPTCHA check failed. Please try again." }, 422);
    }
  }

  if (files.length > 0 && !context.settings.allow_attachments) {
    return json({ error: "Attachments are not allowed for this inbox." }, 422);
  }
  if (files.length > 3) return json({ error: "You can add up to 3 attachments." }, 422);
  for (const file of files) {
    if (
      file.size > 5 * 1024 * 1024
      || !allowedFileTypes.has(file.type)
      || forbiddenFilePattern.test(file.name)
    ) {
      return json({ error: `Attachment "${file.name}" is not allowed or is larger than 5 MB.` }, 422);
    }
  }

  const ipHash = await sha256(`${serviceRoleKey}:${remoteIp}:${request.headers.get("user-agent") ?? ""}`);
  const emailHash = email ? await sha256(`${serviceRoleKey}:${email}`) : "";
  const { data: ipAllowed, error: ipLimitError } = await admin.rpc("consume_public_dm_rate_limit", {
    p_owner_id: context.profile.id,
    p_key_type: "ip",
    p_key_hash: ipHash,
    p_limit: context.settings.rate_limit_per_hour,
  });
  if (ipLimitError) return json({ error: "Rate limiting is temporarily unavailable." }, 503);
  if (!ipAllowed) return json({ error: "Too many messages. Please try again in one hour." }, 429);

  if (emailHash) {
    const { data: emailAllowed, error: emailLimitError } = await admin.rpc("consume_public_dm_rate_limit", {
      p_owner_id: context.profile.id,
      p_key_type: "email",
      p_key_hash: emailHash,
      p_limit: context.settings.rate_limit_per_hour,
    });
    if (emailLimitError) return json({ error: "Rate limiting is temporarily unavailable." }, 503);
    if (!emailAllowed) return json({ error: "This email address has sent too many messages." }, 429);
  }

  const blockFilters = [`owner_id.eq.${context.profile.id}`];
  if (viewer?.id) blockFilters.push(`blocked_user_id.eq.${viewer.id}`);
  if (emailHash) blockFilters.push(`blocked_email_hash.eq.${emailHash}`);
  const { data: blocks } = await admin
    .from("public_dm_blocks")
    .select("id")
    .eq("owner_id", context.profile.id)
    .or(blockFilters.slice(1).join(",") || "id.is.null")
    .limit(1);
  if (blocks?.length) return json({ error: "You cannot send messages to this inbox." }, 403);

  const combinedText = `${subject}\n${message}\n${websiteUrl}`.toLowerCase();
  const forbiddenHits = context.settings.filter_forbidden_words
    ? (context.settings.forbidden_words as string[])
      .filter((word) => word.trim().length > 1)
      .filter((word) => combinedText.includes(word.trim().toLowerCase())).length
    : 0;
  const urls = combinedText.match(messageUrlPattern) ?? [];
  let spamScore = forbiddenHits > 0 ? 75 : 0;
  if (context.settings.filter_links && urls.length > 2) spamScore = Math.max(spamScore, 60);
  if (/\b(?:bit\.ly|tinyurl\.com|t\.me\/|wa\.me\/)\b/i.test(combinedText)) {
    spamScore = Math.max(spamScore, 55);
  }
  const isSpam = spamScore >= 50;
  if (isSpam && !context.settings.suspicious_to_spam) {
    return json({ error: "This message was rejected by the safety filter." }, 422);
  }

  const submissionId = crypto.randomUUID();
  const receiptToken = crypto.randomUUID();
  const receiptTokenHash = await sha256(`${serviceRoleKey}:${receiptToken}`);
  const attachmentRows: Array<Record<string, unknown>> = [];
  const uploadedPaths: string[] = [];

  for (const [index, file] of files.entries()) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || `attachment-${index + 1}`;
    const path = `${context.profile.id}/${submissionId}/${index + 1}-${safeName}`;
    const { error: uploadError } = await admin.storage
      .from("public-dm-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      await removeUploadedFiles(uploadedPaths);
      return json({ error: "An attachment could not be stored securely." }, 503);
    }
    uploadedPaths.push(path);
    attachmentRows.push({
      path,
      name: file.name.slice(0, 180),
      size: file.size,
      contentType: file.type,
      scanStatus: context.settings.scan_attachments ? "validated" : "not_requested",
    });
  }

  const { error: insertError } = await admin.from("public_dm_submissions").insert({
    id: submissionId,
    owner_id: context.profile.id,
    sender_user_id: viewer?.id ?? null,
    guest_name: name || null,
    guest_email: email || null,
    guest_email_hash: emailHash || null,
    subject: subject || null,
    company_name: companyName || null,
    website_url: websiteUrl || null,
    message,
    topic: topic || null,
    custom_answers: customAnswers,
    attachments: attachmentRows,
    status: isSpam ? "spam" : "new",
    label: context.settings.auto_label ? detectLabel(combinedText, isSpam) : isSpam ? "spam" : "question",
    spam_score: spamScore,
    source_ip_hash: ipHash,
    receipt_token_hash: receiptTokenHash,
    country_code: countryCode || null,
    consented_at: new Date().toISOString(),
  });
  if (insertError) {
    await removeUploadedFiles(uploadedPaths);
    return json({ error: "Your message could not be saved." }, 503);
  }

  const replyMessage = context.settings.away_message_enabled && context.settings.away_message
    ? context.settings.away_message
    : context.settings.auto_reply_enabled
      ? context.settings.auto_reply_message
      : "";

  if (replyMessage) {
    const { error: automaticReplyError } = await admin.from("public_dm_messages").insert({
      submission_id: submissionId,
      owner_id: context.profile.id,
      sender_type: "owner",
      sender_user_id: context.profile.id,
      content: String(replyMessage).slice(0, 3000),
    });
    if (automaticReplyError) {
      console.error("Automatic public DM reply could not be saved:", automaticReplyError.code);
    }
  }

  return json({
    ok: true,
    submissionId,
    conversationToken: receiptToken,
    receiptToken: context.settings.read_receipts ? receiptToken : null,
    thankYouMessage: context.settings.thank_you_message,
    automaticReply: replyMessage || null,
  }, 201);
});
