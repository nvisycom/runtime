FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/nvisy-core/package.json packages/nvisy-core/package.json
COPY packages/nvisy-runtime/package.json packages/nvisy-runtime/package.json
COPY packages/nvisy-server/package.json packages/nvisy-server/package.json
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/nvisy-core/node_modules ./packages/nvisy-core/node_modules
COPY --from=deps /app/packages/nvisy-runtime/node_modules ./packages/nvisy-runtime/node_modules
COPY --from=deps /app/packages/nvisy-server/node_modules ./packages/nvisy-server/node_modules
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/nvisy-core/node_modules ./packages/nvisy-core/node_modules
COPY --from=deps /app/packages/nvisy-runtime/node_modules ./packages/nvisy-runtime/node_modules
COPY --from=deps /app/packages/nvisy-server/node_modules ./packages/nvisy-server/node_modules
COPY --from=build /app/packages/nvisy-core/dist ./packages/nvisy-core/dist
COPY --from=build /app/packages/nvisy-core/package.json ./packages/nvisy-core/package.json
COPY --from=build /app/packages/nvisy-runtime/dist ./packages/nvisy-runtime/dist
COPY --from=build /app/packages/nvisy-runtime/package.json ./packages/nvisy-runtime/package.json
COPY --from=build /app/packages/nvisy-server/dist ./packages/nvisy-server/dist
COPY --from=build /app/packages/nvisy-server/package.json ./packages/nvisy-server/package.json
COPY package.json package-lock.json ./

EXPOSE 8080
CMD ["node", "packages/nvisy-server/dist/main.js"]
