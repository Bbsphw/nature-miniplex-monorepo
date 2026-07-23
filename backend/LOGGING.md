# 📝 Nature MiniPlex — Action Logs (Audit Trail) & Security Specification

เอกสารข้อกำหนดสถาปัตยกรรมระบบ **Action Logs (Audit Trail)** สำหรับระบบ Nature MiniPlex เพื่อตอบโจทย์มาตรฐานความปลอดภัย **ISO 27001** และการคุ้มครองข้อมูลส่วนบุคคล **PDPA (Thailand Personal Data Protection Act)**

---

## 1. 🛡️ Overview & Regulatory Compliance

ระบบ Action Logs ทำหน้าที่บันทึกประวัติการทำกิจกรรมสำคัญของพนักงานและผู้ดูแลระบบ (เช่น การจองตั๋ว, การยกเลิกตั๋ว, การปรับเปลี่ยนบทบาท/สิทธิ์) เพื่อวัตถุประสงค์ในการตรวจสอบย้อนหลัง (Non-repudiation & System Auditing)

### หลักการสำคัญ (Core Principles)

1. **Answer the 5 Ws (Who, What, Where, When, How):** ทุก Log บันทึกระบุชัดเจนว่าใครทำอะไร ที่ไหน เมื่อไหร่ อย่างไร
2. **PDPA Data Masking (Less is More):** ไม่บันทึก Plain-text Sensitive Data (รหัสผ่าน, หมายเลขบัตรเครดิต, Token) และทำการ Mask ข้อมูล PII เช่น Email (`u***r@domain.com`) และ Phone (`xxx-xxx-1234`)
3. **Storage Isolation & Anti-Tampering (ISO 27001):** แยกแวยจัดเก็บ Log ในลักษณะ Append-Only Write-Only Storage ป้องกันการแก้ไขหรือลบประวัติโดยผู้ไม่ประสงค์ดี

---

## 2. 🗄️ Action Logs Data Structure (JSON/Schema)

โครงสร้างข้อมูล Action Log ถูกจัดเก็บในรูปแบบ Standardized Structured JSON ดังนี้:

```json
{
  "id": 10845,
  "log_level": "INFO",
  "timestamp": "2026-07-24T01:57:17Z",
  "actor": {
    "user_id": 42,
    "email": "m***r@natureminiplex.com",
    "role": "CINEMA_MANAGER",
    "ip_address": "192.168.1.100"
  },
  "action": {
    "action_name": "CANCEL_BOOKING",
    "method": "DELETE"
  },
  "target": {
    "target_id": "BK-2026-07-24-009",
    "target_type": "TABLE: bookings"
  },
  "detail": {
    "changes": {
      "before": {
        "bookingId": "BK-2026-07-24-009",
        "status": "CONFIRMED",
        "seats": ["A1", "A2"],
        "customerPhone": "xxx-xxx-5678"
      },
      "after": {
        "bookingId": "BK-2026-07-24-009",
        "status": "CANCELLED",
        "refundAmount": 320.00
      }
    }
  },
  "context": {
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "session_id": "0HMVN8739K10A:00000002",
    "location": "/api/bookings/BK-2026-07-24-009",
    "status_code": 200
  }
}
```

### คำอธิบาย ฟิลด์ข้อมูล (Field Definitions)

| Field Category | Key | Description | Example |
| :--- | :--- | :--- | :--- |
| **Severity** | `log_level` | ระดับความสำคัญของ Log (`INFO`, `WARNING`, `ERROR`) | `"INFO"` |
| **Actor (Who)** | `user_id` | ID ของพนักงานผู้ทำรายการ (Nullable สำหรับ Anonymous Action) | `42` |
| | `email` | อีเมลของ Actor (Masked ตาม PDPA) | `"m***r@natureminiplex.com"` |
| | `role` | บทบาทในระบบ ณ ขณะนั้น | `"CINEMA_MANAGER"` |
| | `ip_address` | Client IP Address (IPv4 / IPv6) | `"192.168.1.100"` |
| **Action (What/How)** | `action_name` | ชื่องานหรือกิจกรรม | `"CANCEL_BOOKING"` |
| | `method` | HTTP Method ที่เรียกใช้งาน | `"DELETE"` |
| **Target** | `target_id` | Identifier ของวัตถุที่ได้รับผลกระทบ | `"BK-2026-07-24-009"` |
| | `target_type` | ประเภทหรือชื่อตารางของ Entity | `"TABLE: bookings"` |
| **Detail** | `changes` | เปรียบเทียบค่า `before` และ `after` (Data Scrubbed) | `{ "before": {...}, "after": {...} }` |
| **Context (Where)** | `user_agent` | Browser / Mobile Client User Agent | `"Mozilla/5.0 ..."` |
| | `session_id` | Request Correlation Trace ID | `"0HMVN8739K10A:00000002"` |
| | `location` | API Route Endpoint Path | `"/api/bookings/12345"` |
| | `status_code` | HTTP Status Code | `200` |
| **Timestamp (When)** | `timestamp` | เวลาทำรายการตามมาตรฐาน ISO 8601 UTC | `"2026-07-24T01:57:17Z"` |

