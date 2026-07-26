import { z } from "zod";
import type { ActionPreview, ToolContext, WerseeAiTool } from "../types.ts";

const listInput = z.object({ limit: z.number().int().min(1).max(100).default(30) }).strict();
const requireBusiness = (context: ToolContext) => {
  if (!context.business) throw new Error("BUSINESS_CONTEXT_REQUIRED");
  return context.business;
};
const draftPreview = (context: ToolContext, type: string, title: string, changes: ActionPreview["changes"] = []): ActionPreview => ({
  title: `Create ${type} draft`,
  summary: `Create an editable ${type} draft named "${title}". Nothing will be sent or published.`,
  business: context.business ? { id: context.business.id, name: context.business.name } : null,
  affectedResources: [{ type, label: title }],
  changes: [{ field: "status", before: null, after: "draft" }, ...(changes || [])],
  publicVisibility: false,
  estimatedCount: 1,
  reversible: false,
});

export const listProposalsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "proposals.list", description: "List proposals in the selected business.", category: "proposals", riskLevel: "read", requiredScopes: ["read_proposals"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const business = requireBusiness(context);
    const { data, error } = await context.userClient.from("proposals").select("id,client_id,title,description,type,pricing_type,total_amount,currency,status,start_date,end_date,valid_until,created_at,updated_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} proposal${data?.length === 1 ? "" : "s"}.`, data: { proposals: data || [] }, dataSource: ["public.proposals"] };
  },
};

const proposalInput = z.object({ title: z.string().trim().min(3).max(180), description: z.string().trim().min(10).max(10000), totalAmount: z.number().finite().min(0).max(10000000).default(0), currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("EUR"), pricingType: z.enum(["fixed", "hourly", "retainer", "milestone"]).default("fixed") }).strict();
export const createProposalDraftTool: WerseeAiTool<z.infer<typeof proposalInput>> = {
  name: "proposals.create_draft", description: "Create an unsent proposal draft in the selected business.", category: "proposals", riskLevel: "low", requiredScopes: ["create_proposal_drafts"], inputSchema: proposalInput, inputHint: "{title,description,totalAmount,currency,pricingType}",
  preview(context, input) { return Promise.resolve(draftPreview(context, "proposal", input.title, [{ field: "total", before: null, after: `${input.currency} ${input.totalAmount}` }])); },
  async execute(context, input, idempotencyKey) {
    const business = requireBusiness(context);
    const { data: existing } = await context.userClient.from("proposals").select("id,title").eq("business_id", business.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Proposal draft "${existing.title}" already exists.`, resource: { type: "proposal", id: existing.id, label: existing.title, route: `proposal-builder_${existing.id}` }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("proposals").insert({ business_id: business.id, title: input.title, description: input.description, type: "standard", pricing_type: input.pricingType, total_amount: input.totalAmount, currency: input.currency, status: "draft", ai_idempotency_key: idempotencyKey }).select("id,title,status,total_amount,currency").single();
    if (error) throw error;
    return { summary: `Created proposal draft "${data.title}".`, resource: { type: "proposal", id: data.id, label: data.title, route: `proposal-builder_${data.id}` }, data: { proposal: data } };
  },
};

export const listContractsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "contracts.list", description: "List contracts owned by the authenticated user.", category: "contracts", riskLevel: "read", requiredScopes: ["read_contracts"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("contracts").select("id,client_id,project_id,proposal_id,title,type,status,expires_at,signed_at,created_at,updated_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} contract${data?.length === 1 ? "" : "s"}.`, data: { contracts: data || [] }, dataSource: ["public.contracts"] };
  },
};

