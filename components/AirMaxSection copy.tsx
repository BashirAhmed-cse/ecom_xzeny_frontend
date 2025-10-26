
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowUp, ArrowDown, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";

type ProductColor = "black" | "red";

interface Product {
  name: string;
  images: string[];
  releaseDate: string;
  colorWay: string;
  features?: Array<{ icon: string; text: string }>;
  price?: string;
}

interface ColorTheme {
  bg: string;
  gradient: string;
  text: string;
}

interface AirMaxSectionProps {
  activeSection: "hero" | "airmax" | "shoecard";
  isAnimating: boolean;
  scrollDirection: "up" | "down";
  currentColorTheme: ColorTheme;
  productImage: string;
  currentProduct: Product;
  selectedProduct: ProductColor;
  currentImageIndex: number;
  onScrollUp: () => void;
  onScrollDown: () => void;
  onImageClick: () => void;
  showPreview: boolean;
  onCloseModal: () => void; // Add this
}


const defaultFeatures = [
  { icon: "✨", text: "Max Air Cushioning" },
  { icon: "🌿", text: "Eco-Friendly Materials" },
  { icon: "⚡", text: "Ultra-Lightweight" },
  { icon: "🔄", text: "Full Flexibility" },
];

const AirMaxSection: React.FC<AirMaxSectionProps> = ({
  activeSection,
  isAnimating,
  scrollDirection,
  currentColorTheme,
  productImage,
  currentProduct,
  selectedProduct,
  currentImageIndex,
  onScrollUp,
  onScrollDown,
  onImageClick,
  showPreview,
  onCloseModal,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 1024,
    []
  );
  const ANIMATION_DURATION = 500;
  const features = currentProduct.features || defaultFeatures;
  const price = currentProduct.price || "$149.99";
  const imageSrc = imageError ? "/images/fallback-shoe.png" : productImage;

  const imageVariants = {
    initial: {
      opacity: 0,
      scale: 1.1,
      x: 200,
      filter: "blur(12px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: ANIMATION_DURATION / 1000 * 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const textVariants = {
    initial: {
      opacity: 0,
      x: -50,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: ANIMATION_DURATION / 1000,
        delay: 0.3,
        ease: "easeOut",
      },
    },
  };

  const handleImageClick = () => {
    console.log("AirMaxSection image clicked, showPreview:", showPreview);
    onImageClick();
    setTimeout(() => onScrollDown(), ANIMATION_DURATION);
  };

  const handleImageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleImageClick();
    }
  };

  return (
    <>
      <section
        className="min-h-screen relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: currentColorTheme.bg }}
      >
        {/* Navigation Buttons */}
        <div
          className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex ${
            isMobile ? "flex-col" : "gap-4"
          }`}
        >
          <button
            onClick={onScrollUp}
            className="text-white/85 hover:text-white backdrop-blur-md bg-white/20 hover:bg-white/30 px-5 py-2 rounded-full border border-white/25 transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4" />
              <span className="text-xs font-medium">Back to top</span>
            </div>
          </button>
          <button
            onClick={onScrollDown}
            className="text-white/85 hover:text-white backdrop-blur-md bg-white/20 hover:bg-white/30 px-5 py-2 rounded-full border border-white/25 transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4" />
              <span className="text-xs font-medium">Next section</span>
            </div>
          </button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-center h-screen">
          {/* Left Side - Text Content */}
          <motion.div 
            className="space-y-8 text-white lg:col-span-4 order-2 lg:order-1 px-8 lg:px-12 xl:px-16"
            variants={textVariants}
            initial="initial"
            animate={activeSection === "airmax" ? "animate" : "initial"}
          >
            <div className="space-y-6">
              <h1 className="text-5xl font-black leading-none">
                <span className="block bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Airmax
                </span>
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  270
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 text-white bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-base font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">{price}</span>
                <span className="text-white/60 text-base">+ Free Shipping</span>
              </div>
              <Button className="bg-white text-black px-10 py-6 rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 text-lg shadow-2xl shadow-black/30">
                <ShoppingCart className="w-6 h-6 mr-3" />
                Add to Cart
              </Button>
            </div>
          </motion.div>

          {/* Right Side - Extra Large Image */}
          <motion.div 
            className="relative lg:col-span-8 order-1 lg:order-2 w-full h-[50vh] lg:h-screen overflow-visible"
            variants={imageVariants}
            initial="initial"
            animate={activeSection === "airmax" ? "animate" : "initial"}
            onClick={handleImageClick}
            onKeyDown={handleImageKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`View ${currentProduct.name} details or scroll to ShoeCard`}
          >
            <motion.div
              layoutId={`product-image-${selectedProduct}-${currentImageIndex}`}
              className={`relative ${
                isMobile 
                  ? 'w-full h-full' 
                  : 'w-[75%] h-full -right-[12.5%]'
              }`}
            >
              <Image
                src={imageSrc}
                alt={currentProduct.name}
                width={1600}
                height={1000}
                priority
                sizes="(max-width: 1024px) 100vw, 125vw"
                className={`object-contain ${
                  isMobile 
                    ? 'w-full h-full' 
                    : 'w-[125%] h-full max-w-none transform scale-150'
                } cursor-pointer`}
                onLoad={() => setImagesLoaded(true)}
                onError={() => setImageError(true)}
              />
            </motion.div>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-24 blur-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: activeSection === "airmax" ? 0.6 : 0,
                scale: 1
              }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="w-full h-full bg-gradient-to-t from-black/70 via-black/40 to-transparent rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Modal Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              console.log("Modal background clicked, closing");
              onImageClick();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Product image preview"
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.9, rotateX: 15, opacity: 0 }}
              animate={{ scale: 1.1, rotateX: 0, opacity: 1 }}
              exit={{ scale: 0.9, rotateX: -15, opacity: 0 }}
              transition={{
                duration: ANIMATION_DURATION / 1000,
                ease: [0.25, 0.8, 0.25, 1],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* <button
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
                onClick={() => {
                  console.log("Close button clicked");
                  onImageClick();
                }}
                aria-label="Close preview"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button> */}
              {imageError ? (
                <div className="flex flex-col items-center justify-center h-[90vh] w-[75vw] text-red-500">
                  <p>Failed to load image</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log("Retry button clicked for modal image");
                      setImageError(false);
                      setImagesLoaded(false);
                      const timeout = setTimeout(() => setImageError(true), 10000);
                      currentProduct.images.forEach((src: string) => {
                        const img = new window.Image();
                        img.src = src;
                        img.onload = () => clearTimeout(timeout);
                      });
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : !imagesLoaded ? (
                <div className="flex items-center justify-center h-[90vh] w-[75vw]">
                  <div className="animate-spin h-8 w-8 border-4 border-t-white border-gray-600 rounded-full" />
                </div>
              ) : (
                <Image
                  src={imageSrc}
                  alt={currentProduct.name}
                  width={1200}
                  height={1200}
                  sizes={isMobile ? "100vw" : "75vw"}
                  className={`object-contain ${
                    isMobile ? "max-h-[90vh] w-auto" : "max-h-[90vh] max-w-[75vw] w-auto"
                  }`}
                  priority
                  onLoad={() => {
                    console.log("Modal image loaded:", imageSrc);
                    setImagesLoaded(true);
                  }}
                  onError={() => {
                    console.log("Modal image error:", imageSrc);
                    setImageError(true);
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AirMaxSection;
