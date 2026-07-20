import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { ActionLog } from '@/types/api';

export function useActionLogs() {
  return useQuery<ActionLog[]>({
    queryKey: ['actionLogs'],
    queryFn: async () => {
      const { data } = await apiClient.get<ActionLog[]>('/api/actionlogs');
      return data;
    },
  });
}
