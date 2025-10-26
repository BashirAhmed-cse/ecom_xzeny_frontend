// src/components/HeroSection.tsx
import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/lib/ThemeProvider";
import ViewDetailsButton from "./ViewDetailsButton";

// Remove hardcoded ProductColor type - use string for dynamic colors
interface Product {
  product_id: number,
  name: string;
  slug: string;
  images: string[];
  releaseDate: string;
  colorWay: string;
  base_price?: string;
  sale_price?: string;
  category?: string;
}

interface ColorTheme {
  bg: string;
  gradient: string;
  text: string;
}

interface HeroSectionProps {
  selectedProduct: string; // Changed from ProductColor to string
  currentProduct: Product;
  currentImageIndex: number;
  isAnimating: boolean;
  activeSection: "hero" | "airmax" | "shoecard";
  currentColorTheme: ColorTheme;
  onProductChange: (product: string) => void; // Changed from ProductColor to string
  onImageIndexChange: (index: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onScrollDown: () => void;
  onImageClick: () => void;
  showPreview: boolean;
  availableColors: string[]; // Add this prop for dynamic colors
  products: Record<string, Product>; 
}

const ANIMATION_DURATION = 700;

const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      selectedProduct,
      currentProduct,
      currentImageIndex,
      isAnimating,
      activeSection,
      currentColorTheme,
      onProductChange,
      onImageIndexChange,
      onNextImage,
      onPrevImage,
      onScrollDown,
      onImageClick,
      showPreview,
      availableColors, // Receive available colors from parent
      products,
    },
    ref
  ) => {
    const { switchTheme } = useTheme();
    const [imagesLoaded, setImagesLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);
    const [ellipseError, setEllipseError] = React.useState(false);
    const [imageLoadTimeout, setImageLoadTimeout] = React.useState<NodeJS.Timeout | null>(null);
    const [touchStart, setTouchStart] = React.useState(0);
    const [touchEnd, setTouchEnd] = React.useState(0);
    const [isNavClick, setIsNavClick] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);

    const swipeThreshold = isMobile ? 60 : 80;
