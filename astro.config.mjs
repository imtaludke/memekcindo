// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://memekcindo.pages.dev',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      changefreq: 'daily',
      priority: 1,
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['node:fs', 'node:path'],
    },
  },
});
