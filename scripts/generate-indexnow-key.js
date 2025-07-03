// scripts/generate-indexnow-key.js
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv'; // Import dotenv

// Muat variabel lingkungan dari .env
// Penting: Pastikan ini dijalankan di lingkungan Node.js di mana .env berada.
// Jika script ini dijalankan oleh CI/CD, variabel mungkin sudah tersedia sebagai ENV vars.
dotenv.config();

const API_KEY_NAME = process.env.INDEXNOW_API_KEY_NAME;
const PUBLIC_DIR = 'public'; // Folder public Astro Anda

async function generateIndexNowKeyFile() {
  if (!API_KEY_NAME) {
    console.warn('Variabel lingkungan INDEXNOW_API_KEY_NAME tidak ditemukan. File kunci IndexNow tidak akan dibuat.');
    return;
  }

  const fileName = `${API_KEY_NAME}.txt`; // Nama file: af3fca12-7873-411d-a6f0-dd59857f59a5.txt
  const filePath = path.join(PUBLIC_DIR, fileName);
  const fileContent = API_KEY_NAME; // Isi file adalah nilai dari API_KEY_NAME itu sendiri

  try {
    // Pastikan direktori public/ ada (jika belum ada)
    await fs.mkdir(PUBLIC_DIR, { recursive: true });

    // Tulis konten ke dalam file
    await fs.writeFile(filePath, fileContent);
    console.log(`Berhasil membuat file kunci IndexNow: ${filePath}`);
  } catch (error) {
    console.error(`Gagal membuat file kunci IndexNow: ${error}`);
  }
}

generateIndexNowKeyFile();