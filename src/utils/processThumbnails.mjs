// src/utils/processThumbnails.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import rawVideosData from '../data/videos.json' with { type: 'json' }; // Ensure this path is correct

// Extract the videos array. Adjust if your videos.json is a direct array.
const videosData = rawVideosData;

// You will likely need to adjust the path to the 'public' directory
// depending on where your script is located relative to the project root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assuming project root is two levels up from src/utils/
const projectRoot = path.join(__dirname, '../../');
const publicDir = path.join(projectRoot, 'public');
const optimizedThumbnailsDir = path.join(publicDir, 'optimized-thumbnails');
const processedVideosPath = path.join(publicDir, 'processedVideos.json'); // Adjusted to public/

// --- Define Constants for Fallback and Optimization ---
const PLACEHOLDER_THUMBNAIL_PATH = '/placeholder.webp'; // Ensure this file exists in public/
const DEFAULT_FALLBACK_WIDTH = 640; // Common 16:9 width
const DEFAULT_FALLBACK_HEIGHT = 360; // Common 16:9 height (640 * 9/16)
const OPTIMIZED_THUMBNAIL_WIDTH = 640; // Target width for all optimized thumbnails
// --- End Constants ---

async function processThumbnails() {
  console.log('Starting thumbnail processing...');

  // Create the optimized-thumbnails directory if it doesn't exist
  await fs.mkdir(optimizedThumbnailsDir, { recursive: true });

  const processedVideos = [];

  for (const video of videosData) {
    // Generate a consistent file name for the optimized thumbnail
    const thumbnailFileName = `${video.id}.webp`;
    const outputPath = path.join(optimizedThumbnailsDir, thumbnailFileName);
    const relativeThumbnailPath = `/optimized-thumbnails/${thumbnailFileName}`; // Path for Astro

    try {
      if (video.thumbnail) {
        let inputBuffer;
        
        // --- Handle Downloading Remote Thumbnails ---
        if (video.thumbnail.startsWith('http')) {
          console.log(`Downloading thumbnail for ${video.title} from ${video.thumbnail}`);
          const response = await fetch(video.thumbnail);
          if (!response.ok) {
            throw new Error(`Failed to download thumbnail: ${response.statusText}`);
          }
          inputBuffer = Buffer.from(await response.arrayBuffer());
        } 
        // --- Handle Local Thumbnails (if any in your videos.json) ---
        else {
          // This block handles cases where 'video.thumbnail' might already be a local path.
          // You MUST ensure this path is correct relative to the script's execution.
          const localInputPath = path.join(publicDir, video.thumbnail); // Adjust as needed
          try {
            // Check if the local file exists before attempting to read
            await fs.access(localInputPath); // Throws if file doesn't exist
            inputBuffer = await fs.readFile(localInputPath);
            console.log(`Using local thumbnail for ${video.title}: ${localInputPath}`);
          } catch (localFileError) {
            console.error(`[ERROR] Local thumbnail file not found for ${video.title}: ${localInputPath}.`, localFileError.message);
            // Fallback to error handling if local file isn't found
            throw new Error(`Local thumbnail not found or accessible: ${localFileError.message}`);
          }
        }

        // --- Process with Sharp (Optimizing & Getting Final Dimensions) ---
        // Even if original width/height weren't in videos.json, Sharp will detect them now.
        const optimizedBuffer = await sharp(inputBuffer)
          .resize({ width: OPTIMIZED_THUMBNAIL_WIDTH, withoutEnlargement: true }) // Resize to target width
          .webp({ quality: 80 }) // Convert to WebP with 80% quality
          .toBuffer();

        // Get dimensions of the *optimized* image (these are the final dimensions after resize)
        const optimizedMetadata = await sharp(optimizedBuffer).metadata();
        const finalWidth = optimizedMetadata.width || DEFAULT_FALLBACK_WIDTH;
        const finalHeight = optimizedMetadata.height || DEFAULT_FALLBACK_HEIGHT; // Sharp will calculate height based on aspect ratio

        // Write the optimized image to disk
        await fs.writeFile(outputPath, optimizedBuffer);
        console.log(`Processed and saved: ${outputPath} (Dimensions: ${finalWidth}x${finalHeight})`);

        // Add the processed video data to the array
        processedVideos.push({
          ...video, // Spread all original video properties
          thumbnail: relativeThumbnailPath, // Update to the new local path
          thumbnailWidth: finalWidth,       // Store the final optimized width
          thumbnailHeight: finalHeight,     // Store the final optimized height
        });

      } else {
        // Handle videos that don't have a thumbnail URL at all
        console.warn(`No thumbnail URL found for video: ${video.title}. Using placeholder.`);
        processedVideos.push({
          ...video,
          thumbnail: PLACEHOLDER_THUMBNAIL_PATH, // Use the defined placeholder
          thumbnailWidth: DEFAULT_FALLBACK_WIDTH,
          thumbnailHeight: DEFAULT_FALLBACK_HEIGHT,
        });
      }
    } catch (error) {
      console.error(`Error processing thumbnail for video ${video.id} (${video.title}):`, error.message);
      // If any error occurs during download or processing, use the placeholder
      processedVideos.push({
        ...video,
        thumbnail: PLACEHOLDER_THUMBNAIL_PATH, // Use a default placeholder if processing fails
        thumbnailWidth: DEFAULT_FALLBACK_WIDTH, // Default for placeholder
        thumbnailHeight: DEFAULT_FALLBACK_HEIGHT, // Default for placeholder
      });
    }
  }

  // Save the updated video data with local thumbnail paths
  await fs.writeFile(processedVideosPath, JSON.stringify(processedVideos, null, 2));
  console.log(`Processed video data saved to ${processedVideosPath}`);
  console.log('Thumbnail processing complete.');
}

// Execute the function and catch any top-level errors
processThumbnails().catch(console.error);
