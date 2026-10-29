# Arquitectura — UAJS Smart Campus

> Fecha: 28 de agosto de 2026
> Descripción: arquitectura de la plataforma **UniAJS** (Corporación Universitaria Antonio José de Sucre): frontend React + backend de microservicios con API Gateway + MySQL, orquestados con Docker.

---

## 1. Visión general

La plataforma se divide en dos aplicaciones independientes que se comunican por HTTP a través de un **API Gateway**:

```
┌────────────────────┐         HTTP          ┌─────────────────────────────┐
│   FRONTEND (React) │  ───────────────────► │        API GATEWAY          │
│   Vite · :5173     │   /api/*  (3000)      │   Express + proxy           │
│   VITE_API_URL     │                        └──────────────┬──────────────┘
└────────────────────┘                                       │ /api/<servicio>
                                                             ▼
   ┌──────────┬──────────┬──────────┬──────────┬───────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
    │ auth     │ users    │ events   │ reservas │ notif.    │ requests │ resources│ feedback │ acad.info│ config.  │
    │ 3001     │ 3002     │ 3003     │ 3004     │ 3005      │ 3006     │ 3007     │ 3008     │ 3009     │ 3010     │
   └──────────┴──────────┴──────────┴──────────┴───────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │    MySQL    │
                                  │ :3306       │
                                  │ uajs_smart_ │
                                  │ campus      │
                                  └─────────────┘
```

**Stack:**
- **Frontend**: React 19 + Vite 8, JavaScript (JSX), CSS con arquitectura **BEM**.
- **Backend**: Node.js 20 + Express 5, microservicios + API Gateway (`http-proxy-middleware`).
- **Base de datos**: MySQL 8 (`uajs_smart_campus`).
- **Orquestación**: Docker + Docker Compose.

---

## 2. Backend (microservicios)

### 2.1 Servicios y puertos

| Servicio | Puerto | Responsabilidad |
|---|---|---|
| `gateway` | 3000 | API Gateway: enruta `/api/<servicio>` a cada microservicio |
| `auth-service` | 3001 | Autenticación (login, registro, `me`) + JWT |
| `users-service` | 3002 | Usuarios |
| `events-service` | 3003 | Eventos y actividades |
| `reservations-service` | 3004 | Reservas de espacios/recursos |
| `notifications-service` | 3005 | Notificaciones |
| `requests-service` | 3006 | Solicitudes |
| `resources-service` | 3007 | Recursos |
| `feedback-service` | 3008 | Feedback (peticiones, quejas, reclamos) |
| `academic-info-service` | 3009 | Información académica |
| `configuration-service` | 3010 | Configuración del sistema |

### 2.2 Estructura de un microservicio

Todos los servicios siguen el **mismo patrón**:

```
backend/services/<servicio>/
├── Dockerfile
├── compose.yaml
├── package.json            # scripts: start → node src/server.js
└── src/
    ├── server.js           # arranque (listen en PORT)
    ├── app.js              # Express: cors, json, rutas, errorHandler
    ├── config/
    │   └── database.js     # pool de mysql2/promise
    ├── controllers/        # lógica de negocio
    ├── routes/             # definición de endpoints
    └── middlewares/        # auth (JWT), errorHandler
```

### 2.3 API Gateway

- **Archivo**: `backend/gateway/src/app.js` + `src/config/routes.js`.
- Usa `http-proxy-middleware` para reenviar cada prefijo `/api/<servicio>` al microservicio correspondiente.
- Los targets apuntan a los **nombres de servicio** de Docker (no `localhost`):

```js
// routes.js
module.exports = {
    auth: 'http://auth-service:3001',
    users: 'http://users-service:3002',
    // ...
};
```

- El gateway **no** hace `express.json()` global (consumiría el body de los `POST` antes de reenviarlos).
- `middlewares/auth.js` exige `Authorization: Bearer <token>` en las rutas protegidas.

### 2.4 Autenticación (auth-service)

