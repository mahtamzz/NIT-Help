# NIT-Help — University Ticketing System

A university helpdesk and ticketing platform built with React, TypeScript, NestJS microservices, Nginx API Gateway, RabbitMQ, and PostgreSQL.

## Structure

- `frontend/` — React + Vite web client (`http://localhost:5173`)
- `backend/gateway/` — Nginx API Gateway (port `4000`, routing, CORS, `auth_request`)
- `backend/common/` — Shared backend NestJS guards, RabbitMQ event bus, and contracts
- `backend/services/`
  - `iam/` (schema `iam`) — Authentication, JWT/refresh rotation, users
  - `core/` (schema `core`) — Departments, service catalog, ticketing
  - `media/` (schema `media`) — Attachment upload, storage, and downloads
  - `notifications-ops/` (schema `ops`) — Notifications, audit logs, reports
- `packages/shared/` — Cross-stack TypeScript types, enums, and Zod schemas

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
