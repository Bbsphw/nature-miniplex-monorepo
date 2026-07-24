# 📜 Nature MiniPlex - Business Rules & Domain Constraints Specification

[⬅️ กลับสู่ Backend README](./README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📚 API Documentation](./API_DOCS.md)

เอกสารฉบับนี้รวบรวม **Business Rules (กฎทางธุรกิจ)** และ **Domain Constraints** ทั้งหมดของระบบ **Nature MiniPlex** ตามข้อกำหนดใน **Software Requirements Specification (SRS)** เพื่อให้นักพัฒนา สถาปนิก และ QA ยึดถือปฏิบัติอย่างเคร่งครัด

---

## 1. 👥 การจัดการสิทธิ์และบทบาทผู้ใช้งาน (Role-Based Access Control - RBAC)

ระบบแยกบทบาทของผู้ใช้ระบบออกเป็น 2 ระดับหลัก (Roles) ผ่าน JWT Claims:

1. **Owner (ผู้บริหาร / เจ้าของระบบ):**
   - **สิทธิ์การทำงาน:** มีสิทธิ์เข้าถึงและทำรายการได้ทุกประเภทในระบบ (Full Permissions)
   - **Master Data Management:** สร้าง/แก้ไข/เปิด-ปิดการใช้งานข้อมูล Master Data ทั้งหมด (ภาพยนตร์ `Movies`, สาขาโรงภาพยนตร์ `Cinemas`, รอบฉาย `Showtimes`, และสร้างบัญชีพนักงาน `Users`)
   - **Financial Reports & Audit Logs:** มีสิทธิ์เรียกดูรายงานสรุปรายได้ประจำวัน (`GET /api/reports/daily-revenue`) และตรวจสอบประวัติการทำรายการ (`GET /api/actionlogs`)

2. **Staff (พนักงานหน้าเคาน์เตอร์):**
   - **สิทธิ์การทำงาน:** จำกัดเฉพาะงานปฏิบัติการหน้าเคาน์เตอร์โรงภาพยนตร์
   - **การใช้งานที่อนุญาต:** ค้นหารายการจองของลูกค้า (`GET /api/bookings`), สแกน/ยกเลิกตั๋วภาพยนตร์หน้างาน, และกดล็อก/ปลดล็อกรอบฉาย (`IsLocked = true/false`) เพื่อเปิดหรือปิดรับจองภาพยนตร์ตามความเหมาะสม
   - **ข้อห้าม:** **ไม่มีสิทธิ์** เข้าถึงหรือแก้ไข Master Data, สร้างพนักงานใหม่, หรือดูรายงานการเงินย้อนหลัง

*การบังคับใช้กฎ:* กำหนดผ่าน Attribute `[Authorize(Roles = "Owner")]` หรือ `[Authorize(Roles = "Staff,Owner")]` ใน Controllers เลเยอร์ API

---

## 2. 🎟️ กฎการจองตั๋วภาพยนตร์และการคิดราคา (Ticket Booking Rules & Pricing)

### 2.1 ข้อจำกัดการจองที่นั่ง (Seat Booking Limits)
1. **จำกัดจำนวนที่นั่งต่อการจอง:** ลูกค้า 1 เบอร์โทรศัพท์ (`PhoneNumber`) สามารถจองที่นั่งได้สูงสุด **ไม่เกิน 4 ที่นั่ง** ต่อ 1 รอบฉาย (`ShowtimeId`)
2. **การยืนยันตัวตนลูกค้า:** ระบบจำแนกลูกค้าผ่านเบอร์โทรศัพท์ (`PhoneNumber`) หากเบอร์โทรศัพท์ยังไม่มีในระบบ ระบบจะทำการสร้างข้อมูล `Customer` ให้อัตโนมัติ (Find-or-Create Pattern)
3. **การส่งยืนยัน E-Ticket:** หากลูกค้าระบุอีเมล (`Email`) ระบบจะทำการส่งอีเมลยืนยันการจองพร้อมรหัสอ้างอิง E-Ticket แบบ Asynchronous (Fire-and-Forget) เพื่อไม่ให้บล็อก Main Response Thread

