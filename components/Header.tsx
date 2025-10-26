"use client";

import { ShoppingBag, User, Menu, Loader2, LogOut, User as UserIcon, Package, X, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CartDrawer from "./CartDrawer";
import { useTheme } from "@/lib/ThemeProvider";

// Clerk imports
import { 
  useUser, 
  useClerk, 
  SignedIn, 
  SignedOut,
  useAuth 
} from '@clerk/nextjs';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "New Releases", href: "/new-releases", icon: "🔥" },
  { label: "Men", href: "/men", icon: "👨" },
  { label: "Women", href: "/women", icon: "👩" },
];

const ANIMATION_DURATION = 500;
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

// Custom User Dropdown Component
const CustomUserDropdown = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { currentThemeName } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shouldUseWhiteText = currentThemeName === 'black' || currentThemeName === 'red';
  const dropdownBg = shouldUseWhiteText ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const dropdownText = shouldUseWhiteText ? 'text-white' : 'text-gray-900';
  const dropdownHover = shouldUseWhiteText ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        style={{
          borderColor: shouldUseWhiteText ? '#f59e0b' : '#d97706'
        }}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.fullName || "User"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl backdrop-blur-md border z-50 ${dropdownBg} ${dropdownText}`}
        >
          {/* User Info */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-sm truncate">
              {user?.firstName || "Welcome!"}
            </p>
            <p className="text-xs opacity-70 truncate mt-1">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          {/* Dropdown Items */}
          <div className="p-1 space-y-0">
            <Link
              href="/profile"
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dropdownHover} ${dropdownText}`}
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="h-4 w-4" />
              My Profile
            </Link>

            <Link
              href="/orders"
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dropdownHover} ${dropdownText}`}
              onClick={() => setIsOpen(false)}
            >
              <Package className="h-4 w-4" />
              My Orders
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dropdownHover} text-red-500 hover:text-red-600`}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const Header: React.FC = () => {
  const { theme, currentThemeName } = useTheme();
  const { user, isLoaded } = useUser();
  const { openSignIn, redirectToSignUp } = useClerk();
  const { signOut } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const { scrollY } = useScroll();
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(8px)", "blur(16px)"]);
  
  const borderOpacityDark = useTransform(scrollY, [0, 100], [0.2, 0.4]);
  const borderOpacityLight = useTransform(scrollY, [0, 100], [0.1, 0.3]);
  
  const borderColor = useTransform(
    [borderOpacityDark, borderOpacityLight],
    ([darkVal, lightVal]) => {
      const isDarkMode = currentThemeName === 'black';
      const opacity = isDarkMode ? darkVal : lightVal;
      return isDarkMode 
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(0, 0, 0, ${opacity})`;
    }
  );

  const shouldUseWhiteText = currentThemeName === 'black' || currentThemeName === 'red';
  const navTextColor = shouldUseWhiteText ? 'text-white' : 'text-gray-200';
  const navHoverColor = shouldUseWhiteText ? 'hover:text-amber-400' : 'hover:text-amber-600';

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload logo
  useEffect(() => {
    const preloadImages = () => {
      const img = new window.Image();
      img.src = "/logo.png";
      img.onload = () => setLogoLoaded(true);
      img.onerror = () => {
        setLogoError(true);
        setLogoLoaded(true);
      };
    };
    preloadImages();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => setIsMenuOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    };
  }, [isMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isMenuOpen]);

  const getClerkAppearance = () => {
    const useDarkAppearance = currentThemeName === 'black' || currentThemeName === 'red';
    
    return {
      elements: {
        rootBox: "mx-auto",
        card: useDarkAppearance 
          ? "bg-gray-900 border border-gray-700 rounded-2xl" 
          : "bg-white border border-gray-200 rounded-2xl shadow-xl",
        headerTitle: useDarkAppearance ? "text-white text-2xl font-bold" : "text-gray-900 text-2xl font-bold",
        headerSubtitle: useDarkAppearance ? "text-gray-400" : "text-gray-600",
        socialButtonsBlockButton: useDarkAppearance 
          ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700" 
          : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200",
        formButtonPrimary: "bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors",
        formFieldInput: useDarkAppearance 
          ? "bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500" 
          : "bg-white border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-amber-500",
        formFieldLabel: useDarkAppearance ? "text-white" : "text-gray-900",
        footerActionLink: "text-amber-500 hover:text-amber-600 transition-colors",
        formFieldAction: "text-amber-500 hover:text-amber-600",
        identityPreviewEditButton: "text-amber-500 hover:text-amber-600",
        formResendCodeLink: "text-amber-500 hover:text-amber-600",
      },
      variables: {
        colorPrimary: '#f59e0b',
        colorText: useDarkAppearance ? '#ffffff' : '#000000',
        colorBackground: useDarkAppearance ? '#111827' : '#ffffff',
      }
    };
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await openSignIn({
        appearance: getClerkAppearance()
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    try {
      await redirectToSignUp({
        appearance: getClerkAppearance()
      });
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading state while Clerk initializes or during SSR
  if (!isLoaded || !mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="max-w-8xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="w-16 h-16 bg-gray-700 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-b"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: theme.bg + 'cc', 
          backdropFilter: backdropBlur,
          borderColor: borderColor,
        }}
      >
        <div className="max-w-8xl mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: ANIMATION_DURATION_S, type: "spring", stiffness: 100, delay: 0.2 }}
          >
            <Link href="/" aria-label="Home" className="block">
              {!logoLoaded ? (
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                </div>
              ) : (
                <img
                  src={logoError ? "/fallback-logo.png" : "/logo.png"}
                  alt="StyleCommerce - Wear your Style with Comfort"
                  className="w-16 h-16 object-contain filter drop-shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = "/fallback-logo.png";
                    setLogoError(true);
                  }}
                />
              )}
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-10 backdrop-blur-md rounded-full px-10 py-4 border shadow-lg transition-colors ${
            shouldUseWhiteText 
              ? "bg-white/10 border-white/15" 
              : "bg-black/5 border-black/10"
          }`}>
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
                  className={`text-sm font-semibold tracking-wide font-inter transition-all duration-300 ${navTextColor} ${navHoverColor}`}
                  style={{ fontFamily: "Inter, Poppins, sans-serif" }}
                  aria-label={item.label}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden h-9 w-9 rounded-full ${
                shouldUseWhiteText 
                  ? "text-white hover:bg-white/15" 
                  : "text-gray-900 hover:bg-black/10"
              }`}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={authLoading}
            >
              {authLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>

            {/* Search Button (Optional - Add if needed) */}
            {/* <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full ${
                shouldUseWhiteText 
                  ? "text-white hover:bg-white/15" 
                  : "text-gray-900 hover:bg-black/10"
              }`}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button> */}

            {/* User & Cart */}
            <div className="flex items-center gap-2">
              {/* Signed Out State */}
              <SignedOut>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-full ${
                    shouldUseWhiteText 
                      ? "text-white hover:bg-white/15" 
                      : "text-gray-900 hover:bg-black/10"
                  }`}
                  aria-label="Sign In"
                  onClick={handleSignIn}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </SignedOut>

              {/* Signed In State */}
              <SignedIn>
                <CustomUserDropdown />
              </SignedIn>

              {/* Shopping Cart */}
              <div className="relative">
                <CartDrawer />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel - Full screen with better layout */}
            <motion.div
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1] 
              }}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-white hover:bg-white/20"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Navigation Items with Icons */}
              <div className="p-4 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-2">
                  Categories
                </h3>
                <div className="space-y-1">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <span className="font-semibold text-lg flex-1">{item.label}</span>
                        <div className="w-2 h-2 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Home Link */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4"
                >
                  <Link
                    href="/"
                    className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-semibold text-lg">Home</span>
                  </Link>
                </motion.div>
              </div>

              {/* User Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <SignedOut>
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all duration-200 py-4 shadow-lg hover:shadow-xl"
                      onClick={handleSignUp}
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Create Account
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 py-4 font-medium"
                      onClick={handleSignIn}
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Sign In
                    </Button>
                  </div>
                </SignedOut>
                
                <SignedIn>
                  <div className="space-y-4">
                    {/* User Info with Avatar */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-amber-50 dark:from-gray-800 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.fullName || "User"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shadow-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center bg-white dark:bg-gray-700 shadow-lg">
                          <UserIcon className="h-6 w-6 text-amber-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          Hello, {user?.firstName}!
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>

                    {/* User Links Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/profile"
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-all duration-200 group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-white" />
                        <span className="text-xs font-medium">Profile</span>
                      </Link>
                      <Link
                        href="/orders"
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-all duration-200 group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Package className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-white" />
                        <span className="text-xs font-medium">Orders</span>
                      </Link>
                    </div>

                    {/* Sign Out Button */}
                    <button
                      onClick={async () => {
                        await signOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 hover:border-red-300 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </SignedIn>
              </div>
            </motion.div>
          </div>
        )}
      </motion.header>
    </>
  );
};

export default Header;