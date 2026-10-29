# Registro de cambios — Iteración 4 · Docker, red y dependencias

> **Fecha:** 28 de octubre de 2026
> **Alcance:** dejar el stack Docker reproducible en Linux y Windows; eliminar el compose legado inválido; unificar la red entre el compose raíz y los `compose.yaml` individuales; declarar la dependencia faltante del frontend; normalizar finales de línea.
> **Entorno de validación:** Arch Linux · Docker Engine 29.9.2 · Compose v5.6.1 · Node 26 (host) / Node 20 (contenedores).
> **Estado:** `docker compose config` → exit 0 · `npm run build` (frontend) → OK · sin commit ni push (pendiente de aprobación).

---

## 1. Diagnóstico previo: por qué no arrancaba

El `docker-compose.yml` raíz **no era el problema**: validaba correctamente. Los bloqueos eran del entorno y de dos archivos concretos del repo.

| Síntoma observado | Causa | ¿Se ve en Windows? |
|---|---|---|
| `docker: unknown command: docker compose` | Falta el plugin Compose v2 (`docker-compose`) | No: Docker Desktop lo incluye |
| `Cannot connect to the Docker daemon at unix:///var/run/docker.sock` | `docker.service` deshabilitado/inactivo; no existe el socket | No: Docker Desktop arranca su motor solo |
| `permission denied ... docker.sock` | El usuario no pertenece al grupo `docker` | No: en Windows no existe ese grupo |
| `go-yaml load error ... found character '\t'` en `backend/` | `backend/docker-compose.yml` usaba tabulaciones | **Sí**, YAML rechaza tabs en cualquier SO |
| `network smart-campus-network declared as external, but could not be found` | Ningún compose creaba esa red | **Sí**, mismo error |
| Frontend roto dentro del contenedor | `socket.io-client` se importa pero no estaba declarado en `package.json` | **Sí**, `npm ci` no lo instala en ningún SO |
| 365 archivos "modificados" en Git sin cambios reales | Working tree con CRLF y sin `.gitattributes` | Solo al pasar de Windows a Linux |

> La instalación del entorno Linux se documenta aparte en **[DOCKER-SETUP-LINUX.md](./DOCKER-SETUP-LINUX.md)**.

---

## 2. Correcciones aplicadas

### 2.1 `.gitattributes` (nuevo) + normalización a LF

**Problema.** El repo se editó en Windows y el working tree quedó con CRLF. Sin `.gitattributes`, Git reportaba **365 archivos modificados** que en realidad no tenían ningún cambio de contenido (`git diff --ignore-cr-at-eol` daba 0 archivos). Además, un Dockerfile o script con CRLF puede fallar dentro de un contenedor Linux.

**Cambio.**

- Se creó `.gitattributes` con `* text=auto eol=lf` y reglas explícitas para `Dockerfile*`, `dockerfile.*`, `docker-compose*.yml`, `compose*.yaml`, `*.sh`, `*.sql` y `.env*`.
- Se normalizaron a LF los 367 archivos de texto del working tree (365 rastreados + `.env` y `frontend/.env`, que no se versionan).
- Se refrescó el índice de Git (`git add -u`, sin cambios de contenido) para limpiar la caché de stat con tamaños CRLF.

**Resultado.**

```text
git status --short        → 0 líneas
git diff --stat           → vacío
```

**Nota para Windows.** Tras clonar, ejecutar una vez:

```powershell
git config --global core.autocrlf false
```

Así el working tree respeta el LF forzado por `.gitattributes` y no reaparece el ruido.

---

### 2.2 `backend/docker-compose.yml` → eliminado

**Problema.** Era un compose legado (el propio archivo lo advertía) y no funcionaba:

| Defecto | Detalle |
|---|---|
| YAML inválido | Indentación con tabulaciones → `found character '\t' that cannot start any token` (línea 4) |
| Claves duplicadas | `requests-service` y `resources-service` declarados dos veces |
| Ruta de SQL incorrecta | Montaba `./database/uajs_smart_campus.sql`, que no existe; el dump real está en `backend/uajs_smart_campus.sql` |
| Stack incompleto | Sin `auth-service`, sin `search-service`, con nombres legacy (`pqrs`, `info-academica`, `configuracion`) que el gateway ya no usa |
| Contradecía la raíz | Duplicaba servicios con otra configuración y otra red |

**Cambio.** Se eliminó el archivo. El único compose soportado es el de la raíz:

```bash
docker compose -f docker-compose.yml config --quiet   # exit 0
```

**Motivo.** Mantener dos fuentes de verdad garantiza que alguien levante un stack incompleto y depure errores que no existen en el stack real. Si se necesita el histórico, se recupera con `git show HEAD:backend/docker-compose.yml`.

---

### 2.3 Red `smart-campus-network` en el compose raíz

**Problema.** El compose raíz usaba la red por defecto (`uajs-smart-campus_default`), mientras que cada `backend/**/compose.yaml` declara:

```yaml
networks:
  smart-campus-network:
    name: smart-campus-network
    external: true
```

Nadie creaba esa red → cualquier intento de levantar un servicio individual fallaba con `network ... declared as external, but could not be found`. Y aunque se creara a mano, `mysql` no estaba conectado a ella, así que el servicio tampoco encontraba la base de datos.

**Cambio en `docker-compose.yml`.**

- Se agregó la red con **nombre fijo** (sin prefijo del proyecto):

```yaml
networks:
  smart-campus-network:
    name: smart-campus-network
```

- Los **15 servicios** (mysql, elasticsearch, gateway, 11 microservicios y `frontend-dev`) ahora declaran:

