// src/components/hero_components/HeroThumbnails.tsx
import React from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Product = {
  name: string;
  images: string[];
};

interface HeroThumbnailsProps {
  currentProduct?: Product;
  currentImageIndex: number;
  onImageIndexChange: (index: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
}

const HeroThumbnails: React.FC<HeroThumbnailsProps> = ({
  currentProduct,
  currentImageIndex,
  onImageIndexChange,
  onNextImage,
  onPrevImage,
}) => {
  // Safe fallback in case currentProduct or images is undefined
  const currentProductImages = currentProduct?.images || [];

  if (!currentProduct || currentProductImages.length === 0) {
    return null; // Render nothing if no product or images
  }

  return (
    <div className="flex items-center gap-2">
      {/* Previous Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevImage}
        className="text-white border-2 border-white/40 rounded-full hover:bg-white/20 h-10 w-10"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Thumbnails */}
      {currentProductImages.map((img, index) => (
        <button
          key={index}
          onClick={() => onImageIndexChange(index)}
          className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
            currentImageIndex === index
              ? "border-white scale-105 shadow-md shadow-white/20"
              : "border-gray-700 hover:border-white hover:scale-105"
          }`}
          aria-label={`Select image ${index + 1}`}
        >
          <Image
            src={img}
            alt={`Preview ${index + 1}`}
            fill
            sizes="50px"
            className="object-cover transition-transform hover:scale-110"
          />
        </button>
      ))}

      {/* Next Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNextImage}
        className="text-white border-2 border-white/40 rounded-full hover:bg-white/20 h-10 w-10"
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default HeroThumbnails;
