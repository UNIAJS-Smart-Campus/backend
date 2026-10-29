# Registro de cambios — Frontend UniAJS

> Fecha: 21 de agosto de 2026
> Rama: `develop` (último commit: `2f64e8f`)
> Estado: build y lint sin errores. **Sin push ni commit** (pendiente de aprobación).

---

## 1. Resumen

Rediseño integral de la capa visual y de los listados del frontend:

- Rebranding a **UniAJS** con paleta corporativa **100 % en tonos azules**.
- Modo oscuro accesible desde el menú del perfil.
- Búsqueda estandarizada con botón **Buscar** en todos los módulos.
- Listados migrados a **tablas densas + paginación** (escalables a grandes volúmenes).
- Nuevo módulo de **Reportes** y página **404**.
- Limpieza de CSS muerto y corrección de badges de roles.

---

## 2. Identidad visual

| Antes | Ahora |
|---|---|
| "UAJS Smart Campus" | **UniAJS** |
| Acento dorado/amarillo | Azul corporativo (`#2e6fb7` claro / `#5aa2e0` oscuro) |
| Inter + Playfair Display | Solo **Inter** (`--font-heading: var(--font-body)`) |
| Gradientes y sombras grandes | Diseño plano, sombras/radios reducidos |

- Archivos afectados: `index.html` (título, meta, favicon), `src/utils/menu.js`, `Sidebar.jsx`, `Login.jsx`, `Recuperar.jsx`, `Landing.jsx`, `Dashboard.jsx`, `Navbar.jsx`.
- Favicon nuevo (`public/favicon.svg`): cuadrado navy redondeado con "U" blanca (reemplaza al icono de Vite).
- Landing y Login usan tokens (`var(--color-bg)` / `var(--color-text)`): fondo claro corporativo, tarjetas sólidas **sin `backdrop-filter`** (causaba contenido invisible según GPU).

## 3. Modo oscuro

- El botón suelto del header se eliminó; el toggle vive dentro del **menú desplegable del perfil** del Navbar, entre "Configuración" y "Cerrar sesión".
- El menú permanece abierto al cambiar el tema.
- Preferencia persistida en `localStorage` (`uajs_theme`) con script anti-parpadeo en `index.html`.

## 4. Búsqueda con botón Buscar

Nuevo componente reutilizable:

```
src/components/SearchBar/SearchBar.jsx
src/components/SearchBar/SearchBar.css
```

- `<form role="search">` con `Input type="search"` + `Button variant="primary"` "Buscar".
- Enviar con Enter o clic; `preventDefault` para no recargar.

Integrado en 8 módulos: Dashboard, Solicitudes, Reservas, Recursos, Eventos, Notificaciones, PQRS y Usuarios (Usuarios lo estrenó en esta iteración).

## 5. Tablas escalables (DataTable + Pagination)

Reemplazo de las tarjetas apiladas por tablas densas profesionales:

| Archivo | Descripción |
|---|---|
| `src/components/DataTable/DataTable.jsx/.css` | Encabezado sticky en mayúsculas, filas cebra, hover sutil, columna fuerte opcional (`strong`), celda de acciones, scroll horizontal, mensaje de vacío. |
| `src/components/Pagination/Pagination.jsx/.css` | Botones « ‹ 1 2 … n › » con elipsis + texto "X–Y de Z registros". Retorna `null` si hay una sola página. |
| `src/hooks/usePagination.js` | 10 registros por página; clamp interno sin efectos (compatible con `react-hooks/set-state-in-effect`). |

Con un millón de registros solo se renderizan 10 filas por página: el DOM nunca se satura.

### Módulos migrados

| Módulo | Columnas destacadas |
|---|---|
| Solicitudes | Número, Tipo, Servicio, Fecha, Estado (badge), Solicitante, Acciones (Ver detalle / Avanzar si `puedeAvanzar`) |
| Recursos | Código, Nombre, Tipo, Capacidad, Ubicación, Estado, Disponibilidad |
| Reservas | Catálogo: Recurso, Tipo, Capacidad, Ubicación, Disponibilidad, Acción **Reservar** (deshabilitada si ocupado). "Mis reservas" sigue como bloque de lista aparte. |
| Eventos | Evento, Categoría (badge), Fecha, Hora, Lugar |
| PQRS | Número, Tipo, Estado (badge), Fecha, Descripción |
| Usuarios | Usuario, Nombre, Correo, Rol (badge), Estado, Acciones (Editar / Activar–Desactivar) |
| Notificaciones | Feed paginado conservando íconos y acciones por ítem |

En todos los casos la página se reinicia a la 1 al cambiar búsqueda o filtros.

## 6. Nuevo módulo Reportes (`/reportes`)

```
src/pages/Reportes/Reportes.jsx + .css
src/utils/reportes.js
```

- KPIs generales (solicitudes totales, abiertas, recursos disponibles, eventos próximos) calculados desde `utils/reportes.js`.
- Cuatro gráficas de barras en CSS puro: solicitudes por estado, por servicio, recursos por tipo y eventos por categoría.
- Botón **Imprimir** (`window.print()`) y fecha de generación.
- Permiso nuevo `reportes` asignado a **Administrador** y **Administrativo** (`src/utils/users.js`).
- Ítem 📈 Reportes en el menú (sección Gestión) y ruta protegida en `AppRoutes.jsx`.

## 7. Página 404

```
src/pages/NotFound/NotFound.jsx + .css
```

Ruta catch-all `path="*"` en `AppRoutes.jsx`: cualquier URL inexistente muestra la página de error con botón de regreso.

## 8. Limpieza y correcciones

- CSS muerto eliminado tras la migración a tablas (−5.9 kB compilados, 52.2 → 46.3 kB):
  - Solicitudes: `__card/__list/__numero/__tipo/__descripcion/__meta/__actions/__empty`
  - Recursos y Usuarios: `__table/__row/__cell` + reglas responsive asociadas
  - Eventos y Reservas: grids/tarjetas antiguas (se conservan los badges `__categoria`, `__disponible/__ocupado` que usa DataTable)
  - PQRS: `__list/__card/__numero/__fecha` etc.
  - Notificaciones: sin clases muertas.
- **Corrección de bug**: los badges de rol en `Usuarios.css` seguían estilizados como `--funcionario/--profesor`; ahora existen `--administrativo` y `--docente`, acordes a los roles de la sección 7.

## 9. Verificación

```powershell
cd frontend
npm run build   # ✓ 97 módulos, sin errores
npm run lint    # ✓ sin errores
```

## 10. Pendiente sugerido

1. Persistencia en `localStorage` de los registros creados (Solicitudes, Reservas, Eventos, Recursos hoy se pierden al recargar).
2. Toasts/snackbars de confirmación para acciones (crear, avanzar, eliminar).
3. Commit de este lote en `develop`.
