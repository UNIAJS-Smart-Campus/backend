const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.MOCK_PORT || 3000;

// ==========================================
// DATOS SINTÉTICOS
// ==========================================

const USERS = [
  { id: 1, usuario: "admin", password: "admin123", nombre: "Natalia Rodríguez", correo: "natalia.rodriguez@uajs.edu.co", rol: "Administrador", programa: "Dirección Académica", estado: "Activo", cargo: "Coordinadora general", campus: "Campus principal" },
  { id: 2, usuario: "funcionario", password: "func123", nombre: "Carlos Méndez", correo: "carlos.mendez@uajs.edu.co", rol: "Administrativo", programa: "Bienestar Universitario", estado: "Activo", cargo: "Analista de servicios", campus: "Campus Norte" },
  { id: 3, usuario: "profesor", password: "prof123", nombre: "Laura Gómez", correo: "laura.gomez@uajs.edu.co", rol: "Docente", programa: "Matemáticas", estado: "Activo", cargo: "Docente titular", campus: "Campus central" },
  { id: 4, usuario: "estudiante", password: "est123", nombre: "Andrés Torres", correo: "andres.torres@uajs.edu.co", rol: "Estudiante", programa: "Ingeniería de Sistemas", estado: "Activo", cargo: "Estudiante", campus: "Campus central" },
  { id: 5, usuario: "docente2", password: "doc123", nombre: "María Fernanda Cárdenas", correo: "mf.cardenas@uajs.edu.co", rol: "Docente", programa: "Ingeniería de Software", estado: "Activo", cargo: "Profesora de proyectos", campus: "Campus principal" },
  { id: 6, usuario: "estudiante2", password: "stu123", nombre: "Valentina Morales", correo: "valentina.morales@uajs.edu.co", rol: "Estudiante", programa: "Administración de Empresas", estado: "Activo", cargo: "Estudiante", campus: "Campus occidente" },
  { id: 7, usuario: "admin2", password: "ua123", nombre: "Javier Álvarez", correo: "javier.alvarez@uajs.edu.co", rol: "Administrador", programa: "Tecnología e innovación", estado: "Activo", cargo: "Director de operación", campus: "Campus principal" },
  { id: 8, usuario: "admvo", password: "adm123", nombre: "Sofía Jiménez", correo: "sofia.jimenez@uajs.edu.co", rol: "Administrativo", programa: "Servicios estudiantiles", estado: "Inactivo", cargo: "Coordinadora administrativa", campus: "Campus centro" }
];

const ROLES = [
  { nombre: "Administrador", permisos: ["dashboard","usuarios","solicitudes","reservas","recursos","eventos","notificaciones","pqrs","reportes","perfil","configuracion","info_academica"], acciones: ["registrar_solicitudes","consultar_solicitudes","gestionar_solicitudes","actualizar_estados","realizar_reservas","gestionar_reservas","solicitar_recursos","administrar_recursos","publicar_eventos","consultar_estadisticas","administrar_usuarios","administrar_roles","gestionar_servicios","gestionar_configuracion","supervisar","publicar_info_academica"] },
  { nombre: "Administrativo", permisos: ["dashboard","solicitudes","reservas","recursos","eventos","notificaciones","pqrs","perfil","reportes","configuracion"], acciones: ["consultar_solicitudes","gestionar_solicitudes","actualizar_estados","gestionar_reservas","administrar_recursos","atender_requerimientos","generar_reportes"] },
  { nombre: "Docente", permisos: ["dashboard","solicitudes","reservas","recursos","eventos","notificaciones","pqrs","perfil","info_academica","configuracion"], acciones: ["consultar_solicitudes","realizar_reservas","gestionar_reservas","solicitar_recursos","publicar_info_academica","consultar_info_academica"] },
  { nombre: "Estudiante", permisos: ["dashboard","solicitudes","reservas","recursos","eventos","notificaciones","pqrs","perfil","info_academica","configuracion"], acciones: ["registrar_solicitudes","consultar_solicitudes","realizar_reservas","solicitar_recursos","consultar_info_academica"] }
];

