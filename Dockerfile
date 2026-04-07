# build stage
FROM node:22-alpine AS build

WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm install

# copy all files and build
COPY . .
RUN npm run build

# serve stage
FROM nginx:stable-alpine AS serve

# copy the built static files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# custom nginx config for SPA routing
RUN printf "server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    try_files \$uri \$uri/ /index.html;\n  }\n}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
