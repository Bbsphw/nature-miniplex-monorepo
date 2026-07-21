# Nature MiniPlex — State Management Architecture

เอกสารฉบับนี้อธิบายกลยุทธ์การจัดการ State แบบ **Dual-Store Architecture** สำหรับแอปพลิเคชัน Nature MiniPlex โดยแยกแยะระหว่าง **Client State (Local UI)** และ **Server State (API Data)** เพื่อให้ตรงตามข้อกำหนด SRS ในเรื่องการเลือกที่นั่งที่รวดเร็วและไม่มีอาการสะดุด (Zero-Lag UI)

## 1. Dual-Store Strategy Overview

| Layer | Technology | Primary Scope | Persistence |
| :--- | :--- | :--- | :--- |
| **Client Local State** | Zustand v5 | Transient Seat Selection, Modals, User Session | Cookie / In-Memory |
| **Server State** | TanStack Query v5 | Movies, Showtimes, Seat Status Grid, Bookings | Cached in Memory with TTL |
| **Component State** | React `useState` | Local Form Inputs, Dialog Toggles, Hover Effects | Unmounted on Navigation |

## 2. Client State Architecture (Zustand)

### A. Booking Store (`useBookingStore`)
- **วัตถุประสงค์:** จัดเก็บที่นั่งที่ผู้ใช้กำลังคลิกเลือกในผังตั๋วภาพยนตร์แบบเรียลไทม์
- **SRS Max 4 Seats Rule:** บังคับใช้เงื่อนไขจองได้ไม่เกิน 4 ที่นั่งในระดับ Action:
  ```typescript
  toggleSeat: (seatId: number) => set((state) => {
    if (state.selectedSeats.includes(seatId)) {
      return { selectedSeats: state.selectedSeats.filter(id => id !== seatId) };
    }
    if (state.selectedSeats.length >= 4) return state;
    return { selectedSeats: [...state.selectedSeats, seatId] };
  });
  ```
- **Atomic Selectors:** ป้องกันปัญหากรอบผังที่นั่ง Re-render ทั้งหมดเวลาเลือกที่นั่งเพิ่ม:
  ```typescript
  export const useSelectedSeatIds = () => useBookingStore((state) => state.selectedSeats);
  export const useIsSeatSelected = (seatId: number) =>
    useBookingStore((state) => state.selectedSeats.includes(seatId));
  ```

### B. Auth Store (`useAuthStore`)
- **วัตถุประสงค์:** เก็บบันทึก JWT Bearer Token และข้อมูลผู้ใช้สำหรับ Admin Panel
- **Cookie Synchronization:** ซิงค์ข้อมูล `admin_token` ลงใน Cookie เพื่อเปิดทางให้ Next.js Edge Middleware ทำการสแกนสิทธิ์เข้าถึงหน้า `/admin/*` ได้ตั้งแต่ชั้น Server

## 3. Server State Architecture (TanStack Query v5)

- **Domain-Based Custom Hooks:** แยก Hooks สำหรับยิง API ออกตาม Feature Domain ใน `src/features/[domain]/hooks/`
- **Automatic Invalidation:** เมื่อคำสั่งจองสำเร็จ `useCreateBooking` จะสั่ง `invalidateQueries(['showtime-seats'])` เพื่อให้ผังที่นั่งอัปเดตสถานะเป็น Booked ทันที
- **Stale Time Strategy:**
  - รายการภาพยนตร์และโรงภาพยนตร์: `staleTime: 1000 * 60 * 5` (5 นาที)
  - ผังที่นั่งรอบฉาย (`showtime-seats`): `staleTime: 0` เพื่อรับประกันความสดใหม่ของที่นั่งว่าง
