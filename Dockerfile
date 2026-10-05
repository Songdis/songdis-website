# The artist site, built for the Contabo box alongside the Laravel API.
#
# Three stages so the thing that ships carries no toolchain: dependencies, build, run. The
# runner copies Next's standalone output, which already contains the minimal node_modules it
# traced, so there is no install at runtime.
#
# The image lands around 545MB, and roughly 112MB of that is public/images — a handful of
# multi-megabyte SVGs (singer.svg is 19MB, members.svg 18MB) that ship inside every build and
# are downloaded by every visitor who hits a page using them. Worth optimising at source; it
# is a page-weight problem first and an image-size problem second.

# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Only the manifests, so this layer is cached until a dependency actually changes — not on
# every source edit.
COPY package.json package-lock.json* ./

# npm ci, not install: it installs exactly the lockfile and fails if the two disagree, which
# is what a build server should do rather than quietly resolving something new.
RUN npm ci

# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* is compiled INTO the JavaScript bundle, not read at runtime.
#
# This is the one thing about deploying Next that catches people out: setting
# NEXT_PUBLIC_API_URL in the container's environment does nothing, because the value was
# already baked in when the bundle was built. Production and dev therefore need separate
# images built with different arguments — the same image cannot be pointed at another API.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AYO_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_AYO_URL=$NEXT_PUBLIC_AYO_URL \
    NEXT_TELEMETRY_DISABLED=1

# The source maps are dropped in the SAME layer that creates them.
#
# Two reasons. They are debug symbols for our own server code and have no business shipping
# to production. And Docker's containerd image store fails to export this layer while they
# are present — it lists a .map file, then cannot stat it, and the build dies with
# "failed to create diff tar stream" after a completely successful compile.
RUN npm run build && find .next -name "*.map" -type f -delete

# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    # Without this Next binds to localhost INSIDE the container, which from the host looks
    # like the port is open and every request hangs.
    HOSTNAME=0.0.0.0

# Its own user. Nothing here needs root, and a web process running as root is one container
# escape away from being a much worse day.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public

# The standalone server, plus the static assets it serves. Both are copied with the app user
# as owner so the running process can read them without a chmod pass.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Compose watches this; a container that has stopped serving gets restarted rather than
# sitting there accepting connections it cannot answer.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
