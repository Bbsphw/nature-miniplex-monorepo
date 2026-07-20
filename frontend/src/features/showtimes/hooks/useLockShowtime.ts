import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';

export function useLockShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isLocked }: { id: number; isLocked: boolean }) => {
      await apiClient.patch(`/api/showtimes/${id}/lock`, { isLocked });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['showtimes'] });
      toast.success('อัพเดทสถานะการล็อครอบฉายสำเร็จ');
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
