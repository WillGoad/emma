FROM node:18-alpine AS builder
WORKDIR /app

COPY prisma/ ./prisma/
COPY package.json package-lock.json* ./

# Install dependencies and generate Prisma client
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built files and Prisma artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/

# Install production dependencies
COPY package*.json ./
RUN npm ci --production

# Ensure Prisma schema is available
COPY prisma/ ./prisma/

CMD ["node", "dist/index.js"]