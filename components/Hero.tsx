"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import HeroSection from "./HeroSection";
import AirMaxSection from "./AirMaxSection";
import ShoeCard from "./ShoeCard";
import { useTheme } from "@/lib/ThemeProvider"
import { getFrontendProducts } from '@/lib/frontend';
import { useProductThemes } from "@/hooks/useProductThemes";

// Remove hardcoded ProductColor type - we'll get it dynamically
interface Product {
  name: string;
  images: string[];
  releaseDate: string;
  colorWay: string;
  base_price?: string;
  sale_price?: string;
  category?: string;
  theme_name?: string;
}

// Define the products type based on backend structure
type ProductsData = Record<string, Product>;

const Hero: React.FC = () => {
  const { theme, switchTheme, currentThemeName, themes } = useTheme(); // Added themes
  
  // Get available product colors dynamically from backend data
  const [products, setProducts] = useState<ProductsData>({});
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useProductThemes(products);
  console.log('products:-',products);
  // Use first available color as default, fallback to current theme
  const defaultColor = availableColors.length > 0 
    ? availableColors[0] 
    : (currentThemeName as string);
  
  const [selectedProduct, setSelectedProduct] = useState<string>(defaultColor);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSection, setActiveSection] = useState<"hero" | "airmax" | "shoecard">("hero");
  const [showPreview, setShowPreview] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const airMaxRef = useRef<HTMLDivElement>(null);
  const shoeCardRef = useRef<HTMLDivElement>(null);
  const lastTouchY = useRef<number | null>(null);
  const isScrolling = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);

  const ANIMATION_DURATION = 500;
  const API_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3009";

  const getImageUrl = (path: string) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `${API_URL}${path}`;
    return `${API_URL}/${path}`;
  };

  // Fetch products and extract available colors
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getFrontendProducts();
        if (data.success && data.productData) {
          setProducts(data.productData);
      
          // Extract available colors from backend data
          const colors = Object.keys(data.productData);
          setAvailableColors(colors);
          
          console.log('Available product colors:', colors);
          console.log('Product data:', data.productData);
          console.log('Available themes:', Object.keys(themes));
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Set selected product when colors are available
  useEffect(() => {
    if (availableColors.length > 0 && !isLoading) {
      // Try to use current theme if it exists in available colors, otherwise use first available
      const initialColor = availableColors.includes(currentThemeName) 
        ? currentThemeName 
        : availableColors[0];
      
      console.log('Setting initial product:', initialColor);
      setSelectedProduct(initialColor);
      
      // Also switch the theme to match
      if (availableColors.includes(initialColor)) {
        switchTheme(initialColor);
      }
    }
  }, [availableColors, currentThemeName, isLoading, switchTheme]);

  // Update global theme when product changes
  useEffect(() => {
    if (selectedProduct && 
        selectedProduct !== currentThemeName && 
        availableColors.includes(selectedProduct) &&
        !isLoading) {
      console.log('Switching theme to match product:', selectedProduct);
      switchTheme(selectedProduct);
    }
  }, [selectedProduct, currentThemeName, switchTheme, availableColors, isLoading]);

  // Memoize current product
  const currentProduct = useMemo(() => {
    const product = products[selectedProduct];

    if (!product) {
      return { 
        images: [], 
        name: "Loading...", 
        releaseDate: "", 
        colorWay: "",
        base_price: "",
        sale_price: "",
        category: "",
        theme_name: ""
      };
    }

    return {
      ...product,
      images: product.images.map(getImageUrl)
    };
  }, [products, selectedProduct]);

  // Memoize imageSrc to ensure it updates with currentImageIndex and currentProduct
  const imageSrc = useMemo(
    () => currentProduct.images[currentImageIndex] || "",
    [currentProduct, currentImageIndex]
  );

  // Handle image navigation
  const handleNext = useCallback(() => {
    if (currentProduct.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === currentProduct.images.length - 1 ? 0 : prev + 1
    );
  }, [currentProduct.images.length]);

  const handlePrev = useCallback(() => {
    if (currentProduct.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? currentProduct.images.length - 1 : prev - 1
    );
  }, [currentProduct.images.length]);

  // Handle product change with theme switching
  const handleProductChange = useCallback((productKey: string) => {
    console.log('Product changed to:', productKey);
    setSelectedProduct(productKey);
    
    // Switch theme immediately when product changes
    if (availableColors.includes(productKey)) {
      switchTheme(productKey);
    }
  }, [availableColors, switchTheme]);

  // Scroll animation logic
  const animateScroll = useCallback((direction: "up" | "down") => {
    if (isAnimating || isScrolling.current) return;
    setIsAnimating(true);
    isScrolling.current = true;
    setIsTransitioning(true);

    let targetSection: "hero" | "airmax" | "shoecard" = activeSection;
    if (direction === "down") {
      if (activeSection === "hero") targetSection = "airmax";
      else if (activeSection === "airmax") targetSection = "shoecard";
    } else {
      if (activeSection === "shoecard") targetSection = "airmax";
      else if (activeSection === "airmax") targetSection = "hero";
    }

    const targetRef =
      targetSection === "hero"
        ? heroRef
        : targetSection === "airmax"
        ? airMaxRef
        : shoeCardRef;

    const targetRect = targetRef.current?.getBoundingClientRect();
    if (targetRect) {
      window.scrollTo({
        top: window.scrollY + targetRect.top,
        behavior: "smooth",
      });

      const checkScrollEnd = () => {
        const targetScrollY = window.scrollY + targetRect.top;
        if (Math.abs(window.scrollY - targetScrollY) < 5) {
          setActiveSection(targetSection);
          setShowPreview(false);
          setIsTransitioning(false);
          if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
        } else {
          requestAnimationFrame(checkScrollEnd);
        }
      };
      requestAnimationFrame(checkScrollEnd);

      scrollEndTimeout.current = setTimeout(() => {
        setActiveSection(targetSection);
        setShowPreview(false);
        setIsTransitioning(false);
      }, ANIMATION_DURATION * 1.5);
    }

    setTimeout(() => {
      setIsAnimating(false);
      isScrolling.current = false;
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
    }, ANIMATION_DURATION * 2);
  }, [activeSection, isAnimating]);

  // Handle wheel and touch events
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (activeSection === "hero" || (e.deltaY > 0 && (activeSection === "airmax" || activeSection === "shoecard"))) {
        e.preventDefault();
        return false;
      }
    },
    [activeSection]
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    lastTouchY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!lastTouchY.current) return;
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY.current - currentY;

      if (activeSection === "hero" || (deltaY > 0 && (activeSection === "airmax" || activeSection === "shoecard"))) {
        e.preventDefault();
      }
    },
    [activeSection]
  );

  // Reset scroll on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveSection("hero");
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Add event listeners
  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct]);

  // Handle image click for navigation
  const handleImageClick = useCallback(() => {
    if (activeSection === "hero" || activeSection === "airmax") {
      setShowPreview(true);
      setIsTransitioning(true);
      animateScroll("down");
    }
  }, [activeSection, animateScroll]);

  const handleCloseModal = useCallback(() => {
    setShowPreview(false);
    if (activeSection === "airmax" || activeSection === "shoecard") {
      animateScroll("up");
    }
  }, [activeSection, animateScroll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.text }}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }}>
      <HeroSection
        ref={heroRef}
        selectedProduct={selectedProduct}
        currentProduct={currentProduct}
        currentImageIndex={currentImageIndex}
        isAnimating={isAnimating}
        activeSection={activeSection}
        currentColorTheme={theme}
        onProductChange={handleProductChange} // Use the new handler
        onImageIndexChange={setCurrentImageIndex}
        onNextImage={handleNext}
        onPrevImage={handlePrev}
        showPreview={showPreview}
        isTransitioning={isTransitioning}
        onImageClick={handleImageClick}
        onScrollDown={() => animateScroll("down")}
        availableColors={availableColors}
        products={products}
      />
      <div ref={airMaxRef}>
        <AirMaxSection
          activeSection={activeSection}
          isAnimating={isAnimating}
          currentColorTheme={theme}
          productImage={imageSrc}
          currentProduct={currentProduct}
          selectedProduct={selectedProduct}
          currentImageIndex={currentImageIndex}
          onScrollUp={() => animateScroll("up")}
          onScrollDown={() => animateScroll("down")}
          onImageClick={handleImageClick}
          showPreview={showPreview}
          onCloseModal={handleCloseModal}
        />
      </div>
      <div ref={shoeCardRef}>
        <ShoeCard
          activeSection={activeSection}
          isAnimating={isAnimating}
          currentColorTheme={theme}
          productImage={imageSrc}
          currentProduct={currentProduct}
          onScrollUp={() => animateScroll("up")}
          setShowPreview={setShowPreview}
        />
      </div>
    </div>
  );
};

export default Hero;