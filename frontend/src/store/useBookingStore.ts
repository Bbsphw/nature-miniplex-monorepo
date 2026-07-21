import { create } from 'zustand';
import { toast } from '@/store/useToastStore';

interface BookingState {
  isProcessing?: boolean;
  failedSeatId?: number | null;
  selectedSeats: number[];
  toggleSeat: (seatId: number) => void;
  clearSeats: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedSeats: [],
  toggleSeat: (seatId: number) =>
    set((state) => {
      if (state.selectedSeats.includes(seatId)) {
        return { selectedSeats: state.selectedSeats.filter((id) => id !== seatId) };
      }
      // SRS Requirement: Each booking can select 1-4 seats maximum
      if (state.selectedSeats.length >= 4) {
        toast.error('เลือกได้สูงสุด 4 ที่นั่งต่อการจอง');
        return state;
      }
      return { selectedSeats: [...state.selectedSeats, seatId] };
    }),
  clearSeats: () => set({ selectedSeats: [] }),
}));

// Atomic Selectors to optimize component rendering
export const useSelectedSeatIds = () => useBookingStore((state) => state.selectedSeats);
export const useIsSeatSelected = (seatId: number) =>
  useBookingStore((state) => state.selectedSeats.includes(seatId));
export const useBookingActions = () =>
  useBookingStore((state) => ({ toggleSeat: state.toggleSeat, clearSeats: state.clearSeats }));

