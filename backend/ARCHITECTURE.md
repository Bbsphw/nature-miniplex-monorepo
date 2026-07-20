# สถาปัตยกรรมระบบ Nature MiniPlex (Backend)

[⬅️ กลับหน้า Backend](./README.md) | [🏠 กลับสู่หน้าหลัก](../README.md)
โครงสร้างโค้ดส่วนของ Backend ถูกออกแบบและพัฒนาตามหลักการของ **Clean Architecture** เพื่อช่วยให้ระบบมีความยืดหยุ่นสูง ง่ายต่อการทดสอบ (Testable) และไม่มีการยึดติดกันระหว่างเลเยอร์ต่างๆ (Decoupled)

---

## แผนภาพโครงสร้างโปรเจกต์ (Directory Structure)

```text
backend/src/
├── Core/                              # 1. เลเยอร์หลักที่เป็นศูนย์รวมธุรกิจ (Core Layer)
│   ├── Domain/                        # ภาษากลางและข้อมูลหลักของธุรกิจ
│   │   ├── Entities/                  # คลาสโมเดลข้อมูลจริง (เช่น Movie.cs, Booking.cs)
│   │   └── NatureMiniPlex.Domain.csproj
│   └── Application/                   # กฎและกระบวนการทำงานของระบบ (Use Cases)
│       ├── Interfaces/                # ตัวกำหนดพฤติกรรม (เช่น IMovieRepository, IBookingService)
│       ├── DTOs/                      # คลาสที่ใช้แลกเปลี่ยนข้อมูล
│       └── NatureMiniPlex.Application.csproj
│
├── Infrastructure/                    # 2. เลเยอร์เชื่อมต่อระบบภายนอก (Infrastructure Layer)
│   ├── Persistence/                   # การตั้งค่าฐานข้อมูล, DbContext และ Migration
│   │   └── ApplicationDbContext.cs    
│   ├── Repositories/                  # การเขียนโค้ดเพื่อดึง/บันทึกข้อมูลจริงตาม Interface ใน Application
│   └── NatureMiniPlex.Infrastructure.csproj
│
└── API/                               # 3. เลเยอร์ส่วนหน้าสำหรับรับ Request (Presentation/API Layer)
    ├── Controllers/                   # คลาสควบคุมปลายทาง HTTP (API Endpoints)
    ├── Middlewares/                   # ตัวกรอง Request/Response
    ├── Program.cs                     # จุดเริ่มต้นโปรแกรมและ Dependency Injection
    └── NatureMiniPlex.API.csproj
```

---

## แนวทางปฏิบัติที่สำคัญ (Key Practices)

### 1. Dependency Injection (DI)
- การสร้าง Object หรือเรียกใช้ Service ต่างๆ จะต้องทำผ่าน Constructor Injection เสมอ ห้ามทำการ `new` Service ขึ้นมาเองโดยเด็ดขาด
- การ Register Service จะทำที่ `Program.cs` (เลเยอร์ API) เท่านั้น 
- เพื่อความสะอาดของโค้ด แนะนำให้สร้าง Extension Methods (เช่น `services.AddInfrastructureLayer()`) ในแต่ละโปรเจกต์ แล้วค่อยนำมาเรียกใช้ที่ `Program.cs` ครั้งเดียว

### 2. Error Handling & API Responses
- **Global Exception Handling**: ห้ามใช้ `try-catch` ซ้ำซ้อนใน Controllers ระบบจะมี Global Exception Middleware เพื่อจับ Error ที่หลุดออกมาและแปลงเป็นรูปแบบมาตรฐานโดยอัตโนมัติ
- **ProblemDetails**: การ Return Error จาก API จะต้องอยู่ในฟอร์แมต **RFC 7807 (Problem Details for HTTP APIs)** เสมอ ตัวอย่างเช่น:
  ```json
  {
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
    "title": "Conflict",
    "status": 409,
    "detail": "The selected seat is already booked."
  }
  ```

### 3. ห้ามมี EF Core / SQL Logic ใน Core หรือ API
- ห้ามทำการ `using Microsoft.EntityFrameworkCore` ในเลเยอร์ `Core` เด็ดขาด ทุกการเข้าถึงข้อมูลต้องทำผ่าน `Interfaces` ที่ Application เป็นคนกำหนด (Repository Pattern)

### 4. การจัดการ Authentication (JWT)
- ระบบใช้ **JWT (JSON Web Token)** สำหรับการยืนยันตัวตน 
- การสร้าง Token และ Hashing รหัสผ่าน จะทำใน Infrastructure Layer (`src/Infrastructure/Authentication/`) และถูกเรียกใช้ผ่าน Interface จาก Application Layer
- API Endpoints จะถูกป้องกันด้วย `[Authorize]` Attribute และจัดการสิทธิ์ (Role-based access control) ผ่าน Policies

---

## การจัดการ Environment และ Secrets (Environment & Secrets Management)

เพื่อให้เป็นไปตาม Best Practice และหลักการของ **Twelve-Factor App** ระบบได้แยกการตั้งค่าที่อาจเปลี่ยนไปตามสภาพแวดล้อม (Environment) และข้อมูลความลับ (Secrets) ออกจากโค้ดโดยเด็ดขาด โดยมีการจัดการไฟล์ดังนี้:

1. **ไฟล์ `.env.example` (Template)**: เป็นเทมเพลตที่อนุญาตให้ Commit ลง Git ได้ (บอกโครงสร้างตัวแปร)
2. **ไฟล์ `.env` (Default Environment)**: เป็นตั้งค่าเริ่มต้น มักไม่แนะนำให้ Commit
3. **ไฟล์ `.env.local` (Local Override)**: เป็นตั้งค่าเฉพาะเครื่องของแต่ละคน **ห้าม Commit ลง Git โดยเด็ดขาด** (ถูก Ignore ไว้แล้ว)

*หมายเหตุ: ใน .NET สามารถโหลดค่าจาก `.env` เข้าสู่ `IConfiguration` ได้ผ่านไลบรารีอย่าง `DotNetEnv` หรือดึงมาจาก Docker Compose `environment:` ตรงๆ*
