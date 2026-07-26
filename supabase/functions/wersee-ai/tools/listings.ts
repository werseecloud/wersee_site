import { z } from "zod";
import { insertListingRecord, updateListingRecord } from "../../_shared/listingPersistence.ts";
import { createListingDraftSchema, curriculumSchema, listingKindSchema } from "../../_shared/listingSchemas.ts";
import type { SafeActionResult, ToolContext, WerseeAiTool } from "../types.ts";

const listingSelect = "id,title,description,short_description,price,original_price,sale_price,base_currency,type,category,status,images,seo_title,seo_description,faqs,features,metadata,created_at,published_at";

export const createDraftSchema = createListingDraftSchema;

const kindToListing = (kind: z.infer<typeof listingKindSchema>) => {
  if (kind === "course") return { type: "digital", category: "course" };
  if (kind === "physical" || kind === "product") return { type: "product", category: null };
  if (kind === "pos_item") return { type: "product", category: null };
  return { type: kind, category: null };
};

const searchInput = z.object({
  query: z.string().trim().max(160).default(""),
  status: z.enum(["draft", "published", "active", "archived"]).optional(),
  kind: listingKindSchema.optional(),
  limit: z.number().int().min(1).max(50).default(20),
}).strict();

export const searchListingsTool: WerseeAiTool<z.infer<typeof searchInput>> = {
  name: "listings.search",
  description: "Search the authenticated seller's real Wersee listings.",
  category: "products",
  riskLevel: "read",
  requiredScopes: ["read_products"],
  inputSchema: searchInput,
  inputHint: "{query?: string, status?: draft|published|active|archived, kind?: product|digital|course|physical|service|community|job|announcement|bundle|pos_item, limit?: 1..50}",
  async execute(context, input) {
    let query = context.userClient.from("listings").select(listingSelect).eq("seller_id", context.user.id).is("deleted_at", null);
    if (input.query) query = query.ilike("title", `%${input.query.replace(/[%_]/g, "")}%`);
    if (input.status) query = query.eq("status", input.status);
    if (input.kind) {
      const mapped = kindToListing(input.kind);
      query = query.eq("type", mapped.type);
      if (input.kind === "course") query = query.eq("category", "course");
    }
    const { data, error } = await query.order("created_at", { ascending: false }).limit(input.limit);
    if (error) throw error;
    const rows = data || [];
    return { summary: `Found ${rows.length} listing${rows.length === 1 ? "" : "s"}.`, data: { listings: rows }, dataSource: ["public.listings"] };
  },
};

const getInput = z.object({ listingId: z.string().uuid() }).strict();
export const getListingTool: WerseeAiTool<z.infer<typeof getInput>> = {
  name: "listings.get",
  description: "Read a listing owned by the authenticated seller.",
  category: "products",
  riskLevel: "read",
  requiredScopes: ["read_products"],
  inputSchema: getInput,
  inputHint: "{listingId: uuid}",
  async execute(context, input) {
    const { data, error } = await context.userClient.from("listings").select(listingSelect)
      .eq("id", input.listingId).eq("seller_id", context.user.id).is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("LISTING_NOT_FOUND");
    return { summary: `Loaded ${data.title}.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` }, data: { listing: data }, dataSource: ["public.listings"] };
  },
};

