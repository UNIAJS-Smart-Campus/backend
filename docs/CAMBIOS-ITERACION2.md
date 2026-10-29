# Registro de cambios — Iteración 2 · Frontend UniAJS

> Fecha: 27 de agosto de 2026
> Versión mostrada en el panel: **UniAJS v0.4.0**
> Estado: build compilando sin errores. **Sin push ni commit** (pendiente de aprobación).

---

## 1. Resumen

Rediseño completo del panel de UAJS Smart Campus con una **paleta navy/dorado** institucional y un **patrón visual consistente** (header de página, tarjetas, botón dorado→naranja, modales, toasts, badges de estado). Todos los módulos pasaron de tablas genéricas / tarjetas sueltas a un diseño unificado.

También se **normalizaron los Dockerfiles de los servicios de backend** para que sigan el mismo patrón que `auth-service`.

Módulos terminados en esta iteración:

- Reservas, Recursos, Usuarios, Reportes, Eventos, Info Académica, Gestión Servicios, Notificaciones, PQRS, Configuración.
- Página **Servicios** (nueva) con barra de búsqueda.
- Conexión de la **landing** a la vista de servicio.
- Refinamiento de **roles y permisos**.
- **Gestión de Recursos** (crear / editar / eliminar) con persistencia.
- Corrección del **crash de Configuración** por datos antiguos en `localStorage`.

---

## 2. Paleta y componentes reutilizados

- Paleta Navy/Dorado: `#003366` / `#004080` (navy), `#f7d000` (dorado), `#f39200` (naranja).
- Variables BEM (`bloque__elemento--modificador`) sobre tokens existentes en `src/styles/abstracts/_variables.css`.
- Botones pill con degradado dorado→naranja y texto `#1e3a5f`.
- Iconos SVG propios (componente `Icon`) — **sin** Font Awesome.

---

## 3. Módulos rediseñados (detalle)

| Módulo | Archivos | Características |
|---|---|---|
| **Reservas** | `pages/Reservas/` | Lógica de reserva alineada con Recursos: `esReservable()` = `estado === "Activo"` **y** `disponibilidad === "Disponible"`. |
| **Recursos** | `pages/Recursos/` | Helpers `esReservable()` / `estadoVisual()`; badge ESTADO_VARIANT (Inactivo → "NO DISPONIBLE"). **+ Gestión CRUD** (ver sección 8). |
| **Usuarios** | `pages/Usuarios/` | Header + tarjetas resumen, filtros (búsqueda/rol/estado), tarjetas con avatar de iniciales y badges, modal crear/editar (Nombre/Apellido por separado, correo, código, teléfono, rol, estado, contraseña con Mostrar/Ocultar). |
| **Reportes** | `pages/Reportes/` + `utils/reportes.js` | Módulo de **analítica**: KPIs con tendencia, franja de totales por entidad, gráficos de barras por categoría, ranking de recursos más utilizados, reservas por estado y PQRS por tipo. |
| **Eventos** | `pages/Eventos/` + `utils/eventos.js` | Tarjetas de eventos; campos nuevos `estado`, `cupo`, `inscritos`. Gestión admin (crear/editar/eliminar/ver inscritos) por `rol === "Administrador"`; estudiantes/docentes ven, filtran e inscriben. |
| **Info Académica** | `pages/InfoAcademica/` | Header, tarjetas resumen por categoría, filtros, modal. Permiso `publicar_info_academica`; typo corregido. |
| **Gestión Servicios** | `pages/GestionServicios/` | Tarjetas resumen, filtros, grid de servicios con editar/eliminar, modal con validación de nombre duplicado. |
| **Notificaciones** | `pages/Notificaciones/` | Tarjetas resumen por tipo, filtros, bandeja con icono/tag/tiempo relativo, punto no leída, "marcar leída". |
| **PQRS / NuevaPQRS** | `pages/PQRS/` | Tarjetas resumen por tipo, filtros, badges de estado por color, modal de nueva PQRS + confirmación. |
| **Configuración** | `pages/Configuracion/` | Reestructuración completa (ver sección 4). |
| **Dashboard / Perfil** | `pages/Dashboard/`, `pages/Perfil/` | Ya rediseñados previamente y consolidados en esta iteración. |

---

## 4. Configuración (reestructurada)

Nueva estructura con **7 secciones** en menú lateral:

