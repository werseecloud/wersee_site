import { z } from "zod";
import type { WerseeAiTool } from "../types.ts";

const emptyInput = z.object({}).strict();

export const getBusinessTool: WerseeAiTool<Record<string, never>> = {
  name: "business.get",
  description: "Read the selected business's non-secret public setup and storefront fields.",
  category: "business",
  riskLevel: "read",
  requiredScopes: ["read_business"],
  inputSchema: emptyInput,
  inputHint: "{}",
  async execute(context) {
    if (!context.business) throw new Error("BUSINESS_CONTEXT_REQUIRED");
    const { data, error } = await context.userClient.from("businesses")
      .select("id,name,slug,description,website,logo_url,setup_completed,stripe_connected,site_content,ai_generated_copy,country_code,kyb_status,dsa_verification_status")
      .eq("id", context.business.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("BUSINESS_NOT_FOUND");
    return { summary: `Loaded ${data.name}.`, resource: { type: "business", id: data.id, label: data.name, route: "management-site" }, data: { business: data }, dataSource: ["public.businesses"] };
  },
};

const listInput = z.object({ limit: z.number().int().min(1).max(100).default(30) }).strict();
export const listCommunitiesTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "communities.list",
  description: "List communities owned by the authenticated user.",
  category: "communities",
  riskLevel: "read",
  requiredScopes: ["read_communities"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("communities")
      .select("id,name,description,is_private,privacy_level,created_at")
      .eq("owner_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} owned communit${data?.length === 1 ? "y" : "ies"}.`, data: { communities: data || [] }, dataSource: ["public.communities"] };
  },
};

export const listAutomationsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "automations.list",
  description: "List the authenticated user's real Wersee automations.",
  category: "automations",
  riskLevel: "read",
  requiredScopes: ["read_automations"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("automations")
      .select("id,name,type,trigger_event,action_payload,is_active,created_at")
      .eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} automation${data?.length === 1 ? "" : "s"}.`, data: { automations: data || [] }, dataSource: ["public.automations"] };
  },
};

const automationDraftInput = z.object({
  name: z.string().trim().min(3).max(160),
  trigger: z.object({ event: z.string().trim().min(1).max(120), configuration: z.record(z.string(), z.unknown()).default({}) }).strict(),
  conditions: z.array(z.object({ field: z.string().max(120), operator: z.string().max(60), value: z.unknown() }).strict()).max(20).default([]),
  actions: z.array(z.object({ type: z.string().trim().min(1).max(120), configuration: z.record(z.string(), z.unknown()).default({}) }).strict()).min(1).max(20),
}).strict();

export const createAutomationDraftTool: WerseeAiTool<z.infer<typeof automationDraftInput>> = {
  name: "automations.create_draft",
  description: "Create an inactive, editable structured automation draft from a validated trigger, conditions, and actions.",
  category: "automations",
  riskLevel: "low",
  requiredScopes: ["create_automation_drafts"],
  inputSchema: automationDraftInput,
  inputHint: "{name, trigger:{event,configuration?}, conditions:[{field,operator,value}], actions:[{type,configuration?}]}",
  async preview(context, input) {
    return {
      title: "Create automation draft",
      summary: `Create inactive workflow “${input.name}” with ${input.actions.length} action${input.actions.length === 1 ? "" : "s"}.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "automation", label: input.name }],
      changes: [{ field: "trigger", before: null, after: input.trigger.event }, { field: "active", before: null, after: false }],
      publicVisibility: false,
      estimatedCount: 1,
      reversible: true,
    };
  },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("automations").select("id,name")
      .eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Automation draft ${existing.name} already exists.`, resource: { type: "automation", id: existing.id, label: existing.name, route: "management-automations" }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("automations").insert({
      user_id: context.user.id,
      name: input.name,
      type: "workflow",
      trigger_event: input.trigger.event,
      action_payload: { trigger: input.trigger, conditions: input.conditions, actions: input.actions, ai_draft: true, schema_version: 1 },
      is_active: false,
      ai_idempotency_key: idempotencyKey,
    }).select("id,name,type,trigger_event,action_payload,is_active").single();
    if (error) throw error;
    return { summary: `Created inactive automation draft “${data.name}”.`, resource: { type: "automation", id: data.id, label: data.name, route: "management-automations" }, data: { automation: data } };
  },
};

const storageInput = z.object({ path: z.string().trim().max(500).default(""), limit: z.number().int().min(1).max(100).default(50) }).strict()
  .refine((input) => !input.path.split("/").includes(".."), "Parent-directory paths are not allowed.");
export const listStorageTool: WerseeAiTool<z.infer<typeof storageInput>> = {
  name: "storage.list",
  description: "List permitted Wersee Storage files and folders under the authenticated user's prefix.",
  category: "storage",
  riskLevel: "read",
  requiredScopes: ["read_storage"],
  inputSchema: storageInput,
  inputHint: "{path?: relative path without .., limit?: 1..100}",
  async execute(context, input) {
    const relative = input.path.replace(/^\/+|\/+$/g, "");
    const path = [context.user.id, relative].filter(Boolean).join("/");
    const { data, error } = await context.userClient.storage.from("business_storage").list(path, { limit: input.limit, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    const files = (data || []).filter((item) => item.name !== ".emptyFolderPlaceholder").map((item) => ({ name: item.name, id: item.id, isFolder: !item.id, createdAt: item.created_at, metadata: item.metadata ? { size: item.metadata.size, mimetype: item.metadata.mimetype } : null }));
    return { summary: `Found ${files.length} item${files.length === 1 ? "" : "s"} in ${relative || "Storage"}.`, data: { path: relative, files }, dataSource: ["storage.business_storage"] };
  },
};

export const listTeamTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "team.list",
  description: "List team members and roles for the selected business without exposing financial or credential fields.",
  category: "team",
  riskLevel: "read",
  requiredScopes: ["read_team"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    if (!context.business) throw new Error("BUSINESS_CONTEXT_REQUIRED");
    const { data, error } = await context.userClient.from("team_members")
      .select("id,user_id,email,role,status,invited_at,joined_at")
      .eq("business_id", context.business.id).order("invited_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} team member${data?.length === 1 ? "" : "s"}.`, data: { members: data || [] }, dataSource: ["public.team_members"] };
  },
};

