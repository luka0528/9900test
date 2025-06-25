# Use a Debian-based Node.js image for better cross-platform compatibility
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Install OpenSSL and other dependencies Prisma might need
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package manager files first (to leverage Docker caching)
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema before installing dependencies
COPY prisma ./prisma

# Install dependencies using pnpm
RUN npm install -g pnpm && pnpm install

# Copy the rest of the app
COPY . .

# Generate Prisma client explicitly with the updated schema
RUN pnpm prisma generate

# Expose the development port (if needed)
EXPOSE 3000

