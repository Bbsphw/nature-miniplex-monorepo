# 🗄️ Nature MiniPlex - Database Architecture & Guidelines Specification

[⬅️ กลับสู่ Backend README](./README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📚 API Documentation](./API_DOCS.md) | [🛡️ Security Specs](./SECURITY.md)

เอกสารฉบับนี้อธิบายถึงมาตรฐานสถาปัตยกรรมฐานข้อมูล (Database Architecture), การออกแบบ Schema, Entity Framework Core 8 Code-First Guidelines, กลยุทธ์การรับมือ Concurrency, และ DBML Diagram ของระบบ **Nature MiniPlex**

---

## 1. 🛢️ การออกแบบฐานข้อมูล (Relational DB Design - SQL Server 2022)

ระบบใช้ **SQL Server 2022** เป็น RDBMS หลัก และใช้ **Entity Framework Core 8** เป็น ORM หลักในการจัดการ Data Access

### หลักการออกแบบ Schema (Schema Design Principles)
1. **Third Normal Form (3NF):** ออกแบบโครงสร้างตารางอยู่ในระดับ 3NF เป็นมาตรฐาน ยกเว้นส่วนที่ทำ Denormalization เพื่อประสิทธิภาพการดึงรายงาน
2. **Dynamic RBAC 5 Tables:** แยกตารางบริหารจัดการสิทธิ์พนักงานออกเป็น 5 ตารางหลัก (`Users`, `Roles`, `Permissions`, `UserRoles`, `RolePermissions`) เพื่อลด Data Redundancy และรองรับการปรับแต่งสิทธิ์แบบ Dynamic ผ่าน Admin Panel
3. **Actor Model Isolation:** แยกตาราง `Customers` (ผู้ซื้อตั๋วภาพยนตร์ภายนอก) ออกจากตาราง `Users` (พนักงานระบบหลังบ้าน) อย่างเด็ดขาดตามข้อกำหนด SRS
4. **Fluent API Configuration:** การตั้งค่า Schema แยกออกไปเขียนในคลาสที่สืบทอดจาก `IEntityTypeConfiguration<T>` บนเลเยอร์ `Infrastructure/Persistence/EntityConfigurations/`
5. **Strict Domain Purity:** ห้ามใส่ Data Annotations (เช่น `[Required]`, `[MaxLength]`) บน Domain Entities เพื่อรักษา Domain Purity

---

## 2. ⚡ กลยุทธ์ Concurrency Control ระดับฐานข้อมูล

ในการจองตั๋วภาพยนตร์ สภาวะ Race Conditions มีโอกาสเกิดขึ้นสูง ระบบรับประกัน **Zero Double-Booking 100%** ผ่านการผสมผสานกลยุทธ์ดังนี้:

### 2.1 Filtered Unique Index (Double-Booking Prevention)
กำหนด Index พิเศษในระดับ SQL Server ในตาราง `BookingItems`:

```csharp
// Infrastructure/Persistence/EntityConfigurations/BookingItemConfiguration.cs
public class BookingItemConfiguration : IEntityTypeConfiguration<BookingItem>
{
    public void Configure(EntityTypeBuilder<BookingItem> builder)
    {
        builder.HasKey(bi => bi.Id);

        // Filtered Unique Index ป้องกันการจองที่นั่งซ้ำในรอบฉายเดียวกันเมื่อสถานะยังเป็น Active
        builder.HasIndex(bi => new { bi.ShowtimeId, bi.SeatId })
            .HasDatabaseName("IX_BookingItem_Showtime_Seat_Active")
            .IsUnique()
            .HasFilter("[ItemStatus] = 1"); // 1 = Active
    }
}
```

### 2.2 RowVersion (Optimistic Locking)
ใช้ `RowVersion` ในตาราง `BookingItems` สำหรับตรวจจับและป้องกันการอัปเดตข้อมูลซ้อนทับกัน (Concurrent Updates):

