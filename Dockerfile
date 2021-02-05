FROM node:14-alpine
WORKDIR /phoenix
COPY . .
RUN npm install --global lerna
RUN yarn install:dependencies
CMD ["yarn", "start", "--", "--scope", "phoenix-ng", "--", "--host=0.0.0.0"]
