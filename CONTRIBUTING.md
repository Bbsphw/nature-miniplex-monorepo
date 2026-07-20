# Contributing to Nature MiniPlex

[⬅️ กลับสู่หน้าหลัก (Back to Root)](./README.md)
ก่อนอื่น ทีมงานขอขอบคุณที่คุณสนใจเข้ามาร่วม Contribute ให้กับโปรเจกต์ Nature MiniPlex ครับ!

เนื้อหาด้านล่างนี้คือ Guidelines สำหรับการร่วมพัฒนา Repository นี้ กฎเกณฑ์เหล่านี้เป็นแนวทางปฏิบัติ (Guidelines) เพื่อให้ทีมสามารถส่งมอบโค้ดที่มีคุณภาพสูงได้อย่างต่อเนื่อง หากมีข้อเสนอแนะสามารถเปิด Pull Request เสนอปรับปรุงเอกสารนี้ได้เสมอครับ

---

## 🌊 กระบวนการพัฒนา (Development Workflow)

เราใช้ Feature-branch workflow (คล้ายกับ GitHub Flow) ในการพัฒนา

### 1. การตั้งชื่อ Branch (Branch Naming)
รูปแบบที่กำหนด: `<type>/<issue-number>-<short-description>`
- สำหรับฟีเจอร์ใหม่: `feature/123-add-booking-endpoint`
- สำหรับแก้บั๊ก: `bugfix/124-fix-seat-race-condition`
- สำหรับแก้ปัญหาเร่งด่วน: `hotfix/125-urgent-db-crash`

### 2. การเขียน Commit Messages (Conventional Commits)
เรายึดมาตรฐานตาม [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) เพื่อให้สามารถทำ Automated Release/Changelog ได้ง่าย
- `feat:` เมื่อมีการเพิ่มความสามารถหรือหน้าใหม่
- `fix:` เมื่อมีการแก้ไขบั๊ก
- `docs:` เมื่อมีการอัปเดตเอกสาร (เช่น README, ARCHITECTURE)
- `refactor:` เมื่อมีการจัดโครงสร้างโค้ดใหม่โดยไม่กระทบความสามารถเดิม
- `chore:` สำหรับงานจิปาถะ เช่น อัปเดต dependencies, ตั้งค่าเครื่องมือ

*ตัวอย่าง: `feat(api): add JWT authentication for booking endpoint`*

### 3. การส่ง Pull Requests (PR)
> [!IMPORTANT]
> ห้าม Merge โค้ดเข้า `main` ด้วยตัวเองเด็ดขาด ทุกคนต้องผ่านกระบวนการ Code Review อย่างน้อย 1 คนเสมอ

**PR Checklist ที่ต้องทำก่อนขอ Review**:
- [ ] ทดสอบโค้ดใน Local สำเร็จ (รัน `pnpm dev` หรือ `dotnet run` ไม่เจอ Error)
- [ ] ไม่มีข้อมูลลับ (Secrets, รหัสผ่าน, `.env.local`) หลุดเข้ามาใน PR นี้
- [ ] เขียน/อัปเดต Unit Tests สำหรับส่วนที่แก้ไขแล้ว (ถ้ามี)
- [ ] ทำตาม Coding Standards และผ่านการทำ Linting/Formatting เรียบร้อยแล้ว
- [ ] อัปเดตเอกสาร (ถ้าโค้ดมีการเปลี่ยนแปลงระดับสถาปัตยกรรม หรือเปลี่ยน API Payload)

---

## 📐 มาตรฐานการเขียนโค้ด (Coding Standards)

### Backend (.NET 8 / C#)
- ทำตามมาตรฐานการเขียน C# ทั่วไป (ใช้ PascalCase สำหรับ Classes/Methods และ camelCase สำหรับตัวแปร Local)
- ยึดหลักการพัฒนาแบบ **Clean Architecture** อย่างเคร่งครัด หลีกเลี่ยงการเรียกใช้ Infrastructure layers จากฝั่ง Core Domain เด็ดขาด
- พยายามทำให้ Controllers "Thin" ที่สุด (โค้ดน้อยๆ) Business Logic ทั้งหมดควรอยู่ใน Application หรือ Domain Layers
- จัดการการทำงานแบบ Asynchronous (`async/await`) อย่างถูกต้องเสมอ เพื่อให้ระบบรองรับการ Scale ได้ดี
- การ Return HTTP Status ต้องเป็นไปตามมาตรฐาน REST (เช่น `404 Not Found`, `409 Conflict` สำหรับ Race Conditions)

### Frontend (Next.js / TypeScript)
- ใช้ Functional Components และ React Hooks เป็นหลัก
- บังคับใช้การทำ **Strict TypeScript Typing** พยายามหลีกเลี่ยงการใช้ Type `any` หรือ `@ts-ignore` 
- ใช้หลักการ Atomic Design ในการแบ่งส่วน Component พยายามสร้าง Components ที่มีขนาดเล็ก โฟกัสเฉพาะงาน และสามารถนำกลับมา Reuse ได้
- การจัดการ Data Fetching ฝั่ง Client ให้ใช้ **React Query** และ State ส่วน UI ให้ใช้ **Zustand**
- สำหรับการทำ Styling ให้ใช้ Utility classes ของ **Tailwind CSS** เป็นมาตรฐานเดียวกัน

---

## 🙋‍♂️ ต้องการความช่วยเหลือ? (Getting Help)
หากคุณต้องการความช่วยเหลือหรือมีคำถามเกี่ยวกับสถาปัตยกรรมระบบ (Architecture) สามารถทักหา Technical Lead หรือโพสต์ถามในช่อง Developer Channel ภายในทีมได้เลยครับ