```yaml
    networks:
      - smart-campus-network
```

**Resultado.**

```text
docker compose config            → exit 0
docker compose config | grep networks
  smart-campus-network:
    name: smart-campus-network

# Los 11 compose.yaml individuales siguen validando
docker compose -f backend/services/auth-service/compose.yaml config --quiet   → OK
...
```

**Flujo de uso.**

```bash
# 1) La red se crea al levantar la raíz
docker compose up -d

# 2) Ya se puede levantar/reconstruir un servicio individual
docker compose -f backend/services/auth-service/compose.yaml up -d --build
```

> `docker compose down` elimina la red. Si se van a usar los compose individuales después, hay que volver a levantar la raíz primero.

---

### 2.4 `socket.io-client` declarado en el frontend

**Problema.** `frontend/src/context/RealtimeProvider.jsx` importa `socket.io-client`, pero la dependencia **no estaba** en `package.json` ni en `package-lock.json`. En el host funcionaba porque `node_modules` tenía una copia instalada a mano; dentro del contenedor, `npm ci` instala solo lo declarado → el módulo no existe y el frontend falla.

**Cambio.**

```diff
   "dependencies": {
     "react": "^19.2.8",
     "react-dom": "^19.2.8",
-    "react-router-dom": "^7.18.2"
+    "react-router-dom": "^7.18.2",
+    "socket.io-client": "^4.8.4"
   },
```

`package-lock.json` quedó actualizado con `socket.io-client`, `engine.io-client`, `@socket.io/component-emitter`, etc.

**Verificación.**

```text
node -e "require('socket.io-client/package.json').version"  → 4.8.4
npm run build                                                → ✓ 122 módulos, built in 572ms
```

---

### 2.5 Permisos de `node_modules/.bin` (solo entorno local)

**Problema.** Los binarios de `node_modules` estaban en modo `666` (sin bit de ejecución), seguramente por copiar el proyecto desde Windows o descomprimir un ZIP. Eso producía:

```text
sh: line 1: .../frontend/node_modules/.bin/vite: Permission denied
```

**Cambio.** Se aplicó `chmod +x` a los `.bin` de `frontend`, `backend/gateway` y `backend/services/*`. **No se versiona** (`node_modules` está en `.gitignore`); es una reparación del entorno local.

> En Windows este problema no existe: NTFS no usa bits de ejecución.

---

## 3. Verificaciones ejecutadas

| Comando | Resultado |
|---|---|
| `docker compose config --quiet` (raíz) | exit 0 |
| `docker compose config` (raíz) | 15 servicios, red `smart-campus-network` |
| `docker compose -f backend/**/compose.yaml config --quiet` (11 archivos) | exit 0 en todos |
| `npm run build` (frontend) | exit 0 (494 kB JS / 238 kB CSS) |
| `git status --short` | limpio antes de estas correcciones |
| `git diff --ignore-cr-at-eol --name-only` | 0 archivos (confirmó que el ruido era solo CRLF) |

> No se pudo ejecutar `docker compose up` en esta sesión porque el daemon requiere `sudo` con contraseña. Los pasos están en [DOCKER-SETUP-LINUX.md](./DOCKER-SETUP-LINUX.md).

---

## 4. Pendientes (no incluidos en esta iteración)

1. **Tiempo real incompleto.**
   - `notifications-service/src/realtime.js` requiere `socket.io` y `jsonwebtoken`, pero ninguno está en su `package.json`.
   - Ese archivo **nunca se importa**: `server.js` solo hace `app.listen`, no llama a `initRealtime(httpServer)`.
   - El gateway no hace proxy de `/socket.io` hacia `notifications-service`.
   - Falta decidir la arquitectura: exponer Socket.IO por el gateway o por el puerto 3005, y declarar las dependencias.
2. **`.env.example` incompleto.** No incluye `JWT_SECRET`, `JWT_EXPIRES`, `NOTIFICATIONS_WEBHOOK_SECRET` ni `SEARCH_SERVICE_PORT`. Un clon nuevo arranca con valores por defecto débiles.
3. **Servicios legacy duplicados.** Siguen en el repo `pqrs-service`, `info-academica-service` y `configuracion-service`, que el stack y el gateway no usan (se usan `feedback-service`, `academic-info-service` y `configuration-service`). Conviene eliminarlos o marcarlos como obsoletos.
4. **Disco del host.** Al momento del diagnóstico había 5.2 GB libres (96 % usado). Elasticsearch + MySQL + 14 imágenes pueden agotarlo; limpiar con `docker system prune -af` antes del primer build.
5. **`npm run dev` local en Linux** requiere Node `^20.19.0 || >=22.12.0` (Vite 8). En el host había Node 26; en Docker se usa Node 20.
6. **Regla de equipo.** Usar siempre `docker compose` (v2), nunca `docker-compose` (v1), y levantar desde la raíz.

---

## 5. Archivos tocados

| Archivo | Tipo de cambio |
|---|---|
| `.gitattributes` | nuevo |
| `docker-compose.yml` | red fija + 15 servicios conectados |
| `backend/docker-compose.yml` | eliminado |
| `frontend/package.json` | `socket.io-client` agregado |
| `frontend/package-lock.json` | lock actualizado |
| `docs/CAMBIOS-ITERACION4.md` | nuevo (este documento) |
| `docs/DOCKER-SETUP-LINUX.md` | nuevo |
| `docs/ARQUITECTURA.md` | red, comandos y variables actualizados |
| `backend/README.md` | estructura real, `.env` en la raíz y enlaces a la documentación |
