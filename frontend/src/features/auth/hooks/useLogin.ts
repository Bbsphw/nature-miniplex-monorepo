import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';
import type { LoginCommand, AuthResponse } from '@/types/api';

export function useLogin() {
  return useMutation({
    mutationFn: async (command: LoginCommand) => {
      const { data } = await apiClient.post<AuthResponse>('/api/auth/login', command);
      return data;
    },
    onSuccess: (data) => {
      toast.success('เข้าสู่ระบบสำเร็จ');
      // Token handling should ideally be done by the caller or an auth context
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      } else {
        toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    },
  });
}
