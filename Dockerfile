FROM node:17-alpine

EXPOSE 3000

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

RUN mkdir /app
WORKDIR /app
ADD package.json yarn.lock /app/
RUN yarn --pure-lockfile
ADD . /app

ARG MAX_OLD_SPACE_SIZE=4096
ENV NODE_OPTIONS=--max_old_space_size=$MAX_OLD_SPACE_SIZE

CMD ["yarn", "docker:start"]
