import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';

export function useDeleteMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/movies/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('ลบภาพยนตร์สำเร็จ');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบภาพยนตร์');
      } else {
        toast.error('เกิดข้อผิดพลาดในการลบภาพยนตร์');
      }
    },
  });
}
