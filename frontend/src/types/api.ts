export interface Movie {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  isActive: boolean;
  rowVersion: string;
  showtimes?: Showtime[];
}
export interface Cinema {
  id: number;
  name: string;
  totalSeats: number;
  isActive: boolean;
}
export interface Showtime {
  id: number;
  cinemaId: number;
  movieId: number;
  showDateTime: string;
  ticketPrice: number;
  isLocked: boolean;
  isActive: boolean;
  rowVersion: string;
  cinema?: Cinema;
  movie?: Movie;
}
export interface SeatStatus {
  seatId: number;
  rowName: string;
  columnName: string;
  status: 'Available' | 'Booked';
  bookerPhone: string | null;
  rowVersion: string;
}
export interface Booking {
  id: string;
  customerId: string;
  bookingTime: string;
  status: BookingStatus;
  customer?: Customer;
  bookingItems?: BookingItem[];
}
export interface BookingItem {
  id: string;
  bookingId: string;
  showtimeId: number;
  seatId: number;
  price: number;
  itemStatus: ItemStatus;
  showtime?: Showtime;
  seat?: Seat;
}
export interface Customer {
  id: string;
  phoneNumber: string;
  email?: string;
  createdAt: string;
}
export interface Seat {
  id: number;
  cinemaId: number;
  rowName: string;
  columnName: string;
}
export interface User {
  id: number;
  username: string;
  role: UserRole;
  isActive: boolean;
}
export type BookingStatus = 'Completed' | 'Canceled';
export type ItemStatus = 'Active' | 'Canceled';
export type UserRole = 'Owner' | 'Staff';
export interface AuthResponse { accessToken: string; username: string; role: UserRole; expiresAt?: string; }
export interface CreateMovieCommand { title: string; startDate: string; endDate: string; basePrice: number; isActive: boolean; }
export interface UpdateMovieCommand extends CreateMovieCommand { id: number; }
export interface CreateShowtimeCommand { movieId: number; cinemaId: number; showDateTime: string; ticketPrice: number; isActive: boolean; }
export interface UpdateShowtimeCommand extends CreateShowtimeCommand { id: number; }
export interface CreateBookingCommand { showtimeId: number; phoneNumber: string; email?: string; seatIds: number[]; }
export interface DailyRevenue { date: string; revenue: number; }

export interface ActionLog {
  id: number;
  userId: number;
  actionType: string;
  entityName: string;
  entityId: number;
  timestamp: string;
  user?: User;
}

export interface LoginCommand {
  username: string;
  passwordHash: string;
}

export interface CreateUserCommand {
  username: string;
  passwordHash: string;
  role: UserRole;
}
