// API utility functions for frontend
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Use NEXT_PUBLIC_API_BASE_URL for client-side calls
// This will be available in the browser, fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public endpoints that don't require authentication
const publicEndpoints = ['/auth/login', '/auth/register', '/products', '/categories'];

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Check if this is a public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint) || config.url?.startsWith(endpoint)
    );
    
    // Only add token for protected endpoints
    if (!isPublicEndpoint) {
      let token = null;
      
      // First try to get from auth store
      try {
        const authState = useAuthStore.getState();
        token = authState.token;
        if (token && process.env.NODE_ENV === 'development') {
          console.log('[API Interceptor] Token from store:', token.substring(0, 20) + '...');
        }
      } catch (e) {
        console.warn('[API Interceptor] Could not get token from auth store:', e);
      }
      
      // Fallback to localStorage if store doesn't have token
      if (!token) {
        const authData = localStorage.getItem('clothing-store-auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            // Zustand persist stores data in { state: {...}, version: ... } format
            token = parsed.state?.token || parsed.token;
            if (token && process.env.NODE_ENV === 'development') {
              console.log('[API Interceptor] Token from localStorage:', token.substring(0, 20) + '...');
            }
          } catch (e) {
            console.error('[API Interceptor] Error parsing auth data:', e, 'Raw data:', authData?.substring(0, 100));
          }
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (process.env.NODE_ENV === 'development') {
          console.log('[API Interceptor] Token attached to request:', config.url, token.substring(0, 20) + '...');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[API Interceptor] No token found for protected endpoint:', config.url);
        }
      }
    }
  }
  return config;
});

// Handle 401 errors - but don't redirect automatically, let components handle it
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Only clear auth data, don't redirect automatically
      // Let the component handle the redirect with proper error message
      console.warn('401 Unauthorized - Token may be expired or invalid');
      // Don't redirect here - let the component handle it
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      // Re-throw with better error message
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
  },
  login: async (data: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      // Re-throw with better error message
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
  },
};

// Products API
export const productsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; categoryId?: number }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  create: async (data: {
    items: Array<{ variantId: number; quantity: number }>;
    paymentMethod?: string;
    shippingAddress?: string;
  }) => {
    // Ensure token is attached - get it directly before making the request
    let token = null;
    if (typeof window !== 'undefined') {
      try {
        const authState = useAuthStore.getState();
        token = authState.token;
        
        // Fallback to localStorage
        if (!token) {
          const authData = localStorage.getItem('clothing-store-auth');
          if (authData) {
            try {
              const parsed = JSON.parse(authData);
              token = parsed.state?.token || parsed.token;
            } catch (e) {
              console.error('Error parsing auth data in ordersAPI:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error getting token in ordersAPI:', e);
      }
    }
    
    // Make request with explicit token in headers
    if (!token) {
      console.error('[ordersAPI.create] No token found! Cannot make request.');
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Create config with Authorization header
    // Axios will merge this with interceptor headers
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    console.log('[ordersAPI.create] Making request with token:', {
      tokenPreview: token.substring(0, 30) + '...',
      tokenLength: token.length,
      url: '/orders'
    });
    
    try {
      const response = await api.post('/orders', data, config);
      console.log('[ordersAPI.create] Order created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ordersAPI.create] Request failed:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        headers: error.response?.headers,
        requestHeaders: error.config?.headers
      });
      throw error;
    }
  },
  getMyOrders: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/orders/my-orders', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  createIntent: async (data: { orderId: number; amount: number }) => {
    const response = await api.post('/payment/create-intent', data);
    return response.data;
  },
  confirm: async (data: { paymentIntentId: string; orderId: number }) => {
    const response = await api.post('/payment/confirm', data);
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  create: async (data: { productId: number; rating: number; comment?: string }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
  getByProduct: async (productId: number, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
};

export default api;

