import { z } from "zod";
import type { ToolContext, WerseeAiTool } from "../types.ts";

const listInput = z.object({ limit: z.number().int().min(1).max(100).default(30) }).strict();
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

const requireBusiness = (context: ToolContext) => {
  if (!context.business) throw new Error("BUSINESS_CONTEXT_REQUIRED");
  return context.business;
};

const businessDraftInput = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().min(20).max(4000),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
}).strict();

export const createBusinessDraftTool: WerseeAiTool<z.infer<typeof businessDraftInput>> = {
  name: "business.create_draft",
  description: "Create an incomplete private business workspace draft; it is not automatically published or connected to payments.",
  category: "business",
  riskLevel: "low",
  requiredScopes: ["create_business_drafts"],
  inputSchema: businessDraftInput,
  inputHint: "{name,description,countryCode?}",
  async preview(_context, input) {
    return { title: "Create business draft", summary: `Create an incomplete business workspace named “${input.name}”.`, affectedResources: [{ type: "business", label: input.name }], changes: [{ field: "setup_completed", before: null, after: false }], publicVisibility: false, estimatedCount: 1, reversible: false };
  },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("businesses").select("id,name,slug").eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Business draft ${existing.name} already exists.`, resource: { type: "business", id: existing.id, label: existing.name, route: "management-site" }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("businesses").insert({ user_id: context.user.id, name: input.name, description: input.description, country_code: input.countryCode || null, slug: `${slugify(input.name) || "business"}-${crypto.randomUUID().slice(0, 8)}`, setup_completed: false, site_content: {}, ai_generated_copy: input.description, ai_idempotency_key: idempotencyKey }).select("id,name,slug,description,setup_completed,country_code").single();
    if (error) throw error;
    return { summary: `Created incomplete business draft “${data.name}”.`, resource: { type: "business", id: data.id, label: data.name, route: "management-site" }, data: { business: data } };
  },
};

const businessCopyInput = z.object({
  name: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().min(20).max(4000).optional(),
  website: z.string().url().max(500).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one business field must change.");

export const updateBusinessCopyTool: WerseeAiTool<z.infer<typeof businessCopyInput>> = {
  name: "business.update_public_copy",
  description: "Update selected public business copy after showing a field-level preview.",
  category: "business",
  riskLevel: "high",
  requiredScopes: ["edit_business"],
  alwaysConfirm: true,
  inputSchema: businessCopyInput,
  inputHint: "{name?,description?,website?}",
  async preview(context, input) {
    const business = requireBusiness(context);
    const { data, error } = await context.userClient.from("businesses").select("id,name,description,website").eq("id", business.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("BUSINESS_NOT_FOUND");
    return { title: "Update public business copy", summary: `Update ${Object.keys(input).length} public field${Object.keys(input).length === 1 ? "" : "s"} for ${data.name}.`, business: { id: data.id, name: data.name }, affectedResources: [{ type: "business", id: data.id, label: data.name }], changes: Object.entries(input).map(([field, after]) => ({ field, before: (data as any)[field], after })), publicVisibility: true, estimatedCount: 1, reversible: true, confirmationText: "Confirm these public storefront changes." };
  },
  async execute(context, input) {
    const business = requireBusiness(context);
    const { data: current, error: currentError } = await context.userClient.from("businesses").select("id,name,description,website").eq("id", business.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new Error("BUSINESS_NOT_FOUND");
    const patch = { ...input, ...(input.description !== undefined ? { ai_generated_copy: input.description } : {}) };
    const undo = Object.fromEntries(Object.keys(input).map((field) => [field, (current as any)[field]]));
    const { data, error } = await context.userClient.from("businesses").update(patch).eq("id", business.id).select("id,name,description,website").single();
    if (error) throw error;
    return { summary: `Updated public copy for ${data.name}.`, resource: { type: "business", id: data.id, label: data.name, route: "management-site" }, data: { business: data, undo: { businessId: data.id, patch: undo } } };
  },
  createUndoOperation(result) {
    const undo = result.data?.undo;
    return undo && typeof undo === "object" ? { toolName: "business.update_public_copy", input: undo as Record<string, unknown>, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const parsed = z.object({ businessId: z.string().uuid(), patch: z.record(z.string(), z.unknown()) }).parse(payload);
    const business = requireBusiness(context);
    if (parsed.businessId !== business.id) throw new Error("BUSINESS_ACCESS_DENIED");
    const { data, error } = await context.userClient.from("businesses").update(parsed.patch).eq("id", business.id).select("id,name").single();
    if (error) throw error;
    return { summary: `Restored the previous public copy for ${data.name}.`, resource: { type: "business", id: data.id, label: data.name, route: "management-site" } };
  },
};

const communityDraftInput = z.object({
  name: z.string().trim().min(3).max(140),
  description: z.string().trim().min(20).max(4000),
  rules: z.string().trim().max(6000).optional(),
  privacyLevel: z.enum(["private", "members", "public"]).default("private"),
}).strict();

export const createCommunityDraftTool: WerseeAiTool<z.infer<typeof communityDraftInput>> = {
  name: "communities.create_draft",
  description: "Create a private owned community draft with optional rules; no invitations or announcements are sent.",
  category: "communities",
  riskLevel: "low",
  requiredScopes: ["create_community_drafts"],
  inputSchema: communityDraftInput,
  inputHint: "{name,description,rules?,privacyLevel?}",
  async preview(_context, input) {
    return { title: "Create community draft", summary: `Create “${input.name}” as a private community draft.`, affectedResources: [{ type: "community", label: input.name }], changes: [{ field: "is_private", before: null, after: true }], publicVisibility: false, estimatedCount: 1, reversible: false };
  },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("communities").select("id,name").eq("owner_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Community draft ${existing.name} already exists.`, resource: { type: "community", id: existing.id, label: existing.name, route: "communities" }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("communities").insert({ owner_id: context.user.id, name: input.name, description: input.description, rules: input.rules || null, privacy_level: input.privacyLevel, is_private: true, settings: { ai_draft: true }, invite_code: crypto.randomUUID().replaceAll("-", "").slice(0, 12), ai_idempotency_key: idempotencyKey }).select("id,name,description,rules,privacy_level,is_private").single();
    if (error) throw error;
    return { summary: `Created private community draft “${data.name}”.`, resource: { type: "community", id: data.id, label: data.name, route: "communities" }, data: { community: data } };
  },
};

