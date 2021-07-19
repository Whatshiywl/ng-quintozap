FROM whatshiywl/angular-base:1.0.0 AS build

WORKDIR /prod
COPY package.json .
COPY package-lock.json .
RUN npm i --production

WORKDIR /build
COPY package.json .
COPY package-lock.json .
RUN npm i
COPY . .
RUN node node_modules/.bin/ng build --aot --base-href /quintozap/

FROM node:16-slim
WORKDIR /app
COPY --from=build /prod/node_modules node_modules
COPY --from=build /build/dist dist
COPY --from=build /build/server server
ENTRYPOINT [ "node", "server" ]
