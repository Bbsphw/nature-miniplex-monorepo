---
description: "Root-level agent customization for Nature MiniPlex Monorepo. Defines monorepo structure, documentation language standards, and sub-directory routing."
guidance: "Read this file first when working on the monorepo. Then read the appropriate sub-directory AGENTS.md based on your work scope."
---

# 🎬 Nature MiniPlex Monorepo — Global Agent Customization

**Purpose:** Central coordination file for all agent customizations across the Nature MiniPlex Monorepo.

---

## 📍 Monorepo Structure & Working Context

This monorepo contains three primary workspaces:

### 1. **Backend** (`/backend/`)
- **Tech Stack:** ASP.NET Core 8, Clean Architecture, CQRS (MediatR), Entity Framework Core 8, SQL Server 2022
- **Responsible Agent:** See `/backend/AGENTS.md`
- **Key Files:** `ARCHITECTURE.md`, `SECURITY.md`, `DATABASE.md`, `BUSINESS_RULES.md`

### 2. **Frontend** (`/frontend/`)
- **Tech Stack:** Next.js 16, React, TypeScript, Zustand, TanStack Query v5, Tailwind CSS v4, Radix UI
- **Responsible Agent:** See `/frontend/AGENTS.md`
- **Key Files:** `UI_SYSTEM.md`, `ARCHITECTURE.md`, `STATE_MANAGEMENT.md`, `PERFORMANCE_&_STANDARDS.md`

### 3. **Infrastructure** (`/infra/`)
- **Tech Stack:** Docker Compose, Terraform (AWS IaC), Multi-stage Dockerfiles
- **Responsible Agent:** See `/infra/AGENTS.md`
- **Key Files:** `README.md` (deployment & environment setup)

### 4. **Root Documentation** (`/`)
- **Key Files:** `README.md` (Monorepo entry point), `NatureMiniPlex_SRS_Architecture.md` (System Requirements Spec), `CONTRIBUTING.md` (Git Flow & conventions)

---

## 🌐 Documentation Language Standard: Hybrid Thai-English (Tech-Thai)

### CRITICAL RULE for All Generated Documentation:
**ALL generated code comments, documentation, and technical explanations MUST be in "Hybrid Thai-English"** (Tech-Thai format).

This means:
- **Business logic explanations:** Primarily Thai with technical terms in English
- **Code comments:** Short Thai descriptions with English variable names/technical terms
- **Documentation:** Dual-language format (Thai-first structure)
- **Examples:**
  ```csharp
  // ตรวจสอบว่ากำลังจองที่นั่งเดียวกันพร้อมกัน (Check for concurrent seat booking)
  if (existingBooking.RowVersion != expectedRowVersion)
  {
      throw new ConcurrencyException("ที่นั่งนี้ถูกจองไปแล้ว");
  }
  ```

### Exception to Tech-Thai Rule:
- **API documentation and OpenAPI/Swagger specs:** English-only (international standard)
- **External-facing error messages:** Both Thai and English (for UX)

---

## 🎯 Sub-Directory Routing & Agent Responsibilities

When working in a specific workspace, **read the corresponding sub-directory AGENTS.md file**:

| Workspace | Agent File | When to Read | Key Rules |
| --- | --- | --- | --- |
| **Backend Development** | `/backend/AGENTS.md` | Before touching `.NET` code | Clean Architecture enforcement, RBAC patterns, RLS rules |
| **Frontend Development** | `/frontend/AGENTS.md` | Before touching React/TypeScript | UI_SYSTEM compliance, toast/modal mandate, UI RBAC (hide not disable) |
| **Infrastructure & DevOps** | `/infra/AGENTS.md` | Before Docker/Terraform work | IaC best practices, multi-environment setup, secret management |

---

## 🔗 Documentation Linking Principles

### "Link, Don't Embed"
- **Reference existing docs** rather than duplicating content
- **Use markdown links** to point agents to authoritative sources
- **Maintain single source of truth** (SSOT) for each specification

