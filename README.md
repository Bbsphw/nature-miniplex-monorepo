# Nature MiniPlex Monorepo 🎬

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=.net)
![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC292B?logo=microsoft-sql-server)
![License](https://img.shields.io/badge/license-Proprietary-red)

ยินดีต้อนรับสู่ **Nature MiniPlex** monorepo! Repository นี้เก็บ Source Code ทั้งหมดสำหรับระบบจองตั๋วโรงภาพยนตร์ Nature MiniPlex โดยถูกสร้างขึ้นด้วย Modern Stack ที่เน้น Performance, Scalability, และโครงสร้างแบบ Clean Architecture

## 📋 สารบัญ (Table of Contents)
- [ภาพรวมสถาปัตยกรรม (Architecture Overview)](#-ภาพรวมสถาปัตยกรรม-architecture-overview)
- [สิ่งที่ต้องติดตั้ง (Prerequisites)](#-สิ่งที่ต้องติดตั้ง-prerequisites)
- [เครื่องมือและเทคโนโลยี (Project Guidelines & Tooling)](#-เครื่องมือและเทคโนโลยี-project-guidelines--tooling)
- [เริ่มต้นใช้งานอย่างรวดเร็ว (Quick Start)](#-เริ่มต้นใช้งานอย่างรวดเร็ว-quick-start)
- [การมีส่วนร่วมในการพัฒนา (Contributing)](#-การมีส่วนร่วมในการพัฒนา-contributing)
- [License](#-license)

---

## 🏗 ภาพรวมสถาปัตยกรรม (Architecture Overview)

โปรเจกต์นี้จัดโครงสร้างแบบ Monorepo ซึ่งประกอบไปด้วย Components หลักๆ ดังนี้:

- **[frontend](./frontend/README.md)**: แอปพลิเคชัน Next.js (React) สำหรับส่วน User Interface (UI) หน้าบ้าน
- **[backend](./backend/README.md)**: Web API สร้างด้วย .NET 8 โดยใช้หลักการ Clean Architecture สำหรับ Business Logic และ Data Access
- **[infra](./infra/README.md)**: การตั้งค่า Infrastructure as Code (IaC) และ Deployment Configurations (เช่น Docker, Terraform)
- **[SRS & Architecture](./NatureMiniPlex_SRS_Architecture.md)**: เอกสารข้อกำหนดระบบ (SRS) และสถาปัตยกรรมแบบละเอียด

## 🚀 สิ่งที่ต้องติดตั้ง (Prerequisites)

ก่อนเริ่มใช้งาน กรุณาตรวจสอบให้แน่ใจว่าคุณได้ติดตั้งเครื่องมือเหล่านี้ในเครื่องแล้ว:
- [Node.js](https://nodejs.org/) (แนะนำ v20+)
- [pnpm](https://pnpm.io/) (v9+)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

## 🛠 เครื่องมือและเทคโนโลยี (Project Guidelines & Tooling)

โปรเจกต์นี้ขับเคลื่อนด้วยเทคโนโลยีหลักดังนี้:
- **Frontend**: Next.js App Router, Tailwind CSS, Zustand (สำหรับ Global Client State), React Query (สำหรับ Data Fetching)
- **Backend**: ASP.NET Core 8 Web API, Entity Framework (EF) Core 8
- **Database**: SQL Server 2022 (พร้อม Optimistic Concurrency สำหรับระบบจอง)
- **Infrastructure**: Docker Compose สำหรับจำลองระบบ Local Development
- **Secrets Management**: ใช้ระบบ `.env`, `.env.local` เพื่อแยกเก็บข้อมูลความลับออกจาก Source Control อย่างเคร่งครัดตามหลัก Twelve-Factor App

## ⚡ เริ่มต้นใช้งานอย่างรวดเร็ว (Quick Start)

### 1. Clone the repository
```bash
git clone https://github.com/your-org/nature-miniplex-monorepo.git
cd nature-miniplex-monorepo
```

### 2. ตั้งค่า Environment Variables (Secrets)
> [!IMPORTANT]
> ระบบต้องการไฟล์ `.env` สำหรับเชื่อมต่อ Database และ API ห้ามข้ามขั้นตอนนี้

- **Infrastructure**: คัดลอก `infra/.env.example` ไปเป็น `infra/.env` (และตรวจสอบพอร์ตต่างๆ)
- **Backend**: คัดลอก `backend/.env.example` ไปเป็น `backend/.env.local`
- **Frontend**: คัดลอก `frontend/.env.example` ไปเป็น `frontend/.env.local`

### 3. Start the Infrastructure (Database)
เราใช้ Docker Compose สำหรับรัน SQL Server:
```bash
cd infra
docker-compose up -d
cd ..
```

### 4. Run the Backend (API)
เมื่อ Database รันอยู่ ให้ทำการอัปเดต Migrations และรัน .NET API:
```bash
cd backend/src/NatureMiniPlex.Api
dotnet ef database update --project ../NatureMiniPlex.Infrastructure --startup-project .
dotnet run
```
API จะรันอยู่ที่ [http://localhost:5000](http://localhost:5000) สามารถเข้าถึง Swagger UI ได้ที่ [http://localhost:5000/swagger](http://localhost:5000/swagger)

### 5. Run the Tests (Backend)
เพื่อทดสอบความถูกต้องของ Business Logic และ Concurrency Rules สำหรับการจองตั๋ว:
```bash
cd backend
dotnet test
```

### 6. Run the Frontend (Web App)
เปิด Terminal หน้าต่างใหม่ (แนะนำให้รันใน WSL) ทำการติดตั้ง Dependencies และเริ่ม Next.js Dev Server:
```bash
cd frontend
pnpm install
pnpm dev
```
แอปพลิเคชันหน้าบ้านจะรันอยู่ที่ [http://localhost:3000](http://localhost:3000)

---

## 🤝 การมีส่วนร่วมในการพัฒนา (Contributing)

ทีมเรายินดีต้อนรับการ Contribute จากทุกคน! กรุณาอ่านเอกสาร [CONTRIBUTING.md](./CONTRIBUTING.md) สำหรับรายละเอียดเกี่ยวกับ:
- ข้อตกลงการพัฒนา (Code of Conduct)
- กลยุทธ์การแตก Branch (Branching Strategy)
- รูปแบบ Conventional Commits
- ขั้นตอนการเปิด Pull Requests (PR) พร้อม Checklist

## 📄 License

โปรเจกต์นี้เป็นกรรมสิทธิ์และความลับทางธุรกิจ (Proprietary and Confidential) ไม่อนุญาตให้ทำซ้ำหรือคัดลอกไฟล์นี้ไม่ว่าในรูปแบบใดๆ โดยเด็ดขาด
