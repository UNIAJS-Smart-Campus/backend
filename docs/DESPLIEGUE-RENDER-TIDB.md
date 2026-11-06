# Despliegue en producción: Render + TiDB Serverless + Vercel

Este documento describe cómo está desplegado UAJS Smart Campus y qué hay que
tener en cuenta al cambiarlo. No incluye valores de secretos: solo los
nombres de las variables.

## Arquitectura

```
Navegador
   │
   ├── https://frontend-mu-mocha-67.vercel.app   (React + Vite, estático)
   │        │  VITE_API_URL / VITE_WS_URL
   │        ▼
   └── https://backend-8pq5.onrender.com         (Docker, un solo proceso)
            │  gateway :PORT + 11 microservicios :3001-:3011
            ▼
        TiDB Serverless (MySQL compatible, TLS)
```

- **Frontend**: proyecto `frontend` en Vercel (rama `main`).
- **Backend**: servicio Docker `backend` en Render (plan free, región Oregon).
- **Base de datos**: instancia Starter de TiDB Cloud, base `uajs_smart_campus`.

## Backend en Render

Render ejecuta **un contenedor por servicio** y no corre `docker-compose`, por
eso el backend usa el modo *all-in-one*:

- `backend/Dockerfile` (raíz del repo) construye una sola imagen.
- `backend/start-all.js` arranca gateway + 11 microservicios en un único
  proceso Node, cada uno en su puerto habitual.
- `backend/gateway/src/config/routes.js` apunta el proxy a `localhost:300x`
  cuando `ALL_IN_ONE=1` (en docker-compose sigue usando los hostnames).
- `package.json` usa npm workspaces: un solo `node_modules` compartido, lo que
  reduce el uso de memoria del plan free.

### Variables de entorno requeridas

| Variable | Ejemplo / uso |
| --- | --- |
| `ALL_IN_ONE` | `1` (activa los destinos `localhost` del gateway) |
| `DB_HOST` | host del cluster TiDB |
| `DB_PORT` | `4000` en TiDB Serverless |
| `DB_USER` | usuario de la base |
| `DB_PASSWORD` | contraseña de la base (secreto) |
| `DB_NAME` | `uajs_smart_campus` |
| `DB_SSL` | `1` (TiDB exige TLS) |
| `DB_SSL_VERIFY` | `0` desactiva la validación del certificado; omitir = valida |
| `DB_CONN_LIMIT` | `3` (límite bajo por la RAM del plan free) |
| `JWT_SECRET` | secreto de firma de tokens |
| `JWT_EXPIRES` | p. ej. `8h` |
| `CORS_ORIGINS` | URL del frontend |
| `FRONT_URL` | URL del frontend (enlaces de correo/notificaciones) |
| `NOTIFICATIONS_WEBHOOK_SECRET` | secreto del webhook interno |

Render inyecta `PORT` (10000) y el health check usa el gateway.

#### `DB_CONN_LIMIT`: por qué hay que definirlo

Cada servicio crea su propia pool de conexiones con
`connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10`. En `ALL_IN_ONE`
corren 11 servicios en el mismo proceso, así que **sin la variable el techo
es ~110 conexiones abiertas** (más la pool de auditoría del gateway, limitada
a 2) y con `DB_CONN_LIMIT=3` baja a ~35. El plan free de TiDB tiene pocos
recursos, así que el valor debe estar definido en Render → Environment;
si no está, manda el defecto de `10` por servicio.

### Rendimiento de las respuestas

- **Compresión gzip en el gateway** (`compression`): todo JSON que sale del
  gateway llega comprimido a Vercel y a los móviles (un listado suele pesar
  4-5 veces menos). Está montada antes del proxy, así que también cubre las
  respuestas reenviadas desde los microservicios.
- **Keep-alive en el proxy interno**: el gateway reutiliza los sockets HTTP
  hacia los microservicios (`http.Agent` con `keepAlive`) en lugar de abrir
  uno nuevo por petición; importa sobre todo en Render, donde abrir y cerrar
  conexiones cuesta CPU.
