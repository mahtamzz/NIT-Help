# NIT-Help — University Ticketing System

A university helpdesk and ticketing platform built with React, TypeScript, NestJS microservices, Nginx API Gateway, RabbitMQ, and PostgreSQL.

## Architecture

- **Nginx API Gateway** (`gateway/`): Entrypoint on port `4000` handling routing, CORS, and `auth_request` token verification.
- **IAM Service** (`apps/iam-service`, schema `iam`): Authentication, JWT/refresh token rotation, and user management.
- **Core Service** (`apps/core-service`, schema `core`): Departments, service catalog, and ticketing workflows.
- **Media Service** (`apps/media-service`, schema `media`): Attachment upload, storage, and access-checked downloads.
- **Notifications & Ops Service** (`apps/notifications-ops-service`, schema `ops`): Event-driven notifications, audit logs, and analytics reports.
- **Web Frontend** (`apps/web`): React + Vite client (`http://localhost:5173`).

## Quick Start

### With Docker Compose

```bash
docker compose up -d --build
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev:web
```

### Local Development

```bash
docker compose up -d postgres rabbitmq nginx-gateway
npm install
npm run build:packages
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev:services
npm run dev:web
```

### URLs

- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:4000/api
- **Swagger Docs:** http://localhost:4000/api/docs
- **RabbitMQ Management:** http://localhost:15672 (`guest` / `guest`)

## Default Seed Accounts

| Role | Username(s) | Password |
| :--- | :--- | :--- |
| Admin | `admin` | `Admin@123456` |
| Manager | `it_manager`, `edu_manager`, `fac_manager` | `Manager@123456` |
| Specialist | `it_spec`, `edu_spec`, `fac_spec` | `Specialist@123456` |
| Student | `student` | `Student@123456` |
| Faculty | `faculty` | `Faculty@123456` |

## Testing

```bash
# Unit tests across all workspaces
npm test

# End-to-end 20-step workflow via Nginx Gateway
npm run test:e2e
```
