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
- `POST /api/notifications` - Crear notificación
- `PUT /api/notifications/:id` - Actualizar notificación
- `DELETE /api/notifications/:id` - Eliminar notificación
- `PATCH /api/notifications/:id/read` - Marcar como leída
- `PATCH /api/notifications/read-all` - Marcar todas como leídas

### PQRS
- `GET /api/feedback` - Listar PQRS
- `GET /api/feedback/:id` - Obtener PQRS por ID
- `POST /api/feedback` - Crear PQRS
- `PUT /api/feedback/:id` - Actualizar PQRS
- `DELETE /api/feedback/:id` - Eliminar PQRS

### Recursos
- `GET /api/resources` - Listar recursos
- `GET /api/resources/:id` - Obtener recurso por ID
- `POST /api/resources` - Crear recurso
- `PUT /api/resources/:id` - Actualizar recurso
- `DELETE /api/resources/:id` - Eliminar recurso

### Reservas
- `GET /api/reservations` - Listar reservas
- `POST /api/reservations` - Crear reserva
- `PUT /api/reservations/:id` - Actualizar reserva
- `DELETE /api/reservations/:id` - Eliminar reserva

### Información académica
- `GET /api/academic-info` - Listar publicaciones
- `GET /api/academic-info/:id` - Obtener publicación por ID
- `POST /api/academic-info` - Crear publicación
- `PUT /api/academic-info/:id` - Actualizar publicación
- `DELETE /api/academic-info/:id` - Eliminar publicación

### Configuración
- `GET /api/configuration` - Listar configuración (filtrable por `id_usuario`)
- `GET /api/configuration/usuario/:idUsuario/seccion/:seccion` - Leer una sección
- `POST /api/configuration` - Crear configuración
- `PUT /api/configuration/:id` - Actualizar configuración
- `DELETE /api/configuration/:id` - Eliminar configuración

### Búsqueda
- `GET /api/search?q=` - Buscar en todas las entidades
- `GET /api/search/suggest?q=` - Sugerencias
- `GET /api/search/indices` - Índices disponibles

### Servicios
- `GET /api/services` - Listar servicios

### Reportes
- `GET /api/reports` - Obtener datos para reportes

## Usuarios de Prueba

Todas las cuentas usan la contraseña **`admin123`** y son datos ficticios. El login acepta la
identificación (con o sin puntos), el usuario o el correo.

| Identificación | Usuario | Nombre | Rol |
|---|---|---|---|
| 1023456789 | admin | Natalia Rodríguez | Administrador |
| 1023456788 | funcionario | Carlos Méndez | Administrativo |
| 1023456787 | profesor | Laura Gómez | Docente |
| 1023456786 | estudiante | Andrés Torres | Estudiante |
| 1023456785 | lucia.paredes | Lucía Paredes | Docente |
| 1023456784 | andres.ruiz | Andrés Ruiz | Estudiante |
| 1023456783 | maria.torres | María Torres | Estudiante |
| 1023456782 | jorge.salazar | Jorge Salazar | Estudiante |

## Configuración

El puerto se puede cambiar con la variable de entorno `MOCK_PORT`:

```bash
MOCK_PORT=4000 npm start
```
