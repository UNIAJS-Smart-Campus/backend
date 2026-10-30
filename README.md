# Backend — UAJS Smart Campus

Microservicios Node.js + Express + MySQL para la plataforma UAJS Smart Campus.

## Estructura

```
backend/
├── gateway/                    # API Gateway (puerto 3000)
├── services/
│   ├── auth-service/           # Autenticación JWT (3001)
│   ├── users-service/          # Usuarios (3002)
│   ├── events-service/         # Eventos (3003)
│   ├── reservations-service/   # Reservas (3004)
│   ├── notifications-service/  # Notificaciones (3005)
│   ├── requests-service/       # Solicitudes (3006)
│   ├── resources-service/      # Recursos (3007)
│   ├── feedback-service/       # PQRS (3008)
│   ├── academic-info-service/  # Información académica (3009)
│   ├── configuration-service/  # Configuración (3010)
│   └── search-service/         # Búsqueda / Elasticsearch (3011)
├── shared/
├── database/
│   ├── migrations/
│   └── seeds/
└── uajs_smart_campus.sql       # Schema + datos iniciales
```

## Base de datos y phpMyAdmin con Docker

Desde la raíz del monorepo (donde está `docker-compose.yml`):

```bash
docker compose up -d mysql db-init phpmyadmin
```

- MySQL: `127.0.0.1:3306` — usuario `root`, sin contraseña (solo local).
- phpMyAdmin: <http://localhost:8080> — entra como `root` con la contraseña vacía.
- `db-init` espera a que MySQL esté sano y comprueba si existe la tabla `usuarios`:
  - si no existe, recrea `uajs_smart_campus` e importa `backend/uajs_smart_campus.sql`;
  - si ya existe, conserva los datos y termina.

Para reimportar desde cero (elimina los datos actuales):

```bash
# PowerShell
$env:DB_RESET="1"; docker compose up db-init

# Bash
DB_RESET=1 docker compose up db-init
```

Para levantar todo (MySQL, Elasticsearch, microservicios y frontend):

```bash
docker compose up -d --build
```

Los puertos locales se pueden cambiar sin editar el compose:
`MYSQL_HOST_PORT=3307` y `PHPMYADMIN_PORT=8081`.

> MySQL y phpMyAdmin están publicados solo en `127.0.0.1`. No los expongas
> directamente a Internet en producción.

## Configuración manual (sin Docker)

1. Crear `backend/.env` (ver `docs/IMPLEMENTACION_BACKEND.md`).
2. Importar `uajs_smart_campus.sql` en MySQL.
3. Instalar dependencias en cada servicio y en el gateway.
4. Ejecutar `node src/server.js` en cada servicio y luego en el gateway.

## Documentación

Ver `docs/IMPLEMENTACION_BACKEND.md` para la guía paso a paso.
Para producción (VPS + Docker + Caddy + Vercel): [`deploy/README.md`](deploy/README.md).

## Producción

El stack de producción está en `docker-compose.prod.yml`:

```bash
cp .env.prod.example .env.prod   # completar dominio, claves y CORS
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Solo Caddy publica 80/443; MySQL y Elasticsearch quedan en la red interna.
