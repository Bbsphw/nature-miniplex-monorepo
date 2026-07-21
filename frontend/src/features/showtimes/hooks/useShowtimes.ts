import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Showtime } from '@/types/api';

interface ShowtimeFilters {
  movieId?: number;
  cinemaId?: number;
  date?: string;
  includeInactive?: boolean;
}

export function useShowtimes(filters: ShowtimeFilters) {
  return useQuery<Showtime[]>({
    queryKey: ['showtimes', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<Showtime[]>('/api/showtimes', {
        params: {
          includeInactive: false,
          ...filters,
        },
      });
      return data;
    },
    enabled: !!(filters.movieId || filters.cinemaId || filters.date),
  });
}
