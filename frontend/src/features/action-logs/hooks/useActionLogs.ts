import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { ActionLog } from '@/types/api';

interface UseActionLogsOptions {
  enabled?: boolean;
}

export function useActionLogs(options?: UseActionLogsOptions) {
  return useQuery<ActionLog[]>({
    queryKey: ['actionLogs'],
    queryFn: async () => {
      const { data } = await apiClient.get<ActionLog[]>('/api/actionlogs');
      return data;
    },
    enabled: options?.enabled ?? true,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
