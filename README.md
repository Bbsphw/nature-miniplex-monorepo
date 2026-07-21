# Nature MiniPlex Monorepo 🎬

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=.net)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC292B?logo=microsoft-sql-server)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)
![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform)
![License](https://img.shields.io/badge/license-Proprietary-red)

ยินดีต้อนรับสู่ **Nature MiniPlex Monorepo**! Repository นี้จัดเก็บ Source Code ทั้งหมดสำหรับระบบจองตั๋วภาพยนตร์และระบบบริหารจัดการโรงภาพยนตร์แบบครบวงจร โดยพัฒนาด้วย Modern Stack ที่เน้น Performance, Reliability, Concurrency Protection และ Clean Architecture

---

## 📋 สารบัญ (Table of Contents)
- [ภาพรวมระบบและสถาปัตยกรรม (System Overview)](#-ภาพรวมระบบและสถาปัตยกรรม-system-overview)
- [ดรรชนีเอกสารกำกับระบบ (Documentation Index)](#-ดรรชนีเอกสารกำกับระบบ-documentation-index)
- [โครงสร้าง Monorepo (Repository Structure)](#-โครงสร้าง-monorepo-repository-structure)
- [สิ่งที่ต้องติดตั้ง (Prerequisites)](#-สิ่งที่ต้องติดตั้ง-prerequisites)
- [การตั้งค่า Environment Variables](#-การตั้งค่า-environment-variables)
- [เริ่มต้นใช้งานอย่างรวดเร็ว (Quick Start Guide)](#-เริ่มต้นใช้งานอย่างรวดเร็ว-quick-start-guide)
- [การมีส่วนร่วมในการพัฒนา (Git Flow & Contributing)](#-การมีส่วนร่วมในการพัฒนา-git-flow--contributing)
- [License](#-license)

---

## 🏗 ภาพรวมระบบและสถาปัตยกรรม (System Overview)

Nature MiniPlex ถูกออกแบบเป็นสถาปัตยกรรม **Monorepo** เพื่อให้ง่ายต่อการดูแลรักษา การสร้าง CI/CD Pipelines และการกำหนดมาตรฐานของซอฟต์แวร์:

1. **Client & Admin Web Application (Frontend):** พัฒนาด้วย Next.js 14 App Router (React, TypeScript), Zustand State Stores (`useBookingStore`, `useToastStore`, `useConfirmStore`), React Query, Tailwind CSS และ Atomic Components
2. **RESTful Web API Engine (Backend):** พัฒนาด้วย ASP.NET Core 8 บนหลักการ **Clean Architecture** แบ่งเป็น Domain, Application (CQRS/MediatR), Infrastructure (EF Core 8) และ Presentation (API Controllers/ProblemDetails Exception Middleware)
3. **High-Concurrency Seat Locking:** ใช้ Optimistic Concurrency Control ผ่าน `RowVersion` ป้องกันปัญหาการกดจองที่นั่งซ้ำซ้อน (Race Condition) 100%
4. **Infrastructure as Code & Docker Containerization:** มาพร้อม Multi-stage Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`), Docker Compose (`infra/docker/`) และ Terraform Manifests (`infra/terraform/`)

---

## 📚 ดรรชนีเอกสารกำกับระบบ (Documentation Index)

โปรเจกต์นี้มีเอกสารกำกับมาตรฐานอย่างครบถ้วนตามแต่ละส่วนงาน คุณสามารถศึกษาเพิ่มเติมได้จากลิงก์ด้านล่าง:

### 📑 Root System Specifications
- 📘 **[SRS & System Architecture Spec](./NatureMiniPlex_SRS_Architecture.md):** ข้อกำหนดระบบ SRS, ภาพรวม Clean Architecture, ระบบ Concurrency Locking และ Database Schema
- 🤝 **[CONTRIBUTING.md](./CONTRIBUTING.md):** แนวทางการมีส่วนร่วม Git Flow Branch Strategy, Conventional Commits และ PR Checklist

### ⚙️ Backend Documentation (`/backend`)
- 🏛️ **[Backend Architecture](./backend/ARCHITECTURE.md):** โครงสร้าง Clean Architecture และ CQRS Design Pattern
- 🔌 **[API Contracts](./backend/API_CONTRACTS.md):** รายละเอียด RESTful API Endpoints และ DTO Schema Spec
- 📜 **[Business Rules](./backend/BUSINESS_RULES.md):** กฎทางธุรกิจและเงื่อนไขการจองตั๋วภาพยนตร์
- 🧹 **[Coding Standards](./backend/CODING_STANDARDS.md):** มาตรฐานการเขียน C# / .NET 8
- 🗄️ **[Database Architecture](./backend/DATABASE.md):** โครงสร้างตารางและ EF Core Configuration
- 🚀 **[Deployment Guide](./backend/DEPLOYMENT.md):** คู่มือการ Deploy Backend ด้วย Docker & Cloud
- 🧪 **[Testing Strategy](./backend/TESTING.md):** แผนการทดสอบ Unit Tests และ Integration Tests

### 💻 Frontend Documentation (`/frontend`)
- 📐 **[Frontend Architecture](./frontend/ARCHITECTURE.md):** โครงสร้าง Next.js App Router และ Feature Module Directory
- 🎨 **[UI System & Design System](./frontend/UI_SYSTEM.md):** ระบบ Component, Design System, Toast และ Confirm Modals
- 🔄 **[State Management Guide](./frontend/STATE_MANAGEMENT.md):** การใช้งาน Zustand Stores และ React Query
- 📏 **[Coding Standards](./frontend/CODING_STANDARDS.md):** มาตรฐาน TypeScript & React Component Patterns
- ⚡ **[Performance & Standards](./frontend/PERFORMANCE_&_STANDARDS.md):** เทคนิคการเพิ่มประสิทธิภาพและ SEO Checklist

### ☁️ Infrastructure Documentation (`/infra`)
- 🐳 **[Infra & IaC Overview](./infra/README.md):** คู่มือ Docker Compose Orchestration และ Terraform Provisioning

---

## 📁 โครงสร้าง Monorepo (Repository Structure)

```
nature-miniplex-monorepo/
├── .github/                   # GitHub Actions Workflows & Pull Request Templates
├── backend/                   # ASP.NET Core 8 Web API (Clean Architecture)
│   ├── src/
│   │   ├── API/               # REST API Controllers & Exception Handling Middleware
│   │   ├── Core/              # Domain Models, Domain Exceptions & CQRS Use Cases
│   │   └── Infrastructure/   # Persistence, EF Core DbContext, Repositories, JWT Auth
│   ├── tests/                 # Unit & Integration Test Projects
│   └── Dockerfile             # Multi-stage Docker build for Backend
├── frontend/                  # Next.js 14 App Router Web Application
│   ├── src/
│   │   ├── app/               # Public Pages & Admin Dashboard Routing (/admin/*)
│   │   ├── components/        # SeatGrid, PaginatedMovieGrid, Toast, ConfirmModal
│   │   ├── features/          # Custom React Query Hooks per Feature Domain
│   │   ├── store/             # Zustand Global Client State Management
│   │   └── types/             # Strict TypeScript Type Specifications
│   └── Dockerfile             # Multi-stage Docker build for Frontend
├── infra/                     # Infrastructure Configuration
│   ├── docker/                # Docker Compose Services (SQL Server 2022, API, Web)
│   └── terraform/             # Terraform HCL Scripts (AWS VPC, ECS, RDS)
├── NatureMiniPlex_SRS_Architecture.md  # Core SRS & Architectural Specification
├── CONTRIBUTING.md            # Git Flow Guidelines & Contribution Rules
├── README.md                  # Monorepo Entry Point Document (เอกสารนี้)
└── .gitignore                 # Universal Monorepo Ignore Rules
```

---

## 🚀 สิ่งที่ต้องติดตั้ง (Prerequisites)

กรุณาตรวจสอบให้แน่ใจว่าได้ติดตั้งเครื่องมือเหล่านี้บนเครื่องพัฒนาก่อนเริ่มต้น:
- **Node.js:** v20.x ขึ้นไป (แนะนำ LTS)
- **pnpm:** v9.x ขึ้นไป (`npm install -g pnpm`)
- **.NET 8 SDK:** v8.0.x
- **Docker & Docker Desktop:** รองรับ Docker Compose v2+
- **Git:** v2.30+

---

## 🔐 การตั้งค่า Environment Variables

> [!IMPORTANT]
> ห้าม Commit ไฟล์ที่มีข้อมูลลับหรือรหัสผ่านลงใน Git โดยเด็ดขาด ให้คัดลอกไฟล์ตัวอย่าง `.env.example` ไปเป็น `.env.local` หรือ `.env` ในแต่ละโฟลเดอร์:

1. **Infrastructure Environment File:**
   ```bash
   cp infra/.env.example infra/.env
   ```
2. **Backend Environment File:**
   ```bash
   cp backend/.env.example backend/.env.local
   ```
3. **Frontend Environment File:**
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

---

## ⚡ เริ่มต้นใช้งานอย่างรวดเร็ว (Quick Start Guide)

### 1. Clone Repository & Switch Branch
```bash
git clone https://github.com/your-org/nature-miniplex-monorepo.git
cd nature-miniplex-monorepo
```

### 2. Start Infrastructure Services (SQL Server 2022)
รัน Docker Compose สำหรับบริการ SQL Server 2022:
```bash
cd infra/docker
docker-compose up -d
cd ../..
```

### 3. Run Backend Web API (.NET 8)
สร้างและอัปเดต Database Migrations จากนั้นเริ่มรัน API Server:
```bash
cd backend/src/API
dotnet ef database update --project ../Infrastructure
dotnet run
```
- **API URL:** [http://localhost:5000](http://localhost:5000)
- **Swagger Documentation:** [http://localhost:5000/swagger](http://localhost:5000/swagger)

### 4. Run Backend Unit Tests
เพื่อตรวจสอบความถูกต้องของ Business Rules และ Concurrency Execution Handlers:
```bash
cd backend
dotnet test
cd ..
```

### 5. Run Frontend Web App (Next.js 14)
เปิด Terminal หน้าต่างใหม่เพื่อเริ่มรัน Next.js Dev Server:
```bash
cd frontend
pnpm install
pnpm dev
```
- **Web App URL:** [http://localhost:3000](http://localhost:3000)
- **Admin Panel URL:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🤝 การมีส่วนร่วมในการพัฒนา (Git Flow & Contributing)

เราปฏิบัติตามมาตรฐาน **Git Flow** ในการพัฒนาอย่างเคร่งครัด:
- `main`: เก็บ Production Code (ห้าม Push โดยตรง)
- `develop`: กิ่งหลักสำหรับการพัฒนาและสะสม Feature
- `feature/*`: สำหรับพัฒนา Feature ใหม่
- `bugfix/*` / `refactor/*`: สำหรับแก้ไขบั๊กหรือจัดโครงสร้างโค้ด
- `release/*` / `hotfix/*`: สำหรับการเตรียมออก Release และการแก้ไขด่วน

อ่านรายละเอียดเพิ่มเติมเกี่ยวกับการเปิด Pull Request, PR Checklist และข้อตกลงได้ใน **[CONTRIBUTING.md](./CONTRIBUTING.md)**

---

## 📄 License

โปรเจกต์นี้เป็นกรรมสิทธิ์และความลับทางธุรกิจ (**Proprietary and Confidential**) ไม่อนุญาตให้ทำซ้ำ ดัดแปลง หรือเผยแพร่โค้ดใน Repository นี้โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากเจ้าของลิขสิทธิ์

---
*Maintained by Nature MiniPlex Architecture & Core Platform Team*