- **Tope en las listas sin paginar** (`usuarios`, `pqrs`, `notificaciones`,
  `recursos`): aceptan `?limit=` (500 por defecto, 1000 máximo) y entregan lo
  más reciente primero, para que la respuesta no crezca sin control.
  `solicitudes`, `eventos` y `reservas` ya usan paginación `page`/`limit`.

### Base de datos: semilla automática

`start-all.js` importa `uajs_smart_campus.sql` en el arranque, pero **no lo
ejecuta tal cual**: `seed-sql.js` lo reescribe en memoria porque el dump es de
phpMyAdmin para MySQL 8 y TiDB no acepta dos cosas.

1. `ALTER TABLE ... MODIFY col ... AUTO_INCREMENT=N`
   → TiDB responde `Unsupported modify column: can't set auto_increment`.
   Además el `CREATE TABLE` del dump no declara la columna con
   `auto_increment`, así que sin reescribirla los `INSERT` de la app fallan con
   `Field 'id_usuario' doesn't have a default value`.
   El transformador inyecta `AUTO_INCREMENT` en las 14 columnas id y convierte
   cada `MODIFY` en `ALTER TABLE ... AUTO_INCREMENT=N` (13 contadores).
2. `CREATE ALGORITHM=... DEFINER=root@localhost SQL SECURITY DEFINER VIEW`
   → las vistas quedan ilegibles (`definer/invoker of view lack rights`).
   El transformador las reescribe como `CREATE VIEW` sin `DEFINER`.

El arranque considera la base inicializada solo si:

- hay al menos tantos objetos como declara el dump (14 tablas + 2 vistas), y
- `usuarios` tiene datos de semilla, y
- `usuarios.id_usuario` es `AUTO_INCREMENT`.

Si falta cualquiera de las tres, limpia el esquema (vistas primero, con
`foreign_key_checks = 0`) y vuelve a importar. Los ids de TiDB se asignan por
bloques, así que el primer id nuevo no es necesariamente el del contador del
dump (es normal y no afecta a la app).

## Frontend en Vercel

Variables del proyecto (Production):

| Variable | Valor |
| --- | --- |
| `VITE_API_URL` | `https://backend-8pq5.onrender.com/api` |
| `VITE_WS_URL` | `https://backend-8pq5.onrender.com` |

Son de tipo *Config* (públicas, quedan dentro del bundle) y se inyectan en
tiempo de build: **tras cambiarlas hay que redesplegar** (Deployments →
último deploy → ⋯ → Redeploy).

## Limitaciones conocidas

- **Sin Elasticsearch**: el plan free de Render no permite el contenedor
  adicional, así que `/api/search` no responde. El resto de módulos funciona;
  el middleware de reindexado ignora sus fallos.
- **Plan free de Render**: la instancia se suspende por inactividad; la
  primera petición tras un rato puede tardar ~50 s.
- **Las foreign keys se validan**: TiDB 8.5 sí aplica las 14 FK del dump. Un
  `INSERT` con un `id_usuario` inexistente falla; por eso una sesión con el
  token de un usuario ya eliminado (o de una base reconstruida) provoca error
  en cualquier escritura. `/auth/me` responde 401 en ese caso y el frontend
  cierra sesión. Si se reconstruye la base con usuarios dados de alta fuera de
  la semilla, esos usuarios se pierden y deben volver a iniciar sesión.

## Mantenimiento rápido

- Reconstruir la semilla: borrar los objetos del esquema y reiniciar el
  servicio; el arranque detecta la base incompleta y la reimporta.
- Rotar la contraseña de TiDB: cambiarla en la consola de TiDB y actualizar
  `DB_PASSWORD` en Render (redeploy automático al guardar).
- Comprobar el arranque en Render: sección **Logs**, buscar
  `[db] Base de datos ya inicializada` o `[db] Semilla importada correctamente`.