### 2.2 การคำนวณราคาตั๋ว (Pricing Formula)
- ราคาตั๋วต่อใบจะอ้างอิงจาก `Showtimes.TicketPrice` ณ ขณะทำรายการจอง
- `TicketPrice` สามารถปรับเปลี่ยนจากราคาฐานภาพยนตร์ (`Movies.BasePrice`) โดย Owner เพื่อจัดโปรโมชั่นรอบฉายพิเศษ
- ราคารวมของรายการจองคำนวณจาก:
  $$\text{Total Amount} = \sum_{i=1}^{n} \text{Showtime.TicketPrice}_i$$

---

## 3. ⚡ กลยุทธ์การป้องกันการจองซ้ำ (Zero Double-Booking Guarantee)

ในสภาวะ High Concurrency (ผู้ใช้หลายคนกดจองที่นั่งเดียวกันในเวลาเดียวกัน):

1. **Filtered Unique Index Level:** กำหนด Unique Constraint บน Database SQL Server ในตาราง `BookingItem`:
   ```sql
   CREATE UNIQUE INDEX IX_BookingItem_Showtime_Seat_Active 
   ON BookingItems (ShowtimeId, SeatId) 
   WHERE ItemStatus = 1; -- Active = 1
   ```
2. **Atomic Resolution:** หากมี 2 Concurrent Requests พยายามจอง `SeatId` เดียวกันใน `ShowtimeId` เดียวกัน Transaction แรกที่ Commit จะได้รับสิทธิ์สำเร็จ ส่วน Transaction ที่สองจะถูก Reject โดย Database Engine ด้วย Constraint Violation
3. **User-Friendly Error Handling:** `ExceptionHandlingMiddleware` จะทำการ Catch `DbUpdateException` ที่มี Constraint Name ตรงกับ `IX_BookingItem_Showtime_Seat_Active` และแปลงเป็น HTTP Status `409 Conflict` พร้อมข้อความแจ้งให้ลูกค้ารีเฟรชผังที่นั่งใหม่

---

## 4. 🔄 การยกเลิกรายการและการซ่อนข้อมูล (Cancellation & Soft Deletion)

1. **Partial & Full Booking Cancellation:**
   - การยกเลิกตั๋วจะไม่ใช้การลบแถวออกจากฐานข้อมูล (Hard Delete) แต่จะปรับสถานะ `ItemStatus` ของ `BookingItem` เป็น `ItemStatus.Canceled`
   - หากตั๋วทุกใบในบิลถูกยกเลิก สถานะของ `Booking` จะเปลี่ยนเป็น `BookingStatus.Canceled`
   - ที่นั่งที่ถูกยกเลิกแล้ว จะกลับมาเป็นสถานะว่าง และสามารถเปิดให้ลูกค้ารายอื่นกดจองได้ทันที
2. **Soft Deletion for Master Data:**
   - ข้อมูล `Movies`, `Cinemas`, และ `Showtimes` ห้ามใช้คำสั่ง `DELETE` ในการลบข้อมูล
   - ให้ใช้การปรับแฟล็ก `IsActive = false` แทน เพื่อรักษา Data Integrity ของประวัติการจองและรายงานรายได้ย้อนหลัง (Historical Reporting Integrity)

---

## 5. 📑 ประวัติการทำงานและการตรวจสอบ (Audit Trail Strategy)

- ทุกการกระทำที่มีการเปลี่ยนแปลงข้อมูลสำคัญในระบบ (เช่น การสร้างภาพยนตร์, การล็อกรอบฉาย, การยกเลิกตั๋ว) จะต้องถูกบันทึกลงตาราง `ActionLogs`
- ข้อมูลใน `ActionLogs` ประกอบด้วย: `UserId` (ผู้ทำรายการ), `ActionType` (ชนิดการกระทำ), `EntityName` (ตารางเป้าหมาย), `EntityId`, และ `Timestamp` (เวลาที่ทำรายการ)
