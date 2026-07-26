import { createClient } from "npm:@supabase/supabase-js@2.110.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

const splitUrls = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const base64 = (bytes: ArrayBuffer) => {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const readJwtSubject = (authorization: string) => {
  try {
    const token = authorization.replace(/^Bearer\s+/i, "");
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return String(JSON.parse(atob(payload)).sub || "wersee");
  } catch {
    return "wersee";
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("authorization") || "";
  if (!authorization) return json({ error: "Authentication required." }, 401);
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !supabaseAnonKey) return json({ error: "Call service is not configured." }, 503);
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Authentication required." }, 401);

  const stunUrls = splitUrls(
    Deno.env.get("STUN_URLS") ||
      "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302",
  );
  const turnUrls = splitUrls(Deno.env.get("TURN_URLS") || "")
    .filter((url) => /^turns?:/i.test(url));
  const sharedSecret = Deno.env.get("TURN_SHARED_SECRET") || "";

  const iceServers: Array<Record<string, unknown>> = [{ urls: stunUrls }];
  if (!sharedSecret || turnUrls.length === 0) {
    return json({ iceServers, relayReady: false, expiresAt: null });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const subject = (authData.user.id || readJwtSubject(authorization))
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  const username = `${expiresAt}:${subject || "wersee"}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sharedSecret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(username),
  );
  iceServers.push({
    urls: turnUrls,
    username,
    credential: base64(signature),
    credentialType: "password",
  });

  return json({
    iceServers,
    relayReady: true,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  });
});
