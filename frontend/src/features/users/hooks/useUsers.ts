import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { User } from '@/types/api';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/api/users');
      return data;
    },
  });
}
