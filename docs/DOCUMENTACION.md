# Documentación - UAJS Smart Campus

## 1. Descripción del Proyecto

Plataforma web distribuida para la gestión y articulación de servicios universitarios de la Universidad Antonio José de Sucre. Integra servicios académicos y administrativos en una interfaz unificada usando arquitectura MVC y posterior evolución a microservicios con API REST.

**Tecnologías**
- Frontend: HTML5, CSS3, JavaScript ES6+, React, React Router, Axios/Fetch
- Backend: Node.js, Express.js
- Base de datos: MySQL
- Comunicación: REST, HTTP/HTTPS, JSON
- Seguridad: JWT, roles, permisos, middleware de autenticación

---

## 2. Lo que se ha hecho (Estado actual)

### 2.1 Backend (`backend/`)

- Estructura de carpetas creada bajo patrón MVC:
  - `src/config/` (db.js, jwt.js, env.js)
  - `src/controllers/` (auth, usuario, reserva, evento)
  - `src/routes/` (auth, usuario, reserva, evento)
  - `src/services/`, `src/middlewares/` (auth, roles, errorHandler), `src/models/`, `src/repositories/`, `src/utils/`
  - `src/app.js`, `src/server.js`
- `package.json` y `server.js` existentes.
- **Nota:** las carpetas están creadas pero **sin implementación** (archivos de controladores/rutas vacíos).

### 2.2 Frontend (`frontend/`)

**Estructura general creada:**
- `src/assets/` (icons, images, logo, hero.png)
- `src/components/` (Button, Card, Input, Loader, Modal, Navbar, Sidebar, Table)
- `src/layouts/`, `src/context/`, `src/hooks/`, `src/routes/`, `src/services/`, `src/styles/`, `src/utils/`
- `src/pages/` con las páginas de cada módulo

**Implementado (funcional):**
- **Layout del dashboard** (`layouts/DashboardLayout.jsx` + CSS) con Sidebar y Navbar.
- **Sidebar** (`components/Sidebar/Sidebar.jsx`): renderiza el menú desde `utils/menu.js` (9 items) usando React Router (`NavLink`).
- **Navbar** (`components/Navbar/Navbar.jsx` + CSS): con botón de menú, campana de notificaciones y perfil de usuario.
- **Rutas** (`routes/AppRoutes.jsx`): 16 rutas con React Router (Landing, Login, Recuperar + Dashboard, Solicitudes, Reservas, Recursos, Eventos, Notificaciones, PQRS, Perfil, Configuración, Usuarios), protegidas por sesión y permiso.
- **Menú centralizado** (`utils/menu.js`): 9 items, fuente única de verdad del menú.
- **Sistema de estilos ITCSS** (`src/styles/`): `main.css` + abstracts, base, blocks, components, pages, utils (~40 archivos).
- **Barra lateral expandible** (ver sección 2.3): colapsa de 250px a 70px con el botón ☰ del Navbar.
- **Botón reutilizable** (`components/Button/Button.jsx` + CSS): variantes (primary, secondary, outline, ghost, danger), tamaños (sm, md, lg), BEM. Aporta al criterio 1 (componentes funcionales).
- **Landing de acceso** (ver sección 2.4): vista 1 de la Actividad Integrativa, con countdown de redirección a los 5 segundos.

### 2.4 Landing de acceso (vista 1)

Página de bienvenida en la ruta `/` (fuera del DashboardLayout), implementada en `pages/Landing/Landing.jsx` + `Landing.css`.

**Contenido:**
- Nombre de la plataforma y logo en el header.
- Hero con descripción general de los servicios del campus.
- Grid con los 6 servicios disponibles (Solicitudes, Reservas, Recursos, Eventos, Notificaciones, PQRS).
- Grid con los 3 perfiles de usuario (Estudiantes, Docentes, Administradores).
- Botón "Entrar ahora" para acceder al panel de inmediato.

