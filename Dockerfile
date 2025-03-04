FROM node:18-alpine

WORKDIR /app

# Install OpenSSL and other required dependencies
RUN apk add --no-cache openssl

# Enable Corepack for package manager version management
RUN corepack enable

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies without running Prisma postinstall scripts yet
RUN corepack pnpm install --ignore-scripts

# Copy prisma directory separately to fix schema location issue
COPY prisma ./prisma/

# Copy all other app files
COPY . .

# Now generate Prisma client
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# Expose the development server port
EXPOSE 3000

# Run development server
CMD ["pnpm", "dev"]
