FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install all deps (needed for build + native modules)
FROM base AS deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps
# Install musl SWC binary for Alpine Linux (--ignore-scripts prevents native rebuilds)
RUN npm install @next/swc-linux-x64-musl --no-save --legacy-peer-deps --ignore-scripts

# Build Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && npm run build

# Production runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy migrate script and its dependencies
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

# Create data and uploads directories
RUN mkdir -p /app/data /app/uploads && chown nextjs:nodejs /app/data /app/uploads

USER nextjs

EXPOSE 3028
ENV PORT=3028
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node_modules/.bin/tsx src/lib/db/migrate.ts && node server.js"]
