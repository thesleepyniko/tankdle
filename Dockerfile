# Build on real Node: in oven/bun images `node` is symlinked to bun, and under bun
# SvelteKit's route analysis exits silently before adapter-node writes ./build.
FROM node:24-slim AS build
COPY --from=oven/bun:1.3.6 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

COPY package.json bun.lock .npmrc ./
RUN bun install --frozen-lockfile

COPY . .
# SvelteKit validates env vars during route analysis. They aren't `static`, so these
# placeholders are never inlined — real values are read at runtime.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build \
    ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000 \
    IMAGE_DIR=/app/data/images \
    bun run build

FROM oven/bun:1.3.6-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    IMAGE_DIR=/app/data/images

# adapter-node bundles devDependencies into the build, so only the output is needed
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

RUN mkdir -p /app/data/images && chown -R bun:bun /app/data
USER bun

EXPOSE 3000
CMD ["bun", "build/index.js"]