const contractInput = z.object({ title: z.string().trim().min(3).max(180), type: z.string().trim().min(1).max(80).default("service_agreement"), content: z.string().trim().min(20).max(30000) }).strict();
export const createContractDraftTool: WerseeAiTool<z.infer<typeof contractInput>> = {
  name: "contracts.create_draft", description: "Create an unsigned contract draft; never send or sign it automatically.", category: "contracts", riskLevel: "low", requiredScopes: ["create_contract_drafts"], inputSchema: contractInput, inputHint: "{title,type,content}",
  preview(context, input) { return Promise.resolve(draftPreview(context, "contract", input.title, [{ field: "type", before: null, after: input.type }])); },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("contracts").select("id,title").eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Contract draft "${existing.title}" already exists.`, resource: { type: "contract", id: existing.id, label: existing.title, route: `contract-builder_${existing.id}` }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("contracts").insert({ user_id: context.user.id, title: input.title, type: input.type, content: input.content, status: "draft", metadata: { created_via: "wersee_ai" }, ai_idempotency_key: idempotencyKey }).select("id,title,type,status").single();
    if (error) throw error;
    return { summary: `Created unsigned contract draft "${data.title}".`, resource: { type: "contract", id: data.id, label: data.title, route: `contract-builder_${data.id}` }, data: { contract: data } };
  },
};

export const listLeadsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "crm.leads.list", description: "List CRM leads owned by the authenticated user.", category: "crm", riskLevel: "read", requiredScopes: ["read_crm"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("scraped_leads").select("id,company_name,website,email,phone,category,description,created_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} lead${data?.length === 1 ? "" : "s"}.`, data: { leads: data || [] }, dataSource: ["public.scraped_leads"] };
  },
};

export const listCallsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "calls.list", description: "List call bookings for the selected business.", category: "calls", riskLevel: "read", requiredScopes: ["read_calls"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const business = requireBusiness(context);
    const { data, error } = await context.userClient.from("call_bookings").select("id,config_id,guest_email,guest_name,start_time,end_time,status,payment_status,meeting_link,notes,created_at,guest_count").eq("business_id", business.id).order("start_time", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} call booking${data?.length === 1 ? "" : "s"}.`, data: { calls: data || [] }, dataSource: ["public.call_bookings"] };
  },
};

const callConfigInput = z.object({ title: z.string().trim().min(3).max(160), description: z.string().trim().max(2000).default(""), durationMinutes: z.number().int().min(10).max(480).default(30), price: z.number().finite().min(0).max(100000), availability: z.record(z.string(), z.unknown()).default({}) }).strict();
export const createCallConfigDraftTool: WerseeAiTool<z.infer<typeof callConfigInput>> = {
  name: "calls.create_config_draft", description: "Create an inactive call-booking configuration draft.", category: "calls", riskLevel: "low", requiredScopes: ["create_call_drafts"], inputSchema: callConfigInput, inputHint: "{title,description?,durationMinutes,price,availability}",
  preview(context, input) { return Promise.resolve(draftPreview(context, "call configuration", input.title, [{ field: "duration", before: null, after: input.durationMinutes }, { field: "price", before: null, after: input.price }])); },
  async execute(context, input, idempotencyKey) {
    const business = requireBusiness(context);
    const { data: existing } = await context.userClient.from("call_configs").select("id,title").eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Call configuration draft "${existing.title}" already exists.`, resource: { type: "call_config", id: existing.id, label: existing.title, route: "management-calls" }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("call_configs").insert({ business_id: business.id, user_id: context.user.id, title: input.title, description: input.description, duration_minutes: input.durationMinutes, price: input.price, availability: input.availability, is_active: false, ai_idempotency_key: idempotencyKey }).select("id,title,duration_minutes,price,is_active").single();
    if (error) throw error;
    return { summary: `Created inactive call configuration draft "${data.title}".`, resource: { type: "call_config", id: data.id, label: data.title, route: "management-calls" }, data: { callConfig: data } };
  },
};

export const listFormsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "forms.list", description: "List forms owned by the authenticated user.", category: "forms", riskLevel: "read", requiredScopes: ["read_forms"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("forms").select("id,title,name,description,slug,status,steps,theme_color,created_at,updated_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} form${data?.length === 1 ? "" : "s"}.`, data: { forms: data || [] }, dataSource: ["public.forms"] };
  },
};

