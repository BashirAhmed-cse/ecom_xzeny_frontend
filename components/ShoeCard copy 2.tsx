"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

type ProductColor = "black" | "red";

interface Product {
  name: string;
  images: string[];
  releaseDate: string;
  colorWay: string;
  features?: Array<{ text: string; emoji: string }>;
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
  { text: "Equivalently given", emoji: "⚖️", delay: 0.1 },
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

  const isMobile = useMemo(() => typeof window !== "undefined" && window.innerWidth < 1024, []);

  const featureTags = currentProduct.features || defaultFeatures;

  // RIGHT to LEFT animation - starts from RIGHT and moves to LEFT
  const imageAnimation = {
    hidden: {
      x: "-100vw", // Start from RIGHT side (completely off-screen to the right)
      opacity: 0,
    },
    visible: {
      x: 0, // Move to final LEFT position
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATION_S * 1.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    },
    exit: {
      x: "100vw", // Exit to LEFT side
      opacity: 0,
      transition: {
        duration: ANIMATION_DURATION_S * 0.8,
        ease: "easeIn"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
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
      backgroundColor: "rgba(255,255,255,0.95)",
      transition: { duration: 0.3 },
    },
  };

  const handleImageClick = () => {
    setShowPreview?.(true);
    setTimeout(() => onScrollUp(), ANIMATION_DURATION);
  };

  const imageSrc = imageError ? "/images/fallback-shoe.png" : productImage;

  const isActive = activeSection === "shoecard";

  return (
    <div className="h-screen pt-24 mb-4">
    <motion.div
      className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      style={{ backgroundColor: currentColorTheme.bg }}
      initial="hidden"
      animate={isActive ? "visible" : "exit"}
      exit="exit"
    >
      {/* Scroll Up Button */}
      <motion.button
        onClick={onScrollUp}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 text-white/85 hover:text-white backdrop-blur-md bg-white/20 hover:bg-white/30 px-5 py-2 rounded-full border border-white/25 transition-all duration-300"
        whileHover={{ scale: 1.15, y: -2 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <ArrowUp className="w-4 h-4" />
          <span className="text-xs font-medium">Back to AirMax</span>
        </div>
      </motion.button>

      {/* Main Content Container - 75% Image, 25% Content */}
      <div className="relative w-full h-screen flex flex-col lg:flex-row items-center justify-between">
        
        {/* Image Section - RIGHT to LEFT animation */}
        <motion.div
          className="relative z-10 cursor-pointer w-full lg:w-[75%] h-[60%] lg:h-full flex items-center justify-start order-1"
          onClick={handleImageClick}
          variants={imageAnimation}
          initial="hidden"
          animate={isActive ? "visible" : "exit"}
        >
          {/* Background Glow Effect - also from right */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-white/20 to-white/10 blur-xl rounded-full"
            initial={{ scale: 0, opacity: 0, x: "100vw" }}
            animate={{ 
              scale: isMobile ? 1.5 : 2, 
              opacity: 0,
              x: 0
            }}
            transition={{ 
              duration: 1.5, 
              delay: 0.3,
              ease: "easeOut"
            }}
          />

          <div className="relative w-full h-full flex items-center justify-start">
            <Image
              src={imageSrc}
              alt={currentProduct.name}
              width={2000}
              height={1500}
              sizes="(max-width: 1024px) 100vw, 75vw"
              className="object-contain drop-shadow-2xl relative z-20 w-full h-full"
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              onLoad={() => setImagesLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        </motion.div>

        {/* Content Section - 25% width */}
        <motion.div 
          className="w-full lg:w-[25%] h-[40%] lg:h-full flex flex-col justify-center items-center lg:items-start space-y-6 lg:space-y-8 p-4 lg:pr-8 lg:pl-6 order-2"
        >
          {/* Main Heading */}
          <motion.div
            variants={textVariants}
            initial="hidden"
            animate={isActive ? "visible" : "exit"}
            className="text-center lg:text-left w-full"
          >
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Quality
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                that speaks.
              </span>
            </h1>
          </motion.div>

          {/* Features List */}
          <motion.div 
            className="w-full space-y-2 lg:space-y-3"
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
                <span className="text-sm font-medium tracking-wide truncate">{tag.text}</span>
                <motion.div
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-white/60 text-sm">→</span>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            variants={textVariants}
            initial="hidden"
            animate={isActive ? "visible" : "exit"}
            className="w-full"
          >
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(255,255,255,0.2)",
                y: -2
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-gray-900 w-full px-6 py-3 rounded-xl font-bold text-base shadow-xl hover:bg-gray-100 transition-all duration-300 text-center"
              onClick={() => {/* Add collection navigation logic */ }}
            >
              Explore Collection →
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
    </div>
  );
};

export default ShoeCard;