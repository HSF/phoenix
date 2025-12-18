# --- Stage 1: Build Stage ---
FROM nvidia/opengl:1.0-glvnd-devel-ubuntu22.04 AS build

ARG DEBIAN_FRONTEND=noninteractive

# 1. System dependencies
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends curl gnupg ca-certificates patch && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y --no-install-recommends \
    nodejs \
    build-essential \
    python3 \
    python3-dev \
    python-is-python3 \
    libxi-dev \
    libglu-dev \
    libglew-dev \
    pkg-config \
    git \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev && \
    rm -rf /var/lib/apt/lists/*

# 2. Build Phoenix
WORKDIR /phoenix

# Copy FULL source ONCE (important)
COPY . .

# Enable Corepack
RUN corepack enable

# --- ENVIRONMENT OPTIMIZATIONS ---
ENV npm_config_build_from_source=true
ENV npm_config_python=/usr/bin/python3
ENV CI=1
ENV CYPRESS_INSTALL_BINARY=0

# 🔥 OOM FIX (critical)
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NG_BUILD_SOURCE_MAP=false
ENV UV_THREADPOOL_SIZE=1

# Install dependencies
RUN yarn install

# Build Angular 20 app
RUN yarn deploy:web

# Remove node_modules to shrink image
RUN find . -name "node_modules" -type d -exec rm -rf "{}" +

# --- Stage 2: Production Stage ---
FROM nginx:alpine
EXPOSE 80

RUN rm -rf /usr/share/nginx/html/*

# Copy build output (docs MUST contain index.html)
COPY --from=build /phoenix/packages/phoenix-ng/docs/ /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]
