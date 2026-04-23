FROM node:20-alpine AS builder
WORKDIR /app
COPY apps/worker/package.json apps/worker/tsconfig.json ./
RUN npm install --include=dev --no-audit --no-fund
COPY apps/worker/src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY apps/worker/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