export const listPaymentLinksTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "money.payment_links.list",
  description: "List payment links owned by the authenticated user without exposing Stripe account identifiers.",
  category: "money",
  riskLevel: "read",
  requiredScopes: ["read_payments"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("quick_pay_links")
      .select("id,name,slug,product_name,description,price,currency,active,status,total_revenue,total_sales,total_clicks,created_at")
      .eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} payment link${data?.length === 1 ? "" : "s"}.`, data: { paymentLinks: data || [] }, dataSource: ["public.quick_pay_links"] };
  },
};

const createPaymentLinkInput = z.object({
  name: z.string().trim().min(3).max(160),
  productName: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).default(""),
  price: z.number().finite().min(0.5).max(1000000),
  currency: z.string().trim().length(3).transform((value) => value.toLowerCase()).default("eur"),
}).strict();

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export const createPaymentLinkTool: WerseeAiTool<z.infer<typeof createPaymentLinkInput>> = {
  name: "money.payment_links.create",
  description: "Create a real Wersee Quick Pay link after explicit approval, with idempotency protection.",
  category: "money",
  riskLevel: "high",
  requiredScopes: ["create_payment_objects", "financial_commitments"],
  alwaysConfirm: true,
  inputSchema: createPaymentLinkInput,
  inputHint: "{name, productName, description?, price, currency: ISO-4217}",
  async preview(context, input) {
    return {
      title: "Create payment link",
      summary: `Create a payment link for ${input.productName}.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "payment_link", label: input.name }],
      changes: [{ field: "product", before: null, after: input.productName }, { field: "price", before: null, after: input.price }],
      financial: { amount: input.price, currency: input.currency.toUpperCase() },
      publicVisibility: true,
      estimatedCount: 1,
      reversible: true,
      confirmationText: `Confirm creation of a ${input.currency.toUpperCase()} ${input.price.toFixed(2)} payment link.`,
    };
  },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("quick_pay_links").select("id,name,slug")
      .eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Payment link ${existing.name} already exists.`, resource: { type: "payment_link", id: existing.id, label: existing.name, route: "money-payment-links" }, data: { slug: existing.slug, idempotentReplay: true } };

    const [{ data: profile }, { data: businessInfo }] = await Promise.all([
      context.userClient.from("profiles").select("username,stripe_account_id").eq("id", context.user.id).maybeSingle(),
      context.userClient.from("business_info").select("stripe_account_id").eq("user_id", context.user.id).maybeSingle(),
    ]);
    const stripeAccountId = profile?.stripe_account_id || businessInfo?.stripe_account_id;
    if (!stripeAccountId) throw new Error("STRIPE_CONNECTION_REQUIRED");
    const username = profile?.username || context.user.email?.split("@")[0] || "seller";
    const slug = `${slugify(input.name) || "payment"}-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await context.userClient.from("quick_pay_links").insert({
      user_id: context.user.id,
      username,
      name: input.name,
      slug,
      product_name: input.productName,
      description: input.description,
      price: input.price,
      currency: input.currency,
      environment: "live",
      stripe_account_id: stripeAccountId,
      settings: { pricing_type: "fixed", created_via: "wersee_ai", is_sandbox: false },
      active: true,
      status: "active",
      ai_idempotency_key: idempotencyKey,
    }).select("id,name,slug,product_name,price,currency,active").single();
    if (error) throw error;
    return { summary: `Created payment link “${data.name}”.`, resource: { type: "payment_link", id: data.id, label: data.name, route: "money-payment-links" }, data: { paymentLink: data } };
  },
};

