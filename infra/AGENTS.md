---
description: "Infrastructure agent customization for Docker Compose orchestration and Terraform IaC. Enforces IaC best practices, dev/staging/prod environment separation, secure secret management, and zero hardcoded secrets."
tech_stack: "Docker & Docker Compose v2+, Terraform HCL, AWS (VPC, ECS, RDS, ALB), Multi-stage Dockerfiles"
---

# ☁️ Infrastructure Agent Customization — Docker & Terraform IaC

**See also:** [Root AGENTS.md](../AGENTS.md) for global monorepo rules.

---

## 🎯 Primary Responsibilities

When working in `/infra/`, agents MUST enforce:

1. ✅ **Infrastructure as Code Best Practices** (Declarative, Modular, Testable)
2. ✅ **Secret Management** (Zero hardcoded secrets, use `.env` / AWS Secrets Manager)
3. ✅ **Multi-Environment Separation** (dev, staging, prod with distinct configs)
4. ✅ **Docker Compose for Local Development** (Reproducible local environment)
5. ✅ **Terraform for Production IaC** (AWS provisioning, state management)
6. ✅ **Tech-Thai Documentation** (comments in Thai with English technical terms)

---

## 🏗️ Infrastructure Architecture Overview

### SRS Requirement Mapping

| SRS Requirement | Architecture Decision | Infrastructure Component |
| --- | --- | --- |
| **NFR2: Data Integrity & Concurrency** | ACID transactions, RowVersion concurrency | RDS SQL Server 2022 Multi-AZ |
| **NFR1: Performance & Scalability** | Separate tiers, autoscaling | ECS Fargate (2-10 instances) + ALB |
| **NFR3: Security & Network Isolation** | Private subnets, no direct DB access | VPC with public/private subnets |
| **NFR4: Secrets Protection** | 12-Factor Config, no hardcoded values | AWS Secrets Manager, `.env` files |
| **Developer Frictionless Mode** | One-command local setup | Docker Compose with all services |

### Infrastructure Layers

```
┌──────────────────────────────────────────────────────────┐
│                        Internet                           │
└────────────────────────────┬─────────────────────────────┘
                             ↓ HTTPS:443
                    ┌────────────────────┐
                    │  Application Load  │
                    │    Balancer (ALB)  │
                    └────────┬───────────┘
                             ↓
        ┌────────────────────────────────────────────┐
        │        AWS Virtual Private Cloud (VPC)     │
        │            10.0.0.0/16                     │
        ├────────────────────────────────────────────┤
        │   PUBLIC SUBNETS (Web Tier)                │
        │   ├─ Frontend: Next.js 16 (ECS)            │
        │   └─ Ingress only                          │
        │                                             │
        │   PRIVATE SUBNETS (App & Data Tier)        │
        │   ├─ Backend API: .NET 8 (ECS Fargate)     │
        │   │  └─ 2-10 Instances (autoscale)         │
        │   ├─ Database: RDS SQL Server 2022 Multi-AZ│
        │   ├─ Mailpit: Email capture (dev-like)     │
        │   └─ No inbound from internet              │
        └────────────────────────────────────────────┘
```

---

## 🐳 Docker Compose for Local Development

### Directory Structure

```
infra/
├── .env.example                    # ← Template (committed to VCS)
├── .env                            # ← Local values (git-ignored)
├── .gitignore                      # ← Prevent .env commit
├── docker/
│   ├── docker-compose.yml          # ← Main orchestration file
│   ├── sql-server/
│   │   ├── Dockerfile              # ← SQL Server 2022 custom image
│   │   └── init.sql                # ← Database initialization script
│   ├── backend/
│   │   └── Dockerfile              # ← Multi-stage .NET 8 build (reference from ../backend/Dockerfile)
│   └── frontend/
│       └── Dockerfile              # ← Multi-stage Next.js build (reference from ../frontend/Dockerfile)
└── terraform/
    ├── environments/
    └── modules/
```

