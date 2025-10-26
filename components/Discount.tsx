'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';

interface DiscountTier {
  tier_id: number;
  Discount_APPLY_type: 'CODE' | 'AUTO';
  discount_code: string | null;
  type: 'amount_off_products' | 'buy_x_get_y' | 'amount_off_order' | 'free_shipping';
  min_quantity: number | null;
  max_quantity: number | null;
  percentage_discount: string | null;
  fixed_discount: string | null;
  price_per_unit: string | null;
  free_ebook: boolean;
  free_shipping: boolean;
  label: string;
  description: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  translations: any[];
  amounts: any[];
}

interface DiscountProps {
  discountTiers: DiscountTier[];
  selectedDiscountTier: number | null;
  onSelectDiscountTier: (tierId: number | null) => void;
  basePrice: number;
  className?: string;
}

const Discount: React.FC<DiscountProps> = ({
  discountTiers,
  selectedDiscountTier,
  onSelectDiscountTier,
  basePrice,
  className = ''
}) => {
  const { theme, currentThemeName } = useTheme();

  // Generate theme-based styles using your theme system
  const getThemeStyles = () => {
    const isDark = theme.bg === '#0a0a0a';
    const isRed = theme.bg === '#9b1b1b';
    const isGreen = theme.bg === '#14532d';
    const isCustom = !isDark && !isRed && !isGreen;

    // Helper to adjust color opacity
    const withOpacity = (color: string, opacity: number) => {
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return color;
    };

    // Container styles
    const containerBg = isDark ? '#1a1a1a' : 
                       isRed ? withOpacity('#9b1b1b', 0.1) : 
                       isGreen ? withOpacity('#14532d', 0.1) : 
                       isCustom ? withOpacity(theme.bg, 0.1) : 
                       '#fffbeb';
    
    const containerBorder = isDark ? '#374151' : 
                           isRed ? withOpacity('#9b1b1b', 0.3) : 
                           isGreen ? withOpacity('#14532d', 0.3) : 
                           isCustom ? withOpacity(theme.bg, 0.3) : 
                           '#fed7aa';
    
    const containerText = isDark ? '#f3f4f6' : 
                         isRed ? '#7f1d1d' : 
                         isGreen ? '#14532d' : 
                         isCustom ? theme.text : 
                         '#92400e';

    // Card styles
    const cardBg = isDark ? '#262626' : 
                   isRed ? '#fff5f5' : 
                   isGreen ? '#f0fdf4' : 
                   isCustom ? withOpacity(theme.bg, 0.05) : 
                   '#ffffff';
    
    const cardBorder = isDark ? '#4b5563' : 
                      isRed ? '#fecaca' : 
                      isGreen ? '#d1fae5' : 
                      isCustom ? withOpacity(theme.bg, 0.2) : 
                      '#e5e7eb';

    // Selected state - use theme color for selection
    const selectedBg = isDark ? withOpacity('#3b82f6', 0.2) : 
                      isRed ? withOpacity('#ef4444', 0.1) : 
                      isGreen ? withOpacity('#10b981', 0.1) : 
                      isCustom ? withOpacity(theme.bg, 0.15) : 
                      withOpacity('#f59e0b', 0.1);
    
    const selectedBorder = isDark ? '#3b82f6' : 
                          isRed ? '#ef4444' : 
                          isGreen ? '#10b981' : 
                          isCustom ? theme.bg : 
                          '#f59e0b';

    // Text colors
    const textPrimary = isDark ? '#f9fafb' : 
                       isRed ? '#1f2937' : 
                       isGreen ? '#064e3b' : 
                       isCustom ? theme.text : 
                       '#1f2937';
    
    const textSecondary = isDark ? '#d1d5db' : 
                         isRed ? '#6b7280' : 
                         isGreen ? '#059669' : 
                         isCustom ? withOpacity(theme.text, 0.8) : 
                         '#6b7280';
    
    const textMuted = isDark ? '#9ca3af' : 
                     isRed ? '#9ca3af' : 
                     isGreen ? '#047857' : 
                     isCustom ? withOpacity(theme.text, 0.6) : 
                     '#9ca3af';

    // Badge colors - use theme-appropriate colors
    const badgeRed = isDark ? '#dc2626' : '#ef4444';
    const badgeOrange = isDark ? '#ea580c' : '#f97316';
    const badgeGreen = isDark ? '#16a34a' : '#22c55e';
    const badgePurple = isDark ? '#9333ea' : '#a855f7';
    
    // For BEST VALUE badge, use theme color if custom, otherwise use orange-red gradient
    const bestValueGradient = isCustom ? 
      `linear-gradient(135deg, ${theme.bg}, ${withOpacity(theme.bg, 0.7)})` : 
      'linear-gradient(135deg, #f97316, #dc2626)';

    return {
      container: {
        backgroundColor: containerBg,
        borderColor: containerBorder,
        color: containerText
      },
      card: {
        backgroundColor: cardBg,
        borderColor: cardBorder
      },
      selected: {
        backgroundColor: selectedBg,
        borderColor: selectedBorder
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
        muted: textMuted
      },
      badges: {
        red: badgeRed,
        orange: badgeOrange,
        green: badgeGreen,
        purple: badgePurple,
        bestValue: bestValueGradient
      }
    };
  };

  const themeStyles = getThemeStyles();

  // Format discount tier for display
  const formatDiscountTier = (tier: DiscountTier) => {
    let discountInfo = '';
    let finalPrice = basePrice;
    let saveAmount = 0;
    let badge = null;

    switch (tier.type) {
      case 'amount_off_products':
        if (tier.percentage_discount) {
          const discountPercent = parseFloat(tier.percentage_discount);
          saveAmount = basePrice * (discountPercent / 100);
          finalPrice = basePrice - saveAmount;
          discountInfo = `${discountPercent}% OFF`;
          
          // Add badge for high discounts
          if (discountPercent >= 30) {
            badge = { text: 'POPULAR', color: themeStyles.badges.red };
          } else if (discountPercent >= 20) {
            badge = { text: 'SAVE', color: themeStyles.badges.orange };
          }
        } else if (tier.fixed_discount) {
          saveAmount = parseFloat(tier.fixed_discount);
          finalPrice = basePrice - saveAmount;
          discountInfo = `$${saveAmount} OFF`;
          badge = { text: 'DEAL', color: themeStyles.badges.green };
        }
        break;
        
      case 'buy_x_get_y':
        if (tier.min_quantity && tier.price_per_unit) {
          const unitPrice = parseFloat(tier.price_per_unit);
          finalPrice = unitPrice;
          saveAmount = basePrice - unitPrice;
          discountInfo = `Buy ${tier.min_quantity}+`;
          badge = { text: 'BULK', color: themeStyles.badges.purple };
        }
        break;
        
      default:
        return null;
    }

    // Add best value badge for the tier with highest savings
    const allSavings = discountTiers.map(t => {
      if (t.percentage_discount) return parseFloat(t.percentage_discount);
      if (t.fixed_discount) return (parseFloat(t.fixed_discount) / basePrice) * 100;
      return 0;
    });
    
    const maxSaving = Math.max(...allSavings);
    const currentSaving = tier.percentage_discount ? parseFloat(tier.percentage_discount) : 
                         tier.fixed_discount ? (parseFloat(tier.fixed_discount) / basePrice) * 100 : 0;
    
    if (currentSaving === maxSaving && currentSaving > 0) {
      badge = { 
        text: 'BEST VALUE', 
        color: themeStyles.badges.bestValue,
        isGradient: true
      };
    }

    return {
      id: tier.tier_id,
      label: tier.label,
      description: tier.description,
      price: `$${finalPrice.toFixed(2)}`,
      original: `$${basePrice.toFixed(2)}`,
      save: `Save $${saveAmount.toFixed(2)}`,
      discountInfo,
      badge,
      freeEbook: tier.free_ebook,
      freeShipping: tier.free_shipping,
      minQuantity: tier.min_quantity
    };
  };

  // Filter and format active discount tiers
  const activeDiscounts = discountTiers
    .map(tier => formatDiscountTier(tier))
    .filter(Boolean);

  if (activeDiscounts.length === 0) {
    return null;
  }

  return (
    <div 
      className={`rounded-2xl p-6 ${className}`}
      style={{
        backgroundColor: themeStyles.container.backgroundColor,
        borderColor: themeStyles.container.borderColor,
        color: themeStyles.container.color,
        borderWidth: '1px'
      }}
    >
      <div className="flex items-center text-sm font-medium mb-4">
        <Tag size={16} className="mr-2" />
        SPECIAL OFFERS
      </div>

      <div className="space-y-3">
        {activeDiscounts.map((discount) => (
          <div
            key={discount.id}
            onClick={() => onSelectDiscountTier(
              selectedDiscountTier === discount.id ? null : discount.id
            )}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              selectedDiscountTier === discount.id 
                ? 'shadow-md' 
                : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: selectedDiscountTier === discount.id 
                ? themeStyles.selected.backgroundColor 
                : themeStyles.card.backgroundColor,
              borderColor: selectedDiscountTier === discount.id 
                ? themeStyles.selected.borderColor 
                : themeStyles.card.borderColor,
            }}
          >
            <div className="flex-1">
              <div className="font-medium flex items-center mb-1" style={{ color: themeStyles.text.primary }}>
                {discount.label}
                {discount.badge && (
                  <div 
                    className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold uppercase text-white"
                    style={{ 
                      background: discount.badge.isGradient 
                        ? discount.badge.color 
                        : discount.badge.color 
                    }}
                  >
                    {discount.badge.text}
                  </div>
                )}
              </div>
              
              <div className="text-sm mb-1" style={{ color: themeStyles.text.secondary }}>
                {discount.description}
              </div>
              
              <div className="flex items-center gap-4 text-xs" style={{ color: themeStyles.text.muted }}>
                {discount.discountInfo && (
                  <span 
                    className="font-medium"
                    style={{ color: themeStyles.selected.borderColor }}
                  >
                    {discount.discountInfo}
                  </span>
                )}
                {discount.freeShipping && (
                  <span className="flex items-center">
                    🚚 Free Shipping
                  </span>
                )}
                {discount.freeEbook && (
                  <span className="flex items-center">
                    📚 Free E-book
                  </span>
                )}
                {discount.minQuantity && discount.minQuantity > 1 && (
                  <span className="flex items-center">
                    📦 Min. {discount.minQuantity} items
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right ml-4">
              <div 
                className="font-bold text-xl" 
                style={{ color: themeStyles.text.primary }}
              >
                {discount.price}
              </div>
              <div 
                className="text-sm line-through" 
                style={{ color: themeStyles.text.muted }}
              >
                {discount.original}
              </div>
              <div 
                className="text-xs font-medium mt-1"
                style={{ color: themeStyles.badges.green }}
              >
                {discount.save}
              </div>
            </div>
          </div>
        ))}
        
        {/* No discount option */}
        <div
          onClick={() => onSelectDiscountTier(null)}
          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
            selectedDiscountTier === null ? 'shadow-md' : 'hover:shadow-sm'
          }`}
          style={{
            backgroundColor: selectedDiscountTier === null 
              ? themeStyles.selected.backgroundColor 
              : themeStyles.card.backgroundColor,
            borderColor: selectedDiscountTier === null 
              ? themeStyles.selected.borderColor 
              : themeStyles.card.borderColor,
          }}
        >
          <div className="flex-1">
            <div className="font-medium" style={{ color: themeStyles.text.primary }}>
              Single Item
            </div>
            <div className="text-sm" style={{ color: themeStyles.text.secondary }}>
              Purchase just one item at regular price
            </div>
          </div>
          
          <div className="text-right ml-4">
            <div 
              className="font-bold text-xl" 
              style={{ color: themeStyles.text.primary }}
            >
              ${basePrice.toFixed(2)}
            </div>
            <div 
              className="text-xs" 
              style={{ color: themeStyles.text.muted }}
            >
              Regular Price
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discount;