export const listInvoicesTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "money.invoices.list",
  description: "List invoices owned by the authenticated user with customer, amount, currency, due status, and dates.",
  category: "money",
  riskLevel: "read",
  requiredScopes: ["read_invoices"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("invoices")
      .select("id,invoice_number,customer_name,customer_email,amount,currency,status,items,memo,created_at,paid_at")
      .eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} invoice${data?.length === 1 ? "" : "s"}.`, data: { invoices: data || [] }, dataSource: ["public.invoices"] };
  },
};

const navigationInput = z.object({ destination: z.enum(["products", "analytics", "money_setup", "payment_links", "invoices", "communities", "storage", "automations", "developer", "team", "business_site", "orders", "ads", "affiliates", "email"]) }).strict();
const routeByDestination: Record<z.infer<typeof navigationInput>["destination"], string> = {
  products: "management-products", analytics: "management-analytics", money_setup: "money-setup", payment_links: "money-payment-links",
  invoices: "money-invoices", communities: "communities", storage: "storage", automations: "management-automations", developer: "management-developer", team: "management-team",
  business_site: "management-site", orders: "management-orders", ads: "management-ads", affiliates: "management-affiliates", email: "management-emails",
};
export const navigationTool: WerseeAiTool<z.infer<typeof navigationInput>> = {
  name: "navigation.open",
  description: "Open a known internal Wersee workspace destination through the client allowlist.",
  category: "navigation",
  riskLevel: "read",
  requiredScopes: [],
  inputSchema: navigationInput,
  inputHint: "{destination: products|analytics|money_setup|payment_links|invoices|communities|storage|automations|developer|team}",
  async execute(_context, input) {
    const route = routeByDestination[input.destination];
    return { summary: `Ready to open ${input.destination.replaceAll("_", " ")}.`, resource: { type: "navigation", id: input.destination, label: input.destination.replaceAll("_", " "), route }, data: { navigation: { destination: input.destination, route } } };
  },
};

export const workspaceTools = [
  getBusinessTool, listCommunitiesTool, listAutomationsTool, createAutomationDraftTool,
  listStorageTool, listTeamTool, listPaymentLinksTool, createPaymentLinkTool,
  listInvoicesTool, navigationTool,
] satisfies WerseeAiTool[];
