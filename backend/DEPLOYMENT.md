# 🚀 Nature MiniPlex - Deployment & Production Operations Guide

[⬅️ กลับสู่ Backend README](./README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📚 API Documentation](./API_DOCS.md)

เอกสารฉบับนี้อธิบายกระบวนการ **Deployment**, **Containerization (Docker)**, **Environment Variables Configuration**, **Production Database Migrations**, และ **CI/CD Pipelines** สำหรับระบบ **Nature MiniPlex Backend**

---

## 1. 🔑 การจัดการตัวแปรสิ่งแวดล้อมและความลับ (Environment Variables & Secrets)

ในสภาพแวดล้อม Production **ห้าม** เก็บไฟล์ `.env.local` หรือเปิดเผย Credentials ไว้ใน Source Control โดยเด็ดขาด ต้องฉีดค่าผ่าน Environment Variables หรือ Secrets Management System (เช่น Azure Key Vault, AWS Secrets Manager, GitHub Secrets):

| ตัวแปร (Variable Name) | รายละเอียด (Description) | ตัวอย่างค่า (Example Value) |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | สภาพแวดล้อมการทำงาน | `Production` |
| `CONNECTIONSTRINGS__DEFAULTCONNECTION` | Connection String ไปยัง SQL Server | `Server=sql.prod;Database=NatureMiniPlexDb;User Id=...;Password=...;` |
| `JWT__SECRETKEY` | Secret Key สำหรับเข้ารหัส JWT (ขั้นต่ำ 256 bits) | `SuperSecretKeyForProductionMinimum32CharsLong!` |
| `JWT__ISSUER` | Issuer Domain ของ JWT Token | `https://api.natureminiplex.com` |
| `JWT__AUDIENCE` | Audience Domain ของผู้ใช้งาน | `https://natureminiplex.com` |

---

## 2. 🛢️ การอัปเดตฐานข้อมูลใน Production (Production Database Migrations)

บน Production **ไม่ควร** สั่งให้ Application รัน `.MigrateAsync()` โดยอัตโนมัติขณะ Startup เพื่อป้องกันปัญหา Schema Migration Collision เมื่อขยาย Application Replicas หลายตัว (Horizontal Scaling)

### วิธีการสร้าง SQL Migration Script สำหรับ Production:
```bash
# สร้าง SQL Script จาก Migrations ล่าสุด
dotnet ef migrations script --project src/Infrastructure/NatureMiniPlex.Infrastructure.csproj --startup-project src/API/NatureMiniPlex.API.csproj -o script.sql
```
นำไฟล์ `script.sql` ที่ได้ส่งต่อให้ Database Administrator (DBA) หรือสั่งรันผ่าน Dedicated Database Pipeline ก่อนการ Deploy API

---

## 3. 🐳 การสร้าง Docker Image (Containerization)

ระบบใช้ Multi-Stage Build ใน `Dockerfile` เพื่อให้ได้ Image มีขนาดเล็กลงและมีความปลอดภัยสูง:

### 3.1 การ Build Docker Image
```bash
# รันคำสั่ง Build จาก Root Folder ของ Backend
docker build -t nature-miniplex-api:latest .
```

### 3.2 การ Tag และ Push อิมเมจไปยัง Container Registry
```bash
docker tag nature-miniplex-api:latest myregistry.azurecr.io/nature-miniplex-api:v1.0.0
docker push myregistry.azurecr.io/nature-miniplex-api:v1.0.0
```

---

## 4. 🔄 CI/CD Automation Pipeline (GitHub Actions Workflow)

กระบวนการทำ Deployment อัตโนมัติ:

```text
[ Developer Push code to 'main' branch ]
                   │
                   ▼
     [ Step 1: Run 'dotnet build' ]
                   │
                   ▼
     [ Step 2: Run 'dotnet test' ]
                   │
                   ▼
  [ Step 3: Build & Push Docker Image ]
                   │
                   ▼
 [ Step 4: Deploy to Azure App Service / K8s ]
```

- **Health Check Verification:** เมื่อ Container เริ่มทำงาน ระบบจะส่ง HTTP GET ไปยัง `/healthz` เพื่อตรวจสอบสถานะความพร้อมของระบบ
- **Zero-Downtime Deployment:** ใช้งาน Rolling Update / Blue-Green Deployment ในการสลับ Container เวอร์ชันใหม่โดยไม่กระทบผู้ใช้งานเดิม
