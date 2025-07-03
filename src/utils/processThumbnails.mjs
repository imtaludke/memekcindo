// src/utils/processThumbnails.mjs

import 'dotenv/config';
import fs from 'node:fs/promises'; // Gunakan 'node:fs/promises' untuk async
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

// --- Perubahan Utama: Output ke src/data/allVideos.ts ---
const OUTPUT_TS_PATH = path.resolve(__dirname, '../data/allVideos.ts');
// --- AKHIR Perubahan Utama ---

const YOUR_DOMAIN = process.env.PUBLIC_SITE_URL;
if (!YOUR_DOMAIN) {
    console.error("Error: PUBLIC_SITE_URL is not defined in environment variables. Please check your .env file and ensure it's loaded.");
    process.exit(1);
}

const PLACEHOLDER_THUMBNAIL_PATH = `/placeholder.webp`; // Path relatif untuk placeholder juga
const DEFAULT_FALLBACK_WIDTH = 300;
const DEFAULT_FALLBACK_HEIGHT = 168;
const OPTIMIZED_THUMBNAIL_WIDTH = 300;

async function processThumbnails() {
    console.log('Starting thumbnail processing...');

    // Pastikan direktori untuk thumbnail yang dioptimalkan ada di public/picture
    await fs.mkdir(optimizedThumbnailsDir, { recursive: true });

    // --- Perubahan: Pastikan direktori output TS juga ada ---
    const outputTsDir = path.dirname(OUTPUT_TS_PATH);
    await fs.mkdir(outputTsDir, { recursive: true });
    // --- AKHIR Perubahan ---

    const processedVideos = [];

    for (const video of videosData) {
        const videoSlug = slugify(video.title || 'untitled-video');
        const thumbnailFileName = `${videoSlug}-${video.id}.webp`; // Nama file yang konsisten
        const outputPath = path.join(optimizedThumbnailsDir, thumbnailFileName); // Path lengkap di sistem file
        const relativeThumbnailPath = `/${OPTIMIZED_IMAGES_SUBDIR}/${thumbnailFileName}`; // Path URL relatif

        try {
            // --- LOGIKA UTAMA: Cek apakah thumbnail sudah ada di folder optimizedThumbnailsDir ---
            let thumbnailAlreadyOptimized = false;
            try {
                // fs.constants.F_OK memeriksa keberadaan file
                await fs.access(outputPath, fs.constants.F_OK);
                thumbnailAlreadyOptimized = true;
                console.log(`Thumbnail ${thumbnailFileName} already exists. Skipping download/processing.`);
            } catch (e) {
                // File tidak ditemukan, lanjutkan ke proses download/optimasi
                thumbnailAlreadyOptimized = false;
            }

            if (thumbnailAlreadyOptimized) {
                // Jika sudah ada, langsung tambahkan ke processedVideos dengan info yang sudah ada
                let finalWidth = DEFAULT_FALLBACK_WIDTH;
                let finalHeight = DEFAULT_FALLBACK_HEIGHT;

                try {
                    // Baca metadata dari file yang sudah ada untuk mendapatkan dimensi asli
                    const existingMetadata = await sharp(outputPath).metadata();
                    finalWidth = existingMetadata.width || DEFAULT_FALLBACK_WIDTH;
                    finalHeight = existingMetadata.height || DEFAULT_FALLBACK_HEIGHT;
                } catch (metaError) {
                    console.warn(`Could not read metadata for existing thumbnail ${thumbnailFileName}: ${metaError.message}. Using fallback dimensions.`);
                }
                
                processedVideos.push({
                    ...video,
                    thumbnail: relativeThumbnailPath,
                    thumbnailWidth: finalWidth,
                    thumbnailHeight: finalHeight,
                });
                continue; // Lanjut ke video berikutnya
            }
            // --- AKHIR LOGIKA UTAMA ---

            // Jika thumbnail belum ada, lanjutkan proses download/optimasi
            let inputBuffer;

            if (video.thumbnail && video.thumbnail.startsWith('http')) {
                console.log(`Downloading thumbnail for ${video.title} from ${video.thumbnail}`);
                const response = await fetch(video.thumbnail);
                if (!response.ok) {
                    throw new Error(`Failed to download thumbnail: ${response.statusText}`);
                }
                inputBuffer = Buffer.from(await response.arrayBuffer());
            } else if (video.thumbnail) {
                const localInputPath = path.join(publicDir, video.thumbnail);
                try {
                    await fs.access(localInputPath); // Memastikan file lokal ada sebelum membaca
                    inputBuffer = await fs.readFile(localInputPath);
                    console.log(`Using local thumbnail for ${video.title}: ${localInputPath}`);
                } catch (localFileError) {
                    console.error(`[ERROR] Local thumbnail file not found or accessible for ${video.title}: ${localFileError.message}`);
                    throw new Error(`Local thumbnail not found or accessible: ${localFileError.message}`);
                }
            } else {
                console.warn(`No thumbnail URL found for video: ${video.title}. Using placeholder.`);
                // Jika tidak ada thumbnail sama sekali, gunakan placeholder dan lewati proses sharp
                processedVideos.push({
                    ...video,
                    thumbnail: PLACEHOLDER_THUMBNAIL_PATH,
                    thumbnailWidth: DEFAULT_FALLBACK_WIDTH,
                    thumbnailHeight: DEFAULT_FALLBACK_HEIGHT,
                });
                continue; // Lanjut ke video berikutnya
            }

            // Proses dengan Sharp
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

        } catch (error) {
            console.error(`Error processing thumbnail for video ${video.id} (${video.title}):`, error.message);
            // Tambahkan video ke daftar dengan placeholder jika terjadi error
            processedVideos.push({
                ...video,
                thumbnail: PLACEHOLDER_THUMBNAIL_PATH,
                thumbnailWidth: DEFAULT_FALLBACK_WIDTH,
                thumbnailHeight: DEFAULT_FALLBACK_HEIGHT,
            });
        }
    }

    // Filter video yang memiliki judul, deskripsi, dll. valid
    const filteredVideos = processedVideos.filter(video =>
        typeof video.title === 'string' && video.title.length > 0 &&
        typeof video.description === 'string' && video.description.length > 0 &&
        typeof video.category === 'string' && video.category.length > 0 &&
        typeof video.embedUrl === 'string' && video.embedUrl.length > 0 &&
        typeof video.thumbnail === 'string' && video.thumbnail.length > 0 &&
        typeof video.duration === 'number' && video.duration > 0 &&
        typeof video.id === 'string' && video.id.length > 0
    );

    // Pastikan tidak ada duplikasi berdasarkan ID
    const uniqueVideoIds = new Set();
    const uniqueVideos = filteredVideos.filter(video => {
        if (uniqueVideoIds.has(video.id)) {
            console.warn(`Video duplikat ditemukan dan diabaikan (ID: ${video.id}, Judul: ${video.title})`);
            return false;
        }
        uniqueVideoIds.add(video.id);
        return true;
    });

    // Urutkan video berdasarkan tanggal terbit terbaru
    const sortedVideos = uniqueVideos.sort((a, b) => {
        const dateA = new Date(a.datePublished || 0);
        const dateB = new Date(b.datePublished || 0);
        return dateB.getTime() - dateA.getTime();
    });

    // --- Perubahan Utama: Tulis langsung ke allVideos.ts ---
    const outputContent = `import type { VideoData } from '../utils/data';\n\nconst allVideos: VideoData[] = ${JSON.stringify(sortedVideos, null, 2)};\n\nexport default allVideos;\n`;
    await fs.writeFile(OUTPUT_TS_PATH, outputContent, 'utf-8');
    console.log(`Successfully pre-processed video data to ${OUTPUT_TS_PATH}`);
    // --- AKHIR Perubahan Utama ---

    console.log('Thumbnail processing complete.');
}

processThumbnails().catch(console.error);
