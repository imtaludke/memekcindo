// src/utils/processThumbnails.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } = from 'node:url';
import sharp from 'sharp';
import rawVideosData from '../data/videos.json' with { type: 'json' };

// --- FUNGSI SLUGIFY DITEMPATKAN LANGSUNG DI SINI ---
function slugify(text) {
  return text
    .toString()
    .normalize('NFD') // Pecah karakter beraksen menjadi dasar + diakritik
    .replace(/[\u0300-\u036f]/g, '') // Hapus diakritik
    .toLowerCase() // Ubah ke huruf kecil
    .trim() // Hapus spasi di awal/akhir
    .replace(/\s+/g, '-') // Ganti spasi dengan tanda hubung
    .replace(/[^\w-]+/g, '') // Hapus semua karakter non-kata
    .replace(/--+/g, '-'); // Ganti beberapa tanda hubung dengan satu
}
// --- AKHIR FUNGSI SLUGIFY ---

const videosData = rawVideosData;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '../../');
const publicDir = path.join(projectRoot, 'public');
const optimizedThumbnailsDir = path.join(publicDir, 'optimized-thumbnails');
const processedVideosPath = path.join(publicDir, 'processedVideos.json');

const PLACEHOLDER_THUMBNAIL_PATH = '/placeholder.webp';
const DEFAULT_FALLBACK_WIDTH = 640;
const DEFAULT_FALLBACK_HEIGHT = 360;
const OPTIMIZED_THUMBNAIL_WIDTH = 640;

async function processThumbnails() {
  console.log('Starting thumbnail processing...');

  await fs.mkdir(optimizedThumbnailsDir, { recursive: true });

  const processedVideos = [];

  for (const video of videosData) {
    const videoSlug = slugify(video.title || 'untitled-video');
    const thumbnailFileName = `${videoSlug}-${video.id}.webp`;
    
    const outputPath = path.join(optimizedThumbnailsDir, thumbnailFileName);
    const relativeThumbnailPath = `/optimized-thumbnails/${thumbnailFileName}`;

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
            console.error(`[ERROR] Local thumbnail file not found for ${video.title}: ${localInputPath}.`, localFileError.message);
            throw new Error(`Local thumbnail not found or accessible: ${localFileError.message}`);
          }
        }

        const optimizedBuffer = await sharp(inputBuffer)
          .resize({ width: OPTIMIZED_THUMBNAIL_WIDTH, withoutEnlargement: true })
          .webp({ quality: 80 })
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
