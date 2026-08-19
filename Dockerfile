# syntax=docker/dockerfile:1

# ---- build stage: install everything, generate dist/index.html ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY scripts ./scripts

# APP_ENV=local makes getApiBaseUrl() return '', so the page fetches a
# relative /api/hello - correct when one container serves API and static.
ENV APP_ENV=local
RUN npm run build

# ---- runtime stage: prod deps + source + built page only ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    APP_ENV=local \
    PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

# No dedicated /health route exists; /api/hello is cheap and total.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/hello').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# npm start adds --env-file-if-exists=.env; in a container config comes
# from real env vars, so invoke node directly.
CMD ["node", "src/server.js"]