**Redirección automática (5 segundos):**
1. `useState` guarda `seconds = 5`.
2. `useEffect` con `setInterval` decrementa el contador cada segundo (y limpia el timer al desmontar).
3. Segundo `useEffect` navega a `/dashboard` con `useNavigate` cuando `seconds <= 0`.
4. El botón "Entrar ahora" cancela el flujo navegando directamente.

Esto usa **useState + useEffect**, por lo que completa el **Criterio 2** de la rúbrica (antes solo se usaba `useState`).

### 2.5 Dashboard con servicios, búsqueda e indicadores (vistas 2 y 10)

Vista principal en la ruta `/dashboard`, implementada en `pages/Dashboard/Dashboard.jsx` + `Dashboard.css`. Cubre las **vistas 2 y 10** de la Actividad Integrativa.

**Contenido:**
- Header de bienvenida.
- **Dashboard de indicadores (vista 10):** 4 widgets con solicitudes pendientes, reservas realizadas, notificaciones no leídas y eventos próximos.
- **Barra de búsqueda (vista 2):** filtra los servicios por nombre, categoría o descripción.
- **Grid de servicios disponibles (vista 2):** Solicitudes, Reservas, Recursos, Eventos, Notificaciones y PQRS, cada uno con enlace a su módulo. Muestra un mensaje cuando no hay resultados.

**Archivos nuevos involucrados:**

| Archivo | Rol |
|---------|-----|
| `hooks/useSearch.js` | **Custom hook** que filtra un array por consulta usando `useMemo`. Cumple el **Criterio 3** de la rúbrica |
| `components/Input/Input.jsx` + CSS | Input reutilizable con etiqueta opcional (BEM) |
| `components/ServiceCard/ServiceCard.jsx` + CSS | Tarjeta de servicio con icono, categoría, descripción y enlace |
| `utils/services.js` | Fuente única de datos de los 6 servicios (name, icon, category, path, description) |
| `pages/Dashboard/Dashboard.jsx` + CSS | Página principal con indicadores, búsqueda y servicios |

**Flujo del estado:**
1. `useState` guarda la consulta de búsqueda (`query`).
2. `useSearch(services, query, ["name", "category", "description"])` devuelve los servicios filtrados.
3. Al escribir en el input, el grid se actualiza en tiempo real.

El Landing (`2.4`) ahora importa los servicios desde `utils/services.js` (misma fuente de verdad).

### 2.6 Vista de servicio (vista 3)

Detalle de un servicio en la ruta `/servicio/:nombre`, implementado en `pages/Servicio/Servicio.jsx` + `Servicio.css`. Cubre la **vista 3** de la Actividad Integrativa.

**Contenido:**
- Cabecera con icono, categoría, nombre y descripción del servicio.
- Tarjeta de **recursos disponibles** (lista de recursos propios de cada servicio).
- Tarjeta de **opciones del servicio** (acciones como "Seleccionar recurso", "Consultar disponibilidad", "Registrar reserva") con botón "Ir al módulo de {servicio}".
- Estado "Servicio no encontrado" con enlace de regreso si el `:nombre` no coincide.

**Flujo:**
1. `useParams` lee el parámetro `nombre` de la URL.
2. Se busca el servicio en `utils/services.js` (que ahora incluye `resources` y `options` por servicio).
3. Las `ServiceCard` del Dashboard enlazan a `/servicio/{nombre}` en lugar de ir directo al módulo.

Esto añade una página funcional más (aporta al **Criterio 1**) y reutiliza el componente `Button`.

### 2.7 Solicitudes y detalle de solicitud (vistas 4 y 5)

Listado y detalle de solicitudes implementados en `pages/Solicitudes/`. Cubren las **vistas 4 y 5** de la Actividad Integrativa.

**Vista 4 — Listado (`Solicitudes.jsx`):**
- Tarjetas con número de solicitud, tipo de servicio, fecha, estado y descripción.
- **Barra de búsqueda** (por número, tipo, servicio, descripción o solicitante) usando el custom hook `useSearch`.
- **Filtro por estado** (Registrada, En revisión, Asignada, En proceso, Resuelta, Cerrada).
- Enlace "Ver detalle y seguimiento" a `/solicitudes/{id}`.

