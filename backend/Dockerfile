FROM golang:1.26-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates git

ARG TARGETOS=linux
ARG TARGETARCH=amd64

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/CodeMaster ./cmd/CodeMaster

FROM alpine:3.21

ENV CodeMaster_ENVIRONMENT=production \
    CodeMaster_DATABASE_AUTO_MIGRATE=false

WORKDIR /app

RUN apk add --no-cache ca-certificates && addgroup -S CodeMaster && adduser -S CodeMaster -G CodeMaster

COPY --from=builder /out/CodeMaster /app/CodeMaster

USER CodeMaster

EXPOSE 8000

CMD ["/app/CodeMaster", "serve"]
