import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { SeatStatus } from '@/types/api';

export function useShowtimeSeats(showtimeId: number) {
  return useQuery<SeatStatus[]>({
    queryKey: ['showtime-seats', showtimeId],
    queryFn: async () => {
      const { data } = await apiClient.get<SeatStatus[]>(`/api/showtimes/${showtimeId}/seats`);
      return data;
    },
    refetchInterval: 5000,
    enabled: showtimeId > 0,
  });
}
