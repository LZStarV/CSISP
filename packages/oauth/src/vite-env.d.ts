/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CSISP_SUPABASE_URL: string;
  readonly CSISP_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
