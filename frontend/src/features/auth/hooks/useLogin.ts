import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';
import type { LoginCommand, AuthResponse } from '@/types/api';

export function useLogin() {
  return useMutation({
    mutationFn: async (command: LoginCommand) => {
      const { data } = await apiClient.post<AuthResponse>('/api/auth/login', command);
      return data;
    },
    onSuccess: () => {
      toast.success('เข้าสู่ระบบสำเร็จ');
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
