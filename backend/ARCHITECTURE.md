# 🏛️ Nature MiniPlex - Backend Architecture Specification

[⬅️ กลับสู่ Backend README](./README.md) | [📚 API Documentation](./API_DOCS.md)

เอกสารฉบับนี้อธิบายรายละเอียดเชิงลึกเกี่ยวกับการออกแบบสถาปัตยกรรม (System Architecture Design) ของระบบ **Nature MiniPlex Backend** เพื่อตอบโจทย์ด้าน **Data Consistency**, **Zero Double-Booking Guarantee**, **High Performance**, และ **Clean Architecture Principles**

---

## 1. 🏗️ สถาปัตยกรรมระดับภาพรวม (Clean Architecture Overview)

ระบบแบ่งออกเป็น 4 Layer หลักตามหลักการ **Separation of Concerns** และ **Dependency Inversion Principle (DIP)**:

```text
                     +-----------------------------------+
                     |          API / Presentation       |
                     |  (Controllers, Middlewares, Host) |
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |         Application Layer         |
                     |  (CQRS Commands/Queries, DTOs)    |
                     +--------+-----------------+--------+
                              |                 |
                              v                 v
            +-------------------+     +--------------------+
            |   Domain Layer    |     | Infrastructure Layer|
            | (Entities, Enums) | <---| (EF Core, Auth, DB)|
            +-------------------+     +--------------------+
```

### รายละเอียดแต่ละ Layer:

1. **Domain Layer (`Core/Domain`)**: 
   - เลเยอร์ศูนย์กลางที่ไม่มี Dependency ไปยังภายนอก (Zero External Dependencies)
   - ประกอบด้วย Domain Entities (`Booking`, `BookingItem`, `Showtime`, `Movie`, `Customer`), Business Exceptions (`DomainException`), และ Enums (`BookingStatus`, `ItemStatus`, `UserRole`)
   - บรรจุ Rich Domain Rules (เช่น `showtime.EnsureCanBookOrCancel()`)

2. **Application Layer (`Core/Application`)**:
   - บรรจุ Use Cases ของระบบผ่าน **CQRS Pattern** ด้วย **MediatR**
   - แยก **Commands** (การแก้ไขข้อมูล เช่น `CreateBookingCommand`, `CancelBookingCommand`) ออกจาก **Queries** (การอ่านข้อมูล เช่น `GetShowtimeSeatsQuery`)
   - ใช้ **FluentValidation** ในการตรวจประเมิน Input Validation ก่อนเข้าสู่ Handler
   - นิยาม **Interfaces** สำหรับ Repository และ External Services (`IBookingRepository`, `IUnitOfWork`, `IEmailService`)

3. **Infrastructure Layer (`Infrastructure`)**:
   - พัฒนาส่วน Data Persistence ด้วย **Entity Framework Core 8** และ **SQL Server**
   - Implement Repositories ตาม Interfaces ที่ Application Layer กำหนด
   - จัดการ Authentication (JWT Token Generation, Password Hashing ด้วย BCrypt) และ External Integrations (SMTP Email Service)

4. **API Layer (`API`)**:
   - เลเยอร์ Presentation ทางฝั่ง REST API Endpoints
   - ทำหน้าที่รับ HTTP Request, Invoke MediatR Pipeline, และส่ง HTTP Response คืนแก่ Client
   - มี **Global Exception Handling Middleware** สำหรับแปลง Unhandled Exceptions เป็นฟอร์แมต **RFC 7807 (Problem Details)**

---

## 2. ⚡ กลยุทธ์การป้องกันการจองซ้ำ (Concurrency Lock & Zero Double-Booking Strategy)

การจองตั๋วภาพยนตร์ในระบบ Nature MiniPlex ต้องรองรับ High Traffic Concurrent Requests ในกรณีภาพยนตร์ตั๋วเต็มเร็ว (Flash Sales) โดยระบบใช้ **Multi-Layer Concurrency Control Strategy**:

```text
Client Request (User A & User B จอง Seat 25 พร้อมกัน)
       |
       v
Application Level Check (Validation in Handler)
       |
       v
DB Transaction (Isolation Level: Read Committed)
       |
       v
Database Constraint: Filtered Unique Index [IX_BookingItem_Showtime_Seat_Active]
       |
       +---> User A: Success (Row Saved) -> 201 Created
       |
       +---> User B: DB Unique Violation -> Exception Handling Middleware -> 409 Conflict (ProblemDetails)
```

### 2.1 Database Level Protection (Filtered Unique Index)
ใน SQL Server เครือข่าย Database Constraint จะเป็นตัวตัดสินขั้นสุดท้าย (Ultimate Source of Truth) เพื่อการันตี Atomic Consistency:

