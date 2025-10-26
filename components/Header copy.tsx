"use client";

import { ShoppingBag, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import CartDrawer from "./CartDrawer";
import { useTheme } from "@/lib/ThemeProvider";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "New Releases", href: "/new-releases" },
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "Kids", href: "/kids" },
  { label: "Customize", href: "/customize" },
];

const ANIMATION_DURATION = 500; // ms, synced with HeroSection
const ANIMATION_DURATION_S = ANIMATION_DURATION / 1000;

const headerVariants: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: ANIMATION_DURATION_S, type: "spring", stiffness: 100, damping: 15 },
  },
};

const navItemVariants: Variants = {
  hidden: { y: -20, opacity: 0, scale: 0.9 },
  visible: (index: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { delay: 0.1 * index, duration: ANIMATION_DURATION_S, type: "spring", stiffness: 120 },
  }),
  hover: {
    scale: 1.1,
    color: "#f59e0b",
    textShadow: "0 0 8px rgba(245, 158, 11, 0.5)",
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

const iconVariants: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.2,
    rotate: 10,
    boxShadow: "0 0 12px rgba(255, 255, 255, 0.3)",
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

const Header: React.FC = () => {
  const { theme, switchTheme, currentThemeName } = useTheme(); // ✅ Moved inside component
  
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [cartCount] = useState<number>(1);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  const { scrollY } = useScroll();
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(8px)", "blur(16px)"]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0.2, 0.4]);

  // Define color themes inside component if needed for CartDrawer
  const colorThemes = {
    black: { bg: "#0a0a0a", gradient: "from-gray-900/90 to-gray-800/90", text: "text-white" },
    red: { bg: "#9b1b1b", gradient: "from-red-900/90 to-red-700/90", text: "text-white" },
  };

  // Preload logo
  useEffect(() => {
    const preloadImages = () => {
      const img = new window.Image();
      img.src = "/logo.png";
      img.onload = () => {
        console.log("Header logo preloaded: /logo.png");
        setLogoLoaded(true);
      };
      img.onerror = () => {
        console.log("Header logo preload error: /logo.png");
        setLogoError(true);
        setLogoLoaded(true);
      };
    };
    preloadImages();
  }, []);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-b border-white/20"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: theme.bg, 
          backdropFilter: backdropBlur,
          borderColor: useTransform(borderOpacity, (value) => `rgba(255, 255, 255, ${value})`),
        }}
      >
        <div className="max-w-8xl mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: ANIMATION_DURATION_S, type: "spring", stiffness: 100, delay: 0.2 }}
            whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
          >
            <Link href="/" aria-label="Home">
              {!logoLoaded ? (
                <div className="w-16 h-16 flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-4 border-t-white border-gray-600 rounded-full" />
                </div>
              ) : (
                <img
                  src={logoError ? "/fallback-logo.png" : "/logo.png"}
                  alt="Brand Logo"
                  className="w-16 h-16 object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                  onError={(e) => (e.currentTarget.src = "/fallback-logo.png")}
                />
              )}
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10 bg-white/10 backdrop-blur-md rounded-full px-10 py-4 border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Link
                  href={item.href}
                  className="text-white text-sm font-semibold tracking-wide font-inter hover:text-amber-400 transition-colors duration-300"
                  style={{ fontFamily: "Inter, Poppins, sans-serif" }}
                  aria-label={item.label}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/15 rounded-full"
            aria-label="Toggle Menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <motion.div variants={iconVariants} whileHover="hover">
              <Menu className="h-6 w-6" />
            </motion.div>
          </Button>

          {/* User & Cart */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: ANIMATION_DURATION_S, type: "spring", stiffness: 100, delay: 0.3 }}
          >
            {/* User */}
            <motion.div variants={iconVariants} whileHover="hover">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                aria-label="User Profile"
              >
                <User className="h-6 w-6" />
              </Button>
            </motion.div>

            {/* Shopping Cart */}
            <motion.div variants={iconVariants} whileHover="hover" className="relative">
              {/* If CartDrawer needs theme, pass the current theme */}
              <CartDrawer/>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <motion.nav
          className="md:hidden bg-transparent backdrop-blur-lg border-t border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: isMenuOpen ? "auto" : 0,
            opacity: isMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.4, type: "spring", stiffness: 100, damping: 15 }}
          style={{ 
            overflow: "hidden",
            backgroundColor: theme.bg + '80' // Add some transparency
          }}
        >
          <div className="flex flex-col items-center gap-4 py-6">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate={isMenuOpen ? "visible" : "hidden"}
              >
                <Link
                  href={item.href}
                  className="text-white text-base font-semibold uppercase tracking-wide font-inter hover:text-amber-400 transition-colors duration-300"
                  style={{ fontFamily: "Inter, Poppins, sans-serif" }}
                  aria-label={item.label}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.nav>
      </motion.header>
    </>
  );
};

export default Header;