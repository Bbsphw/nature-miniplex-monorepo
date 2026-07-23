import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';
import type { CreateUserCommand } from '@/types/api';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: CreateUserCommand) => {
      const { data } = await apiClient.post<number>('/api/users', command);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['action-logs'] });
      toast.success('สร้างผู้ใช้สำเร็จ');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
      } else {
        toast.error('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
      }
    },
  });
}