```csharp
builder.Property(bi => bi.RowVersion)
    .IsRowVersion();
```

---

## 3. 🚀 การรัน EF Core Migrations

```bash
# การสร้าง Migration ใหม่
dotnet ef migrations add <MigrationName> --project src/Infrastructure/NatureMiniPlex.Infrastructure.csproj --startup-project src/API/NatureMiniPlex.API.csproj

# การอัปเดต Schema ไปยัง Database
dotnet ef database update --project src/Infrastructure/NatureMiniPlex.Infrastructure.csproj --startup-project src/API/NatureMiniPlex.API.csproj
```

---

## 4. 📐 โครงสร้าง Schema ฐานข้อมูล (DBML Schema Specifications)

```dbml
Project NatureMiniPlex_Database {
  database_type: 'SQL Server 2022'
  Note: '''
    สถาปัตยกรรมฐานข้อมูล Nature MiniPlex
    - Entity Framework Core 8 Code-First Architecture
    - Dynamic Role-Based Access Control (RBAC 5 Tables)
    - Actor Isolation: แยก Customers (ภายนอก) และ Users (พนักงานหลังบ้าน)
    - Filtered Unique Index ป้องกัน Double-Booking 100%
  '''
}

// ----------------------------------------------------
// 1. SYSTEM & RBAC (ระบบจัดการสิทธิ์พนักงานและประวัติการทำงาน)
// ----------------------------------------------------

Table Users {
  Id int [pk, increment, note: 'PK: รหัสพนักงาน']
  Username varchar(50) [unique, not null, note: 'ชื่อผู้ใช้งาน']
  Email varchar(100) [null, note: 'อีเมลพนักงาน']
  PasswordHash varchar(255) [not null, note: 'รหัสผ่าน BCrypt Hashed']
  CinemaId int [ref: > Cinemas.Id, null, note: 'FK: สาขาที่รับผิดชอบ (สำหรับ Manager)']
  IsActive boolean [default: true, note: 'สถานะการใช้งาน']
}

Table Roles {
  Id int [pk, increment, note: 'PK: รหัสบทบาท']
  Code varchar(50) [unique, not null, note: 'รหัสอ้างอิง เช่น SYSTEM_ADMIN, CINEMA_MANAGER']
  Name nvarchar(100) [not null, note: 'ชื่อบทบาท']
  Description nvarchar(255) [null]
  IsSystemRole boolean [default: false]
}

Table Permissions {
  Id int [pk, increment, note: 'PK: รหัสสิทธิ์']
  Code varchar(100) [unique, not null, note: 'รหัสสิทธิ์ เช่น showtime:create, bookings:cancel:assigned_cinema']
  Resource varchar(50) [not null, note: 'ทรัพยากรเป้าหมาย']
  Action varchar(50) [not null, note: 'การกระทำ']
  Description nvarchar(255) [null]
}

Table UserRoles {
  UserId int [ref: > Users.Id, note: 'FK: พนักงาน']
  RoleId int [ref: > Roles.Id, note: 'FK: บทบาท']
  AssignedAt datetime [default: `GETUTCDATE()`]
}

Table RolePermissions {
  RoleId int [ref: > Roles.Id, note: 'FK: บทบาท']
  PermissionId int [ref: > Permissions.Id, note: 'FK: สิทธิ์']
  GrantedAt datetime [default: `GETUTCDATE()`]
}

Table ActionLogs {
  Id int [pk, increment, note: 'PK: รหัส Audit Log']
  UserId int [ref: > Users.Id, note: 'FK: ผู้ทำรายการ']
  ActionType varchar(50) [not null, note: "ชนิดการทำรายการ เช่น 'Showtime.Create'"]
  EntityName varchar(50) [not null, note: "ตารางเป้าหมาย"]
  EntityId int [not null, note: 'ID ข้อมูลเป้าหมาย']
  Timestamp datetime [default: `GETUTCDATE()`, note: 'เวลาทำรายการ (UTC)']
}

// ----------------------------------------------------
// 2. MASTER DATA (ข้อมูลหลัก)
// ----------------------------------------------------

Table Cinemas {
  Id int [pk, increment, note: 'PK: รหัสสาขา']
  Name varchar(100) [not null, note: 'ชื่อสาขาโรงภาพยนตร์']
  TotalSeats int [not null, note: 'จำนวนที่นั่งทั้งหมด']
  IsActive boolean [default: true]
}

Table Seats {
  Id int [pk, increment, note: 'PK: รหัสผังที่นั่ง']
  CinemaId int [ref: > Cinemas.Id, note: 'FK: ผูกกับสาขา']
  RowName varchar(5) [not null, note: "แถวที่นั่ง เช่น 'A', 'B'"]
  ColumnName varchar(5) [not null, note: "เลขที่นั่ง เช่น '1', '2'"]
}

Table Movies {
  Id int [pk, increment, note: 'PK: รหัสภาพยนตร์']
  Title varchar(200) [unique, not null, note: 'ชื่อภาพยนตร์']
  Description text [null, note: 'รายละเอียดภาพยนตร์']
  DurationMinutes int [not null, note: 'ความยาว (นาที)']
  ReleaseDate date [not null, note: 'วันที่เริ่มฉาย']
  BasePrice decimal(10,2) [not null, note: 'ราคาฐานภาพยนตร์']
  IsActive boolean [default: true, note: 'Soft Delete Flag']
}

// ----------------------------------------------------
// 3. TRANSACTION DATA (รอบฉายและการจองตั๋วภาพยนตร์)
// ----------------------------------------------------

Table Showtimes {
  Id int [pk, increment, note: 'PK: รหัสรอบฉาย']
  CinemaId int [ref: > Cinemas.Id, note: 'FK: สาขา']
  MovieId int [ref: > Movies.Id, note: 'FK: ภาพยนตร์']
  ShowDateTime datetime [not null, note: 'เวลาฉาย (UTC)']
  TicketPrice decimal(10,2) [not null, note: 'ราคาตั๋วรอบฉายนี้']
  IsLocked boolean [default: false, note: 'สถานะปิดรับจอง']
  IsActive boolean [default: true]
}

Table Customers {
  Id uuid [pk, note: 'PK: รหัสลูกค้าผู้ซื้อตั๋ว (Sequential GUID)']
  PhoneNumber varchar(15) [unique, not null, note: 'เบอร์โทรศัพท์ (Public Lookup Key)']
  Email varchar(255) [null, note: 'อีเมลลูกค้า']
  CreatedAt datetime [default: `GETUTCDATE()`]
}

Table Bookings {
  Id uuid [pk, note: 'PK: รหัสใบจอง (Header)']
  CustomerId uuid [ref: > Customers.Id, note: 'FK: ลูกค้าผู้ซื้อตั๋ว']
  BookingTime datetime [default: `GETUTCDATE()`, note: 'เวลาทำรายการ']
  Status int [not null, note: 'BookingStatus Enum (1=Completed, 2=Canceled)']
}

Table BookingItems {
  Id uuid [pk, note: 'PK: รหัสตั๋วรายใบ (Line Item)']
  BookingId uuid [ref: > Bookings.Id, note: 'FK: ใบจอง']
  ShowtimeId int [ref: > Showtimes.Id, note: 'FK: รอบฉาย']
  SeatId int [ref: > Seats.Id, note: 'FK: ที่นั่ง']
  Price decimal(10,2) [not null, note: 'ราคาขาย ณ วันที่ซื้อ']
  ItemStatus int [not null, note: 'ItemStatus Enum (1=Active, 2=Canceled)']
  RowVersion timestamp [note: 'Optimistic Concurrency RowVersion']
}
```
