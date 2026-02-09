FROM nvidia/opengl:1.0-glvnd-devel-ubuntu22.04 AS build

# 0. Set frontend to noninteractive to suppress warnings during install
ARG DEBIAN_FRONTEND=noninteractive

# 1. System dependencies & Python Fix
# We combine everything into ONE Run command to keep the image small and avoid errors.
RUN apt-get update -y && \
    # Install prerequisites for Node setup
    apt-get install -y --no-install-recommends curl gnupg ca-certificates && \
    # Setup Node 18 repository
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    # Install Node, Python 3, Build Tools, and Canvas dependencies
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
    # Clean up apt lists to save space (Must be done at the very end!)
    rm -rf /var/lib/apt/lists/*

# 2. Build Phoenix
WORKDIR /phoenix
COPY . .

# Enable Corepack
RUN corepack enable

# Force native modules (lmdb) to build from source
ENV npm_config_build_from_source=true

# *** IMPORTANT FIX ***
# Tell node-gyp explicitly to use the python3 executable we just installed
ENV npm_config_python=/usr/bin/python3

# CI environment variables
ENV CI=1
ENV CYPRESS_INSTALL_BINARY=0

# Install dependencies (verbose so you can see if python errors occur)
RUN yarn install --silent

# Build the web app
RUN yarn deploy:web

# Remove node_modules folders to save space
RUN find . -name "node_modules" -type d -exec rm -rf "{}" +

# 3. Serve the build through NGINX
FROM nginx:alpine
COPY --from=build /phoenix/packages/phoenix-ng/docs /usr/share/nginx/html