---

## 3. 🔒 Security & Compliance (PDPA & ISO 27001)

### 3.1 Data Redaction & Masking Utility (`DataRedactor`)

เพื่อป้องกันข้อมูลความลับรั่วไหล ระบบใช้งาน `DataRedactor` utility ทำการสแกนและ Redact ข้อมูลอัตโนมัติก่อนบันทึกลงฐานข้อมูล:

1. **Strict Redaction Keys (ลบเป็น `[REDACTED]` 100%):**
   - `password`, `confirmPassword`, `oldPassword`, `newPassword`
   - `creditCardNumber`, `cvv`, `cvc`, `expirationDate`
   - `token`, `accessToken`, `refreshToken`, `secret`

2. **PII Masking Rules:**
   - **Email:** แสดงเฉพาะตัวแรกและตัวท้ายของ Username เช่น `user@domain.com` -> `u***r@domain.com`
   - **Phone Number:** แสดงเฉพาะ 4 หลักสุดท้าย เช่น `0812345678` -> `xxx-xxx-5678`

### 3.2 Storage Isolation & Tamper Protection Strategy

เพื่อป้องกันเหตุการณ์ผู้บุกรุกเข้าถึงฐานข้อมูลหลักแล้วทำการลบประวัติการกระทำของตนเอง (Audit Trail Tampering):

1. **Database Role Privileges (Write-Only Isolation):**
   - Application DB Connection สำหรับบันทึก Action Logs ได้รับสิทธิ์เฉพาะ `INSERT` เท่านั้น (ห้ามสิทธิ์ `UPDATE` หรือ `DELETE`)

2. **Log Secondary Storage / Sink:**
   - ในสภาพแวดล้อม Production ระบบกำหนดสถาปัตยกรรมส่งผ่าน Log ผ่าน `IActionLogRepository` ไปยัง Append-Only Storage (เช่น AWS CloudWatch Logs, Elasticsearch, หรือ Write-Once-Read-Many (WORM) S3 Bucket)

3. **Immutability Assurance:**
   - ตาราง `ActionLogs` ไม่มี Endpoint สำหรับลบหรือแก้ไข Log สำหรับผู้ใช้งานทุกระดับ แม้กระทั่ง `SYSTEM_ADMIN`

---

## 4. ⚙️ Middleware Integration & Log Level Classification

ระบบติดตั้ง `ActionLoggingMiddleware` ไว้ใน ASP.NET Core Middleware Pipeline เพื่อดักจับทุก API Call แบบอัตโนมัติ:

### Log Level Mapping Criteria

- **`INFO` (HTTP Status 200 - 399):** การทำงานปกติสำเร็จ เช่น การเข้าสู่ระบบสำเร็จ, การสร้างตั๋ว, การยกเลิกตั๋ว
- **`WARNING` (HTTP Status 400 - 499):** การเรียกใช้งานไม่ถูกต้อง หรือปฏิเสธสิทธิ์ เช่น ป้อนรหัสผ่านผิด, ปฏิเสธสิทธิ์ `403 Forbidden`, Validation Error `400 BadRequest`
- **`ERROR` (HTTP Status 500 - 599):** ข้อผิดพลาดรุนแรงระดับ Server Error เช่น Unhandled Exceptions, Database Connection Timeout, Concurrency Conflicts

---

## 5. 🚀 Usage & Developer Guidelines

เมื่อมีการสร้าง Endpoint ใหม่ที่กระทบต่อข้อมูลสำคัญ พนักงานพัฒนาไม่ต้องเขียนโค้ดบันทึก Log ซ้ำซ้อน เนื่องจาก `ActionLoggingMiddleware` จะทำการ Capture ข้อมูล และ Scrubbing PII ให้อัตโนมัติ

หากต้องการส่ง Custom Audit Context เพิ่มเติม ให้เรียกใช้งาน `IActionLogRepository`:

```csharp
// ตัวอย่างการเรียกใช้งานใน CQRS Command Handler
await _actionLogRepository.LogAsync(new ActionLog
{
    ActionName = "MANUAL_REFUND_APPROVED",
    TargetId = booking.Id.ToString(),
    TargetType = "TABLE: bookings",
    DetailJson = DataRedactor.RedactJson(JsonSerializer.Serialize(new { refundAmount = 500 }))
});
```

---

**Last Updated:** 2026-07-24  
**Author:** Principal Backend Architect & Security Officer  
**Status:** Approved & Enforced  
