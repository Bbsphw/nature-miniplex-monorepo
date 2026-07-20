import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Cinema } from '@/types/api';

export function useCinemas() {
  return useQuery<Cinema[]>({
    queryKey: ['cinemas'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cinema[]>('/api/cinemas');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