1. **Cuenta** — correo, teléfono, idioma, zona horaria, formato de fecha, "cerrar sesión en todos los dispositivos". *(Los datos personales quedan solo en Perfil.)*
2. **Seguridad** — cambiar contraseña (Mostrar/Ocultar), sesiones/dispositivos con historial, 2FA y claves de respaldo como "Próximamente".
3. **Notificaciones** — canales (plataforma / correo / SMS) + preferencias por módulo (Solicitudes, Reservas, Eventos, PQRS, Info académica).
4. **Apariencia** — selector de tema Claro / Oscuro / Sistema.
5. **Preferencias** — idioma, zona horaria, formato de fecha, formato de hora (12h/24h).
6. **Privacidad** — toggles (nombre en actividades, comunicaciones institucionales, info académica en perfil) + sección informativa "Datos y privacidad".
7. **Zona de peligro** — "Cerrar todas las sesiones" y "**Solicitar desactivación** de cuenta" (en lugar de eliminar).

- Se eliminó la antigua sección "Servicios disponibles" (redundante con Gestión Servicios).
- Preferencias persistidas en `localStorage` (`uajs_config`).

---

## 5. Página Servicios (nueva, `/servicios`)

```
src/pages/Servicios/Servicios.jsx + .css
```

- **Vista de página principal** con **barra de búsqueda por nombre/categoría** (usa el hook `useSearch`).
- Filtros tipo **chips** por categoría.
- Grid de `ServiceCard` → enlaza a `/servicio/:nombre`.
- **Respeta permisos por rol** (`tienePermiso` del módulo de cada servicio).
- Ruta registrada en `AppRoutes.jsx`; botón "Explorar servicios" en la landing; "volver" de la vista de servicio ahora apunta a `/servicios`.

Reactivación del componente `ServiceCard` (estaba definido pero sin uso): ahora es el vínculo entre la landing/`/servicios` y la vista de detalle `/servicio/:nombre` (`pages/Servicio/Servicio.jsx`).

---

## 6. Landing conectada

- Las tarjetas de "Nuestros servicios" de la landing ahora usan `ServiceCard` y son **clicables** hacia `/servicio/:nombre`.
- Botón secundario **"Explorar servicios"** → `/servicios`.
- Se mantiene la redirección automática a los **5 segundos** (cuenta atrás) hacia `/dashboard` o `/login`.

---

## 7. Roles y permisos (refinados en `src/utils/users.js`)

Matriz corregida para coherencia, **sin inventar permisos nuevos**:

| Rol | Ajuste |
|---|---|
| **Estudiante** | Añadido permiso `info_academica` (tenía la acción `consultar_info_academica` pero no el permiso de menú). Añadido `configuracion`. |
| **Administrativo** | Quitado `publicar_eventos` (queda solo en Admin, alineado con la gestión de Eventos). Añadido `configuracion`. |
| **Docente** | Quitado `publicar_eventos`. Añadido `configuracion`. Conserva `publicar_info_academica`. |
| **Administrador** | Conserva todo: `usuarios`, `gestion_servicios`, `publicar_eventos`, etc. |

Correcciones de acceso:
- La ruta `/configuracion` exigía permiso `configuracion` que solo tenía el Admin; ahora **todos los roles** pueden acceder (módulo de cuenta).
- `publicar_eventos` limitado al **Administrador** (antes estaba en Administrativo y Docente).

---

## 8. Gestión de Recursos (crear / editar / eliminar)

Se añadió la administración completa de recursos en `pages/Recursos/`:

- **Botón "Nuevo recurso"** en el header, visible solo para roles con la acción `administrar_recursos` (**Administrador** y **Administrativo**).
- **Modal crear/editar**: nombre, código, tipo (Salas / Laboratorios / Auditorios / Equipos), capacidad, ubicación, estado y disponibilidad. Validación de nombres de los datos: nombre/código obligatorios y **código único** (evita duplicados).
- **Editar** y **Eliminar** por recurso (con confirmación), también restringidos por `administrar_recursos`.
- **Persistencia** en `localStorage` mediante `obtenerRecursos()` / `guardarRecursos()` con nueva clave `uajs_recursos` (los recursos creados sobreviven al recargar; el seed solo se usa si no hay datos guardados).
- **Toast** de confirmación al crear / actualizar / eliminar.
- El listado, las tarjetas resumen y los filtros ahora trabajan sobre el estado reactivo `items` (antes sobre el seed estático).

Archivos: `src/pages/Recursos/Recursos.jsx`, `src/pages/Recursos/Recursos.css`, `src/utils/recursos.js`.

---

