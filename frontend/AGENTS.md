---
description: "Frontend agent customization for Next.js 16 with React, TypeScript, Zustand, and TanStack Query. Enforces UI_SYSTEM rules, toast/modal mandate, strict UI RBAC (hide elements, not disable), and Performance standards."
tech_stack: "Next.js 16, React 19, TypeScript 5+, Zustand, TanStack Query v5, Tailwind CSS v4, Radix UI"
---

# 💻 Frontend Agent Customization — Next.js 16 App Router

**See also:** [Root AGENTS.md](../AGENTS.md) for global monorepo rules.

---

## 🎯 Primary Responsibilities

When working in `/frontend/`, agents MUST enforce:

1. ✅ **UI System Compliance** (mandatory `frontend/UI_SYSTEM.md` rules)
2. ✅ **Toast & Confirm Modal Mandate** (ban native `alert()` / `confirm()` completely)
3. ✅ **Strict UI RBAC** (HIDE DOM elements completely, NOT just disable them)
4. ✅ **Feature-Based Architecture** (organized by domain, not by component type)
5. ✅ **Strict TypeScript** (NO `any` types, full type safety)
6. ✅ **Tech-Thai Documentation** (comments in Thai with English technical terms)

---

## ⚠️ CRITICAL: UI_SYSTEM Enforcement Rules

### Rule 1: Ban Native Alerts & Confirms COMPLETELY

❌ **FORBIDDEN Patterns:**
```typescript
// ❌ Native alert (BANNED FOREVER)
if (error) alert("ข้อมูลผิดพลาด");

// ❌ Native confirm (BANNED FOREVER)
if (confirm("ยืนยันการลบ?")) { /* ... */ }

// ❌ window.prompt (BANNED FOREVER)
const value = prompt("กรอกค่า:");

// ❌ Plain console.error for user-facing info (BANNED)
console.error("กรุณาเลือกที่นั่ง");
```

✅ **REQUIRED Patterns:**
```typescript
import { useToastStore } from "@/store/useToastStore";
import { useConfirmStore } from "@/store/useConfirmStore";

// ✅ Use Toast for notifications
const toast = useToastStore();
if (error) {
    toast.addToast({
        type: "error",
        message: "ข้อมูลผิดพลาด",
        duration: 5000
    });
}

// ✅ Use Confirm Modal for confirmations
const confirm = useConfirmStore();
const handleDelete = () => {
    confirm.openConfirm({
        title: "ยืนยันการลบ",
        description: "คุณแน่ใจหรือไม่?",
        onConfirm: async () => {
            await deleteItem();
        }
    });
};
```

### Rule 2: UI_SYSTEM Design Token Compliance

**Mandatory Reference:** `frontend/UI_SYSTEM.md` (Section 1-4)

- ✅ Use **Tailwind CSS v4 Theme Variables** from `src/app/globals.css`
- ✅ Use **Radix UI Primitives** (`Dialog`, `Select`, `Label`) for accessible components
- ✅ Apply **Premium Dark Cinema Aesthetics** (Surface colors: `#0A0A0F`, Brand Red: `#E31837`)
- ✅ Use custom utilities: `.glass`, `.hide-scrollbar`, `.animate-shake`

```css
/* ✅ CORRECT: Use CSS variables from @theme */
<div className="bg-[var(--color-surface-base)] border-[var(--color-surface-border)]">
    Premium Dark Background with Border
</div>

/* ❌ WRONG: Hardcoded hex values */
<div className="bg-[#0A0A0F] border-[#2A2A3E]">
    This breaks consistency
</div>
```

### Rule 3: Component Radix UI Accessibility (a11y)

**Pattern Example:**
```typescript
// ✅ SeatButton with proper accessibility
interface SeatButtonProps {
    seatId: number;
    isAvailable: boolean;
    isSelected: boolean;
    onSelect: (seatId: number) => void;
}

export function SeatButton({ seatId, isAvailable, isSelected, onSelect }: SeatButtonProps) {
    const label = isAvailable 
        ? `ที่นั่ง ${seatId} ว่าง` 
        : `ที่นั่ง ${seatId} จองแล้ว`;
    
    return (
        <button
            aria-pressed={isSelected}
            aria-label={label}
            onClick={() => isAvailable && onSelect(seatId)}
            disabled={!isAvailable}
            className={/* Tailwind classes */}
        >
            {seatId}
        </button>
    );
}
```