**Vista 5 — Detalle (`SolicitudDetalle.jsx`):**
- Información completa: número, tipo, estado, descripción, solicitante, servicio y fecha.
- **Timeline de evolución del estado**: Registrada → En revisión → Asignada → En proceso → Resuelta → Cerrada. Los estados alcanzados se marcan en verde (✓), el estado actual en azul y los pendientes en gris, con fecha y detalle de cada paso.

**Archivos nuevos involucrados:**

| Archivo | Rol |
|---------|-----|
| `utils/solicitudes.js` | Datos mock de 6 solicitudes + `ESTADOS_SOLICITUD` (orden de la evolución) |
| `components/StatusBadge/StatusBadge.jsx` + CSS | Badge de estado con color según el estado (normaliza tildes para la clase BEM) |
| `pages/Solicitudes/Solicitudes.jsx` + CSS | Listado con búsqueda y filtro por estado |
| `pages/Solicitudes/SolicitudDetalle.jsx` + CSS | Detalle con timeline de la evolución |

El listado usa `useState` + `useSearch` (refuerza **Criterios 2 y 3**).

### 2.8 Reservas, Notificaciones, Eventos y Perfil (vistas 6-9)

Las cuatro vistas restantes de la Actividad Integrativa quedaron funcionales.

**Vista 6 — Reservas (`pages/Reservas/Reservas.jsx`):**
- Recursos disponibles (salas, laboratorios, auditorios y equipos) con capacidad y disponibilidad.
- Filtros por tipo de recurso.
- Botón "Reservar" abre un **Modal** con formulario (fecha, hora inicio, hora fin, propósito).
- Al registrar, la reserva aparece en "Mis reservas" con confirmación.
- Usa `useState` (filtro, modal, formulario y lista de reservas).

**Vista 7 — Notificaciones (`pages/Notificaciones/Notificaciones.jsx`):**
- Listado de comunicaciones (cambios de estado, confirmaciones de reserva y nuevos eventos).
- Contador de no leídas, marcar individual o "marcar todas como leídas" (manejo de estado con `useState`).

**Vista 8 — Eventos (`pages/Eventos/Eventos.jsx`):**
- Tarjetas con nombre, fecha, hora, lugar y descripción.
- Barra de búsqueda por nombre, lugar, categoría o descripción con `useSearch`.

**Vista 9 — Perfil (`pages/Perfil/Perfil.jsx`):**
- Tarjeta de identidad con avatar, nombre, tipo de usuario, programa, dependencia, correo, documento, teléfono y sede.

**Archivos nuevos involucrados:**

| Archivo | Rol |
|---------|-----|
| `utils/recursos.js` | Datos mock de 8 recursos + `TIPOS_RECURSO` |
| `utils/notificaciones.js` | Datos mock de 6 notificaciones con estado leída/no leída |
| `utils/eventos.js` | Datos mock de 5 eventos |
| `components/Modal/Modal.jsx` + CSS | Modal reutilizable (overlay, título, botón de cierre) |
| `pages/Reservas/*` `pages/Notificaciones/*` `pages/Eventos/*` `pages/Perfil/*` | Páginas con CSS propio (BEM) |

### 2.9 Servicio de Recursos

Catálogo de recursos en la ruta `/recursos`, implementado en `pages/Recursos/Recursos.jsx` + `Recursos.css`. Corresponde al módulo "SERVICIO DE RECURSOS" del proyecto (código, nombre, tipo, ubicación, estado y disponibilidad).

**Contenido:**
- Estadísticas: total de recursos, disponibles y no disponibles.
- Barra de búsqueda (código, nombre, tipo, ubicación o estado) con `useSearch`.
- Filtro por tipo (Salas, Laboratorios, Auditorios, Equipos).
- Tabla de recursos con código, nombre, tipo, ubicación, estado (badge de color) y disponibilidad.
- `utils/recursos.js` ahora incluye `codigo`, `ubicacion` y `estado` por recurso (los datos compartidos con la vista de Reservas se ampliaron sin romper su uso).

### 2.10 PQRS y Configuración

