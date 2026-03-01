FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable
COPY Frontend/package.json Frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY Frontend/ ./
RUN pnpm run build

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch(`http://127.0.0.1:${process.env.PORT || 3000}`).then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"

USER appuser

CMD ["node", ".output/server/index.mjs"]
