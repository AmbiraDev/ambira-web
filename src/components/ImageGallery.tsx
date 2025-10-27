'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
import { isEmpty } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  className?: string;
  variant?: 'carousel' | 'grid'; // carousel for editing, grid for feed
  priority?: boolean; // Add priority prop for LCP optimization
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  variant = 'grid',
  priority = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

  if (isEmpty(images)) return null;

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setLightboxOpen(true);
  };

  // Carousel variant (for edit modal, etc.)
  if (variant === 'carousel') {
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
      if (isRightSwipe && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    const goToPrevious = () => {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
    };

    const goToNext = () => {
      setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : prev));
    };

    return (
      <>
        <div className={`relative w-full ${className}`}>
          {/* Image Container */}
          <div
            className="relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={() => openLightbox(currentIndex)}
          >
            <Image
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              quality={90}
              priority={priority && currentIndex === 0}
              loading={priority && currentIndex === 0 ? 'eager' : 'lazy'}
            />

            {/* Navigation Arrows - Desktop */}
            {images.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors duration-200 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                )}
                {currentIndex < images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors duration-200 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Dot Indicators */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                    index === currentIndex
                      ? 'bg-[#007AFF] w-3'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <ImageLightbox
            images={images}
            initialIndex={lightboxStartIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </>
    );
  }

  // Grid variant (for feed) - Strava-style geometric layouts
  return (
    <>
      <div className={`relative w-full ${className}`}>
        {/* Single image - full width */}
        {images.length === 1 && (
          <div
            className="relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={images[0]}
              alt="Image 1"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              quality={90}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
          </div>
        )}

        {/* Two images - side by side */}
        {images.length === 2 && (
          <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square bg-gray-100 cursor-pointer overflow-hidden"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 300px"
                  quality={90}
                  priority={priority && index === 0}
                  loading={priority && index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        )}

        {/* Three or more images - large left, two stacked right */}
        {images.length >= 3 && (
          <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
            {/* Large image on left */}
            <div
              className="relative row-span-2 aspect-square bg-gray-100 cursor-pointer overflow-hidden"
              onClick={() => openLightbox(0)}
            >
              <Image
                src={images[0]}
                alt="Image 1"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 300px"
                quality={90}
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
              />
            </div>

            {/* Two smaller images stacked on right */}
            {images.slice(1, 3).map((image, index) => (
              <div
                key={index + 1}
                className="relative aspect-[4/3] bg-gray-100 cursor-pointer overflow-hidden"
                onClick={() => openLightbox(index + 1)}
              >
                <Image
                  src={image}
                  alt={`Image ${index + 2}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 300px"
                  quality={90}
                  loading="lazy"
                />
                {/* Show +N overlay on last visible image if there are more */}
                {index === 1 && images.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">+{images.length - 3}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxStartIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};
