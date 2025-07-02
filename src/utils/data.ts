export interface VideoData {
  id: string;
  title: string;
  description?: string;
  category: string;
  thumbnail: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  datePublished?: string;
  dateModified?: string;
  embedUrl: string;
  tags?: string;
  previewUrl?: string;
}
export async function getAllVideos(): Promise<VideoData[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockVideos);
    }, 100);
  });
}