Últimos módulos del frontend que estaban como placeholders. Con esto **ya no quedan páginas placeholder** en la aplicación.

**PQRS (`pages/PQRS/`):**
- `PQRS.jsx`: listado "Mis PQRS" con estadísticas por tipo (Petición, Queja, Reclamo, Sugerencia), filtro por tipo y botón "Nueva PQRS".
- `NuevaPQRS/NuevaPQRS.jsx` (ruta `/pqrs/nueva`): formulario con tipo y descripción; al enviar genera un número (`PQRS-2026-XXX`), guarda en `localStorage` y muestra confirmación.
- El listado carga desde `localStorage` (merge con datos mock) usando **inicialización perezosa de `useState`**, de modo que las PQRS nuevas creadas aparecen en "Mis PQRS".
- `utils/pqrs.js`: datos mock + `TIPOS_PQRS`.

**Configuración (`pages/Configuracion/Configuracion.jsx`):**
- Panel de ajustes con tres tarjetas: información general (institución, sede, horario), servicios disponibles (interruptores por servicio) y preferencias de notificaciones (correo, push, alertas).
- Los cambios se persisten en `localStorage` mediante `useEffect` (sincroniza estado → almacenamiento externo).
- Interruptores (switches) con `useState`.

**Nota de refactor:** la regla de lint `react-hooks/set-state-in-effect` obligó a inicializar estado desde `localStorage` con el inicializador perezoso de `useState` en lugar de un `useEffect` que llamara `setState` síncrono. En `Configuracion` el `useEffect` se conserva solo para guardar (dirección correcta: estado → sistema externo).

### 2.3 Barra lateral expandible y Navbar mejorados

La barra lateral se puede contraer/expandir haciendo clic en el botón ☰ del Navbar. En una mejora reciente, ambos componentes fueron rediseñados:

**Sidebar (dark):**
- Fondo oscuro (`#0f172a` → `var(--color-primary)`), marca con logo degradado dorado y título.
- Menú organizado por **secciones** (Principal, Gestión, Comunicación, Cuenta) desde `utils/menu.js`, ahora con **iconos** por item.
- Item activo con degradado dorado y borde izquierdo dorado (`NavLink` con callback `isActive`).
- Footer con versión; en modo colapsado (70px) solo se muestran los iconos centrados.

**Navbar:**
- Botón ☰, **título del módulo actual** (obtenido de la ruta con `useLocation` + `getModuleName()` de `utils/menu.js`, que resuelve también rutas dinámicas como Detalle de solicitud, Nueva PQRS y Servicio), **campana con badge de no leídas** (cuenta tomada de `utils/notificaciones.js`) enlazada a `/notificaciones` y **toggle de tema ☀️/🌙**.
- **Dropdown de perfil** con datos del usuario y accesos a Perfil, Configuración y "Cerrar sesión" (vuelve a la landing). Se cierra al hacer clic fuera mediante `useRef` + `useEffect` (refuerza **Criterio 2**).
- Barra `position: sticky`.

**Archivos involucrados:**

| Archivo | Rol |
|---------|-----|
| `layouts/DashboardLayout.jsx` | Gestiona el estado `collapsed` con `useState(false)`; pasa `collapsed` al Sidebar y `onToggle` al Navbar |
| `components/Navbar/Navbar.jsx` | Botón ☰, badge de notificaciones, dropdown de perfil y toggle de tema (useState + useEffect + useRef) |
| `components/Sidebar/Sidebar.jsx` | Recibe `collapsed`, aplica `sidebar--collapsed` y renderiza secciones/iconos |
| `components/Sidebar/Sidebar.css` / `Navbar.css` | Estilos BEM rediseñados |
| `utils/menu.js` | Ahora exporta `menuSections` con `label`, `icon` y `path` por item |
| `layouts/DashboardLayout.css` | `app__main`: margen izquierdo 250px → 70px con `transition` |