### Docker Compose Configuration Pattern

**✅ CORRECT Pattern (`infra/docker/docker-compose.yml`):**

```yaml
version: '3.9'

services:
  # =====================================================
  # 1. SQL Server 2022 (Database Tier)
  # =====================================================
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: ${SQL_SA_PASSWORD}  # ← Injected from .env (NEVER hardcoded)
      MSSQL_PID: Express
    ports:
      - "1433:1433"  # ← Port for local development only
    volumes:
      - sqlserver_data:/var/opt/mssql/data  # ← Persistent volume
      - ./sql-server/init.sql:/docker-entrypoint-initdb.d/init.sql  # ← Init script
    networks:
      - nature-miniplex
    healthcheck:
      test: [ "CMD", "/opt/mssql-tools/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "${SQL_SA_PASSWORD}", "-Q", "SELECT 1" ]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # =====================================================
  # 2. Mailpit (Email Capture Engine for Development)
  # =====================================================
  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"   # ← SMTP port (backend sends emails here)
      - "8025:8025"   # ← Web UI (http://localhost:8025)
    networks:
      - nature-miniplex
    restart: unless-stopped

  # =====================================================
  # 3. Backend API (.NET 8 Clean Architecture)
  # =====================================================
  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile
      target: runtime  # ← Multi-stage: use runtime stage only
    environment:
      # โหลดจาก .env ไม่ hardcode (Load from .env, never hardcode)
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: "Server=sqlserver,1433;Database=${DB_NAME};User Id=sa;Password=${SQL_SA_PASSWORD};TrustServerCertificate=True"
      Jwt__Secret: ${JWT_SECRET}  # ← Secret key (stored in .env)
      Jwt__Issuer: ${JWT_ISSUER}
      Jwt__Audience: ${JWT_AUDIENCE}
      Smtp__Host: mailpit
      Smtp__Port: 1025
      Cors__AllowedOrigins: "${CORS_ALLOWED_ORIGINS}"  # ← e.g., http://localhost:3000
    ports:
      - "5000:5000"  # ← API port
    depends_on:
      sqlserver:
        condition: service_healthy  # ← Wait for DB health check
      mailpit:
        condition: service_started
    networks:
      - nature-miniplex
    restart: unless-stopped
    volumes:
      - ../../backend/src:/app/src  # ← Live reload during development

  # =====================================================
  # 4. Frontend Web App (Next.js 16)
  # =====================================================
  frontend:
    build:
      context: ../../frontend
      dockerfile: Dockerfile
      target: development  # ← Multi-stage: use dev stage with hot reload
    environment:
      # โหลดจาก .env (Load from .env)
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}  # ← e.g., http://localhost:5000
      NODE_ENV: development
    ports:
      - "3000:3000"  # ← Frontend port
    depends_on:
      - backend
    networks:
      - nature-miniplex
    restart: unless-stopped
    volumes:
      - ../../frontend/src:/app/src  # ← Live reload

# =====================================================
# Volumes (Persistent Storage)
# =====================================================
volumes:
  sqlserver_data:
    driver: local

# =====================================================
# Networks (Service Communication)
# =====================================================
networks:
  nature-miniplex:
    driver: bridge
```

### `.env.example` Template (Committed to VCS)

**✅ CORRECT Pattern:**

```env
# =============== DATABASE ===============
SQL_SA_PASSWORD=YourStrongPasswordHere_Dev123!
DB_NAME=NatureMiniPlexDb

# =============== JWT AUTHENTICATION ===============
JWT_SECRET=your-secret-key-for-development-NEVER-USE-IN-PROD
JWT_ISSUER=https://api.natureminiplex.local
JWT_AUDIENCE=https://natureminiplex.local

# =============== CORS & FRONTEND ===============
CORS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# =============== SMTP (Mailpit) ===============
SMTP_HOST=mailpit
SMTP_PORT=1025
```