// Add this constant at the top of your HeroSection component, after the imports
const API_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "https://ecom-xzeny-backend.onrender.com";
    const imageSrc =
      imageError || !currentProduct.images?.[currentImageIndex]
        ? "/images/fallback-shoe.png"
        : currentProduct.images[currentImageIndex];

    React.useEffect(() => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 1024);

      const handleResize = () => {
        setIsMobile(window.innerWidth < 1024);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    React.useEffect(() => {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          setIsNavClick(true);
          onPrevImage();
        }
        if (e.key === "ArrowRight") {
          setIsNavClick(true);
          onNextImage();
        }
        if (e.key === "Escape" && showPreview) {
          onImageClick();
        }
      };

      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }, [onPrevImage, onNextImage, showPreview, onImageClick]);

    React.useEffect(() => {
      const preloadImages = () => {
        if (!currentProduct.images?.length) {
          console.log("No images to preload for", currentProduct.name);
          setImageError(true);
          return;
        }

        setImagesLoaded(false);
        setImageError(false);
        let loadedCount = 0;
        const totalImages = currentProduct.images.length;

        const timeout = setTimeout(() => {
          console.log("Image preload timeout for", currentProduct.name);
          setImageError(true);
          setImagesLoaded(false);
        }, 10000);
        setImageLoadTimeout(timeout);

        currentProduct.images.forEach((src: string) => {
          if (!src) {
            console.log("Invalid image source:", src);
            loadedCount++;
            if (loadedCount === totalImages) {
              setImagesLoaded(true);
              clearTimeout(timeout);
            }
            return;
          }

          const img = new window.Image();
          img.src = src;
          img.onload = () => {
            console.log("Preloaded image:", src);
            loadedCount++;
            if (loadedCount === totalImages) {
              setImagesLoaded(true);
              clearTimeout(timeout);
            }
          };
          img.onerror = () => {
            console.log("Error preloading image:", src);
            loadedCount++;
            if (loadedCount === totalImages) {
              setImagesLoaded(true);
              setImageError(true);
              clearTimeout(timeout);
            }
          };
        });
      };

      preloadImages();
      return () => {
        if (imageLoadTimeout) clearTimeout(imageLoadTimeout);
      };
    }, [currentProduct]);

    React.useEffect(() => {
      if (showPreview) {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const modal = document.querySelector("[role='dialog']");
        if (modal) {
          const firstElement = focusableElements[0] as HTMLElement;
          firstElement?.focus();
        }
      }
    }, [showPreview]);

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (touchStart - touchEnd > swipeThreshold) {
        setIsNavClick(true);
        onNextImage();
      }
      if (touchStart - touchEnd < -swipeThreshold) {
        setIsNavClick(true);
        onPrevImage();
      }
    };

    const handleProductChange = (product: string) => {
      onProductChange(product);
      switchTheme(product);
    };

    const handleImageClick = () => {
      console.log("Image clicked, showPreview:", showPreview);
      onImageClick();
      setTimeout(() => onScrollDown(), ANIMATION_DURATION);
    };

    // Use dynamic product colors from props instead of hardcoded array
    const productKeys: string[] = availableColors;

    return (
      <>
        <motion.section
          ref={ref}
          className={cn(
            "min-h-screen flex items-center justify-center relative overflow-hidden",
            "pt-8 lg:pt-0 text-white px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900/90 to-transparent"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: (ANIMATION_DURATION / 1000) * 0.8,
            ease: "easeOut",
          }}
          style={{ backgroundColor: currentColorTheme.bg }}
        >
          <div className="relative z-10 w-full max-w-7xl mx-auto mt-10 sm:mt-12 lg:mt-16">
            <div className="w-full">
              {/* Desktop Layout */}
              <div className="hidden lg:flex flex-col-reverse lg:flex-row items-center justify-center gap-8 lg:gap-12 relative mt-10">
                <motion.div
                  className="flex flex-col gap-6 items-start self-start lg:min-w-[300px]"
                  initial={{ y: 80, opacity: 0, filter: "blur(10px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{
                    delay: 0.3,
                    duration: (ANIMATION_DURATION / 1000) * 0.9,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <motion.h1
                    className="text-3xl font-light leading-tight tracking-tight"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{
                      delay: 0.5,
                      duration: (ANIMATION_DURATION / 1000) * 0.8,
                      scale: { duration: 0.2 },
                    }}
                  >
                    <motion.span
                      className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-playfair font-semibold"
                      whileHover={{ backgroundPosition: "100% 50%" }}
                      style={{
                        backgroundSize: "200% 100%",
                        backgroundPosition: "0% 50%",
                        transition: "background-position 0.5s ease",
                      }}
                    >
                      Wear your Style
                    </motion.span>
                    <motion.span
                      className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-playfair font-semibold mt-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.8,
                        duration: (ANIMATION_DURATION / 1000) * 0.6,
                      }}
                    >
                      with comfort.
                    </motion.span>
                  </motion.h1>
                  <ViewDetailsButton productId={currentProduct.product_id} slug={currentProduct.slug}/>
                </motion.div>
                <div className="relative flex-1 flex justify-center items-center overflow-hidden max-w-[90vw] mx-auto">
                  <div
                    className="relative w-full h-[70vh] flex justify-center items-center overflow-visible"
                    style={{ 
                      perspective: "1500px",
                      width: "100vw",
                      position: "relative",
                      left: "50%",
                      transform: "translateX(-50%)"
                    }}
                  >
                    <AnimatePresence mode="sync">
                      {imagesLoaded && !imageError && (
                        <motion.div
                          key={`image-${selectedProduct}-${currentImageIndex}`}
                          initial={{ opacity: 0, x: 200, scale: 0.8, rotate: -5, filter: "blur(6px)" }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                            rotate: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                          }}
                          exit={{
                            opacity: 0,
                            x: -200,
                            scale: 0.8,
                            rotate: 5,
                            filter: "blur(6px)",
                            transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
                          }}
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ transformStyle: "preserve-3d" }}
                          whileHover={{ scale: 1.05 }}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          onClick={handleImageClick}
                        >
                          <Image
                            src={imageSrc}
                            alt={currentProduct.name || "Product Image"}
                            width={1000}
                            height={545}
                            sizes="(max-width: 640px) 85vw, (max-width: 768px) 80vw, (max-width: 1024px) 65vw, (max-width: 1280px) 60vw, 55vw"
                            className="w-full max-w-[90vw] md:max-w-[55vw] md:scale-75 lg:max-w-[750px] lg:scale-100 h-auto drop-shadow-2xl transition-transform duration-500"
                            priority
                            onLoad={() => setImagesLoaded(true)}
                            onError={() => setImageError(true)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {imageError && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-gray-800/50 rounded-lg"
                        onClick={handleImageClick}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div className="text-center p-8">
                          <p className="text-white mb-4">Image not available</p>
                          <Button variant="outline" onClick={() => {
                            setImageError(false);
                            setImagesLoaded(false);
                            const timeout = setTimeout(() => setImageError(true), 10000);
                            setImageLoadTimeout(timeout);
                            currentProduct.images?.forEach((src: string) => {
                              const img = new window.Image();
                              img.src = src;
                              img.onload = () => {
                                setImagesLoaded(true);
                                clearTimeout(timeout);
                              };
                            });
                          }}>
                            Retry
                          </Button>
                        </div>
                      </div>
                    )}
                    <motion.div
                      className="absolute bottom-0 md:bottom-4 lg:bottom-0 xl:bottom-0 2xl:bottom-12 w-full flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      transition={{
                        duration: (ANIMATION_DURATION / 1000) * 0.8,
                        delay: 0.2,
                      }}
                    >
                      {!ellipseError ? (
                        <Image
                          src="/ellips.svg"
                          alt="Ellipse"
                          width={700}
                          height={60}
                          className="w-[60vw] max-w-[600px] h-auto"
                          style={{
                            filter: "blur(6px) drop-shadow(0 0 25px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(0,0,0,0.25))",
                          }}
                          aria-hidden="true"
                          onError={() => setEllipseError(true)}
                        />
                      ) : (
                        <div className="w-[60vw] max-w-[600px] h-16 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full blur-sm" />
                      )}
                    </motion.div>
                  </div>
                </div>