const formInput = z.object({ title: z.string().trim().min(3).max(180), description: z.string().trim().max(2000).default(""), fields: z.array(z.object({ label: z.string().trim().min(1).max(160), type: z.enum(["text", "textarea", "email", "number", "select", "checkbox", "date"]), required: z.boolean().default(false), options: z.array(z.string().max(120)).max(50).default([]) }).strict()).min(1).max(100) }).strict();
export const createFormDraftTool: WerseeAiTool<z.infer<typeof formInput>> = {
  name: "forms.create_draft", description: "Create an unpublished structured form draft.", category: "forms", riskLevel: "low", requiredScopes: ["create_form_drafts"], inputSchema: formInput, inputHint: "{title,description?,fields:[{label,type,required?,options?}]}",
  preview(context, input) { return Promise.resolve(draftPreview(context, "form", input.title, [{ field: "fields", before: 0, after: input.fields.length }])); },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("forms").select("id,title").eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Form draft "${existing.title}" already exists.`, resource: { type: "form", id: existing.id, label: existing.title, route: `form-builder_${existing.id}` }, data: { idempotentReplay: true } };
    const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "form"}-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await context.userClient.from("forms").insert({ user_id: context.user.id, title: input.title, name: input.title, description: input.description, slug, status: "draft", steps: [{ id: crypto.randomUUID(), title: input.title, fields: input.fields }], settings: { created_via: "wersee_ai" }, ai_idempotency_key: idempotencyKey }).select("id,title,slug,status,steps").single();
    if (error) throw error;
    return { summary: `Created form draft "${data.title}".`, resource: { type: "form", id: data.id, label: data.title, route: `form-builder_${data.id}` }, data: { form: data } };
  },
};

export const listCampaignsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "email.campaigns.list", description: "List email campaigns owned by the user without sending messages.", category: "email", riskLevel: "read", requiredScopes: ["read_email"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("email_campaigns").select("id,name,subject,status,sent_count,open_rate,click_rate,scheduled_at,sent_at,created_at,updated_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} email campaign${data?.length === 1 ? "" : "s"}.`, data: { campaigns: data || [] }, dataSource: ["public.email_campaigns"] };
  },
};

const campaignInput = z.object({ name: z.string().trim().min(3).max(160), subject: z.string().trim().min(3).max(200), content: z.string().trim().min(20).max(30000) }).strict();
export const createCampaignDraftTool: WerseeAiTool<z.infer<typeof campaignInput>> = {
  name: "email.campaigns.create_draft", description: "Create an unscheduled email campaign draft; never send email.", category: "email", riskLevel: "low", requiredScopes: ["create_email_drafts"], inputSchema: campaignInput, inputHint: "{name,subject,content}",
  preview(context, input) { return Promise.resolve(draftPreview(context, "email campaign", input.name, [{ field: "subject", before: null, after: input.subject }])); },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("email_campaigns").select("id,name").eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Campaign draft "${existing.name}" already exists.`, resource: { type: "email_campaign", id: existing.id, label: existing.name, route: "management-email" }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("email_campaigns").insert({ user_id: context.user.id, name: input.name, subject: input.subject, content: input.content, status: "draft", ai_idempotency_key: idempotencyKey }).select("id,name,subject,status").single();
    if (error) throw error;
    return { summary: `Created unsent campaign draft "${data.name}".`, resource: { type: "email_campaign", id: data.id, label: data.name, route: "management-email" }, data: { campaign: data } };
  },
};

export const listWebsitesTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "websites.list", description: "List websites owned by the authenticated user.", category: "websites", riskLevel: "read", requiredScopes: ["read_websites"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("websites").select("id,name,status,created_at,updated_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} website${data?.length === 1 ? "" : "s"}.`, data: { websites: data || [] }, dataSource: ["public.websites"] };
  },
};

const websiteInput = z.object({ name: z.string().trim().min(3).max(160), sections: z.array(z.object({ type: z.string().trim().min(1).max(80), content: z.record(z.string(), z.unknown()) }).strict()).min(1).max(30) }).strict();
export const createWebsiteDraftTool: WerseeAiTool<z.infer<typeof websiteInput>> = {
  name: "websites.create_draft", description: "Create an unpublished website draft with structured sections.", category: "websites", riskLevel: "low", requiredScopes: ["create_website_drafts"], inputSchema: websiteInput, inputHint: "{name,sections:[{type,content}]}",
  preview(context, input) { return Promise.resolve(draftPreview(context, "website", input.name, [{ field: "sections", before: 0, after: input.sections.length }])); },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("websites").select("id,name").eq("user_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Website draft "${existing.name}" already exists.`, resource: { type: "website", id: existing.id, label: existing.name, route: `site-detail_${existing.id}` }, data: { idempotentReplay: true } };
    const { data: website, error } = await context.userClient.from("websites").insert({ user_id: context.user.id, name: input.name, status: "draft", ai_idempotency_key: idempotencyKey }).select("id,name,status").single();
    if (error) throw error;
    const { error: sectionError } = await context.userClient.from("website_sections").insert(input.sections.map((section, index) => ({ website_id: website.id, type: section.type, content: section.content, order_index: index })));
    if (sectionError) {
      await context.userClient.from("websites").delete().eq("id", website.id).eq("user_id", context.user.id);
      throw sectionError;
    }
    return { summary: `Created unpublished website draft "${website.name}".`, resource: { type: "website", id: website.id, label: website.name, route: `site-detail_${website.id}` }, data: { website, sectionCount: input.sections.length } };
  },
};