---

## 🛡️ Strict UI RBAC: HIDE Elements, NOT Disable Them

### CRITICAL Distinction

| Pattern | ❌ WRONG | ✅ CORRECT |
| --- | --- | --- |
| **User sees button disabled** | `<button disabled>` (user knows it exists) | User doesn't see element at all |
| **Overflow attack vector** | Hacker inspects DOM, sees disabled buttons | No DOM element = no attack surface |
| **Principle of Least Privilege** | Tell user what they can't do | Only show what they CAN do |

### RBAC Implementation Pattern

```typescript
// ✅ CORRECT: Conditional rendering based on permissions
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export function AdminDashboard() {
    const { user } = useCurrentUser();
    
    // Fetch user permissions from API or JWT claims
    const canManageMovies = user?.permissions.includes("movie:write");
    const canManageShowtimes = user?.permissions.includes("showtime:write");
    
    return (
        <div className="admin-panel">
            {/* Only render if user has explicit permission */}
            {canManageMovies && (
                <section>
                    <h2>ระบบจัดการภาพยนตร์</h2>
                    <MovieManagementPanel />
                </section>
            )}
            
            {canManageShowtimes && (
                <section>
                    <h2>ระบบจัดการรอบฉาย</h2>
                    <ShowtimeManagementPanel />
                </section>
            )}
            
            {!canManageMovies && !canManageShowtimes && (
                <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
            )}
        </div>
    );
}
```

### Authorization Hook Pattern

```typescript
// ✅ Custom hook for permission checking
export function usePermission(requiredPermission: string) {
    const { user } = useCurrentUser();
    return user?.permissions.includes(requiredPermission) ?? false;
}

// Usage in components
export function DeleteMovieButton({ movieId }: { movieId: string }) {
    const canDelete = usePermission("movie:delete");
    
    // DOM element doesn't exist if permission denied
    if (!canDelete) return null;
    
    return (
        <button onClick={() => handleDelete(movieId)}>
            ลบภาพยนตร์
        </button>
    );
}
```

### Role-Based Layout Wrapper

```typescript
// ✅ Wrapper component for role-gated sections
interface RoleGateProps {
    allowedRoles: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback }: RoleGateProps) {
    const { user } = useCurrentUser();
    const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
    
    if (!hasAccess) {
        return fallback ? <>{fallback}</> : null;
    }
    
    return <>{children}</>;
}

// Usage
<RoleGate allowedRoles={["SYSTEM_ADMIN", "CINEMA_MANAGER"]}>
    <AdminPanel />
</RoleGate>
```

---

## 🎨 Next.js App Router & Rendering Strategy

### File Structure (Feature-Based Architecture)

```
frontend/src/
├── app/                     # ← Page Routes & Layouts
│   ├── layout.tsx          # ← Root layout (Server Component)
│   ├── page.tsx            # ← Public homepage
│   ├── (public)/            # ← Public routes group
│   │   ├── movies/          # ← Movie listing
│   │   ├── booking/         # ← Booking flow
│   │   └── confirmation/    # ← Booking confirmation
│   └── admin/               # ← Admin routes (RoleGate applied)
│       ├── layout.tsx       # ← Admin layout (includes auth check)
│       ├── page.tsx         # ← Admin dashboard
│       ├── movies/          # ← Movie management
│       └── showtimes/       # ← Showtime management
│
├── components/              # ← Reusable UI Components (by domain)
│   ├── booking/
│   │   ├── SeatGrid.tsx
│   │   ├── SeatButton.tsx
│   │   └── BookingForm.tsx
│   ├── movies/
│   │   ├── MovieCard.tsx
│   │   └── MovieCardSkeleton.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/                  # ← Radix UI Primitives
│       ├── Dialog.tsx
│       ├── Button.tsx
│       └── Input.tsx
│
├── features/                # ← Custom React Query Hooks (by domain)
│   ├── bookings/
│   │   ├── hooks/
│   │   │   ├── useCreateBooking.ts   # ← Mutation hook
│   │   │   ├── useGetShowtimeSeats.ts # ← Query hook
│   │   │   └── useCancelBooking.ts   # ← Mutation hook
│   │   └── types/
│   │       └── booking.types.ts
│   ├── movies/
│   │   ├── hooks/
│   │   │   └── useGetMovies.ts
│   │   └── types/
│   │       └── movie.types.ts
│   └── auth/
│       ├── hooks/
│       │   └── useCurrentUser.ts
│       └── types/
│           └── auth.types.ts
│
├── store/                   # ← Zustand Client State Stores
│   ├── useBookingStore.ts   # ← Selected seats state
│   ├── useToastStore.ts     # ← Toast notifications
│   ├── useConfirmStore.ts   # ← Confirm modal state
│   └── useAuthStore.ts      # ← Auth session state
│
├── lib/                     # ← Infrastructure Configuration
│   ├── axios.ts             # ← Axios client & interceptors
│   ├── queryClient.ts       # ← TanStack Query config
│   └── constants.ts         # ← App-wide constants
│
└── types/                   # ← Global TypeScript Types
    ├── api.types.ts         # ← API response/request DTOs
    ├── domain.types.ts      # ← Domain models
    └── common.types.ts      # ← Utility types
```