- **JWT**: firma con `JWT_SECRET` (default `uajs_secret_key_2026`) y expira en `JWT_EXPIRES` (default `24h`).
- Endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`.
- El `login` recibe `{ identificacion, password }`, busca en `usuarios` por `identificacion` y compara la contraseña (en claro en desarrollo).

### 2.5 Base de datos

- **Nombre**: `uajs_smart_campus` (script `backend/database/uajs_smart_campus.sql`).
- **Tablas**: `usuarios`, `roles`, `servicios`, `solicitudes`, `reservas`, `recursos`, `eventos_y_actividades`, `notificaciones`.
- **Roles** (`roles.id_rol`):

| id_rol | Rol |
|---|---|
| 1 | Administrador |
| 2 | Estudiante |
| 3 | Docente |
| 4 | Administrativo |

- Acceso desde los servicios: pool `mysql2/promise` usando `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## 3. Frontend (React)

### 3.1 Estructura

```
frontend/
├── dockerfile.dev
├── .dockerignore
├── .env                     # VITE_API_URL=http://localhost:3000/api
└── src/
    ├── main.jsx             # entry point
    ├── App.jsx
    ├── assets/
    ├── components/          # Button, Input, Modal, Navbar, Sidebar,
    │                        # SearchBar, ServiceCard, StatusBadge, Icon, ...
    ├── pages/               # una carpeta por módulo (Login, Dashboard,
    │                        # Eventos, Recursos, Solicitudes, Reservas, ...)
    ├── context/             # AuthContext.jsx, useAuth.js, auth-context.js
    ├── hooks/               # usePagination.js, useSearch.js
    ├── layouts/             # DashboardLayout.jsx
    ├── routes/              # AppRoutes.jsx
    ├── utils/               # api.js, users.js, eventos.js, recursos.js, ...
    └── styles/              # abstracts, base, utils (+ blocks/components/pages legados)
```

### 3.2 Arquitectura CSS (BEM)

- Convención **`.bloque__elemento--modificador`**.
- **Design tokens** en `styles/abstracts/_variables.css` (paleta navy/dorado, sombras, radios, espaciado).
- CSS **co-localizado**: cada componente/página tiene su `.css` junto al `.jsx`.
- `styles/main.css` importa solo `abstracts/`, `base/` y `utils/`.

### 3.3 Estado global y autenticación

- **`AuthContext`** (React Context): provee `user`, `login`, `logout`, `tienePermiso`, `puede`, `esAdmin`, etc.
- La sesión se guarda en `localStorage` (`uajs_session`) con el token.
- **`mapearRol`** traduce `id_rol` (de la BD) a nombre de rol (`1 → "Administrador"`, …).
- Los permisos por rol están en `utils/users.js` (`ROLES`, `permisosDeRol`, `accionesDeRol`).

### 3.4 Conexión con el backend (`utils/api.js`)

```js
const API = import.meta.env.VITE_API_URL;   // http://localhost:3000/api

async function apiFetch(path, { method, body }) {
    // agrega Authorization: Bearer <token> (desde localStorage)
    // devuelve res.json().data
}

export const authApi = {
    login: (identificacion, password) => apiFetch("/auth/login", { method: "POST", body: { identificacion, password } }),
    me: () => apiFetch("/auth/me")
};
```

- **Modo offline**: los módulos operan sobre datos semilla/localStorage (`utils/*.js`), por lo que la app funciona aunque el backend esté apagado.

### 3.5 Enrutamiento

- `routes/AppRoutes.jsx` con `react-router-dom`.
- `components/ProtectedRoute` protege rutas según rol/permisos.
- Layout principal: `layouts/DashboardLayout.jsx` (Sidebar + Navbar + contenido).

---

## 4. Flujo de login (end-to-end)

```
Login.jsx
  └─ AuthContext.login(identificacion, password)
      └─ api.js → fetch POST http://localhost:3000/api/auth/login
          └─ Gateway (proxy) → auth-service:3001/api/auth/login
              └─ auth.controller.js → SELECT ... FROM usuarios WHERE identificacion = ?
                  └─ MySQL
          ◄─ { data: { id_usuario, identificacion, rol, token, ... } }
  └─ guarda sesión en localStorage → navega a /dashboard
```

