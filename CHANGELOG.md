# Changelog — UAJS Smart Campus

Registro de cambios relevantes del proyecto. Está pensado para que cualquier integrante del equipo
pueda entender **qué cambió, qué falta y cómo verificarlo** sin leer todo el código.

> **Estado actual del repositorio:** rama `frontend`.
> Los cambios de las iteraciones 4 a 8 están **en el working tree, sin commit ni push**.
> Las correcciones de código aplicadas el 2026-10-28 están detalladas en
> [Correcciones aplicadas](#sin-publicar--2026-10-28--correcciones-de-código) y
> el estado de cada hallazgo quedó actualizado en
> [Revisión de código](#revisión-de-código--estado-de-hallazgos).
> La prueba de integración UI ↔ backend y sus correcciones están en
> [Iteración 5](#sin-publicar--2026-10-28--iteración-5-integración-ui--backend).
> La revisión específica del módulo **Solicitudes** está en
> [Iteración 6](#sin-publicar--2026-10-28--iteración-6-módulo-solicitudes-ui--backend).
> El arreglo de creación de reservas está en
> [Iteración 7](#sin-publicar--2026-10-28--iteración-7-módulo-reservas-ui--backend).
> El cierre de pendientes (validaciones, Perfil, Configuración, búsqueda y lint) está en
> [Iteración 8](#sin-publicar--2026-10-28--iteración-8-pendientes-de-reservas-eventos-perfil-configuración-y-búsqueda).

---

## [Sin publicar] — 2026-10-28 · Iteración 5: integración UI ↔ backend

Enfoque: probar el flujo real navegador → gateway → servicio → MySQL con el stack reconstruido y
corregir los errores que producían `500 Internal Server Error` en la interfaz.

### Causas encontradas y corregidas

| # | Síntoma en la UI | Causa raíz | Corrección |
|---|---|---|---|
| 1 | Crear evento con categoría **Institucional** → «Error interno del servidor» | La base de datos en ejecución seguía con el `ENUM` viejo (`Académico, Cultural, Deportivo, Formación`); MySQL estricto rechazaba el valor | Se aplicó `backend/database/migrations/003_align_event_categories.sql` sobre la BD viva. El `ENUM` ya incluye `Institucional` |
| 2 | `PUT /api/configuration/:id` con cuerpo parcial → 500 | `update` escribía `id_usuario`/`seccion`/`valor` sin fusionar; `mysql2` rechaza parámetros `undefined` | `configuration-service`: ahora lee la fila actual y aplica `b.x ?? actual.x` |
| 3 | `PUT /api/resources/:id` con cuerpo parcial → 500 | Mismo patrón de *binds* `undefined` | `resources-service`: actualización parcial fusionada con la fila actual |
| 4 | `PUT /api/events/:id` con cuerpo parcial → 500 | Mismo patrón de *binds* `undefined` | `events-service`: actualización parcial fusionada con la fila actual |
| 5 | `PUT /api/notifications/:id` con cuerpo parcial → 500 | Mismo patrón de *binds* `undefined` | `notifications-service`: actualización parcial fusionada con la fila actual |
| 6 | La interfaz empezaba a fallar tras navegar varias pantallas | Rate limit global del gateway en **100 req/min por IP**; una SPA que carga varias listas por pantalla lo agota y devuelve `429` | Límite global elevado a **600 req/min** (el límite estricto de login se mantiene en 20/15 min) |
| 7 | Asignar responsable en una solicitud no se guardaba | `denormalizeSolicitud` no enviaba `id_responsable` (ni `historial`), aunque el backend ya los soporta | `frontend/src/utils/api.js`: se envían `id_responsable` e `historial`; `normalizeSolicitud` lee `id_responsable` para el objeto `responsable` |
| 8 | Al registrar una PQRS el mensaje decía «número asignado» en vez del radicado | La UI leía `numero?.id`, pero el backend responde `id_pqrs` | `NuevaPQRS.jsx`: usa `id_pqrs ?? id` |
| 9 | `PUT /api/requests/6` y `PUT /api/reservations/6` → 500 al editar desde la UI | El frontend reenviaba `fecha_solicitud`/`fecha_reserva` como ISO completo (`2026-09-08T00:00:00.000Z`); MySQL rechaza ese texto en una columna `DATE` (error **1292**) y el servicio lo devuelve como 500 | Frontend: helper `fechaCorta()` en `api.js` recorta a `YYYY-MM-DD` en los 5 denormalizadores con fecha. Backend: helper `fechaDia()` en `requests-service` y `reservations-service` (`create` y `update`) para tolerar ISO completo o `Date` de MySQL |

### Verificación de integración (stack reconstruido)

| Flujo | Resultado |
|---|---|
| Login de los 4 roles demo por `http://localhost:3000/api/auth/login` | 200 con JWT |
| Lecturas de todas las páginas (`auth/me`, `users`, `resources`, `reservations`, `events`, `notifications`, `requests`, `feedback`, `academic-info`, `configuration`) | 200 con token, 401 sin token |
| Crear/editar/eliminar evento **Institucional** | 201 / 200 / 204 |
| Crear reserva, cancelarla y eliminarla | 201 / 200 / 204 |
| Crear PQRS, cambiar estado y eliminarla | 201 / 200 / 204 |
| Crear solicitud, asignar responsable y eliminarla | 201 / 200 / 204 |
| Crear/editar/desactivar usuario | 201 / 200 / 200 |
| Crear/editar/eliminar recurso e información académica | 201 / 200 / 204 |
| Marcar notificaciones como leídas (`read-all`) | 200 |
| WebSocket `ws://localhost:3000/socket.io` con JWT | conecta correctamente |
| Tiempo real: `POST /api/notifications/webhook` con secreto → evento `notification:new` en el socket del usuario | recibido con `unreadCount` correcto |
| `PUT` parciales de `configuration`, `events`, `resources`, `notifications` | corregidos en código; requieren reconstruir imágenes para verse en el stack en ejecución |
| `PUT /api/requests/6` con `fecha_solicitud: "2026-09-08"` | 200 (antes 500 con ISO completo) |
| `PUT /api/reservations/6` con ISO completo → 500, con `"2026-09-22"` → 200 | bug reproducido y corregido en el frontend |
| Bundle de Vite (`/src/utils/api.js`) contiene `fechaCorta` | confirmado; el fix de UI ya está activo sin reiniciar nada |

### Notas

- **Hay que reconstruir** (`docker compose up -d --build`) para que los cambios de los servicios
  backend (puntos 2–6 y 9) entren en vigor; el frontend sí toma los cambios por el volumen de Vite.
  El fix de fechas de la UI (punto 9) ya está vivo: basta con recargar el navegador con
  `Ctrl+Shift+R`. La reconstrucción solo agrega la tolerancia del backend a fechas ISO.
- Los cambios de esta iteración también quedan **sin commit**.
- La migración `003` sí quedó aplicada sobre la base de datos en ejecución; es idempotente respecto
  al estado final (`MODIFY COLUMN` al mismo `ENUM`).
- `/api/search` sigue devolviendo 500 porque los índices de Elasticsearch nunca se crean; la UI **no**
  llama a ese endpoint (la búsqueda de las tablas es local con `useSearch`). Queda como pendiente
  documentado en [Revisión de código](#revisión-de-código--estado-de-hallazgos).

### Archivos de esta iteración

- `backend/gateway/src/app.js`
- `backend/services/configuration-service/src/controllers/configuration.controller.js`
- `backend/services/resources-service/src/controllers/resources.controller.js`
- `backend/services/events-service/src/controllers/events.controller.js`
- `backend/services/notifications-service/src/controllers/notifications.controller.js`
- `backend/services/requests-service/src/controllers/requests.controller.js`
- `backend/services/reservations-service/src/controllers/reservations.controller.js`
- `frontend/src/utils/api.js`
- `frontend/src/pages/PQRS/NuevaPQRS/NuevaPQRS.jsx`
- `backend/database/migrations/003_align_event_categories.sql` (aplicada en la BD, sin cambios de contenido)

---

## [Sin publicar] — 2026-10-28 · Iteración 6: módulo Solicitudes UI ↔ backend

Enfoque: revisar el flujo completo de `frontend/src/pages/Solicitudes` contra `requests-service`
(gateway → controlador → MySQL) y corregir los defectos de integración detectados, no solo los 500.

### Causas encontradas y corregidas

| # | Síntoma en la UI | Causa raíz | Corrección |
|---|---|---|---|
| 1 | Una solicitud recién creada aparecía **sin etiqueta de estado y sin acciones** | El `POST` guardaba `estado: "Registrada"` (capitalización mixta) mientras la UI compara contra `REGISTRADA` en mayúsculas | `estadoNormalizado()` en el backend y normalización defensiva en `normalizeSolicitud` (mayúsculas + `RADICADA` → `REGISTRADA`) |
| 2 | Al crear, la solicitud quedaba **sin servicio** (texto vacío e icono genérico) | La UI envía `servicio: "Reservas"` (nombre); el backend solo leía `id_servicio` y el denormalizador no enviaba el nombre | El frontend envía `servicio` y el backend resuelve `id_servicio` contra la tabla `servicios` (mismo criterio en `create` y `update`) |
| 3 | Tras crear, la tarjeta mostraba **solicitante/servicio/responsable en blanco** hasta recargar | `create` devolvía `SELECT * FROM solicitudes` sin los `JOIN` del listado | `create` devuelve la fila con `SELECT_SOLICITUD` (mismos `JOIN` que `getAll`) |
| 4 | El **historial nunca cambiaba**; las notas y los motivos de pausa/reapertura no se veían | Las acciones solo cambiaban `estado`/`respuesta`; nadie añadía eventos al JSON `historial`. «Agregar nota» sobreescribía `respuesta` | El backend genera los eventos (`CREACION`, `ESTADO`, `ASIGNACION`, `NOTA`, `PAUSA`, `REANUDA`, `REAPERTURA`, `RECHAZO`); el frontend envía `motivo` y ya no pisa `respuesta` |
| 5 | Un `PUT` parcial **sin `historial` podía devolver 500** | `mysql2` serializa un array como `'a', 'b'` (sin corchetes), así que pasar el array actual como bind generaba SQL inválido | `update` guarda siempre `JSON.stringify(historial)` y tolera entradas JSON en texto; el frontend además parsea `historial` con `safeParse` si llega como string y normaliza `dependencia` |
| 6 | La solicitud de prueba `QA solicitud` (id 7) mostraba el estado crudo `RADICADA` | El sondeo de QA dejó una fila con el typo `RADICADA`, estado ajeno a la UI | Se normalizó el dato con `004_normalize_request_states.sql` y se eliminó la fila de prueba `QA solicitud` (sin usuario ni servicio) |
| 7 | Después de una acción, la siguiente llamaba a `PUT /api/requests/undefined` → **404** | `requestsApi.create` y `requestsApi.update` devolvían la fila **cruda** del backend (`id_solicitud`); `SolicitudDetalle` la guardaba como estado y, al no tener `.id`, la acción siguiente armaba la URL con `undefined` | `create`/`update` ahora devuelven el objeto normalizado (`normalizeSolicitud`). Se añadió una guarda `id ?? id_solicitud` en las dos pantallas y se normalizaron también las respuestas de mutación de `users`, `resources`, `reservations`, `events`, `feedback`, `academic-info` y `configuration` |

### Verificación

La prueba se ejecutó con el **controlador real** contra el MySQL local (sin Docker, porque el agente
no puede reconstruir imágenes), usando el payload exacto que envía la UI:

| Flujo | Resultado |
|---|---|
| `POST /api/requests` con `servicio: "Reservas"` y `estado: "REGISTRADA"` | **201**, `id_servicio = 2`, `servicio_nombre = "Reservas"`, `usuario_nombre` presente, historial con `CREACION` |
| `PUT /api/requests/:id` con **solo** `{ estado: "EN_REVISION" }` (sin `historial`) | **200** (antes: riesgo de 500) |
| Secuencia revisar → asignar → proceso → pausar → reanudar → nota → resolver → cerrar → reabrir → rechazar | **200** en cada paso; **11 eventos** con tipos y descripciones correctos |
| Motivos de pausa, reapertura y rechazo | Guardados en el evento correspondiente y visibles en el timeline |
| Limpieza de la fila de prueba | Eliminada; no quedaron datos temporales |
| Limpieza de `QA solicitud` (id 7, sin usuario ni servicio) | Eliminada; la BD queda con las 6 solicitudes reales |
| `node --check` del controlador | OK |
| `npm run build` del frontend | OK |
| `POST`, `PUT` y `DELETE` con el payload nuevo a través del **gateway en ejecución** (imagen vieja) | 201 / 200 / 204, sin 500 |
| Respuesta de `requestsApi.update` con `id` normalizado (bundle de Vite) | confirmado; ya no se genera `/api/requests/undefined` |
| `create` → `update` → `update` → `remove` usando el `api.js` servido por Vite | **201/200/200/204** con el id correcto en cada llamada; fila de prueba eliminada |

### Notas

- **Hay que reconstruir `requests-service`** (`sudo docker compose up -d --build requests-service`)
  para que estos cambios entren en vigor. Los cambios de frontend sí se recargan con `Ctrl+Shift+R`.
  Con la imagen vieja, el flujo ya no da 500, pero el servicio y los eventos del historial solo se
  completan después del rebuild.
- El arreglo del **punto 7 es solo de frontend**: se aplica al recargar (`Ctrl+Shift+R`), sin rebuild.
- La migración `004` ya quedó aplicada sobre la base de datos en ejecución (no quedan estados
  `RADICADA` ni en minúsculas). Es idempotente.
- El lint de `Solicitudes.jsx` y `SolicitudDetalle.jsx` quedó sin `no-unused-vars` (se retiraron tres
  variables/imports sin uso); permanecen los avisos previos de `set-state-in-effect`,
  `exhaustive-deps` y memoización del compilador de React.
- `GET /api/search` sigue en 500 por los índices de Elasticsearch sin crear; la UI no lo llama.
- La solicitud 4 quedó en estado `RESUELTA` por una prueba manual sobre la UI; no se revirtió porque
  es un dato de ejemplo válido.


### Archivos de esta iteración

- `backend/services/requests-service/src/controllers/requests.controller.js`
- `backend/database/migrations/004_normalize_request_states.sql` (nueva, aplicada en la BD)
- `frontend/src/utils/api.js`
- `frontend/src/pages/Solicitudes/Solicitudes.jsx`
- `frontend/src/pages/Solicitudes/SolicitudDetalle.jsx`

---

## [Sin publicar] — 2026-10-28 · Iteración 7: módulo Reservas UI ↔ backend

Enfoque: revisar por qué la página **Reservas** no ofrecía forma de crear una reserva desde la UI.

### Causas encontradas y corregidas

| # | Síntoma en la UI | Causa raíz | Corrección |
|---|---|---|---|
| 1 | «Espacios disponibles» mostraba **0 recursos** y el mensaje «No se encontraron recursos disponibles», así que no aparecía ningún botón para reservar | `esReservable()` exigía `estado === "Activo"`, pero en MySQL `recursos.estado` guarda `Disponible` / `Ocupada` / `Mantenimiento` (el `Activo` era de los datos demo de `utils/recursos.js`). Los 14 recursos quedaban filtrados | El criterio pasa a ser `disponibilidad === "Disponible"`, excluyendo `Inactivo` y cualquier estado con «mantenimiento» |
| 2 | No existía un botón global; solo se podía abrir el modal desde la tarjeta de un recurso | La cabecera solo tenía el texto descriptivo, aunque `Reservas.css` ya definía `.reservas__new-button` sin uso | Se añadió **«Nueva reserva»** en la cabecera, disponible para todos los roles (el backend permite reservar a cualquier usuario autenticado) |
| 3 | Si la búsqueda o el filtro de tipo/fecha dejaban la lista vacía, no había forma de reservar | El modal listaba solo `disponibles` (recursos ya filtrados) | Se separó `reservables` (todos los disponibles, sin filtros) de `disponibles` (vista filtrada); el modal usa `reservables` y preselecciona el primero |
| 4 | Abrir el modal sin recurso podía enviar `recursoId: undefined` → 400 «Faltan campos requeridos» | El `<select>` comparaba por nombre y no había guarda en el envío | El `<select>` usa `id` (con opción guía), la fecha se precarga con el día actual y `handleSubmit` valida que exista recurso seleccionado |

### Verificación

| Flujo | Resultado |
|---|---|
| `GET /api/resources` con el `api.js` de la UI | 14 recursos; **11 reservables** con el criterio corregido (antes: 0) |
| `POST /api/reservations` con el payload de la UI (`id_recurso: 8`, `2026-11-02`, `09:00–10:00`, `Pendiente`) | **201**, fila con `nombre_recurso`, `usuario_nombre` y horas correctas |
| `GET /api/reservations` tras crear | La reserva aparece con recurso, usuario, fecha y horario |
| `DELETE /api/reservations/:id` (limpieza) | **204**; no quedaron datos de prueba |
| `npm run build` del frontend | OK |
| `npx eslint src/pages/Reservas/Reservas.jsx` | Sin `no-unused-vars` (se usó `cargandoReservas` para mostrar «Cargando reservas…»); quedan los avisos previos de `set-state-in-effect` y `exhaustive-deps` |

### Notas

- **El arreglo es solo de frontend**: se aplica al recargar (`Ctrl+Shift+R`), sin rebuild de Docker.
- No se tocó la base de datos: los datos de `recursos` ya eran correctos; el error estaba en el
  filtro de la vista.
- El backend ya validaba conflictos de horario (409) y horas invertidas (400); la UI mantiene su
  prevalidación local y muestra el error del servidor en el modal.
- El filtro «Hora» de la cabecera sigue sin afectar la lista (comportamiento previo, no forma parte
  de esta corrección).

### Archivos de esta iteración

- `frontend/src/pages/Reservas/Reservas.jsx`
- `frontend/src/pages/Reservas/Reservas.css`

---

## [Sin publicar] — 2026-10-28 · Iteración 8: pendientes de Reservas, Eventos, Perfil, Configuración y búsqueda

Enfoque: cerrar los pendientes que quedaban de las iteraciones anteriores, sin commit ni push.
Se corrigieron validaciones de backend, se conectaron Perfil y Configuración con la API, se activó
la búsqueda sobre Elasticsearch y se dejó el lint del frontend en cero.

### Causas encontradas y corregidas

| # | Síntoma / pendiente | Causa raíz | Corrección |
|---|---|---|---|
| 1 | El filtro **«Hora»** de Reservas no filtraba y la disponibilidad solo miraba las reservas del usuario | La vista comparaba por nombre y únicamente contra `misReservas` | `GET /api/reservations/ocupados?fecha=&hora_inicio=&hora_fin=` devuelve la ocupación de **todos** los usuarios; el frontend filtra por franjas (`HORAS_FILTRO`) y cruza horarios |
| 2 | Se podía reservar en fechas pasadas y guardar `hora_fin <= hora_inicio` | El controlador solo validaba campos obligatorios | `create` rechaza fecha pasada (400) y horas invertidas; `update` valida la fecha **solo al moverla** para no romper la cancelación de reservas históricas, y responde 409 si el nuevo horario se cruza |
| 3 | El modal permitía enviar un horario ya ocupado por otro usuario | La prevalidación usaba solo las reservas propias y comparaba por nombre | La prevalidación usa `reservasParaFormulario` (ocupación global + propias), compara por `recursoId` y se refresca tras crear/cancelar |
| 4 | Crear/editar un evento no pedía la hora de finalización | El formulario solo tenía «Hora» y el payload repetía ese valor en `horaFin` | Campo **«Hora de finalización»**, validación `horaFin > hora`, payload con `horaInicio`/`horaFin` reales, rango visible en tarjeta y detalle, botón deshabilitado si es inválido |
| 5 | **Perfil** mostraba documento, teléfono y ubicación ficticios y el botón «Editar información» no hacía nada | No existía persistencia para esos campos | Se cargan/guardan en `configuracion` con sección `perfil`; el modal valida y hace `POST` o `PUT` según exista la fila |
| 6 | **Configuración** solo guardaba en `localStorage` | No había carga ni guardado por secciones | Carga desde `configurationApi.list(user.id)`, guarda con *debounce* por sección (`create`/`update`) y aplica el tema de `apariencia`. La foto sigue en `localStorage` porque `configuracion.valor` es `TEXT` |
| 7 | El indexador de Elasticsearch nunca se ejecutaba, indexaba credenciales y no había `searchApi` | `indexer.js` solo se ejecutaba a mano y hacía `SELECT u.*`; `apiFetch` devolvía `json.data` sin respaldo | `server.js` indexa al arrancar, se excluyen `contraseña`/tokens, se ampliaron mappings (solicitudes/PQRS), `number_of_replicas: 0`, `run({ close })` reutilizable, `searchApi` y `json.data ?? json` en el frontend |
| 8 | Tres carpetas de servicios duplicadas sin uso en el compose | Restos de nombres anteriores | Eliminadas con `git rm -r`: `pqrs-service`, `info-academica-service`, `configuracion-service` (24 archivos) |
| 9 | ESLint reportaba 21 errores y el proyecto partía de 196 | `set-state-in-effect` al llamar `cargar()` en efectos, refs leídas en render, exports mezclados con componentes y variables sin usar | Carga inicial diferida al microtask con guarda de desmontaje, `useCallback` estables, hooks `useTheme`/`useToast` en archivos propios, refs eliminadas del render y variables muertas retiradas |

### Verificación

| Flujo | Resultado |
|---|---|
| `npx eslint src` (frontend) | **0 problemas** (21 → 0) |
| `npm run build` (frontend) | OK — 157 módulos, bundle 561.28 kB (aviso de tamaño > 500 kB, no bloqueante) |
| `GET /api/search?q=laboratorio` por el gateway con token demo | **200**, `total: 8` |
| `GET /api/search/suggest?q=lab` y `/api/search/indices` | OK; 6 índices con 20 usuarios, 14 recursos, 9 eventos, 6 solicitudes, 6 PQRS y 3 publicaciones |
| Controlador de reservas, invocado directo contra MySQL | `ocupados` 200; `create` fecha pasada 400; horas invertidas 400; `update` conflicto 409; `update` a fecha pasada 400; `update` sin mover fecha 200 |
| Fila temporal de conflicto | Creada y eliminada; la BD quedó sin datos de prueba |
| Controlador de configuración, invocado directo | `PUT` parcial 200, `GET` por sección 200, `DELETE` 204 |
| `POST /api/configuration` por el gateway (sección `perfil`) | **201**; la fila se eliminó al terminar |
| `git diff --check` | Sin errores |

### Notas y límites de esta verificación

- **El contenedor de `reservations-service` sigue con la imagen anterior**: `GET /api/reservations/ocupados`
  responde 404 por el `/:id` viejo. Igual pasa con `PUT /api/configuration/:id` (500 por *binds*
  `undefined`). Por eso esos dos flujos se verificaron invocando el controlador nuevo directo contra
  MySQL; el resto se probó por HTTP.
- Para activar los cambios hay que reconstruir:
  `sudo docker compose up -d --build reservations-service configuration-service search-service events-service`.
- Los índices `uajs_*` se recrearon y poblaron por HTTP directo con un script temporal
  (`/tmp/opencode/index-es.cjs`, no versionado). Tras el rebuild, `search-service` los reindexa solo
  al arrancar.
- Elasticsearch sigue con los *watermarks* ajustados a 97/98/99 % porque el disco del host está al
  94 %; si se recrea el volumen hay que volver a aplicarlos.
- La prueba en navegador real (crear reserva, editar perfil y guardar configuración) sigue siendo
  manual.

### Archivos de esta iteración

- `backend/services/reservations-service/src/controllers/reservations.controller.js`
- `backend/services/reservations-service/src/routes/reservations.routes.js`
- `backend/services/search-service/src/services/indexer.js`
- `backend/services/search-service/src/server.js`
- `backend/services/search-service/src/controllers/search.controller.js`
- `frontend/src/utils/api.js`
- `frontend/src/pages/Reservas/Reservas.jsx`
- `frontend/src/pages/Eventos/Eventos.jsx`
- `frontend/src/pages/Perfil/Perfil.jsx`
- `frontend/src/pages/Configuracion/Configuracion.jsx`
- `frontend/src/pages/Solicitudes/SolicitudDetalle.jsx`
- `frontend/src/pages/Solicitudes/Solicitudes.jsx`
- `frontend/src/pages/PQRS/PQRS.jsx`
- `frontend/src/pages/Recursos/Recursos.jsx`
- `frontend/src/pages/Notificaciones/Notificaciones.jsx`
- `frontend/src/pages/InfoAcademica/InfoAcademica.jsx`
- `frontend/src/pages/Usuarios/Usuarios.jsx`
- `frontend/src/components/TrendChart/TrendChart.jsx`
- `frontend/src/components/DonutChart/DonutChart.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/context/ThemeContext.jsx`
- `frontend/src/context/ToastContext.jsx`
- `frontend/src/context/theme-context.js`
- `frontend/src/context/toast-context.js`
- `frontend/src/context/useTheme.js`
- `frontend/src/context/useToast.js`
- `frontend/src/hooks/useApi.js`
- `frontend/src/utils/reportes.js`
- `frontend/src/utils/constants/reportes.js`

---

## [Sin publicar] — 2026-10-28 · Iteración 4: Docker, red y dependencias

Enfoque: dejar el stack reproducible en Linux y Windows, eliminar el compose legado y documentar
la instalación. **No se ejecutó `docker compose up`** en esta sesión porque el daemon requiere
`sudo` con contraseña; los pasos quedan en [docs/DOCKER-SETUP-LINUX.md](docs/DOCKER-SETUP-LINUX.md).

### Agregado

- **`.gitattributes`** en la raíz: fuerza LF (`* text=auto eol=lf`) y reglas explícitas para
  `Dockerfile*`, `dockerfile.*`, `docker-compose*.yml`, `compose*.yaml`, `*.sh`, `*.sql` y `.env*`.
- **`docs/CAMBIOS-ITERACION4.md`**: detalle técnico de esta iteración (antes/después de cada arreglo).
- **`docs/DOCKER-SETUP-LINUX.md`**: instalación en Arch, arranque del stack, red compartida y tabla
  de errores comunes con los mensajes exactos.
- **`socket.io-client@^4.8.4`** en `frontend/package.json` y `frontend/package-lock.json`.
  `RealtimeProvider.jsx` lo importaba, pero no estaba declarado: en el contenedor `npm ci` no lo
  instalaba y el frontend fallaba.

### Cambiado

- **`docker-compose.yml` (raíz)**: se agregó la red con nombre fijo
  `smart-campus-network` y se conectaron **los 15 servicios** (mysql, elasticsearch, gateway,
  11 microservicios y `frontend-dev`).
  - Motivo: los `backend/**/compose.yaml` la declaran como `external: true` y nadie la creaba.
  - Ahora el orden correcto es: primero `docker compose up -d` desde la raíz, después los
    compose individuales.
- **`docs/ARQUITECTURA.md`**: corregido "10 microservicios" → 11, documentada la red compartida,
  alineadas las variables de `.env` y los comandos (PowerShell → bash).
- **`backend/README.md`**: estructura real de carpetas, `.env` en la raíz (no en `backend/`) y
  enlaces a la documentación.
- **Finales de línea**: se normalizaron a LF 367 archivos de texto (365 versionados + `.env` y
  `frontend/.env`). No hubo cambios de contenido: `git diff --ignore-cr-at-eol` daba 0 archivos.

### Eliminado

- **`backend/docker-compose.yml`**: compose legado que no funcionaba.
  - YAML inválido por tabulaciones (error en la línea 4).
  - `requests-service` y `resources-service` declarados dos veces.
  - Montaba `./database/uajs_smart_campus.sql`, ruta que no existe (el dump real es
    `backend/uajs_smart_campus.sql`).
  - Stack incompleto y nombres legacy que el gateway ya no usa.
  - El compose de referencia es **solo** el de la raíz.

### Corregido / desbloqueado

| Síntoma | Causa | Estado |
|---|---|---|
| `docker: unknown command: docker compose` | Falta el plugin Compose v2 | Documentado; requiere instalar en el host |
| `Cannot connect to the Docker daemon...` | `docker.service` inactivo | Documentado; requiere `systemctl` con sudo |
| `permission denied ... docker.sock` | Usuario fuera del grupo `docker` | Documentado; requiere `usermod` |
| `found character '\t'` | `backend/docker-compose.yml` con tabs | **Corregido** (archivo eliminado) |
| `network smart-campus-network ... could not be found` | Ningún compose creaba la red | **Corregido** (red en el compose raíz) |
| Frontend falla dentro del contenedor | `socket.io-client` sin declarar | **Corregido** (`package.json` + lock) |
| Cientos de archivos "modificados" sin cambios reales | Working tree con CRLF y sin `.gitattributes` | **Corregido** (LF + reglas) |

### Verificado

| Comando | Resultado |
|---|---|
| `docker compose config --quiet` (raíz) | exit 0 |
| `docker compose config` (raíz) | 15 servicios en `smart-campus-network` |
| `docker compose -f backend/**/compose.yaml config --quiet` (11 archivos) | OK en todos |
| `npm run build` (frontend) | OK — 122 módulos, 572 ms |
| `npm ci --dry-run` (frontend) | `up to date` (lock consistente) |
| `node --check` (112 archivos JS del backend) | 0 errores de sintaxis |
| `git diff --check` | sin errores |

### Archivos de esta iteración

```text
 M backend/README.md
 D backend/docker-compose.yml
 M docker-compose.yml
 M docs/ARQUITECTURA.md
 M frontend/package-lock.json
 M frontend/package.json
?? .gitattributes
?? docs/CAMBIOS-ITERACION4.md
?? docs/DOCKER-SETUP-LINUX.md
?? CHANGELOG.md
```

---

## [Sin publicar] — 2026-10-28 · Correcciones de código

Enfoque: aplicar los hallazgos de la revisión estática. Todo queda **sin commit**, sobre la
rama `frontend`. La verificación es estática (sintaxis, lint, build y `compose config`):
no se pudo hacer prueba de integración porque el stack MySQL/Elasticsearch no está levantado.

### Resumen de correcciones

| # | Área | Corrección | Archivos principales |
|---|---|---|---|
| 1 | Eventos (frontend) | Estructura de llaves reparada y TDZ de `contarInscritos` eliminado | `frontend/src/pages/Eventos/Eventos.jsx` |
| 2 | Roles | IDs alineados con la tabla `roles` (1 Admin, 2 Estudiante, 3 Docente, 4 Administrativo) | `AuthContext.jsx`, `utils/users.js`, `utils/constants/roles.js`, `Login.jsx` |
| 3 | Auth (registro/login) | `usuario`/`identificacion` persistidos, bcrypt, migración transparente y rol forzado | `auth-service/.../auth.controller.js`, `middlewares/auth.js` |
| 4 | Auth (usuarios) | Contraseñas hasheadas, roles validados y mutaciones solo para Administrador | `users-service/.../users.controller.js`, `routes`, `middlewares/admin.js` |
| 5 | Gateway | JWT verificado, `x-user-*` propagado, headers del cliente eliminados, rate limit aplicado, CORS/helmet únicos | `gateway/src/app.js`, `gateway/src/middlewares/auth.js`, `package.json` |
| 6 | Servicios | `requireActor` aplicado en todas las rutas internas; guardas de administración en recursos y usuarios | `*/src/routes/*.js`, `resources-service/.../gestor.js` |
| 7 | Eventos (backend) | Inscripción/cancelación reales con `inscripciones_eventos` y participantes desde la BD | `events-service/.../events.controller.js`, `routes` |
| 8 | PQRS | `id_pqrs` autogenerado y persistencia de todos los campos | `feedback-service/.../feedback.controller.js` |
| 9 | Solicitudes | `prioridad`, `id_responsable`, `dependencia` e `historial` persistidos; filtros por usuario | `requests-service/.../requests.controller.js` |
| 10 | Reservas (frontend) | Payloads en formato frontend, `recursoId` normalizado y dependencia `recursos` | `Reservas.jsx`, `utils/api.js` |
| 11 | Reservas (backend) | Dueño = actor, filtros por usuario, validación de horario y solapamiento | `reservations-service/.../reservations.controller.js` |
| 12 | Notificaciones | Rutas `read`, `read-all` y `webhook`; emisión en tiempo real | `notifications-service` |
| 13 | Tiempo real | `initRealtime()` conectado al servidor, deps declaradas, proxy `/socket.io`, provider montado | `notifications-service`, `gateway/src/app.js`, `frontend/src/App.jsx` |
| 14 | Token del socket | `authToken` lee la sesión `uajs_session` | `frontend/src/utils/authToken.js` |
| 15 | Info académica | `estado`, programa, vigencia, destacado e imagen persistidos | `academic-info-service/.../academic-info.controller.js` |
| 16 | Eventos (catálogo) | `Deportivo`/`Institucional` y estados `Programado/Activo/Finalizado/Cancelado` alineados | `utils/eventos.js`, `Eventos.jsx`, dump SQL, migración `003` |
| 17 | Notificaciones (UI) | Filtros comparan tipos normalizados (`solicitud` → `Solicitud`, `pqrs` → `PQRS`) | `utils/api.js`, `Notificaciones.jsx` |
| 18 | Hooks | Eliminadas referencias a `servicesApi`/`reportsApi`, que no existen | `frontend/src/hooks/useSmartCampus.js` |
| 19 | Entorno | `.env.example` completo (JWT, webhook, puertos, Elasticsearch, CORS) | `.env.example` |
| 20 | Docker | Puertos internos ya no se publican al host; solo gateway, MySQL, Elasticsearch y frontend | `docker-compose.yml` |

### 1. Eventos (frontend): estructura y TDZ

- **`frontend/src/pages/Eventos/Eventos.jsx`**
  - Eliminada la llave `}` sobrante que cerraba `Eventos()` antes de tiempo (antigua línea 242).
  - Cerrado correctamente `inscribirse` con `};` (antes se "tragaba" el `return` del componente).
  - Movido `contarInscritos` **antes** de `encontrados` para eliminar el `ReferenceError` (TDZ)
    al ordenar por cupo.
  - Eliminado `cambiarEstado`, que era código muerto y generaba `no-unused-vars`.
  - Agregado `cancelarInscripcion`, que se usaba en dos botones pero **no existía**
    (`no-undef`); ahora llama a `eventsApi.unregister`.
- **`frontend/src/utils/api.js`**: agregado `eventsApi.unregister` (`DELETE /api/events/:id/register`).
- **Verificación:** `npx eslint src/pages/Eventos/Eventos.jsx` ya no reporta `no-undef` ni
  `no-unused-vars`; solo quedan las reglas de estilo `set-state-in-effect` y `exhaustive-deps`.

### 2. Roles: IDs alineados con la base de datos

Fuente de verdad (tabla `roles` y seed de `usuarios`): **1 Administrador, 2 Estudiante,
3 Docente, 4 Administrativo**. Antes el frontend tenía 2/3 invertidos y además ofrecía
cuatro roles que no existen en la BD (`Egresado`, `Funcionario`, `Proveedor`, `Visitante`).

- **`frontend/src/context/AuthContext.jsx`**: `rolMap` reducido a los 4 roles reales.
- **`frontend/src/utils/users.js`**: `ROL_IDS` reducido a los 4 roles reales.
- **`frontend/src/utils/constants/roles.js`**: dejó de duplicar definiciones; ahora
  reexporta `ROL_IDS`, `ROLES`, `permisosDeRol` y `accionesDeRol` desde `utils/users.js`.
  Se conservan `ROL_ICONO` y `ROL_CLASE` solo para los 4 roles.
- **`frontend/src/pages/Login/Login.jsx`**: la credencial demo de la cédula `1023456788`
  decía "Funcionario"; ese usuario es **Administrativo** en la BD.
- **Verificación:** `grep` de roles fantasma en `src/` solo encuentra listas de *perfil PQRS*
  (`utils/pqrs.js`), que son otro concepto y no `id_rol`.

### 3. Auth backend: registro, login y bcrypt

- **`backend/services/auth-service/src/controllers/auth.controller.js`**
  - `POST /register` ahora inserta `usuario` **y** `identificacion` (ambas `NOT NULL`).
    Antes omitía `usuario` y fallaba siempre con error 1364.
  - La contraseña se guarda con `bcrypt.hash` (10 rondas) y se valida el mínimo de 6 caracteres.
  - El autorregistro **fuerza** `id_rol = 2` y `tipo_usuario = 'Estudiante'`: ya no se acepta
    `id_rol` del cliente (escalada de privilegios).
  - Login: si la contraseña está en texto plano, se compara y **se migra a bcrypt** en ese
    mismo inicio de sesión.
  - `JWT_SECRET` es obligatorio: si falta, el servicio falla al iniciar en lugar de usar un
    secreto por defecto conocido.
  - El JWT incluye `id`, `usuario`, `rol`, `tipo_usuario` y `nombre`; el `usuario` sale de la BD,
    no del texto tecleado.
  - Duplicados (`ER_DUP_ENTRY`) devuelven 409 con mensaje claro.
- **`backend/services/auth-service/src/middlewares/auth.js`**: eliminado el fallback
  `'<secreto por defecto antiguo>'`.
- **Verificación:** `node --check` OK.

### 4. Usuarios: bcrypt, roles válidos y autorización

- **`backend/services/users-service/src/controllers/users.controller.js`**
  - `create` hashea la contraseña y valida `id_rol` contra los 4 roles reales.
  - `update` hace merge con el registro actual (no borra campos no enviados), hashea
    `password` **solo si viene**, y normaliza `id_rol`/`tipo_usuario`.
  - `create`/`update` devuelven 409 ante duplicados.
  - `getAll`/`getOne` nunca devuelven `contraseña`.
- **`backend/services/users-service/src/middlewares/admin.js`** (nuevo): exige rol
  Administrador (`1` o nombre) para crear, editar y desactivar usuarios.
- **`backend/services/users-service/package.json`**: agregado `bcrypt`.
- **Verificación:** `node --check` OK; `eslint` del frontend no cambia.

### 5. Gateway: autenticación real en el borde

- **`backend/gateway/src/middlewares/auth.js`**
  - Verifica el JWT con `jsonwebtoken` y `JWT_SECRET` (obligatorio).
  - Propaga `x-user-id`, `x-user-role`, `x-user-name` y `x-user-usuario` a los servicios.
  - **Borra siempre** los `x-user-*` que envíe el cliente (evita suplantación).
  - Allowlist pública: `POST /api/auth/login`, `POST /api/auth/register`, `GET /health`, `GET /`.
- **`backend/gateway/src/app.js`**
  - Se aplica `apiLimiter` (100 req/min) antes de los proxies; `authLimiter` (20 intentos/15 min)
    en login y registro.
  - Eliminados el CORS y el `helmet` duplicados que estaban después de los proxies.
  - Proxy WebSocket `/socket.io` → `notifications-service`, montado antes de la autenticación
    HTTP (el JWT del socket viaja en `auth.token`).
  - `x-powered-by` deshabilitado.
- **`backend/gateway/package.json`**: agregado `jsonwebtoken`.
- **Verificación:** `node --check` OK.

### 6. Servicios internos: `requireActor` y guardas

- Se aplicó `router.use(requireActor)` en las rutas de: **events, users, reservations,
  requests, resources, feedback (PQRS), academic-info, configuration y search**.
  Los servicios ya no confían en una identidad implícita.
- **`resources-service/src/middlewares/gestor.js`** (nuevo): crear/editar/eliminar recursos
  requiere Administrador o Administrativo.
- **`events-service`**: crear/editar/eliminar eventos requiere Administrador.
- **`search-service/src/middlewares/actor.js`** (nuevo): el servicio de búsqueda también exige
  identidad propagada.
- **Notificaciones**: un usuario solo puede listar y marcar sus propias notificaciones;
  el webhook usa secreto compartido y queda fuera de `requireActor`.
- **Verificación:** `node --check` sobre los 112 archivos JS del backend: OK.

### 7. Eventos (backend): inscripciones reales

- **`backend/services/events-service/src/controllers/events.controller.js`**
  - `getAll`/`getOne` adjuntan `participantes` desde `inscripciones_eventos`
    (join con `usuarios` para nombre, correo y fecha) y recalculan `inscritos`.
  - `POST /:id/register`: transacción con `SELECT ... FOR UPDATE`, valida estado
    (`Activo` o `Programado`), cupo y duplicados; inserta en `inscripciones_eventos`,
    actualiza `inscritos` y notifica al usuario.
  - `DELETE /:id/register`: cancela la inscripción del actor y recalcula `inscritos`.
  - Los eventos antiguos que solo tienen el JSON `participantes` siguen funcionando.
- **`backend/services/events-service/src/routes/events.routes.js`**: rutas de inscripción y
  cancelación con `requireActor`.
- **Frontend**: el botón "Inscrito ✓ · Cancelar" ya funciona; acepta eventos en estado
  `Programado` (los seeds usan ese estado).
- **Verificación:** `node --check` OK; build del frontend OK.

### 8. PQRS: `AUTO_INCREMENT` y campos completos

- **`backend/services/feedback-service/src/controllers/feedback.controller.js`**
  - `id_pqrs` ya **no** se envía en el `INSERT` (era `''` sobre `AUTO_INCREMENT` → error 1366).
  - Se persisten `sede`, `area`, `asunto`, `tipo_perfil`, `tipo_documento`, `identificacion`,
    `nombre`, `telefono`, `correo`, `prioridad`, `asignado_a`, `adjunto`, `historial` y
    `respuesta`.
  - `id_usuario` se toma del actor autenticado.
  - `update` hace merge con el registro actual.
- **Verificación:** `node --check` OK; los placeholders se generan desde la lista de columnas
  para evitar desajustes.

### 9. Solicitudes: campos e historial

- **`backend/services/requests-service/src/controllers/requests.controller.js`**
  - `create` persiste `prioridad`, `dependencia` e `historial` (JSON) además de los campos base.
  - `update` persiste `id_responsable`, `prioridad`, `dependencia` e `historial`; el merge evita
    borrar datos no enviados.
  - Un usuario solo ve/edita sus solicitudes; Administrador y Administrativo ven todas y pueden
    reasignar y cambiar estado.
  - `getAll`/`getOne` incluyen `responsable_nombre` mediante join.
- **Verificación:** `node --check` OK.

### 10. Reservas (frontend): payload y dependencias

- **`frontend/src/pages/Reservas/Reservas.jsx`**
  - `create` envía el formato del frontend (`recursoId`, `fecha`, `horaInicio`, `horaFin`,
    `motivo`); antes mandaba claves de backend que `denormalizeReserva` volvía a transformar
    y dejaba `id_usuario` en `null`.
  - `cancelar` reutiliza la reserva normalizada en lugar de reconstruirla a mano.
  - `useMemo` de disponibilidad y el de sugerencias ahora dependen de `recursos`.
  - `handleSubmit` ya no guarda en una variable sin usar la reserva recién creada.
- **`frontend/src/utils/api.js`**: `normalizeReserva` expone `recursoId`/`id_recurso`;
  `denormalizeReserva` acepta ambos formatos (`id_usuario` o `usuarioId`, etc.).
- **Verificación:** `npm run build` OK.

### 11. Reservas (backend): propiedad y validaciones

- **`backend/services/reservations-service/src/controllers/reservations.controller.js`**
  - El dueño de una reserva es siempre `req.actor.id`; el body no puede imponer otro usuario.
  - `getAll` filtra por usuario (Administrador/Administrativo ven todas).
  - `getOne`/`update`/`remove` verifican propiedad.
  - Un usuario solo puede **cancelar** su reserva; otros cambios de estado son de administración.
  - Valida `hora_inicio < hora_fin` y solapamiento por recurso/fecha (409).
- **Verificación:** `node --check` OK.

### 12. Notificaciones: rutas y emisión

- **`backend/services/notifications-service/src/controllers/notifications.controller.js`**
  - `markRead` (`PATCH /:id/read`) y `markAllRead` (`PATCH /read-all`), con verificación de
    propiedad y emisión de `notification:updated` / `notifications:all-read`.
  - `webhook` (`POST /webhook`): valida `x-webhook-secret`, crea la notificación y emite
    `notification:new` al usuario. Responde 503 si el secreto no está configurado.
  - `create`/`update`/`remove` también emiten eventos en tiempo real con `unreadCount`.
- **`backend/services/notifications-service/src/routes/notifications.routes.js`**: rutas nuevas;
  el webhook se declara antes de `requireActor`.
- **Verificación:** `node --check` OK.

### 13. Tiempo real: servidor, proxy y montaje

- **`backend/services/notifications-service/src/server.js`**: crea el servidor HTTP y llama a
  `initRealtime(server)` (antes `app.listen` directo y el socket nunca se inicializaba).
- **`.../src/realtime.js`**: la sala `admins` reconoce tanto el id de rol (`1`, `4`) como el
  nombre (`Administrador`, `Administrativo`); un socket sin identidad se desconecta.
- **`backend/services/notifications-service/package.json`**: agregados `socket.io` y `jsonwebtoken`.
- **`backend/gateway/src/app.js`**: proxy `/socket.io` con `ws: true`.
- **`frontend/src/App.jsx`**: `RealtimeProvider` ahora envuelve la app (antes estaba definido
  pero no se montaba, por lo que no se abría ningún socket).
- **`frontend/src/pages/Notificaciones/Notificaciones.jsx`**: recarga la lista cuando llega
  `notificaciones-actualizadas` o `smart-campus:notification`.
- **Verificación:** `node --check` OK; build OK.

### 14. Token del socket

- **`frontend/src/utils/authToken.js`**: `getToken()` lee `uajs_session.token`, que es donde
  `AuthContext` guarda la sesión. Antes leía `uajs_token`, que nunca se escribía, y el handshake
  del socket siempre fallaba por falta de token.
- **Verificación:** `grep` confirma que `getToken` es el único consumidor y que la sesión usa
  `uajs_session`.

### 15. Información académica: estado y metadatos

- **`backend/services/academic-info-service/src/controllers/academic-info.controller.js`**
  - `create`/`update` persisten `estado`, `programa`, `tipo_vigencia`, `vigencia`, `destacado`
    e `imagen` (antes "Publicar/Ocultar" no cambiaba nada).
  - `id_usuario` se toma del actor; `update` hace merge con el registro actual.
- **Verificación:** `node --check` OK.

### 16. Eventos: categorías y estados alineados

- **`frontend/src/utils/eventos.js`**: categorías ahora incluyen `Deportivo` e `Institucional`;
  estados ahora son `Programado`, `Activo`, `Finalizado`, `Cancelado`.
- **`frontend/src/pages/Eventos/Eventos.jsx`**: clases visuales para `Deportivo` y `Programado`.
- **`backend/uajs_smart_campus.sql`**: `tipo_evento` admite `Institucional`.
- **`backend/database/migrations/003_align_event_categories.sql`** (nuevo): `ALTER TABLE` para
  bases ya creadas. Sin esto, crear un evento "Institucional" falla con error 1265.
- **Verificación:** `compose config` OK; build OK.

### 17. Filtros de notificaciones

- **`frontend/src/utils/api.js`**: `normalizeNotificacion` normaliza el tipo
  (`solicitud` → `Solicitud`, `evento` → `Evento`, `pqrs` → `PQRS`).
- **`frontend/src/pages/Notificaciones/Notificaciones.jsx`**: los filtros y contadores ya
  coinciden con los datos del backend.
- **Verificación:** build OK.

### 18. Hooks sin APIs inexistentes

- **`frontend/src/hooks/useSmartCampus.js`**: eliminados `useServices`/`useReports` y sus
  imports de `servicesApi`/`reportsApi`, que no existen en `utils/api.js` y habrían roto el
  build en cuanto alguien importara el hook. Los reportes del frontend se calculan localmente
  en `utils/reportes.js`.
- **Verificación:** build OK.

### 19. `.env.example` completo

- **`.env.example`**: agregados `JWT_SECRET`, `JWT_EXPIRES`, `NOTIFICATIONS_WEBHOOK_SECRET`,
  `NOTIFICATIONS_WEBHOOK_URL`, `SEARCH_SERVICE_PORT`, `FRONTEND_URL`,
  `ELASTICSEARCH_NODE` y `ELASTICSEARCH_INDEX_PREFIX`; corregidos los nombres de puertos de
  feedback/academic-info/configuration.
- **Verificación:** comparado contra los `process.env.*` que realmente leen los servicios.

### 20. Docker: puertos internos no publicados

- **`docker-compose.yml`**: los microservicios pasan de `ports` a `expose`. Solo se publican
  al host: gateway (`3000`), MySQL (`3306`), Elasticsearch (`9200`) y frontend (`5173`).
  - Motivo: los servicios confían en `x-user-*`; con el puerto abierto se podía saltar el
    gateway y falsificar la identidad.
- **Verificación:** `/tmp/opencode/bin/docker-compose config --quiet` → exit 0; `config` muestra
  4 puertos publicados.

### Verificación de esta tanda

| Comando | Resultado |
|---|---|
| `node --check` (todos los JS del backend) | **0 errores** |
| `npm run build` (frontend) | **OK** — 153 módulos, ~650 ms |
| `npx eslint src` (frontend) | **42 problemas** (antes 196): 31 errores, 11 warnings; ya no hay `no-undef` |
| `docker-compose config --quiet` (raíz) | **OK** |

> Los 42 problemas restantes de ESLint son de estilo/reglas nuevas de React
> (`set-state-in-effect`, `exhaustive-deps`, variables sin usar en pantallas no tocadas).
> No son fallos de ejecución; quedan listados abajo como pendientes.

### Archivos tocados por las correcciones

```text
 M .env.example
 M backend/gateway/package.json
 M backend/gateway/src/app.js
 M backend/gateway/src/middlewares/auth.js
 M backend/services/academic-info-service/src/controllers/academic-info.controller.js
 M backend/services/academic-info-service/src/routes/academic-info.routes.js
 M backend/services/auth-service/src/controllers/auth.controller.js
 M backend/services/auth-service/src/middlewares/auth.js
 M backend/services/configuration-service/src/routes/configuration.routes.js
 M backend/services/events-service/src/controllers/events.controller.js
 M backend/services/events-service/src/routes/events.routes.js
 M backend/services/feedback-service/src/controllers/feedback.controller.js
 M backend/services/feedback-service/src/routes/feedback.routes.js
 M backend/services/notifications-service/package.json
 M backend/services/notifications-service/src/controllers/notifications.controller.js
 M backend/services/notifications-service/src/realtime.js
 M backend/services/notifications-service/src/routes/notifications.routes.js
 M backend/services/notifications-service/src/server.js
 M backend/services/requests-service/src/controllers/requests.controller.js
 M backend/services/requests-service/src/routes/requests.routes.js
 M backend/services/reservations-service/src/controllers/reservations.controller.js
 M backend/services/reservations-service/src/routes/reservations.routes.js
 M backend/services/resources-service/src/routes/resources.routes.js
 M backend/services/search-service/src/routes/search.routes.js
 M backend/services/users-service/package.json
 M backend/services/users-service/src/controllers/users.controller.js
 M backend/services/users-service/src/routes/users.routes.js
 M backend/uajs_smart_campus.sql
 M frontend/src/App.jsx
 M frontend/src/context/AuthContext.jsx
 M frontend/src/hooks/useSmartCampus.js
 M frontend/src/pages/Eventos/Eventos.jsx
 M frontend/src/pages/Login/Login.jsx
 M frontend/src/pages/Notificaciones/Notificaciones.jsx
 M frontend/src/pages/Reservas/Reservas.jsx
 M frontend/src/utils/api.js
 M frontend/src/utils/authToken.js
 M frontend/src/utils/constants/roles.js
 M frontend/src/utils/eventos.js
 M frontend/src/utils/users.js
?? backend/database/migrations/003_align_event_categories.sql
?? backend/services/events-service/src/middlewares/admin.js
?? backend/services/resources-service/src/middlewares/gestor.js
?? backend/services/search-service/src/middlewares/actor.js
?? backend/services/users-service/src/middlewares/admin.js
```

> El archivo `.env` no aparece porque está en `.gitignore`; sí se le agregaron
> `JWT_SECRET` y `NOTIFICATIONS_WEBHOOK_SECRET` en local.

---

## Revisión de código — estado de hallazgos

> Revisión del 2026-10-28, actualizada después de aplicar las correcciones.
> **✅ corregido** · **⚠️ parcial** · **⬜ pendiente**. La verificación combina lint/build,
> llamadas HTTP por el gateway y ejecución directa de los controladores contra MySQL; falta el
> rebuild de los contenedores con la imagen nueva (ver [Iteración 8](#sin-publicar--2026-10-28--iteración-8-pendientes-de-reservas-eventos-perfil-configuración-y-búsqueda)).

### Críticos

| # | Hallazgo | Estado |
|---|---|---|
| 1 | `Eventos.jsx`: llave de más y `inscribirse` sin cerrar | ✅ Estructura reparada; la página compila y renderiza |
| 2 | `Eventos.jsx`: TDZ de `contarInscritos` | ✅ Declarado antes de `encontrados` |
| 3 | Registro sin la columna `usuario` (`NOT NULL`) | ✅ `usuario` e `identificacion` persistidos |
| 4 | Contraseñas en texto plano | ✅ bcrypt en registro/creación; login migra hashes antiguos |
| 5 | `id_rol`/`tipo_usuario`/`estado` desde el body | ✅ Autorregistro fuerza Estudiante; usuarios solo Admin; roles validados |
| 6 | Gateway no verificaba el JWT ni propagaba identidad | ✅ Verifica JWT, propaga `x-user-*` y borra los del cliente |
| 7 | IDs de rol invertidos y roles inexistentes | ✅ 4 roles reales; `constants/roles.js` reexporta la fuente única |
| 8 | PQRS insertaba `''` en `id_pqrs` | ✅ `AUTO_INCREMENT` respetado |
| 9 | Reservas: payload de backend re-dendenormalizado | ✅ Payload en formato frontend; normalización expone `recursoId` |
| 10 | `useMemo` sin dependencia `recursos` | ✅ Dependencia agregada |
| 11 | `authToken` leía `uajs_token` | ✅ Lee `uajs_session.token` |
| 12 | Faltaban endpoints de inscripción y notificaciones | ✅ `register`/`unregister`, `read`, `read-all` y `webhook` implementados |

### Altos

| # | Hallazgo | Estado |
|---|---|---|
| 13 | `JWT_SECRET` con fallback conocido | ✅ Obligatorio; el servicio falla al iniciar sin secreto |
| 14 | `apiLimiter` sin aplicar; CORS/helmet duplicados | ✅ Limiter global + limiter de auth; duplicados eliminados |
| 15 | `users.update` permitía escalada y no guardaba password | ✅ Merge, bcrypt y `requireAdmin` en mutaciones |
| 16 | Realtime sin deps, sin init y sin proxy | ✅ `socket.io`/`jsonwebtoken` declarados, `initRealtime()` conectado, proxy `/socket.io` |
| 17 | `academic-info` ignoraba `estado` | ✅ Persiste estado y metadatos |
| 18 | PQRS perdía campos | ✅ Persiste todos los campos del formulario |
| 19 | Solicitudes ignoraban prioridad/responsable/dependencia | ✅ Persistidos; historial JSON soportado |
| 20 | Eventos no usaban `inscripciones_eventos` | ✅ Inscripción/cancelación transaccionales y `inscritos` recalculado |
| 21 | Filtros de notificaciones no coincidían | ✅ Tipos normalizados |
| 22 | Categorías/estados de eventos desalineados | ✅ `Deportivo`/`Institucional` + estados; migración `003` |
| 23 | `useSmartCampus` importaba APIs inexistentes | ✅ Referencias eliminadas |

### Medios

| Hallazgo | Estado |
|---|---|
| JWT firmaba la `identificacion` tecleada | ✅ Firma `usuario` e `id` reales |
| Crear/editar evento sin `hora_fin` viola `NOT NULL` | ✅ Formulario pide inicio y fin, valida el orden y envía ambos valores |
| Reservas: sin validar fechas pasadas | ✅ Fecha pasada rechazada en `create` y al mover en `update`; horas invertidas y conflictos 409. «Cupo» no aplica: `reservas` no tiene esa columna |
| `search-service`: el indexador nunca se ejecuta y no hay `searchApi` | ✅ Autoindexado al arrancar, mappings ampliados y `searchApi` en el frontend |
| Perfil y Configuración no persistían en la API | ✅ Sección `perfil` en `configuracion` y guardado por secciones con *debounce* |
| El filtro «Hora» de Reservas no afectaba la lista | ✅ Franjas horarias + `GET /api/reservations/ocupados` |
| Healthcheck de Elasticsearch con `curl` | ⬜ Verificar en la imagen 8.14 |
| `hooks/useApi.js`: `setState` en efectos y deps con spread | ✅ Carga inicial con guarda de desmontaje y dependencias serializadas |
| `NuevaPQRS.jsx:179` espera `numero.id` y la API devuelve `id_pqrs` | ✅ Corregido: usa `id_pqrs ?? id` |
| Rate limit global de 100 req/min agotaba la SPA y devolvía 429 | ✅ Elevado a 600 req/min (login sigue en 20/15 min) |
| `PUT` parciales en `configuration`, `resources`, `events` y `notifications` devolvían 500 por *binds* `undefined` | ✅ Actualización parcial fusionada con la fila actual |
| Editar solicitudes/reservas desde la UI devolvía 500 por enviar fecha ISO completa a columnas `DATE` | ✅ `fechaCorta()` en el frontend y `fechaDia()` en `requests-service`/`reservations-service` |
| Crear solicitudes guardaba `estado` mixto y perdía el servicio; el historial no se actualizaba y la segunda acción llamaba a `/api/requests/undefined` | ✅ Estado normalizado, servicio resuelto por nombre, historial en backend y respuestas de mutación normalizadas |
| Reservas no mostraba recursos ni permitía crearlas desde la UI (`estado` de la BD distinto de `Activo`) | ✅ Filtro basado en `disponibilidad`, botón global «Nueva reserva» y modal con todos los recursos reservables |
| `.env.example` incompleto | ✅ Variables y nombres de puertos corregidos |
| ESLint: 196 problemas | ✅ **0 problemas** en `npx eslint src` |

### Pendientes conocidos (no bloquean el arranque)

- **Rebuild pendiente en el host** (requiere `sudo`, el agente no está en el grupo `docker`):
  `sudo docker compose up -d --build reservations-service configuration-service search-service events-service`.
  Hasta entonces, el contenedor de reservas responde 404 en `/ocupados` y el de configuración
  responde 500 en `PUT` parcial.
- La prueba en navegador real (crear reserva, editar perfil y guardar configuración) sigue siendo
  manual; la verificación automática fue por HTTP más los controladores invocados directo.
- Elasticsearch quedó con *watermarks* en 97/98/99 % por el disco del host al 94 %; si se recrea el
  volumen hay que volver a aplicarlos o liberar espacio.
- El `docker-compose.yml` ya no publica los puertos internos; si alguien probaba un servicio
  directamente contra `localhost:300X`, debe pasar por el gateway (`localhost:3000`).

### Lo que sí está bien

- Las consultas del backend usan placeholders `?`: **no se encontró inyección SQL**.
- Los 112 archivos JS del backend pasan `node --check`.
- El compose raíz y los 11 `compose.yaml` individuales validan.
- El frontend compila (`npm run build`).
- El gateway ya es el único punto de entrada HTTP y valida el JWT.

---

## Historial resumido

| Iteración | Tema | Documento |
|---|---|---|
| 2 | Rediseño visual del panel, módulos y roles | [docs/CAMBIOS-ITERACION2.md](docs/CAMBIOS-ITERACION2.md) |
| 3 | Arranque Docker del frontend, login real y búsqueda | [docs/CAMBIOS-ITERACION3.md](docs/CAMBIOS-ITERACION3.md) |
| 4 | Docker, red compartida, LF y `socket.io-client` | [docs/CAMBIOS-ITERACION4.md](docs/CAMBIOS-ITERACION4.md) |
| 5 | Integración UI ↔ backend y corrección de errores 500 | [CHANGELOG.md](CHANGELOG.md) |
| 6 | Módulo Solicitudes: estados, servicio e historial | [CHANGELOG.md](CHANGELOG.md) |
| 7 | Módulo Reservas: creación de reservas desde la UI | [CHANGELOG.md](CHANGELOG.md) |
| 8 | Pendientes: validaciones, Perfil, Configuración, búsqueda y lint | [CHANGELOG.md](CHANGELOG.md) |

Documentación de referencia:

- [Arquitectura](docs/ARQUITECTURA.md)
- [Docker en Linux](docs/DOCKER-SETUP-LINUX.md)
- [Documentación funcional](docs/DOCUMENTACION.md)
- [Backend](backend/README.md)

---

## Cómo levantar el proyecto

### 1. Requisitos (Linux)

```bash
sudo pacman -S --needed docker-compose docker-buildx
sudo systemctl enable --now docker.service
sudo usermod -aG docker "$USER"
newgrp docker               # o cerrar sesión y volver a entrar
docker run --rm hello-world # prueba real
```

### 2. Arranque

```bash
cp .env.example .env        # completar JWT_SECRET y NOTIFICATIONS_WEBHOOK_SECRET
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs -f gateway
```

Frontend: <http://localhost:5173> · API: <http://localhost:3000>

> La primera vez, MySQL ejecuta `backend/uajs_smart_campus.sql` solo si el volumen
> `mysql_data` está vacío. Si la base quedó a medias: `docker compose down -v` y volver a subir.

### 3. Windows

Docker Desktop ya incluye Compose v2. Antes de clonar/editar:

```powershell
git config --global core.autocrlf false
```

Sin eso, Git vuelve a meter CRLF y aparecen cientos de archivos "modificados" que no tienen
cambios reales. Para comprobarlo: `git diff --ignore-cr-at-eol --name-only` debe salir vacío.

---

## Convenciones del equipo

- Usar siempre `docker compose` (v2), nunca `docker-compose` (v1), y levantar desde la raíz.
- No crear ni revivir un compose dentro de `backend/`: la única fuente de verdad es
  `docker-compose.yml` de la raíz.
- El `.env` vive en la raíz y no se versiona; `.env.example` es la plantilla.
- Los compose individuales de `backend/**/compose.yaml` se usan **después** de levantar la raíz.
- Antes de pedir revisión: `docker compose config --quiet`, `npm run build` (frontend) y
  `node --check` sobre los archivos JS tocados.
