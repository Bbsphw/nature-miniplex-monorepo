import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, phoneNumber }: { id: string; phoneNumber: string }) => {
      await apiClient.delete(`/api/bookings/${id}`, { params: { phoneNumber } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('ยกเลิกการจองเรียบร้อยแล้ว');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.response?.data?.title ||
          'เกิดข้อผิดพลาดในการยกเลิกการจอง';
        toast.error(message);
      } else {
        toast.error('เกิดข้อผิดพลาดในการยกเลิกการจอง');
      }
    },
  });
}