## 9. Dockerfiles de servicios normalizados

Todos los Dockerfiles de los servicios de backend usan ahora el **mismo patrón** que `auth-service`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE <puerto>

CMD ["npm", "start"]
```

Normalizados (antes `node:18-alpine` y formato comprimido sin saltos de línea, o `node:24` / patrón de producción):

| Servicio | Puerto EXPOSE |
|---|---|
| `reservations-service` | 3004 |
| `notifications-service` | 3005 |
| `requests-service` | 3006 |
| `resources-service` | 3007 |
| `feedback-service` | 3008 |
| `academic-info-service` | 3009 |
| `configuration-service` | 3010 |

Ajustes menores:
- `users-service`: se eliminó un **espacio en blanco** tras `EXPOSE 3002` para igualar el formato.
- `academic-info-service`: su EXPOSE pasó de **3023 → 3009** para alinearlo con el `docker-compose.yml` raíz y el gateway.

Con esto, **todos los servicios (y el gateway) usan el mismo patrón** que `auth-service`.

---

## 10. Compose.yaml por servicio normalizados

Se añadieron / reescribieron los `compose.yaml` de cada servicio siguiendo el patrón sencillo de `auth-service`:

```yaml
services:
  <servicio>:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: uajs-<servicio>
    restart: unless-stopped
    ports:
      - "${<SERVICIO>_PORT:-<puerto>}:<puerto>"
    environment:
      PORT: ${<SERVICIO>_PORT:-<puerto>}
      DB_HOST: mysql
      DB_PORT: ${DB_PORT:-3306}
      DB_USER: ${DB_USER:-root}
      DB_PASSWORD: ${DB_PASSWORD:-}
      DB_NAME: ${DB_NAME:-uajs_smart_campus}
    env_file:
      - ../../../.env
    networks:
      - smart-campus-network

networks:
  smart-campus-network:
    name: smart-campus-network
    external: true
```

**Creados nuevos** (faltaban):

| Servicio | Puerto |
|---|---|
| `reservations-service` | 3004 |
| `notifications-service` | 3005 |
| `requests-service` | 3006 |
| `resources-service` | 3007 |
| `feedback-service` | 3008 |
| `configuration-service` | 3010 |

**Reescrito** (era el template genérico `server` con NODE_ENV):
- `academic-info-service` → puerto **3009** (consistente con `docker-compose.yml` raíz y gateway).

**Corregido**:
- `gateway/compose.yaml`: `env_file` de `../.env` → **`../../.env`** para apuntar al `.env` de la raíz (su ubicación difiere: está en `backend/gateway/`, no en `backend/services/*/`).

Validación: `docker compose -f <archivo> config --quiet` → **exit 0** en todos los compose.yaml.

---

## 11. Versión del panel

- `src/components/Sidebar/Sidebar.jsx`: `UniAJS v0.1` → **`UniAJS v0.4.0`**.

---

## 12. Corrección de bug: crash de Configuración

- **Síntoma**: pantalla en blanco + `TypeError: Cannot read properties of undefined (reading 'plataforma')` en `Configuracion.jsx:467`.
- **Causa**: datos antiguos en `localStorage` (`uajs_config`) con la estructura previa de `notificaciones: { correo, push, alertas }`. El `useState` hacía merge **superficial** (`{ ...configBase, ...guardada }`), dejando `notificaciones.canales` como `undefined`.
- **Fix**: función `mergeConfig(base, extra)` de **merge recursivo profundo** en la carga inicial, de modo que todas las ramas anidadas nuevas siempre existen aunque haya datos previos guardados.

---

## 13. Verificación

```powershell
cd frontend
npm run build   # ✓ 94 módulos, sin errores
npm run lint    # ✓ sin errores nuevos (5 avisos preexistentes en otros módulos)

# Validación de compose.yaml de cada servicio
docker compose -f backend/services/<servicio>/compose.yaml config --quiet   # ✓ exit 0
docker compose -f backend/gateway/compose.yaml config --quiet               # ✓ exit 0
```

---

## 14. Pendiente / fuera de alcance

- **No** se tocó backend funcional, autenticación real, WebSocket ni polling (quedan para una fase posterior).
- La versión "Próximamente" de 2FA / sesiones / desactivación de cuenta se conectará cuando exista API.
- Los registros creados por el usuario (Solicitudes, Reservas, Eventos) aún dependen de `localStorage`/datos de semilla.
- Todos los Dockerfiles de servicios quedaron normalizados al patrón de `auth-service`.
