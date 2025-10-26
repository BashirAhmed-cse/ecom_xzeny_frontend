// components/FlashDiscount.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Tag, Zap, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';

interface FlashDiscount {
  id: number;
  percentage: number;
  trigger_condition: string;
  duration_minutes: number;
  start_date: string;
  end_date: string;
  message: string;
  is_active: boolean;
  title?: string;
  description?: string;
  minimum_purchase?: number;
}

interface FlashDiscountProps {
  discount: FlashDiscount;
  onClose: () => void;
  onApplyDiscount?: (percentage: number) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoClose?: boolean;
}

const FlashDiscount: React.FC<FlashDiscountProps> = ({ 
  discount, 
  onClose, 
  onApplyDiscount,
  position = 'top-right',
  autoClose = true
}) => {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  // Calculate time left until discount expires
  const calculateTimeLeft = useCallback(() => {
    try {
      const endTime = new Date(discount.end_date).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;
      
      return Math.max(0, Math.floor(difference / 1000)); // Convert to seconds
    } catch (error) {
      console.error('Error calculating time left:', error);
      return discount.duration_minutes * 60; // Fallback to duration minutes
    }
  }, [discount.end_date, discount.duration_minutes]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle auto-close when time runs out
  useEffect(() => {
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);

    if (autoClose && initialTimeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [calculateTimeLeft, autoClose]);

  const handleAutoClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 500);
  };

  const handleApplyDiscount = () => {
    onApplyDiscount?.(discount.percentage);
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  // Don't render if discount is not active or not visible
  if (!discount.is_active || !isVisible) return null;

  // Get urgency color based on time left
  const getUrgencyColor = () => {
    if (timeLeft < 60) return '#FF4444'; // Red for last minute
    if (timeLeft < 300) return '#FF9500'; // Orange for last 5 minutes
    return '#4CAF50'; // Green for more time
  };

  const urgencyColor = getUrgencyColor();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ 
          opacity: isClosing ? 0 : 1, 
          y: isClosing ? -50 : 0, 
          scale: isClosing ? 0.9 : 1 
        }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25 
        }}
        className={`fixed z-50 max-w-sm w-full sm:max-w-md ${positionClasses[position]}`}
      >
        <div 
          className="relative rounded-2xl p-6 shadow-2xl border-2 backdrop-blur-lg"
          style={{
            backgroundColor: `${theme.bg}CC`,
            borderColor: urgencyColor,
            color: theme.text,
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:scale-110 transition-transform duration-200"
            style={{
              backgroundColor: `${theme.text}20`
            }}
            aria-label="Close discount offer"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-2 rounded-full animate-pulse"
              style={{ backgroundColor: `${urgencyColor}20` }}
            >
              <Zap className="w-6 h-6" style={{ color: urgencyColor }} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {discount.title || 'Flash Sale! ⚡'}
              </h3>
              <p className="text-sm opacity-80 mt-1">
                {discount.message}
              </p>
            </div>
          </div>

          {/* Discount Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5" style={{ color: urgencyColor }} />
              <span 
                className="text-3xl font-black animate-bounce"
                style={{ color: urgencyColor }}
              >
                {discount.percentage}% OFF
              </span>
            </div>
            {discount.minimum_purchase && (
              <div className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                Min. ${discount.minimum_purchase}
              </div>
            )}
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" 
               style={{ backgroundColor: `${theme.text}10` }}>
            <Clock className="w-4 h-4" style={{ color: urgencyColor }} />
            <span className="font-mono text-lg font-bold" style={{ color: urgencyColor }}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm opacity-80">remaining</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4" 
               style={{ backgroundColor: `${theme.text}20` }}>
            <motion.div 
              className="h-2 rounded-full"
              style={{ backgroundColor: urgencyColor }}
              initial={{ width: '100%' }}
              animate={{ 
                width: `${(timeLeft / Math.max(calculateTimeLeft(), 1)) * 100}%` 
              }}
              transition={{ duration: 1 }}
            />
          </div>

          {/* Warning for low time */}
          {timeLeft < 60 && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-red-500 bg-opacity-20">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">
                Almost gone! Claim your discount now.
              </span>
            </div>
          )}

          {/* CTA Button */}
          <motion.button
            onClick={handleApplyDiscount}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 relative overflow-hidden"
            style={{ 
              backgroundColor: urgencyColor,
              boxShadow: `0 4px 14px 0 ${urgencyColor}40`
            }}
          >
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative z-10"
            >
              Apply {discount.percentage}% Discount
            </motion.span>
            
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-20"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
            />
          </motion.button>

          {/* Terms */}
          <p className="text-xs text-center mt-3 opacity-70">
            {discount.description || 'Limited time offer. Applies to selected items.'}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FlashDiscount;