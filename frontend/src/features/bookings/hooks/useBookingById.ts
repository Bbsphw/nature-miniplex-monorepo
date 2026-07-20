import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Booking } from '@/types/api';

export function useBookingById(bookingId: string) {
  return useQuery<Booking>({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await apiClient.get<Booking>(`/api/bookings/${bookingId}`);
      return data;
    },
    enabled: !!bookingId,
  });
}
