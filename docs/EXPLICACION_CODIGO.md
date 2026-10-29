# Explicación comentada del código - UAJS Smart Campus

> Este archivo explica las partes más importantes del frontend sin modificar el código original.

---

## 1. `frontend/src/App.jsx` — Punto de entrada principal

```jsx
// Importamos las rutas de la aplicación
import AppRoutes from "./routes/AppRoutes";
// Importamos el proveedor de autenticación (envuelve toda la app)
import AuthProvider from "./context/AuthContext";

function App() {
  return (
    // AuthProvider hace disponible el estado de usuario en toda la app
    <AuthProvider>
      {/* AppRoutes contiene todas las rutas de React Router */}
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
```

**Qué hace:** Es el componente raíz. Solo se encarga de envolver toda la aplicación en el `AuthProvider` para que cualquier componente pueda acceder al usuario autenticado.

---

## 2. `frontend/src/context/auth-context.js` — Creación del Context

```jsx
// Creamos el contexto de React para compartir el estado de autenticación
import { createContext } from "react";

// AuthContext será el "contenedor" global del usuario
export const AuthContext = createContext(null);
```

**Qué hace:** Crea el contexto que permitirá pasar información de autenticación (usuario, login, logout, permisos) a todos los componentes sin necesidad de props.

---

## 3. `frontend/src/context/useAuth.js` — Hook personalizado

```jsx
import { useContext } from "react";
import { AuthContext } from "./auth-context";

// Hook auxiliar para consumir el AuthContext de forma segura
function useAuth() {
  const context = useContext(AuthContext);

  // Si alguien usa useAuth() fuera de <AuthProvider>, lanza error claro
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }

  // Devuelve { user, login, logout, tienePermiso, puede }
  return context;
}

export default useAuth;
```

**Qué hace:** Es un hook auxiliar que evita escribir `useContext(AuthContext)` en cada componente. También valida que se use dentro del proveedor correcto.

---

## 4. `frontend/src/context/AuthContext.jsx` — Lógica de autenticación

```jsx
import { useState } from "react";
import { AuthContext } from "./auth-context";
import { obtenerUsuarios, permisosDeRol, accionesDeRol } from "../utils/users";

const SESSION_KEY = "uajs_session";

// Recupera la sesión guardada en localStorage al recargar la página
function getSession() {
  try {
    const guardada = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return guardada && guardada.usuario ? guardada : null;
  } catch {
    return null;
  }
}

function AuthProvider({ children }) {
  // Estado local del usuario (se carga desde localStorage)
  const [user, setUser] = useState(getSession);

  // Intenta iniciar sesión con usuario y contraseña
  const login = (usuario, password) => {
    const lista = obtenerUsuarios(); // usuarios mock
    const encontrado = lista.find(
      (item) =>
        item.usuario === usuario &&
        item.password === password &&
        item.estado === "Activo"
    );

    if (!encontrado) {
      return { ok: false, mensaje: "Usuario o contraseña incorrectos." };
    }

    // Crea el objeto de sesión (sin password por seguridad)
    const sesion = {
      id: encontrado.id,
      usuario: encontrado.usuario,
      nombre: encontrado.nombre,
      correo: encontrado.correo,
      rol: encontrado.rol,
      programa: encontrado.programa
    };

    setUser(sesion);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));

    return { ok: true };
  };

  // Cierra sesión y limpia el estado
  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // Verifica si el usuario tiene un permiso específico
  const tienePermiso = (permiso) => {
    if (!user) return false;
    return permisosDeRol(user.rol).includes(permiso);
  };

  // Verifica si el usuario puede ejecutar una acción CRUD
  const puede = (accion) => {
    if (!user) return false;
    return accionesDeRol(user.rol).includes(accion);
  };

  // Provee toda la lógica de auth a la app
  return (
    <AuthContext.Provider value={{ user, login, logout, tienePermiso, puede }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
```

**Qué hace:**
- Guarda el usuario en `localStorage` para persistencia entre recargas.
- `login`: valida credenciales contra usuarios mock, guarda sesión.
- `logout`: limpia sesión y estado.
- `tienePermiso`: controla acceso a rutas/módulos según el rol.
- `puede`: controla acciones CRUD (crear, editar, eliminar) por rol.

---

## 5. `frontend/src/routes/AppRoutes.jsx` — Definición de rutas

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

