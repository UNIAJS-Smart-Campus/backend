# Rediseño UI, Arquitectura CSS BEM e Identidad UAJS — Smart Campus

## Resumen

Se realizó una modernización completa del diseño visual alineada a la identidad institucional de la **Corporación Universitaria Antonio José de Sucre (UAJS)**, con metodología **BEM**, sistema de **design tokens**, componentes modulares y páginas coherentes. El resultado es un frontend más mantenible, escalable y con una estética contemporánea que refleja los valores de la universidad.

---

## Cambios en el Diseño Visual

### Paleta de Colores
- **Azul institucional UAJS**: Azul oscuro profesional como primario (`#0f2744`, `#1d4b77`, `#4a80b0`)
- **Blanco institucional**: Paleta de blancos para fondos y acentos (`#ffffff`, `#f5f8fb`, `#e8eef5`)
- **Fondos institucionales**: Landing y login con gradientes azul-blanco (`#0a1e35` + blanco)
- **Grises mejorados**: Contraste optimizado para mejor legibilidad
- **Modo oscuro completo**: Tokens dark con azules profundos y blancos rotos coherentes

### Tipografía
- **Escala fluida**: Uso de `clamp()` para títulos responsivos
- **Jerarquía clara**: 6 niveles de headings con line-heights optimizados
- **Cuerpo de texto**: Inter con line-height 1.6 para lectura cómoda

### Espaciado y Layout
- **Sistema de espacios**: Variables desde 4px hasta 64px (`--space-1` a `--space-16`)
- **Grids consistentes**: Patrones de grid reutilizables en todas las páginas
- **Cards modernizadas**: Sombras en capas, bordes sutiles, hover states mejorados

### Efectos y Micro-interacciones
- **Sombras en capas**: Sistema de 5 niveles (`--shadow-xs` a `--shadow-xl`)
- **Transiciones suaves**: Durations y easing functions estandarizadas
- **Hover states**: Elevación, cambio de color y transformaciones consistentes
- **Focus rings**: Anillos de foco dorados para accesibilidad

### Formularios
- **Inputs mejorados**: Bordes más gruesos, focus states con glow dorado
- **Estados visuales**: Error (rojo), éxito (verde), required indicator
- **Selects estilizados**: Flecha SVG personalizada, focus states consistentes
- **Textareas**: Resize vertical, mejor padding y tipografía

### Adaptación Institucional UAJS
- **Sidebar**: Gradiente azul institucional `#0a1e35` → `#0f2744`
- **Landing/Login**: Gradientes de fondo azul-blanco con overlay sutil
- **Identidad visual coherente**: Azul como color primario, blanco como acento
- **Respeto por marca**: No se alteraron logos ni tipografía institucional

---

## Arquitectura CSS Mejorada

### Estructura de Carpetas

```
src/styles/
├── abstracts/           # Design tokens y patrones
│   ├── _variables.css   # Variables CSS custom properties
│   ├── _mixins.css      # Patrones reutilizables
│   ├── _functions.css   # Utilidades CSS
│   └── _animations.css  # Keyframes y animaciones
├── base/                # Estilos base
│   ├── _reset.css       # Reset moderno
│   ├── _typography.css  # Tipografía base
│   └── _base.css        # Estilos base del body
└── utils/               # Utilidades atómicas
    ├── _helpers.css     # Helpers de texto, truncate, visually-hidden
    ├── _spacing.css     # Margin y padding utilities
    └── _layout.css      # Container, grid, flex utilities
```

### Bloques BEM Globales (`styles/blocks/`)

Componentes atómicos reutilizables en toda la aplicación:
- **Button**: 6 variantes (primary, secondary, accent, outline, ghost, danger), 5 tamaños
- **Card**: Base para cards con variantes (interactive, elevated, flat, bordered)
- **Input**: Con label, estados, toggle password, hints y mensajes de error
- **Badge**: Estados de color con dot indicator
- **Alert**: 4 variantes (info, success, warning, danger) con iconos
- **Modal**: Overlay, content, header, body, footer con animaciones
- **Table**: Wrapper, rows, cells, variantes (striped, bordered, compact)
- **Dropdown**: Menu con items, divisores, variantes de alineación
- **Nav**: Navegación horizontal/vertical, variantes pills
- **Tabs**: Horizontal/vertical, variantes pills
- **Pagination**: Items, active, disabled, ellipsis
- **Accordion**: Items con trigger, panel, icon rotativo
- **Breadcrumb**: Navegación de migas con separadores

### Componentes de Dominio (`styles/components/`)

