export interface VideoData {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string; // Ini sekarang akan menjadi path lokal (misal: /optimized-thumbnails/id.webp)
  thumbnailWidth?: number; // Disarankan untuk menambahkan ini jika Anda ingin data yang lebih akurat
  thumbnailHeight?: number; // Disarankan untuk menambahkan ini jika Anda ingin data yang lebih akurat
  datePublished?: string;
  dateModified?: string;
  embedUrl: string;
  tags: string; // Tipe data diubah menjadi string
  previewUrl?: string;
}
