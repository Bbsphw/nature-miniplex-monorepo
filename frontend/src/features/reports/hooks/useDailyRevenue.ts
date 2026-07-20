import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { DailyRevenue } from '@/types/api';

export function useDailyRevenue() {
  return useQuery<DailyRevenue[]>({
    queryKey: ['dailyRevenue'],
    queryFn: async () => {
      const { data } = await apiClient.get<DailyRevenue[]>('/api/reports/daily-revenue');
      return data;
    },
  });
}
