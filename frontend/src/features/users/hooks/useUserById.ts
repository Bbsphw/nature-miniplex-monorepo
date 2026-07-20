import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { User } from '@/types/api';

export function useUserById(id: number) {
  return useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data } = await apiClient.get<User>(`/api/users/${id}`);
      return data;
    },
    enabled: id > 0,
  });
}
