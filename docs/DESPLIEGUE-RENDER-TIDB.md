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
- **TiDB no aplica las foreign keys**: acepta la definición (14 FK) y las
  muestra en `information_schema`, pero no las valida como MySQL.

## Mantenimiento rápido

- Reconstruir la semilla: borrar los objetos del esquema y reiniciar el
  servicio; el arranque detecta la base incompleta y la reimporta.
- Rotar la contraseña de TiDB: cambiarla en la consola de TiDB y actualizar
  `DB_PASSWORD` en Render (redeploy automático al guardar).
- Comprobar el arranque en Render: sección **Logs**, buscar
  `[db] Base de datos ya inicializada` o `[db] Semilla importada correctamente`.