**Flujo del estado:**
1. `DashboardLayout` declara `const [collapsed, setCollapsed] = useState(false)`.
2. El Navbar recibe `onToggle={() => setCollapsed(!collapsed)}`.
3. Al hacer clic en ☰, `setCollapsed` invierte el valor.
4. El Sidebar recibe `collapsed` y cambia su clase CSS → se encoge a 70px.
5. El contenedor `.app` cambia a `.app--collapsed` → el contenido principal corre el margen a 70px.
6. El dropdown del perfil usa `useEffect` para escuchar clics fuera del contenedor (`dropdownRef`).

Este estado usa **useState y useEffect**, lo cual aporta al **Criterio 2** de la rúbrica.

### 2.3.1 Rediseño visual y modo oscuro (diseño universal)

El frontend fue rediseñado con una identidad institucional navy + dorado y **diseño universal** preparado para modo oscuro:

**Paleta y tipografía (design tokens en `index.css`):**
- Variables CSS en `:root` (tokens): `--color-primary` (navy `#14304d`), `--color-accent` (dorado `#c7a11f`), superficies (`--color-surface`, `--color-bg`), texto, estados (success/danger/warning) y sombras.
- Tipografías de Google Fonts en `index.html`: **Playfair Display** para títulos (`--font-heading`) e **Inter** para texto (`--font-body`).
- Todos los componentes y páginas usan únicamente variables → cambiar un tema solo intercambia tokens, sin tocar estilos.

**Modo oscuro:**
- Tema claro y oscuro definidos sobre el mismo set de variables: `[data-theme="dark"]` sobreescribe los tokens (superficies `#1e293b`, texto `#e2e8f0`, navy claro en acentos) y también se respeta `@media (prefers-color-scheme: dark)` cuando no hay preferencia manual.
- `index.html` incluye un script inline que aplica `data-theme` antes del primer render (evita parpadeo) leyendo `localStorage("uajs_theme")` o la preferencia del sistema.
- El **toggle ☀️/🌙** del Navbar cambia `data-theme` en `<html>` y persiste en `localStorage` (inicializador perezoso + `useEffect` solo para guardar, respetando `react-hooks/set-state-in-effect`).

**Archivos involucrados:** `index.css`, `index.html`, `components/Button/Button.css`, `components/Navbar/Navbar.css` y todos los `*.css` de componentes/páginas (migrados a `var(--...)`).

**Páginas pendientes por implementar (aún placeholders):**
- Ninguna. Todas las páginas del frontend tienen contenido funcional.

**Correcciones aplicadas recientemente:**
- `utils/menu.js` tenía 4 items vs. 9 links hardcodeados en Sidebar → se centralizó en `menu.js` y el Sidebar ahora mapea la lista (ahora con secciones e iconos).
- `Recursos.jsx` y `Notificaciones.jsx` mostraban título incorrecto "PQRS" → corregido.
- Ruta `/` ahora renderiza el Landing; `/dashboard` renderiza el Dashboard (antes ambos apuntaban al Dashboard).
- Servicios centralizados en `utils/services.js` (Landing y Dashboard usan la misma fuente).
- En modo oscuro `--color-primary` se mantiene navy para no romper el contraste de texto blanco en botones; los acentos usan tonos más claros (`--color-primary-600: #7db1e8`).

**Pendiente en el frontend:**
- `components/` (Card, Loader, Table) están **vacíos** (Button, Input, ServiceCard, StatusBadge y Modal ya implementados).
- `services/` está **vacío** (no hay llamadas a API reales).
- Subcarpetas de módulos vacías (Calendario, Inscripciones, Publicaciones, Correos, Push, Alertas, Datos personales, Seguridad, Cambiodecontraseña, Salones, Laboratorios, Auditorios, Equipos, Facultades, Programas).

### 2.4 Módulo 8.1 — Autenticación y usuarios

Implementación del módulo **8.1 Autenticación y usuarios** de la plataforma (inicio de sesión, cierre de sesión, recuperación de acceso, roles, permisos y gestión de usuarios).

**Credenciales de prueba:**

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Administrador | `admin` | `admin123` |
| Administrativo | `funcionario` | `func123` |
| Docente | `profesor` | `prof123` |
| Estudiante | `estudiante` | `est123` |

