"use client";

import React, { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, Shield, Truck, Clock, CheckCircle, Palette, Plus, Minus } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import Discount from "@/components/Discount"; // Import the Discount component
import { useCart } from "@/lib/CartContext";
import { useTheme } from "@/lib/ThemeProvider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import FlashDiscount from "@/components/FlashDiscount";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009/api";
const IMG_API_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3009";

interface PageProps {
  params: Promise<{
    id: string;
    slug: string;
  }>;
}

// Discount Tier Interface
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

const getDarkerShade = (color: string, percent: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const darkerR = Math.floor(r * (1 - percent/100));
  const darkerG = Math.floor(g * (1 - percent/100));
  const darkerB = Math.floor(b * (1 - percent/100));
  
  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};

// Generate structured data for rich snippets including FAQ schema
const generateStructuredData = (product: any) => {
  const faqSchema = product.faqs?.map((faq: any) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.ques_ans
    }
  })) || [];

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.seo?.meta_description || product.description?.replace(/<[^>]*>/g, '').substring(0, 160),
    "image": product.media?.primary_image?.image_url || product.media?.images[0]?.image_url,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.category?.name || "Brand"
    },
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "priceCurrency": "USD",
      "price": product.pricing.final_price,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": product.inventory_summary?.total_available > 0 ? 
        "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "73"
    },
    ...(faqSchema.length > 0 && {
      "mainEntity": faqSchema
    })
  };
};

