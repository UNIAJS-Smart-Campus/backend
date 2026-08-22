# Guía de Implementación del Backend — UAJS Smart Campus

Esta guía explica cómo completar la implementación del backend de microservicios con Node.js, Express, MySQL y API Gateway.

---

## 1. Preparación del entorno

### Variables de entorno

Crear `backend/.env`:

```env
DB_HOST=localhost
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

JWT_SECRET=tu_clave_secreta_muy_larga_y_aleatoria_aqui
JWT_EXPIRES=24h
```

### Configurar XAMPP/MySQL

1. Abrir phpMyAdmin (`http://localhost/phpmyadmin`)
2. Crear la base de datos `uajs_smart_campus`
3. Importar `backend/database/uajs_smart_campus.sql`

---

## 2. Estructura del proyecto

```
backend/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── docker-compose.yml
├── scripts/
│   ├── dev.js
│   └── setup.js
├── docs/
│   └── IMPLEMENTACION_BACKEND.md
├── gateway/
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── config/
│       │   └── routes.js
│       ├── middlewares/
│       │   └── auth.js
│       ├── app.js
│       └── server.js
├── services/
│   ├── auth-service/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── config/
│   │       │   └── database.js
│   │       ├── controllers/
│   │       │   └── auth.controller.js
│   │       ├── routes/
│   │       │   └── auth.routes.js
│   │       ├── middlewares/
│   │       │   ├── auth.js
│   │       │   └── errorHandler.js
│   │       ├── app.js
│   │       └── server.js
│   ├── users-service/
│   ├── events-service/
│   ├── reservations-service/
│   └── notifications-service/
├── shared/
│   ├── middlewares/
│   │   └── errorHandler.js
│   └── utils/
│       └── response.js
└── database/
    ├── migrations/
    ├── seeds/
    └── uajs_smart_campus.sql
```

### Estructura común de cada microservicio

Cada servicio comparte la misma estructura:

```
services/<service-name>/
├── package.json
├── Dockerfile
└── src/
    ├── config/
    │   └── database.js
    ├── controllers/
    │   └── <service>.controller.js
    ├── routes/
    │   └── <service>.routes.js
    ├── middlewares/
    │   ├── auth.js
    │   └── errorHandler.js
    ├── app.js
    └── server.js
```

---

## 3. Implementar los servicios uno por uno

### Orden recomendado:

1. **auth-service** → Login/registro, emisión de JWT
2. **users-service** → CRUD de usuarios, roles
3. **events-service** → CRUD de eventos
4. **reservations-service** → CRUD de reservas
5. **notifications-service** → CRUD de notificaciones
6. **gateway** → Proxy inverso + routing

### Template base para cada servicio

**`src/app.js`**:

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));

// Middleware de errores
app.use(require('./middlewares/errorHandler'));

module.exports = app;
```

**`src/server.js`**:

```js
const app = require('./app');
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servicio corriendo en puerto ${PORT}`);
});
```

**`src/middlewares/errorHandler.js`**:

```js
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = errorHandler;
```

---

## 4. auth-service (el más crítico)