const SOLICITUDES = [
  { id: "SOL-2026-001", tipo: "Reserva de auditorio", servicio: "Reservas", fecha: "2026-09-01", estado: "En proceso", solicitante: "Natalia Rodríguez", descripcion: "Reserva del auditorio principal para la cátedra de inteligencia artificial aplicada.", prioridad: "Alta", historial: [{ estado: "Registrada", fecha: "2026-09-01", detalle: "Solicitud registrada por la estudiante." },{ estado: "En revisión", fecha: "2026-09-01", detalle: "Verificación de disponibilidad y logística del espacio." },{ estado: "Asignada", fecha: "2026-09-02", detalle: "Auditorio principal asignado para la actividad." },{ estado: "En proceso", fecha: "2026-09-03", detalle: "Se está confirmando la agenda y recursos audiovisuales." }] },
  { id: "SOL-2026-002", tipo: "Constancia académica", servicio: "Solicitudes", fecha: "2026-09-02", estado: "Registrada", solicitante: "Carlos Méndez", descripcion: "Solicitud de constancia de notas para trámites administrativos del semestre actual.", prioridad: "Media", historial: [{ estado: "Registrada", fecha: "2026-09-02", detalle: "Solicitud enviada por el estudiante." }] },
  { id: "SOL-2026-003", tipo: "Reserva de laboratorio", servicio: "Reservas", fecha: "2026-09-04", estado: "Resuelta", solicitante: "Lucía Paredes", descripcion: "Uso del laboratorio de informática 3 para práctica de redes y configuración básica.", prioridad: "Media", historial: [{ estado: "Registrada", fecha: "2026-09-04", detalle: "Solicitud registrada por la docente." },{ estado: "En revisión", fecha: "2026-09-04", detalle: "Verificación de disponibilidad del laboratorio." },{ estado: "Asignada", fecha: "2026-09-05", detalle: "Laboratorio asignado para la práctica." },{ estado: "En proceso", fecha: "2026-09-06", detalle: "Sesión ejecutada con equipos activos." },{ estado: "Resuelta", fecha: "2026-09-07", detalle: "Reserva cerrada sin incidencias." }] },
  { id: "SOL-2026-004", tipo: "Inscripción a evento", servicio: "Eventos", fecha: "2026-09-05", estado: "En revisión", solicitante: "Andrés Ruiz", descripcion: "Inscripción al taller de emprendimiento y liderazgo del programa académico.", prioridad: "Baja", historial: [{ estado: "Registrada", fecha: "2026-09-05", detalle: "Solicitud registrada por el estudiante." },{ estado: "En revisión", fecha: "2026-09-06", detalle: "Validación de cupos y requisitos del taller." }] },
  { id: "SOL-2026-005", tipo: "Soporte técnico", servicio: "PQRS", fecha: "2026-09-06", estado: "Asignada", solicitante: "María Torres", descripcion: "Reporte de fallas en los equipos del laboratorio de sistemas y conexión a red.", prioridad: "Alta", historial: [{ estado: "Registrada", fecha: "2026-09-06", detalle: "PQRS registrada por la estudiante." },{ estado: "En revisión", fecha: "2026-09-06", detalle: "Caso asignado a soporte tecnológico." },{ estado: "Asignada", fecha: "2026-09-07", detalle: "Técnico responsable definido para la revisión." }] },
  { id: "SOL-2026-006", tipo: "Préstamo de equipos", servicio: "Recursos", fecha: "2026-09-08", estado: "Cerrada", solicitante: "Jorge Salazar", descripcion: "Préstamo de dos proyectores para la feria de empleabilidad y actividades de ingreso.", prioridad: "Media", historial: [{ estado: "Registrada", fecha: "2026-09-08", detalle: "Solicitud registrada por el estudiante." },{ estado: "En revisión", fecha: "2026-09-08", detalle: "Verificación de disponibilidad de equipos." },{ estado: "Asignada", fecha: "2026-09-09", detalle: "Dos equipos asignados al evento." },{ estado: "En proceso", fecha: "2026-09-10", detalle: "Entrega finalizada para la actividad." },{ estado: "Resuelta", fecha: "2026-09-12", detalle: "Equipos devueltos y revisados." },{ estado: "Cerrada", fecha: "2026-09-13", detalle: "Solicitud cerrada por el sistema." }] }
];

