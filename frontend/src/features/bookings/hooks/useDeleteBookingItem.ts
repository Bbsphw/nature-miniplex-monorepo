import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import axios from 'axios';

export function useDeleteBookingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, itemId, phoneNumber }: { bookingId: string; itemId: string; phoneNumber: string }) => {
      await apiClient.delete(`/api/bookings/${bookingId}/items/${itemId}`, { data: { phoneNumber } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('ยกเลิกรายการจองย่อยเรียบร้อยแล้ว');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการยกเลิกรายการ');
      } else {
        toast.error('เกิดข้อผิดพลาดในการยกเลิกรายการ');
      }
    },
  });
}
