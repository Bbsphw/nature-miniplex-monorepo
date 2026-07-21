# 📚 Nature MiniPlex - API Reference Documentation

[⬅️ กลับสู่ Backend README](./README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📜 API Contracts](./API_CONTRACTS.md)

เอกสารฉบับนี้อธิบายรายละเอียดของ **RESTful API Endpoints** ทั้งหมดในระบบ **Nature MiniPlex Backend** รวมถึง Request/Response Payload, Authentication Headers, HTTP Status Codes, และคำอธิบายเชิงสถาปัตยกรรม

---

## 📌 ข้อมูลพื้นฐาน (Base Configuration)

- **Base URL:** `http://localhost:5000/api` (Local Development) / `https://api.natureminiplex.com/api` (Production)
- **Content-Type Header:** `application/json; charset=utf-8`
- **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`

---

## 🔐 1. Authentication Service (`/api/auth`)

### 1.1 Login (เข้าสู่ระบบสำหรับ Staff และ Owner)
- **Endpoint:** `POST /api/auth/login`
- **Security:** Public (ไม่ต้องใช้ Token)
- **Description:** ยืนยันตัวตนด้วย Username และ Password เพื่อรับ JWT Access Token

#### Request Body
```json
{
  "username": "admin",
  "password": "Password123!"
}
```

#### Response (200 OK)
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

#### Error Response (401 Unauthorized)
```json
{
  "type": "https://httpstatuses.com/401",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid username or password.",
  "instance": "/api/auth/login"
}
```

---

## 🎬 2. Movies Service (`/api/movies`)

### 2.1 Get All Active Movies
- **Endpoint:** `GET /api/movies`
- **Security:** Public
- **Description:** ดึงรายการภาพยนตร์ทั้งหมดที่เปิดใช้งาน (`IsActive = true`)

#### Response (200 OK)
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

### 2.2 Create Movie
- **Endpoint:** `POST /api/movies`
- **Security:** `Bearer Token` (Role: `Owner`)
- **Description:** เพิ่มภาพยนตร์เรื่องใหม่ลงในระบบ

#### Request Body
```json
{
  "title": "Avatar: Fire and Ash",
  "description": "The journey continues in Pandora.",
  "durationMinutes": 190,
  "releaseDate": "2026-12-18T00:00:00Z",
  "basePrice": 300.00
}
```

#### Response (201 Created)
```json
{
  "id": 2,
  "title": "Avatar: Fire and Ash",
  "basePrice": 300.00
}
```

---

## 🏢 3. Cinemas & Showtimes (`/api/cinemas`, `/api/showtimes`)

### 3.1 Get Showtimes by Movie
- **Endpoint:** `GET /api/showtimes?movieId={movieId}`
- **Security:** Public
- **Description:** ดึงรายการรอบฉายของภาพยนตร์ที่ระบุ

### 3.2 Create Showtime
- **Endpoint:** `POST /api/showtimes`
- **Security:** `Bearer Token` (Role: `Owner`)

#### Request Body
```json
{
  "cinemaId": 1,
  "movieId": 1,
  "showDateTime": "2026-07-25T14:00:00Z",
  "ticketPrice": 220.00
}
```

### 3.3 Get Showtime Seats Layout (ผังที่นั่งพร้อมสถานะ)
- **Endpoint:** `GET /api/showtimes/{id}/seats`
- **Security:** Public
- **Description:** ดึงผังที่นั่งทั้งหมดของรอบฉายนั้น พร้อมระบุสถานะว่าที่นั่งใดว่างหรือถูกจองแล้ว

#### Response (200 OK)
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

---

## 🎟️ 4. Bookings Service (`/api/bookings`)

### 4.1 Create Booking (จองตั๋วภาพยนตร์)
- **Endpoint:** `POST /api/bookings`
- **Security:** Public / Customer
- **Description:** สร้างรายการจองที่นั่ง ระบบใช้ Filtered Unique Index เพื่อการันตี **Zero Double-Booking**

#### Request Body
```json
{
  "showtimeId": 1,
  "phoneNumber": "0812345678",
  "email": "customer@example.com",
  "seatIds": [25, 26]
}
```

#### Response (201 Created)
```json
{
  "bookingId": "c8d2a6a1-9b12-4f3e-8a5c-112233445566"
}
```

#### Conflict Error (409 Conflict - เมื่อมีผู้อื่นจองที่นั่งตัดหน้า)
```json
{
  "type": "https://httpstatuses.com/409",
  "title": "Database Conflict",
  "status": 409,
  "detail": "One or more of the selected seats have already been booked by someone else.",
  "instance": "/api/bookings"
}
```

### 4.2 Get Bookings by Phone Number
- **Endpoint:** `GET /api/bookings?phoneNumber=0812345678&pageNumber=1&pageSize=10`
- **Security:** Public / Staff (สาธารณะสามารถค้นด้วยเบอร์โทรตัวเองได้ หากไม่ระบุเบอร์โทรต้องมี Token สิทธิ์ Owner/Staff)

### 4.3 Get Booking By ID
- **Endpoint:** `GET /api/bookings/{id}`
- **Security:** Public / Staff

### 4.4 Cancel Booking (ยกเลิกบิลทั้งใบ)
- **Endpoint:** `DELETE /api/bookings/{id}?phoneNumber=0812345678`
- **Security:** Public / Staff
- **Description:** ยกเลิกตั๋วทุกใบในบิล `Booking` นั้น และเปลี่ยนสถานะเป็น `Canceled`

### 4.5 Cancel Specific Booking Item (ยกเลิกตั๋วรายใบด้วย GUID)
- **Endpoint:** `DELETE /api/bookings/{id}/items/{itemId}?phoneNumber=0812345678`
- **Security:** Public / Staff
- **Description:** ยกเลิกตั๋วภาพยนตร์เฉพาะใบในบิล (Partial Cancellation)

### 4.6 Cancel Booking By Seat (ยกเลิกตั๋วจากผังที่นั่ง)
- **Endpoint:** `POST /api/bookings/cancel-seat`
- **Security:** Public / Staff
- **Description:** ยกเลิกที่นั่งโดยระบุ `ShowtimeId`, `SeatId`, และ `PhoneNumber` จากผังหน้าจอ
- **ทำไมถึงใช้ `POST` แทน `PUT`/`PATCH`/`DELETE`?:** 
  1. เป็น **Action/Command Endpoint** ที่ทำหน้าที่รับ Command Request จาก UI ผังที่นั่ง ไม่ได้เจาะจง Resource ID ใน URL Path
  2. เพื่อ **ซ่อนข้อมูลสุ่มเสี่ยง เช่น `PhoneNumber` ไว้ใน Request Body** ไม่ให้หลุดไปใน Web Server Access Logs
  3. มี Business State Side-effects & Validation ซับซ้อน ซึ่งเหมาะสมกับธรรมชาติของ `POST`

#### Request Body
```json
{
  "showtimeId": 1,
  "seatId": 25,
  "phoneNumber": "0812345678"
}
```

#### Response (200 OK)
```json
true
```

---

## 📊 5. Reports & Audit Trail (`/api/reports`, `/api/actionlogs`)

### 5.1 Get Daily Revenue Report
- **Endpoint:** `GET /api/reports/daily-revenue?date=2026-07-22`
- **Security:** `Bearer Token` (Role: `Owner`)

### 5.2 Get Action Audit Logs
- **Endpoint:** `GET /api/actionlogs?pageNumber=1&pageSize=50`
- **Security:** `Bearer Token` (Role: `Owner`)

---

## ⛔ 6. Standard Error Format (RFC 7807 Problem Details)

ทุก Error ในระบบ Backend จะส่งคืนในรูปแบบมาตรฐาน **RFC 7807 Problem Details**:

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid phone number format.; Maximum of 4 seats allowed per booking.",
  "instance": "/api/bookings"
}
```
