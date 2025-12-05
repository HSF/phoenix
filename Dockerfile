FROM nvidia/opengl:1.0-glvnd-devel-ubuntu20.04 AS build

# 1. System dependencies needed by native Node modules (canvas, headless-gl)
RUN apt-get update -y
RUN apt-get install -y curl gnupg ca-certificates && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs
RUN apt-get install -y build-essential python libxi-dev libglu-dev libglew-dev pkg-config git
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 2. Project workspace
WORKDIR /phoenix
COPY . .

# 3. Environment: mark CI + skip Cypress binary (we only build static docs here)
ENV CI=1
ENV CYPRESS_INSTALL_BINARY=0

# 4. Use Yarn via Corepack (honors yarnPath -> Yarn 3 committed in repo)
RUN corepack enable

# 5. Install dependencies & build the web/docs
RUN yarn install --silent
RUN yarn deploy:web

# 6. Remove node_modules to keep final image lean
RUN find . -name "node_modules" -type d -exec rm -rf "{}" +

# 7. Runtime stage: just serve the built docs
FROM nginx:alpine
COPY --from=build /phoenix/packages/phoenix-ng/docs /usr/share/nginx/html