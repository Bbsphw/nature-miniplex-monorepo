# Nature MiniPlex: Frontend RBAC Integration & Architecture Guide

เอกสารฉบับนี้อธิบายรายละเอียดสถาปัตยกรรมและการเชื่อมต่อระบบ **Role-Based Access Control (RBAC)** ฝั่ง Frontend ของโครงการ **Nature MiniPlex** (ระบบจองตั๋วภาพยนตร์) โดยมุ่งเน้นการปฏิบัติตามมาตรฐาน **Enterprise Security Best Practices** และหลักการ **Backend as Single Source of Truth (SSOT)**

---

## 🛡️ 1. Architecture Overview & SSOT Principle

ในระบบ Nature MiniPlex ฝั่ง Frontend ถูกออกแบบให้เป็น **UX Presentation Layer** เท่านั้น โดยปฏิบัติตามกฎความปลอดภัยที่ว่า **"Frontend UI hiding is NOT security"**

```
+-------------------------------------------------------------------------+
|                              CLIENT FRONTEND                            |
|                                                                         |
|  +---------------------+      +---------------------+                   |
|  |  Zustand AuthStore  | ---->|   usePermissions    |                   |
|  | (Permissions Array) |      | (Action:Resource)   |                   |
|  +---------------------+      +---------------------+                   |
|                                          |                              |
|                                          v                              |
|                              +----------------------+                   |
|                              |   PermissionGuard    |                   |
|                              |  (Hide/Disable UI)   |                   |
|                              +----------------------+                   |
|                                          |                              |
|                          Axios Interceptor (JWT Token)                  |
+------------------------------------------|------------------------------+
                                           | HTTP Request (Bearer JWT)
                                           v
+-------------------------------------------------------------------------+
|                        BACKEND API (SSOT ENFORCER)                      |
|                                                                         |
|  [JWT Authorization Filter] -> [Action-Resource Policy] -> [Database]   |
|                                                                         |
|  * Evaluates permissions on EVERY API endpoint                          |
|  * Returns 403 Forbidden if user lacks authority                        |
+-------------------------------------------------------------------------+
```

### หลักการสำคัญ (Key Security Rules):
1. **Frontend Role**: ช่วยปรับปรุง User Experience (UX) โดยการซ่อน (Hide) หรือการปิดใช้งาน (Disable) ปุ่มและเมนูที่ผู้ใช้งานไม่มีสิทธิ์ เพื่อลดความสับสนและป้องกันปัญหา Error จากการกดปุ่มที่ไม่มีสิทธิ์
2. **Backend Role (SSOT)**: ทำหน้าที่ยืนยันสิทธิ์ (Authorization Enforcement) ที่แท้จริงทุกครั้งที่มี API Request หาก User พยายาม Bypass Frontend UI (เช่น ใช้ Curl หรือ Postman) Backend API จะปฏิเสธคำขอและตอบกลับด้วย `403 Forbidden` เสมอ

---

## 📦 2. State Management with Zustand (`useAuthStore.ts`)

ระบบใช้ **Zustand** ในการบริหารจัดการ State ของการยืนยันตัวตน (Authentication) และสิทธิ์การใช้งาน (Permissions) โดยเก็บชุดข้อมูล `permissions` เป็น Array ของ Permission Codes เช่น `['bookings:read:own', 'bookings:cancel:own', 'showtime:create', 'users:manage']`

### โครงสร้างของ AuthState:
```typescript
interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  permissions: string[];
  setAuth: (auth: AuthResponse) => void;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permissionCode: string) => boolean;
  can: (action: string, resource: string) => boolean;
  logout: () => void;
}
```

### การประเมินสิทธิ์ (Permission Evaluation Logic):
- **Wildcard Admin Bypass**: หาก User มี `role === 'SYSTEM_ADMIN'` หรือ `role === 'Owner'` หรือมี permission code `*` ฟังก์ชัน `hasPermission` และ `can` จะคืนค่า `true` ทันที
- **Fine-Grained Code Checking**: ฟังก์ชัน `hasPermission('bookings:cancel:own')` จะตรวจสอบความมีอยู่ของ Permission Code ใน State
- **Action-Resource Matching**: ฟังก์ชัน `can('Cancel', 'Bookings')` จะแปลงคำค้นหาเป็น Case-Insensitive String และจับคู่กับ Resource และ Action ภายใน Permission Code List

