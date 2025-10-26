// src/components/HeroCTA.tsx
"use client";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";

interface HeroCTAProps {
  onScrollDown: () => void;
}

const ANIMATION_DURATION = 700;

export default function HeroCTA({ onScrollDown }: HeroCTAProps) {
  return (
    <motion.div
      className="flex flex-col gap-6 items-start self-start lg:min-w-[300px]"
      initial={{ y: 80, opacity: 0, filter: "blur(10px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        delay: 0.3,
        duration: ANIMATION_DURATION / 1000 * 0.9,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.h1
        className="text-3xl font-light leading-tight tracking-tight"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{
          delay: 0.5,
          duration: ANIMATION_DURATION / 1000 * 0.8,
          scale: { duration: 0.2 },
        }}
      >
        <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-playfair font-semibold">
          Wear your Style
        </span>
        <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-playfair font-semibold mt-2">
          with comfort.
        </span>
      </motion.h1>
      <motion.button
        className="relative flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-semibold text-base sm:text-lg text-white bg-gradient-to-r from-gray-900 to-gray-700 shadow-gray-900/25 hover:shadow-xl hover:shadow-purple-500/40 hover:from-purple-700 hover:to-blue-600 active:scale-95 transition-all duration-300 group overflow-hidden mt-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: ANIMATION_DURATION / 1000 * 0.6 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onScrollDown}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span className="font-semibold tracking-wide">Add to cart</span>
      </motion.button>
    </motion.div>
  );
}