export const createListingDraftTool: WerseeAiTool<z.infer<typeof createDraftSchema>> = {
  name: "listings.create_draft",
  description: "Create a real editable Wersee listing draft using the same listings schema as the wizards.",
  category: "products",
  riskLevel: "low",
  requiredScopes: ["create_product_drafts"],
  inputSchema: createDraftSchema,
  inputHint: "{title, description, shortDescription?, price, originalPrice?, currency, kind, category, tags[], seoTitle?, seoDescription?, features[], faqs[], curriculum?}",
  async preview(context, input) {
    return {
      title: "Create listing draft",
      summary: `Create an editable ${input.kind} draft named “${input.title}”.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "listing", label: input.title }],
      changes: [
        { field: "status", before: null, after: "draft" },
        { field: "title", before: null, after: input.title },
        { field: "price", before: null, after: input.price },
        { field: "currency", before: null, after: input.currency },
      ],
      financial: { amount: input.price, currency: input.currency },
      publicVisibility: false,
      estimatedCount: 1,
      reversible: true,
    };
  },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("listings").select("id,title")
      .eq("seller_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) {
      return { summary: `Draft ${existing.title} already exists.`, resource: { type: "listing", id: existing.id, label: existing.title, route: `edit-product_${existing.id}` }, data: { idempotentReplay: true } };
    }

    const mapped = kindToListing(input.kind);
    const price = input.originalPrice ?? input.price;
    const metadata = {
      ai_created: true,
      ai_schema_version: 1,
      listing_kind: input.kind,
      tags: input.tags,
      features: input.features,
      faqs: input.faqs,
      curriculum: input.curriculum || [],
      currency: input.currency,
      ...(input.kind === "pos_item" ? { is_pos_item: true } : {}),
    };
    const data = await insertListingRecord<any>(context.userClient, {
      seller_id: context.user.id,
      user_id: context.user.id,
      title: input.title,
      description: input.description,
      short_description: input.shortDescription || null,
      price: String(price),
      original_price: price,
      sale_price: input.price < price ? input.price : null,
      base_currency: input.currency,
      type: mapped.type,
      category: mapped.category || input.category,
      status: "draft",
      seo_title: input.seoTitle || input.title.slice(0, 70),
      seo_description: input.seoDescription || input.shortDescription?.slice(0, 170) || input.description.slice(0, 170),
      features: input.features,
      faqs: input.faqs,
      metadata,
      ai_idempotency_key: idempotencyKey,
      expires_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    }, "id,title,status,type,category,price,seo_title,seo_description");
    return { summary: `Created editable draft “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` }, data: { listing: data } };
  },
  createUndoOperation(result) {
    return result.resource ? { toolName: "listings.create_draft", input: { listingId: result.resource.id }, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const listingId = z.string().uuid().parse(payload.listingId);
    const data = await updateListingRecord<any>(context.userClient, listingId, { status: "archived" }, { sellerId: context.user.id, select: "id,title" });
    return { summary: `Archived the AI-created draft "${data.title}".`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` } };
  },
};

const editablePatch = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  description: z.string().trim().min(20).max(20000).optional(),
  shortDescription: z.string().trim().max(320).nullable().optional(),
  price: z.number().finite().min(0).max(1000000).optional(),
  originalPrice: z.number().finite().min(0).max(1000000).optional(),
  salePrice: z.number().finite().min(0).max(1000000).nullable().optional(),
  category: z.string().trim().min(1).max(120).optional(),
  seoTitle: z.string().trim().max(70).nullable().optional(),
  seoDescription: z.string().trim().max(170).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  features: z.array(z.string().trim().min(1).max(240)).max(20).optional(),
  faqs: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(2000) }).strict()).max(20).optional(),
  curriculum: curriculumSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field must be changed.");

