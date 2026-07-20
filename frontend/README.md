# Nature MiniPlex — Frontend

Frontend application for the **Nature MiniPlex** cinema ticketing system.
Built with modern web technologies focusing on performance, UX, and type safety.

## 🚀 Tech Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, CSS Variables
- **UI Components:** Radix UI (shadcn inspired)
- **State Management (Server):** [React Query v5](https://tanstack.com/query)
- **State Management (Client):** [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons:** Lucide React
- **HTTP Client:** Axios (with Interceptors)

## 📦 Project Structure
- `src/app/`: Next.js App Router pages and layouts
  - `/`: Public Home (Now Showing)
  - `/movies/[id]`: Movie Details & Showtime Selection
  - `/booking/[showtimeId]`: Interactive Seat Selection
  - `/booking-confirmation/[bookingId]`: E-Ticket
  - `/admin/*`: Protected Admin Panel routes
- `src/components/`: Reusable UI components (UI primitives, Movies, Booking, Layout)
- `src/features/`: React Query hooks separated by domains (movies, showtimes, bookings, cinemas)
- `src/store/`: Zustand global stores (Auth, Booking)
- `src/types/`: TypeScript API models and system types
- `src/lib/`: Utilities, Axios client, QueryClient configuration

## 🛠️ Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (Port 3000)
pnpm run dev

# Run TypeScript type check
pnpm exec tsc --noEmit

# Run Linter
pnpm run lint

# Build for production
pnpm run build
```

## 📚 Documentation
For detailed information on the frontend architecture and implementation, refer to:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - High-level system architecture and data flow.
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - Client & Server state strategy.
- [UI_SYSTEM.md](./UI_SYSTEM.md) - Design tokens, Tailwind v4, and Radix UI.
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Best practices and conventions.
