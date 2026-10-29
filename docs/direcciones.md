# Mapa del Proyecto - UAJS Smart Campus

```
UAJS-Smart-Campus/
│
├── backend/                          # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/                   # Configuraciones del servidor
│   │   │   ├── db.js                 # Conexión a base de datos
│   │   │   ├── jwt.js                # Configuración de JWT
│   │   │   └── env.js                # Variables de entorno
│   │   │
│   │   ├── controllers/              # Lógica de las peticiones
│   │   │   ├── auth.controller.js    # Autenticación (login/registro)
│   │   │   ├── usuario.controller.js # Gestión de usuarios
│   │   │   ├── reserva.controller.js # Gestión de reservas
│   │   │   └── evento.controller.js  # Gestión de eventos
│   │   │
│   │   ├── routes/                   # Definición de rutas/endpoints
│   │   │   ├── auth.routes.js
│   │   │   ├── usuario.routes.js
│   │   │   ├── reserva.routes.js
│   │   │   └── evento.routes.js
│   │   │
│   │   ├── services/                 # Lógica de negocio
│   │   ├── middlewares/              # Middlewares del servidor
│   │   │   ├── auth.js               # Verificación de token
│   │   │   ├── roles.js              # Control de roles
│   │   │   └── errorHandler.js       # Manejo de errores
│   │   │
│   │   ├── models/                   # Modelos/estructuras de datos
│   │   ├── repositories/             # Acceso a base de datos
│   │   ├── utils/                    # Utilidades y helpers
│   │   ├── app.js                    # Configuración de Express
│   │   └── server.js                 # Punto de entrada del servidor
│   │
│   ├── package.json                  # Dependencias del backend
│   ├── package-lock.json
│   └── .env                          # Variables de entorno (no commitear)
│
├── frontend/                         # Cliente (React + Vite)
│   ├── public/                       # Archivos estáticos públicos
│   ├── src/
│   │   ├── assets/                   # Recursos estáticos
│   │   │   ├── icons/                # Iconos
│   │   │   ├── images/               # Imágenes
│   │   │   ├── logo/                 # Logotipos
│   │   │   ├── hero.png              # Imagen principal
│   │   │   ├── react.svg             # Logo de React
│   │   │   └── vite.svg              # Logo de Vite
│   │   │
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── Button/
│   │   │   │   ├── Button.css        # Estilos del botón
│   │   │   │   └── Button.jsx        # Botón reutilizable (variantes y tamaños)
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   │   ├── Input.css        # Estilos del campo de texto
│   │   │   │   └── Input.jsx        # Input reutilizable
│   │   │   ├── Loader/
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.css        # Estilos del modal
│   │   │   │   └── Modal.jsx        # Modal reutilizable
│   │   │   ├── Navbar/
│   │   │   │   ├── Navbar.css        # Estilos de la barra de navegación
│   │   │   │   └── Navbar.jsx        # Barra de navegación
│   │   │   ├── ServiceCard/
│   │   │   │   ├── ServiceCard.css   # Estilos de la tarjeta de servicio
│   │   │   │   └── ServiceCard.jsx   # Tarjeta de servicio
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.css       # Estilos del menú lateral
│   │   │   │   └── Sidebar.jsx       # Menú lateral
│   │   │   ├── StatusBadge/
│   │   │   │   ├── StatusBadge.css   # Estilos del badge de estado
│   │   │   │   └── StatusBadge.jsx   # Badge de estado con color según el estado
│   │   │   └── Table/
│   │   │
│   │   ├── context/                  # Contextos globales de React
│   │   ├── hooks/                    # Custom hooks
│   │   │   └── useSearch.js          # Filtra listas por consulta (useMemo)
│   │   ├── layouts/                  # Layouts de la aplicación
│   │   │   ├── DashboardLayout.css   # Estilos del layout
│   │   │   └── DashboardLayout.jsx   # Layout del dashboard
│   │   ├── pages/                    # Páginas / vistas
│   │   │   ├── Landing/
│   │   │   │   ├── Landing.css       # Estilos de la landing
│   │   │   │   └── Landing.jsx       # Landing de acceso (redirección a los 5s)
│   │   │   ├── Servicio/
│   │   │   │   ├── Servicio.css      # Estilos de la vista de servicio
│   │   │   │   └── Servicio.jsx      # Detalle de servicio (recursos y opciones)
│   │   │   ├── Configuracion/
│   │   │   │   ├── Configuracion.jsx # Configuración del sistema
│   │   │   │   └── Configuracion.css # Estilos de configuración
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.jsx     # Vista principal
│   │   │   ├── Eventos/
│   │   │   │   ├── Eventos.jsx       # Gestión de eventos
│   │   │   │   ├── Eventos.css       # Estilos de eventos
│   │   │   │   ├── Calendario/
│   │   │   │   ├── Inscripciones/
│   │   │   │   └── Publicaciones/
│   │   │   ├── Facultades/
│   │   │   ├── Login/
│   │   │   ├── Notificaciones/
│   │   │   │   ├── Notificaciones.jsx # Gestión de notificaciones
│   │   │   │   ├── Notificaciones.css # Estilos de notificaciones
│   │   │   │   ├── Correos/
│   │   │   │   ├── Push/
│   │   │   │   └── Alertas/
│   │   │   ├── Perfil/
│   │   │   │   ├── Perfil.jsx        # Perfil de usuario
│   │   │   │   ├── Perfil.css        # Estilos del perfil
│   │   │   │   ├── Datospersonales/
│   │   │   │   ├── Seguridad/
│   │   │   │   └── Cambiodecontraseña/
│   │   │   ├── PQRS/
│   │   │   │   ├── PQRS.jsx          # Peticiones, quejas, reclamos y sugerencias
│   │   │   │   ├── PQRS.css          # Estilos de PQRS
│   │   │   │   ├── MisPQRS/
│   │   │   │   └── NuevaPQRS/
│   │   │   │       ├── NuevaPQRS.jsx # Formulario de nueva PQRS
│   │   │   │       └── NuevaPQRS.css # Estilos del formulario
│   │   │   ├── Programas/
│   │   │   ├── Recursos/
│   │   │   │   ├── Recursos.jsx      # Gestión de recursos (catálogo)
│   │   │   │   └── Recursos.css      # Estilos del catálogo de recursos
│   │   │   ├── Reservas/
│   │   │   │   ├── Reservas.jsx      # Gestión de reservas
│   │   │   │   ├── Reservas.css      # Estilos de reservas
│   │   │   │   ├── Salones/
│   │   │   │   ├── Laboratorios/
│   │   │   │   ├── Auditorios/
│   │   │   │   └── Equipos/
│   │   │   ├── Roles/
│   │   │   ├── Solicitudes/
│   │   │   │   ├── Solicitudes.jsx   # Solicitudes de reservas (listado)
│   │   │   │   ├── SolicitudDetalle.jsx # Detalle de solicitud con evolución
│   │   │   │   ├── Solicitudes.css   # Estilos del listado
│   │   │   │   └── SolicitudDetalle.css # Estilos del detalle
│   │   │   └── Usuarios/
│   │   │       ├── CRUDusuarios/
│   │   │       ├── Roles/
│   │   │       └── Permisos/
│   │   │
│   │   ├── routes/                   # Configuración de rutas del frontend
│   │   │   └── AppRoutes.jsx         # Definición de rutas de la app
│   │   ├── services/                 # Llamadas a la API del backend
│   │   ├── styles/                   # Estilos globales (arquitectura ITCSS)
│   │   │   ├── main.css              # Hoja de estilos principal
│   │   │   ├── abstracts/            # Variables, mixins y funciones
│   │   │   │   ├── _animations.css
│   │   │   │   ├── _functions.css
│   │   │   │   ├── _mixins.css
│   │   │   │   └── _variables.css
│   │   │   ├── base/                 # Estilos base y reset
│   │   │   │   ├── _base.css
│   │   │   │   ├── _reset.css
│   │   │   │   └── _typography.css
│   │   │   ├── blocks/               # Bloques de interfaz
│   │   │   │   ├── _accordion.css
│   │   │   │   ├── _alert.css
│   │   │   │   ├── _badge.css
│   │   │   │   ├── _breadcrumb.css
│   │   │   │   ├── _button.css
│   │   │   │   ├── _card.css
│   │   │   │   ├── _dropdown.css
│   │   │   │   ├── _footer.css
│   │   │   │   ├── _form.css
│   │   │   │   ├── _header.css
│   │   │   │   ├── _modal.css
│   │   │   │   ├── _nav.css
│   │   │   │   ├── _pagination.css
│   │   │   │   ├── _table.css
│   │   │   │   └── _tabs.css
│   │   │   ├── components/           # Estilos de componentes
│   │   │   │   ├── _activity-item.css
│   │   │   │   ├── _dashboard-widget.css
│   │   │   │   ├── _event-card.css
│   │   │   │   ├── _notification.css
│   │   │   │   ├── _profile-card.css
│   │   │   │   ├── _request-detail.css
│   │   │   │   ├── _request-item.css
│   │   │   │   ├── _reservation-card.css
│   │   │   │   ├── _resource-item.css
│   │   │   │   ├── _search-bar.css
│   │   │   │   └── _service-card.css
│   │   │   ├── pages/                # Estilos de páginas
│   │   │   │   ├── _dashboard.css
│   │   │   │   ├── _events.css
│   │   │   │   ├── _landing.css
│   │   │   │   ├── _login.css
│   │   │   │   ├── _notifications.css
│   │   │   │   ├── _profile.css
│   │   │   │   ├── _register.css
│   │   │   │   ├── _requests.css
│   │   │   │   ├── _reservations.css
│   │   │   │   └── _services.css
│   │   │   └── utils/                # Utilidades CSS
│   │   │       ├── _helpers.css
│   │   │       ├── _layout.css
│   │   │       └── _spacing.css
│   │   ├── utils/                    # Utilidades y helpers
│   │   │   ├── menu.js               # Configuración del menú
│   │   │   ├── services.js           # Datos de los servicios (fuente única)
│   │   │   ├── solicitudes.js        # Datos mock de solicitudes + estados
│   │   │   ├── recursos.js           # Datos mock de recursos disponibles
│   │   │   ├── notificaciones.js     # Datos mock de notificaciones
│   │   │   ├── eventos.js            # Datos mock de eventos
│   │   │   └── pqrs.js               # Datos mock de PQRS + tipos
│   │   │
│   │   ├── App.jsx                   # Componente raíz
│   │   ├── index.css
│   │   └── main.jsx                  # Punto de entrada de React
│   │
│   ├── index.html                    # HTML principal
│   ├── package.json                  # Dependencias del frontend
│   ├── package-lock.json
│   ├── vite.config.js                # Configuración de Vite
│   ├── eslint.config.js              # Configuración de ESLint
│   └── README.md
│
└── .gitignore                        # Archivos ignorados por Git
```

