# Software Requirements Specification (SRS) & System Architecture

[⬅️ กลับสู่หน้าหลัก (Back to Root)](./README.md)

**Project Name:** Nature MiniPlex (MVP)
**Document Version:** 1.0 (Final)
**Date:** 2026-07-19

---

## 1. บทนำ (Introduction)

### 1.1 วัตถุประสงค์ (Purpose)
เอกสารฉบับนี้จัดทำขึ้นเพื่อกำหนดความต้องการของซอฟต์แวร์ (Software Requirements Specification - SRS) และสถาปัตยกรรมระบบ (System Architecture) สำหรับโปรเจกต์ **Nature MiniPlex** ในระยะที่ 1 ซึ่งเป็น Minimum Viable Product (MVP) เพื่อให้ทีมนักพัฒนา (Developers), ผู้ทดสอบ (Testers), และผู้มีส่วนได้ส่วนเสีย (Stakeholders) มีความเข้าใจตรงกันเกี่ยวกับขอบเขตการทำงาน โครงสร้างระบบ และแนวทางการพัฒนา

### 1.2 ขอบเขตของระบบ (Scope)
Nature MiniPlex (MVP) เป็นระบบจัดการตั๋วภาพยนตร์ขั้นต่ำที่ครอบคลุมการทำงานหลัก ได้แก่:
- การแสดงรายการภาพยนตร์และรอบฉาย
- การตรวจสอบสถานะที่นั่งแบบเรียลไทม์
- ระบบการจองที่นั่งที่สามารถป้องกันปัญหาการจองซ้ำซ้อน (Race Conditions)
- โครงสร้างพื้นฐานสำหรับการทำงานแบบ Monorepo โดยแบ่งแยก Frontend และ Backend ชัดเจน

---

## 2. ข้อมูลจำเพาะความต้องการซอฟต์แวร์ (Software Requirements Specification - SRS)

### 2.1 Functional Requirements (ความต้องการด้านฟังก์ชันการทำงาน)

**FR1: การจัดการข้อมูลภาพยนตร์และรอบฉาย (Movie & Showtime Management)**
- ระบบสามารถแสดงรายการภาพยนตร์ที่กำลังเข้าฉาย (Now Showing)
- ระบบสามารถแสดงรายละเอียดของภาพยนตร์ (เรื่องย่อ, ความยาว, หมวดหมู่)
- ระบบสามารถแสดงรอบฉายของภาพยนตร์แต่ละเรื่องตามโรงภาพยนตร์ (Theater) และวันที่ได้

**FR2: การจัดการที่นั่งและการจอง (Seat & Booking Management)**
- ผู้ใช้งานสามารถเลือกดูผังที่นั่งของรอบฉายที่ต้องการได้
- ระบบต้องแสดงสถานะที่นั่งได้อย่างถูกต้อง (ว่าง, กำลังจอง, จองแล้ว)
- ผู้ใช้งานสามารถเลือกที่นั่งที่ "ว่าง" เพื่อทำการจองได้
- **Critical:** ระบบต้องป้องกันไม่ให้ผู้ใช้งานมากกว่า 1 คนสามารถจองที่นั่งเดียวกันในรอบฉายเดียวกันได้พร้อมกัน (Concurrency Handling)

**FR3: การจัดการระบบตั๋ว (Ticketing)**
- เมื่อการจองสำเร็จ ระบบจะออกหมายเลขการจอง (Booking Reference) หรือ e-Ticket ให้กับผู้ใช้งาน

### 2.2 Non-Functional Requirements (ความต้องการด้านคุณภาพระบบ)

**NFR1: ประสิทธิภาพ (Performance)**
- API ในการโหลดผังที่นั่งต้องตอบสนองภายใน 500ms
- หน้าเว็บต้องโหลดได้อย่างรวดเร็วและรองรับ SEO (ใช้ Next.js SSR/SSG ตามความเหมาะสม)

**NFR2: ความถูกต้องของข้อมูล (Data Integrity & Concurrency)**
- ระบบฐานข้อมูลต้องรองรับระดับธุรกรรม (Transaction) ที่ปลอดภัย
- ต้องมีการจัดการ **Optimistic Concurrency** ระหว่างขั้นตอนการจองที่นั่ง เพื่อป้องกัน Race Condition 100%

**NFR3: ความสามารถในการบำรุงรักษา (Maintainability)**
- โค้ด Backend ต้องเขียนตามหลักการ Clean Architecture
- การจัดการ Configuration ต่างๆ ต้องใช้ Environment Variables ตามหลัก 12-Factor App อย่างเคร่งครัด

---

## 3. สถาปัตยกรรมระบบ (System Architecture)

### 3.1 ภาพรวมสถาปัตยกรรม (High-Level Architecture)
โปรเจกต์ใช้โครงสร้างแบบ **Monorepo** เพื่อให้ง่ายต่อการแชร์ Configuration และบริหารจัดการโค้ด 

**Technology Stack หลัก:**
- **Frontend:** Next.js (React), Tailwind CSS, Zustand, React Query
- **Backend:** .NET 8 Web API
- **Database:** Microsoft SQL Server 2022
- **Infrastructure:** Docker Compose (Local Development)

