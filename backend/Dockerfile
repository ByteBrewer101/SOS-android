# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only the manifests first so Docker can cache this layer
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev


# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Remove dev files that don't belong in production
RUN rm -f .env .env.example CLAUDE.md

# Ensure the non-root user owns the app directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 5000

# dumb-init handles PID 1 and proper signal forwarding (SIGTERM → graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]
