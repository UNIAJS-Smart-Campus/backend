# Backend — UAJS Smart Campus

Microservicios Node.js + Express + MySQL para la plataforma UAJS Smart Campus.

## Estructura

```
backend/
├── gateway/                    # API Gateway (puerto 3000)
├── services/
│   ├── auth-service/           # Autenticación JWT (puerto 3001)
│   ├── users-service/          # Gestión de usuarios (puerto 3002)
│   ├── events-service/         # Eventos y actividades (puerto 3003)
│   ├── reservations-service/   # Reservas (puerto 3004)
│   ├── notifications-service/  # Notificaciones (puerto 3005)
│   ├── requests-service/       # Solicitudes (puerto 3006)
│   └── resources-service/      # Recursos (puerto 3007)
├── database/
│   ├── migrations/
│   └── seeds/
└── uajs_smart_campus.sql       # Schema inicial
```

## Configuración

1. Crear `.env` en la raíz a partir de `.env.example` (incluye `JWT_SECRET`).
2. Importar `database/uajs_smart_campus.sql` en MySQL.
3. En bases de datos ya existentes, aplicar `database/migrations/*.sql`.
4. Instalar dependencias en cada servicio y en el gateway.
5. Ejecutar `node src/server.js` en cada servicio, y luego en el gateway.

## Autenticación y autorización

- El login devuelve un **JWT**; el frontend lo guarda y lo envía como `Authorization: Bearer <token>`.
- El **gateway** valida el token y propaga la identidad a los servicios en los headers internos
  `x-user-id` y `x-user-role`. El cliente no puede falsificarlos: el gateway los sobrescribe.
- Rutas públicas: `POST /api/auth/login`, `POST /api/auth/register` y
  `POST /api/notifications/webhook` (protegido por su propio secreto).
- Los servicios filtran por propietario/rol:
  - solicitudes, reservas y PQRS: cada usuario ve solo lo suyo; los roles de gestión ven todo;
  - notificaciones: solo las del usuario autenticado;
  - usuarios: el directorio público oculta correo/teléfono/identificación; el detalle completo
    y las mutaciones quedan para administradores;
  - configuración: cada usuario solo accede a la suya;
  - recursos e info académica: lectura para todos, mutaciones para los roles gestores.
- Socket.IO exige el JWT en `socket.handshake.auth.token`.
- Los puertos de los microservicios ya no se publican en el host; la única entrada externa es el
  gateway (`3000`). MySQL y phpMyAdmin quedan escuchando en `127.0.0.1`.
- La búsqueda global (`/api/search`) queda restringida a administradores porque puede exponer
  datos del índice de usuarios.

Variables relevantes (ver `.env.example`):

```env
JWT_SECRET=cambiar-en-cada-entorno
JWT_EXPIRES=24h

NOTIFICATIONS_WEBHOOK_SECRET=uajs-dev-webhook-secret
# Opcional en el frontend (por defecto usa el origen de VITE_API_URL)
VITE_WS_URL=http://localhost:3000
```

## Tiempo real (WebSocket + webhooks)

Las notificaciones ya no dependen de polling:

- `notifications-service` expone **Socket.IO** en el mismo puerto de su API (`3005`, path `/socket.io`).
- El **gateway** proxya Socket.IO en `http://localhost:3000/socket.io` (HTTP polling + upgrade a WebSocket).
- Los servicios `requests`, `reservations`, `events` y `feedback` reportan cambios al webhook interno
  `POST /api/notifications/webhook`; `notifications-service` persiste la notificación y la emite al usuario
  (o a la sala `admins`) por WebSocket.
- El frontend se suscribe automáticamente al iniciar sesión y refresca badge, dashboard y bandeja sin recargar.

## phpMyAdmin

El `docker-compose.yml` de la raíz incluye phpMyAdmin en **http://localhost:8080** (`PMA_HOST=mysql`).


## Documentación

Ver `docs/IMPLEMENTACION_BACKEND.md` para la guía paso a paso.
