# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Réduire les échecs réseau (timeouts, retries)
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

COPY package*.json ./
# Retry npm ci en cas de ECONNRESET / instabilité réseau
RUN for i in 1 2 3; do npm ci && break || { [ $i -eq 3 ] && exit 1; sleep 10; }; done

# ngsw-config.json requis pour le build production (PWA). Créé ici pour que le build réussisse même si absent du contexte déployé.
RUN echo '{"$schema":"./node_modules/@angular/service-worker/config/schema.json","index":"/index.html","assetGroups":[{"name":"app","installMode":"prefetch","resources":{"files":["/favicon.ico","/index.csr.html","/index.html","/manifest.webmanifest","/*.css","/*.js"]}},{"name":"assets","installMode":"lazy","updateMode":"prefetch","resources":{"files":["/**/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"]}}]}' > ngsw-config.json

COPY . .
# Build production pour que apiBaseUrl soit '' et que les appels aillent vers /api (proxy nginx)
RUN npm run build -- --configuration=production

# Run stage: nginx
FROM nginx:alpine
COPY --from=build /app/dist/vcard/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