export const updateInput = z.object({ listingId: z.string().uuid(), patch: editablePatch }).strict();
const loadOwnedListing = async (context: ToolContext, listingId: string) => {
  const { data, error } = await context.userClient.from("listings").select(listingSelect)
    .eq("id", listingId).eq("seller_id", context.user.id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("LISTING_NOT_FOUND");
  return data;
};

const mapPatch = (current: any, patch: z.infer<typeof editablePatch>) => {
  const next: Record<string, unknown> = {};
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.shortDescription !== undefined) next.short_description = patch.shortDescription;
  if (patch.price !== undefined) next.price = String(patch.price);
  if (patch.originalPrice !== undefined) next.original_price = patch.originalPrice;
  if (patch.salePrice !== undefined) next.sale_price = patch.salePrice;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.seoTitle !== undefined) next.seo_title = patch.seoTitle;
  if (patch.seoDescription !== undefined) next.seo_description = patch.seoDescription;
  if (patch.features !== undefined) next.features = patch.features;
  if (patch.faqs !== undefined) next.faqs = patch.faqs;
  if (patch.tags !== undefined || patch.curriculum !== undefined) {
    next.metadata = {
      ...(current.metadata || {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      ...(patch.curriculum !== undefined ? { curriculum: patch.curriculum } : {}),
    };
  }
  return next;
};

export const updateListingTool: WerseeAiTool<z.infer<typeof updateInput>> = {
  name: "listings.update",
  description: "Edit approved fields on a listing owned by the authenticated seller.",
  category: "products",
  riskLevel: "medium",
  requiredScopes: ["edit_products"],
  inputSchema: updateInput,
  inputHint: "{listingId: uuid, patch: {title?, description?, shortDescription?, price?, originalPrice?, salePrice?, category?, seoTitle?, seoDescription?, tags?, features?, faqs?, curriculum?}}",
  async preview(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    const currentRecord = current as Record<string, unknown>;
    const changes = Object.entries(input.patch).map(([field, after]) => ({ field, before: field === "shortDescription" ? current.short_description : field === "seoTitle" ? current.seo_title : field === "seoDescription" ? current.seo_description : currentRecord[field], after }));
    return {
      title: "Update listing",
      summary: `Update ${changes.length} field${changes.length === 1 ? "" : "s"} on “${current.title}”.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "listing", id: current.id, label: current.title }],
      changes,
      financial: input.patch.price !== undefined ? { amount: input.patch.price, currency: current.base_currency || "EUR" } : null,
      publicVisibility: ["published", "active"].includes(current.status),
      estimatedCount: 1,
      reversible: true,
    };
  },
  async execute(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    const patch = mapPatch(current, input.patch);
    const currentRecord = current as Record<string, unknown>;
    const original = Object.fromEntries(Object.keys(patch).map((key) => [key, currentRecord[key]]));
    const data = await updateListingRecord<any>(context.userClient, input.listingId, patch, { sellerId: context.user.id, select: "id,title,status,price,original_price,sale_price,category,seo_title,seo_description" });
    return { summary: `Updated “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` }, data: { listing: data, undo: { listingId: data.id, patch: original } } };
  },
  createUndoOperation(result) {
    const undo = result.data?.undo;
    return undo && typeof undo === "object" ? { toolName: "listings.update", input: undo as Record<string, unknown>, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const listingId = z.string().uuid().parse(payload.listingId);
    const patch = z.record(z.string(), z.unknown()).parse(payload.patch);
    const data = await updateListingRecord<any>(context.userClient, listingId, patch, { sellerId: context.user.id, select: "id,title" });
    return { summary: `Restored the previous values for “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` } };
  },
};

const publishInput = z.object({ listingId: z.string().uuid(), status: z.enum(["published", "draft"]) }).strict();
export const publishListingTool: WerseeAiTool<z.infer<typeof publishInput>> = {
  name: "listings.set_publication",
  description: "Publish or unpublish a listing after explicit confirmation.",
  category: "products",
  riskLevel: "high",
  requiredScopes: ["publish_products"],
  alwaysConfirm: true,
  inputSchema: publishInput,
  inputHint: "{listingId: uuid, status: published|draft}",
  async preview(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    return {
      title: input.status === "published" ? "Publish listing" : "Unpublish listing",
      summary: `${input.status === "published" ? "Make" : "Stop making"} “${current.title}” visible on the storefront.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "listing", id: current.id, label: current.title }],
      changes: [{ field: "status", before: current.status, after: input.status }],
      financial: { amount: Number(current.price || 0), currency: current.base_currency || "EUR" },
      publicVisibility: input.status === "published",
      estimatedCount: 1,
      reversible: true,
      confirmationText: input.status === "published" ? "Confirm that this listing is ready to be public." : "Confirm that customers should no longer see this listing.",
    };
  },
  async execute(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    const data = await updateListingRecord<any>(context.userClient, input.listingId, {
      status: input.status,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    }, { sellerId: context.user.id, select: "id,title,status" });
    return { summary: `${data.title} is now ${data.status}.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` }, data: { undo: { listingId: data.id, patch: { status: current.status, published_at: current.published_at } } } };
  },
  createUndoOperation(result) {
    const undo = result.data?.undo;
    return undo && typeof undo === "object" ? { toolName: "listings.set_publication", input: undo as Record<string, unknown>, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const listingId = z.string().uuid().parse(payload.listingId);
    const patch = z.object({ status: z.string(), published_at: z.string().nullable().optional() }).passthrough().parse(payload.patch);
    const data = await updateListingRecord<any>(context.userClient, listingId, { status: patch.status, published_at: patch.published_at || null }, { sellerId: context.user.id, select: "id,title,status" });
    return { summary: `Restored "${data.title}" to ${data.status}.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` } };
  },
};

