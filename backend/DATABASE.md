# สถาปัตยกรรมฐานข้อมูล & Guidelines (Database Architecture)

[⬅️ กลับหน้า Backend](./README.md) | [🏠 กลับสู่หน้าหลัก](../README.md)
เอกสารฉบับนี้อธิบายถึงมาตรฐานการใช้งาน Database, Entity Framework (EF) Core, การจัดการ Concurrency และ Data Seeding สำหรับ Backend

## 1. ฐานข้อมูลเชิงสัมพันธ์ (Relational Database - SQL Server)

เราใช้ SQL Server เป็น Database หลักของระบบ โดยมี **EF Core 8** ทำหน้าที่เป็น ORM สำหรับจัดการ Schema

### หลักการออกแบบ Schema (Schema Design Principles)
- **Normalization**: ออกแบบโครงสร้างในระดับ 3NF เป็นหลัก ยกเว้นมีเหตุผลด้าน Performance (เช่น Reporting) 
- **Fluent API Configuration**: การตั้งค่าโครงสร้างตาราง (Keys, Indexes, String Length) ต้องแยกออกไปเขียนไว้ในคลาสที่สืบทอดจาก `IEntityTypeConfiguration<T>` เสมอ **ห้ามใช้ Data Annotations (เช่น `[Required]`, `[MaxLength]`) ในคลาส Entity บน Domain Layer เด็ดขาด** เพื่อรักษาความคลีนของ Domain
- **Indexes**: เพิ่ม Indexes ในคอลัมน์ที่มีการสืบค้นบ่อย (เช่น `MovieId`, `UserId`)

### การจัดการ EF Core Migrations
ควรสร้าง Migrations ก็ต่อเมื่อการปรับเปลี่ยน Schema สมบูรณ์แล้ว
```bash
# CMD / PowerShell
dotnet ef migrations add <MigrationName> --project src\NatureMiniPlex.Infrastructure --startup-project src\NatureMiniPlex.Api
dotnet ef database update --project src\NatureMiniPlex.Infrastructure --startup-project src\NatureMiniPlex.Api

# Bash (WSL / Linux / macOS)
dotnet ef migrations add <MigrationName> --project src/NatureMiniPlex.Infrastructure --startup-project src/NatureMiniPlex.Api
dotnet ef database update --project src/NatureMiniPlex.Infrastructure --startup-project src/NatureMiniPlex.Api
```

---

## 2. การควบคุม Concurrency (Preventing Race Conditions)

ระบบจองตั๋วโรงภาพยนตร์มีโอกาสสูงมากที่ User หลายคนจะกดจองที่นั่งเดียวกันพร้อมกัน

### กลยุทธ์ที่ใช้: Filtered Unique Index ร่วมกับ RowVersion
ในการสร้างรายการจอง เราอาศัยฐานข้อมูลป้องกันการจองซ้ำผ่าน Filtered Index (ห้ามที่นั่งเดียวกันในรอบฉายเดียวกันซ้ำกันถ้าสถานะยังเป็น Active)
ส่วนการทำ Optimistic Concurrency เราใช้คอลัมน์ประเภท `RowVersion` เก็บไว้บน Entity ของ `BookingItem` สำหรับป้องกันการอัพเดทซ้อนทับกัน

ตัวอย่างโค้ดฝั่ง Infrastructure Configuration:
```csharp
public class BookingItemConfiguration : IEntityTypeConfiguration<BookingItem>
{
    public void Configure(EntityTypeBuilder<BookingItem> builder)
    {
        // สร้าง RowVersion column ป้องกัน Update ซ้อน
        builder.Property(b => b.RowVersion).IsRowVersion();
        
        // Filtered Unique Index ป้องกัน Insert ซ้ำ (Double Booking)
        builder.HasIndex(b => new { b.ShowtimeId, b.SeatId })
            .IsUnique()
            .HasFilter("[ItemStatus] = 'Active'");
    }
}
```

---

## 3. การทำ ข้อมูลจำลองตั้งต้น (Data Seeding)

เพื่อให้ Developer ทุกคนในทีมสามารถรันระบบและทดสอบได้ทันที เราควรเตรียม Data Seed สำหรับ Master Data (เช่น ประเภทที่นั่ง, โรงภาพยนตร์จำลอง, สาขา)

- **สร้างคลาส DatabaseSeeder**: สร้าง Logic ดึงและเติมข้อมูลเริ่มต้นไว้ในโฟลเดอร์ `Infrastructure/Persistence/Seeding`
- **รันอัตโนมัติเมื่อ Start**: เรียกฟังก์ชัน Seeder ภายใน `Program.cs` หลังจากสั่ง `.MigrateAsync()` สำเร็จ (ตรวจสอบให้แน่ใจว่าทำงานเฉพาะใน Environment `Development` เท่านั้น)

---

## 4. โครงสร้างฐานข้อมูล (DBML Schema)

โครงสร้างแบบละเอียดที่ใช้จริงในโปรเจกต์ NatureMiniPlex (MVP)