### 3.2 สถาปัตยกรรมฝั่ง Backend (Clean Architecture)
Backend .NET 8 ถูกแบ่งออกเป็น Layers เพื่อลดความผูกพันของโค้ด (Decoupling) ดังนี้:

1. **Domain Layer:** แกนกลางของระบบ ประกอบด้วย Entities (เช่น `Movie`, `Showtime`, `Seat`, `Booking`), Enums และ Domain Exceptions
2. **Application Layer:** กำหนด Use Cases และ Business Logic (เช่น `BookSeatCommand`, `GetShowtimesQuery`) รวมถึง Interfaces สำหรับ Repositories
3. **Infrastructure Layer:** การเชื่อมต่อภายนอก ได้แก่ Entity Framework Core (EF Core 8) สำหรับเชื่อมต่อ SQL Server, การทำ Migrations, และบริการ Authentication (JWT)
4. **Presentation Layer (API):** Controllers/Minimal APIs สำหรับรับ HTTP Requests, แปลงข้อมูล (DTOs), ตรวจสอบสิทธิ์ (JWT Authorization) และส่งกลับ HTTP Responses

### 3.3 การออกแบบฐานข้อมูล (Database Schema Overview)
สำหรับ MVP เค้าโครงฐานข้อมูลหลักมีดังนี้:

- **Movies:** เก็บข้อมูลภาพยนตร์ (Id, Title, Description, Duration, PosterUrl)
- **Theaters:** เก็บข้อมูลโรงภาพยนตร์ (Id, Name, Capacity)
- **Showtimes:** รอบฉาย (Id, MovieId, TheaterId, StartTime, EndTime, PriceMultiplier)
- **Seats:** ที่นั่งในแต่ละโรงภาพยนตร์ (Id, TheaterId, Row, Number, Type)
- **Bookings / Tickets:** ข้อมูลการจอง (Id, ShowtimeId, UserId, Status, TotalAmount, CreatedAt)
- **BookingSeats:** ตารางเชื่อม (Many-to-Many) ระหว่าง Booking และ Seat (BookingId, SeatId, Price) **พร้อมฟิลด์ `RowVersion` สำหรับทำ Concurrency Control**

### 3.4 กลยุทธ์การจัดการความขัดแย้งในการจอง (Concurrency Strategy)
เพื่อแก้ไขปัญหา Race Conditions ที่มักพบในระบบจองตั๋ว ระบบได้นำแนวทาง **Optimistic Concurrency** มาใช้ผ่าน EF Core 8:

1. **RowVersion Tracking:** ตารางที่เกี่ยวข้องกับสถานะที่นั่ง (เช่น `ShowtimeSeat` หรือตัวที่เก็บสถานะการจองของที่นั่งในรอบนั้นๆ) จะมีคอลัมน์ `RowVersion` (`byte[]`) ซึ่ง SQL Server จะอัปเดตอัตโนมัติเมื่อมีการเปลี่ยนแปลงข้อมูล
2. **Conflict Resolution:** เมื่อ User A และ User B พยายามบันทึกข้อมูลการจองที่นั่งเดียวกันพร้อมกัน 
   - ระบบจะเปรียบเทียบ `RowVersion`
   - คนที่ Request ไปถึงฐานข้อมูลก่อน (User A) จะบันทึกสำเร็จและ `RowVersion` ถูกเปลี่ยน
   - คนที่ Request ถึงทีหลัง (User B) จะเจอ `DbUpdateConcurrencyException` จาก EF Core
3. **User Feedback:** API จะดักจับ Exception ดังกล่าว และส่ง Response แจ้งเตือน User B กลับไปยัง Frontend ว่า *"ที่นั่งนี้เพิ่งถูกจองไป กรุณาเลือกที่นั่งใหม่"*

### 3.5 Infrastructure & Deployment
- **Local Development:** ใช้ Docker Compose (`/infra/docker-compose.yml`) ในการรัน Service ที่จำเป็น ได้แก่ SQL Server เพื่อให้นักพัฒนาสามารถจำลองสภาพแวดล้อมได้เหมือนกันทุกคน
- **Secrets Management:** ไม่มีการเก็บรหัสผ่านใน Source Control 100% โดยใช้ระบบ `.env` และ `.env.local` แยกตามโฟลเดอร์

---

## 4. บทสรุป (Conclusion)
เอกสาร SRS และ System Architecture ฉบับนี้ ระบุรากฐานที่แข็งแกร่งสำหรับโปรเจกต์ Nature MiniPlex การใช้ Clean Architecture คู่กับ Next.js ทำให้ระบบพร้อมรองรับการขยายตัวในอนาคต (Scalability) ในขณะที่การออกแบบฐานข้อมูลแบบ Optimistic Concurrency ช่วยรับประกันว่าฟีเจอร์หลักอย่าง "การจองตั๋วภาพยนตร์" จะทำงานได้อย่างถูกต้อง ไร้ข้อผิดพลาดจากการแย่งกันจอง (Race Condition) ตามมาตรฐานของระบบ Enterprise

---
*Prepared by: Senior System Analyst & Software Architect*
