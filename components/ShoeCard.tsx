"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUp, ExternalLink } from "lucide-react";
import ViewDetailsButton from "./ViewDetailsButton";
import { useCart } from "@/lib/CartContext";
import AddToCartButton from "./AddToCartButton";
import Link from "next/link";

type ProductColor = "black" | "red";

interface Product {
  product_id: number;
  name: string;
  slug: string;
  images: string[];
  releaseDate: string;
  colorWay: string;
  features?: Array<{ text: string; emoji: string }>;
  base_price?: string;
  sale_price?: string;
}

interface ColorTheme {
  bg: string;
  gradient: string;
  text: string;
}

interface ShoeCardProps {
  activeSection: "hero" | "airmax" | "shoecard";
  isAnimating: boolean;
  scrollDirection: "up" | "down";
  currentColorTheme: ColorTheme;
  productImage: string;
  currentProduct: Product;
  onScrollUp: () => void;
  setShowPreview?: (value: boolean) => void;
}

const ANIMATION_DURATION = 1000;
const ANIMATION_DURATION_S = ANIMATION_DURATION / 1000;

const defaultFeatures = [
  { text: "Lightweight change", emoji: "⚡", delay: 0.3 },
  { text: "Sustainable influence", emoji: "🌿", delay: 0.4 },
  { text: "Shock absorption", emoji: "🛡️", delay: 0.5 },
  { text: "Duration attaining", emoji: "⏱️", delay: 0.6 },
];

