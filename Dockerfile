# PolyRecorder — Remix SSR image for Scaleway Containers
# Build:  docker build -t polyrecorder .
# Run:    docker run --rm -p 8080:8080 -e PORT=8080 polyrecorder
# App URL: http://localhost:8080/
#
# Build with Bun; serve with Node — remix-serve + React 19 crashes under Bun
# (`react-dom/server.bun.js` TypeError).

FROM oven/bun:1.3.5 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build \
  && rm -rf node_modules \
  && bun install --frozen-lockfile --production

FROM node:22-bookworm-slim AS production
ENV NODE_ENV=production
# Scaleway Serverless Containers inject PORT; 8080 is the usual default.
ENV PORT=8080
WORKDIR /app

COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 8080
CMD ["./node_modules/.bin/remix-serve", "./build/server/index.js"]
