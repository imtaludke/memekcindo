// src/utils/processThumbnails.mjs

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import rawVideosData from '../data/videos.json' with { type: 'json' };

// --- FUNGSI SLUGIFY ---
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
// --- AKHIR FUNGSI SLUGIFY ---

const videosData = rawVideosData;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '../../');
const publicDir = path.join(projectRoot, 'public');

const OPTIMIZED_IMAGES_SUBDIR = 'picture';
const optimizedThumbnailsDir = path.join(publicDir, OPTIMIZED_IMAGES_SUBDIR);

const processedVideosPath = path.join(publicDir, 'processedVideos.json');

// --- PERUBAHAN UTAMA DI SINI: Akses dari process.env ---
const YOUR_DOMAIN = process.env.PUBLIC_SITE_URL;
if (!YOUR_DOMAIN) {
  console.error("Error: PUBLIC_SITE_URL is not defined in environment variables. Please check your .env file and ensure it's loaded.");
  process.exit(1);
}
// --- AKHIR PERUBAHAN UTAMA ---

const PLACEHOLDER_THUMBNAIL_PATH = `/placeholder.webp`;
const DEFAULT_FALLBACK_WIDTH = 300;
const DEFAULT_FALLBACK_HEIGHT = 168;
const OPTIMIZED_THUMBNAIL_WIDTH = 300;

async function processThumbnails() {
  console.log('Starting thumbnail processing...');

  await fs.mkdir(optimizedThumbnailsDir, { recursive: true });

  const processedVideos = [];

  for (const video of videosData) {
    const videoSlug = slugify(video.title || 'untitled-video');
    const thumbnailFileName = `${videoSlug}-${video.id}.webp`;

    const outputPath = path.join(optimizedThumbnailsDir, thumbnailFileName);
    const relativeThumbnailPath = `/${OPTIMIZED_IMAGES_SUBDIR}/${thumbnailFileName}`;

    try {
      if (video.thumbnail) {
        let inputBuffer;

        if (video.thumbnail.startsWith('http')) {
          console.log(`Downloading thumbnail for ${video.title} from ${video.thumbnail}`);
          const response = await fetch(video.thumbnail);
          if (!response.ok) {
            throw new Error(`Failed to download thumbnail: ${response.statusText}`);
          }
          inputBuffer = Buffer.from(await response.arrayBuffer());
        }
        else {
          const localInputPath = path.join(publicDir, video.thumbnail);
          try {
            await fs.access(localInputPath);
            inputBuffer = await fs.readFile(localInputPath);
            console.log(`Using local thumbnail for ${video.title}: ${localInputPath}`);
          } catch (localFileError) {
            console.error(`[ERROR] Local thumbnail file not found for ${video.title}: ${localFileError.message}`);
            throw new Error(`Local thumbnail not found or accessible: ${localFileError.message}`);
          }
        }

        const optimizedBuffer = await sharp(inputBuffer)
          .resize({ width: OPTIMIZED_THUMBNAIL_WIDTH, withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer();

        const optimizedMetadata = await sharp(optimizedBuffer).metadata();
        const finalWidth = optimizedMetadata.width || DEFAULT_FALLBACK_WIDTH;
        const finalHeight = optimizedMetadata.height || DEFAULT_FALLBACK_HEIGHT;

        await fs.writeFile(outputPath, optimizedBuffer);
        console.log(`Processed and saved: ${outputPath} (Dimensions: ${finalWidth}x${finalHeight})`);

        processedVideos.push({
          ...video,
          thumbnail: relativeThumbnailPath,
          thumbnailWidth: finalWidth,
          thumbnailHeight: finalHeight,
        });

      } else {
        console.warn(`No thumbnail URL found for video: ${video.title}. Using placeholder.`);
        processedVideos.push({
          ...video,
          thumbnail: PLACEHOLDER_THUMBNAIL_PATH,
          thumbnailWidth: DEFAULT_FALLBACK_WIDTH,
          thumbnailHeight: DEFAULT_FALLBACK_HEIGHT,
        });
      }
    } catch (error) {
      console.error(`Error processing thumbnail for video ${video.id} (${video.title}):`, error.message);
      processedVideos.push({
        ...video,
        thumbnail: PLACEHOLDER_THUMBNAIL_PATH,
        thumbnailWidth: DEFAULT_FALLBACK_WIDTH,
        thumbnailHeight: DEFAULT_FALLBACK_HEIGHT,
      });
    }
  }

  await fs.writeFile(processedVideosPath, JSON.stringify(processedVideos, null, 2));
  console.log(`Processed video data saved to ${processedVideosPath}`);
  console.log('Thumbnail processing complete.');
}

processThumbnails().catch(console.error);