**`src/config/database.js`** (completar el existente):

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
```

**`src/controllers/auth.controller.js`**:

- `login(usuario, password)`: Busca en tabla `usuarios`, verifica contraseña (bcrypt), genera JWT
- `register(data)`: Crea usuario con contraseña hasheada
- `me(token)`: Decodifica JWT y retorna usuario

**`src/routes/auth.routes.js`**:

- `POST /api/auth/login` → auth.controller.login
- `POST /api/auth/register` → auth.controller.register
- `GET /api/auth/me` → middleware verifyToken + auth.controller.me

**Dependencias para auth-service**:

```bash
cd backend/services/auth-service
npm install bcryptjs jsonwebtoken mysql2 dotenv cors
```

---

## 5. API Gateway

El gateway debe:

1. Recibir todas las peticiones en puerto 3000
2. Enrutar por prefijo de ruta:
   - `/api/auth/*` → auth-service (3001)
   - `/api/users/*` → users-service (3002)
   - `/api/events/*` → events-service (3003)
   - `/api/reservations/*` → reservations-service (3004)
   - `/api/notifications/*` → notifications-service (3005)
3. Validar JWT en rutas protegidas
4. Reenviar headers de autenticación

**Template básico** (`gateway/src/app.js`):

```js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
app.use('/api/events', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
app.use('/api/reservations', createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true }));
app.use('/api/notifications', createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));

module.exports = app;
```

**Dependencias del gateway**:

```bash
cd backend/gateway && npm install express cors http-proxy-middleware
```

---

## 6. Docker Compose (opcional pero recomendado)

**`docker-compose.yml`**:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: uajs_smart_campus
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./database/uajs_smart_campus.sql:/docker-entrypoint-initdb.d/init.sql

  gateway:
    build: ./gateway
    ports:
      - "3000:3000"
    depends_on:
      - auth-service
      - users-service
      - events-service
      - reservations-service
      - notifications-service

  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=mysql
    depends_on:
      - mysql

  users-service:
    build: ./services/users-service
    ports:
      - "3002:3002"
    environment:
      - DB_HOST=mysql
    depends_on:
      - mysql

  events-service:
    build: ./services/events-service
    ports:
      - "3003:3003"
    environment:
      - DB_HOST=mysql
    depends_on:
      - mysql

  reservations-service:
    build: ./services/reservations-service
    ports:
      - "3004:3004"
    environment:
      - DB_HOST=mysql
    depends_on:
      - mysql

  notifications-service:
    build: ./services/notifications-service
    ports:
      - "3005:3005"
    environment:
      - DB_HOST=mysql
    depends_on:
      - mysql

volumes:
  mysql-data:
```

Cada servicio necesita un `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 7. Conexión desde el frontend

Crear `frontend/src/services/api.js`:

```js
const API_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('uajs_session');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${JSON.parse(token).usuario}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en la petición');
  }

  return response.json();
}

export const authAPI = {
  login: (creds) => request('/auth/login', { method: 'POST', body: JSON.stringify(creds) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

export const usersAPI = {
  list: () => request('/users'),
  create: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
};

// ... otros servicios
```

Luego reemplazar los mocks en `utils/users.js`, `utils/solicitudes.js`, etc., por llamadas a esta API.

---

## 8. Flujo de trabajo recomendado

```
1. auth-service (login + JWT)     → 2-3 horas
2. users-service (CRUD usuarios)  → 2 horas
3. events-service                 → 1.5 horas
4. reservations-service           → 2 horas
5. notifications-service          → 1.5 horas
6. Gateway con proxy              → 1 hora
7. Conectar frontend a API        → 3-4 horas
8. Tests básicos                  → 2 horas
9. Docker +部署                   → 1 hora
```

**Total estimado**: 14-17 horas de trabajo.

---

## 9. Comandos útiles

```bash
# Iniciar todos los servicios (si usás Docker)
docker-compose up --build

# O iniciar manualmente (en terminales separadas)
cd backend/gateway && node src/server.js
cd backend/services/auth-service && node src/server.js
cd backend/services/users-service && node src/server.js
cd backend/services/events-service && node src/server.js
cd backend/services/reservations-service && node src/server.js
cd backend/services/notifications-service && node src/server.js

# Probar auth
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'
```

---

## 10. Checklist de verificación

- [ ] auth-service responde en `/api/auth/login` con JWT
- [ ] Gateway enruta correctamente a cada servicio
- [ ] Frontend se autentica contra el backend real
- [ ] ProtectedRoute valida JWT en lugar de localStorage mock
- [ ] CRUD de usuarios funciona desde `/usuarios`
- [ ] Eventos, reservas y notificaciones se guardan en MySQL
- [ ] Docker Compose levanta todo con un comando
- [ ] ESLint pasa sin errores

Empezá por **auth-service**: es la base de todo. Una vez que el login funcione con JWT real, el resto cae en cascada.
