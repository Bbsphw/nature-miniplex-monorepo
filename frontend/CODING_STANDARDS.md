# Nature MiniPlex — Coding Standards & Development Guidelines

เอกสารฉบับนี้สรุปมาตรฐานการเขียนโค้ด (Coding Standards), ข้อกำหนด TypeScript Strictness, โครงสร้าง Component, และแนวทางการใช้งาน Tooling สำหรับการพัฒนาโปรเจกต์ **Nature MiniPlex Frontend**

## 1. TypeScript Strictness & Type Safety Rules

- **ห้ามใช้ `any` โดยเด็ดขาด:** อนุญาตให้ใช้เฉพาะ Explicit Types หรือ `unknown` ร่วมกับ Type Guards (เช่น `axios.isAxiosError(err)`)
- **API Model Typing:** ทุก Request/Response Payload ต้องตรงตาม TypeScript Interfaces ใน `src/types/api.ts`
- **Strict Component Props:** ทุก React Component ต้องระบุ Props Interface ชัดเจน (เช่น `interface SeatButtonProps { ... }`)
- **Return Type Precision:** ฟังก์ชั่นย่อยและ Custom Hooks ต้องระบุ Return Type หรือมี Type Inference ที่แม่นยำ

## 2. Component Structure & Architecture Rules

- **Function Declaration:** ใช้ `export function ComponentName() { ... }` สำหรับ Named Components ทั่วไป (ยกเว้น Next.js Pages และ Layouts ที่ต้องใช้ Default Export)
- **Props Destructuring:** แตก Props ออกมาใน Function Signature โดยตรงเพื่อความอ่านง่าย
- **Single Responsibility & File Length Limit:** หาก Component มีจำนวนบรรทัดเกิน 150-200 บรรทัด ต้องแยกย่อยเป็น Sub-components ภายในโฟลเดอร์เดียวกัน
- **Class Merging Utility:** ใช้ `cn()` utility (`clsx` + `tailwind-merge`) ในการรวม Tailwind CSS classes แบบไดนามิก

## 3. ESLint & Quality Enforcement

- **No Unused Variables (`@typescript-eslint/no-unused-vars`):** ตัวแปรหรือการ Import ที่ไม่ได้ใช้งานต้องถูกลบออกทั้งหมด
- **React Hooks Purity & Dependencies:** ห้ามเรียกฟังก์ชั่น Impure (เช่น `Date.now()`, `Math.random()`) ระหว่าง Render ใน React 19 โดยตรง ให้ใช้ `useState` lazy initializer
- **Pre-commit Checks:** ต้องผ่านการตรวจ `pnpm exec tsc --noEmit` และ `pnpm run lint` ก่อนทำการ Commit ทุกครั้ง

## 4. Environment Variables & Security

- **Client Exposure:** ตัวแปร Environment Variables ที่ต้องการส่งให้ Browser อ่านได้ต้องขึ้นต้นด้วย `NEXT_PUBLIC_`
- **Local Env File:** กำหนดค่าเริ่มต้นใน `.env.example` และ `.env.local`
- **Example:** `NEXT_PUBLIC_API_URL=http://localhost:5000`