---

## 🎣 3. Custom Hook (`usePermissions.ts`) & Component Guard (`PermissionGuard.tsx`)

### Custom Hook: `usePermissions()`
ให้นักพัฒนาสามารถเรียกใช้เพื่อตรวจสอบสิทธิ์ภายใน React Components ได้อย่างสะดวกรวดเร็ว:

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function CancelBookingButton() {
  const { hasPermission, can } = usePermissions();

  if (!hasPermission('bookings:cancel:own')) {
    return null; // Hide button if permission missing
  }

  return <button onClick={handleCancel}>Cancel Ticket</button>;
}
```

### Component-Level Guard: `<PermissionGuard>`
ช่วยควบคุมการแสดงผลของ UI Elements ในรูปแบบ Declarative Syntax โดยเลือกโหมดได้ 2 แบบ (`hide` หรือ `disable`):

```tsx
import { PermissionGuard } from '@/components/auth/PermissionGuard';

// โหมด 1: ซ่อนปุ่มเมื่อไม่มีสิทธิ์ (Hide Mode)
<PermissionGuard permission="bookings:cancel:own" fallback={<p>No permission</p>}>
  <Button onClick={handleCancel}>Cancel Ticket</Button>
</PermissionGuard>

// โหมด 2: ปิดการทำงานของปุ่มพร้อมใส่ Tooltip (Disable Mode)
<PermissionGuard permission="users:manage" mode="disable">
  <Button onClick={handleManageUsers}>Manage Cinema Users</Button>
</PermissionGuard>
```

### Higher-Order Component (HOC): `withPermission`
ใช้สำหรับครอบคุ้มครองทั้ง Component หรือ ทั้งหน้า Page:

```tsx
import { withPermission } from '@/components/auth/PermissionGuard';