export const listWikiTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "wiki.articles.list", description: "List wiki articles from teams the authenticated user belongs to.", category: "wiki", riskLevel: "read", requiredScopes: ["read_wiki"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data: memberships, error: membershipError } = await context.userClient.from("team_members").select("team_id").eq("user_id", context.user.id).in("status", ["active", "accepted", "joined"]);
    if (membershipError) throw membershipError;
    const teamIds = [...new Set((memberships || []).map((item) => item.team_id).filter(Boolean))];
    if (!teamIds.length) return { summary: "No team wiki is available for this account.", data: { articles: [] }, dataSource: ["public.wiki_articles"] };
    const { data, error } = await context.userClient.from("wiki_articles").select("id,team_id,category_id,title,tags,created_by,created_at,updated_at").in("team_id", teamIds).order("updated_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} wiki article${data?.length === 1 ? "" : "s"}.`, data: { articles: data || [] }, dataSource: ["public.wiki_articles"] };
  },
};

const wikiArticleInput = z.object({ teamId: z.string().uuid(), categoryId: z.string().uuid().nullable().default(null), title: z.string().trim().min(3).max(180), content: z.string().trim().min(20).max(30000), tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]) }).strict();
export const createWikiArticleTool: WerseeAiTool<z.infer<typeof wikiArticleInput>> = {
  name: "wiki.articles.create", description: "Create a team-visible wiki article after approval.", category: "wiki", riskLevel: "medium", requiredScopes: ["edit_wiki"], inputSchema: wikiArticleInput, inputHint: "{teamId,categoryId?,title,content,tags?}",
  async preview(context, input) { return { ...draftPreview(context, "wiki article", input.title, [{ field: "visibility", before: null, after: "team" }]), summary: `Create team-visible wiki article "${input.title}".`, publicVisibility: false }; },
  async execute(context, input, idempotencyKey) {
    const { data: membership, error: membershipError } = await context.userClient.from("team_members").select("id").eq("team_id", input.teamId).eq("user_id", context.user.id).in("status", ["active", "accepted", "joined"]).maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) throw new Error("TEAM_ACCESS_DENIED");
    const { data: existing } = await context.userClient.from("wiki_articles").select("id,title").eq("created_by", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Wiki article "${existing.title}" already exists.`, resource: { type: "wiki_article", id: existing.id, label: existing.title, route: "wiki" }, data: { idempotentReplay: true } };
    const { data, error } = await context.userClient.from("wiki_articles").insert({ team_id: input.teamId, category_id: input.categoryId, title: input.title, content: input.content, tags: input.tags, created_by: context.user.id, ai_idempotency_key: idempotencyKey }).select("id,title,team_id,category_id,tags,created_at").single();
    if (error) throw error;
    return { summary: `Created team wiki article "${data.title}".`, resource: { type: "wiki_article", id: data.id, label: data.title, route: "wiki" }, data: { article: data } };
  },
};

export const listJobApplicationsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "jobs.applications.list", description: "List job applications for the selected business without resume contents.", category: "jobs", riskLevel: "read", requiredScopes: ["read_jobs"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const business = requireBusiness(context);
    const { data, error } = await context.userClient.from("job_applications").select("id,job_id,user_id,status,created_at,updated_at,ai_summary,scores").eq("business_id", business.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} job application${data?.length === 1 ? "" : "s"}.`, data: { applications: data || [] }, dataSource: ["public.job_applications"] };
  },
};

