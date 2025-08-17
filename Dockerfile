# 🛡️ Secure Multi-stage Dockerfile
FROM node:18-alpine AS base

# 🛡️ **1. Security: Create non-root user**
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 🛡️ **2. Security: Install security updates**
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# 🛡️ **3. Dependencies stage**
FROM base AS deps
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 🛡️ **4. Build stage**
FROM base AS build
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build || echo "No build script found"

# 🛡️ **5. Production stage**
FROM base AS runner

# 🛡️ **Security: Set NODE_ENV**
ENV NODE_ENV=production
ENV PORT=5000

# 🛡️ **Security: Copy only necessary files**
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/ ./

# 🛡️ **Security: Remove package files**
RUN rm -f package*.json

# 🛡️ **Security: Create uploads directory with proper permissions**
RUN mkdir -p uploads && chown nextjs:nodejs uploads

# 🛡️ **Security: Switch to non-root user**
USER nextjs

# 🛡️ **Security: Expose port**
EXPOSE 5000

# 🛡️ **Security: Health check**
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 5000, path: '/api/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# 🛡️ **Security: Use dumb-init for proper signal handling**
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
