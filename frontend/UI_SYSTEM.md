# Nature MiniPlex — UI System & Design Tokens

เอกสารฉบับนี้อธิบายระบบการออกแบบ (Design System), Design Tokens, การใช้งาน Tailwind CSS v4, และส่วนประกอบ Radix UI Primitives สำหรับแอปพลิเคชัน Nature MiniPlex

## 1. Premium Cinema Dark Aesthetics

อินเทอร์เฟซของระบบได้รับการออกแบบในสไตล์ **"Premium Dark Cinema"** มุ่งเน้นการสร้างบรรยากาศแบบโรงภาพยนตร์สุดหรู (Immersive Cinematic Atmosphere) ด้วยโทนสีเข้ม Glassmorphism และไฟ Neon Accents:

- **Surface Base (`#0A0A0F`):** พื้นหลังหลักของแอปพลิเคชัน ให้ความรู้สึกมืดสนิทสมจริง
- **Surface Elevated (`#1C1C27`):** การ์ดข้อมูล, แผงควบคุม Admin, และ Dialog Modals
- **Surface Border (`#2A2A3E`):** เส้นขอบและตัวแบ่งเซกชันแบบบาง
- **Brand Red (`#E31837`):** สีแดงสัญลักษณ์หลักสำหรับปุ่ม Action, สถานะที่เลือก และ Glow Effects

## 2. Tailwind CSS v4 Integration

ระบบใช้ประโยชน์จาก **Tailwind v4 Engine** ซึ่งทำงานผ่าน CSS Variables และ `@theme` directives ใน `src/app/globals.css`:

```css
@theme {
  --color-brand-red: #E31837;
  --color-surface-base: #0A0A0F;
  --color-surface-elevated: #1C1C27;
  --color-surface-border: #2A2A3E;
  --font-prompt: 'Prompt', sans-serif;
}
```

## 3. Radix UI Primitives & Accessibility (a11y)

เลือกใช้ **Radix UI Primitives** เพื่อให้มั่นใจว่า UI อ่านง่ายและรองรับ Screen Readers และ Keyboard Navigation ตามมาตรฐาน WAI-ARIA:

- **Primitives ในโปรเจกต์:** Dialog, Select, Label, Slot
- **Location:** `src/components/ui/`
- **a11y Enhancements:**
  - `SeatButton`: มี `aria-pressed` และ `aria-label` แจ้งสถานะที่นั่ง (ว่าง, เลือกแล้ว, จองแล้วพร้อมเบอร์โทรศัพท์ Masked)
  - Dialog Modals: ควบคุม Focus Trapping และ ARIA Labeling อัตโนมัติ

## 4. Custom Utility Classes

กำหนด Custom Utilities ใน `src/app/globals.css` สำหรับ Visual Effects ซับซ้อน:
- `.glass`: สร้างพื้นหลังโปร่งแสงพร้อม Blur Filter
- `.hide-scrollbar`: ซ่อน Scrollbar สำหรับผังที่นั่งในหน้าจอขนาดเล็ก
- `.animate-shake`: แอนิเมชันสั่นเตือนเมื่อผู้ใช้เลือกที่นั่งที่ไม่ถูกต้องหรือล้มเหลว