const applyFlowInput = z.object({ jobId: z.string().uuid(), questions: z.array(z.object({ question: z.string().trim().min(3).max(500), type: z.enum(["open", "text", "email", "number", "select", "file"]), required: z.boolean().default(true), options: z.array(z.string().max(120)).max(50).default([]) }).strict()).min(1).max(50), settings: z.record(z.string(), z.unknown()).default({}) }).strict();
export const upsertApplyFlowTool: WerseeAiTool<z.infer<typeof applyFlowInput>> = {
  name: "jobs.apply_flow.upsert", description: "Create or update a structured application flow for an owned job listing.", category: "jobs", riskLevel: "medium", requiredScopes: ["edit_job_flows"], inputSchema: applyFlowInput, inputHint: "{jobId,questions:[{question,type,required?,options?}],settings?}",
  async preview(context, input) { return { ...draftPreview(context, "application flow", "Job application flow", [{ field: "questions", before: "current flow", after: input.questions.length }]), summary: `Replace the application flow with ${input.questions.length} structured question${input.questions.length === 1 ? "" : "s"}.` }; },
  async execute(context, input, idempotencyKey) {
    const { data: job, error: jobError } = await context.userClient.from("listings").select("id,title").eq("id", input.jobId).eq("seller_id", context.user.id).maybeSingle();
    if (jobError) throw jobError;
    if (!job) throw new Error("LISTING_NOT_FOUND");
    const config = { questions: input.questions, settings: input.settings, created_via: "wersee_ai" };
    const { data: existing, error: existingError } = await context.userClient.from("job_application_flows").select("id,ai_idempotency_key").eq("job_id", input.jobId).maybeSingle();
    if (existingError) throw existingError;
    if (existing?.ai_idempotency_key === idempotencyKey) return { summary: `Application flow for "${job.title}" is already up to date.`, resource: { type: "application_flow", id: existing.id, label: job.title, route: `apply-flow_${input.jobId}` }, data: { idempotentReplay: true } };
    const mutation = existing
      ? context.userClient.from("job_application_flows").update({ config, ai_idempotency_key: idempotencyKey }).eq("id", existing.id)
      : context.userClient.from("job_application_flows").insert({ job_id: input.jobId, config, ai_idempotency_key: idempotencyKey });
    const { data, error } = await mutation.select("id,job_id,config,updated_at").single();
    if (error) throw error;
    return { summary: `Updated the application flow for "${job.title}".`, resource: { type: "application_flow", id: data.id, label: job.title, route: `apply-flow_${input.jobId}` }, data: { flow: data } };
  },
};

const restrictedInput = z.object({ request: z.string().trim().min(1).max(2000) }).strict();
export const restrictedDeveloperSecretsTool: WerseeAiTool<z.infer<typeof restrictedInput>> = {
  name: "developer.secrets.manage", description: "Security-sensitive developer secret and webhook management, intentionally unavailable to AI.", category: "developer", riskLevel: "restricted", requiredScopes: ["manage_developer_secrets", "manage_webhooks"], inputSchema: restrictedInput, inputHint: "{request}",
  async execute() { throw new Error("TOOL_RESTRICTED"); },
};

export const listSubscriptionsTool: WerseeAiTool<z.infer<typeof listInput>> = {
  name: "money.subscriptions.list", description: "List subscriptions sold by the user without provider identifiers.", category: "money", riskLevel: "read", requiredScopes: ["read_payments"], inputSchema: listInput, inputHint: "{limit?: 1..100}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("subscriptions").select("id,buyer_id,listing_id,status,amount,currency,interval,active,created_at,updated_at,cancelled_at,expires_at,name,description").eq("seller_id", context.user.id).order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    return { summary: `Found ${(data || []).length} subscription${data?.length === 1 ? "" : "s"}.`, data: { subscriptions: data || [] }, dataSource: ["public.subscriptions"] };
  },
};

export const moduleTools = [
  listProposalsTool, createProposalDraftTool, listContractsTool, createContractDraftTool,
  listLeadsTool, listCallsTool, createCallConfigDraftTool, listFormsTool, createFormDraftTool,
  listCampaignsTool, createCampaignDraftTool, listWebsitesTool, createWebsiteDraftTool,
  listWikiTool, createWikiArticleTool, listJobApplicationsTool, upsertApplyFlowTool,
  listSubscriptionsTool, restrictedDeveloperSecretsTool,
] satisfies WerseeAiTool[];
