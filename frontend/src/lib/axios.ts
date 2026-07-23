import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from '@/store/useToastStore';
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

let last403ToastTime = 0;

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (typeof window !== 'undefined' && axios.isAxiosError(error)) {
      const status = error.response?.status;
      const isLoginUrl = error.config?.url?.includes('/api/auth/login');

      // 401 Unauthorized: Session Expired or Unauthenticated
      if (status === 401 && !isLoginUrl) {
        toast.error('Session Expired', {
          description: 'Your session has expired. Please log in again.',
        });
        useAuthStore.getState().logout();
        window.location.href = '/admin/login';
      }

      // 403 Forbidden: Backend SSOT Authorization Rejection
      if (status === 403) {
        const token = Cookies.get('admin_token') || useAuthStore.getState().token;
        if (!token) {
          useAuthStore.getState().logout();
          if (!window.location.pathname.includes('/admin/login')) {
            window.location.href = '/admin/login';
          }
          return Promise.reject(error);
        }

        const now = Date.now();
        // Throttle 403 toasts so multiple concurrent failed requests don't spam toasts (max once per 2 seconds)
        if (now - last403ToastTime > 2000) {
          last403ToastTime = now;
          const backendMessage =
            error.response?.data?.message ||
            error.response?.data?.detail ||
            error.response?.data?.title ||
            'Access Denied: You do not have sufficient permissions to perform this operation.';

          toast.error('403 Forbidden (Security Enforcement)', {
            description: backendMessage,
          });
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