### Server Components vs Client Components

**Rule of Thumb:**
- ✅ **Server Components (default):** Layout, static pages, data fetching (no interactivity)
- ✅ **Client Components (`'use client'`):** Interactive forms, state management, hooks

```typescript
// ✅ Server Component (default)
// app/layout.tsx
export default function RootLayout({ children }) {
    return (
        <html>
            <head>
                {/* metadata, links */}
            </head>
            <body>
                {/* Static header, footer */}
                {children}
            </body>
        </html>
    );
}

// ✅ Client Component (when interactivity needed)
// components/booking/SeatGrid.tsx
'use client';

import { useState } from 'react';
import { useBookingStore } from '@/store/useBookingStore';

export function SeatGrid({ showtimeId }: { showtimeId: string }) {
    const { selectedSeats, toggleSeat } = useBookingStore();
    
    const handleSeatClick = (seatId: number) => {
        toggleSeat(seatId);
    };
    
    return (
        // ← JSX with interactivity
    );
}
```

---

## 📊 State Management: Zustand vs React Query

### Zustand: Client/Transient UI State

**Use Zustand for:**
- ✅ Selected seats during booking flow (transient UI state)
- ✅ Toast notifications (temporary, UI-only)
- ✅ Confirm modal state (temporary, UI-only)
- ✅ Auth session (cookie-based, persisted)

**Pattern:**
```typescript
// ✅ store/useBookingStore.ts
import { create } from 'zustand';

interface BookingStore {
    selectedSeats: number[];
    maxSeats: number;
    toggleSeat: (seatId: number) => void;
    clearSelection: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
    selectedSeats: [],
    maxSeats: 4, // SRS Rule: Max 4 seats per booking
    
    toggleSeat: (seatId) => set((state) => {
        const isSelected = state.selectedSeats.includes(seatId);
        
        if (isSelected) {
            return {
                selectedSeats: state.selectedSeats.filter(id => id !== seatId)
            };
        }
        
        // ตรวจสอบว่าไม่เกิน 4 ที่นั่ง (Check max seats SRS rule)
        if (state.selectedSeats.length >= state.maxSeats) {
            return state; // No change, max reached
        }
        
        return {
            selectedSeats: [...state.selectedSeats, seatId]
        };
    }),
    
    clearSelection: () => set({ selectedSeats: [] })
}));

// ✅ Atomic selector (only re-render when specific seat changes)
export const useIsSeatSelected = (seatId: number) =>
    useBookingStore((state) => state.selectedSeats.includes(seatId));
```

### React Query: Server State & Data Fetching

**Use React Query for:**
- ✅ Movies list (server-side, cacheable)
- ✅ Showtime seats (server-side, stale-time managed)
- ✅ Booking mutations (CREATE, UPDATE, DELETE)
- ✅ Booking history (server-side data)

