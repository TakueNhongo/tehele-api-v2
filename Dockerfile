# Use Node.js 22 Alpine for smaller image size
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and TypeScript configuration
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies using yarn
RUN yarn --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the NestJS application
RUN yarn build

# Production image, copy all the files and run nest
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy the built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Change ownership to the nestjs user
RUN chown -R nestjs:nodejs /app
USER nestjs


# Start the application
CMD ["node", "dist/main.js"]
