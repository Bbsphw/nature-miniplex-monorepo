import { create } from 'zustand';

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
      if (state.selectedSeats.length >= 4) return state;
      return { selectedSeats: [...state.selectedSeats, seatId] };
    }),
  clearSeats: () => set({ selectedSeats: [] }),
}));
