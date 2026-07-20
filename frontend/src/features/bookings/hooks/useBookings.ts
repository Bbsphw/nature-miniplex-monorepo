import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Booking } from '@/types/api';

export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await apiClient.get<Booking[]>('/api/bookings');
      return data;
    },
  });
}
