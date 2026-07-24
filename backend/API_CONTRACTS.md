# 📜 Nature MiniPlex - API Contracts & Endpoint Specifications

[⬅️ กลับสู่ Backend README](./README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📚 API Documentation](./API_DOCS.md)

เอกสารฉบับนี้กำหนดสัญญาของระบบ (API Contracts) สำหรับการสื่อสารระหว่าง Frontend, Mobile App, และ Third-party Services กับ **Nature MiniPlex Backend API** โดยออกแบบตามมาตรฐาน RESTful API และใช้ **JWT Bearer Token** ในการยืนยันตัวตน (Authentication)

---

## 📌 1. ข้อมูลพื้นฐาน (Global API Specifications)

- **Base URL:** `http://localhost:5000/api` (Local Development) / `https://api.natureminiplex.com/api` (Production)
- **Content-Type Header:** `application/json; charset=utf-8`
- **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`
- **API Versioning Strategy:** URL Path Segment (e.g., `/api/v1/...` หรือ `/api/...` เป็น Default Version)

---

## 🔐 2. Authentication Service (`/api/auth`)

### 2.1 Login (เข้าสู่ระบบสำหรับ Staff และ Owner)
- **Endpoint:** `POST /api/auth/login`
- **Security:** Public (No Token Required)
- **Description:** ยืนยันตัวตนด้วย Username และ Password เพื่อรับ JWT Access Token
- **Request Contract:**
  ```json
  {
    "username": "admin",
    "password": "Password123!"
  }
  ```
- **Response Contract (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "Owner"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Payload ไม่ถูกต้อง (เช่น ลืมใส่ Username หรือ Password)
  - `401 Unauthorized`: Username หรือ Password ไม่ถูกต้อง

---

## 🎬 3. Movies Service (`/api/movies`)

### 3.1 Get Active Movies (ดึงรายการภาพยนตร์ทั้งหมดที่เปิดฉาย)
- **Endpoint:** `GET /api/movies`
- **Security:** Public
- **Response Contract (200 OK):**
  ```json
  [
    {
      "id": 1,
      "title": "Nature MiniPlex: The Beginning",
      "description": "An epic adventure in cinema.",
      "durationMinutes": 120,
      "releaseDate": "2026-05-01T00:00:00Z",
      "basePrice": 250.00,
      "isActive": true
    }
  ]
  ```

### 3.2 Create Movie (เพิ่มภาพยนตร์เรื่องใหม่)
- **Endpoint:** `POST /api/movies`
- **Security:** `Bearer Token` (Role: **Owner**)
- **Request Contract:**
  ```json
  {
    "title": "Avatar: Fire and Ash",
    "description": "The journey continues in Pandora.",
    "durationMinutes": 190,
    "releaseDate": "2026-12-18T00:00:00Z",
    "basePrice": 300.00
  }
  ```
- **Response Contract (201 Created):**
  ```json
  {
    "id": 2,
    "title": "Avatar: Fire and Ash",
    "basePrice": 300.00
  }
  ```

---

## 🏢 4. Cinemas & Showtimes (`/api/cinemas`, `/api/showtimes`)

### 4.1 Get Showtimes by Movie
- **Endpoint:** `GET /api/showtimes?movieId={movieId}`
- **Security:** Public
- **Query Parameters:** `movieId` (integer, required)

### 4.2 Create Showtime (สร้างรอบฉายใหม่)
- **Endpoint:** `POST /api/showtimes`
- **Security:** `Bearer Token` (Role: **Owner**)
- **Request Contract:**
  ```json
  {
    "cinemaId": 1,
    "movieId": 1,
    "showDateTime": "2026-07-25T14:00:00Z",
    "ticketPrice": 220.00
  }
  ```

### 4.3 Get Showtime Seat Map (ดึงผังที่นั่งและสถานะการจอง)
- **Endpoint:** `GET /api/showtimes/{id}/seats`
- **Security:** Public
- **Response Contract (200 OK):**
  ```json
  [
    {
      "seatId": 25,
      "rowName": "C",
      "columnName": "5",
      "isBooked": true,
      "price": 220.00
    },
    {
      "seatId": 26,
      "rowName": "C",
      "columnName": "6",
      "isBooked": false,
      "price": 220.00
    }
  ]
  ```

### 4.4 Lock / Unlock Showtime (ล็อกหรือปลดล็อกรอบฉาย)
- **Endpoint:** `PATCH /api/showtimes/{id}/lock`
- **Security:** `Bearer Token` (Permission: `showtimes:lock` / `showtime:create`)
- **Request Contract:**
  ```json
  {
    "isLocked": false
  }
  ```
- **Description:** ล็อกรอบฉายเพื่อปิดรับจองชั่วคราว หรือปลดล็อกรอบฉายเพื่อเปิดรับจองและแก้ไขข้อมูลได้ตามปกติ (หากไม่ส่ง Body จะ Default เป็น `true`)
- **Response Contract (200 OK):**
  ```json
  true
  ```

---

## 🎟️ 5. Bookings Service (`/api/bookings`)

### 5.1 Create Booking (สร้างรายการจองตั๋วภาพยนตร์)
- **Endpoint:** `POST /api/bookings`
- **Security:** Public / Customer
- **Description:** ทำการจองที่นั่งในรอบฉายที่ระบุ ระบบตรวจจับ Double-Booking ด้วย Filtered Unique Index
- **Request Contract:**
  ```json
  {
    "showtimeId": 1,
    "phoneNumber": "0812345678",
    "email": "customer@example.com",
    "seatIds": [25, 26]
  }
  ```
- **Response Contract (201 Created):**
  ```json
  {
    "bookingId": "c8d2a6a1-9b12-4f3e-8a5c-112233445566"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: รูปแบบเบอร์โทรศัพท์ผิด หรือเลือกที่นั่งเกิน 4 ที่นั่ง
  - `409 Conflict`: ที่นั่งถูกจองไปแล้วระหว่างทำรายการ

### 5.2 Get Bookings by Phone Number (ค้นหารายการจอง)
- **Endpoint:** `GET /api/bookings?phoneNumber=0812345678&pageNumber=1&pageSize=10`
- **Security:** Public / Staff

### 5.3 Cancel Booking (ยกเลิกรายการจองตั๋ว)
- **Endpoint:** `DELETE /api/bookings/{id}?phoneNumber=0812345678`
- **Security:** Public (ยืนยันด้วยเบอร์โทรศัพท์) / Staff

---

## 📊 6. Reports & Audit Trail (`/api/reports`, `/api/actionlogs`)

### 6.1 Get Daily Revenue Report
- **Endpoint:** `GET /api/reports/daily-revenue?date=2026-07-22`
- **Security:** `Bearer Token` (Role: **Owner**)

### 6.2 Get Audit Logs
- **Endpoint:** `GET /api/actionlogs?pageNumber=1&pageSize=50`
- **Security:** `Bearer Token` (Role: **Owner**)

---

## ⛔ 7. มาตรฐาน Error Contract (RFC 7807 Problem Details)

ทุก Error HTTP Response ในระบบ Backend จะส่งคืนในรูปแบบมาตรฐาน **Problem Details (RFC 7807)**:

```json
{
  "type": "https://httpstatuses.com/409",
  "title": "Database Conflict",
  "status": 409,
  "detail": "One or more of the selected seats have already been booked by someone else.",
  "instance": "/api/bookings"
}
```
