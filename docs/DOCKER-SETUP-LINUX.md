# Docker en Linux (Arch) — instalación y arranque del stack

> Guía para dejar Docker funcionando en Linux y levantar UAJS Smart Campus.
> Para Windows se usa **Docker Desktop** (ver nota al final).
> Ver también: [CAMBIOS-ITERACION4.md](./CAMBIOS-ITERACION4.md) y [ARQUITECTURA.md](./ARQUITECTURA.md).

---

## 1. Requisitos

| Componente | Para qué |
|---|---|
| `docker` + `containerd` | Motor de contenedores |
| `docker-compose` | Subcomando `docker compose` (plugin v2) |
| `docker-buildx` | BuildKit (`docker compose build`) |
| Usuario en el grupo `docker` | Evitar `sudo` en cada comando |
| `git` con `core.autocrlf=false` | Respetar LF de `.gitattributes` |

> **Importante:** el comando correcto es `docker compose` (sin guion). `docker-compose` (v1) está obsoleto y el proyecto no lo usa.

---

## 2. Instalación en Arch Linux

```bash
# 1. Plugins que el paquete docker NO incluye
sudo pacman -S --needed docker-compose docker-buildx

# 2. Habilitar y arrancar el daemon (y el socket)
sudo systemctl enable --now docker.service

# 3. Permitir que tu usuario use Docker sin sudo
sudo usermod -aG docker "$USER"

# 4. Aplicar el grupo en la sesión actual
newgrp docker
#    (o cerrar sesión y volver a entrar; newgrp solo afecta a esa terminal)
```

### Verificación

```bash
docker version                # cliente + servidor
docker compose version        # Docker Compose version vX.Y.Z
docker run --rm hello-world   # prueba real del daemon y permisos
```

Si `docker version` muestra solo el cliente y un error de conexión, el daemon no está corriendo. Si `hello-world` da `permission denied`, el grupo no se aplicó: cerrar sesión y volver a entrar.

---

## 3. Primer arranque del proyecto

```bash
cd ~/Downloads/UAJS-Smart-Campus

# 1. Validar el compose sin levantar nada (no requiere daemon)
docker compose config --quiet          # exit 0 = OK

# 2. Construir y levantar todo
docker compose up -d --build

# 3. Ver estado (los servicios deben quedar "healthy"/"running")
docker compose ps

# 4. Seguir logs
docker compose logs -f gateway
```

**Servicios y puertos publicados:**

| Servicio | Puerto |
|---|---|
| MySQL | 3306 |
| Elasticsearch | 9200 |
| Gateway | 3000 |
| auth / users / events / reservations / notifications | 3001 – 3005 |
| requests / resources / feedback / academic-info / configuration | 3006 – 3010 |
| search-service | 3011 |
| frontend-dev (Vite) | 5173 |

Frontend: <http://localhost:5173> · API: <http://localhost:3000>

> **Primera vez:** el dump `backend/uajs_smart_campus.sql` se ejecuta **solo si el volumen `mysql_data` está vacío**. Si ya intentaste antes y la base quedó a medias:
> ```bash
> docker compose down -v
> docker compose up -d --build
> ```
> `-v` borra los volúmenes (`mysql_data`, `elasticsearch_data`, `frontend_node_modules`).

---

## 4. Red compartida con los compose individuales

El compose raíz crea la red con nombre fijo:

```yaml
networks:
  smart-campus-network:
    name: smart-campus-network
```

Los `backend/**/compose.yaml` la usan como `external: true`. **Primero** hay que levantar la raíz (crea la red y conecta `mysql`); después se puede levantar un servicio suelto:

```bash
docker compose up -d
docker compose -f backend/services/auth-service/compose.yaml up -d --build
```

`docker compose down` elimina la red; si se usan los compose individuales, volver a levantar la raíz.

---

## 5. Errores comunes y solución

