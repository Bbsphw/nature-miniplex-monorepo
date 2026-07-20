# Frontend Architecture

This document describes the architectural decisions for the Nature MiniPlex Frontend.

## 1. Next.js App Router (React Server Components)
The application heavily utilizes Next.js App Router (`src/app`).
- **Server Components (Default):** Used for static layouts (like `Navbar` wrapper, `Footer`) and non-interactive data fetching (e.g., initial movie list load in `page.tsx`).
- **Client Components (`'use client'`):** Used where interactivity, browser APIs, or React hooks (`useState`, `useEffect`) are required (e.g., Seat Selection, Forms, Admin Panels).

## 2. Directory Structure Strategy
We use a **Feature-Sliced Design** approach for complex domains:
- `src/features/[domain]/hooks/`: Encapsulates all API calls inside custom React Query hooks. This keeps the UI components clean and independent of data-fetching logic.
  - Domains: `movies`, `cinemas`, `showtimes`, `bookings`
- `src/components/[domain]/`: Specific UI components related to a domain.
- `src/components/ui/`: Dumb/Primitive components (Buttons, Inputs, Dialogs) that rely on Radix UI.

## 3. Data Flow
1. **User Action:** User clicks "Book Ticket".
2. **Client State:** `useBookingStore` (Zustand) updates the selected seats array in memory.
3. **Mutation:** Form submission triggers `useCreateBooking` (React Query Mutation).
4. **API Request:** Axios instance intercepts the request (injects JWT if admin) and sends it to the .NET Backend.
5. **Invalidation:** On success, React Query invalidates the `['showtime-seats']` query, causing an automatic refetch of the seat grid.

## 4. Authentication Flow (Admin)
- Admins login via `/admin/login`.
- JWT Token is stored securely in `localStorage` via Zustand Persist (`auth-storage`).
- Axios Interceptor reads this token and injects `Authorization: Bearer <token>` into every request.
- If the backend returns `401 Unauthorized`, the interceptor automatically redirects the user to `/admin/login`.
