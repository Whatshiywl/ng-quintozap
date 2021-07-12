FROM node:16-slim

WORKDIR /build
COPY package.json .
COPY package-lock.json .
RUN npm i