export const listingCompletenessTool: WerseeAiTool<z.infer<typeof getInput>> = {
  name: "listings.check_completeness",
  description: "Check a real listing for missing copy, pricing, media, SEO, FAQs, and course structure.",
  category: "products",
  riskLevel: "read",
  requiredScopes: ["read_products"],
  inputSchema: getInput,
  inputHint: "{listingId: uuid}",
  async execute(context, input) {
    const listing = await loadOwnedListing(context, input.listingId);
    const missing: string[] = [];
    if (!listing.title) missing.push("title");
    if (!listing.description || listing.description.length < 80) missing.push("detailed description");
    if (!listing.short_description) missing.push("short description");
    if (Number(listing.price) < 0 || !Number.isFinite(Number(listing.price))) missing.push("valid price");
    if (!listing.images?.length) missing.push("cover media");
    if (!listing.seo_title) missing.push("SEO title");
    if (!listing.seo_description) missing.push("SEO description");
    if (!listing.faqs?.length && !listing.metadata?.faqs?.length) missing.push("FAQs");
    if (listing.category === "course" && !listing.metadata?.curriculum?.length) missing.push("course curriculum");
    const score = Math.max(0, Math.round(100 - missing.length * 12.5));
    return { summary: missing.length ? `${listing.title} is ${score}% complete and needs ${missing.join(", ")}.` : `${listing.title} passed the completeness review.`, resource: { type: "listing", id: listing.id, label: listing.title, route: `edit-product_${listing.id}` }, data: { score, missing }, dataSource: ["public.listings"] };
  },
};

