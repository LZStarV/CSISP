FROM node:18-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages ./packages
COPY infra ./infra
COPY apps ./apps
RUN pnpm -r install --frozen-lockfile
RUN pnpm -F @csisp/idl idl:gen
RUN pnpm -F @csisp/idp-client build

FROM nginx:alpine
COPY --from=build /repo/apps/idp/client/dist /usr/share/nginx/html
