import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';
import type { CreateShowtimeCommand } from '@/types/api';

export function useCreateShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: CreateShowtimeCommand) => {
      const { data } = await apiClient.post<number>('/api/showtimes', command);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['showtimes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการเพิ่มรอบฉาย');
      } else {
        toast.error('เกิดข้อผิดพลาดในการเพิ่มรอบฉาย');
      }
    },
  });
}
