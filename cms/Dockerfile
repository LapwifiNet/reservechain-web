# OpenRWA CMS (Payload v2 + Express + PostgreSQL).
# Owns the asset registry and public Digital Asset Passports. Runs against its
# OWN database (postgres-cms), never the API's, and signs its sessions with its
# own PAYLOAD_SECRET — a third token domain, disjoint from admin and investor.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Bundles the admin panel (webpack) and compiles the Express server to dist/.
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup -g 1001 -S nodejs && adduser -S payload -u 1001

# The Payload admin panel is served from `build/` at runtime, and the compiled
# server from `dist/`. node_modules comes from the builder rather than a
# --omit=dev install because payload's runtime resolves its config through the
# same toolchain used to build it.
COPY --from=builder --chown=payload:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=payload:nodejs /app/dist ./dist
COPY --from=builder --chown=payload:nodejs /app/build ./build
COPY --chown=payload:nodejs package.json ./
COPY --chown=payload:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Uploaded Certificates of Analysis and imagery. Mount a volume here to persist
# them; the image ships the directory owned by the unprivileged user.
RUN mkdir -p /app/uploads && chown payload:nodejs /app/uploads

USER payload
EXPOSE 3001
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