const EVENTOS = [
  { id: 1, nombre: "Cátedra de inteligencia artificial aplicada", fecha: "2026-09-08", hora: "09:30", lugar: "Auditorio principal", categoria: "Académico", descripcion: "Jornada académica con expertos en IA aplicada, innovación y transformación digital.", estado: "Activo", cupo: 150, inscritos: 118, ponente: "Dra. Ana María López", modalidad: "Presencial" },
  { id: 2, nombre: "Taller de emprendimiento y liderazgo", fecha: "2026-09-15", hora: "14:00", lugar: "Salón 205", categoria: "Formación", descripcion: "Sesión práctica para desarrollar modelos de negocio, pitch y trabajo en equipo.", estado: "Activo", cupo: 45, inscritos: 36, ponente: "Daniel Ruiz", modalidad: "Híbrido" },
  { id: 3, nombre: "Ciclo de cine y cultura universitaria", fecha: "2026-09-18", hora: "18:00", lugar: "Auditorio B", categoria: "Cultural", descripcion: "Proyección, conversación y análisis del papel de la cultura en la vida universitaria.", estado: "Activo", cupo: 90, inscritos: 58, ponente: "Colectivo cultural UAJS", modalidad: "Presencial" },
  { id: 4, nombre: "Feria de empleabilidad 2026", fecha: "2026-09-22", hora: "08:30", lugar: "Patio central", categoria: "Institucional", descripcion: "Encuentro con empresas, programas de prácticas y oportunidades de empleo para estudiantes.", estado: "Activo", cupo: 220, inscritos: 187, ponente: "Vicerrectoría de bienestar y empleabilidad", modalidad: "Presencial" },
  { id: 5, nombre: "Seminario de investigación aplicada", fecha: "2026-09-29", hora: "15:00", lugar: "Laboratorio de innovación", categoria: "Académico", descripcion: "Presentación de proyectos de investigación y resultados de trabajo de grado.", estado: "Activo", cupo: 60, inscritos: 49, ponente: "Dra. Carolina Ruiz", modalidad: "Virtual" },
  { id: 6, nombre: "Semana de bienestar y salud mental", fecha: "2026-10-05", hora: "10:00", lugar: "Campus principal", categoria: "Cultural", descripcion: "Actividades de acompañamiento, sensibilización y bienestar para la comunidad universitaria.", estado: "Activo", cupo: 180, inscritos: 142, ponente: "Bienestar institucional", modalidad: "Híbrido" }
];

const NOTIFICACIONES = [
  { id: 1, tipo: "Solicitud", icono: "solicitudes", mensaje: "Tu solicitud SOL-2026-001 cambió a 'En proceso' para la reserva del auditorio principal.", fecha: "2026-09-03", leida: false },
  { id: 2, tipo: "Reserva", icono: "reservas", mensaje: "La reserva del laboratorio de informática 3 quedó confirmada para el 6 de septiembre.", fecha: "2026-09-05", leida: false },
  { id: 3, tipo: "Evento", icono: "eventos", mensaje: "Nuevo evento: Cátedra de inteligencia artificial aplicada, abierta a toda la comunidad.", fecha: "2026-09-06", leida: true },
  { id: 4, tipo: "PQRS", icono: "pqrs", mensaje: "Tu caso de soporte técnico fue asignado al equipo de infraestructura tecnológica.", fecha: "2026-09-07", leida: false },
  { id: 5, tipo: "Reserva", icono: "reservas", mensaje: "Recordatorio: la reserva del salón 205 vence mañana y requiere confirmación final.", fecha: "2026-09-08", leida: true },
  { id: 6, tipo: "Evento", icono: "eventos", mensaje: "Publicación: Feria de empleabilidad 2026 con empresas y oportunidades de práctica.", fecha: "2026-09-09", leida: true }
];

