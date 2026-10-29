# Registro de cambios — Iteración 3 · Conexión backend, Docker y búsqueda

> Fecha: 28 de agosto de 2026
> Alcance: arreglo del arranque Docker del frontend, conexión del login al backend real (gateway + auth-service), búsqueda con botón y sugerencias, y auditoría BEM.
> Estado: build compilando sin errores. **Sin push ni commit** (pendiente de aprobación).

---

## 1. Resumen

Esta iteración se centró en tres frentes:

1. **Docker / Compose** — reparar el servicio `frontend-dev` (que rompía el `docker-compose.yml` raíz y no arrancaba) y corregir su `dockerfile.dev`.
2. **Login real** — conectar el formulario del frontend con el backend a través del API Gateway, alineando el esquema de la BD y los nombres de campo.
3. **Búsqueda** — que las barras de búsqueda no filtren en vivo, sino con un botón "Buscar", reutilizando un componente `SearchBar` con **sugerencias** (autocompletado).

También se hizo una **auditoría BEM** del CSS (solo diagnóstico, sin cambios de código).

---

## 2. Docker / Compose (frontend)

### `docker-compose.yml` (raíz)

| Problema | Corrección |
|---|---|
| Stub huérfano `frontend-service:` (sin contenido) dejaba a `frontend-dev` anidado → `services.frontend-service must be a mapping` | Eliminado el stub; `frontend-dev` quedó como servicio válido |
| `frontend-dev` referenciaba la red inexistente `uajs-network` | Quitado el bloque `networks: uajs-network` (usa la red por defecto) |
| `dockerfile: Dockerfile.dev` no coincidía con el archivo real (minúsculas) | Cambiado a `dockerfile: dockerfile.dev` |
| Volumen anónimo `/app/node_modules` reutilizaba `node_modules` obsoletos | Volumen nombrado `frontend_node_modules:/app/node_modules` |

### `frontend/dockerfile.dev`

| Antes | Después | Motivo |
|---|---|---|
| `FROM node:18-alpine` | `FROM node:20-slim` | Vite 8 / rolldown exigen Node ≥ 20; Alpine (musl) no trae el binding nativo de rolldown |
| `RUN npm install` | `RUN npm ci` | Instalación reproducible con lockfile |
| `CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]` | `CMD ["npm", "run", "dev"]` | El script `dev` ya incluye `--host 0.0.0.0` |

### `frontend/.dockerignore` (nuevo)

Antes el build copiaba el `node_modules` de Windows a la imagen (binarios incompatibles). Se creó `.dockerignore` excluyendo:

```
node_modules
dist
.git
.env.local
```

### Resultado Docker

- `docker compose config` → **exit 0**.
- Stack completo (mysql + gateway + 10 servicios + `frontend-dev`) levantando sin conflictos de puertos (3000–3010 y 3306).
- Frontend accesible en `http://localhost:5173` (Vite 8, "UniAJS").

---

## 3. Conexión del login al backend (gateway + auth)

### `gateway/src/app.js`

- Se quitó `app.use(express.json())`: consumía el body de las peticiones `POST` antes de que el proxy lo reenviara → **timeout** en `/api/auth/login`.
- Se mantuvo `pathRewrite` para reconstruir `/api/<servicio>` (en Express 5 el montaje recorta el prefijo).

### `gateway/src/config/routes.js`

- Los targets del proxy pasaron de `http://localhost:<puerto>` a `http://<servicio>:<puerto>` (dentro de Docker, `localhost` es el propio contenedor del gateway):

```js
auth: 'http://auth-service:3001',
users: 'http://users-service:3002',
// ...
```

### `auth-service/src/controllers/auth.controller.js`

Alineación del esquema con la tabla real `usuarios` (que usa `identificacion`, no `usuario` ni `programa`):

- `login`: busca por `identificacion` y devuelve `identificacion`, `usuario` y `rol` (claves que espera el frontend).
- `register` / `me`: eliminan las columnas inexistentes `usuario` y `programa`.

> Nota: las credenciales de prueba de la BD recargada son `admin/admin123` (Administrador), `funcionario/func123` (Administrativo), `profesor/prof123` (Docente) y `estudiante/est123` (Estudiante).

---

## 4. Login con identificación (frontend)

### `AuthContext.jsx`

