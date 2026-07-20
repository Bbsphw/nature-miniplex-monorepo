import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, phoneNumber }: { id: string; phoneNumber: string }) => {
      await apiClient.delete(`/api/bookings/${id}`, { data: { phoneNumber } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('ยกเลิกการจองสำเร็จ');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการยกเลิกการจอง');
      } else {
        toast.error('เกิดข้อผิดพลาดในการยกเลิกการจอง');
      }
    },
  });
}
