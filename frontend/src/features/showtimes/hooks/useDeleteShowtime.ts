import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';

export function useDeleteShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/showtimes/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['showtimes'] });
      toast.success('ลบรอบฉายสำเร็จ');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบรอบฉาย');
      } else {
        toast.error('เกิดข้อผิดพลาดในการลบรอบฉาย');
      }
    },
  });
}