### Key Documentation Index
- 📘 **System Requirements & Architecture:** `NatureMiniPlex_SRS_Architecture.md` (Functional & Non-Functional Requirements, Concurrency Strategy)
- 🤝 **Development Guidelines:** `CONTRIBUTING.md` (Git Flow, Conventional Commits, PR Checklist)
- 🏛️ **Backend Architecture:** `backend/ARCHITECTURE.md` (Clean Architecture Layers, CQRS Pattern, Concurrency Control)
- 🔌 **Backend API Contracts:** `backend/API_CONTRACTS.md` (RESTful Endpoints, DTO Schemas)
- 🛡️ **Backend Security:** `backend/SECURITY.md` (Actor Model, RBAC, RLS, Row-Level Security)
- 💼 **Backend Business Rules:** `backend/BUSINESS_RULES.md` (Booking constraints, validation rules)
- 🗄️ **Backend Database:** `backend/DATABASE.md` (Schema, Entity Relations, Indexes, Migrations)
- 📐 **Frontend Architecture:** `frontend/ARCHITECTURE.md` (Next.js App Router, Feature-Sliced Design)
- 🎨 **Frontend UI System:** `frontend/UI_SYSTEM.md` (Design Tokens, Component Rules, Toast/Modal Enforcement)
- 🔄 **Frontend State Management:** `frontend/STATE_MANAGEMENT.md` (Zustand vs React Query patterns)
- ☁️ **Infrastructure:** `infra/README.md` (Docker Compose orchestration, Terraform modules)

---

## ✅ Monorepo-Wide Invariants

These rules apply **across all workspaces** and MUST be enforced:

### 1. **No Secrets in Version Control**
- ✅ Commit: `.env.example` (with placeholder values)
- ❌ Commit: `.env`, `.env.local`, `appsettings.local.json`, anything with credentials

### 2. **Git Flow Discipline**
- `main`: Production releases only (protected branch, no direct commits)
- `develop`: Integration & staging branch (protected branch, PR reviews required)
- Feature branches: `feature/*`, `bugfix/*`, `refactor/*`, `docs/*`, `hotfix/*`
- See `CONTRIBUTING.md` for details

### 3. **Conventional Commits**
All commits must follow: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `ci`, `style`
- Co-author trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`

### 4. **Code Quality Standards**
- **Backend:** Refer to `backend/CODING_STANDARDS.md` (C#/.NET 8 conventions)
- **Frontend:** Refer to `frontend/CODING_STANDARDS.md` (TypeScript/React conventions)
- Both must pass: linting, type checking, unit tests before PR merge

### 5. **Testing & Documentation**
- Backend: `dotnet test` (Unit & Integration tests) must pass
- Frontend: TypeScript strict mode, no `any` types in production code
- Update docs when API contracts, schemas, or architecture changes

---

## 🚀 Quick Workflow for Agents

### When You Start Working:
1. **Identify your workspace:** Backend, Frontend, or Infra
2. **Read the root `README.md`** for monorepo overview
3. **Read this file** (`AGENTS.md`) for global rules
4. **Read the workspace-specific AGENTS.md** (e.g., `/backend/AGENTS.md`)
5. **Reference the authoritative documentation** linked above as needed

### For Multi-Workspace Changes:
- Understand the **data flow** end-to-end
- Start with **Backend** (API contracts), then coordinate **Frontend** (consuming those contracts)
- Ensure **Infrastructure** (`infra/`) is updated if environment variables or deployment changes occur

---

## 📞 Need Help?

Refer to:
- **Architecture questions:** Read `NatureMiniPlex_SRS_Architecture.md` (system design)
- **Git/PR questions:** Read `CONTRIBUTING.md`
- **Workspace-specific issues:** Check the sub-directory `AGENTS.md`

---

**Last Updated:** 2026-07-23  
**Maintained by:** Nature MiniPlex Architecture & Core Platform Team  
**Status:** Active & Standardized
