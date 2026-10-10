/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COUNTER_ENABLED?: string;
  readonly VITE_REPOSITORY_URL?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// generated/site-index.json is built before the site (npm run build:site-data);
// its shape is SiteIndex, written by scripts/build-site-data.ts.
declare module "*/site-index.json" {
  const data: import("./data/types.ts").SiteIndex;
  export default data;
}
