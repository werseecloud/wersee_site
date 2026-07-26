import { z } from 'zod';

const goalSchema = z.object({
  id: z.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9_-]*$/i),
  selector: z.string().trim().min(1).max(180),
  event: z.enum(['click', 'submit']).default('click'),
  value: z.number().finite().min(0).max(1_000_000).optional(),
}).strict();

const manifestSchema = z.object({
  $schema: z.string().url().optional(),
  version: z.literal(1).default(1),
  seo: z.object({
    index: z.boolean().default(true),
    title: z.string().trim().min(1).max(70).optional(),
    description: z.string().trim().min(1).max(180).optional(),
    language: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('en'),
    sitemap: z.boolean().default(true),
    structuredData: z.boolean().default(true),
  }).strict().default({
    index: true,
    language: 'en',
    sitemap: true,
    structuredData: true,
  }),
  ai: z.object({
    improveText: z.boolean().default(false),
    locale: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('en'),
    tone: z.enum(['clear', 'professional', 'friendly', 'confident', 'concise']).default('clear'),
    instructions: z.string().trim().max(500).optional(),
  }).strict().default({
    improveText: false,
    locale: 'en',
    tone: 'clear',
  }),
  analytics: z.object({
    enabled: z.boolean().default(true),
    respectDoNotTrack: z.boolean().default(true),
    webVitals: z.boolean().default(true),
    scrollDepth: z.boolean().default(true),
    formSubmissions: z.boolean().default(true),
    errorSignals: z.boolean().default(true),
    outboundLinks: z.boolean().default(true),
    downloads: z.boolean().default(true),
    goals: z.array(goalSchema).max(20).default([]),
  }).strict().default({
    enabled: true,
    respectDoNotTrack: true,
    webVitals: true,
    scrollDepth: true,
    formSubmissions: true,
    errorSignals: true,
    outboundLinks: true,
    downloads: true,
    goals: [],
  }),
}).strict();

export type WerseeSiteManifest = z.infer<typeof manifestSchema> & {
  $schema: string;
  runtime: {
    siteId: string;
    releaseId: string;
    publicUrl: string;
    generatedAt: string;
  };
};

export type ManifestDefaults = {
  siteId: string;
  releaseId: string;
  publicUrl: string;
  indexingEnabled: boolean;
  analyticsEnabled: boolean;
  aiTextEnhancementEnabled: boolean;
};

export const parseWerseeManifest = (input: unknown, defaults: ManifestDefaults): WerseeSiteManifest => {
  const parsed = manifestSchema.parse(input ?? {});
  return {
    ...parsed,
    $schema: 'https://wersee.com/schemas/sites/wersee.v1.schema.json',
    seo: {
      ...parsed.seo,
      index: defaults.indexingEnabled && parsed.seo.index,
      sitemap: defaults.indexingEnabled && parsed.seo.index && parsed.seo.sitemap,
    },
    ai: {
      ...parsed.ai,
      improveText: defaults.aiTextEnhancementEnabled || parsed.ai.improveText,
    },
    analytics: {
      ...parsed.analytics,
      enabled: defaults.analyticsEnabled && parsed.analytics.enabled,
    },
    runtime: {
      siteId: defaults.siteId,
      releaseId: defaults.releaseId,
      publicUrl: defaults.publicUrl,
      generatedAt: new Date().toISOString(),
    },
  };
};

export const parseWerseeManifestText = (value: string, defaults: ManifestDefaults) => {
  let input: unknown = {};
  if (value.trim()) {
    try {
      input = JSON.parse(value);
    } catch {
      throw new Error('WERSEE_MANIFEST_INVALID_JSON');
    }
  }
  try {
    return parseWerseeManifest(input, defaults);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      throw new Error(`WERSEE_MANIFEST_INVALID:${issue.path.join('.') || 'root'}:${issue.message}`, { cause: error });
    }
    throw error;
  }
};

export const serializeWerseeManifest = (manifest: WerseeSiteManifest) =>
  `${JSON.stringify(manifest, null, 2)}\n`;
