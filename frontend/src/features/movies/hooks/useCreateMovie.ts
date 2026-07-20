import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';
import type { CreateMovieCommand } from '@/types/api';

export function useCreateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: CreateMovieCommand) => {
      const { data } = await apiClient.post<number>('/api/movies', command);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('เพิ่มภาพยนตร์สำเร็จ');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการเพิ่มภาพยนตร์');
      } else {
        toast.error('เกิดข้อผิดพลาดในการเพิ่มภาพยนตร์');
      }
    },
  });
}