### `.env` File (Git-Ignored)

**✅ CORRECT Pattern:**

```bash
# Copy from .env.example and add REAL values (kept local, never committed)
cp infra/.env.example infra/.env

# Then edit infra/.env with actual development values
```

### `.gitignore` Rules

**✅ CORRECT Pattern (`infra/.gitignore`):**

```gitignore
# ========================
# Never commit secrets
# ========================
.env
.env.local
.env.*.local
*.env
infra/.env

# ========================
# Never commit Terraform state
# ========================
terraform/**/.terraform
terraform/**/.terraform.lock.hcl
terraform/**/*.tfstate
terraform/**/*.tfstate.backup
terraform/**/*.tfvars
terraform/**/*.tfvars.json
!terraform/**/*.tfvars.example
!terraform/**/*terraform.tfvars.example

# ========================
# Docker artifacts
# ========================
docker-compose.override.yml
.docker
```

---

## 🚀 Multi-Environment Separation (Dev, Staging, Prod)

### Environment Structure

```
infra/terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf              # ← Dev environment composition
│   │   ├── terraform.tfvars     # ← Dev-specific values (git-ignored)
│   │   ├── terraform.tfvars.example
│   │   └── variables.tf         # ← Input variables
│   │
│   ├── staging/
│   │   ├── main.tf              # ← Staging environment (mirror of prod)
│   │   ├── terraform.tfvars
│   │   ├── terraform.tfvars.example
│   │   └── variables.tf
│   │
│   └── prod/
│       ├── main.tf              # ← Production environment
│       ├── terraform.tfvars     # ← Production secrets (AWS Secrets Manager)
│       ├── terraform.tfvars.example
│       └── variables.tf
│
└── modules/
    ├── app_service/             # ← ECS Fargate cluster (reusable)
    ├── database/                # ← RDS instance (reusable)
    └── networking/              # ← VPC, subnets, gateways (reusable)
```

### Terraform Module Pattern

**✅ CORRECT Pattern (`infra/terraform/environments/prod/main.tf`):**

```hcl
terraform {
  # ตั้งค่า Remote State ใน S3 เพื่อให้ทีมสามารถแชร์ state ได้ (Configure S3 remote state for team collaboration)
  backend "s3" {
    bucket         = "nature-miniplex-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true  # ← Encrypt state at rest
    dynamodb_table = "terraform-lock"  # ← Prevent concurrent modifications
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "production"
      Project     = "NatureMiniPlex"
      ManagedBy   = "Terraform"
    }
  }
}

# =====================================================
# Networking Module (VPC, Subnets)
# =====================================================
module "networking" {
  source = "../../modules/networking"

  project_name           = var.project_name
  vpc_cidr               = var.vpc_cidr
  public_subnet_cidrs    = var.public_subnet_cidrs
  private_subnet_cidrs   = var.private_subnet_cidrs
  availability_zones     = var.availability_zones
  enable_nat_gateway     = true  # ← สำหรับ Private outbound (for private subnet outbound)
}

# =====================================================
# Database Module (RDS SQL Server Multi-AZ)
# =====================================================
module "database" {
  source = "../../modules/database"

  project_name              = var.project_name
  engine_version            = "14.00"  # SQL Server 2022
  instance_class            = "db.t3.large"  # ← Production-grade instance
  allocated_storage          = 100  # GB
  multi_az                  = true  # ← High availability
  backup_retention_period   = 30   # days
  enable_cloudwatch_logs    = true
  publicly_accessible       = false  # ← NEVER expose database to public
  vpc_security_group_ids    = [aws_security_group.database.id]
  db_subnet_group_name      = module.networking.db_subnet_group_name
  master_username           = "admin"
  master_password           = random_password.db_password.result  # ← Generated, stored in Secrets Manager
  kms_key_id                = aws_kms_key.rds.arn  # ← Encrypt backups

  depends_on = [module.networking]
}

# =====================================================
# Application Service Module (ECS Fargate)
# =====================================================
module "app_service" {
  source = "../../modules/app_service"

  project_name            = var.project_name
  app_name                = "booking-api"
  container_image_backend = "${var.ecr_repository_url}:latest"
  container_image_frontend = "${var.ecr_repository_url_frontend}:latest"
  container_port_backend  = 5000
  container_port_frontend = 3000
  
  # Scaling configuration
  ecs_desired_count       = 3     # ← Start with 3 instances
  ecs_min_count           = 2     # ← Minimum 2 for HA
  ecs_max_count           = 10    # ← Maximum 10 under load
  
  # ← Pass environment variables (secrets fetched from Secrets Manager at runtime)
  environment_variables = {
    ASPNETCORE_ENVIRONMENT = "Production"
    Jwt__Issuer            = var.jwt_issuer
    Jwt__Audience          = var.jwt_audience
    # Database connection: read from Secrets Manager in app startup
  }
  
  # Security
  vpc_id                  = module.networking.vpc_id
  private_subnet_ids      = module.networking.private_subnet_ids
  alb_security_group_id   = aws_security_group.alb.id
  task_security_group_id  = aws_security_group.ecs_tasks.id
  
  depends_on = [module.networking]
}

# =====================================================
# Random Password for Database (Secrets Manager)
# =====================================================
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "natureminiplex/prod/db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id      = aws_secretsmanager_secret.db_password.id
  secret_string  = random_password.db_password.result
}
```

