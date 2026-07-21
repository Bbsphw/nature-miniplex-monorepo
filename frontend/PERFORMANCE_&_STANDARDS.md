# Nature MiniPlex — Performance & Coding Standards

เอกสารฉบับนี้กำหนดมาตรฐานด้านประสิทธิภาพ ประสบการณ์การใช้งาน (UX/Performance) และแนวปฏิบัติในการเขียนโค้ดสำหรับโปรเจกต์ **Nature MiniPlex Frontend**

## 1. Core Web Vitals Targets & Performance Goals

เรากำหนดเป้าหมายประสิทธิภาพของระบบส่วนหน้าเพื่อมอบประสบการณ์ที่ดีที่สุดแก่ผู้ใช้งาน:

| Metric | Target Goal | Optimization Strategy |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | `< 1.8s` | ใช้ Next.js `<Image />` พร้อม `priority` บนภาพ Banner/Movie Poster หลัก |
| **FID / INP (Interaction to Next Paint)** | `< 50ms` | ใช้ Zustand Local State สำหรับ Seat Selection, Memoize Seat Components |
| **CLS (Cumulative Layout Shift)** | `< 0.05` | กำหนด explicit dimension บน Skeleton Loaders และ Container Heights |
| **Initial JS Bundle Size** | `< 500KB` | ทำ Route-based Code Splitting และ Dynamic Imports สำหรับ Modals |
| **Total Page Weight** | `< 1.5MB` | บีบอัดรูปภาพเป็น WebP/AVIF, ใช้ Font Subsetting (Next Font) |

## 2. Image & Asset Optimization

1. **Next-Gen Image Formats:** รูปภาพภาพยนตร์ทั้งหมดต้องเสิร์ฟผ่าน Next.js Image Optimization Pipeline (WebP/AVIF)
2. **Font Loading Strategy:** ใช้ `next/font/google` (Inter / Prompt / Kanit) พร้อม `display: 'swap'` เพื่อป้องกันปัญหา Flash of Unstyled Text (FOUT)
3. **Script Execution:** สคริปต์ภายนอกทั้งหมดต้องโหลดแบบ `async` หรือ `defer` ผ่าน `<Script />` ของ Next.js

## 3. Caching & HTTP Strategy

- **Static Assets:** ตั้งค่า Cache-Control Header เป็น `public, max-age=31536000, immutable` สำหรับไฟล์ใน `/public` และ Next.js static chunks
- **Server Data Caching:**
  - TanStack Query ถูกตั้งค่า `staleTime: 1000 * 60 * 2` (2 นาที) สำหรับรายการภาพยนตร์
  - ตั้งค่า `staleTime: 0` สำหรับผังที่นั่ง (`showtime-seats`) เพื่อให้แน่ใจว่าผังที่นั่งมีความสดใหม่อยู่เสมอ

## 4. Code Quality, Linting & Pre-commit Hooks

### ESLint & Prettier Standard
- ใช้งาน **ESLint 9** ร่วมกับ `eslint-config-next`
- ห้ามใช้ `any` ใน TypeScript ให้ระบุ Type หรือ `unknown` ชัดเจน
- ทุก Component ต้องระบุ Return Type หรือใช้วิธีการส่งออก Component ที่มีความชัดเจน

### Automated Code Quality Checks
เราติดตั้ง **Husky** และ **lint-staged** เพื่อตรวจสอบโค้ดก่อน Commit:

```json
// package.json snippet
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

## 5. Security & Accessibility (a11y) Standards

### Security Rules
1. **XSS Prevention:** ห้ามใช้งาน `dangerouslySetInnerHTML` เว้นแต่ผ่านการ Sanitize ด้วย DOMPurify
2. **Secure Token Handling:** ห้ามเก็บบันทึกข้อมูล Sensitive Data ลงใน `localStorage` โดยตรง ให้ใช้ Secure Auth Cookie
3. **Input Sanitization:** ล้างค่า Whitespace และกรองเบอร์โทรศัพท์ด้วย Zod Regex ก่อนส่งไปยัง API

### Accessibility (a11y) Rules
1. **Semantic HTML5:** ใช้ Tag `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>` ให้ถูกต้องตามโครงสร้าง Document
2. **ARIA Attributes:** 
   - `SeatButton` ต้องกำหนด `aria-pressed={isSelected}` และ `aria-label` ที่อธิบายสถานะที่นั่งชัดเจน
   - Dialog Modals ต้องมี `aria-labelledby` และ `aria-describedby` กำกับเสมอ
3. **Keyboard Navigation:** ต้องสามารถกด `Tab` เลือกที่นั่ง และกด `Enter`/`Space` เพื่อทำการเลือก/ยกเลิกที่นั่งได้โดยไม่ต้องใช้เมาส์
