"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, X, Heart, Trash2, ChevronRight, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useTheme } from "@/lib/ThemeProvider";
import { useCart } from "@/lib/CartContext";
import { useRouter } from "next/navigation";

const ANIMATION_DURATION = 500; // ms
const ANIMATION_DURATION_S = ANIMATION_DURATION / 1000;

const CartDrawer: React.FC = () => {
  const { theme } = useTheme();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(137); // 2 minutes 17 seconds
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const isMobile = useMemo(() => typeof window !== "undefined" && window.innerWidth < 768, []);

  // Particle system
  const particlePositions = useMemo(
    () =>
      [...Array(isMobile ? 4 : 8)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: Math.random() * 2 + 1.5,
        delay: Math.random() * 0.8,
        yOffset: Math.random() * 20 - 10,
        opacityRange: Math.random() * 0.3 + 0.2,
        scaleRange: Math.random() * 0.4 + 0.5,
      })),
    [isMobile]
  );

  // Timer countdown
  useEffect(() => {
    if (isSheetOpen) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSheetOpen]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const handleOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (open) setTimeLeft(137); // reset timer
  };

  const handleQuantityChange = (id: string, delta: number) => updateQuantity(id, delta);
  const handleRemoveItem = (id: string) => removeFromCart(id);

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  // Handle checkout navigation
  const handleCheckout = () => {
    setIsSheetOpen(false); // Close the drawer
    router.push('/checkouts'); // Navigate to checkout page
  };

  // Totals - FIXED: Use getCartTotal from context and calculate discount properly
  const { subtotal, discount, total } = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const originalPrice = parseFloat(item.originalPrice);
      return sum + (originalPrice * item.quantity);
    }, 0);
    
    const discountedTotal = getCartTotal();
    const discount = subtotal - discountedTotal;
    
    return { 
      subtotal, 
      discount: Math.max(0, discount), 
      total: discountedTotal 
    };
  }, [cartItems, getCartTotal]);

  // Animation variants
  const sheetVariants = { 
    hidden: { x: "100%", opacity: 0 }, 
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { 
        duration: ANIMATION_DURATION_S, 
        type: "spring", 
        stiffness: 120, 
        damping: 12 
      } 
    } 
  };
  
  const itemVariants = { 
    hidden: { y: 20, opacity: 0 }, 
    visible: (i: number) => ({ 
      y: 0, 
      opacity: 1, 
      transition: { 
        delay: i * 0.1, 
        duration: ANIMATION_DURATION_S, 
        type: "spring", 
        stiffness: 120, 
        damping: 12 
      } 
    }) 
  };
  
  const progressBarVariants = { 
    initial: { width: 0 }, 
    animate: { 
      width: "50%", 
      transition: { 
        duration: 1, 
        ease: "easeOut", 
        delay: 0.3 
      } 
    } 
  };
  
  const timerVariants = { 
    initial: { scale: 0.8, opacity: 0 }, 
    animate: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        duration: 0.5, 
        type: "spring", 
        stiffness: 120, 
        delay: 0.5 
      } 
    } 
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <Sheet onOpenChange={handleOpenChange} open={isSheetOpen}>
      {/* Cart Button */}
      <SheetTrigger asChild>
        <motion.button 
          className="relative p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-lg" 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart className="h-5 w-5 text-white" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-semibold">
              {cartItemCount}
            </span>
          )}
        </motion.button>
      </SheetTrigger>

      {/* Drawer */}
      <SheetContent 
        side="right" 
        className="w-[90vw] sm:w-[450px] p-0 flex flex-col font-sans backdrop-blur-md border-l border-white/20" 
        style={{ backgroundColor: `${theme.bg}CC`, color: theme.text }}
      >
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particlePositions.map((pos, i) => (
            <motion.div 
              key={i} 
              className="absolute w-1 h-1 bg-white/20 rounded-full" 
              style={{ left: pos.left, top: pos.top }} 
              animate={{ 
                y: [0, pos.yOffset, 0], 
                opacity: [0, pos.opacityRange, 0], 
                scale: [0, pos.scaleRange, 0] 
              }} 
              transition={{ 
                duration: pos.duration, 
                repeat: Infinity, 
                delay: pos.delay, 
                ease: "easeInOut" 
              }} 
            />
          ))}
        </div>

        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-white/20 backdrop-blur-md" style={{ backgroundColor: `${theme.bg}99` }}>
          <SheetTitle className="text-base sm:text-lg font-extrabold" style={{ color: theme.text }}>
            Cart • {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
          </SheetTitle>
          <SheetClose asChild>
            <motion.button 
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-300" 
              style={{ color: theme.text }} 
              whileHover={{ scale: 1.1, rotate: 90 }} 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSheetOpen(false)}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </SheetClose>
        </SheetHeader>

        {/* Discount Progress */}
        {cartItems.length > 0 && (
          <motion.div 
            className="px-4 py-3 border-b border-white/20" 
            style={{ backgroundColor: `${theme.bg}99` }} 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: ANIMATION_DURATION_S, type: "spring", stiffness: 120, delay: 0.2 }}
          >
            <p className="text-xs sm:text-sm font-medium text-center text-gray-200">
              You're 1 away from a <span className="text-orange-500 font-bold">40% discount!</span>
            </p>
            <div className="relative flex items-center justify-between mt-3">
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200/30" 
                variants={progressBarVariants} 
                initial="initial" 
                animate="animate"
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400" 
                  variants={progressBarVariants} 
                />
              </motion.div>
              <div className="flex w-full justify-between z-10">
                {["40%", "50%", "60%"].map((percent, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <motion.div 
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 bg-white/90 flex items-center justify-center ${index === 0 ? "border-orange-500" : "border-gray-300"}`} 
                      whileHover={{ scale: 1.1, boxShadow: "0 4px 8px rgba(255,255,255,0.2)" }}
                    >
                      <ShoppingBag size={isMobile ? 14 : 16} className={`${index === 0 ? "text-orange-500" : "text-gray-400"}`} />
                    </motion.div>
                    <span className="mt-1 text-[10px] sm:text-xs font-semibold text-gray-300">{percent} OFF</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Cart Items */}
        <div className="px-4 py-4 flex-1 overflow-y-auto" style={{ backgroundColor: `${theme.bg}80` }}>
          {cartItems.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-400">Add some items to get started!</p>
            </motion.div>
          ) : (
            <>
              {cartItems.map((item, index) => (
                <motion.div 
                  key={`${item.id}-${item.size}`} 
                  className="flex items-start space-x-2 border border-white/20 rounded-lg p-2 relative backdrop-blur-md mb-3" 
                  style={{ backgroundColor: `${theme.bg}40` }} 
                  variants={itemVariants} 
                  initial="hidden" 
                  animate="visible" 
                  custom={index}
                >
                  <div className="relative">
                    <img 
                      src={imageErrors[item.id] ? "/images/fallback-product.png" : item.image} 
                      alt={item.name} 
                      width={isMobile ? 64 : 80} 
                      height={isMobile ? 64 : 80} 
                      className="rounded-md border border-white/20 object-cover" 
                      onError={() => handleImageError(item.id)} 
                    />
                    {item.appliedDiscount && (
                      <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-1 py-[1px] rounded">
                        -{item.appliedDiscount}%
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold truncate" style={{ color: theme.text }}>
                      {item.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-300">{item.size}</p>
                    <div className="flex items-center space-x-1 mt-2 border border-white/20 rounded-md w-fit bg-white/10">
                      <motion.button 
                        className="px-1.5 py-1 text-gray-300 hover:text-white disabled:opacity-30" 
                        whileHover={{ scale: item.quantity > 1 ? 1.1 : 1 }} 
                        whileTap={{ scale: item.quantity > 1 ? 0.9 : 1 }} 
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </motion.button>
                      <span className="text-xs px-2" style={{ color: theme.text }}>{item.quantity}</span>
                      <motion.button 
                        className="px-1.5 py-1 text-gray-300 hover:text-white" 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                      ${parseFloat(item.originalPrice).toFixed(2)}
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-orange-500">
                      ${parseFloat(item.discountedPrice).toFixed(2)}
                    </p>
                    <motion.button 
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500" 
                      whileHover={{ scale: 1.2, rotate: 15 }} 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}

              {/* Trust Badges */}
              <motion.div 
                className="grid grid-cols-3 gap-2 sm:gap-4 text-center mt-6 text-[10px] sm:text-xs font-medium text-gray-200" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.5, duration: ANIMATION_DURATION_S, type: "spring", stiffness: 120 }}
              >
                <div>
                  <span className="text-lg sm:text-xl">🚚</span>
                  <p className="mt-1">Tracked <br /> Insured Shipping</p>
                </div>
                <div>
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mx-auto" />
                  <p className="mt-1">200k+ Happy <br /> Customers</p>
                </div>
                <div>
                  <span className="text-lg sm:text-xl">💰</span>
                  <p className="mt-1">100% Money <br /> Back Guarantee</p>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Timer & Footer - Only show when cart has items */}
        {cartItems.length > 0 && (
          <>
            {/* Timer */}
            <motion.div 
              className="text-white text-center py-2 text-xs sm:text-sm font-medium backdrop-blur-md" 
              style={{ background: `linear-gradient(90deg, ${theme.bg}80, ${theme.bg}CC)`, color: theme.text }} 
              variants={timerVariants} 
              initial="initial" 
              animate="animate"
            >
              Cart reserved for <motion.span className="font-bold" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}>{formatTime(timeLeft)}</motion.span> more minutes!
            </motion.div>

            {/* Footer */}
            <motion.div 
              className="border-t border-white/20 p-4 backdrop-blur-md" 
              style={{ backgroundColor: `${theme.bg}99` }} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: ANIMATION_DURATION_S, type: "spring", stiffness: 120, delay: 0.3 }}
            >
              {discount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-200 mb-2">
                  <span>You Save</span>
                  <span className="text-green-500 font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-xl font-bold" style={{ color: theme.text }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <motion.button 
                className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white py-3 rounded-lg font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all relative overflow-hidden" 
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(255,255,255,0.2)" }} 
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12" 
                  initial={{ x: "-100%" }} 
                  whileHover={{ x: "100%" }} 
                  transition={{ duration: 0.6, ease: "easeInOut" }} 
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  CHECKOUT
                  <ChevronRight className="h-5 w-5" />
                </span>
              </motion.button>

              {/* Payment Icons */}
              <motion.div 
                className="flex justify-center items-center space-x-2 sm:space-x-3 mt-4" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.5, duration: ANIMATION_DURATION_S }}
              >
                {[
                  "https://img.icons8.com/color/48/visa.png",
                  "https://img.icons8.com/color/48/mastercard.png",
                  "https://img.icons8.com/color/48/paypal.png",
                  "https://img.icons8.com/color/48/shop-pay.png",
                  "https://img.icons8.com/color/48/apple-pay.png",
                  "https://img.icons8.com/color/48/google-pay.png",
                ].map((src, index) => (
                  <motion.img 
                    key={index} 
                    src={src} 
                    alt="Payment method" 
                    className="h-5 sm:h-6 w-auto" 
                    whileHover={{ scale: 1.1 }} 
                    transition={{ duration: 0.2 }} 
                  />
                ))}
              </motion.div>
            </motion.div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;