const PQRS = [
  { id: "PQRS-2026-014", tipo: "Queja", fecha: "2026-09-01", estado: "En revisión", solicitante: "Andrés Torres", descripcion: "Queja por la demora en la atención del servicio de certificados y constancias académicas.", prioridad: "Alta", asignadoA: "", respuesta: "", historial: [{ estado: "Registrada", fecha: "2026-09-01", detalle: "PQRS registrada por el estudiante." }, { estado: "En revisión", fecha: "2026-09-02", detalle: "Caso en revisión por la coordinación académica." }] },
  { id: "PQRS-2026-013", tipo: "Petición", fecha: "2026-08-28", estado: "Resuelta", solicitante: "Valentina Morales", descripcion: "Solicitud de información sobre el proceso de homologación de asignaturas y requisitos.", prioridad: "Media", asignadoA: "Natalia Rodríguez", respuesta: "Se envío el procedimiento actualizado de homologaciones al correo institucional.", historial: [{ estado: "Registrada", fecha: "2026-08-28", detalle: "Petición registrada por la estudiante." }, { estado: "En revisión", fecha: "2026-08-29", detalle: "Verificación documental." }, { estado: "Asignada", fecha: "2026-08-30", detalle: "Asignada a la coordinación académica." }, { estado: "En proceso", fecha: "2026-08-31", detalle: "Elaboración de respuesta." }, { estado: "Resuelta", fecha: "2026-09-01", detalle: "Respuesta enviada al solicitante." }] },
  { id: "PQRS-2026-012", tipo: "Sugerencia", fecha: "2026-08-24", estado: "Cerrada", solicitante: "Laura Gómez", descripcion: "Sugerencia para ampliar los horarios de atención de la biblioteca y laboratorio de cómputo.", prioridad: "Baja", asignadoA: "Carlos Méndez", respuesta: "Se evaluó la sugerencia y se amplió el horario en dos horas.", historial: [{ estado: "Registrada", fecha: "2026-08-24", detalle: "Sugerencia registrada." }, { estado: "En revisión", fecha: "2026-08-25", detalle: "Análisis de viabilidad." }, { estado: "Asignada", fecha: "2026-08-26", detalle: "Asignada a bienestar universitario." }, { estado: "En proceso", fecha: "2026-08-28", detalle: "Coordinación de horarios." }, { estado: "Resuelta", fecha: "2026-08-30", detalle: "Cambio implementado." }, { estado: "Cerrada", fecha: "2026-08-31", detalle: "Caso cerrado por el sistema." }] },
  { id: "PQRS-2026-011", tipo: "Reclamo", fecha: "2026-08-18", estado: "Asignada", solicitante: "María Fernanda Cárdenas", descripcion: "Reclamo por las fallas de red y acceso a internet en el laboratorio de redes.", prioridad: "Alta", asignadoA: "Javier Álvarez", respuesta: "", historial: [{ estado: "Registrada", fecha: "2026-08-18", detalle: "Reclamo registrado por la docente." }, { estado: "En revisión", fecha: "2026-08-18", detalle: "Validación con soporte tecnológico." }, { estado: "Asignada", fecha: "2026-08-19", detalle: "Asignada al equipo de infraestructura." }] },
  { id: "PQRS-2026-010", tipo: "Petición", fecha: "2026-08-14", estado: "En revisión", solicitante: "Carlos Méndez", descripcion: "Solicitud de apoyo para programación de horarios de prácticas y tutorías académicas.", prioridad: "Media", asignadoA: "", respuesta: "", historial: [{ estado: "Registrada", fecha: "2026-08-14", detalle: "Petición registrada." }, { estado: "En revisión", fecha: "2026-08-15", detalle: "Análisis de cupos disponibles." }] }
];

const RECURSOS = [
  { id: "R-001", codigo: "REC-101", nombre: "Salón 101", tipo: "Salas", capacidad: 40, ubicacion: "Bloque A · Piso 1", estado: "Activo", disponibilidad: "Disponible" },
  { id: "R-002", codigo: "REC-205", nombre: "Salón 205", tipo: "Salas", capacidad: 30, ubicacion: "Bloque A · Piso 2", estado: "Activo", disponibilidad: "En uso" },
  { id: "R-003", codigo: "REC-LAB1", nombre: "Laboratorio de informática 1", tipo: "Laboratorios", capacidad: 25, ubicacion: "Bloque B · Piso 1", estado: "Activo", disponibilidad: "Disponible" },
  { id: "R-004", codigo: "REC-LABQ", nombre: "Laboratorio de química", tipo: "Laboratorios", capacidad: 20, ubicacion: "Bloque B · Piso 2", estado: "En mantenimiento", disponibilidad: "No disponible" },
  { id: "R-005", codigo: "REC-AUD1", nombre: "Auditorio principal", tipo: "Auditorios", capacidad: 300, ubicacion: "Bloque C", estado: "Activo", disponibilidad: "Disponible" },
  { id: "R-006", codigo: "REC-AUD2", nombre: "Auditorio B", tipo: "Auditorios", capacidad: 120, ubicacion: "Bloque C · Piso 2", estado: "Activo", disponibilidad: "En uso" },
  { id: "R-007", codigo: "REC-EQ1", nombre: "Video proyector Epson 4K", tipo: "Equipos", capacidad: 1, ubicacion: "Bodega de tecnología", estado: "Activo", disponibilidad: "Disponible" },
  { id: "R-008", codigo: "REC-EQ2", nombre: "Portátil Lenovo ThinkPad", tipo: "Equipos", capacidad: 1, ubicacion: "Bodega de tecnología", estado: "En revisión", disponibilidad: "No disponible" },
  { id: "R-009", codigo: "REC-SAL3", nombre: "Salón 303", tipo: "Salas", capacidad: 50, ubicacion: "Bloque D · Piso 3", estado: "Activo", disponibilidad: "Disponible" },
  { id: "R-010", codigo: "REC-LAB2", nombre: "Laboratorio de redes", tipo: "Laboratorios", capacidad: 18, ubicacion: "Bloque B · Piso 3", estado: "Activo", disponibilidad: "En uso" }
];

