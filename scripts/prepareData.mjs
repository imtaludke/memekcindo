// scripts/prepareData.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const SOURCE_JSON_PATH = path.join(publicDir, 'processedVideos.json'); // Use a constant for source path
const OUTPUT_TS_PATH = path.resolve(__dirname, '../src/data/allVideos.ts'); // Use a constant for output path

try {
  // Ensure the output directory exists
  const outputDir = path.dirname(OUTPUT_TS_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }

  // Check if the source JSON file exists before trying to read it
  if (!fs.existsSync(SOURCE_JSON_PATH)) {
    throw new Error(`Source JSON file not found at ${SOURCE_JSON_PATH}. Please ensure 'processThumbnails.mjs' has run successfully.`);
  }

  const jsonData = fs.readFileSync(SOURCE_JSON_PATH, 'utf-8');
  const parsedData = JSON.parse(jsonData);

  // Export the data as a default export from a .ts file
  const outputContent = `import type { VideoData } from '../utils/data';\n\nconst allVideos: VideoData[] = ${JSON.stringify(parsedData, null, 2)};\n\nexport default allVideos;\n`;

  fs.writeFileSync(OUTPUT_TS_PATH, outputContent, 'utf-8');
  console.log(`Successfully pre-processed ${SOURCE_JSON_PATH} to ${OUTPUT_TS_PATH}`);
} catch (error) {
  console.error(`Error pre-processing video data: ${error.message}`);
  process.exit(1); // Exit with an error code if something goes wrong
}
