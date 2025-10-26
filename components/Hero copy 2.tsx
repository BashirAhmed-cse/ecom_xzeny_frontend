"use client";

import { useState, useEffect, useRef, useCallback,useMemo } from "react";
import { cn } from "@/lib/utils";
import HeroSection from "./HeroSection";
import AirMaxSection from "./AirMaxSection";
import ShoeCard from "./ShoeCard";

type ProductColor = "black" | "red";

interface Product {
  name: string;
  images: string[];
  releaseDate: string;
  colorWay: string;
}

interface ColorTheme {
  bg: string;
  gradient: string;
  text: string;
}

const Hero: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductColor>("black");
  const [selectedColor, setSelectedColor] = useState<ProductColor>("black");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSection, setActiveSection] = useState<"hero" | "airmax" | "shoecard">("hero");
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const [showPreview, setShowPreview] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const airMaxRef = useRef<HTMLDivElement>(null);
  const shoeCardRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const isScrolling = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);

  const ANIMATION_DURATION = 500;

  const colorThemes: Record<ProductColor, ColorTheme> = {
    black: { bg: "#0a0a0a", gradient: "from-gray-900/90 to-gray-800/90", text: "text-white" },
    red: { bg: "#9b1b1b", gradient: "from-red-900/90 to-red-700/90", text: "text-white" },
  };

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

  const currentProduct = useMemo(() => productData[selectedProduct], [selectedProduct]);
  const currentColorTheme = useMemo(() => colorThemes[selectedColor], [selectedColor]);
  const imageSrc = currentProduct.images[currentImageIndex] || "";

  const handleNext = () => {
    if (currentProduct.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === currentProduct.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrev = () => {
    if (currentProduct.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? currentProduct.images.length - 1 : prev - 1
    );
  };

  const animateScroll = (targetSection: "hero" | "airmax" | "shoecard") => {
    if (isAnimating || isScrolling.current) return;
    setIsAnimating(true);
    setScrollDirection(targetSection === "hero" ? "up" : targetSection === "airmax" && activeSection === "hero" ? "down" : "down");
    isScrolling.current = true;
    setIsTransitioning(true);

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
          setIsTransitioning(false);
          if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
        } else {
          requestAnimationFrame(checkScrollEnd);
        }
      };
      requestAnimationFrame(checkScrollEnd);

      scrollEndTimeout.current = setTimeout(() => {
        setActiveSection(targetSection);
        setIsTransitioning(false);
      }, ANIMATION_DURATION * 1.5);
    }

    setTimeout(() => {
      setIsAnimating(false);
      isScrolling.current = false;
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
    }, ANIMATION_DURATION * 2);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (activeSection === "hero" && e.deltaY > 0 && !isTransitioning) {
      e.preventDefault();
      return false;
    }
  }, [activeSection, isTransitioning]);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    // Lock body scroll when in HeroSection
    if (activeSection === "hero") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeSection]);

  useEffect(() => {
    const handleScroll = () => {
      if (isAnimating || isScrolling.current) return;

      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY.current ? "down" : "up";
      lastScrollY.current = scrollY;

      const heroRect = heroRef.current?.getBoundingClientRect();
      const airMaxRect = airMaxRef.current?.getBoundingClientRect();
      const shoeCardRect = shoeCardRef.current?.getBoundingClientRect();
      if (!heroRect || !airMaxRect || !shoeCardRect) return;

      const viewportHeight = window.innerHeight;

      if (direction === "up") {
        if (activeSection === "shoecard" && shoeCardRect.top >= viewportHeight * 0.2) {
          animateScroll("airmax");
        } else if (activeSection === "airmax" && airMaxRect.top >= viewportHeight * 0.2) {
          animateScroll("hero");
        }
      }
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll);
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [activeSection, isAnimating]);

  const handleHeroImageClick = () => {
    setShowPreview(true);
    setIsTransitioning(true);
    animateScroll("airmax");
  };

  const handleAirMaxImageClick = () => {
    setShowPreview(true);
    setIsTransitioning(true);
    animateScroll("shoecard");
  };

  const handleCloseModal = () => {
    setShowPreview(false);
    if (activeSection === "airmax") {
      animateScroll("hero");
    } else if (activeSection === "shoecard") {
      animateScroll("airmax");
    }
  };

  return (
    <div className="relative">
      <div className={cn("h-screen", activeSection !== "hero" && "hidden")}>
        <HeroSection
          ref={heroRef}
          selectedProduct={selectedProduct}
          selectedColor={selectedColor}
          currentProduct={currentProduct}
          currentImageIndex={currentImageIndex}
          colorThemes={colorThemes}
          productData={productData}
          isAnimating={isAnimating}
          scrollDirection={scrollDirection}
          activeSection={activeSection}
          currentColorTheme={currentColorTheme}
          onProductChange={setSelectedProduct}
          onColorChange={setSelectedColor}
          onImageIndexChange={setCurrentImageIndex}
          onNextImage={handleNext}
          onPrevImage={handlePrev}
          onImageClick={handleHeroImageClick}
          onCloseModal={handleCloseModal}
          showPreview={showPreview}
          isTransitioning={isTransitioning}
        />
      </div>
      <div className={cn("h-screen", activeSection !== "airmax" && "hidden")}>
        <AirMaxSection
          ref={airMaxRef}
          activeSection={activeSection}
          isAnimating={isAnimating}
          scrollDirection={scrollDirection}
          currentColorTheme={currentColorTheme}
          productImage={imageSrc}
          currentProduct={currentProduct}
          selectedProduct={selectedProduct}
          currentImageIndex={currentImageIndex}
          onScrollUp={() => animateScroll("hero")}
          onScrollDown={() => animateScroll("shoecard")}
          onImageClick={handleAirMaxImageClick}
          onCloseModal={handleCloseModal}
          showPreview={showPreview}
        />
      </div>
      <div className={cn("h-screen", activeSection !== "shoecard" && "hidden")}>
        <ShoeCard
          ref={shoeCardRef}
          activeSection={activeSection}
          isAnimating={isAnimating}
          scrollDirection={scrollDirection}
          currentColorTheme={currentColorTheme}
          productImage={imageSrc}
          currentProduct={currentProduct}
          onScrollUp={() => animateScroll("airmax")}
          setShowPreview={setShowPreview}
        />
      </div>
    </div>
  );
};

export default Hero;