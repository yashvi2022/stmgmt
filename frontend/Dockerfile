
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files

COPY package*.json ./

# Install dependencies (use npm install instead of npm ci)
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage

FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a simple nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
