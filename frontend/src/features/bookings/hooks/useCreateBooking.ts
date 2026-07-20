import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { CreateBookingCommand } from '@/types/api';

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, CreateBookingCommand>({
    mutationFn: async (command) => {
      const { data } = await apiClient.post<string>('/api/bookings', command);
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['showtime-seats', variables.showtimeId] });
    },
  });
}