const communityUpdateInput = z.object({
  communityId: z.string().uuid(),
  patch: z.object({ name: z.string().trim().min(3).max(140).optional(), description: z.string().trim().min(20).max(4000).optional(), rules: z.string().trim().max(6000).nullable().optional(), privacyLevel: z.enum(["private", "members", "public"]).optional() }).strict().refine((value) => Object.keys(value).length > 0),
}).strict();

export const updateCommunityTool: WerseeAiTool<z.infer<typeof communityUpdateInput>> = {
  name: "communities.update",
  description: "Update selected owned-community settings after approval.",
  category: "communities",
  riskLevel: "medium",
  requiredScopes: ["edit_communities"],
  inputSchema: communityUpdateInput,
  inputHint: "{communityId,patch:{name?,description?,rules?,privacyLevel?}}",
  async preview(context, input) {
    const { data, error } = await context.userClient.from("communities").select("id,name,description,rules,privacy_level").eq("id", input.communityId).eq("owner_id", context.user.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("COMMUNITY_NOT_FOUND");
    return { title: "Update community", summary: `Update ${Object.keys(input.patch).length} setting${Object.keys(input.patch).length === 1 ? "" : "s"} for “${data.name}”.`, affectedResources: [{ type: "community", id: data.id, label: data.name }], changes: Object.entries(input.patch).map(([field, after]) => ({ field, before: field === "privacyLevel" ? data.privacy_level : (data as any)[field], after })), publicVisibility: input.patch.privacyLevel === "public", estimatedCount: 1, reversible: true };
  },
  async execute(context, input) {
    const { data: current, error: currentError } = await context.userClient.from("communities").select("id,name,description,rules,privacy_level,is_private").eq("id", input.communityId).eq("owner_id", context.user.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new Error("COMMUNITY_NOT_FOUND");
    const patch: Record<string, unknown> = {};
    if (input.patch.name !== undefined) patch.name = input.patch.name;
    if (input.patch.description !== undefined) patch.description = input.patch.description;
    if (input.patch.rules !== undefined) patch.rules = input.patch.rules;
    if (input.patch.privacyLevel !== undefined) { patch.privacy_level = input.patch.privacyLevel; patch.is_private = input.patch.privacyLevel !== "public"; }
    const undo = Object.fromEntries(Object.keys(patch).map((field) => [field, (current as any)[field]]));
    const { data, error } = await context.userClient.from("communities").update(patch).eq("id", input.communityId).eq("owner_id", context.user.id).select("id,name,description,rules,privacy_level,is_private").single();
    if (error) throw error;
    return { summary: `Updated “${data.name}”.`, resource: { type: "community", id: data.id, label: data.name, route: "communities" }, data: { community: data, undo: { communityId: data.id, patch: undo } } };
  },
  createUndoOperation(result) {
    const undo = result.data?.undo;
    return undo && typeof undo === "object" ? { toolName: "communities.update", input: undo as Record<string, unknown>, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const parsed = z.object({ communityId: z.string().uuid(), patch: z.record(z.string(), z.unknown()) }).parse(payload);
    const { data, error } = await context.userClient.from("communities").update(parsed.patch).eq("id", parsed.communityId).eq("owner_id", context.user.id).select("id,name").single();
    if (error) throw error;
    return { summary: `Restored the previous settings for “${data.name}”.`, resource: { type: "community", id: data.id, label: data.name, route: "communities" } };
  },
};

const orderListInput = z.object({ status: z.string().trim().min(1).max(80).optional(), limit: z.number().int().min(1).max(100).default(30) }).strict();
const safeOrderSelect = "id,created_at,buyer_id,listing_id,amount,total_amount,currency,status,payment_status,shipping_status,refund_status,dispute_status,risk_status,customer_email,buyer_email,listing:listings(title)";

export const listOrdersTool: WerseeAiTool<z.infer<typeof orderListInput>> = {
  name: "orders.list",
  description: "Search real seller orders with safe operational fields and without payment-provider identifiers, IP addresses, or bank/card data.",
  category: "orders",
  riskLevel: "read",
  requiredScopes: ["read_orders"],
  inputSchema: orderListInput,
  inputHint: "{status?: string,limit?: 1..100}",
  async execute(context, input) {
    let query = context.userClient.from("orders").select(safeOrderSelect).eq("seller_id", context.user.id);
    if (input.status) query = query.eq("status", input.status);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} order${data?.length === 1 ? "" : "s"}.`, data: { orders: data || [] }, dataSource: ["public.orders", "public.listings"] };
  },
};

const orderInput = z.object({ orderId: z.string().uuid() }).strict();
export const getOrderTool: WerseeAiTool<z.infer<typeof orderInput>> = {
  name: "orders.get",
  description: "Read and summarize one order owned by the seller without raw provider, IP, or payment credentials.",
  category: "orders",
  riskLevel: "read",
  requiredScopes: ["read_orders"],
  inputSchema: orderInput,
  inputHint: "{orderId: uuid}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("orders").select(safeOrderSelect).eq("id", input.orderId).eq("seller_id", context.user.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("ORDER_NOT_FOUND");
    return { summary: `Order ${data.id} is ${data.status || data.payment_status || "unknown"}; shipping is ${data.shipping_status || "not set"}.`, resource: { type: "order", id: data.id, label: `Order ${data.id}`, route: "management-orders" }, data: { order: data }, dataSource: ["public.orders", "public.listings"] };
  },
};

export const ordersNeedingAttentionTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "orders.needing_attention",
  description: "Find seller orders with disputes, refunds, risk flags, pending payment, or unresolved shipping state.",
  category: "orders",
  riskLevel: "read",
  requiredScopes: ["read_orders"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("orders").select(safeOrderSelect).eq("seller_id", context.user.id).order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    const attention = (data || []).filter((order: any) => (order.dispute_status && !["none", "resolved", "closed"].includes(order.dispute_status)) || (order.refund_status && !["none", "not_refunded", "completed"].includes(order.refund_status)) || (order.risk_status && !["normal", "approved", "clear"].includes(order.risk_status)) || ["pending", "failed"].includes(order.payment_status) || (["paid", "completed"].includes(order.payment_status || order.status) && !["shipped", "delivered"].includes(order.shipping_status))).slice(0, input.limit);
    return { summary: `${attention.length} order${attention.length === 1 ? " needs" : "s need"} attention.`, data: { orders: attention }, dataSource: ["public.orders"] };
  },
};

const shippingInput = z.object({ orderId: z.string().uuid(), shippingStatus: z.enum(["preparing", "shipped", "delivered", "delivery_failed", "returned"]) }).strict();
export const updateOrderShippingTool: WerseeAiTool<z.infer<typeof shippingInput>> = {
  name: "orders.update_shipping_status",
  description: "Update only the non-financial shipping status of an owned order after approval.",
  category: "orders",
  riskLevel: "medium",
  requiredScopes: ["update_orders"],
  inputSchema: shippingInput,
  inputHint: "{orderId: uuid,shippingStatus: preparing|shipped|delivered|delivery_failed|returned}",
  async preview(context, input) {
    const { data, error } = await context.userClient.from("orders").select("id,shipping_status,listing:listings(title)").eq("id", input.orderId).eq("seller_id", context.user.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("ORDER_NOT_FOUND");
    return { title: "Update shipping status", summary: `Change shipping status to ${input.shippingStatus}.`, affectedResources: [{ type: "order", id: data.id, label: `Order ${data.id}` }], changes: [{ field: "shipping_status", before: data.shipping_status, after: input.shippingStatus }], publicVisibility: false, estimatedCount: 1, reversible: true };
  },
  async execute(context, input) {
    const { data: current, error: currentError } = await context.userClient.from("orders").select("id,shipping_status").eq("id", input.orderId).eq("seller_id", context.user.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new Error("ORDER_NOT_FOUND");
    const { data, error } = await context.userClient.from("orders").update({ shipping_status: input.shippingStatus, updated_at: new Date().toISOString() }).eq("id", input.orderId).eq("seller_id", context.user.id).select("id,shipping_status").single();
    if (error) throw error;
    return { summary: `Order shipping status is now ${data.shipping_status}.`, resource: { type: "order", id: data.id, label: `Order ${data.id}`, route: "management-orders" }, data: { order: data, undo: { orderId: data.id, shippingStatus: current.shipping_status } } };
  },
  createUndoOperation(result) {
    const undo = result.data?.undo;
    return undo && typeof undo === "object" ? { toolName: "orders.update_shipping_status", input: undo as Record<string, unknown>, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const parsed = z.object({ orderId: z.string().uuid(), shippingStatus: z.string().nullable() }).parse(payload);
    const { data, error } = await context.userClient.from("orders").update({ shipping_status: parsed.shippingStatus, updated_at: new Date().toISOString() }).eq("id", parsed.orderId).eq("seller_id", context.user.id).select("id,shipping_status").single();
    if (error) throw error;
    return { summary: "Restored the previous shipping status.", resource: { type: "order", id: data.id, label: `Order ${data.id}`, route: "management-orders" } };
  },
};

export const listAdsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "ads.campaigns.list",
  description: "List the authenticated user's real ad campaign records without launching or funding campaigns.",
  category: "ads",
  riskLevel: "read",
  requiredScopes: ["read_ads"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("ads_campaigns").select("id,title,budget_daily,status,type,targeting,created_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} ad campaign${data?.length === 1 ? "" : "s"}.`, data: { campaigns: data || [] }, dataSource: ["public.ads_campaigns"] };
  },
};

const adDraftInput = z.object({ title: z.string().trim().min(3).max(160), type: z.string().trim().min(2).max(80), dailyBudget: z.number().finite().min(1).max(100000), targeting: z.record(z.string(), z.unknown()).default({}) }).strict();
export const createAdDraftTool: WerseeAiTool<z.infer<typeof adDraftInput>> = {
  name: "ads.campaigns.create_draft",
  description: "Create an inactive internal ad campaign draft; it never launches or charges money.",
  category: "ads",
  riskLevel: "low",
  requiredScopes: ["create_ad_drafts"],
  inputSchema: adDraftInput,
  inputHint: "{title,type,dailyBudget,targeting}",
  async preview(_context, input) {
    return { title: "Create ad draft", summary: `Create inactive ad draft “${input.title}” with a daily budget of ${input.dailyBudget}.`, affectedResources: [{ type: "ad_campaign", label: input.title }], changes: [{ field: "status", before: null, after: "draft" }], financial: { amount: input.dailyBudget, currency: "EUR" }, publicVisibility: false, estimatedCount: 1, reversible: false };
  },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("ads_campaigns").select("id,title").eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Ad draft ${existing.title} already exists.`, resource: { type: "ad_campaign", id: existing.id, label: existing.title, route: "management-ads" }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("ads_campaigns").insert({ user_id: context.user.id, title: input.title, type: input.type, budget_daily: input.dailyBudget, targeting: input.targeting, status: "draft", ai_idempotency_key: idempotencyKey }).select("id,title,type,budget_daily,targeting,status").single();
    if (error) throw error;
    return { summary: `Created inactive ad draft “${data.title}”.`, resource: { type: "ad_campaign", id: data.id, label: data.title, route: "management-ads" }, data: { campaign: data } };
  },
};

export const affiliatePerformanceTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "affiliates.performance",
  description: "Summarize real seller affiliate programs, enrolled affiliates, and recorded earnings without exposing payout account identifiers.",
  category: "affiliates",
  riskLevel: "read",
  requiredScopes: ["read_affiliates"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data: programs, error: programsError } = await context.userClient.from("affiliate_programs").select("id,listing_id,commission_percentage,is_active,budget,remaining_budget,terms,created_at,listing:listings(title)").eq("seller_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (programsError) throw programsError;
    const ids = (programs || []).map((program: any) => program.id);
    let affiliates: any[] = [];
    if (ids.length) {
      const { data, error } = await context.userClient.from("affiliates").select("id,program_id,status,total_earnings,created_at").in("program_id", ids).limit(5000);
      if (error) throw error;
      affiliates = data || [];
    }
    const rows = (programs || []).map((program: any) => { const members = affiliates.filter((affiliate) => affiliate.program_id === program.id); return { ...program, affiliates: members.length, activeAffiliates: members.filter((affiliate) => affiliate.status === "active").length, recordedEarnings: members.reduce((sum, affiliate) => sum + Number(affiliate.total_earnings || 0), 0) }; });
    return { summary: `${rows.length} affiliate program${rows.length === 1 ? "" : "s"} with ${affiliates.length} enrolled affiliate${affiliates.length === 1 ? "" : "s"}.`, data: { programs: rows }, dataSource: ["public.affiliate_programs", "public.affiliates", "public.listings"] };
  },
};

export const automationHealthTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "automations.health",
  description: "Inspect real execution logs for owned automations and identify recent failures.",
  category: "automations",
  riskLevel: "read",
  requiredScopes: ["read_automations"],
  inputSchema: listInput,
  inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data: automations, error: automationsError } = await context.userClient.from("automations").select("id,name,is_active").eq("user_id", context.user.id).limit(500);
    if (automationsError) throw automationsError;
    const ids = (automations || []).map((automation: any) => automation.id);
    if (!ids.length) return { summary: "No automations were found.", data: { automations: [], failures: [] }, dataSource: ["public.automations"] };
    const { data: logs, error } = await context.userClient.from("automation_logs").select("id,automation_id,status,details,created_at").in("automation_id", ids).order("created_at", { ascending: false }).limit(Math.min(1000, input.limit * 10));
    if (error) throw error;
    const names = new Map((automations || []).map((automation: any) => [automation.id, automation.name]));
    const failures = (logs || []).filter((log: any) => ["failed", "error"].includes(String(log.status).toLowerCase())).slice(0, input.limit).map((log: any) => ({ ...log, automationName: names.get(log.automation_id) }));
    return { summary: `${failures.length} recent failed automation run${failures.length === 1 ? "" : "s"} found.`, data: { automations: automations || [], failures }, dataSource: ["public.automations", "public.automation_logs"] };
  },
};

export const operationsTools = [
  createBusinessDraftTool,
  updateBusinessCopyTool,
  createCommunityDraftTool,
  updateCommunityTool,
  listOrdersTool,
  getOrderTool,
  ordersNeedingAttentionTool,
  updateOrderShippingTool,
  listAdsTool,
  createAdDraftTool,
  affiliatePerformanceTool,
  automationHealthTool,
] satisfies WerseeAiTool[];
