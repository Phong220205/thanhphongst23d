// API utility functions for frontend
import axios from 'axios';

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

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('clothing-store-auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  return config;
});

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
    const response = await api.post('/orders', data);
    return response.data;
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

