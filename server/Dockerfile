# Multi-stage build setup (https://docs.docker.com/develop/develop-images/multistage-build/)

# Stage 1 (to create a "build" image, ~850MB)
FROM golang:1.10.1 AS builder
RUN go version

COPY *.go /go/src/runs-state-service/
COPY vendor /go/src/runs-state-service/vendor
COPY Gopkg.* /go/src/runs-state-service/
WORKDIR /go/src/runs-state-service/
RUN set -x && \
    go get github.com/golang/dep/cmd/dep
#     && \
#    dep ensure -v

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o app .

RUN mkdir -p /var/lib/files
RUN mkdir -p /var/lib/sites

# Stage 2 (to create a downsized "container executable", ~7MB)

# If you need SSL certificates for HTTPS, replace `FROM SCRATCH` with:
#
#   FROM alpine:3.7
#   RUN apk --no-cache add ca-certificates
#
FROM scratch
WORKDIR /root/
COPY --from=builder /go/src/runs-state-service/app .
COPY database ./database
COPY --from=builder /var/lib/files /var/lib/files
VOLUME /var/lib/files
COPY --from=builder /var/lib/sites /var/lib/sites
VOLUME /var/lib/sites

EXPOSE 8888
ENTRYPOINT ["./app"]