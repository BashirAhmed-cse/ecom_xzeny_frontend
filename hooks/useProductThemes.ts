// hooks/useProductThemes.ts
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/ThemeProvider';

export const useProductThemes = (products: Record<string, any> | any[] | null | undefined) => {
  const { registerProductThemes } = useTheme();
  const previousProductsHash = useRef<string>('');

  useEffect(() => {
    if (!products) return;

    // Handle both array and object formats
    let productsObject: Record<string, any>;
    
    if (Array.isArray(products)) {
      // Convert array to object by color key
      productsObject = products.reduce((acc, product) => {
        if (product?.colorKey) {
          acc[product.colorKey] = product;
        }
        return acc;
      }, {});
    } else {
      productsObject = products;
    }

    // Create a simple hash for comparison
    const currentHash = JSON.stringify(Object.keys(productsObject).sort());
    
    // Only register if products actually changed
    if (Object.keys(productsObject).length > 0 && currentHash !== previousProductsHash.current) {
      registerProductThemes(productsObject);
      previousProductsHash.current = currentHash;
    }
  }, [products, registerProductThemes]);
};