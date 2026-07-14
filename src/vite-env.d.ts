/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_RUN_DATABASE_SETUP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
