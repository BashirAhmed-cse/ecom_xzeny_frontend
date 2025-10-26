"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import HeroSection from "./HeroSection";
import AirMaxSection from "./AirMaxSection";
import ShoeCard from "./ShoeCard";
import { useTheme } from "@/lib/ThemeProvider"
import { getFrontendProducts } from '@/lib/frontend';

type ProductColor = "black" | "red";

interface Product {
  name: string;
  images: string[];
  releaseDate: string;
  colorWay: string;
}

const Hero: React.FC = () => {
  const { theme, switchTheme, currentThemeName } = useTheme();
  
  // Sync selected product with current theme
  const [selectedProduct, setSelectedProduct] = useState<ProductColor>(currentThemeName as ProductColor);
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
  
  const [products, setProducts] = useState({});
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getFrontendProducts();
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, []);
console.log('chek product dta:-',products);
  const productData: Record<ProductColor, Product> = {
    black: {
      name: "AIR MAX 270",
      images: ["/images/nike1.png", "/images/nike2.png", "/images/nike3.png", "/images/nike1.png"],
      releaseDate: "2016-10-06",
      colorWay: "SAIL/STARFISH-BLACK",
    },
    red: {
      name: "AIR MAX 90",
      images: ["/images/nike2.png", "/images/nike1.png", "/images/nike3.png", "/images/nike1.png"],
      releaseDate: "2025-10-06",
      colorWay: "SAIL/SCARLET-RED",
    },
  };

  // Sync product selection with theme on mount and theme changes
  useEffect(() => {
    setSelectedProduct(currentThemeName as ProductColor);
  }, [currentThemeName]);

  // Update global theme when product changes
  useEffect(() => {
    if (selectedProduct !== currentThemeName) {
      switchTheme(selectedProduct);
    }
  }, [selectedProduct, currentThemeName, switchTheme]);

  // Memoize current product
  const currentProduct = useMemo(() => productData[selectedProduct], [selectedProduct]);
  
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

  // Debug logging for image updates
  useEffect(() => {
    console.log("Image updated:", { 
      selectedProduct, 
      currentImageIndex, 
      imageSrc, 
      activeSection,
      totalImages: currentProduct.images.length 
    });
  }, [imageSrc, selectedProduct, currentImageIndex, activeSection, currentProduct.images.length]);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }}>
      <HeroSection
  ref={heroRef}
  selectedProduct={selectedProduct}
  currentProduct={currentProduct}
  currentImageIndex={currentImageIndex}
  isAnimating={isAnimating}
  activeSection={activeSection}
  currentColorTheme={theme} // Use theme from context
  onProductChange={setSelectedProduct}
  onImageIndexChange={setCurrentImageIndex}
  onNextImage={handleNext}
  onPrevImage={handlePrev}
  showPreview={showPreview}
  isTransitioning={isTransitioning}
  onImageClick={handleImageClick}
  onScrollDown={() => animateScroll("down")}
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