import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Customer } from '@/types/api';

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await apiClient.get<Customer[]>('/api/customers');
      return data;
    },
  });
}
