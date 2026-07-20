import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Movie } from '@/types/api';

export function useMovieById(id: number) {
  return useQuery<Movie>({
    queryKey: ['movie', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Movie>(`/api/movies/${id}`);
      return data;
    },
    enabled: id > 0,
  });
}
