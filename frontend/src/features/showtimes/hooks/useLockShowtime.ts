import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';

export function useLockShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isLocked }: { id: number; isLocked: boolean }) => {
      await apiClient.patch(`/api/showtimes/${id}/lock`, { isLocked });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['showtimes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการอัพเดทสถานะรอบฉาย');
      } else {
        toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะรอบฉาย');
      }
    },
  });
}
