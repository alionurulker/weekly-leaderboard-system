FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --frozen-lockfile

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY shared ./shared

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --frozen-lockfile --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001
CMD ["node", "dist/index.js"]