Componentes específicos de la aplicación:
- **SearchBar**: Input con icono de búsqueda y botón clear
- **Sidebar**: Navegación lateral con colapso, secciones y footer
- **Navbar**: Header con notificaciones, tema, perfil y dropdown
- **ServiceCard**: Card de servicio con icono, categoría y link
- **RequestItem**: Item de solicitud con meta y acciones
- **ReservationCard**: Card de reserva con estado y disponibilidad
- **Notification**: Item de notificación con icono, timestamp y acciones
- **EventCard**: Card de evento con imagen, fecha, ubicación
- **DashboardWidget**: Widget de métricas con icono y trend
- **ProfileCard**: Card de perfil de usuario
- **RequestDetail**: Vista detallada de solicitud con timeline
- **ActivityItem**: Item de actividad con icono y timestamp
- **ResourceItem**: Item de recurso con estado y meta

### Páginas (`styles/pages/`)

Estilos específicos por página, todos siguiendo BEM:
- **Landing**: Hero con gradientes, grid de servicios y perfiles
- **Login**: Auth card con formulario, validaciones y credenciales
- **Dashboard**: Indicadores, búsqueda y grid de servicios
- **Services**: Grid de servicios con cards
- **Requests**: Filtros, cards de solicitudes y modal de creación
- **Reservations**: Filtros por tipo, grid de recursos, mis reservas
- **Events**: Grid de eventos con cards
- **Notifications**: Lista de notificaciones con estados
- **Profile**: Info de usuario con avatar y campos

---

## Mejoras de Código

### Variables CSS (`_variables.css`)
```css
/* Design tokens centralizados - Identidad UAJS azul/blanco */
--color-primary: #0f2744;
--color-primary-600: #14304d;
--color-primary-500: #1d4b77;
--color-accent: #ffffff;
--radius: 12px;
--shadow-md: 0 4px 12px rgba(15, 39, 68, 0.08);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--space-4: 16px;
--sidebar-width: 260px;
```

### Utilidades Atómicas
- **Texto**: `.text-center`, `.font-heading`, `.truncate`, `.line-clamp-2`
- **Espaciado**: `.m-4`, `.mt-6`, `.px-4`, `.gap-3`
- **Layout**: `.container`, `.grid`, `.flex`, `.items-center`, `.justify-between`
- **Efectos**: `.hover-lift`, `.transition-colors`, `.rounded`, `.shadow-md`

### Componentes Mejorados

#### Button
- 6 variantes con sombras y hover states
- 5 tamaños (xs, sm, md, lg, xl)
- Estados disabled y loading
- Elementos internos: `__icon`, `__spinner`

#### Input
- Estados: normal, focus, error, success, disabled
- Toggle de contraseña con iconos SVG
- Labels con indicador required
- Mensajes de hint y error

#### Sidebar
- Colapso animado con transiciones
- Secciones con labels
- Active states con borde dorado
- Scrollbar personalizado

#### Modal
- Animaciones de entrada (fade-in, scale-in)
- Backdrop con click-outside
- Variantes de tamaño (sm, default)
- Header, body, footer

---

## Archivos Modificados

### Configuración Global
- `src/index.css` → Ahora importa `styles/main.css` centralizado

### Abstracts
- `src/styles/abstracts/_variables.css` → Sistema completo de design tokens
- `src/styles/abstracts/_mixins.css` → Patrones reutilizables
- `src/styles/abstracts/_functions.css` → Utilidades CSS
- `src/styles/abstracts/_animations.css` → Keyframes para animaciones

### Base
- `src/styles/base/_reset.css` → Reset moderno y completo
- `src/styles/base/_typography.css` → Escala tipográfica fluida
- `src/styles/base/_base.css` → Estilos base del body

### Utils
- `src/styles/utils/_helpers.css` → Helpers de texto y accesibilidad
- `src/styles/utils/_spacing.css` → Sistema de espaciado
- `src/styles/utils/_layout.css` → Container, grid, flex utilities

### Bloques BEM
- `src/styles/blocks/_button.css` → Botones mejorados
- `src/styles/blocks/_card.css` → Cards con variantes
- `src/styles/blocks/_input.css` → Inputs mejorados
- `src/styles/blocks/_badge.css` → Badges con dot
- `src/styles/blocks/_alert.css` → Alertas con iconos
- `src/styles/blocks/_modal.css` → Modal mejorado
- `src/styles/blocks/_table.css` → Tabla con variantes
- `src/styles/blocks/_dropdown.css` → Dropdown mejorado
- `src/styles/blocks/_nav.css` → Navegación mejorada
- `src/styles/blocks/_tabs.css` → Tabs con variantes
- `src/styles/blocks/_pagination.css` → Paginación mejorada
- `src/styles/blocks/_accordion.css` → Accordion mejorado
- `src/styles/blocks/_breadcrumb.css` → Breadcrumb mejorado

