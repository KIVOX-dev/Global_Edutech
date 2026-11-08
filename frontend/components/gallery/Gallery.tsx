'use client';

import React from 'react';
import { GalleryImage } from '@/data/gallery';
import GalleryThumbnail from '@/components/gallery/GalleryThumbnail';
import { useState } from 'react';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';

type GalleryProps = {
  images: GalleryImage[];
  preview?: boolean;
};

const Gallery: React.FC<GalleryProps> = ({ images, preview = false }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Limit to 6 images if preview mode
  const displayImages = preview ? images.slice(0, 6) : images;
  
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {displayImages.map((img, idx) => (
          <GalleryThumbnail 
            key={img.id} 
            image={img} 
            onClick={() => setSelectedIndex(idx)} 
          />
        ))}
      </div>

      {selectedIndex !== null && (
        <GalleryLightbox 
          images={displayImages} 
          initialIndex={selectedIndex} 
          onClose={() => setSelectedIndex(null)} 
        />
      )}
    </div>
  );
};

export default Gallery;