**Archivos nuevos:**

| Archivo | Rol |
|---------|-----|
| `utils/users.js` | Usuarios base + `ROLES` con lista de permisos por rol; helpers `obtenerUsuarios`/`guardarUsuarios` (persistencia en `localStorage`, clave `uajs_users`) y `permisosDeRol` |
| `context/auth-context.js` | `createContext` compartido (para cumplir la regla de lint `react-refresh/only-export-components`) |
| `context/AuthContext.jsx` | **AuthProvider**: estado `user` (inicializador perezoso desde `localStorage`), `login` (valida usuario/contraseña/estado y guarda sesión en `uajs_session`), `logout` (limpia sesión) y `tienePermiso(permiso)` |
| `context/useAuth.js` | Hook `useAuth` (consumidor del contexto) |
| `components/ProtectedRoute/ProtectedRoute.jsx` | Guard de rutas: sin sesión → `/login` (recuerda la ruta de origen con `location.state`); sin permiso → `/dashboard` |
| `pages/Login/Login.jsx` + `Login.css` | Inicio de sesión sobre el fondo institucional (`.auth`), muestra errores y redirige al destino original |
| `pages/Recuperar/Recuperar.jsx` | Recuperación de acceso: valida correo contra usuarios y muestra mensaje de instrucciones (mock); reutiliza `Login.css` |
| `pages/Usuarios/Usuarios.jsx` + `Usuarios.css` | Gestión de usuarios: estadísticas, tabla, crear/editar (Modal), activar/desactivar; persistido en `localStorage` |

**Integración:**

- `routes/AppRoutes.jsx`: rutas públicas `/`, `/login`, `/recuperar`; el resto de rutas envueltas en `<ProtectedRoute permiso="…">` (cada módulo exige su permiso).
- `utils/menu.js`: cada item del menú tiene `permiso`; `Sidebar` filtra por `tienePermiso` (p. ej. "Usuarios" solo visible para Administrador).
- `Navbar`: nombre, rol, correo y avatar inicial **dinámicos** desde `useAuth`; "Cerrar sesión" ejecuta `logout()` y navega a `/login`.
- `Perfil`: muestra los datos reales de la sesión.
- `Landing`: el botón "Entrar ahora" y el countdown dirigen a `/login` si no hay sesión y a `/dashboard` si la hay.

**Nota:** cumple la regla `react-hooks/set-state-in-effect` (el estado se inicializa con inicializador perezoso y `localStorage` solo se escribe dentro de `login`/`logout`, no en efectos).

**Mejora del login (ver contraseña):**
- El componente `Input` muestra un **toggle de visibilidad** automáticamente cuando `type="password"` (iconos SVG ojo / ojo-tachado con `aria-label`), por lo que aplica tanto al Login como al formulario de Usuarios.
- El botón "Ingresar" es de ancho completo (`.auth__submit`), el campo de contraseña reserva espacio a la derecha (`.input__field--password`) y los campos usan `autoComplete="username"` / `current-password`.

### 2.5 Roles y permisos (sección 7 — Usuarios del sistema)

El modelo de roles se alineó con la especificación del documento (7. Usuarios del sistema). Cada rol tiene permisos por **módulo** (controlan rutas y menú) y **acciones granulares** (controlan botones dentro de las páginas).

| Rol | Módulos | Acciones destacadas |
|-----|---------|---------------------|
| **Estudiante** | Dashboard, Solicitudes, Reservas, Recursos, Notificaciones, Eventos, PQRS, Perfil | Registrar solicitudes, consultar su estado, solicitar recursos, realizar reservas |
| **Docente** | + Recursos, + Reservas | Consultar solicitudes, solicitar recursos, gestionar reservas, publicar eventos |
| **Administrativo** | todos excepto Usuarios y Configuración | Gestionar solicitudes, actualizar estados, administrar recursos, gestionar reservas, atender requerimientos |
| **Administrador** | todos los módulos | Administrar usuarios y roles, gestionar servicios y configuraciones, consultar estadísticas, supervisar |

**Mecánica:**

