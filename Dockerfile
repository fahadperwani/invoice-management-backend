FROM node:20-alpine AS builder
WORKDIR /app

# 1. Install dependencies using the lockfile
COPY package.json yarn.lock ./ 
RUN yarn install --frozen-lockfile

# 2. Build the application
COPY . .
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache netcat-openbsd

# 3. Copy assets from builder
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig*.json ./

# Entrypoint
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

EXPOSE 3000
CMD ["./docker/entrypoint.sh"]