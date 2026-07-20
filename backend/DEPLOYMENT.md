# การติดตั้งและนำขึ้นระบบจริง (Deployment Guide)

[⬅️ กลับหน้า Backend](./README.md) | [🏠 กลับสู่หน้าหลัก](../README.md)

ระบบ Nature MiniPlex ถูกออกแบบมาเพื่อให้เป็น Cloud-Native สามารถติดตั้งบนแพลตฟอร์มต่างๆ ที่รองรับ Docker ได้อย่างง่ายดาย

---

## 1. การจัดการ Secrets และตัวแปรสิ่งแวดล้อม (Environment Variables)

ในการขึ้นระบบจริง (Production) **ห้าม** อัปโหลดไฟล์ `.env.local` หรือเปิดเผยรหัสผ่านใน Source Code โดยเด็ดขาด 
ต้องใช้ระบบจัดการ Secrets ของเซิร์ฟเวอร์หรือคลาวด์ เช่น GitHub Secrets, Azure Key Vault, AWS Secrets Manager โดยตัวแปรที่ต้องตั้งค่ามีดังนี้:

- `ASPNETCORE_ENVIRONMENT` = `Production`
- `CONNECTIONSTRINGS__DEFAULTCONNECTION` = `Server=...;Database=...;User Id=...;Password=...;`
- `JWT__SECRETKEY` = สตริงความยาวอย่างน้อย 32 ตัวอักษร สำหรับเข้ารหัส Token
- `JWT__ISSUER` = โดเมนของ Backend (เช่น `api.natureminiplex.com`)

---

## 2. การอัปเดตฐานข้อมูล (Database Migrations)

บนโปรดักชั่น **ไม่ควร** ให้โค้ดฝั่งแอปพลิเคชันทำการ Migrate ฐานข้อมูลอัตโนมัติ (เช่นการรัน `.MigrateAsync()` ใน `Program.cs`) เนื่องจากอาจเกิดปัญหาสคริปต์ชนกันเมื่อขยายแอปพลิเคชันหลายๆ เครื่องพร้อมกัน (Multiple replicas)

### วิธีที่ถูกต้องสำหรับ Production:
1. ให้เครื่อง CI/CD รันคำสั่งสร้างสคริปต์ SQL จาก Migrations ล่าสุด:
   ```bash
   # CMD / PowerShell
   dotnet ef migrations script --project src\NatureMiniPlex.Infrastructure --startup-project src\NatureMiniPlex.Api -o script.sql

   # Bash (WSL / Linux / macOS)
   dotnet ef migrations script --project src/NatureMiniPlex.Infrastructure --startup-project src/NatureMiniPlex.Api -o script.sql
   ```
2. นำไฟล์ `script.sql` นี้ไปรันอัปเดตระบบฐานข้อมูลจริง (ผ่าน DBA หรือ Pipeline แยกเฉพาะ Database)

---

## 3. การสร้าง Docker Image (Containerization)

ระบบได้เตรียม `Dockerfile` ไว้สำหรับแพ็กตัว API ให้พร้อมสำหรับการ Deploy

1. สร้าง Image จากโฟลเดอร์ root ของ Backend:
   ```bash
   # CMD / PowerShell / Bash (WSL)
   docker build -t nature-miniplex-api:latest .
   ```
2. นำ Image ขึ้น Container Registry (เช่น Docker Hub, Azure ACR):
   ```bash
   # CMD / PowerShell / Bash (WSL)
   docker tag nature-miniplex-api:latest myregistry.azurecr.io/nature-miniplex-api:v1.0
   docker push myregistry.azurecr.io/nature-miniplex-api:v1.0
   ```

---

## 4. โครงสร้าง CI/CD Pipeline (GitHub Actions)

โดยทั่วไป ระบบจะมี Workflow อัตโนมัติ (`.github/workflows/deploy.yml`):
- **On Push (main)**:
  1. ดึงโค้ดมารัน `dotnet build` และ `dotnet test`
  2. หากผ่าน จะทำการ `docker build`
  3. ดันอิมเมจขึ้น Registry
  4. สั่งให้ Cloud Provider (เช่น Azure App Service หรือ Kubernetes) อัปเดต Image เป็นเวอร์ชันล่าสุด 
- **Rollback**: หาก API เวอร์ชันล่าสุดทำให้เกิด Error ข้อมูลจะยังคงปลอดภัย สามารถกลับไปใช้ Image เวอร์ชันก่อนหน้าใน Registry ได้ทันที
