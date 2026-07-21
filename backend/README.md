# 🎬 Nature MiniPlex - Backend Service (.NET 8 Clean Architecture)

[⬅️ กลับสู่ Root Monorepo](../README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📚 API Documentation](./API_DOCS.md)

ยินดีต้อนรับสู่ส่วน **Backend API** ของระบบ **Nature MiniPlex** (ระบบจองตั๋วภาพยนตร์และบริหารจัดการโรงภาพยนตร์) ซอร์สโค้ดในโฟลเดอร์นี้ได้รับการออกแบบตามหลัก **Clean Architecture** ร่วมกับ **CQRS Pattern (MediatR)** บนเฟรมเวิร์ก **.NET 8** และใช้ **Entity Framework Core 8** สำหรับ Data Access เพื่อรองรับ High Concurrency, Testability และ Data Consistency ตามข้อกำหนด SRS อย่างเคร่งครัด

---

## 🎯 ภาพรวมสถาปัตยกรรม (System Overview)

Backend ของ Nature MiniPlex มุ่งเน้นการแก้ปัญหาทางธุรกิจที่สำคัญดังนี้:
1. **Zero Double-Booking Guarantee:** ป้องกันการจองที่นั่งซ้ำซ้อนในเวลาเดียวกัน (Concurrent Bookings) ผ่าน DB-level Filtered Unique Index (`IX_BookingItem_Showtime_Seat_Active`) และ Transaction Lock
2. **High-Performance Read Operations:** รองรับการดึงข้อมูลตารางรอบฉาย (Showtimes) และรายการภาพยนตร์ (Movies) ผ่าน Caching Strategy
3. **Enterprise Security:** ระบบยืนยันตัวตนด้วย **JWT Bearer Token** พร้อม **Role-Based Access Control (RBAC)** สำหรับพนักงาน (Staff) และผู้ดูแลระบบ (Owner)
4. **Standardized API Error Handling:** ส่งคืน Error ด้วยมาตรฐาน **RFC 7807 (Problem Details)** โดยไม่มีการหลุด Stack Trace ออกไปยัง Client ใน Environment Production

---

## 🛠️ เทคโนโลยีหลักที่ใช้ (Tech Stack)

- **Runtime & Framework:** .NET 8 SDK (C# 12)
- **Architecture Pattern:** Clean Architecture + CQRS (MediatR) + Repository Pattern & Unit of Work
- **Database & ORM:** SQL Server 2022 / Entity Framework Core 8
- **Validation:** FluentValidation
- **Authentication & Security:** JWT (JSON Web Token) + BCrypt Hashing
- **Documentation:** Swagger / OpenAPI 3.0 & Postman Compatible
- **Testing:** xUnit, Moq, FluentAssertions

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. สิ่งที่ต้องเตรียม (Prerequisites)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker & Docker Compose](https://www.docker.com/) (สำหรับรัน SQL Server Instance)

### 2. การตั้งค่า Environment Variables
โปรเจกต์รองรับการอ่าน Configuration จากไฟล์ `.env` หรือ `.env.local`

```bash
# คัดลอก Template Configuration
cp .env.example .env.local
```

ตัวอย่างการตั้งค่าใน `.env.local`:
```env
CONNECTIONSTRINGS__DEFAULTCONNECTION="Server=localhost,1433;Database=NatureMiniPlexDb;User Id=sa;Password=YourStrongPassw0rd!;TrustServerCertificate=True;"
JWT__SECRETKEY="YourSuperSecretKeyWithMinimumLengthOf256BitsForSecurity!"
JWT__ISSUER="NatureMiniPlexAPI"
JWT__AUDIENCE="NatureMiniPlexClient"
```

### 3. การทำ Database Migration
รันคำสั่ง EF Core Migration เพื่อสร้าง Database Schema และ Index ทั้งหมด:

```bash
# รันผ่าน CLI (Linux / macOS / PowerShell)
dotnet ef database update --project src/Infrastructure/NatureMiniPlex.Infrastructure.csproj --startup-project src/API/NatureMiniPlex.API.csproj
```

### 4. การรัน Application
```bash
cd src/API
dotnet run
```

- **Swagger UI:** [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **Base HTTP Endpoint:** `http://localhost:5000/api`

---

## 📁 โครงสร้างโฟลเดอร์ (Directory Structure)

```text
backend/
├── src/
│   ├── Core/
│   │   ├── Domain/              # Entities, Value Objects, Domain Exceptions, Enums
│   │   └── Application/         # CQRS Commands/Queries, DTOs, Interfaces, Validators
│   ├── Infrastructure/          # EF Core DbContext, Repositories, JWT Auth, Migration
│   └── API/                     # REST Controllers, Middlewares, Program.cs Setup
├── tests/                       # Unit Tests & Integration Tests
├── README.md                    # เอกสารภาพรวมโปรเจกต์ (ไฟล์นี้)
├── ARCHITECTURE.md              # เอกสารการออกแบบสถาปัตยกรรมและ Concurrency Strategy
└── API_DOCS.md                  # สเปก RESTful API Endpoints ทั้งหมด
```

---

## 🧪 การรันชุดทดสอบ (Running Tests)

```bash
# รัน Unit Tests ทั้งหมดใน Solution
dotnet test
```

---

## 🌊 การจัดการ Branch & Git Workflow
- ใช้มาตรฐาน **Git Flow** (`main`, `develop`, `feature/*`, `bugfix/*`)
- ทุก Pull Request ต้องผ่านการ Build และ Unit Test pass 100% ก่อน Merge เข้าสู่ `develop`