const ShoeCard: React.FC<ShoeCardProps> = ({
  activeSection,
  isAnimating,
  scrollDirection,
  currentColorTheme,
  productImage,
  currentProduct,
  onScrollUp,
  setShowPreview,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const isMobile = useMemo(() => typeof window !== "undefined" && window.innerWidth < 1024, []);

  const featureTags = currentProduct.features || defaultFeatures;

  // Fix: Proper image source validation with fallback
  const imageSrc = useMemo(() => {
    if (imageError) return "/images/fallback-shoe.png";
    if (!productImage || productImage === "") return "/images/fallback-shoe.png";
    return productImage;
  }, [productImage, imageError]);

  const handleAddToCart = () => {
    if (!currentProduct) return;

    addToCart({
      id: currentProduct.product_id?.toString() || "0",
      name: currentProduct.name,
      size: "default",
      originalPrice: currentProduct.base_price || "0",
      discountedPrice: currentProduct.sale_price || currentProduct.base_price || "0",
      image: productImage || "/images/fallback-shoe.png",
      quantity: quantity,
    });
  };

  // Animation variants
  const imageAnimation = {
    hidden: {
      x: "-100vw",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATION_S * 1.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    },
    exit: {
      x: "100vw",
      opacity: 0,
      transition: {
        duration: ANIMATION_DURATION_S * 0.8,
        ease: "easeIn"
      }
    }
  };

  const textVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: 0.8,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.4 }
    }
  };

  const tagVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
    },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        delay: delay + 0.8,
        ease: "easeOut"
      },
    }),
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.4 }
    },
    hover: {
      scale: 1.05,
      y: -2,
      backgroundColor: "rgba(255,255,255,0.15)",
      transition: { duration: 0.3 },
    },
  };

  const buttonVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 1.2,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.4 }
    }
  };

  const handleImageError = () => {
    console.error("Failed to load image:", imageSrc);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImagesLoaded(true);
    setImageError(false);
  };

  const isActive = activeSection === "shoecard";

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <motion.div
        className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden"
        style={{ backgroundColor: currentColorTheme.bg }}
        initial="hidden"
        animate={isActive ? "visible" : "exit"}
        exit="exit"
      >
        {/* Scroll Up Button */}
        <motion.button
          onClick={onScrollUp}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 text-white/90 hover:text-white backdrop-blur-lg bg-white/15 hover:bg-white/25 px-6 py-3 rounded-2xl border border-white/30 transition-all duration-300 shadow-lg"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Product</span>
          </div>
        </motion.button>

        {/* Main Content Container - Improved Responsive Layout */}
        <div className="relative w-full max-w-7xl mx-auto h-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 xl:gap-12">
          
          {/* Image Section - Now wrapped with Link for navigation */}
          <Link 
            href={`/products/${currentProduct.product_id}/${currentProduct.slug}`}
            className="relative z-10 cursor-pointer w-full lg:w-[60%] xl:w-[65%] h-[50vh] sm:h-[60vh] lg:h-[80vh] flex items-center justify-center lg:justify-start order-1"
          >
            <motion.div
              variants={imageAnimation}
              initial="hidden"
              animate={isActive ? "visible" : "exit"}
              className="relative w-full h-full flex items-center justify-center lg:justify-start group"
            >
              {/* Background Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-l from-white/20 to-white/10 blur-2xl rounded-full"
                initial={{ scale: 0, opacity: 0, x: "100vw" }}
                animate={{ 
                  scale: isMobile ? 1.2 : 1.5, 
                  opacity: 0.3,
                  x: 0
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: 0.3,
                  ease: "easeOut"
                }}
              />

              {/* Click to View Overlay */}
              <motion.div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-2xl z-30 flex items-center justify-center"
                whileHover={{ opacity: 1 }}
                initial={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white/90 backdrop-blur-sm text-gray-900 px-6 py-3 rounded-full font-semibold text-sm shadow-2xl flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  <ExternalLink size={16} />
                  View Product Details
                </motion.div>
              </motion.div>

              <div className="relative w-full h-full flex items-center justify-center lg:justify-start">
                {imageSrc && imageSrc !== "" ? (
                  <Image
                    src={imageSrc}
                    alt={currentProduct.name || "Product image"}
                    width={2000}
                    height={1500}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 65vw"
                    className="object-contain drop-shadow-2xl relative z-20 w-full h-full lg:max-h-[80vh] group-hover:scale-105 transition-transform duration-500"
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '80vh'
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-white/10">
                    <div className="text-white text-center p-6">
                      <div className="text-xl font-semibold mb-2">No Image Available</div>
                      <div className="text-sm opacity-70">{currentProduct.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </Link>

          {/* Content Section - Improved Responsiveness */}
          <motion.div 
            className="w-full lg:w-[40%] xl:w-[35%] h-[40vh] sm:h-[30vh] lg:h-full flex flex-col justify-center items-center lg:items-start space-y-4 sm:space-y-6 lg:space-y-8 p-4 lg:pr-6 lg:pl-4 xl:pl-8 order-2"
          >
            {/* Main Heading */}
            <motion.div
              variants={textVariants}
              initial="hidden"
              animate={isActive ? "visible" : "exit"}
              className="text-center lg:text-left w-full"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Premium
                </span>
                <br />
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Quality
                </span>
              </h1>
              <p className="text-white/70 text-sm sm:text-base mt-3 lg:mt-4">
                Experience unmatched comfort and style with our premium collection.
              </p>
            </motion.div>

            {/* Features List - Improved Grid */}
            <motion.div 
              className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3"
            >
              {featureTags.map((tag, i) => (
                <motion.div
                  key={i}
                  custom={tag.delay}
                  variants={tagVariants}
                  initial="hidden"
                  animate={isActive ? "visible" : "exit"}
                  whileHover="hover"
                  className="flex items-center gap-3 text-white/90 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group w-full"
                >
                  <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {tag.emoji}
                  </span>
                  <span className="text-sm font-medium tracking-wide flex-1">{tag.text}</span>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-white/60 text-sm">→</span>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons - Improved Layout */}
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate={isActive ? "visible" : "exit"}
              className="w-full space-y-3 sm:space-y-4"
            >
              {/* Add to Cart Button */}
              <AddToCartButton 
                onAdd={handleAddToCart} 
                quantity={quantity}
                className="w-full"
                size="lg"
              />
              
              {/* View Details Button */}
              <ViewDetailsButton
                productId={currentProduct.product_id}
                slug={currentProduct.slug}
                variant="outline"
                size="lg"
                className="w-full border-white text-white hover:bg-white/10 backdrop-blur-lg"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ShoeCard;