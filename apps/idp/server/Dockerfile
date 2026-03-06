FROM node:18-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages ./packages
COPY infra ./infra
COPY apps ./apps
RUN pnpm -r install --no-frozen-lockfile
RUN pnpm -F @csisp/idl idl:gen
RUN pnpm -F @csisp/idp-server build
RUN pnpm -F @csisp/idp-server deploy --prod --legacy /app/deploy

FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app/deploy
COPY --from=build /app/deploy ./
# 确保编译产物存在
COPY --from=build /repo/apps/idp/server/dist ./dist
CMD ["node","dist/main.js"]
