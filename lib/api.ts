'use client';

import { useAuth } from '@clerk/nextjs';

// --------------------
// 🌐 Base API URL
// --------------------
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ecom-xzeny-backend.onrender.com/api';

// --------------------
// 🧩 Type Definitions
// --------------------
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  timeout?: number;
  retries?: number;
}

// --------------------
// 🎯 Backend Models
// --------------------
export interface BackendUser {
  user_id: number;
  clerk_id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface Address {
  address_id: number;
  user_id: number;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_billing: boolean;
  is_shipping: boolean;
}

// --------------------
// 🔄 Backend Response Types
// --------------------
interface BackendProfileResponse {
  success: boolean;
  user: BackendUser;
  message?: string;
}

interface BackendAddressResponse {
  success: boolean;
  data?: Address[];
  message?: string;
}

interface BackendSyncResponse {
  success: boolean;
  user: BackendUser;
  message?: string;
}

interface BackendMeResponse {
  success: boolean;
  user: BackendUser;
  message?: string;
}

// --------------------
// 🔐 useApi Hook
// --------------------
export function useApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = async <T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    const { timeout = 10000, retries = 3, ...fetchOptions } = options;
    let lastError: any = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const token = await getToken();
        if (!token) return { success: false, error: { message: 'No authentication token found' } };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const config: RequestInit = {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        };

        if (fetchOptions.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method || 'GET')) {
          config.body = typeof fetchOptions.body === 'string' ? fetchOptions.body : JSON.stringify(fetchOptions.body);
        }

        const response = await fetch(`${API_URL}${url}`, config);
        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type');
        const isJson = contentType?.includes('application/json');

        const result = isJson ? await response.json() : await response.text();

        if (!response.ok) {
          const apiError: ApiError = {
            message: result?.message || result?.error || `HTTP error ${response.status}`,
            status: response.status,
            code: result?.code,
            details: result?.details,
          };

          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            return { success: false, error: apiError };
          }

          lastError = apiError;
          continue;
        }

        return { success: true, data: result };
      } catch (error: any) {
        lastError = error;
        if (error.name === 'AbortError' || error.name === 'TypeError') break;
        if (attempt < retries) await new Promise((res) => setTimeout(res, Math.min(1000 * 2 ** attempt, 30000)));
      }
    }

    return { success: false, error: { message: lastError?.message || 'API request failed', details: lastError } };
  };

  // --------------------
  // 🔑 Auth
  // --------------------
  const syncUserWithBackend = () => fetchWithAuth<BackendSyncResponse>('/auth/sync-user', { method: 'POST' });
  const getBackendProfile = () => fetchWithAuth<BackendProfileResponse>('/auth/profile');
  const getUserProfile = () => fetchWithAuth<BackendMeResponse>('/auth/me');
  const updateUserProfile = (data: any) => fetchWithAuth('/auth/profile', { method: 'PUT', body: data });

  // --------------------
  // 👥 Users
  // --------------------
  const getUsers = (params?: Record<string, any>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return fetchWithAuth(`/users${q}`);
  };
  const getUserById = (id: string) => fetchWithAuth(`/users/${id}`);

  // --------------------
  // 🏠 Addresses
  // --------------------
  const getAddresses = () => fetchWithAuth<BackendAddressResponse>('/auth/addresses');
  const getAddressById = (id: string | number) => fetchWithAuth<Address>(`/auth/addresses/${id}`);
  const addAddress = (data: any) => fetchWithAuth<Address>('/auth/addresses', { method: 'POST', body: data });
  const updateAddress = (id: string | number, data: any) => fetchWithAuth<Address>(`/auth/addresses/${id}`, { method: 'PUT', body: data });
  const deleteAddress = (id: string | number) => fetchWithAuth(`/auth/addresses/${id}`, { method: 'DELETE' });
  const setDefaultAddress = (id: string | number) => fetchWithAuth(`/auth/addresses/${id}/default`, { method: 'PATCH' });

  // --------------------
  // 📦 Orders
  // --------------------
const getOrders = (params?: Record<string, any>) => {
  const q = params ? `?${new URLSearchParams(params)}` : '';
  return fetchWithAuth(`/orders${q}`);
};
const getOrderById = (id: string) => fetchWithAuth(`/orders/${id}`);

const createOrder = (data: any) => fetchWithAuth('/orders', { 
  method: 'POST', 
  body: data 
});

const updateOrderStatus = (id: string, data: any) => 
  fetchWithAuth(`/orders/${id}/status`, { 
    method: 'PATCH', 
    body: data 
  });

const cancelOrder = (id: string) => 
  fetchWithAuth(`/orders/${id}/cancel`, { 
    method: 'PATCH' 
  });

  // --------------------
  // 🛍️ Products
  // --------------------
  const getProducts = (params?: Record<string, any>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return fetchWithAuth(`/products${q}`);
  };
  const getProductById = (id: string) => fetchWithAuth(`/products/${id}`);





  // --------------------
  // 📁 File Upload
  // --------------------
  const uploadFile = async (file: File, options?: { folder?: string }) => {
    const token = await getToken();
    if (!token) throw new Error('No authentication token found');

    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) formData.append('folder', options.folder);

    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  };

  // --------------------
  // 🩺 Health Check
  // --------------------
  const healthCheck = () => fetchWithAuth('/health');

  return {
    fetchWithAuth,
    syncUserWithBackend,
    getBackendProfile,
    getUserProfile,
    updateUserProfile,
    getUsers,
    getUserById,
    getAddresses,
    getAddressById,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    getProducts,
    getProductById,
    uploadFile,
    healthCheck,
  };
}

// --------------------
// ⚙️ useApiHelpers: Generic CRUD Factory
// --------------------
export function useApiHelpers() {
  const { fetchWithAuth } = useApi();

  const createApiHook = <T, CreateDto = any, UpdateDto = any>(endpoint: string) => ({
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return fetchWithAuth<T[]>(`${endpoint}${query}`);
    },
    get: (id?: string | number) => fetchWithAuth<T>(id ? `${endpoint}/${id}` : endpoint),
    create: (data: CreateDto) => fetchWithAuth<T>(endpoint, { method: 'POST', body: data }),
    update: (id: string | number, data: UpdateDto) => fetchWithAuth<T>(`${endpoint}/${id}`, { method: 'PUT', body: data }),
    delete: (id: string | number) => fetchWithAuth(`${endpoint}/${id}`, { method: 'DELETE' }),
  });

  return { createApiHook };
}