```csharp
// Infrastructure/Persistence/ApplicationDbContext.cs
builder.Entity<BookingItem>()
    .HasIndex(bi => new { bi.ShowtimeId, bi.SeatId })
    .HasDatabaseName("IX_BookingItem_Showtime_Seat_Active")
    .IsUnique()
    .HasFilter("[ItemStatus] = 1"); // ItemStatus.Active = 1
```

- **ประโยชน์:** หากมี 2 Transactions พยายาม Insert `BookingItem` สำหรับ `ShowtimeId` และ `SeatId` เดียวกันพร้อมกัน DB Engine จะยอมให้เพียง 1 Transaction สำเร็จ ส่วนอีก Transaction จะถูก Abort ทันทีด้วย `SqlException (Error Code 2601/2627)`

### 2.2 Transaction & Pessimistic/Optimistic Locking Options
- **Optimistic Concurrency:** ใช้ Filtered Unique Index ร่วมกับ Catching `DbUpdateException` เพื่อให้เหมาะกับ Write Throughput สูงโดยไม่ต้อง Hold DB Lock เป็นเวลานาน
- **Pessimistic Locking (Alternative for High-Contention):** ในกรณีที่ต้องการ Lock ที่นั่งล่วงหน้า สามารถใช้ EF Core `FromSqlRaw` ร่วมกับ `WITH (UPDLOCK, HOLDLOCK)`:
  ```csharp
  var seat = await _dbContext.Seats
      .FromSqlRaw("SELECT * FROM Seats WITH (UPDLOCK, HOLDLOCK) WHERE Id = {0}", seatId)
      .FirstOrDefaultAsync(cancellationToken);
  ```

---

## 3. 🛡️ การรักษาความปลอดภัยและสิทธิ์การใช้งาน (Security & Auth Architecture)

1. **Authentication Flow:**
   - ผู้ใช้ล็อกอินผ่าน `POST /api/auth/login` ส่ง `Username` และ `Password`
   - ระบบตรวจสอบ Credentials ด้วย **BCrypt Password Hashing**
   - คืนค่า **JWT Access Token** (HS256 Signed) ที่มี Claims: `sub` (UserId), `unique_name` (Username), และ `role` (`Owner` หรือ `Staff`)

2. **Role-Based Access Control (RBAC):**
   - กำหนด Policy และ Attribute `[Authorize(Roles = "Owner")]` ใน Controllers สำหรับ Endpoints ที่ต้องการสิทธิ์ระดับผู้บริหาร (เช่น การเพิ่มภาพยนตร์, การดูรายงานรายได้)
   - Endpoints ฝั่ง Staff (เช่น การจองตั๋ว, การยกเลิกตั๋ว) ถูกจำกัดการเข้าถึงตามสิทธิ์ที่เหมาะสม

3. **Data Protection & Sanitization:**
   - ซ่อนข้อมูล sensitive data และไม่ส่ง Stack Trace หลุดไปยัง HTTP Response ในสภาพแวดล้อม Production
   - ป้องกัน SQL Injection 100% ด้วย EF Core Parameterized Queries

---

## 4. 🚀 Caching & Performance Optimization Strategy

1. **Movie Schedule & Showtime Caching:**
   - ข้อมูลรอบฉายภาพยนตร์ (`GET /api/movies`, `GET /api/showtimes`) เป็น read-heavy data ที่เปลี่ยนไม่บ่อย
   - ใช้ **IMemoryCache** หรือ **Redis Distributed Cache** พร้อมระบบ **Cache Invalidation** (ล้าง Cache เมื่อมีการเพิ่ม/แก้ไขภาพยนตร์หรือรอบฉาย)
2. **Database Query Optimization:**
   - ใช้ `AsNoTracking()` สำหรับ Query Operations ทั้งหมด เพื่อลด Overhead ในการทำ EF Core Change Tracker
   - ทำ Database Indexing บน Foreign Keys (`ShowtimeId`, `CustomerId`, `MovieId`) และ Field ที่ใช้ค้นหาบ่อย (`PhoneNumber`)
3. **Pagination:**
   - บังคับใช้ Server-Side Pagination (`pageNumber`, `pageSize`) ใน List Endpoints เช่น `GET /api/bookings` เพื่อป้องกันการโหลด Memory เกินขีดจำกัด (OOM)

---

## 5. 📊 Logging & Audit Trail Strategy

1. **Centralized Logging (Serilog):**
   - ใช้ **Serilog** บันทึก Log รูปแบบ **Structured JSON** ไปยัง Console, File, หรือ Log Management System (เช่น Seq, ELK Stack)
   - แนบ **Correlation ID** ในทุก HTTP Request เพื่อให้ Trace Transaction ข้าม Service ได้ง่าย
2. **Action Logging (Audit Trail):**
   - บันทึกประวัติการทำรายการสำคัญของ Staff/Owner ลงตาราง `ActionLogs` ใน Database (เช่น การสร้างรอบฉาย, การยกเลิกตั๋ว) เพื่อการตรวจสอบย้อนหลัง (Auditing)
