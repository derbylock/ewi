# Multi-stage build setup (https://docs.docker.com/develop/develop-images/multistage-build/)

# Stage 1 (to create a "build" image, ~850MB)
FROM golang:1.13 AS builder
RUN go version

COPY server/ewi-server/*.go /go/src/
COPY server/ewi-server/*.mod /go/src/
COPY server/ewi-server/*.sum /go/src/
COPY server/ewi-server/vendor /go/src/vendor
WORKDIR /go/src/
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod vendor -a -o app .

RUN mkdir -p /var/lib/ewi-server/repo

# Stage 1 - the build process
FROM node:11.10.1 as build-deps
ARG EWI_SERVER_PATH=http://localhost:8888/
WORKDIR /usr/src/app
COPY ui/ewi-ui/package.json ui/ewi-ui/yarn.lock ./
RUN yarn
COPY ui/ewi-ui/src ./src
COPY ui/ewi-ui/public ./public
RUN REACT_APP_EWI_SERVER_PATH="${EWI_SERVER_PATH}" yarn build

# Stage 2 (to create a downsized "container executable", ~7MB)

# If you need SSL certificates for HTTPS, replace `FROM SCRATCH` with:
#
#   FROM alpine:3.7
#   RUN apk --no-cache add ca-certificates
#
FROM alpine:3.10.2
RUN apk --no-cache add ca-certificates
#FROM scratch
WORKDIR /root/
COPY --from=builder /go/src/app .
COPY --from=builder /var/lib/ewi-server/repo /var/lib/ewi-server/repo
VOLUME /var/lib/ewi-server/repo
COPY --from=build-deps /usr/src/app/build /var/lib/ewi-server/static

EXPOSE 80
ENTRYPOINT ["./app"]