const duplicateInput = z.object({ listingId: z.string().uuid(), title: z.string().trim().min(3).max(180).optional() }).strict();
export const duplicateListingTool: WerseeAiTool<z.infer<typeof duplicateInput>> = {
  name: "listings.duplicate",
  description: "Duplicate an owned listing as a private editable draft without copying orders or analytics.",
  category: "products",
  riskLevel: "low",
  requiredScopes: ["create_product_drafts"],
  inputSchema: duplicateInput,
  inputHint: "{listingId: uuid, title?: string}",
  async preview(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    return {
      title: "Duplicate listing",
      summary: `Create a private draft copy of “${current.title}”.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "listing", id: current.id, label: current.title }],
      changes: [{ field: "status", before: current.status, after: "draft copy" }],
      publicVisibility: false,
      estimatedCount: 1,
      reversible: true,
    };
  },
  async execute(context, input, idempotencyKey) {
    const { data: existing } = await context.userClient.from("listings").select("id,title")
      .eq("seller_id", context.user.id).eq("ai_idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return { summary: `Draft ${existing.title} already exists.`, resource: { type: "listing", id: existing.id, label: existing.title, route: `edit-product_${existing.id}` }, data: { idempotentReplay: true } };
    const current = await loadOwnedListing(context, input.listingId);
    const title = (input.title || `${current.title} copy`).slice(0, 180);
    const data = await insertListingRecord<any>(context.userClient, {
      seller_id: context.user.id,
      user_id: context.user.id,
      title,
      description: current.description,
      short_description: current.short_description,
      price: current.price,
      original_price: current.original_price,
      sale_price: current.sale_price,
      base_currency: current.base_currency,
      type: current.type,
      category: current.category,
      status: "draft",
      images: current.images || [],
      seo_title: current.seo_title ? `${current.seo_title} copy`.slice(0, 70) : title.slice(0, 70),
      seo_description: current.seo_description,
      features: current.features || [],
      faqs: current.faqs || [],
      metadata: { ...(current.metadata || {}), duplicated_from: current.id, ai_created: true },
      ai_idempotency_key: idempotencyKey,
      expires_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    }, "id,title,status,type,category,price");
    return { summary: `Created private draft “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` }, data: { listing: data } };
  },
  createUndoOperation(result) {
    return result.resource ? { toolName: "listings.duplicate", input: { listingId: result.resource.id }, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const listingId = z.string().uuid().parse(payload.listingId);
    const data = await updateListingRecord<any>(context.userClient, listingId, { status: "archived" }, { sellerId: context.user.id, select: "id,title" });
    return { summary: `Archived duplicated draft “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` } };
  },
};

const archiveInput = z.object({ listingId: z.string().uuid() }).strict();
export const archiveListingTool: WerseeAiTool<z.infer<typeof archiveInput>> = {
  name: "listings.archive",
  description: "Archive an owned listing after confirmation without deleting its historical data.",
  category: "products",
  riskLevel: "high",
  requiredScopes: ["archive_products"],
  alwaysConfirm: true,
  inputSchema: archiveInput,
  inputHint: "{listingId: uuid}",
  async preview(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    return {
      title: "Archive listing",
      summary: `Archive “${current.title}” and remove it from active product management views.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "listing", id: current.id, label: current.title }],
      changes: [{ field: "status", before: current.status, after: "archived" }],
      publicVisibility: false,
      estimatedCount: 1,
      reversible: true,
      confirmationText: "Confirm that this listing should be archived.",
    };
  },
  async execute(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    const data = await updateListingRecord<any>(context.userClient, input.listingId, { status: "archived", published_at: null }, { sellerId: context.user.id, select: "id,title,status" });
    return { summary: `Archived “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` }, data: { undo: { listingId: data.id, patch: { status: current.status, published_at: current.published_at } } } };
  },
  createUndoOperation(result) {
    const undo = result.data?.undo;
    return undo && typeof undo === "object" ? { toolName: "listings.archive", input: undo as Record<string, unknown>, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const parsed = z.object({ listingId: z.string().uuid(), patch: z.object({ status: z.string(), published_at: z.string().nullable().optional() }).passthrough() }).parse(payload);
    const data = await updateListingRecord<any>(context.userClient, parsed.listingId, { status: parsed.patch.status, published_at: parsed.patch.published_at || null }, { sellerId: context.user.id, select: "id,title,status" });
    return { summary: `Restored “${data.title}” to ${data.status}.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` } };
  },
};

