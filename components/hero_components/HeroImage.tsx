// src/components/HeroImage.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import React from "react";

interface HeroImageProps {
  imageSrc: string;
  productName: string;
  currentImageIndex: number;
  imagesLoaded: boolean;
  imageError: boolean;
  setImagesLoaded: (val: boolean) => void;
  setImageError: (val: boolean) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onImageClick: () => void;
  isMobile: boolean;
}

const ANIMATION_DURATION = 700;

export default function HeroImage({
  imageSrc,
  productName,
  currentImageIndex,
  imagesLoaded,
  imageError,
  setImagesLoaded,
  setImageError,
  onNextImage,
  onPrevImage,
  onImageClick,
  isMobile,
}: HeroImageProps) {
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);

  const swipeThreshold = isMobile ? 60 : 80;

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > swipeThreshold) onNextImage();
    if (touchStart - touchEnd < -swipeThreshold) onPrevImage();
  };

  return (
    <div className="relative flex-1 flex justify-center items-center overflow-hidden max-w-[90vw] mx-auto">
      <div className="relative w-full h-[70vh] flex justify-center items-center overflow-visible" style={{ perspective: "1500px" }}>
        <AnimatePresence mode="sync">
          {imagesLoaded && !imageError && (
            <motion.div
              key={`image-${currentImageIndex}`}
              initial={{ opacity: 0, x: 200, scale: 0.8, rotate: -5, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, rotate: 0, filter: "blur(0px)", transition: { duration: 0.6 } }}
              exit={{ opacity: 0, x: -200, scale: 0.8, rotate: 5, filter: "blur(6px)", transition: { duration: 0.6 } }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformStyle: "preserve-3d" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={onImageClick}
            >
              <Image
                src={imageSrc}
                alt={productName}
                width={800}
                height={600}
                className="w-[60vw] max-w-[600px] h-auto drop-shadow-2xl transition-transform duration-500"
                priority
                onLoad={() => setImagesLoaded(true)}
                onError={() => setImageError(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
