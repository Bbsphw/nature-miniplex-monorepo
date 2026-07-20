import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';
import type { UpdateMovieCommand } from '@/types/api';

export function useUpdateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: UpdateMovieCommand) => {
      await apiClient.put(`/api/movies/${command.id}`, command);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('แก้ไขภาพยนตร์สำเร็จ');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการแก้ไขภาพยนตร์');
      } else {
        toast.error('เกิดข้อผิดพลาดในการแก้ไขภาพยนตร์');
      }
    },
  });
}
