// src/utils/processThumbnails.mjs (or src/utils/processThumbnails.mjs)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import videosData from '../data/videos.json' with { type: 'json' }; // Ensure this path is correct

// You will likely need to adjust the path to the 'public' directory
// depending on where your script is located relative to the project root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assuming project root is two levels up from src/utils/
const projectRoot = path.join(__dirname, '../../');
const publicDir = path.join(projectRoot, 'public');
const optimizedThumbnailsDir = path.join(publicDir, 'optimized-thumbnails');
const processedVideosPath = path.join(publicDir, 'processedVideos.json'); // Adjusted to public/

async function processThumbnails() {
  console.log('Starting thumbnail processing...');

  // Create the optimized-thumbnails directory if it doesn't exist
  await fs.mkdir(optimizedThumbnailsDir, { recursive: true });

  const processedVideos = [];

  for (const video of videosData) {
    const thumbnailFileName = `${video.id}.webp`; // Use .webp extension
    const outputPath = path.join(optimizedThumbnailsDir, thumbnailFileName);
    const relativeThumbnailPath = `/optimized-thumbnails/${thumbnailFileName}`; // Path for Astro

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
        } else {
          // Handle local paths if necessary, though current setup uses remote.
          // This part might need adjustment if your initial videos.json has local paths
          // or if you intend to handle non-URL thumbnails differently.
          console.warn(`Skipping non-HTTP thumbnail for ${video.title}: ${video.thumbnail}`);
          processedVideos.push({
            ...video,
            thumbnail: video.thumbnail, // Keep original if not processed
            // You might want to set default width/height here or ensure they are present.
            thumbnailWidth: video.thumbnailWidth || 640,
            thumbnailHeight: video.thumbnailHeight || 360,
          });
          continue;
        }

        // Process with sharp
        const metadata = await sharp(inputBuffer).metadata();
        const originalWidth = metadata.width;
        const originalHeight = metadata.height;

        // Resize to a common width (e.g., 640px) while maintaining aspect ratio
        const optimizedBuffer = await sharp(inputBuffer)
          .resize({ width: 640, withoutEnlargement: true }) // Adjust width as needed
          .webp({ quality: 80 }) // Convert to WebP with 80% quality
          .toBuffer();

        // Get dimensions of the *optimized* image
        const optimizedMetadata = await sharp(optimizedBuffer).metadata();
        const finalWidth = optimizedMetadata.width;
        const finalHeight = optimizedMetadata.height;

        await fs.writeFile(outputPath, optimizedBuffer);
        console.log(`Processed and saved: ${outputPath}`);

        processedVideos.push({
          ...video,
          thumbnail: relativeThumbnailPath, // Update to local path
          thumbnailWidth: finalWidth,
          thumbnailHeight: finalHeight,
        });
      } else {
        console.warn(`No thumbnail URL for video: ${video.title}. Skipping.`);
        // Include video even if no thumbnail, but keep original empty thumbnail path
        processedVideos.push({
            ...video,
            thumbnail: '', // Ensure thumbnail is an empty string or null
            thumbnailWidth: 0,
            thumbnailHeight: 0,
        });
      }
    } catch (error) {
      console.error(`Error processing thumbnail for video ${video.id} (${video.title}):`, error);
      // If there's an error, still add the video but use a placeholder or original path
      processedVideos.push({
        ...video,
        thumbnail: `/placeholder.webp`, // Use a default placeholder if processing fails
        thumbnailWidth: 640, // Default for placeholder
        thumbnailHeight: 360, // Default for placeholder
      });
    }
  }

  // Save the updated video data with local thumbnail paths
  await fs.writeFile(processedVideosPath, JSON.stringify(processedVideos, null, 2));
  console.log(`Processed video data saved to ${processedVideosPath}`);
  console.log('Thumbnail processing complete.');
}

processThumbnails().catch(console.error);