| Mensaje | Causa | Solución |
|---|---|---|
| `docker: unknown command: docker compose` | Falta el plugin Compose v2 | `sudo pacman -S docker-compose docker-buildx` |
| `Cannot connect to the Docker daemon at unix:///var/run/docker.sock` | Daemon apagado o deshabilitado | `sudo systemctl enable --now docker.service` |
| `permission denied while trying to connect to the Docker daemon socket` | Usuario fuera del grupo `docker` | `sudo usermod -aG docker $USER` + cerrar sesión |
| `network smart-campus-network declared as external, but could not be found` | Se levantó un compose individual sin la raíz | `docker compose up -d` primero |
| `port is already allocated` | Otro proceso usa 3000–3011, 3306, 9200 o 5173 | `ss -ltnp \| grep -E ':(3000\|3306\|5173)'` y liberar el puerto |
| `Bind for 0.0.0.0:3306 failed` | MySQL local ya está corriendo | Parar el MySQL del host o cambiar el mapeo |
| La base no tiene tablas | El volumen ya existía y el init SQL no se re-ejecutó | `docker compose down -v` y volver a levantar |
| `no space left on device` | Disco lleno (imágenes + build cache) | `docker system prune -af` y liberar espacio |
| `max virtual memory areas vm.max_map_count [65530] is too low` | Requisito de Elasticsearch | `sudo sysctl -w vm.max_map_count=262144` (persistir en `/etc/sysctl.d/99-elasticsearch.conf`) |
| `failed to solve: process "/bin/sh -c npm ci" did not complete successfully` | Lockfile desincronizado o dependencia faltante | `cd frontend && npm install` y revisar el diff |
| `vite: Permission denied` (solo host) | `node_modules/.bin` sin bit `+x` | `chmod +x node_modules/.bin/*` |
| Frontend carga pero falla `socket.io-client` | Dependencia no declarada (corregido en iteración 4) | `cd frontend && npm ci` |
| Git muestra cientos de archivos modificados | CRLF por checkout en Windows | Ver sección 6 |

---

## 6. Finales de línea (Windows ↔ Linux)

El repo incluye `.gitattributes` con `* text=auto eol=lf`. En un clon Windows:

```powershell
git config --global core.autocrlf false
git rm --cached -r . ; git reset --hard
```

Sin esto, Git vuelve a meter CRLF y aparecen cientos de archivos "modificados" que no tienen cambios reales. Para comprobarlo:

```bash
git diff --ignore-cr-at-eol --name-only   # vacío = solo era CRLF
```

---

## 7. Comandos útiles

```bash
# Levantar / bajar
docker compose up -d
docker compose down
docker compose down -v                 # OJO: borra la base de datos

# Estado y logs
docker compose ps
docker compose logs -f <servicio>

# Reconstruir un servicio tras cambios
docker compose build <servicio>
docker compose up -d --force-recreate <servicio>

# Validar sin levantar
docker compose config --quiet

# Entrar a un contenedor
docker compose exec mysql mysql -uroot uajs_smart_campus

# Limpieza
docker system df
docker system prune -af                # imágenes/contenedores/redes no usados
docker builder prune -af               # caché de build
```

---

## 8. Nota para Windows (Docker Desktop)

Docker Desktop ya incluye el motor, Compose v2 y `buildx`, y arranca solo. Solo hay que:

1. Tener Docker Desktop iniciado (icono de la ballena en la bandeja).
2. Usar **WSL 2** como backend (Settings → General).
3. Ejecutar los mismos comandos `docker compose` desde PowerShell en la raíz del repo.
4. Configurar `git config --global core.autocrlf false` para respetar `.gitattributes`.
5. Permitir el acceso a la carpeta del proyecto en Settings → Resources → File sharing (si se usa el backend clásico).

El rendimiento del bind mount `./frontend:/app` es menor en Windows; si el hot-reload va lento, se puede desarrollar el frontend en el host (`npm run dev`) y mantener solo el backend en Docker.
