FROM node:16-slim AS build

WORKDIR /build
COPY package.json .
COPY package-lock.json .
RUN npm i
COPY . .
RUN node node_modules/.bin/ng build --aot

FROM node:16-slim
WORKDIR /app
COPY --from=build /build/package.json .
COPY --from=build /build/package-lock.json .
COPY --from=build /build/dist dist
COPY --from=build /build/server.js .
RUN npm i --production
ENTRYPOINT [ "node", "server.js" ]
