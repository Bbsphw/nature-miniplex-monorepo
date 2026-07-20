# แนวทางการจัดการ State & Data Fetching (State Management & Data Fetching Guidelines)

[⬅️ กลับหน้า Frontend](./README.md) | [🏠 กลับสู่หน้าหลัก](../README.md)
เอกสารฉบับนี้ร่างขอบเขตแนวทาง (Approach) ในการบริหารจัดการ State ในฝั่ง Frontend ของโปรเจกต์ Nature MiniPlex เรามีเป้าหมายที่จะเก็บ Localize State ไว้ให้อยู่ในระดับ Component ให้มากที่สุด และหันไปพึ่งพาเทคนิค Server-State Caching เมื่อจำเป็นต้องดึงข้อมูล

---

## 1. ข้อมูลระดับ Server (Server State / Data Fetching)

แทนที่จะจัดการกับหน้าจอ Loading หรือ Error States ด้วย Global Stores (เช่น Redux) แบบแมนวล เราเลือกที่จะใช้ Libraries เฉพาะทาง หรือฟีเจอร์ Data Fetching ที่มาพร้อม Next.js 

### 1.1 React Server Components (RSC) ใน Next.js App Router
สำหรับข้อมูลประเภท Static หรือข้อมูลที่ไม่ค่อยเปลี่ยน (เช่น รายละเอียดเกี่ยวกับภาพยนตร์ - Movie details, การตั้งค่าทั่วไป) ให้ใช้ **React Server Components** ดึงข้อมูลฝั่ง Server โดยตรง

**ตัวอย่างการดึงข้อมูลบน Server Component:**
```tsx
// src/app/movies/[id]/page.tsx
import { notFound } from 'next/navigation';

async function getMovie(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies/${id}`, {
    next: { revalidate: 60 } // Cache ข้อมูล 60 วินาที
  });
  if (!res.ok) return undefined;
  return res.json();
}

export default async function MoviePage({ params }: { params: { id: string } }) {
  const movie = await getMovie(params.id);
  
  if (!movie) {
    notFound();
  }

  return (
    <div>
      <h1>{movie.title}</h1>
      <p>{movie.synopsis}</p>
    </div>
  );
}
```

### 1.2 Client-side Data Fetching (React Query)
สำหรับข้อมูลประเภทที่มีการเปลี่ยนแปลงอย่างรวดเร็ว (Highly dynamic data) เช่น สถานะของที่นั่งว่าง, ข้อมูลโปรไฟล์ผู้ใช้งาน แนะนำให้ใช้ **React Query (@tanstack/react-query)** เพื่อดึงฝั่ง Client และจัดการ Caching

**ตัวอย่างการใช้ React Query:**
```tsx
// src/features/booking/hooks/useSeats.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useSeats(showtimeId: string) {
  return useQuery({
    queryKey: ['seats', showtimeId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/showtimes/${showtimeId}/seats`);
      return data;
    },
    refetchInterval: 5000, // อัปเดตที่นั่งทุกๆ 5 วินาที
  });
}
```

---

## 2. ข้อมูลระดับ Client (Client State / Global UI State)

สำหรับ State ที่จำเป็นต้องถูกแชร์ข้ามไปมาระหว่างหลายๆ Components (เช่น ข้อมูล Auth Session, หรือสถานะของ Booking Flow ล่าสุด) เราจะเลือกใช้ **Zustand** เนื่องจากมีความเบาและไม่ต้องหุ้มด้วย Context Provider

### การใช้งาน Zustand
พยายามออกแบบ Stores ให้มีขนาดเล็กและเฉพาะเจาะจง หลีกเลี่ยงการนำ API responses ก้อนใหญ่ๆ ไปใส่ไว้ใน Zustand

**ตัวอย่างการสร้าง Store เล็กๆ ด้วย Zustand:**
```tsx
// src/store/useBookingStore.ts
import { create } from 'zustand';

interface BookingState {
  selectedSeats: string[];
  toggleSeat: (seatId: string) => void;
  clearSeats: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedSeats: [],
  toggleSeat: (seatId) => set((state) => ({
    selectedSeats: state.selectedSeats.includes(seatId)
      ? state.selectedSeats.filter(id => id !== seatId)
      : [...state.selectedSeats, seatId]
  })),
  clearSeats: () => set({ selectedSeats: [] })
}));
```

**การเรียกใช้งานใน Component:**
```tsx
import { useBookingStore } from '@/store/useBookingStore';

function SeatGrid() {
  // ดึงเฉพาะ state ที่จำเป็นเพื่อลด unnecessary re-renders
  const selectedSeats = useBookingStore(state => state.selectedSeats);
  const toggleSeat = useBookingStore(state => state.toggleSeat);

  return (
    // ... UI Rendering
  );
}
```

---

## 3. ข้อมูลระดับ Component (Local Component State)

- ใช้งาน `useState` หรือ `useReducer` ปกติ สำหรับ State ที่ส่งผลกระทบกับ Component เดียว หรือส่งไปยัง Children Components เท่านั้น (เช่น สถานะเปิด/ปิดของ Dropdown, ค่าของ Input Forms)
- **กฎเหล็ก**: ให้พิจารณาใช้วิธีแนบ Props ส่งต่อไปยัง Children เสมอ แทนที่จะพยายามดึง Global state มาใช้ตั้งแต่เริ่มต้น (Premature optimization)

---

## สรุปการใช้งาน (Summary Flow)
1. **Server Components (fetch)**: ใช้ดึงข้อมูลหลักเบื้องต้น (Primary data fetching) ที่เป็น Static หรือ SEO-critical
2. **React Query**: ดึงข้อมูลอัปเดตต่อเนื่อง (Dynamic polling) และทำ Client-side API caching
3. **Zustand**: ใช้จัดการ Global UI state ของฝั่ง Client (เช่น ตะกร้าสินค้า, เซสชันการจอง)
4. **useState/useReducer**: ใช้จัดการ Local component UI state (Dropdown, Modals, Forms)
