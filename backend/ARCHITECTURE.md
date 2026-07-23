# 🏛️ Nature MiniPlex - Backend Architecture Specification

[⬅️ กลับสู่ Backend README](./README.md) | [📚 API Documentation](./API_DOCS.md) | [🛡️ Security Specs](./SECURITY.md)

เอกสารฉบับนี้อธิบายรายละเอียดเชิงลึกเกี่ยวกับการออกแบบสถาปัตยกรรม (System Architecture Design) ของระบบ **Nature MiniPlex Backend** เพื่อตอบโจทย์ด้าน **Data Consistency**, **Zero Double-Booking Guarantee**, **High Performance**, **Dynamic RBAC**, และ **Clean Architecture Principles**

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
   - ประกอบด้วย Domain Entities (`Booking`, `BookingItem`, `Showtime`, `Movie`, `Customer`, `User`, `Role`, `Permission`, `UserRole`, `RolePermission`), Business Exceptions (`DomainException`), และ Enums (`BookingStatus`, `ItemStatus`)
   - บรรจุ Rich Domain Rules

2. **Application Layer (`Core/Application`)**:
   - บรรจุ Use Cases ของระบบผ่าน **CQRS Pattern** ด้วย **MediatR**
   - แยก **Commands** (การแก้ไขข้อมูล เช่น `CreateBookingCommand`, `CancelBookingCommand`) ออกจาก **Queries** (การอ่านข้อมูล เช่น `GetShowtimeSeatsQuery`, `GetUsersQuery`)
   - ใช้ **FluentValidation** ในการตรวจประเมิน Input Validation ก่อนเข้าสู่ Handler
   - นิยาม **Interfaces** สำหรับ Repository, Auth และ External Services (`IBookingRepository`, `IUnitOfWork`, `IPermissionService`, `ICurrentUserService`)

3. **Infrastructure Layer (`Infrastructure`)**:
   - พัฒนาส่วน Data Persistence ด้วย **Entity Framework Core 8** และ **SQL Server**
   - Implement Repositories ตาม Interfaces ที่ Application Layer กำหนด
   - จัดการ Authentication (JWT Token Generation, Dynamic Permission Authorization Handler, MemoryCache Caching)

4. **API Layer (`API`)**:
   - เลเยอร์ Presentation ทางฝั่ง REST API Endpoints
   - มี **Global Exception Handling Middleware** สำหรับแปลง Unhandled Exceptions เป็นฟอร์แมต **RFC 7807 (Problem Details)** รวมถึง HTTP 401 Unauthorized และ HTTP 403 Forbidden

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
// Infrastructure/Persistence/EntityConfigurations/BookingItemConfiguration.cs
builder.Entity<BookingItem>()
    .HasIndex(bi => new { bi.ShowtimeId, bi.SeatId })
    .HasDatabaseName("IX_BookingItem_Showtime_Seat_Active")
    .IsUnique()
    .HasFilter("[ItemStatus] = 1"); // ItemStatus.Active = 1
```

---

## 3. 🛡️ การรักษาความปลอดภัยและสิทธิ์การใช้งาน (Security Architecture & Actor Isolation)

### 3.1 Actor Isolation Model (การแยกแยะประเภทผู้ใช้งานตาม SRS)
- **External Customers (ผู้ซื้อตั๋วภาพยนตร์):** จัดเก็บในตาราง `Customers` ยืนยันตัวตนผ่าน `PhoneNumber` ในการค้นหาและขอยกเลิกตั๋ว โดยไม่ต้องลงทะเบียนในตาราง `Users` หรือถือครอง System Roles
- **Internal Administrative Staff (พนักงานหลังบ้าน):** จัดเก็บในตาราง `Users` ยืนยันตัวตนด้วย Username/Password Hash และถือครองสิทธิ์ตามระบบ Dynamic RBAC

### 3.2 Dynamic Fine-Grained RBAC & Custom Policy Handler
- ยกเลิกการใช้ Hardcoded Roles (`[Authorize(Roles = "...")]`) เปลี่ยนไปใช้ **Task-Based Permission Model** ผ่าน `[HasPermission("...")]`
- **`PermissionAuthorizationHandler`**: ประเมินสิทธิ์จาก JWT Claims และ `IPermissionService` (ร่วมกับ `IMemoryCache`) โดยไม่อิงตามชื่อ Role
- **Row-Level Security (RLS):** ใน `CancelBookingCommandHandler` มีการตรวจสอบ Ownership:
  - **Customer:** ต้องมี `PhoneNumber` ตรงกับ `booking.Customer.PhoneNumber` ในตาราง `Customers`
  - **Cinema Manager:** ต้องมี Permission `bookings:cancel:assigned_cinema` และ `showtime.CinemaId == currentUser.CinemaId`
  - **System Admin:** มี Permission `bookings:cancel:any` สามารถดำเนินการได้ทุกสาขา

---

## 4. 🚀 Caching & Performance Optimization Strategy

1. **Permission & User Claims Caching:**
   - ใช้ **IMemoryCache** ใน `PermissionService` ซ่อนการ Query ตาราง RBAC ไว้ใน RAM (O(1) Access Time) พร้อมระบบ Cache Invalidation เมื่อสิทธิ์มีการเปลี่ยนแปลง
2. **Database Query Optimization:**
   - ใช้ `AsNoTracking()` สำหรับ Read-Only Operations เพื่อลด Overhead ของ EF Core Change Tracker
   - ทำ Database Indexing บน Unique Keys (`Username`, `Code`, `PhoneNumber`) และ Foreign Keys (`ShowtimeId`, `CustomerId`, `CinemaId`)
3. **Pagination:**
   - บังคับใช้ Server-Side Pagination (`pageNumber`, `pageSize`) ใน List Endpoints เช่น `GET /api/bookings`

---

## 5. 📊 Logging & Audit Trail Strategy

1. **Centralized Logging:**
   - บันทึก Log รูปแบบ **Structured JSON**
   - แนบ **Correlation ID** ในทุก HTTP Request เพื่อ Trace Transactions
2. **Action Logging (Audit Trail):**
   - บันทึกประวัติการทำรายการสำคัญของพนักงานลงตาราง `ActionLogs` ใน Database (เช่น การสร้างรอบฉาย, การยกเลิกตั๋ว) เพื่อการตรวจสอบย้อนหลัง
