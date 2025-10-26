"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AirMaxComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.7 }}
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Enhanced Shoe Image - Mobile Optimized */}
      <motion.div
        className="absolute inset-0 z-0 flex justify-center items-start lg:justify-end lg:items-center"
        initial={{ opacity: 0, x: 200, rotateY: -15 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 1.2, ease: "easeOut", type: "spring" }}
      >
        <div className="relative w-full h-[35vh] sm:h-[50vh] lg:h-[80vh] lg:w-[70vw] mt-8 lg:mt-0">
          {/* Glow Effect */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-110"
          />
          <Image
            src="/images/jordan-blue.png"
            alt="Nike Airmax 270"
            fill
            className="object-contain drop-shadow-2xl relative z-10"
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 50vw"
          />
        </div>
      </motion.div>

      {/* Enhanced Content - Mobile Optimized */}
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 items-center relative z-10">
        {/* Left Side - Enhanced Text */}
        <motion.div
          className="space-y-3 lg:space-y-4 text-center lg:text-left
                     mt-[40vh] sm:mt-[55vh] lg:mt-0
                     px-2 sm:px-0"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        >
          {/* Enhanced Headlines with Gradient - Mobile Optimized */}
          <motion.h1
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl sm:text-5xl font-black leading-none tracking-tighter"
          >
            <span className="bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              Airmax
            </span>
          </motion.h1>

          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-4xl sm:text-5xl font-black leading-none tracking-tighter"
          >
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Nike
            </span>
          </motion.h2>

          <motion.h3
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-4xl sm:text-5xl font-black leading-none tracking-tighter mb-3 lg:mb-4"
          >
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              270
            </span>
          </motion.h3>

          {/* Enhanced Description - Mobile Optimized */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-gray-600 text-sm sm:text-base lg:text-xl max-w-md mx-auto lg:mx-0 leading-relaxed font-medium px-2 sm:px-0"
          >
            Experience ultimate comfort with the revolutionary Air Max 270. 
            Featuring our largest Air unit yet for unprecedented cushioning 
            and all-day support.
          </motion.p>

          {/* Features Grid - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="grid grid-cols-2 gap-2 sm:gap-3 max-w-sm mx-auto lg:mx-0 pt-3 lg:pt-4 px-2 sm:px-0"
          >
            {[
              { icon: "✨", text: "Max Air Cushioning" },
              { icon: "🌿", text: "Sustainable Materials" },
              { icon: "⚡", text: "Lightweight Design" },
              { icon: "🔄", text: "360° Flexibility" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 bg-white/50 backdrop-blur-sm rounded-lg p-2 sm:p-3"
              >
                <span className="text-base sm:text-lg">{feature.icon}</span>
                <span className="leading-tight">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Buy Now Button - Mobile Optimized */}
          <motion.div
            className="pt-4 lg:pt-8 px-2 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-block w-full sm:w-auto"
            >
              <Link
                href="#"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 text-center block"
              >
                Buy Now • $149.99
              </Link>
              <motion.div
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.8 }}
              >
                -20%
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Empty right side for spacing */}
        <div className="hidden lg:block"></div>
      </div>
    </div>
  );
}