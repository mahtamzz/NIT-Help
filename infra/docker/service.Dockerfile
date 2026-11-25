FROM node:20-alpine

ARG SERVICE_DIR

RUN apk add --no-cache openssl python3 build-base

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/common/package.json ./backend/common/
COPY backend/services/iam-service/package.json ./backend/services/iam-service/
COPY backend/services/core-service/package.json ./backend/services/core-service/
COPY backend/services/media-service/package.json ./backend/services/media-service/
COPY backend/services/notifications-ops-service/package.json ./backend/services/notifications-ops-service/
COPY frontend/package.json ./frontend/

RUN npm install

# Copy shared libraries, backend common, and target service source
COPY packages ./packages
COPY backend/common ./backend/common
COPY ${SERVICE_DIR} ./${SERVICE_DIR}

RUN npm --workspace=packages/shared run build \
 && npm --workspace=backend/common run build \
 && npm --workspace=${SERVICE_DIR} run prisma:generate \
 && npm --workspace=${SERVICE_DIR} run build

WORKDIR /app/${SERVICE_DIR}

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main"]
