"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from "react";

export type ThemeColor = string;

export type Theme = { 
  bg: string; 
  text: string; 
  gradient?: string;
  name?: string;
};

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme | ThemeColor) => void;
  switchTheme: (themeName: ThemeColor) => void;
  themes: Record<string, Theme>;
  currentThemeName: string;
  resetToDefault: () => void;
  registerProductThemes: (products: Record<string, any>) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Enhanced base themes with better contrast
const BASE_THEMES: Record<string, Theme> = {
  black: {
    bg: "#0a0a0a",
    text: "#ffffff",
    gradient: "linear-gradient(135deg, #0a0a0a, #000000)",
    name: "black"
  },
  red: {
    bg: "#dc2626",
    text: "#ffffff",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
    name: "red"
  },
  green: {
    bg: "#16a34a", 
    text: "#ffffff",
    gradient: "linear-gradient(135deg, #16a34a, #15803d)",
    name: "green"
  },
  
  
};

// Helper function to extract color from colorWay
const extractColorFromColorWay = (colorWay: string): string => {
  if (!colorWay) return '#0a0a0a';
  
  const match = colorWay.match(/#[0-9A-Fa-f]{6}/);
  return match ? match[0] : '#0a0a0a';
};

// Enhanced contrast calculation
const getTextColor = (bgColor: string): string => {
  try {
    const hex = bgColor.replace('#', '');
    if (hex.length !== 6) return '#ffffff';
    
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance (WCAG formula)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  } catch {
    return '#ffffff';
  }
};

// Improved gradient generation
const generateGradient = (color: string): string => {
  try {
    const hex = color.replace('#', '');
    if (hex.length !== 6) return `linear-gradient(135deg, ${color}, ${color})`;
    
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Create darker shade (20% darker)
    const darkerR = Math.max(0, Math.floor(r * 0.8));
    const darkerG = Math.max(0, Math.floor(g * 0.8));
    const darkerB = Math.max(0, Math.floor(b * 0.8));
    
    const darkerColor = `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
    
    return `linear-gradient(135deg, ${color}, ${darkerColor})`;
  } catch {
    return `linear-gradient(135deg, ${color}, ${color})`;
  }
};

// ✅ EXPORT THESE UTILITY FUNCTIONS
export const withOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

export const getContrastColor = (bgColor: string): string => {
  try {
    const hex = bgColor.replace('#', '');
    if (hex.length !== 6) return '#ffffff';
    
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance (WCAG formula)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  } catch {
    return '#ffffff';
  }
};

export const generateThemeStyles = (theme: any, currentThemeName: string) => {
  const isDark = currentThemeName === 'black' || theme.bg === '#0a0a0a' || theme.bg === '#1a1a1a';
  const isLight = !isDark;

  return {
    container: {
      backgroundColor: isDark ? '#0f0f0f' : '#f8fafc',
      backgroundImage: isDark 
        ? 'radial-gradient(circle at 15% 50%, rgba(28, 28, 28, 0.8) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(28, 28, 28, 0.6) 0%, transparent 50%)'
        : 'radial-gradient(circle at 15% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(255, 255, 255, 0.6) 0%, transparent 50%)'
    },
    card: {
      backgroundColor: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      borderColor: isDark ? 'rgba(55, 55, 55, 0.5)' : 'rgba(229, 231, 235, 0.5)',
      shadow: isDark 
        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)' 
        : '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    input: {
      backgroundColor: isDark ? 'rgba(38, 38, 38, 0.6)' : 'rgba(255, 255, 255, 0.8)',
      borderColor: isDark ? 'rgba(55, 55, 55, 0.8)' : 'rgba(209, 213, 219, 0.8)',
      focusBorderColor: theme.bg,
      textColor: isDark ? '#f8fafc' : '#1e293b',
      placeholderColor: isDark ? '#6b7280' : '#9ca3af'
    },
    text: {
      primary: isDark ? '#f8fafc' : '#1e293b',
      secondary: isDark ? '#d1d5db' : '#64748b',
      muted: isDark ? '#9ca3af' : '#94a3b8'
    },
    button: {
      primary: {
        backgroundColor: theme.bg,
        textColor: getContrastColor(theme.bg),
        hoverColor: withOpacity(theme.bg, 0.8)
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: isDark ? 'rgba(55, 55, 55, 0.8)' : 'rgba(209, 213, 219, 0.8)',
        textColor: isDark ? '#f8fafc' : '#374151',
        hoverColor: isDark ? 'rgba(55, 55, 55, 0.5)' : 'rgba(249, 250, 251, 0.8)'
      }
    },
    progress: {
      active: theme.bg,
      inactive: isDark ? 'rgba(55, 55, 55, 0.8)' : 'rgba(229, 231, 235, 0.8)'
    }
  };
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themes, setThemes] = useState<Record<string, Theme>>(BASE_THEMES);
  const [theme, setThemeState] = useState<Theme>(BASE_THEMES.black);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const saved = localStorage.getItem('theme-color');
        if (saved && BASE_THEMES[saved]) {
          setThemeState(BASE_THEMES[saved]);
        } else if (saved && saved.startsWith('product-')) {
          // Handle product themes that might be saved
          const productThemes = JSON.parse(localStorage.getItem('product-themes') || '{}');
          if (productThemes[saved]) {
            setThemeState(productThemes[saved]);
          }
        }
      } catch (error) {
        console.warn('Failed to load theme from localStorage:', error);
      } finally {
        setIsInitialized(true);
      }
    }
  }, [isInitialized]);

  // Register themes from product data
  const registerProductThemes = useCallback((products: Record<string, any>) => {
    if (!products || typeof products !== 'object' || Object.keys(products).length === 0) {
      return;
    }
    
    const productThemes: Record<string, Theme> = {};
    
    Object.entries(products).forEach(([colorKey, product]) => {
      if (product?.colorWay) {
        try {
          const bgColor = extractColorFromColorWay(product.colorWay);
          const themeName = product.theme_name || colorKey;
          const prefixedKey = `product-${colorKey.toLowerCase().replace(/\s+/g, '-')}`;
          
          productThemes[prefixedKey] = {
            bg: bgColor,
            text: getTextColor(bgColor),
            gradient: generateGradient(bgColor),
            name: themeName
          };
        } catch (error) {
          console.warn(`Failed to create theme for product ${colorKey}:`, error);
        }
      }
    });

    // Only update if we have new themes
    if (Object.keys(productThemes).length > 0) {
      setThemes(prev => {
        const newThemes = { ...prev, ...productThemes };
        
        // Save product themes to localStorage for persistence
        try {
          localStorage.setItem('product-themes', JSON.stringify(productThemes));
        } catch (error) {
          console.warn('Failed to save product themes to localStorage:', error);
        }
        
        return newThemes;
      });
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme | ThemeColor) => {
    if (typeof newTheme === 'string') {
      const selectedTheme = themes[newTheme] || BASE_THEMES[newTheme] || BASE_THEMES.black;
      setThemeState(selectedTheme);
      
      try {
        localStorage.setItem('theme-color', newTheme);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    } else {
      setThemeState(newTheme);
      try {
        localStorage.setItem('theme-color', 'custom');
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  }, [themes]);

  const switchTheme = useCallback((themeName: ThemeColor) => {
    setTheme(themeName);
  }, [setTheme]);

  const resetToDefault = useCallback(() => {
    setTheme('black');
  }, [setTheme]);

  const currentThemeName = useMemo((): string => {
    if (theme?.name) {
      return theme.name;
    }
    
    // Find matching theme by properties
    const matchingTheme = Object.entries(themes).find(([_, themeConfig]) => 
      themeConfig.bg === theme?.bg && themeConfig.text === theme?.text
    );
    
    return matchingTheme ? matchingTheme[0] : "custom";
  }, [theme, themes]);

  const value = useMemo(() => ({
    theme: theme || BASE_THEMES.black,
    setTheme,
    switchTheme,
    themes,
    currentThemeName,
    resetToDefault,
    registerProductThemes,
  }), [theme, themes, currentThemeName, setTheme, switchTheme, resetToDefault, registerProductThemes]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};