const RESERVAS = [
  { recurso: "Salón 101", estado: "Confirmada" },
  { recurso: "Laboratorio de informática 1", estado: "Pendiente" },
  { recurso: "Auditorio principal", estado: "Confirmada" },
  { recurso: "Laboratorio de química", estado: "Cancelada" },
  { recurso: "Salón 205", estado: "Confirmada" },
  { recurso: "Video proyector", estado: "Pendiente" }
];

const SERVICIOS = [
  { name: "Solicitudes", icon: "solicitudes", category: "Académico", path: "/solicitudes", description: "Gestiona trámites académicos y servicios institucionales del Smart Campus UNIAJS.", resources: ["Constancias académicas","Certificados de estudio","Cambio de programa","Homologaciones"], options: ["Crear nueva solicitud","Consultar estado de una solicitud","Seguimiento de la evolución"] },
  { name: "Reservas", icon: "reservas", category: "Infraestructura", path: "/reservas", description: "Consulta y reserva espacios, aulas, laboratorios y equipos del campus inteligente.", resources: ["Salones de clase","Laboratorios de informática","Auditorios","Equipos audiovisuales"], options: ["Seleccionar recurso","Consultar disponibilidad","Registrar reserva"] },
  { name: "Recursos", icon: "recursos", category: "Infraestructura", path: "/recursos", description: "Explora el catálogo de recursos universitarios disponibles para la comunidad.", resources: ["Espacios físicos","Equipos de laboratorio","Material bibliográfico","Herramientas tecnológicas"], options: ["Explorar catálogo de recursos","Filtrar por tipo","Ver disponibilidad"] },
  { name: "Eventos", icon: "eventos", category: "Cultura", path: "/eventos", description: "Descubre actividades académicas, culturales y comunitarias de la universidad.", resources: ["Seminarios académicos","Talleres y conferencias","Actividades culturales","Ferias universitarias"], options: ["Ver agenda de eventos","Inscribirse a un evento","Publicar un evento"] },
  { name: "Notificaciones", icon: "notificaciones", category: "Comunicación", path: "/notificaciones", description: "Recibe avisos relevantes sobre solicitudes, reservas, eventos y comunicaciones institucionales.", resources: ["Cambios de estado de solicitudes","Confirmaciones de reserva","Nuevos eventos","Alertas institucionales"], options: ["Marcar como leída","Configurar tipo de avisos","Ver historial"] },
  { name: "PQRS", icon: "pqrs", category: "Atención", path: "/pqrs", description: "Presenta peticiones, quejas, reclamos y sugerencias para mejorar la experiencia universitaria.", resources: ["Peticiones","Quejas","Reclamos","Sugerencias"], options: ["Crear nueva PQRS","Consultar mis PQRS","Dar seguimiento a la respuesta"] }
];

// Estado mutable para operaciones CRUD
let solicitudes = [...SOLICITUDES];
let eventos = [...EVENTOS];
let notificaciones = [...NOTIFICACIONES];
let pqrs = [...PQRS];
let recursos = [...RECURSOS];

// ==========================================
// HELPER: Simular delay de red
// ==========================================
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// MIDDLEWARE: Auth simulado
// ==========================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    req.user = payload;
  } catch {
    req.user = null;
  }
  next();
}

app.use(authMiddleware);

