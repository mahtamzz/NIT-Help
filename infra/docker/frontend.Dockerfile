
# Build the frontend from the monorepo root
FROM node:20-alpine AS builder

WORKDIR /app

# Workspace package manifests
COPY package.json package-lock.json ./

COPY frontend/package.json ./frontend/
COPY packages/shared/package.json ./packages/shared/
COPY backend/common/package.json ./backend/common/

COPY backend/services/iam-service/package.json ./backend/services/iam-service/
COPY backend/services/core-service/package.json ./backend/services/core-service/
COPY backend/services/media-service/package.json ./backend/services/media-service/
COPY backend/services/notifications-ops-service/package.json ./backend/services/notifications-ops-service/

# Install all workspace dependencies
RUN npm ci

# Copy frontend and its shared package
COPY packages/shared ./packages/shared
COPY frontend ./frontend

# Build shared types
RUN npm --workspace=packages/shared run build

# URL used by the browser
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=${VITE_API_URL}

# Build the React application
RUN npm --workspace=frontend run build

# Serve the built frontend using Nginx
FROM nginx:1.27-alpine

COPY infra/docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
