import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
    const shoes = ["/images/jordan-blue.png", "/images/jordan-red.png", "/images/jordan-green.png"]; 
      const [step, setStep] = useState(0);
  const [selectedShoe, setSelectedShoe] = useState<string | null>(null);
  return (
    <main className="min-h-screen bg-gray-100 overflow-hidden relative">
         {/* 1. Zoom In/Out Animation (Shoes appear & disappear fluidly) */}
         {step === 0 && (
           <div className="relative w-full h-screen flex items-center justify-center">
             {shoes.map((src, i) => (
               <motion.img
                 key={i}
                 src={src}
                 alt="shoe"
                 className="w-40 h-40 absolute cursor-pointer"
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{
                   scale: [0, 1.2, 1],
                   opacity: [0, 1, 0],
                 }}
                 transition={{
                   duration: 3,
                   repeat: Infinity,
                   repeatDelay: 1,
                   ease: "easeInOut",
                   delay: i * 1.2,
                 }}
                 onClick={() => {
                   setSelectedShoe(src);
                   setStep(1);
                 }}
               />
             ))}
           </div>
         )}
   
         {/* 2. Click Shoe → Float to Next Div */}
         <AnimatePresence>
           {step === 1 && (
             <motion.div
               className="absolute inset-0 bg-white flex flex-col items-center justify-center"
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "-100%" }}
               transition={{ duration: 1 }}
             >
               <motion.img
                 src={selectedShoe || "/shoe1.png"}
                 alt="shoe"
                 className="w-56 h-56 mb-6"
                 initial={{ y: -300, opacity: 0, scale: 0.5 }}
                 animate={{ y: 0, opacity: 1, scale: 1 }}
                 transition={{ duration: 1.2, ease: "easeOut" }}
               />
               <button
                 className="px-6 py-3 bg-blue-600 text-white rounded-xl"
                 onClick={() => setStep(2)}
               >
                 Next Section
               </button>
             </motion.div>
           )}
         </AnimatePresence>
   
         {/* 3. Daisy Menu Section with Flying Shoe */}
         <AnimatePresence>
           {step === 2 && (
             <motion.div
               className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600 flex flex-col items-center justify-center text-white"
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "-100%" }}
               transition={{ duration: 1 }}
             >
               <motion.div className="relative w-60 h-60 flex items-center justify-center">
                 <motion.img
                   src={selectedShoe || "/shoe2.png"}
                   alt="shoe"
                   className="w-40 h-40 z-10"
                   initial={{ y: -200, opacity: 0, scale: 0.5 }}
                   animate={{ y: 0, opacity: 1, scale: 1 }}
                   transition={{ duration: 1.2, ease: "easeOut" }}
                 />
   
                 {/* Expanding Daisy Menu */}
                 {["Feature 1", "Feature 2", "Feature 3", "Feature 4"].map(
                   (label, i) => (
                     <motion.div
                       key={i}
                       className="absolute bg-white text-black px-3 py-2 rounded-xl shadow-lg"
                       initial={{ opacity: 0, scale: 0 }}
                       animate={{
                         opacity: 1,
                         scale: 1,
                         x: 120 * Math.cos((i * Math.PI) / 2),
                         y: 120 * Math.sin((i * Math.PI) / 2),
                       }}
                       transition={{ delay: i * 0.3 }}
                     >
                       {label}
                     </motion.div>
                   )
                 )}
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
       </main>
  )
}

export default Home
