# # Use a Debian-based Node.js image for better cross-platform compatibility
# FROM node:18-slim

# # Set the working directory
# WORKDIR /app

# # Install OpenSSL and other dependencies Prisma might need
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends \
#     openssl \
#     ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

# # Copy package manager files first (to leverage Docker caching)
# COPY package.json pnpm-lock.yaml ./

# # Copy Prisma schema before installing dependencies
# COPY prisma ./prisma

# # Install dependencies using pnpm
# RUN npm install -g pnpm && pnpm install

# # Copy the rest of the app
# COPY . .

# # Generate Prisma client explicitly with the updated schema
# RUN pnpm prisma generate

# # Expose the development port (if needed)
# EXPOSE 3000

# 使用更小的 Node.js 官方镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（Prisma 有时依赖 openssl）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 拷贝 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖（使用 pnpm）
RUN npm install -g pnpm && pnpm install

# 拷贝 Prisma schema 并生成 Prisma 客户端
COPY prisma ./prisma
RUN pnpm prisma generate

# 拷贝剩余的所有代码
COPY . .

# 构建生产版本（生成 .next）
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动生产服务器
CMD ["pnpm", "start"]