// Importamos todas las páginas de la aplicación
import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login";
import Recuperar from "../pages/Recuperar/Recuperar";
import Servicio from "../pages/Servicio/Servicio";
import Dashboard from "../pages/Dashboard/Dashboard";
import Solicitudes from "../pages/Solicitudes/Solicitudes";
import SolicitudDetalle from "../pages/Solicitudes/SolicitudDetalle";
import Reservas from "../pages/Reservas/Reservas";
import Recursos from "../pages/Recursos/Recursos";
import Eventos from "../pages/Eventos/Eventos";
import Notificaciones from "../pages/Notificaciones/Notificaciones";
import Perfil from "../pages/Perfil/Perfil";
import Configuracion from "../pages/Configuracion/Configuracion";
import PQRS from "../pages/PQRS/PQRS";
import NuevaPQRS from "../pages/PQRS/NuevaPQRS/NuevaPQRS";
import Usuarios from "../pages/Usuarios/Usuarios";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (no requieren sesión) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<Recuperar />} />

        {/* Layout protegido: Sidebar + Navbar + contenido */}
        <Route element={<DashboardLayout />}>
          {/* Cada ruta interna se protege con ProtectedRoute */}
          <Route path="/dashboard" element={
            <ProtectedRoute permiso="dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/solicitudes" element={
            <ProtectedRoute permiso="solicitudes">
              <Solicitudes />
            </ProtectedRoute>
          } />
          {/* ... resto de rutas protegidas ... */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
```

**Qué hace:**
- Define todas las rutas de la app.
- Rutas públicas: Landing, Login, Recuperar contraseña.
- Rutas protegidas: están dentro de `DashboardLayout` y envueltas en `ProtectedRoute`.
- `ProtectedRoute` verifica si el usuario tiene sesión y el permiso necesario.

---

## 6. `frontend/src/components/ProtectedRoute/ProtectedRoute.jsx` — Guardián de rutas

```jsx
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../context/useAuth";

function ProtectedRoute({ children, permiso }) {
  const { user, tienePermiso } = useAuth();
  const location = useLocation();

  // Si no hay usuario, redirige al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay permiso requerido y el usuario no lo tiene, redirige al dashboard
  if (permiso && !tienePermiso(permiso)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si todo está bien, renderiza el contenido protegido
  return children;
}

export default ProtectedRoute;
```

**Qué hace:**
- Si no hay sesión → redirige a `/login`.
- Si falta permiso → redirige a `/dashboard`.
- Si tiene permiso → muestra la página normalmente.

---

## 7. `frontend/src/layouts/DashboardLayout.jsx` — Esqueleto del panel

```jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";
import "./DashboardLayout.css";

function DashboardLayout() {
  // Estado para colapsar/expandir el sidebar
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={collapsed ? "app app--collapsed" : "app"}>
      {/* Sidebar con el menú de navegación */}
      <Sidebar collapsed={collapsed} />

      <div className="app__main">
        {/* Navbar superior con tema, notificaciones, perfil */}
        <Navbar onToggle={() => setCollapsed(!collapsed)} />

        {/* Outlet: aquí se renderiza la página activa */}
        <main className="app__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
```

**Qué hace:**
- Es el layout base de todas las páginas protegidas.
- Contiene el `Sidebar` (menú lateral) y el `Navbar` (barra superior).
- `<Outlet />` es el punto donde React Router inyecta la página actual.
- El sidebar se puede colapsar con el botón del Navbar.

---

## 8. `frontend/src/layouts/DashboardLayout.css` — Estilos del layout

```css
/* Contenedor principal de la app */
.app {
  min-height: 100vh;
  background-color: var(--color-bg); /* variable de tema (claro/oscuro) */
  transition: background-color 0.3s ease;
}

/* Área de contenido a la derecha del sidebar */
.app__main {
  margin-left: 250px; /* ancho del sidebar expandido */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

/* Cuando el sidebar está colapsado */
.app--collapsed .app__main {
  margin-left: 70px; /* ancho del sidebar colapsado */
}

/* Zona donde se renderiza la página (<Outlet>) */
.app__content {
  flex: 1;
  padding: 24px;
  box-sizing: border-box;
}

/* Responsive: en móviles el sidebar siempre es angosto */
@media (max-width: 768px) {
  .app__main {
    margin-left: 70px;
  }

  .app__content {
    padding: 16px;
  }
}
```

**Qué hace:**
- Define la estructura visual: sidebar fijo + contenido desplazado.
- Usa variables CSS (`var(--color-bg)`) para soportar tema claro/oscuro.
- Transiciones suaves al colapsar/expandir el sidebar.

---

## 9. `frontend/src/components/Sidebar/Sidebar.jsx` — Menú lateral

```jsx
import { NavLink } from "react-router-dom";
import menuSections from "../../utils/menu";
import useAuth from "../../context/useAuth";

function Sidebar({ collapsed }) {
  const { tienePermiso } = useAuth();

  // Filtra las secciones del menú según los permisos del usuario
  const seccionesVisibles = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permiso || tienePermiso(item.permiso)
      )
    }))
    .filter((section) => section.items.length > 0);

  const classes = collapsed ? "sidebar sidebar--collapsed" : "sidebar";

  return (
    <nav className={classes}>
      {/* Marca de la universidad */}
      <div className="sidebar__brand">
        <span className="sidebar__logo">U</span>
        <h2 className="sidebar__title">UAJS Smart Campus</h2>
      </div>

      {/* Secciones e items del menú */}
      <div className="sidebar__menu">
        {seccionesVisibles.map((section) => (
          <div className="sidebar__section" key={section.label}>
            <span className="sidebar__section-label">{section.label}</span>

            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar__item sidebar__item--active"
                    : "sidebar__item"
                }
              >
                <span className="sidebar__icon">{item.icon}</span>
                <span className="sidebar__item-name">{item.name}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Pie del sidebar con la versión */}
      <footer className="sidebar__footer">
        <span className="sidebar__version">UAJS Smart Campus v0.1</span>
      </footer>
    </nav>
  );
}

export default Sidebar;
```

**Qué hace:**
- Lee la configuración del menú desde `menu.js`.
- Filtra los items visibles según `tienePermiso()` del usuario actual.
- Usa `NavLink` de React Router para resaltar la página activa.
- Recibe `collapsed` para mostrar versión angosta del menú.

---

## 10. `frontend/src/components/Navbar/Navbar.jsx` — Barra superior

```jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import notificaciones from "../../utils/notificaciones";
import { getModuleName } from "../../utils/menu";
import useAuth from "../../context/useAuth";

const THEME_KEY = "uajs_theme";

// Obtiene el tema guardado o detecta la preferencia del sistema
function getInitialTheme() {
  try {
    const guardado = localStorage.getItem(THEME_KEY);
    if (guardado === "dark" || guardado === "light") {
      return guardado;
    }
  } catch {
    // ignorar errores de localStorage
  }

  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // ignorar
  }

  return "light";
}

function Navbar({ onToggle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Nombre del módulo actual para mostrar en el título
  const moduleName = getModuleName(location.pathname);
  // Cantidad de notificaciones no leídas
  const noLeidas = notificaciones.filter((item) => !item.leida).length;

  // Aplica el tema al documento y lo guarda
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Alterna entre tema claro y oscuro
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Cierra el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cierra sesión y navega al login
  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar__left">
        {/* Botón para colapsar/expandir el sidebar */}
        <button className="navbar__menu" onClick={onToggle} aria-label="Alternar menú">
          ☰
        </button>
        {/* Título dinámico del módulo actual */}
        <h1 className="navbar__title">{moduleName}</h1>
      </div>

      <div className="navbar__right">
        {/* Botón de cambio de tema */}
        <button className="navbar__theme" onClick={toggleTheme} aria-label="Cambiar tema">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* Icono de notificaciones con badge de no leídas */}
        <Link to="/notificaciones" className="navbar__notification">
          🔔
          {noLeidas > 0 && (
            <span className="navbar__badge">{noLeidas}</span>
          )}
        </Link>

        {/* Perfil de usuario con dropdown */}
        <div className="navbar__profile" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
          <div className="navbar__avatar">
            {user?.nombre?.charAt(0) ?? "U"}
          </div>

          <div className="navbar__user">
            <span className="navbar__name">{user?.nombre}</span>
            <span className="navbar__role">{user?.rol}</span>
          </div>

          <button className="navbar__dropdown" aria-label="Opciones de perfil">▾</button>

          {/* Menú desplegable del perfil */}
          {dropdownOpen && (
            <div className="navbar__menu-dropdown">
              <div className="navbar__dropdown-user">
                <strong>{user?.nombre}</strong>
                <span>{user?.correo}</span>
              </div>

              <Link to="/perfil" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                👤 Ver perfil
              </Link>

              <Link to="/configuracion" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                ⚙️ Configuración
              </Link>

              <button className="navbar__dropdown-item navbar__dropdown-item--logout" onClick={handleLogout}>
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
```

**Qué hace:**
- Muestra el nombre del módulo actual en el título.
- Controla el tema (claro/oscuro) y lo guarda en `localStorage`.
- Muestra notificaciones no leídas con un badge numérico.
- Muestra el avatar y nombre del usuario, con dropdown para perfil, configuración y logout.
- Cierra el dropdown al hacer clic fuera.

---

## 11. `frontend/src/components/Modal/Modal.jsx` — Modal reutilizable

```jsx
import "./Modal.css";

// Componente genérico de modal
// Props: isOpen (booleano), title (string), onClose (función), children (contenido)
function Modal({ isOpen, title, onClose, children }) {
  // Si no está abierto, no renderiza nada
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal" onClick={onClose}>
      {/* Detiene la propagación para no cerrar al hacer clic dentro */}
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
```

**Qué hace:**
- Renderiza una ventana emergente cuando `isOpen` es `true`.
- Al hacer clic en el fondo (`modal`) se ejecuta `onClose` (cierra el modal).
- Al hacer clic dentro del contenido (`modal__content`) no se cierra gracias a `stopPropagation()`.
- Recibe `title` y `children` para personalizar el contenido.

---

## 12. `frontend/src/hooks/useSearch.js` — Búsqueda en listas

```jsx
import { useMemo } from "react";

// Hook para filtrar listas en tiempo real
// items: array de objetos a filtrar
// query: texto de búsqueda
// fields: campos en los que buscar (ej: ["nombre", "correo"])
function useSearch(items, query, fields = []) {
  const normalized = query.trim().toLowerCase();

  // Memoriza los resultados para no recalcular en cada render
  const results = useMemo(() => {
    if (!normalized) {
      return items; // sin búsqueda, devuelve todo
    }

    // Filtra los items que coincidan en al menos uno de los campos
    return items.filter((item) =>
      fields.some((field) =>
        String(item[field] ?? "").toLowerCase().includes(normalized)
      )
    );
  }, [items, normalized, fields]);

  return results;
}

export default useSearch;
```

**Qué hace:**
- Toma una lista y un texto de búsqueda.
- Filtra los elementos que coincidan en los campos indicados.
- Usa `useMemo` para optimizar: solo recalcula cuando cambian la lista o la búsqueda.

---

## 13. `frontend/src/utils/menu.js` — Configuración centralizada del menú

```jsx
// Define todas las secciones e items del menú lateral
const menuSections = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: "📊", permiso: "dashboard" }
    ]
  },
  {
    label: "Gestión",
    items: [
      { name: "Solicitudes", path: "/solicitudes", icon: "📋", permiso: "solicitudes" },
      { name: "Reservas", path: "/reservas", icon: "📅", permiso: "reservas" },
      // ... más items
    ]
  },
  // ... más secciones
];

// Traduce rutas a nombres legibles para el título del Navbar
export function getModuleName(pathname) {
  if (pathname === "/pqrs/nueva") return "Nueva PQRS";
  if (pathname === "/usuarios") return "Gestión de usuarios";
  if (pathname.startsWith("/solicitudes/")) return "Detalle de solicitud";
  if (pathname.startsWith("/servicio/")) return "Servicio";

  // Busca coincidencia exacta en el menú
  const flat = menuSections.flatMap((section) => section.items);
  const match = flat.find((item) => item.path === pathname);
  return match ? match.name : "UAJS Smart Campus";
}

export default menuSections;
```

**Qué hace:**
- Centraliza la configuración del menú en un solo archivo.
- Cada item tiene `name`, `path`, `icon` y `permiso`.
- `getModuleName()` convierte rutas en títulos amigables para el Navbar.
- El Sidebar filtra los items según los permisos del usuario autenticado.

---

## Resumen de la arquitectura

```
App.jsx
 └── AuthProvider (contexto global de usuario)
      └── AppRoutes (rutas de React Router)
           ├── Landing / Login / Recuperar (públicas)
           └── DashboardLayout (layout protegido)
                ├── Sidebar (menú filtrado por permisos)
                ├── Navbar (tema, notificaciones, perfil)
                └── <Outlet /> (página actual)
                     └── ProtectedRoute (guardián de acceso)
                          └── Página del módulo (Dashboard, Solicitudes, etc.)
```

**Flujo de autenticación:**
1. Usuario ingresa credenciales en `Login`.
2. `AuthContext.login()` valida contra usuarios mock.
3. Sesión guardada en `localStorage`.
4. `ProtectedRoute` verifica sesión y permisos en cada navegación.
5. `Sidebar` filtra los módulos visibles según el rol.
6. `useAuth()` disponible en cualquier componente para lógica adicional.

**Roles y permisos:**
- Definidos en `utils/users.js` (mock).
- `tienePermiso("dashboard")` → acceso a rutas.
- `puede("crear")` / `puede("editar")` → acceso a botones/acciones CRUD.

---

*Archivo generado para documentación. No modifica el código fuente.*