// ==========================================
// AUTH
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  await delay();
  const { identificacion, password } = req.body;
  const user = USERS.find(u => (u.usuario === identificacion || u.correo === identificacion) && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = Buffer.from(JSON.stringify({ id: user.id, usuario: user.usuario, rol: user.rol })).toString('base64');
  res.json({ data: { token, user: { ...user, password: undefined } } });
});

app.get('/api/auth/me', async (req, res) => {
  await delay();
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  const user = USERS.find(u => u.id === req.user.id);
  res.json({ data: { ...user, password: undefined } });
});

// ==========================================
// USERS
// ==========================================
app.get('/api/users', async (req, res) => {
  await delay();
  res.json({ data: USERS.map(u => ({ ...u, password: undefined })) });
});

app.get('/api/users/roles', async (req, res) => {
  await delay();
  res.json({ data: ROLES });
});

// ==========================================
// SOLICITUDES (REQUESTS)
// ==========================================
app.get('/api/requests', async (req, res) => {
  await delay();
  res.json({ data: solicitudes });
});

app.get('/api/requests/:id', async (req, res) => {
  await delay();
  const item = solicitudes.find(s => s.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Solicitud no encontrada' });
  res.json({ data: item });
});

app.post('/api/requests', async (req, res) => {
  await delay();
  const nueva = {
    id: `SOL-2026-${String(solicitudes.length + 1).padStart(3, "0")}`,
    ...req.body,
    estado: "Registrada",
    fecha: new Date().toISOString().slice(0, 10),
    historial: [{ estado: "Registrada", fecha: new Date().toISOString().slice(0, 10), detalle: "Solicitud registrada por el usuario." }]
  };
  solicitudes = [nueva, ...solicitudes];
  res.status(201).json({ data: nueva });
});

app.put('/api/requests/:id', async (req, res) => {
  await delay();
  const idx = solicitudes.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Solicitud no encontrada' });
  solicitudes[idx] = { ...solicitudes[idx], ...req.body };
  res.json({ data: solicitudes[idx] });
});

app.patch('/api/requests/:id/advance', async (req, res) => {
  await delay();
  const ESTADOS = ["Registrada", "En revisión", "Asignada", "En proceso", "Resuelta", "Cerrada"];
  const idx = solicitudes.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const posicion = ESTADOS.indexOf(solicitudes[idx].estado);
  if (posicion < ESTADOS.length - 1) {
    solicitudes[idx].estado = ESTADOS[posicion + 1];
  }
  res.json({ data: solicitudes[idx] });
});

app.delete('/api/requests/:id', async (req, res) => {
  await delay();
  solicitudes = solicitudes.filter(s => s.id !== req.params.id);
  res.json({ data: { success: true } });
});

// ==========================================
// EVENTOS (EVENTS)
// ==========================================
app.get('/api/events', async (req, res) => {
  await delay();
  res.json({ data: eventos });
});

app.get('/api/events/:id', async (req, res) => {
  await delay();
  const item = eventos.find(e => e.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ data: item });
});

app.post('/api/events', async (req, res) => {
  await delay();
  const nuevo = { id: Date.now(), ...req.body, inscritos: 0 };
  eventos = [nuevo, ...eventos];
  res.status(201).json({ data: nuevo });
});

app.put('/api/events/:id', async (req, res) => {
  await delay();
  const idx = eventos.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Evento no encontrado' });
  eventos[idx] = { ...eventos[idx], ...req.body };
  res.json({ data: eventos[idx] });
});

app.delete('/api/events/:id', async (req, res) => {
  await delay();
  eventos = eventos.filter(e => e.id !== Number(req.params.id));
  res.json({ data: { success: true } });
});

app.post('/api/events/:id/register', async (req, res) => {
  await delay();
  const idx = eventos.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Evento no encontrado' });
  if (eventos[idx].inscritos < eventos[idx].cupo) {
    eventos[idx].inscritos += 1;
  }
  res.json({ data: eventos[idx] });
});

