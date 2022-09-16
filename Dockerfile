FROM nvidia/opengl:1.0-glvnd-devel-ubuntu20.04 AS build

# 1. Install dependencies for node `canvas` and `gl`

RUN apt-get update -y
# Install node 18.0
RUN apt-get install -y curl gnupg ca-certificates && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs
# See: https://github.com/stackgl/headless-gl#ubuntudebian
RUN apt-get install -y build-essential python libxi-dev libglu-dev libglew-dev pkg-config git
# See: https://github.com/Automattic/node-canvas
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 2. Build Phoenix

WORKDIR /phoenix

COPY . .

RUN npm install yarn --global --silent
RUN yarn install --silent
RUN yarn deploy:web

# Remove all node_modules folders
RUN find . -name "node_modules" -type d -exec rm -rf "{}" +

# 3. Serve the build through NGINX

FROM nginx:alpine
COPY --from=build /phoenix/packages/phoenix-ng/docs /usr/share/nginx/html