const ProductDetailsPage = ({ params }: PageProps) => {
  const { id, slug } = use(params);
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string[]>([]);
  const [activeFlashDiscount, setActiveFlashDiscount] = useState<any>(null);
  const [showFlashDiscount, setShowFlashDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);

  // Discount tier states
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([]);
  const [selectedDiscountTier, setSelectedDiscountTier] = useState<number | null>(null);

console.log('check product:-',product);

  const { addToCart } = useCart();
  const { theme, themes, switchTheme, currentThemeName, registerProductThemes } = useTheme();

  // Fetch discount tiers
  const fetchDiscountTiers = async () => {
    try {
      const response = await fetch(`${API_URL}/discount-tiers`);
      const data = await response.json();
      
      if (data.success) {
        const now = new Date();
        const activeTiers = data.data.filter((tier: DiscountTier) => {
          if (!tier.is_active) return false;
          const startDate = new Date(tier.start_date);
          const endDate = new Date(tier.end_date);
          return now >= startDate && now <= endDate;
        });
        setDiscountTiers(activeTiers);
      }
    } catch (error) {
      console.error('Error fetching discount tiers:', error);
    }
  };

  // Check for active flash discounts
  const getActiveFlashDiscounts = useCallback(() => {
    if (!product?.flash_discounts) return [];
    
    const now = new Date();
    return product.flash_discounts.filter((discount: any) => {
      const startDate = new Date(discount.start_date);
      const endDate = new Date(discount.end_date);
      return discount.is_active && now >= startDate && now <= endDate;
    });
  }, [product]);

  // Show flash discount based on trigger condition
  const showFlashDiscountByTrigger = useCallback((discounts: any[]) => {
    const pageLoadDiscount = discounts.find(d => d.trigger_condition === 'on_page_load');
    if (pageLoadDiscount) {
      setActiveFlashDiscount(pageLoadDiscount);
      setShowFlashDiscount(true);
      return;
    }
  }, []);

  useEffect(() => {
    if (product?.flash_discounts) {
      const activeDiscounts = getActiveFlashDiscounts();
      if (activeDiscounts.length > 0) {
        showFlashDiscountByTrigger(activeDiscounts);
      }
    }
  }, [product, getActiveFlashDiscounts, showFlashDiscountByTrigger]);

  const getImageUrl = (path: string) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `${IMG_API_URL}${path}`;
    return `${IMG_API_URL}/${path}`;
  };

  useEffect(() => {
    fetchProductDetails();
    fetchDiscountTiers();
  }, [id]);

  // Calculate final price with discount tier
  const calculateFinalPrice = () => {
    if (!product) return 0;

    // First apply flash discount if any
    let price = product.pricing.final_price;
    if (appliedDiscount) {
      price = product.pricing.final_price * (1 - appliedDiscount / 100);
    }

    // Then apply discount tier if selected
    if (selectedDiscountTier) {
      const tier = discountTiers.find(t => t.tier_id === selectedDiscountTier);
      if (tier) {
        const basePrice = product.pricing.base_price;
        
        switch (tier.type) {
          case 'amount_off_products':
            if (tier.percentage_discount) {
              price = basePrice * (1 - parseFloat(tier.percentage_discount) / 100);
            } else if (tier.fixed_discount) {
              price = basePrice - parseFloat(tier.fixed_discount);
            }
            break;
            
          case 'buy_x_get_y':
            if (tier.price_per_unit) {
              price = parseFloat(tier.price_per_unit);
            }
            break;
        }
      }
    }

    return price;
  };

  const finalPrice = calculateFinalPrice();

  // Function to handle variant selection and update image
  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    
    if (product && product.media && product.media.images) {
      const variantImage = product.media.images.find((img: any) => 
        img.alt_text?.toLowerCase().includes(variant.color.toLowerCase()) ||
        img.image_url?.toLowerCase().includes(variant.color.toLowerCase()) ||
        (variant.swatch && img.alt_text?.toLowerCase().includes(variant.swatch.label.toLowerCase()))
      );
      
      if (variantImage) {
        setSelectedImage(variantImage);
      } else {
        const fallbackImage = product.media.images.find((img: any) => 
          img.image_id !== selectedImage?.image_id
        );
        if (fallbackImage) {
          setSelectedImage(fallbackImage);
        }
      }
    }
  };

  const registerProductTheme = (productData: any) => {
    if (!productData) return;
    
    const products = {
      [productData.product_id?.toString() || 'current']: productData
    };
    
    registerProductThemes(products);
    
    const themeKey = `product-${productData.product_id?.toString() || 'current'}`;
    switchTheme(themeKey);
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products/frontend/productDetails/${id}`);
      const data = await response.json();

      if (data.success) {
        const productData = data.data;
        const processedProduct = {
          ...productData,
          media: {
            ...productData.media,
            primary_image: productData.media.primary_image
              ? {
                  ...productData.media.primary_image,
                  image_url: getImageUrl(productData.media.primary_image.image_url),
                }
              : null,
            images: productData.media.images.map((img: any) => ({
              ...img,
              image_url: getImageUrl(img.image_url),
            })),
          },
          variants: productData.variants.map((v: any) => ({
            ...v,
            swatch: v.swatch
              ? { ...v.swatch, image_url: getImageUrl(v.swatch.image_url) }
              : null,
          })),
        };
        setProduct(processedProduct);

        const defaultVariant = processedProduct.variants[0] || null;
        setSelectedVariant(defaultVariant);
        setSelectedSize(processedProduct.sizes[0] || null);
        
        if (defaultVariant && processedProduct.media.images.length > 0) {
          const variantImage = processedProduct.media.images.find((img: any) => 
            img.alt_text?.toLowerCase().includes(defaultVariant.color.toLowerCase()) ||
            (defaultVariant.swatch && img.alt_text?.toLowerCase().includes(defaultVariant.swatch.label.toLowerCase()))
          ) || processedProduct.media.primary_image || processedProduct.media.images[0];
          
          setSelectedImage(variantImage);
        } else {
          setSelectedImage(processedProduct.media.primary_image || processedProduct.media.images[0] || null);
        }

        registerProductTheme(processedProduct);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check for flash discounts first
    if (product.flash_discounts) {
      const addToCartDiscount = product.flash_discounts.find(
        (d: any) => d.trigger_condition === 'add_to_cart' && d.is_active
      );
      if (addToCartDiscount && !appliedDiscount) {
        setActiveFlashDiscount(addToCartDiscount);
        setShowFlashDiscount(true);
        return; // Don't add to cart yet, wait for discount decision
      }
    }

    // Proceed with adding to cart
    addToCart({
      id: product.id.toString(),
      name: product.name,
      size: selectedSize?.label,
      originalPrice: product.pricing.base_price,
      discountedPrice: finalPrice,
      image: selectedImage?.image_url || "/images/fallback.png",
      quantity,
      appliedDiscount: appliedDiscount || undefined,
      discountTierId: selectedDiscountTier || undefined,
    });
  };

  const handleApplyDiscount = (percentage: number) => {
    setAppliedDiscount(percentage);
    // If this was triggered by add_to_cart, now add the item to cart
    if (activeFlashDiscount?.trigger_condition === 'add_to_cart') {
      addToCart({
        id: product.id.toString(),
        name: product.name,
        size: selectedSize?.label,
        originalPrice: product.pricing.base_price,
        discountedPrice: finalPrice,
        image: selectedImage?.image_url || "/images/fallback.png",
        quantity,
        appliedDiscount: percentage,
        discountTierId: selectedDiscountTier || undefined,
      });
    }
  };

  const handleCloseFlashDiscount = () => {
    setShowFlashDiscount(false);
    setActiveFlashDiscount(null);
    // If it was an add_to_cart trigger and user closed without applying, add to cart without discount
    if (activeFlashDiscount?.trigger_condition === 'add_to_cart' && !appliedDiscount) {
      addToCart({
        id: product.id.toString(),
        name: product.name,
        size: selectedSize?.label,
        originalPrice: product.pricing.base_price,
        discountedPrice: finalPrice,
        image: selectedImage?.image_url || "/images/fallback.png",
        quantity,
        discountTierId: selectedDiscountTier || undefined,
      });
    }
  };

  // Generate dynamic styles based on theme
  const dynamicStyles = {
    backgroundColor: theme.bg,
    color: theme.text,
  };

  const cardStyles = {
    backgroundColor: theme.bg === '#0a0a0a' ? '#1a1a1a' : 
                   theme.bg === '#9b1b1b' ? '#ab2b2b' :
                   theme.bg === '#14532d' ? '#24633d' :
                   theme.bg.startsWith('#') ? `${theme.bg}20` : '#f8fafc',
    borderColor: theme.bg === '#0a0a0a' ? '#333' : 
                theme.bg === '#9b1b1b' ? '#bb3b3b' :
                theme.bg === '#14532d' ? '#34633d' :
                theme.bg.startsWith('#') ? `${theme.bg}40` : '#e2e8f0',
  };

  const textMuted = theme.bg === '#0a0a0a' ? 'text-gray-300' : 
                   theme.bg === '#9b1b1b' ? 'text-red-200' :
                   theme.bg === '#14532d' ? 'text-green-200' :
                   'text-gray-600';

  if (loading) return <Loading theme={theme} />;
  if (error || !product) return <ErrorPage message={error} retry={fetchProductDetails} theme={theme} />;

  const features = [
    { icon: Shield, text: "2-Year Warranty", color: "text-green-400" },
    { icon: Truck, text: "Free Shipping", color: "text-blue-400" },
    { icon: Clock, text: "30-Day Returns", color: "text-purple-400" },
    { icon: CheckCircle, text: "Quality Certified", color: "text-orange-400" },
  ];

  // Get SEO data
  const seoTitle = product.seo?.meta_title || product.name;
  const seoDescription = product.seo?.meta_description || product.description?.replace(/<[^>]*>/g, '').substring(0, 160);
  const seoKeywords = product.seo?.meta_keywords;
  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : '';
  const productImage = selectedImage?.image_url || product.media?.primary_image?.image_url || product.media?.images[0]?.image_url;

  return (
    <>
      {/* SEO Head Section */}
      <Head>
        <title>{seoTitle} | Your Store Name</title>
        <meta name="description" content={seoDescription} />
        {seoKeywords && <meta name="keywords" content={seoKeywords} />}
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={productImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Your Store Name" />
        <meta property="product:price:amount" content={finalPrice.toString()} />
        <meta property="product:price:currency" content="USD" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={productImage} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData(product))
          }}
        />
        
        {/* Additional Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Your Store Name" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Page Content */}
      <div className="min-h-screen transition-colors duration-300 pt-18" style={dynamicStyles}>
        <AnimatePresence>
          {showFlashDiscount && activeFlashDiscount && (
            <FlashDiscount
              discount={activeFlashDiscount}
              onClose={handleCloseFlashDiscount}
              onApplyDiscount={handleApplyDiscount}
            />
          )}
        </AnimatePresence>
        
        {/* Theme Selector */}
        <div className="fixed top-20 right-4 z-50">
          <motion.button
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="p-3 rounded-full shadow-lg backdrop-blur-sm border transition-all"
            style={{
              backgroundColor: cardStyles.backgroundColor,
              borderColor: cardStyles.borderColor,
              color: theme.text
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Palette className="w-5 h-5" />
          </motion.button>

          <AnimatePresence>
            {showThemeSelector && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute right-0 top-12 mt-2 p-3 rounded-2xl shadow-xl backdrop-blur-sm border"
                style={{
                  backgroundColor: cardStyles.backgroundColor,
                  borderColor: cardStyles.borderColor,
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(themes).map(([themeName, themeConfig]) => (
                    <motion.button
                      key={themeName}
                      onClick={() => {
                        switchTheme(themeName);
                        setShowThemeSelector(false);
                      }}
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentThemeName === themeName ? 'border-white ring-2 ring-offset-2' : 'border-transparent'
                      }`}
                      style={{ 
                        backgroundColor: themeConfig.bg,
                        ringColor: themeConfig.bg 
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={themeConfig.name || themeName}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Products",
                    "item": typeof window !== 'undefined' ? `${window.location.origin}/products` : ''
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": product.category.name,
                    "item": typeof window !== 'undefined' ? `${window.location.origin}/categories/${product.category.id}` : ''
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": product.name
                  }
                ]
              })
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images Section */}
            <div className="space-y-4">
              <motion.div
                className="relative rounded-2xl overflow-hidden aspect-square shadow-lg border"
                style={cardStyles}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={selectedImage?.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.pricing.sale_price && (
                  <motion.div
                    className="absolute top-4 left-4 text-white px-3 py-1 rounded-full text-sm font-bold"
                    style={{ backgroundColor: theme.bg }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {Math.round(
                      ((product.pricing.base_price - product.pricing.final_price) /
                        product.pricing.base_price) *
                        100
                    )}
                    % OFF
                  </motion.div>
                )}
              </motion.div>

              {/* Thumbnails */}
              <div className="flex space-x-3 overflow-x-auto py-2">
                {product.media.images.map((img: any) => (
                  <motion.button
                    key={img.image_id}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage?.image_id === img.image_id
                        ? "border-orange-500 shadow-md"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    onClick={() => setSelectedImage(img)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img 
                      src={img.image_url} 
                      alt={img.alt_text || `${product.name} - Image ${img.image_id}`} 
                      className="w-full h-full object-cover" 
                    />
                  </motion.button>
                ))}
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {features.map((f) => (
                  <motion.div
                    key={f.text}
                    className="flex flex-col items-center text-center p-4 rounded-xl border transition-all"
                    style={cardStyles}
                    whileHover={{ y: -2, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <f.icon className={`h-6 w-6 mb-2 ${f.color}`} />
                    <span className={`text-xs font-medium ${textMuted}`}>{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Product Details Section */}
            <motion.div
              className="space-y-6 lg:sticky lg:top-8 lg:self-start"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className={`text-sm ${textMuted}`}>
                <span className="hover:opacity-70 cursor-pointer px-2 py-1 rounded transition-opacity">Products</span>
                <span className="mx-2">/</span>
                <span className="hover:opacity-70 cursor-pointer px-2 py-1 rounded transition-opacity">{product.category.name}</span>
                <span className="mx-2">/</span>
                <span className="font-medium px-2 py-1 rounded transition-opacity" style={cardStyles}>
                  {product.name}
                </span>
              </nav>

              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className={`text-sm ${textMuted}`}>4.8 (73 reviews)</span>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold">
                    ${finalPrice.toFixed(2)}
                  </span>
                  {(appliedDiscount || selectedDiscountTier) && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      Discount Applied!
                    </span>
                  )}
                  {product.pricing.sale_price && !appliedDiscount && !selectedDiscountTier && (
                    <>
                      <span className={`text-xl line-through ${textMuted}`}>
                        ${product.pricing.base_price.toFixed(2)}
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        Save ${(product.pricing.base_price - product.pricing.final_price).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                {(appliedDiscount || selectedDiscountTier) && (
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${textMuted} line-through`}>
                      Original: ${product.pricing.final_price.toFixed(2)}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      You save: ${(product.pricing.final_price - finalPrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Discount Tiers Section */}
              {discountTiers.length > 0 && (
                <Discount
                  discountTiers={discountTiers}
                  selectedDiscountTier={selectedDiscountTier}
                  onSelectDiscountTier={setSelectedDiscountTier}
                  basePrice={product.pricing.base_price}
                  className="mb-6"
                />
              )}

              {/* Variants & Size */}
              {product.variants.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold">Color</h2>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v: any) => (
                      <motion.button
                        key={v.id}
                        onClick={() => handleVariantSelect(v)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedVariant?.id === v.id
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {v.swatch && (
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-300"
                            style={{ backgroundColor: v.swatch.hex_code }}
                          />
                        )}
                        <span className="font-medium capitalize">{v.color}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold">Size</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {product.sizes.map((size: any) => (
                      <motion.button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        disabled={size.quantity === 0}
                        className={`py-3 rounded-lg border-2 transition-all ${
                          selectedSize?.id === size.id
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                        } ${size.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        whileHover={{ scale: size.quantity > 0 ? 1.05 : 1 }}
                        whileTap={{ scale: size.quantity > 0 ? 0.95 : 1 }}
                      >
                        <div className="font-medium">{size.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 pt-4">
                <AddToCartButton onAdd={handleAddToCart} quantity={quantity} />
              </div>

              {/* Description */}
              {product.description && (
                <section className="border-t pt-6 mt-6" style={{ borderColor: cardStyles.borderColor }}>
                  <h2 className="text-lg font-semibold mb-4">Product Description</h2>
                  <div 
                    dangerouslySetInnerHTML={{ __html: product.description }} 
                    className={`leading-relaxed ${textMuted} prose max-w-none ${
                      theme.bg === '#0a0a0a' ? 'prose-invert' : ''
                    }`} 
                  />
                </section>
              )}
            </motion.div>
          </div>

          {/* FAQ Section */}
{/* Modern Animated FAQ Section with Dynamic Theme Support */}
{product.faqs && product.faqs.length > 0 && (
  <section className="mt-20 pt-16">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        {/* Animated Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6 backdrop-blur-sm border"
          style={{
            backgroundColor: `${theme.bg}15`,
            borderColor: `${theme.bg}30`,
            color: theme.text
          }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.bg }}
          />
          <span className="text-sm font-medium uppercase tracking-wider">
            Frequently Asked Questions
          </span>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.bg }}
          />
        </motion.div>
        
        {/* Gradient Title that works with all themes */}
        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-current to-current via-gray-400 bg-clip-text text-transparent">
            Everything You Need to Know
          </span>
        </h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ color: textMuted }}
        >
          Quick answers to common questions about this product
        </motion.p>
      </motion.div>

      {/* FAQ Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        <Accordion 
          type="single" 
          collapsible
          className="space-y-4"
          value={activeFaq[0]}
          onValueChange={(value) => setActiveFaq(value ? [value] : [])}
        >
          {product.faqs.map((faq: any, index: number) => {
            const isActive = activeFaq.includes(`faq-${faq.faq_id}`);
            
            // Theme-aware colors for different states
            const getFAQStyles = () => {
              const isDark = theme.bg === '#0a0a0a';
              const isRed = theme.bg === '#9b1b1b';
              const isGreen = theme.bg === '#14532d';
              
              if (isActive) {
                return {
                  borderColor: isDark ? '#3b82f650' : 
                              isRed ? '#ef444450' : 
                              isGreen ? '#10b98150' : 
                              `${theme.bg}50`,
                  backgroundColor: isDark ? '#1e40af10' : 
                                  isRed ? '#fef2f2' : 
                                  isGreen ? '#ecfdf5' : 
                                  `${theme.bg}08`,
                  shadow: isDark ? '0 8px 32px rgba(59, 130, 246, 0.15)' :
                          isRed ? '0 8px 32px rgba(239, 68, 68, 0.15)' :
                          isGreen ? '0 8px 32px rgba(16, 185, 129, 0.15)' :
                          `0 8px 32px ${theme.bg}15`
                };
              }
              
              return {
                borderColor: isDark ? '#37415150' : 
                            isRed ? '#fecaca50' : 
                            isGreen ? '#d1fae550' : 
                            `${cardStyles.borderColor}50`,
                backgroundColor: cardStyles.backgroundColor,
                shadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
              };
            };

            const faqStyles = getFAQStyles();

            return (
              <motion.div
                key={faq.faq_id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.02,
                  y: -2
                }}
                className="group"
              >
                <AccordionItem 
                  value={`faq-${faq.faq_id}`}
                  className="overflow-hidden rounded-2xl transition-all duration-500 border backdrop-blur-sm"
                  style={{
                    borderColor: faqStyles.borderColor,
                    backgroundColor: faqStyles.backgroundColor,
                    boxShadow: faqStyles.shadow,
                  }}
                >
                  <AccordionTrigger 
                    className="px-6 lg:px-8 py-6 hover:no-underline text-left group-hover:bg-opacity-50 transition-all duration-300 rounded-2xl"
                    style={{ color: theme.text }}
                  >
                    <div className="flex items-start justify-between w-full gap-4 lg:gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Number Badge with Theme */}
                        <motion.div
                          animate={{ 
                            scale: isActive ? 1.1 : 1,
                            backgroundColor: isActive ? theme.bg : `${theme.bg}15`
                          }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-1 border"
                          style={{
                            borderColor: isActive ? 'transparent' : `${theme.bg}30`
                          }}
                        >
                          <motion.span
                            animate={{ 
                              color: isActive ? 
                                (theme.bg === '#0a0a0a' ? '#ffffff' : 
                                 theme.bg === '#9b1b1b' ? '#ffffff' : 
                                 theme.bg === '#14532d' ? '#ffffff' : theme.text) 
                                : theme.text,
                              scale: isActive ? 1.2 : 1
                            }}
                            className="font-bold text-sm"
                          >
                            {index + 1}
                          </motion.span>
                        </motion.div>
                        
                        {/* Question Text */}
                        <div className="text-left flex-1">
                          <h3 className="text-lg lg:text-xl font-semibold leading-relaxed text-left pr-4 lg:pr-8">
                            {faq.question}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Animated Plus/Close Icon */}
                      <motion.div
                        animate={{ 
                          rotate: isActive ? 45 : 0,
                          scale: isActive ? 1.1 : 1,
                          backgroundColor: isActive ? theme.bg : 'transparent'
                        }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className="flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                        style={{
                          borderColor: isActive ? 'transparent' : `${theme.text}30`
                        }}
                      >
                        <Plus 
                          className="w-5 h-5 transition-all duration-300" 
                          style={{ 
                            color: isActive ? 
                              (theme.bg === '#0a0a0a' ? '#ffffff' : 
                               theme.bg === '#9b1b1b' ? '#ffffff' : 
                               theme.bg === '#14532d' ? '#ffffff' : theme.text) 
                              : theme.text
                          }} 
                        />
                      </motion.div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="overflow-hidden">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: isActive ? 1 : 0,
                        height: isActive ? 'auto' : 0
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-6 px-6 lg:px-8 pb-6">
                        <div className="flex-shrink-0 w-10">
                          <div 
                            className="w-px h-full mx-auto transition-all duration-500"
                            style={{ 
                              backgroundColor: isActive ? theme.bg : `${theme.text}20`,
                              height: isActive ? '100%' : '0%'
                            }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -10 }}
                            transition={{ duration: 0.4, delay: isActive ? 0.2 : 0 }}
                            className="prose prose-lg max-w-none"
                            style={{ 
                              color: textMuted,
                              lineHeight: '1.7'
                            }}
                          >
                            <p className="text-lg leading-relaxed">
                              {faq.ques_ans}
                            </p>
                            
                            {/* Animated underline */}
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: isActive ? 1 : 0 }}
                              transition={{ duration: 0.6, delay: isActive ? 0.3 : 0 }}
                              className="w-20 h-0.5 mt-6 rounded-full"
                              style={{ backgroundColor: theme.bg }}
                            />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      </motion.div>

      {/* Contact CTA with Theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
        className="text-center mt-12 pt-8 border-t"
        style={{ borderColor: `${cardStyles.borderColor}50` }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-lg mb-6"
          style={{ color: textMuted }}
        >
          Still have questions?
        </motion.p>
        <motion.button
          whileHover={{ 
            scale: 1.05, 
            y: -2,
            boxShadow: `0 12px 40px ${theme.bg}40`
          }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg backdrop-blur-sm"
          style={{ 
            background: `linear-gradient(135deg, ${theme.bg}, ${getDarkerShade(theme.bg, 20)})`,
            boxShadow: `0 8px 32px ${theme.bg}30`
          }}
        >
          <span>Contact Support</span>
          <motion.svg
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </motion.svg>
        </motion.button>
      </motion.div>
    </div>
  </section>
)}
        </div>
      </div>
    </>
  );
};

const Loading = ({ theme }: { theme: any }) => (
  <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: theme.bg, color: theme.text }}>
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-4"
        style={{ borderColor: theme.bg, borderTopColor: theme.text }}
      />
      <p style={{ color: theme.text }}>Loading product details...</p>
    </div>
  </div>
);

const ErrorPage = ({ message, retry, theme }: { message?: string; retry: () => void; theme: any }) => (
  <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
    <div className="text-center max-w-md mx-auto">
      <div className="text-6xl mb-4">😞</div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>Product Not Found</h2>
      <p className="mb-4" style={{ color: theme.text }}>{message || "Product not available"}</p>
      <button
        onClick={retry}
        className="px-6 py-2 rounded-lg transition-colors"
        style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.text}` }}
      >
        Try Again
      </button>
    </div>
  </div>
);

export default ProductDetailsPage;