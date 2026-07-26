import { createClient } from "jsr:@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;
type DnsRecord = {
  record?: string;
  name: string;
  type: string;
  value: string;
  priority?: number;
  status?: string;
  ttl?: string | number;
  vercel_record_id?: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN") || "";
const VERCEL_TEAM_ID = Deno.env.get("VERCEL_TEAM_ID") || "";
const ROOT_DOMAIN = (Deno.env.get("WERSEE_ROOT_DOMAIN") || "wersee.com").toLowerCase();

const allowedOrigins = new Set([
  "https://wersee.com",
  "https://www.wersee.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const corsHeaders = (request: Request) => {
  const origin = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": allowedOrigins.has(origin) ? origin : "https://wersee.com",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
};

const json = (request: Request, body: JsonRecord, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "content-type": "application/json" },
  });

const providerError = (payload: any, fallback: string) =>
  String(payload?.message || payload?.error?.message || payload?.error || fallback).slice(0, 500);

const resendRequest = async (path: string, init: RequestInit = {}) => {
  if (!RESEND_API_KEY) throw new Error("Email domain provider is not configured.");
  const response = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(providerError(payload, "Email domain provider request failed."));
  return payload;
};

const vercelRequest = async (path: string, init: RequestInit = {}) => {
  if (!VERCEL_TOKEN) throw new Error("Automatic Wersee DNS is not configured.");
  const separator = path.includes("?") ? "&" : "?";
  const teamQuery = VERCEL_TEAM_ID ? `${separator}teamId=${encodeURIComponent(VERCEL_TEAM_ID)}` : "";
  const response = await fetch(`https://api.vercel.com${path}${teamQuery}`, {
    ...init,
    headers: {
      authorization: `Bearer ${VERCEL_TOKEN}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 409) {
    throw new Error(providerError(payload, "Wersee DNS request failed."));
  }
  return { payload, status: response.status };
};

const normalizeDomain = (value: unknown) =>
  String(value || "").trim().toLowerCase().replace(/\.$/, "");

const isDomainName = (value: string) =>
  value.length <= 253 &&
  value.includes(".") &&
  value.split(".").every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
  );

const providerRecords = (domain: any): DnsRecord[] =>
  (Array.isArray(domain?.records) ? domain.records : [])
    .filter((record: any) => record?.name && record?.type && record?.value)
    .map((record: any) => ({
      record: String(record.record || ""),
      name: String(record.name),
      type: String(record.type).toUpperCase(),
      value: String(record.value),
      priority: record.priority == null ? undefined : Number(record.priority),
      status: String(record.status || "not_started"),
      ttl: record.ttl,
    }));

const recordNameForRootZone = (recordName: string, domainName: string) => {
  const normalizedRecord = recordName.toLowerCase().replace(/\.$/, "");
  const normalizedDomain = domainName.toLowerCase().replace(/\.$/, "");
  const workspacePrefix = normalizedDomain.slice(0, -(ROOT_DOMAIN.length + 1));
  if (normalizedRecord === normalizedDomain) return workspacePrefix;
  if (normalizedRecord.endsWith(`.${normalizedDomain}`)) {
    return `${normalizedRecord.slice(0, -(normalizedDomain.length + 1))}.${workspacePrefix}`;
  }
  return `${normalizedRecord}.${workspacePrefix}`;
};

const configureWerseeDns = async (domainName: string, records: DnsRecord[]) => {
  if (!domainName.endsWith(`.${ROOT_DOMAIN}`)) {
    throw new Error("Only Wersee subdomains can use automatic DNS.");
  }

  const listed = await vercelRequest(
    `/v5/domains/${encodeURIComponent(ROOT_DOMAIN)}/records?limit=1000`,
  );
  const existing = Array.isArray(listed.payload?.records) ? listed.payload.records : [];
  const configured: DnsRecord[] = [];

  for (const record of records) {
    const name = recordNameForRootZone(record.name, domainName);
    const same = existing.find((item: any) =>
      String(item.name || "").toLowerCase() === name.toLowerCase() &&
      String(item.type || item.recordType || "").toUpperCase() === record.type &&
      String(item.value || "").replace(/\.$/, "") === record.value.replace(/\.$/, "")
    );
    if (same) {
      configured.push({ ...record, vercel_record_id: String(same.id || same.uid || "") });
      continue;
    }

    const conflict = existing.find((item: any) =>
      String(item.name || "").toLowerCase() === name.toLowerCase() &&
      String(item.type || item.recordType || "").toUpperCase() === record.type
    );
    if (conflict) throw new Error(`A conflicting ${record.type} record already exists for ${name}.`);

    const requestBody: JsonRecord = {
      name,
      type: record.type,
      value: record.value,
      ttl: 60,
      comment: `Wersee Mail verification for ${domainName}`,
    };
    if (record.type === "MX" && Number.isFinite(record.priority)) {
      requestBody.mxPriority = record.priority;
    }
    const created = await vercelRequest(
      `/v2/domains/${encodeURIComponent(ROOT_DOMAIN)}/records`,
      { method: "POST", body: JSON.stringify(requestBody) },
    );
    configured.push({
      ...record,
      vercel_record_id: String(created.payload?.uid || created.payload?.id || ""),
    });
  }
  return configured;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Email domain service is not configured.");
    }
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return json(request, { error: "Sign in to manage email domains." }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return json(request, { error: "Your session is no longer valid." }, 401);
    }
    const user = authData.user;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");

    const { data: mailbox, error: mailboxError } = await admin
      .from("workspace_email_accounts")
      .select("id,user_id,local_part,workspace_slug,requested_alias,sending_address,identity_id,status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (mailboxError) throw mailboxError;
    if (!mailbox) return json(request, { error: "Create your Wersee mailbox first." }, 409);

    const activateDomain = async (domainRow: any, providerDomain: any) => {
      if (String(providerDomain?.status) !== "verified") return mailbox;
      const targetAddress = `${mailbox.local_part}@${domainRow.domain_name}`;
      const { data: identity, error: identityReadError } = await admin
        .from("mail_bridge_identities")
        .select("id,provider_config")
        .eq("id", mailbox.identity_id)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (identityReadError) throw identityReadError;
      if (!identity) throw new Error("The mailbox identity could not be found.");

      const { error: identityError } = await admin
        .from("mail_bridge_identities")
        .update({
          email: targetAddress,
          provider_config: {
            ...(identity.provider_config || {}),
            requested_alias: mailbox.requested_alias,
            domain_status: "verified",
            provider_domain_id: domainRow.provider_domain_id,
            address_mode: domainRow.kind === "wersee_subdomain"
              ? "verified_workspace_subdomain"
              : "verified_custom_domain",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", identity.id)
        .eq("owner_user_id", user.id);
      if (identityError) throw identityError;

      const { data: updatedMailbox, error: mailboxUpdateError } = await admin
        .from("workspace_email_accounts")
        .update({ sending_address: targetAddress, updated_at: new Date().toISOString() })
        .eq("id", mailbox.id)
        .eq("user_id", user.id)
        .select("id,user_id,local_part,workspace_slug,requested_alias,sending_address,identity_id,status")
        .single();
      if (mailboxUpdateError) throw mailboxUpdateError;

      await admin.from("workspace_email_domains")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("mailbox_account_id", mailbox.id)
        .neq("id", domainRow.id);
      await admin.from("workspace_email_domains")
        .update({
          is_primary: true,
          verified_at: domainRow.verified_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", domainRow.id)
        .eq("user_id", user.id);
      return updatedMailbox;
    };

    const syncDomain = async (domainRow: any, activate = false) => {
      if (!domainRow.provider_domain_id) return { domain: domainRow, mailbox };
      const providerDomain = await resendRequest(`/domains/${domainRow.provider_domain_id}`);
      const status = String(providerDomain?.status || "not_started");
      const records = providerRecords(providerDomain).map((record) => {
        const previous = (domainRow.dns_records || []).find((item: DnsRecord) =>
          item.name === record.name && item.type === record.type && item.value === record.value
        );
        return { ...record, vercel_record_id: previous?.vercel_record_id };
      });
      const now = new Date().toISOString();
      const { data: updatedDomain, error: domainUpdateError } = await admin
        .from("workspace_email_domains")
        .update({
          status,
          capabilities: providerDomain?.capabilities || domainRow.capabilities,
          dns_records: records,
          last_error: null,
          last_synced_at: now,
          verified_at: status === "verified" ? (domainRow.verified_at || now) : domainRow.verified_at,
          updated_at: now,
        })
        .eq("id", domainRow.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (domainUpdateError) throw domainUpdateError;
      const updatedMailbox = activate || updatedDomain.kind === "wersee_subdomain"
        ? await activateDomain(updatedDomain, providerDomain)
        : mailbox;
      return { domain: updatedDomain, mailbox: updatedMailbox };
    };

    const createDomain = async (domainName: string, kind: "wersee_subdomain" | "custom_domain") => {
      const { data: existing } = await admin
        .from("workspace_email_domains")
        .select("*")
        .eq("domain_name", domainName)
        .maybeSingle();
      if (existing && existing.user_id !== user.id) throw new Error("This email domain is already in use.");
      if (existing?.provider_domain_id) return await syncDomain(existing, kind === "wersee_subdomain");

      let claim = existing;
      if (!claim) {
        const { data, error } = await admin.from("workspace_email_domains").insert({
          user_id: user.id,
          mailbox_account_id: mailbox.id,
          domain_name: domainName,
          kind,
          status: "creating",
          dns_automation_status: kind === "wersee_subdomain" ? "pending" : "manual",
        }).select("*").single();
        if (error) throw error;
        claim = data;
      }

      try {
        const providerDomain = await resendRequest("/domains", {
          method: "POST",
          body: JSON.stringify({
            name: domainName,
            region: "eu-west-1",
            tls: "enforced",
            capabilities: { sending: "enabled", receiving: "enabled" },
          }),
        });
        let records = providerRecords(providerDomain);
        let dnsAutomationStatus = "manual";
        if (kind === "wersee_subdomain") {
          records = await configureWerseeDns(domainName, records);
          dnsAutomationStatus = "configured";
        }
        const { data: saved, error: saveError } = await admin
          .from("workspace_email_domains")
          .update({
            provider_domain_id: providerDomain.id,
            status: providerDomain.status || "not_started",
            capabilities: providerDomain.capabilities || { sending: "enabled", receiving: "enabled" },
            dns_records: records,
            dns_automation_status: dnsAutomationStatus,
            last_error: null,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", claim.id)
          .eq("user_id", user.id)
          .select("*")
          .single();
        if (saveError) throw saveError;
        await resendRequest(`/domains/${providerDomain.id}/verify`, { method: "POST" });
        return { domain: saved, mailbox };
      } catch (error) {
        await admin.from("workspace_email_domains").update({
          status: "failed",
          dns_automation_status: kind === "wersee_subdomain" ? "failed" : "manual",
          last_error: error instanceof Error ? error.message.slice(0, 500) : "Domain setup failed.",
          updated_at: new Date().toISOString(),
        }).eq("id", claim.id).eq("user_id", user.id);
        throw error;
      }
    };

    if (action === "provision-workspace") {
      const managedName = `${mailbox.workspace_slug}.${ROOT_DOMAIN}`;
      const result = await createDomain(managedName, "wersee_subdomain");
      return json(request, { success: true, ...result });
    }

    if (action === "create") {
      const domainName = normalizeDomain(body?.domain);
      if (!isDomainName(domainName)) {
        return json(request, { error: "Enter a valid domain or subdomain." }, 400);
      }
      if (domainName === ROOT_DOMAIN || domainName.endsWith(`.${ROOT_DOMAIN}`)) {
        return json(request, { error: "Wersee subdomains are created from your mailbox name." }, 400);
      }
      const result = await createDomain(domainName, "custom_domain");
      return json(request, { success: true, ...result });
    }

    if (action === "sync" || action === "activate") {
      const domainId = String(body?.domainId || "");
      const { data: domainRow, error: domainError } = await admin
        .from("workspace_email_domains")
        .select("*")
        .eq("id", domainId)
        .eq("user_id", user.id)
        .eq("mailbox_account_id", mailbox.id)
        .maybeSingle();
      if (domainError) throw domainError;
      if (!domainRow) return json(request, { error: "Email domain not found." }, 404);
      const result = await syncDomain(domainRow, action === "activate");
      if (action === "activate" && result.domain.status !== "verified") {
        return json(request, {
          error: "This domain is not verified yet. Add the DNS records and refresh the status first.",
          ...result,
        }, 409);
      }
      return json(request, { success: true, ...result });
    }

    if (action === "delete") {
      const domainId = String(body?.domainId || "");
      const { data: domainRow, error: domainError } = await admin
        .from("workspace_email_domains")
        .select("*")
        .eq("id", domainId)
        .eq("user_id", user.id)
        .eq("mailbox_account_id", mailbox.id)
        .maybeSingle();
      if (domainError) throw domainError;
      if (!domainRow) return json(request, { error: "Email domain not found." }, 404);
      if (domainRow.kind === "wersee_subdomain") {
        return json(request, { error: "Your Wersee mailbox domain cannot be deleted here." }, 400);
      }
      if (domainRow.is_primary) {
        return json(request, { error: "Switch to another verified sender before deleting this domain." }, 409);
      }
      if (domainRow.provider_domain_id) {
        await resendRequest(`/domains/${domainRow.provider_domain_id}`, { method: "DELETE" });
      }
      const { error: deleteError } = await admin.from("workspace_email_domains")
        .delete().eq("id", domainRow.id).eq("user_id", user.id);
      if (deleteError) throw deleteError;
      return json(request, { success: true });
    }

    if (action === "list") {
      const { data, error } = await admin.from("workspace_email_domains")
        .select("*")
        .eq("user_id", user.id)
        .eq("mailbox_account_id", mailbox.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return json(request, { success: true, domains: data || [], mailbox });
    }

    return json(request, { error: "Unknown email domain action." }, 400);
  } catch (error) {
    console.error("workspace-email-domains:", error instanceof Error ? error.message : error);
    return json(request, {
      error: error instanceof Error ? error.message : "Email domain setup failed.",
    }, 500);
  }
});
