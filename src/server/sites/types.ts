export type SiteSourceType = 'zip' | 'folder' | 'wersee_storage';

export type ValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

export type SourceFile = {
  path: string;
  absolutePath: string;
  size: number;
  symlink?: boolean;
};

export type PreparedSiteFile = SourceFile & {
  path: string;
  contentType: string;
  sha1: string;
  isHtml: boolean;
};

export type SiteValidationReport = {
  detectedRoot: string | null;
  validRoots: string[];
  totalFiles: number;
  totalSize: number;
  htmlPages: number;
  javascriptFiles: number;
  cssFiles: number;
  imageFiles: number;
  missingReferencedAssets: string[];
  blockedFiles: string[];
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  detectedSpa: boolean;
  detectedFramework: string | null;
  faviconStatus: 'present' | 'missing' | 'invalid';
  analyticsInjectionStatus: 'injected' | 'disabled' | 'blocked';
  werseeManifestStatus: 'generated' | 'validated' | 'blocked';
  seo: {
    indexingEnabled: boolean;
    sitemapGenerated: boolean;
    robotsGenerated: boolean;
    indexNowPrepared: boolean;
    indexedPages: number;
  };
  aiTextEnhancement: {
    status: 'disabled' | 'completed' | 'failed';
    changedTextNodes: number;
    consideredTextNodes: number;
    filesChanged: number;
  };
  integrations: {
    candidates: Array<{
      id: string;
      kind: 'quick_pay' | 'wersee_oauth';
      sourcePath: string;
      sourceKind: 'html' | 'javascript';
      label: string;
      detectedAmount: number | null;
      detectedCurrency: string | null;
      confidence: number;
    }>;
    codeFilesScanned: number;
    visualDomReviewRequired: boolean;
  };
  publishable: boolean;
  guidance?: string;
};

export type ValidationResult = {
  report: SiteValidationReport;
  files: PreparedSiteFile[];
};

export type SiteRuntimeConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseServiceRoleKey: string;
  vercelToken: string;
  vercelTeamId: string;
  vercelTeamSlug?: string;
  vercelSitesProjectId: string;
  vercelSitesProjectSlug: string;
  rootDomain: string;
  previewTokenSecret: string;
  analyticsHashSalt: string;
  analyticsScriptUrl: string;
  maxArchiveBytes: number;
  maxUnpackedBytes: number;
  maxFileCount: number;
  maxSingleFileBytes: number;
  stagingRetentionHours: number;
  deploymentTimeoutMs: number;
};
