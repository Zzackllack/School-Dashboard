FROM node:18-alpine AS build
SHELL ["/bin/ash", "-eo", "pipefail", "-c"]
WORKDIR /app
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
# Update API URLs in the code (replaces localhost:8080 with /api)
RUN find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 \
    | xargs -0 sed -i 's|http://localhost:8080|/api|g' \
    || echo "No files found or modified"
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY Docker/nginx.conf /etc/nginx/conf.d/default.conf
# Install wget for healthcheck
RUN apk add --no-cache wget=1.25.0-r2
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
