# ============================================================
# ALL-IN-ONE: gateway + microservicios en UN solo contenedor
# ------------------------------------------------------------
# Render ejecuta un contenedor por servicio y no corre
# docker-compose, así que este Dockerfile arranca todo el
# backend en un único proceso Node (ver start-all.js).
#
# En docker-compose (dev/prod) NO se usa este archivo: cada
# servicio conserva su propio Dockerfile.
# ============================================================
FROM node:22-alpine

WORKDIR /app

# --- Dependencias -------------------------------------------------
# package.json de cada workspace primero para cachear esta capa.
# npm workspaces instala todo en un solo node_modules compartido
# (menos disco en build y menos RAM en runtime).
COPY package.json package-lock.json* ./
COPY gateway/package.json ./gateway/package.json
COPY services/auth-service/package.json ./services/auth-service/package.json
COPY services/users-service/package.json ./services/users-service/package.json
COPY services/events-service/package.json ./services/events-service/package.json
COPY services/reservations-service/package.json ./services/reservations-service/package.json
COPY services/notifications-service/package.json ./services/notifications-service/package.json
COPY services/requests-service/package.json ./services/requests-service/package.json
COPY services/resources-service/package.json ./services/resources-service/package.json
COPY services/feedback-service/package.json ./services/feedback-service/package.json
COPY services/academic-info-service/package.json ./services/academic-info-service/package.json
COPY services/configuration-service/package.json ./services/configuration-service/package.json
COPY services/search-service/package.json ./services/search-service/package.json

RUN npm install --no-audit --no-fund

# --- Código -------------------------------------------------------
COPY . .

# El gateway (y el health check de Render) escucha en PORT.
EXPOSE 3000

CMD ["node", "start-all.js"]