## Descripción General

| Carpeta | Proyecto | Tecnología | Descripción |
|---------|----------|------------|-------------|
| `backend/` | API REST | Node.js + Express | Maneja autenticación, usuarios, reservas y eventos |
| `frontend/` | Cliente Web | React + Vite | Interfaz de usuario para estudiantes, docentes y administradores |

## Módulos del Sistema

- **Usuarios**: CRUD de usuarios, roles y permisos.
- **Reservas**: Salones, laboratorios, auditorios y equipos.
- **Eventos**: Calendario, inscripciones y publicaciones.
- **Notificaciones**: Correos, push y alertas.
- **Perfil**: Datos personales, seguridad y cambio de contraseña.
- **PQRS**: Peticiones, quejas, reclamos y sugerencias (mis PQRS y nueva PQRS).
- **Recursos**: Gestión de recursos.
- **Solicitudes**: Solicitudes de reservas.
- **Configuración**: Configuración del sistema.

## Estado Actual

- La estructura de carpetas del **backend** y el **frontend** ya está creada.
- El frontend fue generado con **Vite** (`npm create vite`).
- Páginas implementadas (`*.jsx`):
  - `pages/Landing/Landing.jsx`
  - `pages/Servicio/Servicio.jsx`
  - `pages/Configuracion/Configuracion.jsx`
  - `pages/Dashboard/Dashboard.jsx`
  - `pages/Eventos/Eventos.jsx`
  - `pages/Notificaciones/Notificaciones.jsx`
  - `pages/Perfil/Perfil.jsx`
  - `pages/PQRS/PQRS.jsx`
  - `pages/Recursos/Recursos.jsx`
  - `pages/Reservas/Reservas.jsx`
  - `pages/Solicitudes/Solicitudes.jsx`
  - `pages/Solicitudes/SolicitudDetalle.jsx`
