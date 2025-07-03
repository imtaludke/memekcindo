// src/pages/video-sitemap.xml.ts
import type { APIRoute } from 'astro';
import { slugify } from '../utils/slugify';
import { getAllVideos } from '../utils/data'; // Pastikan ini mengimpor fungsi yang benar

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Site URL is not defined in Astro config.', { status: 500 });
  }

  const allVideos = await getAllVideos();
  const baseUrl = site.href.endsWith('/') ? site.href.slice(0, -1) : site.href;

  let videoEntries: string[] = [];

  allVideos.forEach(video => {
    const videoDetailUrl = `${baseUrl}/${slugify(video.title)}-${video.id}/`;
    const thumbnailUrl = video.thumbnail; // URL gambar thumbnail video
    const embedUrl = video.embedUrl;     // URL embed video (misal: URL iframe YouTube/Vimeo)
    const duration = video.duration || 126; // Durasi video dalam detik
    const datePublished = video.datePublished || new Date().toISOString();
    const dateModified = video.dateModified || datePublished;

    // Pastikan semua properti yang diperlukan ada
    if (videoDetailUrl && thumbnailUrl && embedUrl && video.title && video.description) {
      videoEntries.push(`
        <url>
          <loc>${videoDetailUrl}</loc>
          <lastmod>${dateModified}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
          <video:video>
            <video:thumbnail_loc>${thumbnailUrl}</video:thumbnail_loc>
            <video:title>${video.title}</video:title>
            <video:description>${video.description}</video:description>
            <video:content_loc>${embedUrl}</video:content_loc>
            <video:duration>${duration}</video:duration>
            <video:publication_date>${datePublished}</video:publication_date>
            ${video.tags ? `<video:tag>${video.tags.split(',').map(tag => tag.trim()).join('</video:tag><video:tag>')}</video:tag>` : ''}
            <video:category>${video.category}</video:category>
          </video:video>
        </url>
      `);
    }
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${videoEntries.join('\n  ')}
</urlset>`;

  return new Response(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};