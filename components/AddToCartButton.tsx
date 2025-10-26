'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';

interface AddToCartButtonProps {
  onAdd: (quantity: number) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
  className?: string;
  initialQuantity?: number;
  maxQuantity?: number;
}

export default function AddToCartButton({ 
  onAdd, 
  disabled = false, 
  variant = 'default',
  size = 'md',
  showQuantity = false,
  className = '',
  initialQuantity = 1,
  maxQuantity = 10
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);

  const handleAddToCart = () => {
    if (disabled) return;
    
    setIsAdded(true);
    onAdd(quantity); // Pass quantity to parent
    
    // Reset animation after 2 seconds
    setTimeout(() => setIsAdded(false), 2000);
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(maxQuantity, prev + 1));
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantStyles = {
    default: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-orange-500 text-orange-500 bg-transparent hover:bg-orange-500/10',
    ghost: 'text-orange-500 bg-orange-500/10 hover:bg-orange-500/20'
  };

  const disabledStyles = 'bg-gray-300 text-gray-500 cursor-not-allowed';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Quantity Selector */}
      {showQuantity && !disabled && (
        <motion.div 
          className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-sm font-medium text-white/80 px-2">Quantity</span>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              whileHover={{ scale: quantity > 1 ? 1.1 : 1 }}
              whileTap={{ scale: quantity > 1 ? 0.9 : 1 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                quantity > 1 
                  ? 'bg-white/20 text-white hover:bg-white/30' 
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              <Minus size={16} />
            </motion.button>
            
            <motion.span 
              key={quantity}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-semibold text-white min-w-8 text-center"
            >
              {quantity}
            </motion.span>
            
            <motion.button
              onClick={incrementQuantity}
              disabled={quantity >= maxQuantity}
              whileHover={{ scale: quantity < maxQuantity ? 1.1 : 1 }}
              whileTap={{ scale: quantity < maxQuantity ? 0.9 : 1 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                quantity < maxQuantity 
                  ? 'bg-white/20 text-white hover:bg-white/30' 
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              <Plus size={16} />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Main Add to Cart Button */}
      <motion.button
        onClick={handleAddToCart}
        disabled={disabled}
        className={`
          w-full rounded-xl font-semibold transition-all 
          flex items-center justify-center gap-3 relative overflow-hidden
          ${sizeStyles[size]}
          ${disabled ? disabledStyles : variantStyles[variant]}
        `}
        whileHover={!disabled ? { 
          scale: 1.02,
          y: -2
        } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        {/* Background Shine Effect */}
        {!disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}

        {/* Animated Icons */}
        <div className="relative z-10 flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isAdded ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Check className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="cart"
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
              >
                <ShoppingCart className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text with Animation */}
          <AnimatePresence mode="wait">
            {isAdded ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold"
              >
                ADDED TO CART!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="font-semibold"
              >
                {disabled ? 'OUT OF STOCK' : 'ADD TO CART'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Ripple Effect */}
        {!disabled && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-white/0 hover:bg-white/10"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>

      {/* Success Message */}
      <AnimatePresence>
        {isAdded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="text-center"
          >
            <motion.p 
              className="text-green-400 text-sm font-medium bg-green-400/10 rounded-lg py-2 px-4 border border-green-400/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ✅ Added {quantity} item{quantity > 1 ? 's' : ''} to cart!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quantity Limit Warning */}
      {quantity >= maxQuantity && (
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-amber-500 text-xs text-center"
        >
          Maximum quantity reached ({maxQuantity})
        </motion.p>
      )}
    </div>
  );
}