### Componentes
- `src/components/Button/Button.css` → Actualizado a BEM + tokens
- `src/components/Input/Input.css` → Mejorado con estados
- `src/components/Navbar/Navbar.css` → Rediseñado con tokens
- `src/components/Sidebar/Sidebar.css` → Mejorado con colapso suave
- `src/components/Modal/Modal.css` → Actualizado con animaciones
- `src/components/StatusBadge/StatusBadge.css` → Refactorizado
- `src/components/ServiceCard/ServiceCard.css` → Mejorado

### Layout
- `src/layouts/DashboardLayout.css` → Actualizado con tokens

### Adaptación UAJS (azul/blanco)
- `src/styles/abstracts/_variables.css` → Paleta azul/blanco institucional
- `src/components/Sidebar/Sidebar.css` → Gradiente azul UAJS
- `src/pages/Landing/Landing.css` → Gradiente azul-blanco
- `src/pages/Login/Login.css` → Gradiente azul-blanco

### Páginas
- `src/pages/Landing/Landing.css` → Rediseñada
- `src/pages/Login/Login.css` → Rediseñada
- `src/pages/Dashboard/Dashboard.css` → Mejorada
- `src/pages/Servicio/Servicio.css` → Actualizada
- `src/pages/Solicitudes/Solicitudes.css` → Mejorada
- `src/pages/Reservas/Reservas.css` → Actualizada
- `src/pages/Eventos/Eventos.css` → Mejorada
- `src/pages/Recursos/Recursos.css` → Actualizada
- `src/pages/Perfil/Perfil.css` → Mejorada
- `src/pages/Configuracion/Configuracion.css` → Actualizada
- `src/pages/PQRS/PQRS.css` → Mejorada
- `src/pages/PQRS/NuevaPQRS/NuevaPQRS.css` → Actualizada
- `src/pages/Notificaciones/Notificaciones.css` → Mejorada
- `src/pages/Solicitudes/SolicitudDetalle.css` → Actualizada
- `src/pages/Usuarios/Usuarios.css` → Mejorada

---

## Verificación

### Build
```bash
npm run build
<<<<<<< HEAD
# ✓ built in 253ms
# dist/assets/index-DOYpRpn4.css   75.41 kB │ gzip: 10.48 kB
# dist/assets/index-Cty8YXat.js   295.53 kB │ gzip: 87.71 kB
=======
# ✓ built in 240ms
# dist/assets/index-Ed_eldHU.css   75.40 kB │ gzip: 10.44 kB
# dist/assets/index-Di9HPSSY.js   295.53 kB │ gzip: 87.71 kB
>>>>>>> main
```

### Lint
```bash
npm run lint
# ✓ ESLint: 0 errores, 0 warnings
```

### Commits
```bash
<<<<<<< HEAD
# 1. Rediseño UI y arquitectura CSS BEM
# 2. Adaptación a identidad institucional UAJS
=======
# 1. refactor: rediseño UI y arquitectura CSS BEM
# 2. feat: adaptar diseño a identidad institucional UAJS
# 3. docs: actualizar registro de rediseño con identidad UAJS
# 4. fix: adaptar paleta UAJS a azul y blanco
>>>>>>> main
```

---

## Beneficios

1. **Mantenibilidad**: Tokens centralizados, cambios globales en un solo lugar
2. **Escalabilidad**: Componentes BEM modulares y reutilizables
3. **Consistencia**: Sistema de diseño unificado en toda la aplicación
4. **Performance**: CSS optimizado, gzip: 10.47kB
5. **Accesibilidad**: Focus rings, contraste mejorado, estados visuales claros
6. **Responsive**: Breakpoints consistentes y adaptación móvil
7. **Modo oscuro**: Soporte completo con transiciones suaves
8. **DX**: Estructura clara, fácil de navegar y extender

---

## Próximos Pasos Sugeridos

- [ ] Migrar componentes restantes a BEM completo
- [ ] Agregar tests de visual regression
- [ ] Implementar Storybook para documentación de componentes
- [ ] Agregar soporte para temas personalizados
- [ ] Optimizar bundle con CSS splitting
- [ ] Agregar skeleton loaders con animaciones shimmer