**Pattern:**
```typescript
// ✅ features/bookings/hooks/useGetShowtimeSeats.ts
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface ShowtimeSeatsResponse {
    showtimeId: string;
    seats: Seat[];
    totalSeats: number;
}

export function useGetShowtimeSeats(showtimeId: string) {
    return useQuery({
        queryKey: ['showtime-seats', showtimeId],
        queryFn: async () => {
            const { data } = await axiosInstance.get<ShowtimeSeatsResponse>(
                `/api/showtimes/${showtimeId}/seats`
            );
            return data;
        },
        staleTime: 30000, // ข้อมูลสดใหม่ 30 วินาที (Fresh for 30s)
        gcTime: 60000, // เก็บในแคชเป็นเวลา 1 นาที (Cache for 1 min)
        enabled: !!showtimeId // ไม่ query หากไม่มี showtimeId
    });
}

// ✅ features/bookings/hooks/useCreateBooking.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateBooking() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (payload: CreateBookingPayload) => {
            const { data } = await axiosInstance.post(
                '/api/bookings',
                payload
            );
            return data;
        },
        onSuccess: (data) => {
            // หลังจากบันทึกสำเร็จ ให้ refresh ผังที่นั่ง (Invalidate seat grid on success)
            queryClient.invalidateQueries({
                queryKey: ['showtime-seats', data.showtimeId]
            });
            
            // ล้างการเลือกที่นั่ง (Clear selected seats)
            useBookingStore.setState({ selectedSeats: [] });
        },
        onError: (error) => {
            // ⚠️ Toast notification handled by axios interceptor
            // OR handle here for mutation-specific errors
        }
    });
}
```

---

## 📝 Toast & Confirm Modal Implementation

### Toast Store Pattern

```typescript
// ✅ store/useToastStore.ts
import { create } from 'zustand';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number; // ms, 0 = manual dismiss
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    
    addToast: (toast) => set((state) => {
        const id = `toast-${Date.now()}`;
        const newToast = { ...toast, id };
        
        // Auto-remove after duration (if specified)
        if (toast.duration && toast.duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter(t => t.id !== id)
                }));
            }, toast.duration);
        }
        
        return { toasts: [...state.toasts, newToast] };
    }),
    
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
    }))
}));
```

### Confirm Modal Store Pattern

```typescript
// ✅ store/useConfirmStore.ts
interface ConfirmDialog {
    id: string;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
}

interface ConfirmStore {
    dialogs: ConfirmDialog[];
    openConfirm: (dialog: Omit<ConfirmDialog, 'id'>) => void;
    closeConfirm: (id: string) => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
    dialogs: [],
    
    openConfirm: (dialog) => set((state) => ({
        dialogs: [...state.dialogs, { ...dialog, id: `confirm-${Date.now()}` }]
    })),
    
    closeConfirm: (id) => set((state) => ({
        dialogs: state.dialogs.filter(d => d.id !== id)
    }))
}));
```

### ToastContainer Component

```typescript
// ✅ components/layout/ToastContainer.tsx
'use client';

import { useToastStore } from '@/store/useToastStore';
import { Toast } from '@/components/ui/Toast';

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();
    
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    type={toast.type}
                    message={toast.message}
                    onDismiss={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}
```

---

## ✅ Code Review Checklist

When reviewing Frontend PRs, verify:

- [ ] **No Native Alerts:** No `alert()`, `confirm()`, or `prompt()` in code
- [ ] **Toast/Modal Usage:** User feedback uses `useToastStore` or `useConfirmStore`
- [ ] **UI RBAC:** Elements are HIDDEN (conditional render), not just disabled
- [ ] **Permissions Check:** Uses `usePermission()` hook or `RoleGate` component
- [ ] **TypeScript Strict:** No `any` types, full type safety in production code
- [ ] **Zustand vs React Query:** Client state (Zustand) separate from server state (React Query)
- [ ] **Tech-Thai Comments:** Code comments in Thai with English technical terms
- [ ] **Accessibility:** Components use `aria-*` attributes, Radix UI primitives respected
- [ ] **UI System Compliance:** Uses Tailwind CSS variables, not hardcoded colors
- [ ] **Performance:** Optimistic updates, query invalidation, stale-time appropriate

---

## 🔗 Reference Documentation

- **Reference:** `frontend/UI_SYSTEM.md` (Design tokens, components, accessibility)
- **Reference:** `frontend/ARCHITECTURE.md` (Next.js App Router, feature-based structure)
- **Reference:** `frontend/STATE_MANAGEMENT.md` (Zustand vs React Query patterns)
- **Reference:** `frontend/PERFORMANCE_&_STANDARDS.md` (Performance optimization, SEO)
- **Reference:** `frontend/CODING_STANDARDS.md` (TypeScript conventions, naming)

---

**Last Updated:** 2026-07-23  
**Status:** Active & Standardized

