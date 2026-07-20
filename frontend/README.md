# Nature MiniPlex - Frontend

[⬅️ กลับสู่หน้าแรก (Back to Root)](../README.md)
Directory นี้ใช้จัดเก็บส่วน Web Application ของผู้ใช้งานสำหรับระบบ Nature MiniPlex สร้างขึ้นด้วย [Next.js 14+](https://nextjs.org/) (โดยใช้ App Router) และ React 18 ภายใต้สถาปัตยกรรมแบบ Component-based

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

### สิ่งที่ต้องมี (Prerequisites)
- Node.js v20+
- pnpm (v9+) แนะนำให้ใช้งานแทน npm หรือ yarn เพื่อความรวดเร็วและลดปัญหา Dependency collision

### การติดตั้ง (Installation)
ระบบเราใช้ `pnpm` เป็น Package Manager หลัก ทำการติดตั้ง Dependencies โดยใช้คำสั่ง:
```bash
pnpm install
```

### การตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables & Secrets)
ระบบมีการใช้ไฟล์ `.env` ในการจัดการ Configuration ที่อาจเปลี่ยนไปตาม Environment
1. คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local` 
```bash
cp .env.example .env.local
```
2. ปรับแต่งตัวแปรใน `.env.local` ในเครื่องให้ถูกต้อง เช่น `NEXT_PUBLIC_API_URL` หรือ Secrets สำหรับ Auth
*(คำเตือน: กรุณาตรวจสอบให้แน่ใจว่าไฟล์ `.env.local` จะไม่ถูก Commit เข้า Source Control ซึ่งระบบได้ทำการ Ignore ไว้แล้ว)*

### การรันระบบในเครื่อง (Running Locally)
เมื่อต้องการเริ่มรัน Development Server:
```bash
pnpm dev
```
เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000) เพื่อดูผลลัพธ์ของแอปพลิเคชัน

---

## 🏗 โครงสร้างโปรเจกต์ (Project Structure - Next.js App Router)

เรายึดโครงสร้างแบบ **Feature-based + Atomic Design** เพื่อให้ง่ายต่อการค้นหาและ Scaling โค้ด:

```text
frontend/
├── src/
│   ├── app/                 # Next.js App Router (Pages, Layouts, API Routes)
│   ├── components/          # React Components ที่แชร์กัน (แบ่งเป็น UI, Layouts, Forms)
│   ├── features/            # โค้ดที่จัดกลุ่มตามฟีเจอร์ (เช่น booking, auth, movies)
│   ├── hooks/               # Custom React Hooks
│   ├── lib/                 # ฟังก์ชัน Utility และการตั้งค่า Third-party libraries (เช่น Axios, React Query)
│   ├── store/               # การจัดการ Global State (Zustand Stores)
│   └── types/               # การประกาศ Type Definitions ของ TypeScript
├── public/                  # Static assets (Images, Fonts)
├── .env.example             # Template ของ Environment variables
├── next.config.js           # การตั้งค่า Next.js
└── tailwind.config.ts       # Design tokens สำหรับ Tailwind CSS
```

### Routing Structure (App Router)
- `page.tsx`: หน้าแสดงผลหลัก (UI) ของแต่ละ Route
- `layout.tsx`: โครงสร้าง UI ที่ใช้ร่วมกันข้ามหลายๆ หน้า (เช่น Navbar, Footer)
- `route.ts`: (ถ้ามี) สำหรับสร้าง Route Handlers (API Endpoints ฝั่ง Frontend)
- `loading.tsx` / `error.tsx`: จัดการ State โหลดและ Error สอดคล้องกับ React Suspense

---

## 📐 มาตรฐานการเขียนโค้ด (Coding Standards)

- **TypeScript**: มีการบังคับใช้ Strict mode ดังนั้น **ห้ามใช้ประเภท `any`** และควรสร้าง Interfaces หรือ Types ที่ถูกต้องเสมอ
- **Styling**: เราใช้งาน Tailwind CSS โดยอ้างอิง Design tokens ต่างๆ ที่กำหนดไว้ในไฟล์ `tailwind.config.ts` ไม่อนุญาตให้ใช้ Inline Styles หากไม่จำเป็นจริงๆ
- **State Management**: สามารถศึกษาแนวทางปฏิบัติสำหรับการจัดการ Global State (Zustand) และ Data Fetching (React Query / Server Components) ได้ที่ [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)
- **Component Naming**: ตั้งชื่อไฟล์ Component เป็น PascalCase (เช่น `MovieCard.tsx`) และฟังก์ชัน Hook เป็น camelCase (เช่น `useAuth.ts`)

---

## 📦 การ Build ระบบขึ้น Production (Building for Production)

เมื่อต้องการสร้างไฟล์ Build ที่ถูก Optimize เพื่อไปรันใช้งานจริงบน Production:
```bash
pnpm build
pnpm start
```
หาก Deploy ขึ้นบน Platform เช่น Vercel หรือ Docker ระบบจะรันคำสั่งเหล่านี้โดยอัตโนมัติตาม CI/CD Pipeline

---

## 🌊 การจัดการสาขา (Git Flow)

โปรเจกต์นี้ใช้มาตรฐาน **Git Flow** ในการทำงาน สำหรับส่วนของ Frontend:
- ห้ามแก้ไขโค้ดลงกิ่ง `main` หรือ `develop` โดยตรง
- สร้างกิ่ง `feature/*` จาก `develop` ทุกครั้งเมื่อทำ UI หรือฟีเจอร์ใหม่
- ทำตามข้อกำหนดการเปิด Pull Request ตามที่ระบุไว้ใน [CONTRIBUTING.md](../CONTRIBUTING.md)