### Environment Variables Pattern

**✅ CORRECT Pattern (`infra/terraform/environments/prod/variables.tf`):**

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "nature-miniplex"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "jwt_secret" {
  description = "JWT signing secret (store in AWS Secrets Manager)"
  type        = string
  sensitive   = true  # ← Mark as sensitive to prevent logging
}

variable "jwt_issuer" {
  description = "JWT issuer URL"
  type        = string
  default     = "https://api.natureminiplex.production.com"
}
```

### Terraform Variable File Pattern

**✅ CORRECT Pattern (`infra/terraform/environments/prod/terraform.tfvars.example`):**

```hcl
# Copy this to terraform.tfvars and fill in production values
aws_region  = "ap-southeast-1"
project_name = "nature-miniplex"
vpc_cidr    = "10.0.0.0/16"

# NEVER put secrets here—use AWS Secrets Manager
# (read from Secrets Manager at runtime in application)

public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
availability_zones   = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]

jwt_issuer  = "https://api.natureminiplex.production.com"
jwt_audience = "https://natureminiplex.production.com"
```

---

## 🔐 Secret Management: Zero Hardcoded Secrets

### CRITICAL RULES

❌ **FORBIDDEN:**
```hcl
# ❌ Never hardcode secrets in Terraform files
resource "aws_db_instance" "main" {
  master_password = "MyPassword123!"  # ❌ FORBIDDEN
}

# ❌ Never store secrets in .env file (when committed)
JWT_SECRET="super-secret-key"  # ❌ FORBIDDEN in VCS

# ❌ Never put secrets in Dockerfile or ECR images
RUN echo "export DB_PASSWORD=secret123" >> ~/.bashrc  # ❌ FORBIDDEN
```

✅ **REQUIRED:**

**For Local Development (Docker Compose):**
```bash
# 1. Copy template (committed to VCS)
cp infra/.env.example infra/.env

# 2. Edit local copy (git-ignored, never committed)
# infra/.env now contains real secrets for LOCAL development

# 3. Docker Compose loads from .env
docker compose up -d
```

**For AWS Production:**
```hcl
# 1. Store secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "natureminiplex/prod/jwt-secret"
}

# 2. Application retrieves at startup
# C# Code:
// 在应用启动时，从 AWS Secrets Manager 检索密钥
var jwtSecret = await secretsManagerClient.GetSecretValueAsync(
    new GetSecretValueRequest { SecretId = "natureminiplex/prod/jwt-secret" }
);