export const deleteListingTool: WerseeAiTool<z.infer<typeof archiveInput>> = {
  name: "listings.delete",
  description: "Soft-delete an owned listing only after explicit final confirmation.",
  category: "products",
  riskLevel: "high",
  requiredScopes: ["delete_data"],
  alwaysConfirm: true,
  inputSchema: archiveInput,
  inputHint: "{listingId: uuid}",
  async preview(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    return {
      title: "Delete listing",
      summary: `Move “${current.title}” to deleted items. Historical orders remain intact.`,
      business: context.business ? { id: context.business.id, name: context.business.name } : null,
      affectedResources: [{ type: "listing", id: current.id, label: current.title }],
      changes: [{ field: "deleted_at", before: null, after: "now" }],
      publicVisibility: false,
      estimatedCount: 1,
      reversible: true,
      confirmationText: `Type approval for deleting “${current.title}”.`,
    };
  },
  async execute(context, input) {
    const current = await loadOwnedListing(context, input.listingId);
    const data = await updateListingRecord<any>(context.userClient, input.listingId, { deleted_at: new Date().toISOString(), status: "archived", published_at: null }, { sellerId: context.user.id, select: "id,title,status,deleted_at" });
    return { summary: `Deleted “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title }, data: { undo: { listingId: data.id, patch: { deleted_at: null, status: current.status, published_at: current.published_at } } } };
  },
  createUndoOperation(result) {
    const undo = result.data?.undo;
    return undo && typeof undo === "object" ? { toolName: "listings.delete", input: undo as Record<string, unknown>, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } : null;
  },
  async undo(context, payload) {
    const parsed = z.object({ listingId: z.string().uuid(), patch: z.object({ deleted_at: z.null(), status: z.string(), published_at: z.string().nullable().optional() }).passthrough() }).parse(payload);
    const data = await updateListingRecord<any>(context.userClient, parsed.listingId, parsed.patch, { sellerId: context.user.id, select: "id,title,status" });
    return { summary: `Restored deleted listing “${data.title}”.`, resource: { type: "listing", id: data.id, label: data.title, route: `edit-product_${data.id}` } };
  },
};

const conversionInput = z.object({ listingId: z.string().uuid(), days: z.number().int().min(1).max(365).default(30) }).strict();
export const listingConversionDiagnosticsTool: WerseeAiTool<z.infer<typeof conversionInput>> = {
  name: "listings.conversion_diagnostics",
  description: "Inspect real conversion events and paid orders for one owned listing and identify factual gaps or weak funnel stages.",
  category: "products",
  riskLevel: "read",
  requiredScopes: ["read_products", "read_analytics"],
  inputSchema: conversionInput,
  inputHint: "{listingId: uuid, days?: 1..365}",
  async execute(context, input) {
    const listing = await loadOwnedListing(context, input.listingId);
    const to = new Date();
    const from = new Date(to.getTime() - input.days * 86400000);
    const [{ data: events, error: eventsError }, { data: orders, error: ordersError }] = await Promise.all([
      context.userClient.from("product_conversion_events").select("event_type,created_at").eq("listing_id", listing.id).gte("created_at", from.toISOString()).limit(10000),
      context.userClient.from("orders").select("id,amount,currency,status,created_at").eq("seller_id", context.user.id).eq("listing_id", listing.id).gte("created_at", from.toISOString()).limit(5000),
    ]);
    if (eventsError && !["42P01", "PGRST205"].includes(eventsError.code || "")) throw eventsError;
    if (ordersError) throw ordersError;
    const count = (types: string[]) => (events || []).filter((event: any) => types.includes(String(event.event_type))).length;
    const views = count(["view", "product_view", "product_card_view"]);
    const checkouts = count(["checkout", "checkout_started"]);
    const trackedPurchases = count(["purchase", "checkout_completed"]);
    const paidOrders = (orders || []).filter((order: any) => ["completed", "paid", "succeeded", "success", "fulfilled"].includes(String(order.status || "").toLowerCase()));
    const purchases = Math.max(trackedPurchases, paidOrders.length);
    const conversionRate = views > 0 ? Number(((purchases / views) * 100).toFixed(2)) : null;
    const issues: string[] = [];
    if (!views) issues.push("No tracked product views are available, so conversion cannot be calculated.");
    if (views >= 20 && purchases === 0) issues.push("The listing has tracked traffic but no purchase in this period.");
    if (checkouts > 0 && purchases / checkouts < 0.25) issues.push("More than 75% of tracked checkout starts did not become purchases.");
    if (!listing.images?.length) issues.push("The listing has no cover media.");
    if (!listing.short_description || !listing.seo_description) issues.push("Short or SEO copy is incomplete.");
    return {
      summary: conversionRate === null ? `${listing.title} has no reliable tracked-view denominator for the selected period.` : `${listing.title} converted ${conversionRate}% of ${views} tracked views into ${purchases} purchase${purchases === 1 ? "" : "s"}.`,
      resource: { type: "listing", id: listing.id, label: listing.title, route: `edit-product_${listing.id}` },
      data: { views, checkoutStarts: checkouts, purchases, paidOrders: paidOrders.length, conversionRate, issues },
      chart: { type: "bar", title: `Funnel — last ${input.days} days`, xKey: "stage", yKey: "count", data: [{ stage: "Views", count: views }, { stage: "Checkout starts", count: checkouts }, { stage: "Purchases", count: purchases }] },
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      dataSource: ["public.product_conversion_events", "public.orders", "public.listings"],
    };
  },
};

export const listingTools = [
  searchListingsTool,
  getListingTool,
  createListingDraftTool,
  updateListingTool,
  publishListingTool,
  duplicateListingTool,
  archiveListingTool,
  deleteListingTool,
  listingCompletenessTool,
  listingConversionDiagnosticsTool,
] satisfies WerseeAiTool[];