- `utils/users.js`: `ROLES` con `permisos` (módulos) y `acciones` (granulares); helpers `permisosDeRol` y `accionesDeRol`.
- `useAuth().tienePermiso(permiso)` → rutas/menú; `useAuth().puede(accion)` → acciones dentro de páginas.
- **Configuración** quedó restringida a Administrador (gestionar_configuracion); **Usuarios** también (administrar_usuarios/roles).

**Botones condicionados por acción (demostración del modelo):**

| Acción | Rol(es) | Dónde |
|--------|---------|-------|
| `registrar_solicitudes` | Estudiante, Administrador | Solicitudes: botón "+ Registrar solicitud" (Modal) |
| `actualizar_estados` | Administrativo, Administrador | Solicitudes: botón "Avanzar estado" por tarjeta |
| `administrar_recursos` | Administrativo, Administrador | Recursos: botón "+ Nuevo recurso" (Modal) |
| `publicar_eventos` | Docente, Administrativo, Administrador | Eventos: botón "+ Publicar evento" (Modal) |
| `gestionar_reservas` | Docente, Administrativo, Administrador | Reservas: botón "Cancelar" en Mis reservas |

**Credenciales (sección 7):** `admin/admin123` (Administrador), `funcionario/func123` (Administrativo), `profesor/prof123` (Docente), `estudiante/est123` (Estudiante).

---

## 3. Lo que se tiene que hacer (Pendiente)

### 3.1 Vistas obligatorias de la Actividad Integrativa (Criterio 6 = 45%)

| # | Vista | Requisito |
|---|-------|-----------|
| 1 | **Landing de acceso** | Nombre de la plataforma, descripción de servicios y perfiles de usuario. Redirección automática a la página principal a los **5 segundos** si no hay acción |
| 2 | **Página principal (Dashboard)** | Servicios disponibles (Solicitudes, Reservas, Recursos, Eventos, Notificaciones, PQRS) + **barra de búsqueda** por nombre/categoría |
| 3 | **Vista de servicio** | Detalle de un servicio: descripción, recursos disponibles, opciones (ej. Reservas) |
| 4 | **Vista de solicitudes** | Listado con número de solicitud, tipo de servicio, fecha, estado y descripción. Consultar detalle y seguimiento |
| 5 | **Vista de detalle de solicitud** | Información completa + evolución del estado: Registrada → En revisión → Asignada → En proceso → Resuelta → Cerrada |
| 6 | **Vista de reservas** | Recursos disponibles (salas, laboratorios, equipos, espacios), seleccionar recurso, consultar disponibilidad y registrar reserva |
| 7 | **Vista de notificaciones** | Comunicaciones de la plataforma (cambios de estado, confirmaciones de reserva, nuevos eventos) |
| 8 | **Vista de eventos** | Nombre, fecha, hora, lugar y descripción de las actividades |
| 9 | **Vista de perfil** | Nombre, tipo de usuario, programa o dependencia y otros datos del prototipo |
| 10 | **Dashboard de indicadores** | Solicitudes pendientes, reservas realizadas, notificaciones no leídas, eventos próximos y servicios disponibles |

### 3.2 Criterios de la rúbrica

| Criterio | Requisito | Peso |
|----------|-----------|------|
| 1 | **≥ 10 componentes funcionales** con JSX | 5% |
| 2 | Uso de **useState y useEffect** | 5% |
| 3 | **Custom hook** utilizado en un componente | 10% |
| 4 | **React Router** (mínimo 4 rutas) — ya hay 9 ✓ | 10% |
| 5 | **CSS con metodología BEM** | 10% |
| 6 | **Vistas funcionales** (sección 3.1) | 45% |
| 7 | **Videomemoria** (10 min, MP4) explicando componentes, hooks, vistas y despliegue | 10% |
| 8 | **Despliegue en Vercel** | 5% |

