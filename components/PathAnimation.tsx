"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export default function PathAnimation() {
  // Define path coordinates (relative to viewport)
  const startX = 10; // 10vw
  const startY = 80; // 80vh
  const controlX = 50; // 50vw
  const controlY = 40; // 40vh
  const endX = 90; // 90vw
  const endY = 20; // 20vh

  const path = useMemo(
    () => `M ${startX}vw ${startY}vh Q ${controlX}vw ${controlY}vh ${endX}vw ${endY}vh`,
    []
  );

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      {/* Path (visible as guideline) */}
      <svg className="absolute w-full h-full" style={{ maxWidth: "100vw", maxHeight: "100vh" }}>
        <path d={path} stroke="blue" strokeWidth="2" fill="none" opacity="0.3" />
      </svg>

      {/* Moving Image */}
      <motion.img
        src="/images/jordan-red.png"
        alt="Moving Image"
        className="w-10 h-10 md:w-14 md:h-14"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
        style={{
          offsetPath: `path('${path}')`,
          offsetRotate: "auto", // rotate along the curve
        }}
      />

      {/* Fallback red dot if image fails */}
      <motion.div
        className="w-200 h-200 md:w-200 md:h-200 bg-red-500 rounded-full"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
        style={{
          offsetPath: `path('${path}')`,
          offsetRotate: "auto",
          display: "none", // show only manually if image fails
        }}
      />
    </div>
  );
}
