export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

// Build gallery images array dynamically from available images
const imageCount = 19; // Total images in the gallery folder
export const galleryImages: GalleryImage[] = Array.from({ length: imageCount }, (_, i) => {
  const imageNumber = i + 1;
  return {
    id: `image-${imageNumber}`,
    src: `/images/gallery/image${imageNumber}.jpg`,
    alt: `Global Edutech Gallery Image ${imageNumber}`,
    width: 1200, // Default width
    height: 800, // Default height
  };
});

export function getFeaturedGalleryImages(count: number = 6) {
  // Create a copy of the images array to avoid modifying the original
  const shuffled = [...galleryImages];
  
  // Fisher-Yates shuffle algorithm to randomize the images
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return the first 'count' images after shuffling
  return shuffled.slice(0, count);
}