// ==========================================
// NOTIFICACIONES (NOTIFICATIONS)
// ==========================================
app.get('/api/notifications', async (req, res) => {
  await delay();
  res.json({ data: notificaciones });
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  await delay();
  const idx = notificaciones.findIndex(n => n.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Notificación no encontrada' });
  notificaciones[idx].leida = true;
  res.json({ data: notificaciones[idx] });
});

app.patch('/api/notifications/read-all', async (req, res) => {
  await delay();
  notificaciones = notificaciones.map(n => ({ ...n, leida: true }));
  res.json({ data: notificaciones });
});

// ==========================================
// PQRS (FEEDBACK)
// ==========================================
app.get('/api/feedback', async (req, res) => {
  await delay();
  res.json({ data: pqrs });
});

app.get('/api/feedback/:id', async (req, res) => {
  await delay();
  const item = pqrs.find(p => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'PQRS no encontrada' });
  res.json({ data: item });
});

app.post('/api/feedback', async (req, res) => {
  await delay();
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const nueva = {
    id: `PQRS-2026-${String(pqrs.length + 10).padStart(3, "0")}`,
    fecha: fechaHoy,
    estado: "Registrada",
    prioridad: req.body.prioridad || "Media",
    asignadoA: "",
    respuesta: "",
    historial: [{ estado: "Registrada", fecha: fechaHoy, detalle: "PQRS registrada por el usuario." }],
    ...req.body
  };
  nueva.id = `PQRS-2026-${String(pqrs.length + 10).padStart(3, "0")}`;
  nueva.fecha = fechaHoy;
  nueva.estado = "Registrada";
  nueva.historial = [{ estado: "Registrada", fecha: fechaHoy, detalle: "PQRS registrada por el usuario." }];
  pqrs = [nueva, ...pqrs];
  res.status(201).json({ data: nueva });
});

app.put('/api/feedback/:id', async (req, res) => {
  await delay();
  const idx = pqrs.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'PQRS no encontrada' });
  const actual = pqrs[idx];
  const actualizado = { ...actual, ...req.body };
  const fechaHoy = new Date().toISOString().slice(0, 10);
  if (req.body.estado && req.body.estado !== actual.estado) {
    actualizado.historial = [
      ...(actual.historial || []),
      { estado: req.body.estado, fecha: fechaHoy, detalle: req.body.detalle || `Estado actualizado a "${req.body.estado}".` }
    ];
  }
  pqrs[idx] = actualizado;
  res.json({ data: actualizado });
});

app.delete('/api/feedback/:id', async (req, res) => {
  await delay();
  const idx = pqrs.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'PQRS no encontrada' });
  pqrs = pqrs.filter(p => p.id !== req.params.id);
  res.json({ data: { success: true } });
});

// ==========================================
// RECURSOS (RESOURCES)
// ==========================================
app.get('/api/resources', async (req, res) => {
  await delay();
  res.json({ data: recursos });
});