**Estado de la rúbrica:**
- ✅ Criterio 4 (React Router): cumplido (16 rutas).
- ✅ Criterio 5 parcial: CSS aplicado, falta verificar BEM completo en todos los componentes.
- ✅ Criterio 1: 23 componentes funcionales (App, AppRoutes, DashboardLayout, Sidebar, Navbar, Button, Input, Modal, ServiceCard, StatusBadge + las 14 páginas/vistas) — objetivo de 10 superado.
- ✅ Criterio 2: **useState** en DashboardLayout, Landing, Dashboard, Solicitudes, Reservas, Notificaciones, Eventos, PQRS, Recursos; **useEffect** en Landing (countdown), Navbar (clic fuera, tema) y Configuracion (guardar).
- ✅ Criterio 3: **custom hook** `useSearch.js` utilizado en **Dashboard, Solicitudes, Eventos, Recursos, Reservas, Notificaciones y PQRS** (búsqueda en tiempo real con `useState`).
- ✅ Criterio 6: **las 10 vistas de la Actividad Integrativa están completadas** (Landing, Dashboard con búsqueda, Vista de servicio, Solicitudes, Detalle de solicitud, Reservas, Notificaciones, Eventos, Perfil e Indicadores).
- ❌ Criterios 7 y 8: pendientes.

### 3.3 Backend pendiente

- Implementar los archivos de config, controllers, routes, services, middlewares, models y repositories.
- Crear conexión a **MySQL**.
- Implementar **API REST** con JWT, roles y permisos.
- Arquitectura orientada a **microservicios** (mínimo 6):
  1. Microservicio de Usuarios (usuarios, roles, autenticación)
  2. Microservicio de Solicitudes
  3. Microservicio de Reservas
  4. Microservicio de Recursos
  5. Microservicio de Eventos
  6. Microservicio de Notificaciones
- Base de datos con: Usuarios, Roles, Servicios, Solicitudes, Reservas, Recursos, Eventos, Notificaciones.
- Comunicación: Frontend React → API Gateway → Microservicios → Base de datos.

### 3.4 Entrega final (archivo ZIP)

1. Videomemoria en **MP4** (máximo 10 minutos).
2. Archivo **TXT** con la URL del proyecto desplegado en Vercel.
3. Código de la aplicación **sin node_modules**.

---

## 4. Resumen ejecutivo

| Área | Estado |
|------|--------|
| Estructura frontend/backend | ✅ Completa |
| Layout + navegación | ✅ Funcional |
| Estilos ITCSS + BEM | ✅ Base creada |
| Rutas React Router | ✅ 16 rutas |
| Landing de acceso | ✅ Implementada (vista 1) |
| Dashboard + búsqueda | ✅ Implementado (vista 2) |
| Vista de servicio | ✅ Implementada (vista 3) |
| Solicitudes + detalle con estados | ✅ Implementadas (vistas 4 y 5) |
| Reservas | ✅ Implementada (vista 6) |
| Notificaciones | ✅ Implementada (vista 7) |
| Eventos | ✅ Implementada (vista 8) |
| Perfil | ✅ Implementada (vista 9) |
| Dashboard de indicadores | ✅ Implementado (vista 10) |
| Páginas con contenido real | ✅ Todas las páginas funcionales (sin placeholders) |
| Backend funcional | ❌ Solo estructura |
| Base de datos | ❌ No creada |
| Autenticación/roles | ❌ No implementada |
| Hooks (useState/useEffect) | ✅ Usados en varias páginas |
| Custom hooks | ✅ `useSearch` usado en Dashboard, Solicitudes y Eventos |
| Despliegue Vercel + videomemoria | ❌ Pendiente |

**Prioridad de trabajo recomendada:**
1. ✅ Landing de acceso (vista 1) — implementada
2. ✅ Dashboard con servicios + barra de búsqueda (vista 2) — implementado
3. ✅ Vista de servicio (vista 3) — implementada
4. ✅ Solicitudes + detalle con estados (vistas 4 y 5) — implementadas
5. ✅ Reservas, Eventos, Notificaciones, Perfil (vistas 6-9) — implementadas
6. ✅ Dashboard de indicadores (vista 10) — implementado
7. Backend con MySQL, API REST y autenticación
8. Despliegue en Vercel y videomemoria