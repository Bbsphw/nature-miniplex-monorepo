import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';

export function useDeleteBookingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, itemId, phoneNumber }: { bookingId: string; itemId: string; phoneNumber: string }) => {
      await apiClient.delete(`/api/bookings/${bookingId}/items/${itemId}`, { params: { phoneNumber } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('ยกเลิกรายการจองย่อยเรียบร้อยแล้ว');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.response?.data?.title ||
          'เกิดข้อผิดพลาดในการยกเลิกรายการ';
        toast.error(message);
      } else {
        toast.error('เกิดข้อผิดพลาดในการยกเลิกรายการ');
      }
    },
  });
}
