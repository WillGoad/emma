# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm ci --include=dev

# Generate Prisma client
RUN npx prisma generate

# Build application
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

CMD ["node", "dist/index.js"]