import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Showtime } from '@/types/api';

export function useShowtimeById(id: number) {
  return useQuery<Showtime>({
    queryKey: ['showtime', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Showtime>(`/api/showtimes/${id}`);
      return data;
    },
    enabled: id > 0,
  });
}
