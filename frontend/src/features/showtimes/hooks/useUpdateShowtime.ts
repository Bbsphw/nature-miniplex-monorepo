import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';
import type { UpdateShowtimeCommand } from '@/types/api';

export function useUpdateShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: UpdateShowtimeCommand) => {
      await apiClient.put(`/api/showtimes/${command.id}`, command);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['showtimes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการแก้ไขรอบฉาย');
      } else {
        toast.error('เกิดข้อผิดพลาดในการแก้ไขรอบฉาย');
      }
    },
  });
}
