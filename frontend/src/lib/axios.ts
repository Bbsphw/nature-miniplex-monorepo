import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/useAuthStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get('admin_token') || useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      typeof window !== 'undefined' &&
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes('/api/auth/login')
    ) {
      useAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
