# Despliegue en producción

Arquitectura:

```
Vercel (frontend)  ──HTTPS──>  Caddy (VPS, 80/443)
                                  │
                                  └──> gateway:3000
                                         ├── auth / users / events / ...
                                         ├── notifications (Socket.IO)
                                         ├── search ──> Elasticsearch
                                         └── MySQL
```

Vercel aloja **solo el frontend**. El backend corre en un VPS con Docker;
MySQL y Elasticsearch no se publican a Internet.

## Requisitos

- VPS con Ubuntu/Debian, Docker y Docker Compose (4 GB de RAM recomendados).
- Dominio `api.tudominio.com` con registro DNS **A/AAAA** apuntando al VPS.
- Puertos 80 y 443 abiertos (Caddy obtiene el certificado TLS solo).
- Repositorio `UNIAJS-Smart-Campus/backend` clonado en el VPS.

## 1. Variables

```bash
cp .env.prod.example .env.prod
```

Edita `.env.prod`:

- `API_DOMAIN`: dominio del API.
- `MYSQL_*`: contraseñas largas; `MYSQL_DATABASE` debe ser `uajs_smart_campus`.
- `JWT_SECRET`: genera uno con
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `CORS_ORIGINS`: dominio exacto de Vercel (y previews, separados por coma).
- `FRONT_URL`: URL del frontend (para el enlace de recuperación).
- `NOTIFICATIONS_WEBHOOK_SECRET`: secreto distinto al JWT.
- SMTP solo si vas a usar recuperación de contraseña.

Protege el archivo:

```bash
chmod 600 .env.prod
```

## 2. Levantar el stack

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

`db-init` crea/importa la base si la tabla `usuarios` no existe. No borra
datos en reinicios normales.

Comprobar:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f caddy
```

Caddy emite el certificado en el primer arranque. Prueba:

```bash
curl -i https://api.tudominio.com/api/events
# 401 sin token: el gateway responde y TLS funciona.
```

## 3. Vercel

En el proyecto de Vercel (`UNIAJS-Smart-Campus/frontend`) configura:

```
VITE_API_URL=https://api.tudominio.com/api
VITE_WS_URL=https://api.tudominio.com
```

`VITE_WS_URL` es opcional: si el backend no expone WebSocket, omítelo.
Caddy reenvía `/socket.io` con upgrade automático.

Vuelve a desplegar después de cambiar variables. El dominio de Vercel debe
estar en `CORS_ORIGINS` del backend.

## 4. Firewall

```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp      # idealmente restringido a tu IP
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp     # HTTP/3
sudo ufw enable
```

No abras `3306`, `8080`, `9200` ni `3000`: el compose de producción no los
publica y MySQL/Elasticsearch quedan en la red interna.

## 5. Operación

Actualizar:

```bash
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Backup de MySQL:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T mysql \
  sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction uajs_smart_campus' \
  > backup-$(date +%F).sql
```

Reimportar la semilla (destructivo):

```bash
DB_RESET=1 docker compose --env-file .env.prod -f docker-compose.prod.yml up db-init
```

## Notas

- Caddy necesita el DNS apuntando directo al VPS. Si usas Cloudflare con proxy
  naranja, configura el desafío DNS de ACME o desactiva el proxy para el
  subdominio del API.
- El frontend se sirve desde Vercel; no se usa el servicio `frontend-dev` en
  producción.
- Elasticsearch queda sin autenticación porque solo es accesible dentro de la
  red Docker. Si el VPS es compartido, aísla la red o habilita `xpack.security`.
- Revisa los logs y rota `JWT_SECRET`, contraseñas de MySQL y el secreto del
  webhook si alguna vez se filtran.
