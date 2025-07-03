/// <reference path="../.astro/types.d.ts" />
// src/env.d.ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_NAME: string;
  readonly PUBLIC_SITE_DESCRIPTION: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_SITE_PUBLISHED_DATE: string;
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION: string;
  readonly PUBLIC_YANDEX_SITE_VERIFICATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}