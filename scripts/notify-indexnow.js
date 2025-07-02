// scripts/notify-indexnow.js
import fetch from 'node-fetch'; // Pastikan 'node-fetch' terinstall: npm install node-fetch
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Dapatkan __dirname di ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Fungsi slugify yang sama dengan yang digunakan di tempat lain ---
// Ditempatkan langsung di sini untuk menghindari masalah impor .ts dari skrip .js/.mjs
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
// --- Akhir Fungsi slugify ---

// --- Konfigurasi Anda ---
const YOUR_DOMAIN = 'https://memekcindo.pages.dev'; // Ganti dengan domain Anda yang sebenarnya
const API_KEY_NAME = 'af3fca12-7873-411d-a6f0-dd59857f59a5'; // Ganti dengan GUID Anda
const API_KEY_LOCATION = `${YOUR_DOMAIN}/${API_KEY_NAME}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
// --- Akhir Konfigurasi ---

// Path langsung ke file videos.json Anda
const VIDEOS_JSON_PATH = path.resolve(__dirname, '../src/data/videos.json');
// Path ke cache URL terakhir yang dikirim (akan disimpan di root proyek)
const LAST_SENT_URLS_CACHE = path.resolve(__dirname, '../.indexnow_cache.json');

/**
 * Fungsi untuk mendapatkan semua URL video dari file videos.json.
 */
async function getAllVideoUrls() {
    try {
        const fileContent = await fs.readFile(VIDEOS_JSON_PATH, 'utf-8');
        const allVideos = JSON.parse(fileContent);

        if (!Array.isArray(allVideos)) {
            console.error('Data videos.json tidak dalam format array yang diharapkan.');
            return [];
        }

        return allVideos.map(video => {
            const slug = slugify(video.title || 'untitled-video'); // Tambahkan fallback untuk judul
            return `${YOUR_DOMAIN}/${slug}-${video.id}/`;
        });
    } catch (error) {
        console.error('Gagal memuat atau memproses videos.json:', error);
        return [];
    }
}

/**
 * Mengirim daftar URL ke IndexNow API.
 */
async function sendToIndexNow(urlsToSend) {
    if (urlsToSend.length === 0) {
        console.log('Tidak ada URL baru atau yang diperbarui untuk dikirim ke IndexNow.');
        return;
    }

    const chunkSize = 10000;
    for (let i = 0; i < urlsToSend.length; i += chunkSize) {
        const chunk = urlsToSend.slice(i, i + chunkSize);

        const payload = {
            host: new URL(YOUR_DOMAIN).hostname,
            key: API_KEY_NAME,
            keyLocation: API_KEY_LOCATION,
            urlList: chunk,
        };

        try {
            console.log(`Mengirim ${chunk.length} URL ke IndexNow (chunk ${Math.floor(i / chunkSize) + 1})...`);
            const response = await fetch(INDEXNOW_ENDPOINT, { // Menggunakan 'fetch' yang diimpor
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log(`Berhasil mengirim chunk URL ke IndexNow. Status: ${response.status}`);
            } else {
                console.error(`Gagal mengirim chunk URL ke IndexNow: ${response.status} - ${response.statusText}`);
                const errorBody = await response.text();
                console.error('Response body:', errorBody);
            }
        } catch (error) {
            console.error('Terjadi kesalahan saat mengirim ke IndexNow:', error);
        }
    }
}

/**
 * Fungsi utama yang mengelola proses notifikasi IndexNow.
 */
async function main() {
    const currentUrls = await getAllVideoUrls();
    let lastSentUrls = [];

    try {
        const cacheContent = await fs.readFile(LAST_SENT_URLS_CACHE, 'utf-8');
        lastSentUrls = JSON.parse(cacheContent);
    } catch (error) {
        console.log('Cache IndexNow tidak ditemukan atau rusak, akan mengirim semua URL baru.');
    }

    const urlsToSubmit = currentUrls.filter(url => !lastSentUrls.includes(url));

    await sendToIndexNow(urlsToSubmit);

    try {
        await fs.writeFile(LAST_SENT_URLS_CACHE, JSON.stringify(currentUrls), 'utf-8');
        console.log('Cache IndexNow berhasil diperbarui.');
    } catch (error) {
        console.error('Gagal memperbarui cache IndexNow:', error);
    }
}

// Jalankan fungsi utama
main();
