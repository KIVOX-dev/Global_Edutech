'use client'

import Image from 'next/image'
import { GalleryImage } from '@/data/gallery'

type Props = {
  image: GalleryImage
  onClick?: () => void
  className?: string
}

export default function GalleryThumbnail({ image, onClick, className = '' }: Props) {
  return (
    <div onClick={onClick} className={`cursor-pointer overflow-hidden rounded-xl border-4 border-white shadow-md hover:shadow-lg gallery-accent bg-background ${className}`}>
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      </div>
    </div>
  )
}
