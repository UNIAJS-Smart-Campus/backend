# Usuarios del Sistema UAJS Smart Campus

## Credenciales de Acceso

| ID | Identificación | Usuario | Contraseña | Nombre | Apellido | Rol | Programa/Área | Email |
|----|----------------|---------|------------|--------|----------|-----|---------------|-------|
| 1 | 1023456789 | admin | admin123 | Natalia | Rodríguez | Administrador | - | natalia.rodriguez@uajs.edu.co |
| 2 | 1023456788 | funcionario | func123 | Carlos | Méndez | Administrativo | Bienestar Universitario | carlos.mendez@uajs.edu.co |
| 3 | 1023456787 | profesor | prof123 | Laura | Gómez | Docente | Matemáticas | laura.gomez@uajs.edu.co |
| 4 | 1023456786 | estudiante | est123 | Andrés | Torres | Estudiante | Ingeniería de Sistemas | andres.torres@uajs.edu.co |
| 5 | 1023456785 | lucia.paredes | prof123 | Lucía | Paredes | Docente | Ingeniería de Sistemas | lucia.paredes@uajs.edu.co |
| 6 | 1023456784 | andres.ruiz | est123 | Andrés | Ruiz | Estudiante | Ingeniería de Sistemas | andres.ruiz@uajs.edu.co |
| 7 | 1023456783 | maria.torres | est123 | María | Torres | Estudiante | Ingeniería de Sistemas | maria.torres@uajs.edu.co |
| 8 | 1023456782 | jorge.salazar | est123 | Jorge | Salazar | Estudiante | Ingeniería de Sistemas | jorge.salazar@uajs.edu.co |

---

## Nuevos Usuarios (Carga Masiva)

### Estudiantes (8) - Contraseña: `est123`
| ID | Identificación | Usuario | Nombre | Apellido | Programa | Email |
|----|----------------|---------|--------|----------|----------|-------|
| 35 | 1023456781 | estudiante1 | Carlos | García | Ingeniería de Sistemas | carlos.garcia@uajs.edu.co |
| 36 | 1023456780 | estudiante2 | María | López | Ingeniería Electrónica | maria.lopez@uajs.edu.co |
| 37 | 1023456779 | estudiante3 | Juan | Martínez | Ingeniería Industrial | juan.martinez@uajs.edu.co |
| 38 | 1023456778 | estudiante4 | Ana | González | Administración de Empresas | ana.gonzalez@uajs.edu.co |
| 39 | 1023456777 | estudiante5 | Pedro | Sánchez | Contaduría Pública | pedro.sanchez@uajs.edu.co |
| 40 | 1023456776 | estudiante6 | Laura | Fernández | Derecho | laura.fernandez@uajs.edu.co |
| 41 | 1023456775 | estudiante7 | Diego | Ramírez | Psicología | diego.ramirez@uajs.edu.co |
| 42 | 1023456774 | estudiante8 | Sofía | Torres | Enfermería | sofia.torres@uajs.edu.co |

---

### Docentes (5) - Contraseña: `doc123`
| ID | Identificación | Usuario | Nombre | Apellido | Programa | Email |
|----|----------------|---------|--------|----------|----------|-------|
| 43 | 1023456773 | docente1 | Roberto | Castro | Matemáticas | roberto.castro@uajs.edu.co |
| 44 | 1023456772 | docente2 | Carmen | Vargas | Física | carmen.vargas@uajs.edu.co |
| 45 | 1023456771 | docente3 | Alberto | Rojas | Química | alberto.rojas@uajs.edu.co |
| 46 | 1023456770 | docente4 | Patricia | Mendoza | Biología | patricia.mendoza@uajs.edu.co |
| 47 | 1023456769 | docente5 | Fernando | Guerrero | Programación | fernando.guerrero@uajs.edu.co |

---

### Administrativos (2) - Contraseña: `adm123`
| ID | Identificación | Usuario | Nombre | Apellido | Área | Email |
|----|----------------|---------|--------|----------|------|-------|
| 48 | 1023456768 | admin1 | Gloria | Jiménez | Bienestar Universitario | gloria.jimenez@uajs.edu.co |
| 49 | 1023456767 | admin2 | Ricardo | Moreno | Admisiones | ricardo.moreno@uajs.edu.co |

---

### Funcionarios (3) - Contraseña: `fun123` (Rol: Administrativo)
| ID | Identificación | Usuario | Nombre | Apellido | Área | Email |
|----|----------------|---------|--------|----------|------|-------|
| 50 | 1023456766 | func1 | Oscar | Herrera | Mantenimiento | oscar.herrera@uajs.edu.co |
| 51 | 1023456765 | func2 | Diana | Castillo | Biblioteca | diana.castillo@uajs.edu.co |
| 52 | 1023456764 | func3 | Javier | Ortiz | Tecnología | javier.ortiz@uajs.edu.co |

---

## Resumen por Roles

| Rol | Cantidad | Usuarios |
|-----|----------|----------|
| Administrador | 1 | admin |
| Administrativo | 7 | funcionario, admin1, admin2, func1, func2, func3 (+ 1 original) |
| Docente | 6 | profesor, lucia.paredes, docente1-5 |
| Estudiante | 12 | estudiante, andres.ruiz, maria.torres, jorge.salazar, estudiante1-8 |

**Total: 26 usuarios**

---

## Endpoints de Prueba

```bash
# Login Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identificacion":"1023456789","password":"admin123"}'

# Login Estudiante
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identificacion":"1023456781","password":"est123"}'

# Login Docente
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identificacion":"1023456773","password":"doc123"}'

# Login Administrativo
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identificacion":"1023456768","password":"adm123"}'

# Login Funcionario
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identificacion":"1023456766","password":"fun123"}'
```

---

## Roles y Permisos

| Rol | ID | Permisos Principales |
|-----|----|----------------------|
| Administrador | 1 | Acceso total: usuarios, solicitudes, reservas, recursos, eventos, notificaciones, PQRS, reportes, configuración, info_académica, gestión PQRS |
| Administrativo | 4 | Dashboard, solicitudes, reservas, recursos, eventos, notificaciones, PQRS, perfil, reportes, configuración, info_académica, gestión PQRS |
| Docente | 3 | Dashboard, solicitudes, reservas, recursos, eventos, notificaciones, PQRS, perfil, reportes, info_académica |
| Estudiante | 2 | Dashboard, solicitudes, reservas, recursos, eventos, notificaciones, PQRS, perfil, info_académica |

---

*Generado automáticamente - UAJS Smart Campus*