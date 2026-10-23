# Build context: repository root. Keep this file in sync with the root Dockerfile.
FROM node:22.23.4-alpine AS build
RUN apk add --no-cache --upgrade ca-certificates openssl && update-ca-certificates
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci
COPY tsconfig.base.json ./
COPY server ./server
RUN npm run build:server && npm prune --omit=dev

FROM node:22.23.4-alpine AS runtime
RUN apk add --no-cache --upgrade ca-certificates openssl && update-ca-certificates
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/prisma.config.ts ./server/prisma.config.ts
WORKDIR /app/server
EXPOSE 5000
# Schema changes are an explicit operator step, never an accept-data-loss startup.
CMD ["node", "dist/index.js"]
