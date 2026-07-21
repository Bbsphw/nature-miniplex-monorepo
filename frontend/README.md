# Nature MiniPlex — Frontend Application

แอปพลิเคชันส่วนหน้า (Frontend) สำหรับระบบจองตั๋วภาพยนตร์ **Nature MiniPlex** พัฒนาขึ้นด้วยเทคโนโลยีเว็บสมัยใหม่ใน React/Next.js Ecosystem มุ่งเน้นประสิทธิภาพการทำงานสูง (High Performance), ความมั่นคงปลอดภัย (Security), และการส่งมอบประสบการณ์ผู้ใช้ที่ราบรื่น (Smooth Ticketing UX) ตามข้อกำหนด **Software Requirements Specification (SRS)**

## 🚀 Tech Stack Highlights

- **Framework:** Next.js 16 (App Router with React Server Components)
- **Core Library:** React 19 & TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4, PostCSS, Class Variance Authority (`cva`)
- **UI Components:** Radix UI Primitives (Accessible UI Base)
- **Server State Management:** TanStack Query v5 (React Query)
- **Client State Management:** Zustand v5 (with Atomic Selectors)
- **Form & Validation:** React Hook Form + Zod Schema Validation
- **HTTP Client:** Axios with Request/Response Interceptors
- **Icon Set:** Lucide React

## 📋 Key Features & SRS Compliance

1. **Dynamic Movie Schedules & Showtimes:** แสดงตารางฉายภาพยนตร์แบบไดนามิก รองรับการกรองตามโรงภาพยนตร์ วันที่ และรอบฉาย
2. **Interactive Seat Selection Grid:**
   - ผังที่นั่งแบบตอบสนองสูง (Real-time Feedback Grid)
   - **Max 4 Seats Limit:** จำกัดการเลือกที่นั่งสูงสุด 4 ที่นั่งต่อ 1 คำสั่งจองในระดับ Zustand Local State
   - **Cancellation Verification:** รองรับการยกเลิกที่นั่งโดยยืนยันด้วยเบอร์โทรศัพท์ 10 หลักของผู้จอง
   - **Privacy Masking:** แสดงเบอร์โทรศัพท์ของผู้จองในรูปแบบ Masked Phone Number (เช่น `089-***-5678`)
3. **Protected Admin Management Panel:**
   - ระบบจัดการข้อมูลภาพยนตร์, รอบฉาย และรายการจองสำหรับผู้ดูแลระบบ
   - มีระบบ Next.js Edge Middleware ควบคุมการเข้าถึง routes `/admin/*` ด้วย Secure Auth Cookie

## 🌐 Environment Variables Configuration

แอปพลิเคชันใช้ไฟล์ `.env.example` เป็นเทมเพลตมาตรฐานสำหรับระบบ และใช้ `.env.local` สำหรับการกำหนดค่าในเครื่องผู้พัฒนา:

| Variable Name | Description | Default Value | Example Usage |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL ของ ASP.NET Core Backend API | `http://localhost:5000` | Axios Client Base URL |
| `NEXT_PUBLIC_SITE_URL` | Base URL ของ Frontend Web App | `http://localhost:3000` | Canonical URL & Dynamic Links |
| `NEXT_PUBLIC_MAP_API_KEY` | Public API Key สำหรับบริการ Map/Location | `your_public_api_key` | Map Widget Integration |
| `NEXT_PUBLIC_ENABLE_POLLING` | เปิด/ปิด Real-time Seat Polling | `true` | Refetch Seat Status Interval |
| `NEXT_PUBLIC_SEAT_REFETCH_INTERVAL` | ความถี่ในการ Polling ผังที่นั่ง (ms) | `5000` | TanStack Query Query Option |

## 🛠️ Quick Start & Local Development

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x

### Environment Setup
คัดลอกไฟล์ `.env.example` เป็น `.env.local`:
```bash
cp .env.example .env.local
```
กำหนดค่าใน `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:5000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_ENABLE_POLLING="true"
NEXT_PUBLIC_SEAT_REFETCH_INTERVAL="5000"
```

### Command Scripts

```bash
# ติดตั้ง dependencies ทั้งหมด
pnpm install

# รัน Development Server (Port 3000)
pnpm run dev

# ตรวจสอบ TypeScript Types โดยไม่สร้าง build output
pnpm exec tsc --noEmit

# รัน ESLint เพื่อตรวจสอบ Code Quality
pnpm run lint

# Build แอปพลิเคชันสำหรับการใช้งาน Production
pnpm run build

# เริ่มทำงาน Production Server
pnpm run start
```

## 🏗️ Architecture & Detailed Docs

ศึกษาเพิ่มเติมเกี่ยวกับโครงสร้างสถาปัตยกรรมและมาตรฐานการพัฒนาได้ที่:
- [ARCHITECTURE.md](./ARCHITECTURE.md) — รายละเอียด Component Structure, Data Flow และ State Strategy
- [PERFORMANCE_&_STANDARDS.md](./PERFORMANCE_&_STANDARDS.md) — มาตรฐาน Performance, Core Web Vitals, Caching และ Linting Rules
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) — การจัดการ Client & Server State ในรายละเอียด
- [UI_SYSTEM.md](./UI_SYSTEM.md) — ระบบ Design Tokens และ Tailwind v4 Integration
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — มาตรฐานการเขียนโค้ด TypeScript Strictness & React 19 Rules
