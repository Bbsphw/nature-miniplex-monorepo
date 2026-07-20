import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Movie } from '@/types/api';

export function useMovies(onlyActive = true) {
  return useQuery<Movie[]>({
    queryKey: ['movies', onlyActive],
    queryFn: async () => {
      const { data } = await apiClient.get<Movie[]>('/api/movies', { params: { onlyActive } });
      return data;
    },
  });
}