---

## 5. Docker / Despliegue

### 5.1 `docker-compose.yml` (raíz)

Define el stack completo:

- `mysql` (3306) — monta el script SQL en `/docker-entrypoint-initdb.d/` (se ejecuta solo la primera vez).
- `elasticsearch` (9200) — backend de búsqueda de `search-service`.
- `gateway` (3000) y los 11 microservicios (3001–3011).
- `frontend-dev` (5173) — desarrollo con hot-reload (monta `./frontend` y usa `dockerfile.dev`).

Los servicios de backend usan `env_file: .env` y dependen de `mysql` con `condition: service_healthy`. Todos comparten la red `smart-campus-network`.

> El compose de referencia es **solo** el de la raíz. El antiguo `backend/docker-compose.yml` se eliminó en la iteración 4: era YAML inválido (tabulaciones), duplicaba servicios y montaba una ruta de SQL inexistente.

### 5.2 Dockerfiles

- **Backend**: `FROM node:20-alpine`, `npm install`, `COPY . .`, `EXPOSE <puerto>`, `CMD ["npm", "start"]`.
- **Frontend (dev)**: `FROM node:20-slim`, `npm ci`, `EXPOSE 5173`, `CMD ["npm", "run", "dev"]` (Vite 8 requiere Node ≥ 20 y glibc por rolldown).

### 5.3 compose.yaml por servicio

Cada servicio tiene su `compose.yaml` (patrón individual) que usa la red externa `smart-campus-network`:

```yaml
services:
  <servicio>:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${<SERVICIO>_PORT:-<puerto>}:<puerto>"
    environment:
      DB_HOST: mysql
      # ...
    env_file:
      - ../../../.env
    networks:
      - smart-campus-network

networks:
  smart-campus-network:
    external: true
```

> El `docker-compose.yml` raíz crea la red `smart-campus-network` con nombre fijo y conecta todos sus servicios. Los `compose.yaml` individuales la declaran como `external: true`, así que **deben levantarse después de la raíz**; de lo contrario fallan con `network ... declared as external, but could not be found`.

### 5.4 Variables de entorno (`.env` raíz)

```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=uajs_smart_campus

GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
USERS_SERVICE_PORT=3002
EVENTS_SERVICE_PORT=3003
RESERVATIONS_SERVICE_PORT=3004
NOTIFICATIONS_SERVICE_PORT=3005
REQUESTS_SERVICE_PORT=3006
RESOURCES_SERVICE_PORT=3007
PQRS_SERVICE_PORT=3008            # feedback-service
INFO_ACADEMICA_SERVICE_PORT=3009  # academic-info-service
CONFIGURACION_SERVICE_PORT=3010   # configuration-service

JWT_SECRET=<secreto compartido entre servicios>
JWT_EXPIRES=24h
NOTIFICATIONS_WEBHOOK_SECRET=<secreto compartido>
```

> `search-service` usa `SEARCH_SERVICE_PORT=3011`, definido directamente en el compose porque no forma parte de `.env`.

---

## 6. Comandos útiles

```bash
# Levantar todo el stack (crea la red smart-campus-network)
docker compose up -d

# Ver estado
docker compose ps

# Reconstruir un servicio tras cambios
docker compose build <servicio>
docker compose up -d --force-recreate <servicio>

# Frontend en desarrollo (hot-reload)
docker compose up -d frontend-dev

# Build de producción del frontend
cd frontend && npm run build

# Validar un compose
docker compose -f <archivo> config --quiet

# Bajar el stack (con -v borra también los volúmenes y la BD)
docker compose down
docker compose down -v
```

> Requisitos de Docker en Linux (plugin Compose, daemon, grupo `docker`) y solución de errores comunes: **[DOCKER-SETUP-LINUX.md](./DOCKER-SETUP-LINUX.md)**.
