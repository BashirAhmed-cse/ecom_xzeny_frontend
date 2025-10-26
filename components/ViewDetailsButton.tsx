'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ViewDetailsButtonProps {
  productId: string | number;
  slug: string;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  iconType?: 'arrow' | 'eye' | 'external' | 'sparkles';
}

export default function ViewDetailsButton({
  productId,
  slug,
  variant = 'default',
  size = 'md',
  className,
  showIcon = true,
  iconType = 'arrow'
}: ViewDetailsButtonProps) {
  const { theme } = useTheme();

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantStyles = {
    default: 'text-white shadow-lg',
    outline: 'border-2 bg-transparent backdrop-blur-sm',
    ghost: 'bg-transparent hover:bg-white/10 backdrop-blur-sm',
    gradient: 'text-white shadow-xl'
  };

  const icons = {
    arrow: ArrowRight,
    eye: Eye,
    external: ExternalLink,
    sparkles: Sparkles
  };

  const IconComponent = icons[iconType];

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          borderColor: theme.primary || theme.bg,
          color: theme.primary || theme.text
        };
      case 'ghost':
        return {
          color: theme.text
        };
      case 'gradient':
        return {
          background: theme.gradient || `linear-gradient(135deg, ${theme.primary || '#6366f1'}, ${theme.secondary || '#ec4899'})`,
          color: theme.text
        };
      default:
        return {
          background: theme.primary || theme.bg,
          color: theme.text
        };
    }
  };

  return (
    <Link href={`/products/${productId}/${slug}`} className="block">
      <motion.div
        className={cn(
          'rounded-xl font-semibold transition-all flex items-center justify-center gap-3',
          'group relative overflow-hidden',
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        style={getButtonStyle()}
        whileHover={{ 
          scale: 1.02, 
          y: -2,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        {/* Background pulse for gradient variant */}
        {variant === 'gradient' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0"
            animate={{ x: [-100, 100] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        )}

        <span className="relative z-10 font-medium tracking-wide">
          View Details
        </span>
        
        {showIcon && (
          <motion.div
            className="relative z-10"
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <IconComponent 
              size={size === 'sm' ? 16 : size === 'md' ? 18 : 20} 
              className="transition-transform group-hover:scale-110"
            />
          </motion.div>
        )}
        
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </Link>
  );
}