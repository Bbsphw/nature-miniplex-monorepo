# Contributing to Nature MiniPlex Monorepo

[⬅️ กลับสู่หน้าหลัก (Back to Root)](./README.md)

ทีมงานขอขอบคุณเป็นอย่างยิ่งที่คุณสนใจเข้ามาร่วมพัฒนาโปรเจกต์ **Nature MiniPlex**! 

เอกสารฉบับนี้กำหนด **Guidelines, Git Flow Strategies, Coding Standards และ PR Review Checklists** เพื่อให้ทีมนักพัฒนาสามารถทำงานร่วมกันได้อย่างเรียบร้อย และรักษาคุณภาพของซอฟต์แวร์ให้อยู่ในระดับสูงเสมอ

---

## 📋 สารบัญ (Table of Contents)

1. [กระบวนการพัฒนาและกิ่งโค้ด (Git Flow Workflow)](#1-กระบวนการพัฒนาและกิ่งโค้ด-git-flow-workflow)
2. [รูปแบบการตั้งชื่อ Branch (Branch Naming Conventions)](#2-รูปแบบการตั้งชื่อ-branch-branch-naming-conventions)
3. [การเขียน Commit Messages (Conventional Commits)](#3-การเขียน-commit-messages-conventional-commits)
4. [ข้อกำหนดและสถาปัตยกรรมระดับ Monorepo (Monorepo Guidelines)](#4-ข้อกำหนดและสถาปัตยกรรมระดับ-monorepo-monorepo-guidelines)
   - [4.1 Backend Guidelines (.NET 8 Clean Architecture)](#41-backend-guidelines-net-8-clean-architecture)
   - [4.2 Frontend Guidelines (Next.js 14 App Router & TypeScript)](#42-frontend-guidelines-nextjs-14-app-router--typescript)
   - [4.3 Infrastructure & IaC Guidelines (Docker & Terraform)](#43-infrastructure--iac-guidelines-docker--terraform)
5. [ขั้นตอนการเปิด Pull Requests (PR Workflow & Checklist)](#5-ขั้นตอนการเปิด-pull-requests-pr-workflow--checklist)
6. [การรับความช่วยเหลือ (Getting Support)](#6-การรับความช่วยเหลือ-getting-support)

---

## 1. กระบวนการพัฒนาและกิ่งโค้ด (Git Flow Workflow)

เรายึดถือมาตรฐาน **Git Flow** ในการพัฒนาอย่างเคร่งครัด เพื่อให้การจัดสรรเวอร์ชันและการออก Release เป็นไปอย่างเสถียร:

```
[ main ] ───────────────┬───────────────────────────────► (Production Releases)
                        │
                      [ hotfix/* ]
                        │
                        ▼
[ develop ] ────┬───────────────┬───────────────┬───────► (Integration & Staging)
                │               │               │
            [ feature/* ]   [ refactor/* ]  [ release/* ]
```

- `main`: กิ่งหลักสำหรับโค้ดบน Production (*ห้าม Push โดยตรง*)
- `develop`: กิ่งหลักสำหรับการรวมฟีเจอร์และรอการทดสอบเพื่อเตรียมออก Release (*ห้าม Push โดยตรง*)
- `feature/*`: กิ่งสำหรับการพัฒนาฟีเจอร์ใหม่ (แตกออกมาจาก `develop`)
- `bugfix/*`: กิ่งสำหรับการแก้ไขบั๊กทั่วไป (แตกออกมาจาก `develop`)
- `refactor/*`: กิ่งสำหรับการปรับปรุงโครงสร้างโค้ดหรือประสิทธิภาพ (แตกออกมาจาก `develop`)
- `docs/*`: กิ่งสำหรับการอัปเดตเอกสารระบบ (แตกออกมาจาก `develop`)
- `release/*`: กิ่งสำหรับเตรียมออก Release และทดสอบ QA ขั้นสุดท้าย (แตกออกมาจาก `develop`)
- `hotfix/*`: กิ่งสำหรับแก้ปัญหาร้ายแรงฉุกเฉินบน Production (แตกออกมาจาก `main`)

---

## 2. รูปแบบการตั้งชื่อ Branch (Branch Naming Conventions)

การตั้งชื่อ Branch ต้องปฏิบัติตามโครงสร้าง: `<type>/<issue-or-scope>-<short-description>` โดยใช้ตัวอักษรภาษาอังกฤษพิมพ์เล็กและคั่นด้วยเครื่องหมาย dash (`-`):

- **ฟีเจอร์ใหม่:** `feature/seat-selection-ui` หรือ `feature/102-admin-movie-crud`
- **การแก้ไขบั๊ก:** `bugfix/seat-race-condition` หรือ `bugfix/105-jwt-auth-expiry`
- **การปรับแต่งโครงสร้าง:** `refactor/clean-architecture-exceptions` หรือ `refactor/frontend-toast-store`
- **เอกสาร:** `docs/update-srs-spec`
- **การแก้ไขฉุกเฉิน:** `hotfix/db-connection-leak`

---

## 3. การเขียน Commit Messages (Conventional Commits)

เรายึดมาตรฐานตาม [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) เพื่อความเป็นระเบียบและรองรับการสร้าง Changelog อัตโนมัติ:

### รูปแบบ (Format):
`<type>(<scope>): <short summary in present tense>`

### ประเภทของ Commit (`<type>`):
- `feat`: เพิ่มความสามารถ ฟีเจอร์ หรือ UI หน้าใหม่
- `fix`: แก้ไขบั๊กหรือความผิดพลาดของระบบ
- `docs`: อัปเดตเอกสาร (เช่น README, ARCHITECTURE, SRS)
- `style`: ปรับแต่งรูปแบบโค้ด ลบ spaces (ไม่กระทบการทำงานของโค้ด)
- `refactor`: ปรับปรุงโครงสร้างโค้ดโดยไม่เปลี่ยนแปลงพฤติกรรมภายนอก
- `perf`: การปรับแต่งเพื่อเพิ่มประสิทธิภาพ (Performance Optimization)
- `test`: เพิ่มเติมหรือแก้ไข Unit Tests / Integration Tests
- `chore`: งานบำรุงรักษาทั่วไป เช่น อัปเดต Dependencies, ตั้งค่า Docker/CI
- `ci`: ปรับเปลี่ยนสคริปต์หรือตั้งค่า CI/CD Workflows

### ตัวอย่าง Commit Messages ที่ถูกต้อง:
```bash
feat(backend): add CancelBookingBySeat command handler
feat(frontend): implement useToastStore for global notifications
fix(concurrency): catch DbUpdateConcurrencyException in BookingRepository
docs(root): update SRS and system architecture specs to v2.0
refactor(infra): reorganize docker files into infra/docker directory
```

---

## 4. ข้อกำหนดและสถาปัตยกรรมระดับ Monorepo (Monorepo Guidelines)

### 4.1 Backend Guidelines (.NET 8 Clean Architecture)
- **Layer Isolation:** โค้ดใน Domain Layer ห้ามเรียกใช้สิ่งต่าง ๆ จาก Infrastructure หรือ Presentation Layer โดยเด็ดขาด
- **Domain Exceptions:** เมื่อเกิดข้อผิดพลาดทาง Business Rule ให้โยน Custom Domain Exceptions (เช่น `ConcurrencyException`, `NotFoundException`, `ValidationException`) และปล่อยให้ `ExceptionHandlingMiddleware` แปลงเป็น RFC 7807 ProblemDetails
- **Thin Controllers & CQRS:** Controller ต้องมีขนาดเล็ก ทำหน้าที่รับ Request และส่งต่อให้ CQRS Handlers หรือ Application Layer เท่านั้น
- **Asynchronous Execution:** บังคับใช้ `async/await` ร่วมกับ `CancellationToken` ใน Data Access Layer ทุกจุด

### 4.2 Frontend Guidelines (Next.js 14 App Router & TypeScript)
- **Strict TypeScript:** ห้ามใช้ Type `any` หรือ `@ts-ignore` ในโค้ดที่จะส่งเข้า `main`/`develop`
- **State Management Rules:**
  - ใช้ **Zustand** สำหรับ Client/Transient UI State (`useBookingStore`, `useToastStore`, `useConfirmStore`)
  - ใช้ **React Query** สำหรับ Server State Data Fetching & Mutations
- **Component Design:** สร้าง Atomic Components ที่มีหน้าที่ชัดเจน ไม่เขียนโค้ดซ้ำซ้อน และใช้ **Tailwind CSS** เป็นมาตรฐานเดียวในการจัด Style
- **User Feedback:** การกระทำสำคัญหรือข้อผิดพลาดต้องแจ้งเตือนผ่าน `useToastStore` หรือขอคำยืนยันผ่าน `ConfirmModal` เสมอ

### 4.3 Infrastructure & IaC Guidelines (Docker & Terraform)
- **Secrets Protection:** ห้ามนำ Secrets, Password, API Keys หรือ `.env` ใส่ไว้ใน Docker Image หรือ Git Commit
- **Multi-stage Docker:** Dockerfile ต้องใช้ Multi-stage Build เพื่อให้ขนาด Container เล็กที่สุดและปลอดภัยบน Production
- **Terraform Formatting:** รัน `terraform fmt` และ `terraform validate` ก่อนส่ง Commit สำหรับไฟล์ Infrastructure

---

## 5. ขั้นตอนการเปิด Pull Requests (PR Workflow & Checklist)

> [!IMPORTANT]
> ห้ามทำการ Merge โค้ดเข้าสู่ `main` หรือ `develop` โดยไม่ผ่านกระบวนการ Code Review โดยเด็ดขาด ทุก PR ต้องได้รับการอนุมัติ (Approve) จาก Reviewer อย่างน้อย 1 คน

### PR Checklist ที่ผู้เปิด PR ต้องตรวจสอบก่อนส่ง Review:
- [ ] **Local Verification:** ทดสอบการทำงานในเครื่อง Local เรียบร้อยแล้ว (รัน `dotnet run` และ `pnpm dev` ผ่านโดยไม่เจอ Error)
- [ ] **No Secrets Leak:** ตรวจสอบว่าไม่มีรหัสผ่าน, Connection String หรือไฟล์ `.env.local` หลุดเข้ามาใน PR
- [ ] **Automated Tests:** รัน `dotnet test` หรือ Frontend Tests ผ่านทั้งหมด
- [ ] **Clean Architecture & Strict Types:** โค้ดปฏิบัติตาม Clean Architecture และผ่านการทำ Strict TypeScript Check
- [ ] **UI & Feedback Verification:** ตรวจสอบการแสดงผล Toast Notification และ Confirm Modal (กรณีแก้ไข UI)
- [ ] **Documentation Update:** ได้อัปเดตเอกสาร `.md` ที่เกี่ยวข้องหากมีการเปลี่ยนแปลง API Contract, Schema หรือ สถาปัตยกรรมระบบ

---

## 6. การรับความช่วยเหลือ (Getting Support)

หากพบปัญหา มีข้อสงสัยในสถาปัตยกรรมระบบ หรือต้องการปรึกษาการตั้งชื่อ Branch/Commit:
- โพสต์คำถามในทีมสื่อสารภายใน (Developer Channel)
- ทักหา **System Architect** หรือ **Technical Lead** ประจำโปรเจกต์ Nature MiniPlex

---
*Thank you for helping us build a scalable and robust cinema system! 🚀*
