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

const ANIMATION_DURATION = 700;
const ANIMATION_DURATION_S = ANIMATION_DURATION / 1000;

const defaultFeatures = [
  { text: "Top-resident seal", emoji: "🔒", delay: 0.1 },
  { text: "End-friendly dyck", emoji: "🌿", delay: 0.2 },
  { text: "Lightweight energy", emoji: "⚡", delay: 0.3 },
  { text: "Sustainable Portugal", emoji: "🇵🇹", delay: 0.4 },
  { text: "Special atmosphere", emoji: "💫", delay: 0.5 },
  { text: "Duration discharge", emoji: "🕒", delay: 0.6 },
  { text: "Quick dry firing", emoji: "💨", delay: 0.7 },
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

  const imageVariants = {
    // Enter from right side
    scrollDownEnter: {
      x: isMobile ? 100 : 200,
      y: 0,
      scale: 0.8,
      rotate: -5,
      opacity: 0,
      filter: "blur(10px) brightness(0.8)",
      transition: { 
        duration: ANIMATION_DURATION_S * 1.2,
        ease: [0.25, 0.46, 0.45, 0.94],
        x: {
          duration: ANIMATION_DURATION_S,
          ease: [0.34, 1.56, 0.64, 1]
        },
        scale: {
          duration: ANIMATION_DURATION_S * 0.8,
          ease: [0.25, 0.8, 0.25, 1]
        }
      },
    },
    // Exit to left side
    scrollUpExit: {
      x: isMobile ? -100 : -200,
      y: isMobile ? 50 : 100,
      scale: isMobile ? 0.85 : 0.9,
      rotate: -8,
      opacity: 0,
      filter: "blur(8px) brightness(0.6)",
      transition: { 
        duration: ANIMATION_DURATION_S * 0.8,
        ease: [0.4, 0, 0.2, 1],
        x: {
          duration: ANIMATION_DURATION_S * 0.6,
          ease: [0.65, 0, 0.35, 1]
        }
      },
    },
    // Normal state - centered
    normal: {
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      opacity: 1,
      filter: "blur(0px) brightness(1)",
      transition: {
        duration: ANIMATION_DURATION_S * 0.6,
        ease: [0.25, 0.8, 0.25, 1]
      }
    },
    // Hover state
    hover: {
      scale: isMobile ? 1.02 : 1.05,
      y: -5,
      x: -2,
      rotate: -1,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      },
    },
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

  const tagVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.3, 
      x: 50,
      transition: { duration: 0.3 }
    },
    visible: (delay: number) => ({
      opacity: 1,
      scale: 1,
      x: 0,
      transition: { 
        duration: 0.8, 
        delay: delay, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.3,
      x: -50,
      transition: { duration: 0.4 }
    },
    hover: {
      scale: 1.1,
      y: -2,
      backgroundColor: "rgba(255,255,255,0.95)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
      transition: { duration: 0.3 },
    },
  };

  const ctaVariants = {
    hidden: { 
      y: 50, 
      opacity: 0,
      scale: 0.9
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: 1.2,
        type: "spring",
        stiffness: 80,
        damping: 15
      }
    },
    exit: {
      y: 30,
      opacity: 0,
      transition: { duration: 0.4 }
    }
  };

  const handleImageClick = () => {
    setShowPreview?.(true);
    setTimeout(() => onScrollUp(), ANIMATION_DURATION);
  };

  const imageSrc = imageError ? "/images/fallback-shoe.png" : productImage;

  const isEnteringShoeCard = isAnimating && scrollDirection === "down" && activeSection === "shoecard";
  const isExitingToAirmax = isAnimating && scrollDirection === "up" && activeSection === "airmax";
  const isActive = activeSection === "shoecard";

  // Determine animation state
  const getImageAnimation = () => {
    if (isEnteringShoeCard) {
      return "scrollDownEnter";
    } else if (isExitingToAirmax) {
      return "scrollUpExit";
    } else {
      return "normal";
    }
  };

  return (
    <motion.div
      className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      style={{ backgroundColor: currentColorTheme.bg }}
      variants={containerVariants}
      initial="hidden"
      animate={isActive ? "visible" : "exit"}
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

      {/* Main Content Container */}
      <div className="relative w-full h-screen flex flex-col lg:flex-row items-center justify-between">
        
        {/* Left Side - Image (70% of screen width on desktop) */}
        <motion.div
          variants={imageVariants}
          initial="scrollDownEnter"
          animate={getImageAnimation()}
          whileHover="hover"
          className="relative z-10 cursor-pointer w-full lg:w-[70%] h-[60%] lg:h-full flex items-center justify-center"
          onClick={handleImageClick}
        >
          {/* Animated Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 blur-xl rounded-full"
            initial={{ scale: 0, opacity: 0, x: 100 }}
            animate={{ 
              scale: isMobile ? 1.5 : 2, 
              opacity: 0,
              x: 0
            }}
            transition={{ 
              duration: 1.5, 
              delay: 0.5,
              ease: "easeOut"
            }}
          />

          {/* Secondary Glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 blur-lg rounded-full"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: isMobile ? 1.2 : 1.5, 
              opacity: 0.3 
            }}
            transition={{ 
              duration: 1.2, 
              delay: 0.8,
              ease: "easeOut"
            }}
          />

          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={imageSrc}
              alt={currentProduct.name}
              width={1600}
              height={1200}
              sizes="(max-width: 1024px) 100vw, 70vw"
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

        {/* Right Side - Floating Tags (30% of screen width on desktop) */}
        <motion.div 
          className="w-full lg:w-[30%] h-[40%] lg:h-full flex flex-row lg:flex-col justify-center lg:justify-center items-center lg:items-start space-x-2 lg:space-x-0 space-y-0 lg:space-y-4 p-4 lg:pr-8 lg:pl-4 overflow-x-auto lg:overflow-visible"
          variants={containerVariants}
        >
          {featureTags.map((tag, i) => (
            <motion.div
              key={i}
              custom={tag.delay}
              variants={tagVariants}
              initial="hidden"
              animate={isActive ? "visible" : "exit"}
              whileHover="hover"
              className="bg-white/90 backdrop-blur-sm border border-white/60 shadow-2xl px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 cursor-pointer whitespace-nowrap z-30 flex-shrink-0 lg:w-full"
            >
              <span className="text-xl">
                {tag.emoji}
              </span>
              <span className="text-gray-800 font-semibold">{tag.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA Section */}
        <motion.div
          variants={ctaVariants}
          initial="hidden"
          animate={isActive ? "visible" : "exit"}
          className="absolute bottom-8 left-0 w-full flex flex-col lg:flex-row justify-between items-center px-4 lg:px-8 space-y-4 lg:space-y-0"
        >
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 40px rgba(255,255,255,0.3)",
              y: -2
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-gray-900 px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg shadow-xl text-center hover:bg-gray-100 transition-all duration-300 w-full lg:w-auto"
            onClick={() => {/* Add collection navigation logic */ }}
          >
            Explore Collection →
          </motion.button>

          <motion.div
            initial={{ x: 100, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.9 }}
            transition={{ 
              duration: 1, 
              delay: 1, 
              type: "spring",
              stiffness: 60,
              damping: 12
            }}
            className="text-center lg:text-right w-full lg:w-auto"
          >
            <h1 className="text-2xl lg:text-4xl font-black text-white leading-tight">
              <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Quality
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                that speaks.
              </span>
            </h1>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ShoeCard;