# Nature MiniPlex - Backend API

[⬅️ กลับสู่หน้าแรก (Back to Root)](../README.md)
Directory นี้เก็บซอร์สโค้ดของส่วน .NET 8 Web API สำหรับระบบ Nature MiniPlex ซึ่งใช้งาน Entity Framework (EF) Core 8 ในการทำ Data Access และยึดโครงสร้างแบบ **Clean Architecture** อย่างเคร่งครัด

---

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

### สิ่งที่ต้องมี (Prerequisites)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- SQL Server (รันผ่าน Docker Compose ในโฟลเดอร์ `/infra` ได้)

### การตั้งค่า Environment Variables (Secrets)
> [!WARNING]
> ระบบต้องการไฟล์ Configuration (.env.local) ในการเริ่มทำงาน โปรดตรวจสอบว่าคุณมีไฟล์นี้

1. เข้าไปที่โฟลเดอร์ `backend/`
2. คัดลอก `backend/.env.example` ไปเป็น `backend/.env.local`
3. แก้ไข `CONNECTIONSTRINGS__DEFAULTCONNECTION` และ `JWT__SECRETKEY` ตามสภาพแวดล้อม Local ของคุณ
4. *(หมายเหตุ: โปรเจกต์ .NET จะถูกตั้งค่าให้อ่านไฟล์ .env และโหลดเข้าสู่ `IConfiguration` อัตโนมัติ หรือผ่าน Docker Env)*

### การรันระบบในเครื่อง (Running Locally)

1. **Start Infrastructure**: เปิด Docker Compose ที่ `/infra`
2. **Apply Migrations**:
   สร้าง Database และ Table พื้นฐานตาม Schema ล่าสุด:
   ```bash
   # CMD / PowerShell
   dotnet ef database update --project src\NatureMiniPlex.Infrastructure --startup-project src\NatureMiniPlex.Api

   # Bash (WSL / Linux / macOS)
   dotnet ef database update --project src/NatureMiniPlex.Infrastructure --startup-project src/NatureMiniPlex.Api
   ```
3. **Start Server**:
   ```bash
   # CMD / PowerShell
   cd src\NatureMiniPlex.Api
   dotnet run

   # Bash (WSL / Linux / macOS)
   cd src/NatureMiniPlex.Api
   dotnet run
   ```
4. **API Documentation (Swagger)**:
   เปิดบราวเซอร์ไปที่ [http://localhost:5000/swagger](http://localhost:5000/swagger) เพื่อเข้าถึงและทดสอบ API Endpoints ผ่าน Swagger UI

---

## 🏗 โครงสร้างโปรเจกต์ (Clean Architecture)

โปรเจกต์แบ่งออกเป็นเลเยอร์ต่างๆ อย่างชัดเจนเพื่อให้ง่ายต่อการทดสอบและสลับเปลี่ยนเทคโนโลยี:

```text
backend/src/
├── Core/
│   ├── Domain/                        # เลเยอร์ศูนย์กลาง (Entities, Enums)
│   │   └── NatureMiniPlex.Domain.csproj
│   └── Application/                   # กฎทางธุรกิจ (Interfaces, DTOs, Features)
│       └── NatureMiniPlex.Application.csproj
├── Infrastructure/                    # ติดต่อระบบภายนอก (Database, Auth, 3rd Party)
│   └── NatureMiniPlex.Infrastructure.csproj
└── API/                               # ส่วนรับ Request (Presentation Layer)
    └── NatureMiniPlex.API.csproj
```

อ่านรายละเอียดสถาปัตยกรรมเพิ่มเติมที่: 
- 🏛️ [สถาปัตยกรรมระบบ (ARCHITECTURE.md)](./ARCHITECTURE.md)
- 🗄️ [ฐานข้อมูลและการออกแบบ (DATABASE.md)](./DATABASE.md)

---

## 🧪 การทดสอบ (Testing)
ระบบออกแบบมาให้ Testable ได้ 100% สำหรับ Core Logic การรันชุดทดสอบทั้งหมดสามารถทำได้ผ่านคำสั่ง:
```bash
# CMD / PowerShell / Bash (WSL)
dotnet test
```
*(แนะนำให้เขียน Unit Tests ครอบคลุม Application Layer เป็นหลัก)*

---

## 🌊 การจัดการสาขา (Git Flow)

โปรเจกต์นี้ใช้มาตรฐาน **Git Flow** ในการทำงาน สำหรับส่วนของ Backend:
- ห้ามแก้ไขโค้ดลงกิ่ง `main` หรือ `develop` โดยตรง
- สร้างกิ่ง `feature/*` จาก `develop` ทุกครั้งเมื่อทำฟีเจอร์ใหม่
- ทำตามข้อกำหนดการเปิด Pull Request ตามที่ระบุไว้ใน [CONTRIBUTING.md](../CONTRIBUTING.md)
