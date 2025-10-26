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
  onCloseModal: () => void;
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
      scale: 0.9,
      y: isMobile ? 50 : 0,
      x: isMobile ? 0 : 200,
      filter: "blur(8px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
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
      y: isMobile ? 30 : 0,
      x: isMobile ? 0 : -50,
    },
    animate: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: ANIMATION_DURATION / 1000,
        delay: isMobile ? 0.1 : 0.3,
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
    <div className="min-h-screen pt-16 md:pt-24">
     <section
  className="relative flex items-center justify-center overflow-hidden w-full max-w-full min-h-screen"
  style={{ backgroundColor: currentColorTheme.bg }}
>

        {/* Navigation Buttons - Mobile Optimized */}
        <div
          className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex ${
            isMobile ? "flex-row gap-2" : "gap-2"
          }`}
        >
          <button
            onClick={onScrollUp}
            className="text-white/85 hover:text-white backdrop-blur-md bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full border border-white/25 transition-all duration-300 text-xs"
          >
            <div className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <span className="font-medium">Back</span>
            </div>
          </button>
          <button
            onClick={onScrollDown}
            className="text-white/85 hover:text-white backdrop-blur-md bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full border border-white/25 transition-all duration-300 text-xs"
          >
            <div className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3" />
              <span className="font-medium">Next</span>
            </div>
          </button>
        </div>

        {/* Main Content - Mobile First Design */}
       <div className="relative z-10 w-full mx-auto flex flex-col lg:flex-row 
                  items-center justify-between px-4 sm:px-6 lg:px-12 xl:px-20 min-h-screen">
          
          {/* Image Section - Top on Mobile, Right on Desktop */}
     
<motion.div 
      className="relative w-full lg:w-3/5 h-[50vh] lg:h-full flex items-center justify-center order-1 lg:order-2"
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
        className="relative h-full flex items-center justify-center"
      >
        <Image
          src={imageSrc}
          alt={currentProduct.name}
          width={2000}
          height={1250}
          priority
          sizes="(max-width: 640px) 90vw, (max-width: 768px) 85vw, (max-width: 1024px) 80vw, 90vw"
          className="object-contain cursor-pointer w-full h-full lg:w-auto 
                     lg:h-[80vh] xl:h-[85vh] max-w-full"
          style={{ maxHeight: isMobile ? '50vh' : '85vh' }}
          onLoad={() => setImagesLoaded(true)}
          onError={() => setImageError(true)}
        />
      </motion.div>
    </motion.div>


          {/* Text Content Section - Bottom on Mobile, Left on Desktop */}
          <motion.div 
           className="w-full lg:w-2/5 h-[50vh] lg:h-full flex items-center justify-center 
                 lg:justify-start order-2 lg:order-1 py-6 lg:py-0 px-4"
            variants={textVariants}
            initial="initial"
            animate={activeSection === "airmax" ? "animate" : "initial"}
          >
            <div className="space-y-6 lg:space-y-8 text-white max-w-md w-full text-center lg:text-left">
              <div className="space-y-4 lg:space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                  <span className="block bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    Airmax
                  </span>
                </h1>
                <div className="flex items-baseline gap-3 justify-center lg:justify-start">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    270
                  </span>
                </div>
              </div>
              
              {/* Features Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-white bg-white/10 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300"
                  >
                    <span className="text-xl lg:text-2xl">{feature.icon}</span>
                    <span className="text-sm lg:text-base font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
              
              {/* Price and CTA */}
              <div className="space-y-4 lg:space-y-6">
                <div className="flex items-baseline gap-3 justify-center lg:justify-start">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{price}</span>
                  <span className="text-white/60 text-sm lg:text-base">+ Free Shipping</span>
                </div>
                <Button className="bg-white text-black w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-6 rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 text-base sm:text-lg shadow-2xl shadow-black/30">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modal Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
              className="relative mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                duration: ANIMATION_DURATION / 1000,
                ease: [0.25, 0.8, 0.25, 1],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              
              {!imagesLoaded ? (
                <div className="flex items-center justify-center h-32 w-32">
                  <div className="animate-spin h-8 w-8 border-4 border-t-white border-gray-600 rounded-full" />
                </div>
              ) : (
                <Image
                  src={imageSrc}
                  alt={currentProduct.name}
                  width={1200}
                  height={1200}
                  sizes="95vw"
                  className="object-contain max-h-[85vh] max-w-[95vw] w-auto"
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
    </div>
  );
};

export default AirMaxSection;