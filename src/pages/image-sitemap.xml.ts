// src/pages/image-sitemap.xml.ts
import type { APIRoute } from 'astro';
import { slugify } from '../utils/slugify';
import { getAllVideos } from '../utils/data'; // Pastikan ini mengimpor fungsi yang benar

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Site URL is not defined in Astro config.', { status: 500 });
  }

  const allVideos = await getAllVideos();
  const baseUrl = site.href.endsWith('/') ? site.href.slice(0, -1) : site.href;

  let imageEntries: string[] = [];

  // Tambahkan logo situs Anda
  imageEntries.push(`
    <url>
      <loc>${baseUrl}/</loc>
      <image:image>
        <image:loc>${baseUrl}/logo.png</image:loc>
        <image:caption>Logo ${site.hostname}</image:caption>
        <image:title>Logo ${site.hostname}</image:title>
      </image:image>
    </url>
  `);

  allVideos.forEach(video => {
    const videoDetailUrl = `${baseUrl}/${slugify(video.title)}-${video.id}/`;
    const thumbnailUrl = video.thumbnail; // URL gambar thumbnail video

    if (thumbnailUrl && videoDetailUrl) {
      imageEntries.push(`
        <url>
          <loc>${videoDetailUrl}</loc>
          <image:image>
            <image:loc>${thumbnailUrl}</image:loc>
            <image:caption>${video.description}</image:caption>
            <image:title>${video.title}</image:title>
          </image:image>
        </url>
      `);
    }
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${imageEntries.join('\n  ')}
</urlset>`;

  return new Response(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};