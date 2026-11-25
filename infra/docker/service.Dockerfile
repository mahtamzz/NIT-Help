FROM node:20-alpine

ARG SERVICE_DIR

RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/microservice-common/package.json ./packages/microservice-common/
COPY apps/iam-service/package.json ./apps/iam-service/
COPY apps/core-service/package.json ./apps/core-service/
COPY apps/media-service/package.json ./apps/media-service/
COPY apps/notifications-ops-service/package.json ./apps/notifications-ops-service/
COPY apps/web/package.json ./apps/web/

RUN npm install

# Copy shared libraries and target service source
COPY packages ./packages
COPY ${SERVICE_DIR} ./${SERVICE_DIR}

RUN npm --workspace=packages/shared run build \
 && npm --workspace=packages/microservice-common run build \
 && npm --workspace=${SERVICE_DIR} run prisma:generate \
 && npm --workspace=${SERVICE_DIR} run build

WORKDIR /app/${SERVICE_DIR}

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main"]
