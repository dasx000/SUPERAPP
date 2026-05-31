FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_PATH=/usr/local/lib/node_modules

RUN apk add --no-cache python3 py3-pip
RUN pip3 install pymupdf --break-system-packages --retries 5 --timeout 120

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src/generated ./src/generated
RUN npm install -g prisma@7 bcryptjs pg tsx

RUN mkdir -p uploads/originals uploads/results uploads/spesimen
RUN chmod +x scripts/start.sh

EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
