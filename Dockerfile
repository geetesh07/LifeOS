# Multi-stage Dockerfile for LifeOS

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy all source code
COPY . .

# Build client and server
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
# dist/index.js - compiled server
# dist/public/ - compiled client (Vite output)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 7777

# Set environment
ENV NODE_ENV=production
ENV PORT=7777

# Start the application
CMD ["node", "dist/index.js"]
