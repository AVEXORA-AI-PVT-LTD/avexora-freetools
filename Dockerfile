# Production image for freetools.avexora.in (free tools + Brand Studio).
#
# Deliberately no `# syntax=` directive: it makes BuildKit pull a frontend image
# before it reads line 2, and nothing here needs one.
#
# Debian rather than Alpine on purpose: `prisma generate` emits
# libquery_engine-debian-openssl-3.0.x.so.node for this base, and a musl image
# would silently need a different binaryTarget. Keep the base in step with the
# engine or Prisma fails at first query, not at build.

# ---------------------------------------------------------------------------
# deps — install once, cached until the lockfile moves
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# builder — generate the Prisma client, then build
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No DATABASE_URL is needed to generate — only to connect. Generating here
# means the runtime image never carries the prisma CLI.
RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
# runner — standalone output only, no package manager, non-root
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# server.js serves these two itself; standalone does not copy them for you.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs
EXPOSE 3000

# Every route is dynamic or static-with-no-DB except the Studio ones, so a plain
# GET / is a truthful readiness signal: it fails only if the server is down.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