# 3. OR use IAM role to restrict access
# ECS task assumes IAM role with permissions to read from Secrets Manager only
```

**For Terraform Secrets:**
```hcl
# 1. Store sensitive variable values outside VCS
# Create terraform.tfvars (git-ignored)
jwt_secret = sensitive("actual-secret-value")

# 2. Mark variables as sensitive to prevent logging
variable "jwt_secret" {
  type      = string
  sensitive = true  # ← Prevents value from appearing in logs
}

# 3. Access via environment variables at CI/CD time
export TF_VAR_jwt_secret="actual-value"
terraform apply
```

---

## 📋 Dockerfile Best Practices

### Multi-Stage Build Pattern (Backend Example)

**✅ CORRECT Pattern (`backend/Dockerfile`):**

```dockerfile
# =====================================================
# Stage 1: Build (เรียบร้อยแล้ว - Compilation only)
# =====================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /app

# ← Copy only .csproj first (layer caching)
COPY ["src/API/API.csproj", "src/API/"]
COPY ["src/Core/Core.csproj", "src/Core/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "src/Infrastructure/"]

RUN dotnet restore "src/API/API.csproj"

# ← Copy source code
COPY . .

# ← Build in Release mode
RUN dotnet publish "src/API/API.csproj" \
    -c Release \
    -o /app/publish

# =====================================================
# Stage 2: Runtime (เรียกใช้งาน - Lightweight)
# =====================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# ← Copy ONLY the published output (no build tools, no source code)
COPY --from=builder /app/publish .

# ← Non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# ← Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["curl", "-f", "http://localhost:5000/health", "||", "exit", "1"]

EXPOSE 5000

ENTRYPOINT ["dotnet", "API.dll"]
```

### Multi-Stage Build Pattern (Frontend Example)

**✅ CORRECT Pattern (`frontend/Dockerfile`):**

```dockerfile
# =====================================================
# Stage 1: Build (Build phase - compilation only)
# =====================================================
FROM node:20-alpine AS builder

WORKDIR /app

# ← Copy package files
COPY package.json pnpm-lock.yaml ./

# ← Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# ← Copy source code
COPY . .

# ← Build Next.js app (outputs to .next/)
RUN pnpm run build

# =====================================================
# Stage 2: Runtime (Development - with hot reload)
# =====================================================
FROM node:20-alpine AS development

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]

# =====================================================
# Stage 3: Runtime (Production - optimized, standalone)
# =====================================================
FROM node:20-alpine AS runtime

WORKDIR /app

# ← Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# ← Non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

---

## ✅ Infrastructure Code Review Checklist

When reviewing Infra PRs, verify:

- [ ] **No Hardcoded Secrets:** No API keys, passwords, or connection strings in code/images
- [ ] **Secrets Manager:** Production secrets stored in AWS Secrets Manager or similar
- [ ] **Environment Separation:** Dev/staging/prod have distinct Terraform modules
- [ ] **Multi-Stage Dockerfiles:** Build stage separate from runtime stage
- [ ] **No Root User:** Containers run as non-root user for security
- [ ] **Health Checks:** Services have HEALTHCHECK directives
- [ ] **Volume Persistence:** Databases use named volumes, not ephemeral storage
- [ ] **Network Isolation:** Database in private subnet, no public exposure
- [ ] **Terraform State:** Remote S3 backend configured, locked with DynamoDB
- [ ] **Tech-Thai Comments:** Infrastructure code includes Thai comments

---

## 🔗 Reference Documentation

- **Reference:** `infra/README.md` (Infrastructure architecture overview)
- **Reference:** `NatureMiniPlex_SRS_Architecture.md` (SRS mapping to infrastructure)
- **Reference:** `CONTRIBUTING.md` (Git Flow, commit conventions)

---

**Last Updated:** 2026-07-23  
**Status:** Active & Standardized
