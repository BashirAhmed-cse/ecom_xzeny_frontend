'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3009/api';

// Simple fetch wrapper without authentication
export const getFrontendProducts = async () => {
  try {
    const res = await fetch(`${API_URL}/products/frontend/productData`);
    console.log('check res:-',res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(err.message || `API error: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('❌ Failed to fetch frontend products:', error);
    throw error;
  }
};

 export const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/frontend/productDetails/${productId}`);
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.data);
        // Set default selections
        if (data.data.variants.length > 0) {
          setSelectedVariant(data.data.variants[0]);
        }
        if (data.data.sizes.length > 0) {
          setSelectedSize(data.data.sizes[0]);
        }
        if (data.data.media.primary_image) {
          setSelectedImage(data.data.media.primary_image);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };