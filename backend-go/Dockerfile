FROM golang:1.20-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o finance-app

FROM alpine:3.18
WORKDIR /app
COPY --from=build /app/finance-app ./finance-app
EXPOSE 8000
CMD ["./finance-app"]
