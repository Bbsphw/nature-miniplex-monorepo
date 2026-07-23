import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { User } from '@/types/api';

export function useUsers(options?: { enabled?: boolean }) {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/api/users');
      return data;
    },
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403 || error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });
}
