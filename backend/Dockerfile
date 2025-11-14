# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./

# Install curl for healthcheck and wait for database
RUN apk add --no-cache curl

# Install sequelize-cli globally for migrations
RUN npm install -g sequelize-cli

EXPOSE 5000

# Install netcat-openbsd for database connection check
RUN apk add --no-cache netcat-openbsd

# Copy and set permissions for entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"]