app.get('/api/resources/:id', async (req, res) => {
  await delay();
  const item = recursos.find(r => r.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Recurso no encontrado' });
  res.json({ data: item });
});

app.post('/api/resources', async (req, res) => {
  await delay();
  const nuevo = { id: `R-${Date.now()}`, ...req.body };
  recursos = [...recursos, nuevo];
  res.status(201).json({ data: nuevo });
});

app.put('/api/resources/:id', async (req, res) => {
  await delay();
  const idx = recursos.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Recurso no encontrado' });
  recursos[idx] = { ...recursos[idx], ...req.body };
  res.json({ data: recursos[idx] });
});

app.delete('/api/resources/:id', async (req, res) => {
  await delay();
  recursos = recursos.filter(r => r.id !== req.params.id);
  res.json({ data: { success: true } });
});

// ==========================================
// RESERVAS (RESERVATIONS)
// ==========================================
app.get('/api/reservations', async (req, res) => {
  await delay();
  res.json({ data: RESERVAS });
});

app.post('/api/reservations', async (req, res) => {
  await delay();
  res.status(201).json({ data: { success: true, message: 'Reserva registrada correctamente.' } });
});

// ==========================================
// SERVICIOS (SERVICES)
// ==========================================
app.get('/api/services', async (req, res) => {
  await delay();
  res.json({ data: SERVICIOS });
});

// ==========================================
// REPORTES (REPORTS)
// ==========================================
app.get('/api/reports', async (req, res) => {
  await delay();
  const recursosDisponibles = recursos.filter(r => r.estado === "Activo" && r.disponibilidad === "Disponible").length;
  const reservasConfirmadas = RESERVAS.filter(r => r.estado === "Confirmada").length;
  const pqrsAbiertas = pqrs.filter(p => !["Resuelta", "Cerrada"].includes(p.estado)).length;

  const contar = (lista, campo, categorias) => categorias.map(nombre => ({
    nombre,
    total: lista.filter(item => item[campo] === nombre).length
  }));

  const contarPor = (lista, campo) => {
    const mapa = new Map();
    lista.forEach(item => {
      const valor = item[campo];
      mapa.set(valor, (mapa.get(valor) || 0) + 1);
    });
    return [...mapa.entries()].map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
  };

  const tendenciaMensual = [
    { mes: "Ene", solicitudes: 22, reservas: 14 },
    { mes: "Feb", solicitudes: 28, reservas: 18 },
    { mes: "Mar", solicitudes: 25, reservas: 21 },
    { mes: "Abr", solicitudes: 33, reservas: 19 },
    { mes: "May", solicitudes: 30, reservas: 24 },
    { mes: "Jun", solicitudes: 38, reservas: 22 },
    { mes: "Jul", solicitudes: 26, reservas: 16 },
    { mes: "Ago", solicitudes: 41, reservas: 27 },
    { mes: "Sep", solicitudes: 44, reservas: 30 },
    { mes: "Oct", solicitudes: 47, reservas: 33 },
    { mes: "Nov", solicitudes: 52, reservas: 36 },
    { mes: "Dic", solicitudes: 45, reservas: 31 }
  ];

  res.json({
    data: {
      tendenciaMensual,
      kpis: [
        { etiqueta: "Usuarios registrados", valor: USERS.length, icono: "usuarios", tendencia: "+4.2%", direccion: "up" },
        { etiqueta: "Solicitudes totales", valor: solicitudes.length, icono: "solicitudes", tendencia: "+8.1%", direccion: "up" },
        { etiqueta: "Recursos disponibles", valor: recursosDisponibles, icono: "recursos", tendencia: "+5.7%", direccion: "up" },
        { etiqueta: "Reservas confirmadas", valor: reservasConfirmadas, icono: "reservas", tendencia: "+12.4%", direccion: "up" },
        { etiqueta: "Eventos programados", valor: eventos.length, icono: "eventos", tendencia: "+2.0%", direccion: "up" },
        { etiqueta: "PQRS abiertas", valor: pqrsAbiertas, icono: "pqrs", tendencia: "-3.1%", direccion: "down" }
      ],
      solicitudesPorEstado: contar(solicitudes, "estado", ["Registrada","En revisión","Asignada","En proceso","Resuelta","Cerrada"]),
      usuariosPorRol: contar(USERS, "rol", ROLES.map(r => r.nombre)),
      recursosPorTipo: contar(recursos, "tipo", ["Salas","Laboratorios","Auditorios","Equipos"]),
      eventosPorCategoria: contar(eventos, "categoria", ["Académico","Cultural","Formación","Institucional"]),
      reservasPorEstado: contar(RESERVAS, "estado", ["Confirmada","Pendiente","Cancelada"]),
      pqrsPorTipo: contar(pqrs, "tipo", ["Petición","Queja","Reclamo","Sugerencia"]),
      masUtilizados: contarPor(RESERVAS, "recurso").slice(0, 5),
      serviciosDisponibles: SERVICIOS.length,
      totales: {
        solicitudes: solicitudes.length,
        reservas: RESERVAS.length,
        recursos: recursos.length,
        usuarios: USERS.length,
        pqrs: pqrs.length,
        eventos: eventos.length
      }
    }
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/', (req, res) => {
  res.json({ message: 'Mock API Server funcionando', version: '1.0.0' });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`Mock API Server corriendo en http://localhost:${PORT}`);
  console.log(`Endpoints disponibles:`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/auth/me`);
  console.log(`  GET  /api/users`);
  console.log(`  GET  /api/users/roles`);
  console.log(`  GET  /api/requests`);
  console.log(`  POST /api/requests`);
  console.log(`  GET  /api/events`);
  console.log(`  POST /api/events`);
  console.log(`  GET  /api/notifications`);
  console.log(`  GET  /api/feedback`);
  console.log(`  POST /api/feedback`);
  console.log(`  GET  /api/resources`);
  console.log(`  POST /api/resources`);
  console.log(`  GET  /api/reservations`);
  console.log(`  GET  /api/services`);
  console.log(`  GET  /api/reports`);
});
