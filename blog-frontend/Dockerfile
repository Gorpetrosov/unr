# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=
ARG VITE_SITE_NAME=Horizon Notes
ARG VITE_SITE_URL=http://localhost:5173
ARG VITE_DEFAULT_LOCALE=en
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_NAME=$VITE_SITE_NAME \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_DEFAULT_LOCALE=$VITE_DEFAULT_LOCALE
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
