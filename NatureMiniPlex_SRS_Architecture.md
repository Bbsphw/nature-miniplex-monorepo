# Software Requirements Specification (SRS) & System Architecture

[⬅️ กลับสู่หน้าหลัก (Back to Root)](./README.md)

**Project Name:** Nature MiniPlex Monorepo
**Document Version:** 2.0 (Enterprise Architecture Edition)
**Last Updated:** 2026-07-22
**Status:** Active & Standardized

---

## 📋 สารบัญ (Table of Contents)

1. [บทนำและวัตถุประสงค์ (Introduction & Purpose)](#1-บทนำและวัตถุประสงค์-introduction--purpose)
2. [ข้อกำหนดความต้องการซอฟต์แวร์ (Software Requirements Specification - SRS)](#2-ข้อกำหนดความต้องการซอฟต์แวร์-software-requirements-specification---srs)
   - [2.1 Functional Requirements (FR)](#21-functional-requirements-ความต้องการด้านฟังก์ชันการทำงาน)
   - [2.2 Non-Functional Requirements (NFR)](#22-non-functional-requirements-ความต้องการด้านคุณภาพระบบ)
3. [สถาปัตยกรรมระบบเชิงลึก (System Architecture & Design)](#3-สถาปัตยกรรมระบบเชิงลึก-system-architecture--design)
   - [3.1 โครงสร้างภาพรวม Monorepo Architecture](#31-โครงสร้างภาพรวม-monorepo-architecture)
   - [3.2 Backend Architecture (.NET 8 Clean Architecture)](#32-backend-architecture-net-8-clean-architecture)
   - [3.3 Frontend Architecture (Next.js App Router & State Management)](#33-frontend-architecture-nextjs-app-router--state-management)
   - [3.4 Infrastructure as Code & Deployment (IaC & Containerization)](#34-infrastructure-as-code--deployment-iac--containerization)
4. [กลยุทธ์การจัดการความขัดแย้งในการจอง (Concurrency & Locking Strategy)](#4-กลยุทธ์การจัดการความขัดแย้งในการจอง-concurrency--locking-strategy)
5. [การออกแบบฐานข้อมูล (Database Schema & Entity Relations)](#5-การออกแบบฐานข้อมูล-database-schema--entity-relations)
6. [บทสรุปและมาตรฐานการส่งมอบ (Conclusion & Quality Standards)](#6-บทสรุปและมาตรฐานการส่งมอบ-conclusion--quality-standards)

---

## 1. บทนำและวัตถุประสงค์ (Introduction & Purpose)

### 1.1 วัตถุประสงค์ (Purpose)
เอกสารฉบับนี้จัดทำขึ้นเพื่อกำหนดข้อกำหนดความต้องการของซอฟต์แวร์ (**Software Requirements Specification - SRS**) และโครงสร้างสถาปัตยกรรมระบบ (**System Architecture**) สำหรับโปรเจกต์ **Nature MiniPlex Monorepo** ครอบคลุมทั้งฝั่ง Frontend, Backend API, Database Persistence และ Infrastructure as Code (IaC) เพื่อให้ทีมนักพัฒนา (Software Engineers), ผู้ดูแลระบบ (DevOps), ผู้ทดสอบ (QA/Testers) และ Stakeholders มีมาตรฐานและพิมพ์เขียว (Blueprint) ในการพัฒนาระบบร่วมกันอย่างมีประสิทธิภาพ

### 1.2 ขอบเขตของระบบ (System Scope)
ระบบ **Nature MiniPlex** เป็นระบบบริหารจัดการโรงภาพยนตร์แบบครบวงจร (Cinema Management & Ticketing Ecosystem) ที่รองรับ:
- **Client Web Application:** ระบบค้นหาภาพยนตร์ กรองรอบฉาย เลือกที่นั่งแบบเรียลไทม์ และออกตั๋วอิเล็กทรอนิกส์ (e-Ticket)
- **Admin Management Panel:** ระบบหลังบ้านสำหรับผู้ดูแลระบบในการจัดการภาพยนตร์ (Movies CRUD), จัดการรอบฉาย (Showtimes Management), ตรวจสอบรายการจอง (Bookings Audit) และรายงานรายได้ (Financial Reports)
- **High-Concurrency Engine:** ระบบป้องกันการจองที่นั่งซ้ำซ้อน (Seat Lock Race Condition) ด้วย Optimistic Concurrency 100%
- **Enterprise-Grade Clean Architecture:** การแยกโครงสร้างซอฟต์แวร์ออกเป็นสัดส่วน ปราศจาก Coupling พร้อมระบบจัดการ Exception และ Global UI Components

---

## 2. ข้อกำหนดความต้องการซอฟต์แวร์ (Software Requirements Specification - SRS)

### 2.1 Functional Requirements (ความต้องการด้านฟังก์ชันการทำงาน)

#### **FR1: การจัดการข้อมูลภาพยนตร์และรอบฉาย (Movie & Showtime Management)**
- **FR1.1:** ระบบแสดงรายการภาพยนตร์ที่กำลังเข้าฉาย (Now Showing) และโปรแกรมหน้า (Upcoming Movies)
- **FR1.2:** ระบบแสดงรายละเอียดภาพยนตร์อย่างครบถ้วน (ชื่อเรื่อง, เรื่องย่อ, ความยาว, ประเภท, เรตติ้ง, โปสเตอร์)
- **FR1.3:** ระบบมี Filter Bar (`SRSBookingFilterBar`) สามารถค้นหาและกรองรอบฉายตามวันที่, โรงภาพยนตร์ (Theater), และระบบฉายภาพยนตร์ (2D, 3D, IMAX)
- **FR1.4:** ระบบแสดงผังที่นั่งพร้อมสถานะเรียลไทม์ และระบบแบ่งหน้า (Paginated Movie Grid)

#### **FR2: การจัดการที่นั่งและการจอง (Seat Selection & Booking Engine)**
- **FR2.1:** ผู้ใช้งานสามารถเลือกดูผังที่นั่ง (Seat Grid) ของรอบฉายที่ต้องการในแต่ละโรงภาพยนตร์ได้
- **FR2.2:** ผังที่นั่งแสดงสถานะชัดเจน ได้แก่ *Available (ว่าง)*, *Selected (กำลังเลือก)*, *Locked/Pending (กำลังดำเนินการ)* และ *Booked (จองแล้ว)*
- **FR2.3:** ผู้ใช้งานเลือกจองที่นั่งพร้อมกันได้ 1-4 ที่นั่งต่อรายการธุรกรรม
- **FR2.4 (Critical):** ระบบต้องป้องกันไม่ให้ผู้ใช้งานมากกว่า 1 คนจองที่นั่งเดียวกันในรอบฉายเดียวกันพร้อมกัน (Race Condition Protection)
- **FR2.5:** ระบบสามารถยกเลิกรายการจองตั๋วเป็นรายที่นั่งหรือยกเลิกทั้งธุรกรรมได้ (Cancel Booking by Seat / Cancel Booking Item)

#### **FR3: การจัดการระบบตั๋วและเอกสารยืนยัน (Ticketing & E-Ticket System)**
- **FR3.1:** เมื่อชำระเงิน/บันทึกการจองสำเร็จ ระบบออกรหัสอ้างอิงการจอง (Booking Reference / QR Code Token)
- **FR3.2:** ระบบแสดงหน้ายืนยันการจอง (`BookingConfirmationPage`) พร้อมสรุปยอดชำระ รายละเอียดที่นั่ง และรอบฉาย

#### **FR4: ระบบบริหารจัดการสำหรับผู้ดูแลระบบ (Admin Management Panel)**
- **FR4.1:** ระบบยืนยันตัวตนผู้ดูแลระบบด้วย JWT (Admin Login & JWT Authentication Middleware)
- **FR4.2:** **Movie Management:** ผู้ดูแลระบบสามารถ เพิ่ม แก้ไข ลบ และค้นหาภาพยนตร์ในระบบได้
- **FR4.3:** **Showtime Management:** ผู้ดูแลระบบสามารถ ล็อกรอบฉาย เพิ่ม/แก้ไข/ลบ รอบฉายภาพยนตร์และกำหนดราคาตั๋วได้
- **FR4.4:** **Booking Audit:** ผู้ดูแลระบบสามารถตรวจสอบรายการจองย้อนหลัง ตรวจสอบสถานะธุรกรรม และทำการยกเลิกการจองในกรณีฉุกเฉินได้
- **FR4.5:** **Financial & Occupancy Reports:** ระบบสรุปรายงานยอดขาย และอัตราการเข้าชมภาพยนตร์รายรอบฉาย/รายภาพยนตร์

#### **FR5: ระบบแจ้งเตือนและกล่องโต้ตอบการยืนยัน (Global Toast & Confirm Dialog)**
- **FR5.1:** ระบบแจ้งเตือนสภาวะการทำงานแบบ Stack Toast Notification (`useToastStore` & `ToastContainer`) สำหรับสภาวะ Success, Error, Warning, Info
- **FR5.2:** ระบบยืนยันการกระทำที่สำคัญด้วย Confirm Modal (`useConfirmStore` & `ConfirmModal`) ก่อนการลบหรือยกเลิกข้อมูล

---

### 2.2 Non-Functional Requirements (ความต้องการด้านคุณภาพระบบ)

#### **NFR1: ประสิทธิภาพและเวลาตอบสนอง (Performance & SLA)**
- **NFR1.1:** API ดึงข้อมูลผังที่นั่ง (`GetShowtimeSeats`) ต้องตอบสนองภายใน **200ms**
- **NFR1.2:** API ประมวลผลการจองตั๋ว (`CreateBookingCommand`) ต้องตอบสนองภายใน **500ms** ภายใต้โหลด 500 Concurrent Requests
- **NFR1.3:** หน้าจอ Frontend ต้องได้คะแนน Lighthouse Performance 90+ และใช้งาน Next.js Server Components / Client Bundling อย่างเหมาะสม

#### **NFR2: ความถูกต้องของข้อมูลและการล็อก (Data Integrity & Concurrency Control)**
- **NFR2.1:** ระบบต้องรับประกันระดับธุรกรรม ACID (Atomicity, Consistency, Isolation, Durability) ในการจองตั๋ว
- **NFR2.2:** ป้องกัน Race Condition 100% ด้วย **Optimistic Concurrency Control** ผ่าน EF Core `RowVersion` (Timestamp Column) ใน SQL Server

#### **NFR3: ความสามารถในการบำรุงรักษาและขยายระบบ (Maintainability & Clean Architecture)**
- **NFR3.1:** โค้ดฝั่ง Backend ต้องเป็นไปตามหลักการ **Clean Architecture** แยก Core Domain ปราศจาก External Dependencies
- **NFR3.2:** ใช้ Domain Exceptions (`ConcurrencyException`, `NotFoundException`, `ValidationException`) และแปลงเป็น RFC 7807 Problem Details ผ่าน Custom Exception Handling Middleware
- **NFR3.3:** ฝั่ง Frontend ต้องใช้ Strict TypeScript Typing ไร้การใช้ `any` และใช้ Custom Hooks / Feature-based Architecture

#### **NFR4: ความปลอดภัยและการจัดเก็บความลับ (Security & Twelve-Factor Config)**
- **NFR4.1:** ห้ามจัดเก็บ Secrets, Database Connection Strings, หรือ JWT Secret Keys ใน Source Control เด็ดขาด
- **NFR4.2:** ใช้ `.env` และ `.env.local` ตามหลักการ 12-Factor App

#### **NFR5: ระบบโครงสร้างพื้นฐานและคอนเทนเนอร์ (Infrastructure & Containerization)**
- **NFR5.1:** ทั้ง Frontend และ Backend ต้องมี Dockerfile แบบ Multi-stage Build สำหรับ Production
- **NFR5.2:** โครงสร้างพื้นฐานต้องพร้อม Deploy ด้วย Docker Compose (`infra/docker/`) และ Terraform IaC (`infra/terraform/`)

---

## 3. สถาปัตยกรรมระบบเชิงลึก (System Architecture & Design)

### 3.1 โครงสร้างภาพรวม Monorepo Architecture

โปรเจกต์ Nature MiniPlex จัดโครงสร้างเป็น Monorepo โดยแบ่งโฟลเดอร์ตามขอบเขตความรับผิดชอบอย่างชัดเจน:

```
nature-miniplex-monorepo/
├── .github/                   # CI/CD Workflows & GitHub PR Templates
├── backend/                   # ASP.NET Core 8 Web API (Clean Architecture)
│   ├── src/
│   │   ├── API/               # Presentation Layer (Controllers, Middlewares, Program.cs)
│   │   ├── Core/              # Domain & Application Layers (Entities, CQRS, DTOs, Exceptions)
│   │   └── Infrastructure/   # Persistence, Repositories, EF Core, JWT Auth
│   ├── tests/                 # Unit & Integration Tests (xUnit, Moq, FluentAssertions)
│   └── Dockerfile             # Multi-stage Docker build for Backend
├── frontend/                  # Next.js 14 App Router (React + TypeScript)
│   ├── src/
│   │   ├── app/               # App Router Pages (Client & Admin Dashboards)
│   │   ├── components/        # Atomic UI Components (Booking, Movies, UI elements)
│   │   ├── features/          # Feature-based Custom React Query Hooks
│   │   ├── store/             # Global Client State (Zustand: Booking, Toast, Confirm)
│   │   └── types/             # Strict TypeScript Type Definitions
│   └── Dockerfile             # Multi-stage Docker build for Frontend
├── infra/                     # Infrastructure as Code & Orchestration
│   ├── docker/                # Docker Compose Services (SQL Server 2022, API, Web)
│   └── terraform/             # HashiCorp Terraform Manifests (VPC, ECS, RDS)
├── NatureMiniPlex_SRS_Architecture.md  # System SRS & Architecture Spec (เอกสารนี้)
├── CONTRIBUTING.md            # Standard Guidelines & Git Flow Rules
└── README.md                  # Quick Start & Monorepo Overview
```

---

### 3.2 Backend Architecture (.NET 8 Clean Architecture)

Backend พัฒนาบน **ASP.NET Core 8** โดยใช้สถาปัตยกรรมแบบ **Clean Architecture** แบ่งออกเป็น 4 ชั้นหลัก:

```
┌───────────────────────────────────────────────────────────┐
│                    Presentation (API)                     │
│    Controllers, Middlewares, OpenAPI/Swagger, Extensions  │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                    Application Layer                      │
│ Commands/Queries (MediatR/CQRS), DTOs, Repository Interfaces│
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                       Domain Layer                        │
│ Entities, Value Objects, Domain Exceptions, Enums         │
└─────────────────────────────▲─────────────────────────────┘
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    Infrastructure Layer                   │
│   EF Core DbContext, Repositories, Migrations, JWT Auth   │
└───────────────────────────────────────────────────────────┘
```

1. **Domain Layer (`Core/Domain`):**
   - ประกอบด้วย Core Entities: `Movie`, `Showtime`, `Seat`, `Booking`, `BookingSeat`, `Theater`
   - Custom Domain Exceptions: `ConcurrencyException`, `NotFoundException`, `ValidationException`, `DomainException`
   - มีการสะท้อน Business Rules ผ่าน Methods บน Entities โดยตรง
2. **Application Layer (`Core/Application`):**
   - ประกอบด้วย Use Cases ในรูปแบบ CQRS (Commands & Queries)
   - Interfaces สำหรับ Data Repositories: `IShowtimeRepository`, `IBookingRepository`, `IMovieRepository`
   - DTOs และ Mappings สำหรับการสื่อสารผ่าน REST API
3. **Infrastructure Layer (`Infrastructure`):**
   - Entity Framework Core 8 DbContext (`NatureMiniPlexDbContext`)
   - Concrete Repositories Implementation (`BookingRepository`, `ShowtimeRepository`)
   - Database Migrations & Data Initializer (`DbInitializer.cs`)
   - Services เช่น JwtSettings และ Authentication Providers
4. **Presentation Layer (`API`):**
   - RESTful API Controllers (`BookingsController`, `ShowtimesController`, `MoviesController`, `AdminController`)
   - `ExceptionHandlingMiddleware`: แปลง Exception เป็น HTTP Status Code มาตรฐาน (400, 404, 409, 500) ในรูปแบบ Problem Details JSON

---

### 3.3 Frontend Architecture (Next.js App Router & State Management)

Frontend พัฒนาบน **Next.js 14 App Router** ด้วย **TypeScript** ร่วมกับเครื่องมือสมัยใหม่:

```
┌───────────────────────────────────────────────────────────┐
│                      Next.js Pages                        │
│    App Router (/booking/[id], /admin/*, /movies/[id])    │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                UI Components Layer                        │
│   SeatGrid, BookingForm, SRSFilterBar, Toast, ConfirmModal│
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────┐
│                             │                             │
▼                             ▼                             ▼
Zustand Stores           React Query Hooks             Axios Instance
(useBookingStore,        (useShowtimes,                (JWT Interceptor,
 useToastStore,           useCreateBooking,             Global Handling,
 useConfirmStore)         useUpdateMovie)               Error Normalizer)
```

- **State Management Separation:**
  - **Client UI / Transient State:** จัดการด้วย **Zustand Stores** ได้แก่ `useBookingStore` (จัดการที่นั่งที่เลือกและสภาวะการจอง), `useToastStore` (จัดการ Toast แจ้งเตือนทั่วทั้งแอป) และ `useConfirmStore` (จัดการกล่องโต้ตอบยืนยัน)
  - **Server / Remote State:** จัดการด้วย **React Query (TanStack Query)** ช่วยทำ Caching, Stale Time Management, และ Automatic Cache Invalidation เมื่อเกิดการ Mutation
- **UI & Design System:**
  - Responsive Layout ด้วย **Tailwind CSS**
  - Modular Components: `PaginatedMovieGrid`, `SRSBookingFilterBar`, `SeatButton`, `ConfirmModal`, `ToastContainer`

---

### 3.4 Infrastructure as Code & Deployment (IaC & Containerization)

1. **Docker Containerization:**
   - **Backend Container (`backend/Dockerfile`):** Multi-stage build (`dotnet/sdk:8.0` build engine -> `dotnet/aspnet:8.0` runtime image) ลดขนาด Image และเพิ่มความปลอดภัย
   - **Frontend Container (`frontend/Dockerfile`):** Multi-stage build (`node:20-alpine` build -> Standalone output runtime)
2. **Docker Compose Orchestration (`infra/docker/docker-compose.yml`):**
   - บริการ **SQL Server 2022** (`mcr.microsoft.com/mssql/server:2022-latest`) พร้อม Health Check
   - บริการ **Backend API** และ **Frontend Web App** ทำงานร่วมกันใน Isolated Container Network
3. **Infrastructure Provisioning (`infra/terraform/`):**
   - สคริปต์ **HashiCorp Terraform (HCL)** สำหรับสร้างระบบ Cloud Infrastructure บน AWS (VPC, ECS Fargate Tasks, Amazon RDS SQL Server, Application Load Balancer)

---

## 4. กลยุทธ์การจัดการความขัดแย้งในการจอง (Concurrency & Locking Strategy)

ปัญหาหลักในระบบจองตั๋วโรงภาพยนตร์คือ **Race Conditions** เมื่อผู้ใช้งานหลายคนพยายามกดจองที่นั่งเดียวกันในเวลาเดียวกัน ระบบ Nature MiniPlex ใช้กลยุทธ์ **Optimistic Concurrency Control** ผ่าน **Entity Framework Core 8** และ **SQL Server RowVersion**:

```
User A                            Backend API / EF Core                     Database (SQL Server)
  │                                       │                                         │
  ├─── 1. Select Seat A1 ────────────────►│                                         │
  │                                       ├─── 2. Fetch Seat A1 (RowVersion: 0x01)─►│
  │                                       │◄── 3. Return Seat A1 Data ──────────────┤
  │                                       │                                         │
User B                                    │                                         │
  ├─── 4. Select Seat A1 ────────────────►│                                         │
  │                                       ├─── 5. Fetch Seat A1 (RowVersion: 0x01)─►│
  │                                       │◄── 6. Return Seat A1 Data ──────────────┤
  │                                       │                                         │
  ├─── 7. Execute Booking ───────────────►│                                         │
  │    (Submit Seat A1 with 0x01)         ├─── 8. UPDATE BookingSeats ─────────────►│
  │                                       │    WHERE RowVersion = 0x01               │
  │                                       │◄── 9. SUCCESS (RowVersion updated 0x02)─┤
  │◄── 10. Booking Confirmed ─────────────┤                                         │
  │                                       │                                         │
User B (Delayed Submit)                    │                                         │
  ├─── 11. Execute Booking ──────────────►│                                         │
  │    (Submit Seat A1 with 0x01)         ├─── 12. UPDATE BookingSeats ────────────►│
  │                                       │    WHERE RowVersion = 0x01               │
  │                                       │◄── 13. FAIL (0 rows affected) ──────────┤
  │                                       │    DbUpdateConcurrencyException         │
  │                                       │                                         │
  │◄── 14. 409 Conflict Response ─────────┼─── 15. Catch & Return ProblemDetails   │
  │    ("Seat already booked!")           │                                         │
```

### ขั้นตอนการทำงาน:
1. **RowVersion Token:** ตาราง `BookingSeats` / `ShowtimeSeats` มีฟิลด์ `RowVersion` แบบ `byte[]` (`[Timestamp]`)
2. **First-Come, First-Served:** User A ที่บันทึกสำเร็จคนแรก จะทำให้ SQL Server เปลี่ยนค่า `RowVersion` เป็นค่าใหม่ (เช่น `0x02`)
3. **Conflict Detection:** เมื่อ Request ของ User B ส่งมาถึง EF Core จะใช้คำสั่ง `UPDATE ... WHERE RowVersion = 0x01` แต่เนื่องจาก `RowVersion` ใน DB เปลี่ยนเป็น `0x02` ไปแล้ว คำสั่งจะไม่กระทบแถวใดๆ
4. **Exception Handling:** EF Core โยน exception `DbUpdateConcurrencyException` ออกมา
5. **API & Client Response:** `ExceptionHandlingMiddleware` ดักจับ exception และแปลงเป็น `ConcurrencyException` ส่ง HTTP Response `409 Conflict` กลับไปยัง Frontend และแสดงผลด้วย `Toast Notification` แจ้งให้ผู้ใช้ B ทราบทันที

---

## 5. การออกแบบฐานข้อมูล (Database Schema & Entity Relations)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Movies    │1       *│  Showtimes   │*       1│   Theaters   │
├──────────────┤─────────┼──────────────┼─────────┼──────────────┤
│ Id (PK)      │         │ Id (PK)      │         │ Id (PK)      │
│ Title        │         │ MovieId (FK) │         │ Name         │
│ Duration     │         │ TheaterId(FK)│         │ Capacity     │
│ Genre        │         │ StartTime    │         └──────────────┘
└──────────────┘         │ EndTime      │                │ 1
                         └──────┬───────┘                │
                                │ 1                      │ *
                                │                        ▼
                                │                 ┌──────────────┐
                                │                 │    Seats     │
                                │                 ├──────────────┤
                                │                 │ Id (PK)      │
                                │                 │ TheaterId(FK)│
                                │                 │ Row, Number  │
                                │                 └──────────────┘
                                │                        │ 1
                                ▼ *                      │ *
                         ┌──────────────┐         ┌──────▼───────┐
                         │   Bookings   │1       *│ BookingSeats │
                         ├──────────────┤─────────┼──────────────┤
                         │ Id (PK)      │         │ BookingId(FK)│
                         │ ShowtimeIdFK │         │ SeatId (FK)  │
                         │ TotalAmount  │         │ Price        │
                         │ Status       │         │ RowVersion * │
                         └──────────────┘         └──────────────┘
```

---

## 6. บทสรุปและมาตรฐานการส่งมอบ (Conclusion & Quality Standards)

เอกสาร **SRS & System Architecture Version 2.0** ฉบับนี้ ได้ปรับปรุงและรวบรวมพิมพ์เขียวของระบบ Nature MiniPlex Monorepo ให้อยู่ในระดับ Enterprise Standard ด้วยการใช้ **Clean Architecture**, **Next.js App Router**, **Zustand State Management**, **Optimistic Concurrency Control** และ **Multi-stage Docker/Terraform Infrastructure**

ทีมงานพัฒนาและผู้รับช่วงต่อทุกท่าน ต้องยึดถือข้อกำหนดในเอกสารนี้เป็นหลักในการพัฒนา และปฏิบัติตามคู่มือ [CONTRIBUTING.md](./CONTRIBUTING.md) เพื่อรักษาคุณภาพของซอฟต์แวร์ต่อไป

---
*Documented and Standardized by Senior System Architect & Technical Lead*
