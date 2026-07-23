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
  movieTitle?: string;
  cinemaName?: string;
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
  customerPhoneNumber?: string;
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
  seatName?: string;
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

export type BookingStatus = 'Completed' | 'Canceled';
export type ItemStatus = 'Active' | 'Canceled';
export type UserRole = 'SYSTEM_ADMIN' | 'CINEMA_MANAGER' | 'COUNTER_STAFF';

export interface Permission {
  id?: number;
  code: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  isSystemRole?: boolean;
  rolePermissions?: { permissionId: number; permission?: Permission }[];
  permissions?: Permission[];
  permissionIds?: number[];
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  roles?: string[];
  roleIds?: number[];
  cinemaId?: number;
  isActive: boolean;
  permissions?: string[];
  createdAt?: string;
}

export interface AuthResponse { 
  accessToken: string; 
  username: string; 
  role: UserRole; 
  permissions?: string[];
  expiresAt?: string; 
}

export interface UserProfile {
  id: number | string;
  username: string;
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  permissions: string[];
  createdAt?: string;
}

export interface UpdateProfileCommand {
  username?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

export interface CreateMovieCommand { title: string; startDate: string; endDate: string; basePrice: number; isActive: boolean; }
export interface UpdateMovieCommand extends CreateMovieCommand { id: number; }
export interface CreateShowtimeCommand { movieId: number; cinemaId: number; showDateTime: string; ticketPrice: number; isActive: boolean; }
export interface UpdateShowtimeCommand extends CreateShowtimeCommand { id: number; }
export interface CreateBookingCommand { showtimeId: number; phoneNumber: string; email?: string; seatIds: number[]; }
export interface DailyRevenue { date: string; revenue: number; }

export interface ActionLog {
  id: number;
  logLevel?: string;
  userId?: number;
  actorEmail?: string;
  actorRole?: string;
  ipAddress?: string;
  actionName?: string;
  httpMethod?: string;
  targetId?: string;
  targetType?: string;
  detailJson?: string;
  userAgent?: string;
  sessionId?: string;
  location?: string;
  statusCode?: number;
  timestamp: string;
  user?: User;

  // Legacy fallback fields
  actionType?: string;
  entityName?: string;
  entityId?: number;
}

export interface LoginCommand {
  username: string;
  passwordHash: string;
}

export interface CreateUserCommand {
  username: string;
  passwordHash: string;
  role?: UserRole;
  roleIds?: number[];
  cinemaId?: number;
}
