import { z } from "zod";

export const listingKindSchema = z.enum([
  "product", "digital", "course", "physical", "service", "community", "job", "announcement", "bundle", "pos_item",
]);

export const curriculumSchema = z.array(z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  lessons: z.array(z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1000).optional(),
  }).strict()).min(1).max(30),
}).strict()).max(30);

export const createListingDraftSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(20).max(20000),
  shortDescription: z.string().trim().max(320).optional(),
  price: z.number().finite().min(0).max(1000000).default(0),
  originalPrice: z.number().finite().min(0).max(1000000).optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("EUR"),
  kind: listingKindSchema.default("digital"),
  category: z.string().trim().min(1).max(120).default("Digital Products"),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  features: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
  faqs: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(2000) }).strict()).max(20).default([]),
  curriculum: curriculumSchema.optional(),
}).strict();
