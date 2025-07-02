// scripts/prepareData.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const sourceJsonPath = path.join(publicDir, 'processedVideos.json');
const outputJsPath = path.resolve(__dirname, '../src/data/allVideos.ts'); // Save in src/data

try {
  // Ensure the output directory exists
  const outputDir = path.dirname(outputJsPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonData = fs.readFileSync(sourceJsonPath, 'utf-8');
  const parsedData = JSON.parse(jsonData);

  // Export the data as a default export from a .ts file
  const outputContent = `import type { VideoData } from '../utils/data';\n\nconst allVideos: VideoData[] = ${JSON.stringify(parsedData, null, 2)};\n\nexport default allVideos;\n`;

  fs.writeFileSync(outputJsPath, outputContent, 'utf-8');
  console.log(`Successfully pre-processed ${sourceJsonPath} to ${outputJsPath}`);
} catch (error) {
  console.error(`Error pre-processing video data: ${error.message}`);
  process.exit(1); // Exit with an error code if something goes wrong
}
