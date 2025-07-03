// src/pages/robots.txt.ts
const SITE_URL = import.meta.env.PUBLIC_SITE_URL;

export async function GET() {
  const robotsTxtContent = `
User-agent: *
Disallow: /?s=*
Disallow: /?q=*
Disallow: /search/*

Allow: /
Allow: /video/*
Allow: /category/*


Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(robotsTxtContent, {
    headers: { 'Content-Type': 'text/plain' },
  });
}