const ProtectedAdminPage = withPermission(AdminDashboardComponent, 'users:manage');
```

---

## 🚀 4. Axios Interceptors Security Layer (`axios.ts`)

`axios.ts` ทำหน้าที่เป็นจุดศูนย์กลางในการจัดการ HTTP Communication และ Security Handling:

1. **Request Interceptor**:
   - ดึง JWT Token จาก `Cookies.get('admin_token')` หรือ Zustand Store
   - แนบ Header `Authorization: Bearer ${token}` ในทุกๆ Outgoing Request

2. **Response Interceptor**:
   - **`401 Unauthorized`**: หาก Token หมดอายุ หรือไม่พบการยืนยันตัวตน ระบบจะล้าง Session State (`useAuthStore.logout()`), แสดง Notification Alert และ Redirect ผู้ใช้ไปยังหน้า `/admin/login`
   - **`403 Forbidden`**: หาก Backend SSOT ปฏิเสธการเข้าถึง Axios Interceptor จะดักจับ Error และส่งแจ้งเตือน Security Notification Alert ผ่าน `sonner` Toast โดยไม่ส่งผลกระทบให้ React App State พังรวดเร็ว

---

## ⚙️ 5. Account Settings Module (`/admin/settings` & `/settings`)

โมดูลตั้งค่าบัญชีประกอบด้วย 3 แท็บหลัก:

1. **Profile Tab**: แสดงผลและแก้ไขข้อมูลผู้ใช้งาน (Username, Email, Phone Number) พร้อมรองรับการซิงค์ข้อมูลกับ Backend API `/api/users/profile`
2. **Security Tab**: จัดการเปลี่ยนรหัสผ่าน (Change Password) พร้อม Client-side Validation (ความยาวขั้นต่ำ และ Password Matching)
3. **RBAC Inspector & Playground Tab**:
   - แสดงผล Active Role และ Granted Permission Codes ทั้งหมดของผู้ใช้ในปัจจุบัน
   - มี **Interactive Test Suite** สาธิตการทำงานของ `<PermissionGuard>` ในการซ่อน/ปิดปุ่ม
   - มี **Simulate 403 Forbidden Test Button** ยิง API Requst ตรงไปยัง Protected Endpoint ของ Backend เพื่อพิสูจน์การทำงานของ Axios Interceptor และ Backend SSOT Enforcement

---

## 👥 6. Admin User & Role Control Panel (`/admin/users`)

โมดูลบริหารจัดการผู้ดูแลระบบและกำหนดสิทธิ์ (`UsersController`, `RolesController`, `ActionLogsController`) รองรับตามหลักเกณฑ์ SRS:

1. **Internal Staff User Management Tab**:
   - รายชื่อพนักงานภายใน (Internal Administrative Users) พร้อมแสดง Role Badge และ Cinema Scope (`CinemaId`) สำหรับ Row-Level Security (RLS)
   - หน้าต่าง **Create User Modal** สำหรับสร้างผู้ใช้ใหม่ (`POST /api/users`)
   - หน้าต่าง **Manage User Roles Modal** สำหรับปรับเปลี่ยน Role (`PUT /api/users/{id}/roles`)
   - **Anti-Privilege Escalation Protection**: ตรวจสอบหาก `userId` ปลายทางตรงกับ User ปัจจุบัน ระบบจะ Disable การแก้ไข Role และแสดงเตือนความปลอดภัยทันที
2. **Role & Permission Control Matrix Tab**:
   - ตารางเปิด/ปิด Permission Codes ให้แต่ละ Role (`PUT /api/roles/{id}/permissions`)
3. **Security Action Audit Logs Tab**:
   - แสดงประวัติการทำรายการสำคัญย้อนหลัง (`GET /api/actionlogs`)

---

## 📊 7. SRS Role & Permission Matrix Standard

| Resource | Action | Permission Code | CUSTOMER | CINEMA_MANAGER | SYSTEM_ADMIN |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Bookings** | Read (Own) | `bookings:read:own` | ✅ | ✅ | ✅ |
| **Bookings** | Cancel (Own) | `bookings:cancel:own` | ✅ | ✅ | ✅ |
| **Bookings** | Read (Cinema) | `bookings:read:assigned_cinema` | ❌ | ✅ | ✅ |
| **Bookings** | Cancel (Cinema) | `bookings:cancel:assigned_cinema` | ❌ | ✅ | ✅ |
| **Bookings** | Read (All) | `bookings:read:all` | ❌ | ❌ | ✅ |
| **Bookings** | Cancel (Any) | `bookings:cancel:any` | ❌ | ❌ | ✅ |
| **Showtimes**| Create | `showtime:create` | ❌ | ✅ | ✅ |
| **Users** | Manage | `users:manage` | ❌ | ❌ | ✅ |
| **Roles** | Manage | `roles:manage` | ❌ | ❌ | ✅ |

---

## 📁 8. Modified & Created Artifacts List

1. [api.ts](file:///home/khingg/nature-miniplex-monorepo/frontend/src/types/api.ts) - Extended RBAC Permission, Role, & UserProfile Interfaces
2. [useAuthStore.ts](file:///home/khingg/nature-miniplex-monorepo/frontend/src/store/useAuthStore.ts) - Extended Zustand Store for Permissions
3. [usePermissions.ts](file:///home/khingg/nature-miniplex-monorepo/frontend/src/hooks/usePermissions.ts) - Custom Fine-grained Permissions Hook
4. [PermissionGuard.tsx](file:///home/khingg/nature-miniplex-monorepo/frontend/src/components/auth/PermissionGuard.tsx) - Component Guard & HOC
5. [axios.ts](file:///home/khingg/nature-miniplex-monorepo/frontend/src/lib/axios.ts) - Interceptors for 401 & 403 Security Handling
6. [page.tsx](file:///home/khingg/nature-miniplex-monorepo/frontend/src/app/admin/users/page.tsx) - Admin User & RBAC Management Panel (3 Tabs)
7. [page.tsx](file:///home/khingg/nature-miniplex-monorepo/frontend/src/app/admin/settings/page.tsx) - Account Settings Module & RBAC Inspector Page
8. [layout.tsx](file:///home/khingg/nature-miniplex-monorepo/frontend/src/app/admin/layout.tsx) - Updated Admin Navigation Sidebar
9. [middleware.ts](file:///home/khingg/nature-miniplex-monorepo/frontend/src/middleware.ts) - Protected Routes Matcher Updates

