# Mock API Server - UAJS Smart Campus

Servidor mock que provee datos sintéticos para el frontend de Smart Campus.

## Instalación

```bash
cd backend/mock-server
npm install
```

## Ejecución

```bash
npm run dev    # Con nodemon (desarrollo)
npm start      # Sin nodemon (producción)
```

El servidor se ejecuta en `http://localhost:3000` por defecto.

## Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login con usuario/contraseña
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/roles` - Listar roles y permisos

### Solicitudes
- `GET /api/requests` - Listar solicitudes
- `GET /api/requests/:id` - Obtener solicitud por ID
- `POST /api/requests` - Crear solicitud
- `PUT /api/requests/:id` - Actualizar solicitud
- `PATCH /api/requests/:id/advance` - Avanzar estado
- `DELETE /api/requests/:id` - Eliminar solicitud

### Eventos
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Obtener evento por ID
- `POST /api/events` - Crear evento
- `PUT /api/events/:id` - Actualizar evento
- `DELETE /api/events/:id` - Eliminar evento
- `POST /api/events/:id/register` - Inscribirse a evento

### Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `PATCH /api/notifications/:id/read` - Marcar como leída
- `PATCH /api/notifications/read-all` - Marcar todas como leídas

### PQRS
- `GET /api/feedback` - Listar PQRS
- `GET /api/feedback/:id` - Obtener PQRS por ID
- `POST /api/feedback` - Crear PQRS

### Recursos
- `GET /api/resources` - Listar recursos
- `GET /api/resources/:id` - Obtener recurso por ID
- `POST /api/resources` - Crear recurso
- `PUT /api/resources/:id` - Actualizar recurso
- `DELETE /api/resources/:id` - Eliminar recurso

### Reservas
- `GET /api/reservations` - Listar reservas
- `POST /api/reservations` - Crear reserva

### Servicios
- `GET /api/services` - Listar servicios

### Reportes
- `GET /api/reports` - Obtener datos para reportes

## Usuarios de Prueba

Las contraseñas de demo no se publican en el repositorio. Están guardadas con hash bcrypt en
`server.js` (el login funciona igual); consulta el archivo local `LOGINS_USUARIOS.md`
(excluido por `.gitignore`) o pídelas al equipo.

## Configuración

El puerto se puede cambiar con la variable de entorno `MOCK_PORT`:

```bash
MOCK_PORT=4000 npm start
```