```dbml
Project NatureMiniPlex_MVP {
  database_type: 'SQL Server'
  Note: '''
    สถาปัตยกรรมฐานข้อมูล Nature MiniPlex (MVP) 
    - พร้อมสำหรับ Entity Framework Core 8 (Code-First)
    - Role 'Owner' จัดการ Master Data และ 'Staff' จัดการ Operation หน้างาน
    - ลูกค้าทำรายการจองผ่าน UI เองโดยใช้เบอร์โทรศัพท์
    - ป้องกัน Double Booking 100% ระดับ Database
  '''
}

// ----------------------------------------------------
// SYSTEM & AUDIT (ระบบจัดการสิทธิ์และประวัติการทำงาน)
// ----------------------------------------------------

Table Users {
  Id int [pk, increment, note: 'PK: รหัสพนักงาน (Auto Increment)']
  Username varchar(50) [unique, note: 'UNIQUE: ชื่อล็อกอินเข้าระบบหลังบ้าน']
  PasswordHash varchar(255) [note: 'รหัสผ่าน (Hashed)']
  Role varchar(20) [note: "สิทธิ์: 'Owner' (จัดการหนัง/รอบฉาย/Report) , 'Staff' (กดเริ่มฉายเท่านั้น)"]
  IsActive boolean [default: true, note: 'สถานะการทำงาน (Soft Delete)']
}

Table ActionLogs {
  Id int [pk, increment, note: 'PK: รหัส Log']
  UserId int [ref: > Users.Id, note: 'FK: พนักงานคนไหนทำรายการ (Audit Trail)']
  ActionType varchar(50) [note: "ชนิดการกระทำ เช่น 'Showtime.Lock', 'Movie.Create'"]
  EntityName varchar(50) [note: "ตารางที่เกิดการกระทำ เช่น 'Showtimes'"]
  EntityId int [note: 'ID ของข้อมูลอ้างอิง']
  Timestamp datetime [default: `GETDATE()`, note: 'เวลาที่ทำรายการ']
}

// ----------------------------------------------------
// MASTER DATA (ข้อมูลพื้นฐาน)
// ----------------------------------------------------

Table Cinemas {
  Id int [pk, increment, note: 'PK: รหัสสาขา']
  Name varchar(100) [note: "ชื่อสาขา ('ศรีราชา', 'บางแสน')"]
  TotalSeats int [note: 'จำนวนที่นั่งรวมของสาขา']
  IsActive boolean [default: true]
}

Table Seats {
  Id int [pk, increment, note: 'PK: รหัสผังที่นั่ง']
  CinemaId int [ref: > Cinemas.Id, note: 'FK: ผูกกับสาขาไหน']
  RowName varchar(5) [note: "แถว เช่น 'A', 'B'"]
  ColumnName varchar(5) [note: "คอลัมน์ เช่น '1', '2'"]
}

Table Movies {
  Id int [pk, increment, note: 'PK: รหัสภาพยนตร์']
  Title varchar(200) [unique, note: 'UNIQUE: ชื่อภาพยนตร์']
  StartDate date [note: 'วันที่เริ่มฉาย (Constraint: <= EndDate)']
  EndDate date [note: 'วันสุดท้ายที่ฉาย']
  BasePrice decimal(10,2) [note: 'ราคาตั๋วตั้งต้นของหนังเรื่องนี้ (รองรับหนัง Blockbuster)']
  IsActive boolean [default: true, note: 'Soft Delete เพื่อรักษาประวัติยอดขายย้อนหลัง (Report)']
}

// ----------------------------------------------------
// TRANSACTION DATA (ข้อมูลรอบฉายและการจอง)
// ----------------------------------------------------

Table Showtimes {
  Id int [pk, increment, note: 'PK: รหัสรอบฉาย']
  CinemaId int [ref: > Cinemas.Id, note: 'FK: ฉายที่สาขาไหน']
  MovieId int [ref: > Movies.Id, note: 'FK: ฉายเรื่องอะไร']
  ShowDateTime datetime [note: 'วันเวลาที่ฉายจริง']
  TicketPrice decimal(10,2) [note: 'ราคาขายรอบนี้ (Owner แก้ไขจาก BasePrice ได้ เพื่อจัดโปรโมชั่น)']
  IsLocked boolean [default: false, note: 'สถานะ Lock: พนักงาน Staff กดเป็น true เพื่อปิดรับจอง']
  IsActive boolean [default: true]
}

Table Customers {
  Id uuid [pk, note: 'PK: รหัสลูกค้า (Sequential GUID)']
  PhoneNumber varchar(15) [unique, note: 'UNIQUE INDEX: เบอร์โทร (อ้างอิงการจอง/ยกเลิกผ่านหน้าบ้าน)']
  Email varchar(255) [null, note: 'อีเมลของลูกค้า (Optional)']
  CreatedAt datetime [default: `GETDATE()`]
}

Table Booking {
  Id uuid [pk, note: 'PK: รหัสบิล (Header)']
  CustomerId uuid [ref: > Customers.Id, note: 'FK: บิลนี้เป็นของลูกค้ารหัสอะไร']
  BookingTime datetime [default: `GETDATE()`, note: 'เวลาที่ลูกค้ากดยืนยันบิล']
  Status varchar(20) [note: "สถานะบิลรวม เช่น 'Completed', 'Canceled'"]
}

Table BookingItem {
  Id uuid [pk, note: 'PK: รหัสตั๋วรายใบ (Line Item)']
  BookingId uuid [ref: > Booking.Id, note: 'FK: อยู่ในบิลรหัสอะไร']
  ShowtimeId int [ref: > Showtimes.Id, note: 'FK: จองรอบฉายไหน (ใช้อ้างอิงไปหาหนังและสาขา)']
  SeatId int [ref: > Seats.Id, note: 'FK: จองที่นั่งไหน']
  Price decimal(10,2) [note: 'ราคา ณ วันที่ซื้อ (ดึงจาก Showtimes.TicketPrice) เพื่อทำ Daily Revenue Report']
  ItemStatus varchar(20) [note: "สถานะ 'Active', 'Canceled' (รองรับการทำ Partial Cancellation)"]
  
  Note: '''
    🔥 ความปลอดภัยระดับ Database: 
    ต้องสร้าง Filtered Index ใน .NET (Fluent API): 
    CREATE UNIQUE INDEX IX_Showtime_Seat ON BookingItem (ShowtimeId, SeatId) WHERE ItemStatus = 'Active';
  '''
}
```
