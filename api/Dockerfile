# OpenRWA API (NestJS + Prisma + PostgreSQL).
# openssl is required by the Prisma query engine on Alpine.
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
RUN apk add --no-cache openssl

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# node_modules is copied from the builder rather than reinstalled with
# --omit=dev on purpose: `prisma migrate deploy` runs at container start, and
# the Prisma CLI is a devDependency.
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package.json ./
COPY --chown=nestjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nestjs
EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
