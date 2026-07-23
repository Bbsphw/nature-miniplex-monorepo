# 🛡️ Nature MiniPlex - Security & Actor Architecture Specification

เอกสารอธิบายสถาปัตยกรรมความปลอดภัย (Security Architecture), การแยกแยะประเภทผู้ใช้งาน (Actor Model Isolation), ระบบ **Role-Based Access Control (RBAC)** สำหรับพนักงานภายใน, และการควบคุมสิทธิ์ระดับแถวข้อมูล **Row-Level Security (RLS)** สำหรับระบบ **Nature MiniPlex**

---

## 1. 👥 การแยกแยะประเภทผู้ใช้งาน (Actor Isolation Model according to SRS)

ระบบ **Nature MiniPlex** แบ่งประเภทผู้ใช้งานออกเป็น 2 กลุ่มหลักอย่างเด็ดขาดตามข้อกำหนดทางธุรกิจ (SRS):

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. External Customers (ลูกค้าผู้จองตั๋วภาพยนตร์)                       │
│    - จัดเก็บในตาราง: Customers (Id Guid, PhoneNumber, Email)            │
│    - ไม่ต้องสมัครสมาชิกในตาราง Users หรือถือครอง System Roles               │
│    - ยืนยันตัวตนเพื่อค้นหา/ยกเลิกตั๋วผ่าน PhoneNumber                    │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 2. Internal Administrative Staff (พนักงานและผู้ดูแลระบบ)              │
│    - จัดเก็บในตาราง: Users (Id int, Username, PasswordHash, CinemaId)  │
│    - บริหารสิทธิ์แบบ Dynamic RBAC (Users, Roles, Permissions 5 Tables)   │
│    - ตัวอย่างบทบาท: SYSTEM_ADMIN, CINEMA_MANAGER, COUNTER_STAFF        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🗄️ โครงสร้างฐานข้อมูล RBAC สำหรับพนักงานภายใน (Internal Administrative RBAC)

สำหรับพนักงานและผู้บริหารระบบใช้ Relational Schema 5 ตารางหลักเพื่อความยืดหยุ่นสูง:

1. **`Users`**: จัดเก็บข้อมูลพนักงาน และ `CinemaId` สำหรับระบุโรงภาพยนตร์ของ Cinema Manager
2. **`Roles`**: บทบาทการทำงานภายใน เช่น `SYSTEM_ADMIN`, `CINEMA_MANAGER`, `COUNTER_STAFF`
3. **`Permissions`**: สิทธิ์การทำงาน เช่น `bookings:read:assigned_cinema`, `bookings:cancel:assigned_cinema`, `bookings:cancel:any`, `showtime:create`
4. **`UserRoles`**: ตารางเชื่อมโยงแบบ Many-to-Many ระหว่าง `Users` และ `Roles`
5. **`RolePermissions`**: ตารางเชื่อมโยงแบบ Many-to-Many ระหว่าง `Roles` และ `Permissions`

---

## 3. 🎯 Row-Level Security (RLS) & Customer Ownership Rules

การยกเลิกตั๋ว (`CancelBookingCommandHandler`) ถูกตรวจสอบตามบริบทของผู้ทำรายการ:

| Actor Type | Authentication & Permissions | Ownership & Scope Check |
| :--- | :--- | :--- |
| **External Customer** | Public Access (ยืนยันผ่าน PhoneNumber) | ตรวจสอบเบอร์โทรศัพท์ของผู้ขอยกเลิกต้องตรงกับ `booking.Customer.PhoneNumber` ในตาราง `Customers` เท่านั้น (ป้องกัน BOLA/IDOR) |
| **Cinema Manager** | Authenticated Staff (`bookings:cancel:assigned_cinema`) | ตรวจสอบ `showtime.CinemaId == currentUser.CinemaId` อนุญาตเฉพาะรายการในสาขาที่รับผิดชอบ |
| **System Admin** | Authenticated Admin (`bookings:cancel:any`) | อนุญาตยกเลิกตั๋วภาพยนตร์ได้ทุกสาขาในระบบ (Bypass RLS) |

---

## 4. 🛡️ Security Best Practices & Safeguards

### 4.1 Deny by Default
Endpoints ทั้งหมดสำหรับระบบหลังบ้าน (Admin/Manager APIs) ต้องผ่าน `[HasPermission("...")]` Explicit Check หากไม่มีการระบุ `[AllowAnonymous]` ระบบจะปฏิเสธการเข้าถึงทันที

### 4.2 Anti-Privilege Escalation Safeguard
บน Endpoint การอัปเดตสิทธิ์ `PUT /api/users/{id}/roles` ไม่อนุญาตให้พนักงานอัปเดต Role ของตนเอง

### 4.3 Separation of Duties (SoD)
- **Cinema Manager** ไม่สามารถจัดการผู้ใช้ หรืออัปเดตบทบาทพนักงานได้
- **External Customers** ไม่มีสิทธิ์เรียกใช้งาน Admin/Management APIs ใดๆ ทั้งสิ้น
