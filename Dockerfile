FROM node:14-alpine AS build
WORKDIR /phoenix
COPY . .
RUN yarn install
RUN yarn deploy:web
# Remove all node_modules folders
RUN find . -name "node_modules" -type d -exec rm -rf "{}" +

FROM nginx:alpine
COPY --from=build /phoenix/packages/phoenix-ng/docs /usr/share/nginx/html