- Componentes y utilidades implementadas:
  - `components/Button/Button.jsx` + `Button.css`
  - `components/Input/Input.jsx` + `Input.css`
  - `components/Modal/Modal.jsx` + `Modal.css`
  - `components/ServiceCard/ServiceCard.jsx` + `ServiceCard.css`
  - `components/Navbar/Navbar.jsx` + `Navbar.css`
  - `components/Sidebar/Sidebar.jsx` + `Sidebar.css`
  - `components/StatusBadge/StatusBadge.jsx` + `StatusBadge.css`
  - `hooks/useSearch.js`
  - `layouts/DashboardLayout.jsx` + `DashboardLayout.css`
  - `routes/AppRoutes.jsx` (13 rutas)
  - `utils/menu.js`
  - `utils/services.js`
  - `utils/solicitudes.js`
  - `utils/recursos.js`
  - `utils/notificaciones.js`
  - `utils/eventos.js`
- Sistema de estilos **ITCSS** implementado en `styles/` (abstracts, base, blocks, components, pages, utils) con `main.css`.
- **Rediseño visual** aplicado: paleta institucional navy + dorado y tipografías Playfair Display + Inter definidas como variables CSS en `index.css`; todos los componentes y páginas migrados a `var(--...)`.
- **Modo oscuro** implementado (diseño universal): temas claro/oscuro vía tokens en `[data-theme]` + `prefers-color-scheme`, script inline en `index.html` para evitar parpadeo y toggle ☀️/🌙 en el Navbar con persistencia en `localStorage`.
- **Módulo 8.1 Autenticación y usuarios** implementado: `pages/Login` (`/login`), `pages/Recuperar` (`/recuperar`), `pages/Usuarios` (`/usuarios`, CRUD con roles), `context/AuthContext.jsx` + `context/useAuth.js` (sesión persistida), `components/ProtectedRoute` (protección por sesión y permiso), menú filtrado por rol y Navbar dinámico.
- **Roles según sección 7** (Usuarios del sistema): Estudiante, Docente, Administrativo y Administrador con permisos por módulo y acciones granulares (`puede(accion)`); botones condicionados por rol en Solicitudes (registrar/avanzar estado), Recursos (nuevo), Eventos (publicar) y Reservas (cancelar).
- **Las 10 vistas de la Actividad Integrativa están funcionales.** Quedan pendientes: backend, despliegue en Vercel y videomemoria.