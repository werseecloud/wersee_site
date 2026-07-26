/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_ALGOLIA_APP_ID?: string;
  readonly VITE_ALGOLIA_SEARCH_KEY?: string;
  readonly VITE_ALGOLIA_INDEX_NAME?: string;
  readonly VITE_RUN_DATABASE_SETUP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