- Rol del administrador: `1: "Administrador del Sistema"` → `1: "Administrador"`, para que coincida con `ROLES` de `utils/users.js` (antes el admin no obtenía permisos). Ajustado `esAdmin()`.
- `login(identificacion, password)` → valida `data.identificacion`.

### `Login.jsx`

- `handleLoginWithDelay` → `handleLogin` con `try/catch` (se eliminó el `setTimeout`); con esto se acabó el **spinner infinito** cuando el login fallaba.
- Campo "Usuario" → **"Identificación"** (`identificacion` en estado e input).
- Re-agregada la función `fillCredentials` (se había perdido).

### `utils/api.js`

- `authApi.login` envía `{ identificacion, password }`.

---

## 5. Búsqueda con botón (no filtra en vivo)

Se cambió el comportamiento de todas las barras de búsqueda: la lista **no se actualiza al escribir**, solo al presionar **"Buscar"** o **Enter**.

- Se separó el texto del input (`query`) del término aplicado (`busqueda`).
- Módulos afectados: **Eventos, InfoAcadémica, PQRS, Recursos, Servicios, Solicitudes, Usuarios** y **Reservas** (su botón "Buscar" ahora sí aplica el filtro).

---

## 6. Componente `SearchBar` reutilizable

Se reescribió `components/SearchBar/SearchBar.jsx` (existía pero estaba sin uso) como componente controlado y autocontenido:

- Props: `value`, `onChange`, `onSearch`, `placeholder`, `id`, `suggestions`.
- Renderiza input + botón "Buscar" en un `<form>` (funciona con botón y con Enter).
- Los 7 módulos ahora usan `<SearchBar … />` en vez del `<input>` + `<button>` duplicado.
- Se eliminaron las clases compartidas `filter-search-row` / `filter-search-btn` de `styles/main.css` y el CSS muerto `.servicios__search-input`.

---

## 7. Sugerencias / autocompletado en la búsqueda

`SearchBar` acepta una prop `suggestions` y muestra un **desplegable** (acordeón) debajo del input con las coincidencias (máx. 8), resaltado al pasar el mouse. Al elegir una sugerencia se rellena el campo y se aplica la búsqueda.

Sugerencias por módulo (valores únicos de sus datos):

| Módulo | Sugerencias desde |
|---|---|
| Eventos | nombre, lugar, categoría |
| InfoAcadémica | título, categoría, autor |
| PQRS | número, tipo, estado |
| Recursos | nombre, tipo, ubicación |
| Servicios | nombre, categoría |
| Solicitudes | número, tipo, servicio, solicitante |
| Usuarios | usuario, nombre, correo, rol, programa |

---

## 8. Auditoría BEM (solo diagnóstico)

Verificación de la arquitectura BEM en el CSS (sin cambios de código):

- ✅ Convención `.bloque__elemento--modificador` mayoritariamente correcta; sin camelCase.
- ⚠️ **Violaciones**: clases sueltas de color/estado usadas como modificador (`.dashboard__stat-icon.blue`, `.status.available`, `.pqrs__item-status.review`, …) en vez de `--modificador`.
- ⚠️ **Modificadores por color** (no semánticos): `--blue`, `--green`, etc.
- ⚠️ **Bloques abreviados**: `sols`, `pag`, `dtable`, `notifs`, `info-ac`.
- ⚠️ **`.status`/`.detail`** definidos en más de un archivo (posible colisión).
- 🗑️ **CSS muerto/duplicado**: `styles/blocks/`, `styles/components/`, `styles/pages/` (33 archivos) no importados; contienen placeholders `__element`/`--modifier` y nombres en inglés duplicados.

---

## 9. Verificación

```powershell
cd frontend
npm run build   # ✓ 97 módulos, sin errores

docker compose -f docker-compose.yml config --quiet   # ✓ exit 0

# Login real a través del gateway
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identificacion":"admin","password":"admin123"}'   # → HTTP 200 + token
```

---

## 10. Pendiente / fuera de alcance

- Aplicar las correcciones de la **auditoría BEM** (unificar modificadores, renombrar bloques abreviados, eliminar la capa CSS muerta).
- El `register` del backend sigue usando el campo `usuario` (no se alineó a `identificacion`; solo se ajustó `login`).
- Registros creados por el usuario siguen dependiendo de `localStorage`/datos de semilla.
- Sin push ni commit (pendiente de aprobación y de definir tag).