<motion.div
  className="flex flex-row lg:flex-col gap-4 items-start self-start"
  initial="initial"
  animate="animate"
>
  {productKeys.map((key) => { // Remove the filter - show ALL products
    const product = products[key];
    const firstImage = product?.images?.[0] ? 
      product.images[0].startsWith('http') ? 
        product.images[0] : 
        `${API_URL}${product.images[0]}` 
      : "/images/fallback-shoe.png";

    return (
      <motion.button
        key={key}
        initial={{ scale: 0.8, opacity: 0, x: 20 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        onClick={() => {
          handleProductChange(key);
          onImageIndexChange(0);
        }}
        className={`relative w-24 h-16 lg:w-28 lg:h-20 rounded-xl overflow-hidden border-2 transition-all ${
          selectedProduct === key
            ? "border-white scale-110 shadow-lg shadow-white/20"
            : "border-gray-700 hover:border-white"
        } group`}
        whileHover={{
          scale: 1.15,
          y: -5,
          boxShadow: "0 8px 20px rgba(255,255,255,0.15)",
        }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Select ${key} product`}
      >
        <Image
          src={firstImage}
          alt={product?.name || `${key} product`}
          fill
          sizes="(max-width: 640px) 80px, 120px"
          className="object-cover transition-transform group-hover:scale-110"
          onError={(e) => {
            console.log("Product selection image error:", firstImage);
            e.currentTarget.src = "/images/fallback-shoe.png";
          }}
        />
      </motion.button>
    );
  })}
</motion.div>
              </div>
              <div className="hidden lg:flex flex-col lg:flex-row justify-center items-center mb-2 gap-6 mt-8">
                <motion.div
                  className="flex gap-3 items-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.6,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsNavClick(true);
                      onPrevImage();
                    }}
                    className="z-20 text-white border-2 border-white/40 rounded-full hover:bg-white/20 backdrop-blur-sm h-12 w-12 transition-all hover:scale-110"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  {currentProduct.images?.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => onImageIndexChange(index)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? "border-white scale-105 shadow-md shadow-white/20"
                          : "border-gray-700 hover:border-white hover:scale-105"
                      }`}
                      aria-label={`Select image ${index + 1}`}
                    >
                      <Image
                        src={img}
                        alt={`Preview ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 80px, 120px"
                        className="object-cover transition-transform hover:scale-110"
                        onError={(e) => {
                          console.log("Preview image error:", img);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsNavClick(true);
                      onNextImage();
                    }}
                    className="z-20 text-white border-2 border-white/40 rounded-full hover:bg-white/20 backdrop-blur-sm h-12 w-12 transition-all hover:scale-110"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </motion.div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden flex flex-col items-center justify-center gap-6 px-4">
                {/* Product Selection */}
{/* Mobile Layout - Product Selection */}
<motion.div
  className="flex gap-3"
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{
    delay: 0.5,
    duration: (ANIMATION_DURATION / 1000) * 0.6,
  }}
>
  {productKeys.map((key) => {
    const product = products[key];
    const firstImage = product?.images?.[0] ? 
      product.images[0].startsWith('http') ? 
        product.images[0] : 
        `${API_URL}${product.images[0]}` 
      : "/images/fallback-shoe.png";

    return (
      <motion.button
        key={key}
        onClick={() => {
          handleProductChange(key);
          onImageIndexChange(0);
        }}
        className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
          selectedProduct === key
            ? "border-white scale-105"
            : "border-gray-700 hover:border-white"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Select ${key} product`}
      >
        <Image
          src={firstImage}
          alt={product?.name || `${key} product`}
          fill
          sizes="60px"
          className="object-cover transition-transform hover:scale-110"
          onError={(e) => {
            console.log("Mobile product selection image error:", firstImage);
            e.currentTarget.src = "/images/fallback-shoe.png";
          }}
        />
      </motion.button>
    );
  })}
</motion.div>
                {/* Product Image */}
                <div
                  className="relative w-full h-[50vh] flex justify-center items-center"
                  style={{ perspective: "1000px" }}
                >
                  <AnimatePresence mode="sync">
                    {imagesLoaded && !imageError && (
                      <motion.div
                        key={`image-mobile-${selectedProduct}-${currentImageIndex}`}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1,
                          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                        }}
                        exit={{
                          opacity: 0,
                          x: -100,
                          scale: 0.9,
                          transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1] },
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ transformStyle: "preserve-3d" }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={handleImageClick}
                      >
                        <Image
                          src={imageSrc}
                          alt={currentProduct.name || "Product Image"}
                          width={500}
                          height={400}
                          sizes="90vw"
                          className="w-full max-w-[400px] h-auto drop-shadow-xl"
                          priority
                          onLoad={() => setImagesLoaded(true)}
                          onError={() => setImageError(true)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {imageError && (
                    <div
                      className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-gray-800/50 rounded-lg"
                      onClick={handleImageClick}
                    >
                      <div className="text-center p-6">
                        <p className="text-white mb-4">Image not available</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setImageError(false);
                            setImagesLoaded(false);
                            const timeout = setTimeout(() => setImageError(true), 10000);
                            setImageLoadTimeout(timeout);
                            currentProduct.images?.forEach((src: string) => {
                              const img = new window.Image();
                              img.src = src;
                              img.onload = () => {
                                setImagesLoaded(true);
                                clearTimeout(timeout);
                              };
                            });
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}
                  <motion.div
                    className="absolute bottom-0 w-full flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{
                      duration: (ANIMATION_DURATION / 1000) * 0.8,
                      delay: 0.2,
                    }}
                  >
                    {!ellipseError ? (
                      <Image
                        src="/ellips.svg"
                        alt="Ellipse"
                        width={400}
                        height={40}
                        className="w-[80vw] max-w-[400px] h-auto"
                        style={{
                          filter: "blur(4px) drop-shadow(0 0 15px rgba(0,0,0,0.5))",
                        }}
                        aria-hidden="true"
                        onError={() => setEllipseError(true)}
                      />
                    ) : (
                      <div className="w-[80vw] max-w-[400px] h-12 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full blur-sm" />
                    )}
                  </motion.div>
                </div>
                {/* Image Navigation */}
                <motion.div
                  className="flex gap-2 items-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.6,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsNavClick(true);
                      onPrevImage();
                    }}
                    className="text-white border-2 border-white/40 rounded-full hover:bg-white/20 h-10 w-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  {currentProduct.images?.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => onImageIndexChange(index)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? "border-white scale-105"
                          : "border-gray-700 hover:border-white hover:scale-105"
                      }`}
                      aria-label={`Select image ${index + 1}`}
                    >
                      <Image
                        src={img}
                        alt={`Preview ${index + 1}`}
                        fill
                        sizes="50px"
                        className="object-cover transition-transform hover:scale-110"
                        onError={(e) => {
                          console.log("Mobile preview image error:", img);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsNavClick(true);
                      onNextImage();
                    }}
                    className="text-white border-2 border-white/40 rounded-full hover:bg-white/20 h-10 w-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </motion.div>
                {/* Title and CTA */}
                <motion.div
                  className="flex flex-col items-center gap-4 text-center"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.4,
                    duration: (ANIMATION_DURATION / 1000) * 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <h1 className="text-2xl font-light leading-tight tracking-tight">
                    <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-playfair font-semibold">
                      Wear your Style
                    </span>
                    <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-playfair font-semibold mt-1">
                      with comfort.
                    </span>
                  </h1>
                  <ViewDetailsButton productId={currentProduct.product_id} slug={currentProduct.slug}/>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                console.log("Modal background clicked, closing");
                onImageClick();
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Product image preview"
            >
              <motion.div
                className="relative"
                initial={{ scale: 0.9, rotateX: 15, opacity: 0 }}
                animate={{ scale: 1.1, rotateX: 0, opacity: 1 }}
                exit={{ scale: 0.9, rotateX: -15, opacity: 0 }}
                transition={{
                  duration: ANIMATION_DURATION / 1000,
                  ease: [0.25, 0.8, 0.25, 1],
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {imageError ? (
                  <div className="flex flex-col items-center justify-center h-[90vh] w-[75vw] text-red-500">
                    <p>Failed to load image</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log("Retry button clicked for modal image");
                        setImageError(false);
                        setImagesLoaded(false);
                        const timeout = setTimeout(
                          () => setImageError(true),
                          10000
                        );
                        setImageLoadTimeout(timeout);
                        currentProduct.images?.forEach((src: string) => {
                          const img = new window.Image();
                          img.src = src;
                          img.onload = () => clearTimeout(timeout);
                        });
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : !imagesLoaded ? (
                  <div className="flex items-center justify-center h-[90vh] w-[75vw]">
                    <div className="animate-spin h-8 w-8 border-4 border-t-white border-gray-600 rounded-full" />
                  </div>
                ) : (
                  <Image
                    src={imageSrc}
                    alt={currentProduct.name || "Product Image"}
                    width={1200}
                    height={1200}
                    sizes={isMobile ? "100vw" : "75vw"}
                    className={cn(
                      "object-contain",
                      isMobile
                        ? "max-h-[90vh] w-auto"
                        : "max-h-[90vh] max-w-[75vw] w-auto"
                    )}
                    priority
                    onLoad={() => {
                      console.log("Modal image loaded:", imageSrc);
                      setImagesLoaded(true);
                    }}
                    onError={() => {
                      console.log("Modal image error:", imageSrc);
                      setImageError(true);
                    }}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

HeroSection.displayName = "HeroSection";

export default HeroSection;