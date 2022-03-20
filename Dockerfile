FROM node:17-alpine

EXPOSE 3000

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

RUN mkdir /app
WORKDIR /app
ADD package.json yarn.lock /app/
RUN yarn --pure-lockfile
ADD . /app

RUN export NODE_OPTIONS=--max-old-space-size=4096

CMD ["yarn", "docker:start"]
