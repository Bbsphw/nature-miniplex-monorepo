# API Contracts & Endpoints (Nature MiniPlex)

[⬅️ กลับหน้า Backend](./README.md) | [🏠 กลับสู่หน้าหลัก](../README.md)

เอกสารฉบับนี้รวบรวมรายละเอียดของ API Endpoints ฝั่ง Backend ทั้งหมด โดยออกแบบตามมาตรฐาน RESTful API และมีการใช้ JWT Bearer Token ในการยืนยันตัวตน (Authentication)

## 📌 Base URL
- **Local Development**: `http://localhost:5000/api`
- **Content-Type**: `application/json` (สำหรับ Request/Response ทั้งหมด)

---

## 🔐 1. Authentication (`/api/auth`)

### 1.1 Login (เข้าสู่ระบบพนักงาน)
- **Endpoint**: `POST /api/auth/login`
- **Security**: Public (ไม่ต้องใช้ Token)
- **Description**: ยืนยันตัวตนด้วย Username/Password เพื่อรับ JWT Token
- **Request Payload**:
  ```json
  {
    "username": "admin",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbG...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "role": "Owner"
    }
  }
  ```
- **Error (401 Unauthorized)**: Username หรือ Password ไม่ถูกต้อง

---

## 🎬 2. Movies (`/api/movies`)

### 2.1 Get All Movies
- **Endpoint**: `GET /api/movies`
- **Security**: Public
- **Description**: ดึงรายการภาพยนตร์ทั้งหมดที่เปิดใช้งาน (IsActive = true)

### 2.2 Create Movie
- **Endpoint**: `POST /api/movies`
- **Security**: `Bearer Token` (Role: **Owner**)
- **Description**: เพิ่มภาพยนตร์เรื่องใหม่ลงในระบบ
- **Request Payload**:
  ```json
  {
    "title": "Avengers: Secret Wars",
    "startDate": "2026-05-01",
    "endDate": "2026-06-30",
    "basePrice": 250.00
  }
  ```

---

## 🏢 3. Cinemas (`/api/cinemas`)

### 3.1 Get All Cinemas
- **Endpoint**: `GET /api/cinemas`
- **Security**: Public
- **Description**: ดึงข้อมูลสาขาของโรงภาพยนตร์ทั้งหมด

### 3.2 Create Cinema
- **Endpoint**: `POST /api/cinemas`
- **Security**: `Bearer Token` (Role: **Owner**)
- **Request Payload**:
  ```json
  {
    "name": "Nature MiniPlex Sriracha",
    "totalSeats": 100
  }
  ```

---

## ⏰ 4. Showtimes (`/api/showtimes`)

### 4.1 Get Showtimes by Movie
- **Endpoint**: `GET /api/showtimes?movieId={id}`
- **Security**: Public
- **Description**: ดึงรอบฉายของภาพยนตร์ตาม ID

### 4.2 Create Showtime
- **Endpoint**: `POST /api/showtimes`
- **Security**: `Bearer Token` (Role: **Owner**)
- **Request Payload**:
  ```json
  {
    "cinemaId": 1,
    "movieId": 1,
    "showDateTime": "2026-07-25T14:00:00Z",
    "ticketPrice": 220.00
  }
  ```

### 4.3 Get Showtime Seats (ผังที่นั่ง)
- **Endpoint**: `GET /api/showtimes/{id}/seats`
- **Security**: Public
- **Description**: ดึงผังที่นั่งทั้งหมดและสถานะว่าง/จอง ของรอบฉายนั้นๆ
- **Response (200 OK)**: Array ของ `SeatId`, `RowName`, `ColumnName`, `Status`, `RowVersion`

---

## 🎟️ 5. Bookings (`/api/bookings`)

### 5.1 Create Booking (จองตั๋ว)
- **Endpoint**: `POST /api/bookings`
- **Security**: Public (หรือผูกกับ Customer Login ในอนาคต)
- **Description**: สร้างรายการจองที่นั่ง ระบบจะตรวจสอบ Concurrency ด้วย Filtered Unique Index ใน Database
- **Request Payload**:
  ```json
  {
    "phoneNumber": "0812345678",
    "showtimeId": 1,
    "seatIds": [25, 26]
  }
  ```
- **Response (200 OK)**:
  ```json
  "uuid-string"
  ```
- **Error (400 Bad Request/500 Internal)**: ที่นั่งถูกผู้อื่นจองไปแล้วระหว่างทำรายการ ระบบจะคืน `ProblemDetails` แจ้งให้ลูกค้ารีเฟรชผังที่นั่ง

---

## 👥 6. Users (`/api/users`)

### 6.1 Register User (สร้างพนักงานใหม่)
- **Endpoint**: `POST /api/users`
- **Security**: `Bearer Token` (Role: **Owner**)
- **Request Payload**:
  ```json
  {
    "username": "staff1",
    "password": "SecurePassword1!",
    "role": "Staff"
  }
  ```

---

## 📊 7. Reports & ActionLogs

### 7.1 Get Daily Revenue Report
- **Endpoint**: `GET /api/reports/daily-revenue`
- **Security**: `Bearer Token` (Role: **Owner**)

### 7.2 Get Action Logs (Audit Trail)
- **Endpoint**: `GET /api/actionlogs`
- **Security**: `Bearer Token` (Role: **Owner**)
- **Description**: ดูประวัติการกระทำของ Staff และ Owner ในระบบ

---

## ⛔ มาตรฐาน Error Response (Problem Details RFC 7807)
เมื่อเกิดข้อผิดพลาด API จะส่งคืน JSON ฟอร์แมต Problem Details เสมอ:
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "ที่นั่ง A1 ถูกจองไปแล้ว กรุณาเลือกรอบใหม่",
  "instance": "/api/bookings"
}
```
