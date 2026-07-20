# State Management

We use a dual-store strategy to separate Server State from Client State.

## 1. Server State (React Query v5)
Used for all asynchronous data fetching from the backend API.
- **Why?** It handles caching, background updates, stale time, and deduplication out of the box.
- **Location:** `src/features/*/hooks/`
- **Real-time Feature:** The Booking Page (`/booking/[showtimeId]`) uses polling via `refetchInterval: 5000` inside `useShowtimeSeats`. This ensures users see seats being booked by others in near real-time without needing WebSockets.

## 2. Client State (Zustand)
Used for synchronous, global UI state that doesn't need to persist on the server.
- **Auth Store (`useAuthStore`):** Stores JWT, Username, and Role. Uses `persist` middleware to save to `localStorage`.
- **Booking Store (`useBookingStore`):** Stores transient data during the booking flow (e.g., `selectedSeats`). This is kept in-memory and cleared when a booking is successful or the user leaves the flow.

## 3. Local State (React `useState`)
Used for purely presentational state:
- Dialog open/close toggles.
- Controlled form inputs (before submission).
- Simple UI interactions (e.g., mobile menu toggle).
