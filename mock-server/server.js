const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.MOCK_PORT || 3000;

// ==========================================
// DATOS SINTÉTICOS
// ==========================================

// Usuarios demo. `identificacion`/`cedula` es el dato con el que inicia sesión
// el frontend; `usuario` y `correo` también se aceptan por comodidad.
// La contraseña de todas las cuentas demo es admin123 (hash bcrypt abajo).
const PASSWORD_DEMO = "$2b$10$pbeWFX1Tk.1VMle5WjvdP.S6k/qFdj7sVNcFmOMhMyXqiUA0nQwRC";

const USERS = [
  { id: 1, id_usuario: 1, identificacion: "1023456789", cedula: "1023456789", usuario: "admin", password: PASSWORD_DEMO, nombre: "Natalia", apellido: "Rodríguez", correo: "natalia.rodriguez@uajs.edu.co", telefono: "", rol: "Administrador", id_rol: 1, tipo_usuario: "Administrador", programa: "No aplica", estado: "Activo", cargo: "Coordinadora general", campus: "Campus principal", foto_perfil: "" },
  { id: 2, id_usuario: 2, identificacion: "1023456788", cedula: "1023456788", usuario: "funcionario", password: PASSWORD_DEMO, nombre: "Carlos", apellido: "Méndez", correo: "carlos.mendez@uajs.edu.co", telefono: "", rol: "Administrativo", id_rol: 4, tipo_usuario: "Administrativo", programa: "Bienestar Universitario", estado: "Activo", cargo: "Analista de servicios", campus: "Campus Norte", foto_perfil: "" },
  { id: 3, id_usuario: 3, identificacion: "1023456787", cedula: "1023456787", usuario: "profesor", password: PASSWORD_DEMO, nombre: "Laura", apellido: "Gómez", correo: "laura.gomez@uajs.edu.co", telefono: "", rol: "Docente", id_rol: 3, tipo_usuario: "Docente", programa: "Matemáticas", estado: "Activo", cargo: "Docente titular", campus: "Campus central", foto_perfil: "" },
  { id: 4, id_usuario: 4, identificacion: "1023456786", cedula: "1023456786", usuario: "estudiante", password: PASSWORD_DEMO, nombre: "Andrés", apellido: "Torres", correo: "andres.torres@uajs.edu.co", telefono: "", rol: "Estudiante", id_rol: 2, tipo_usuario: "Estudiante", programa: "Ingeniería de Sistemas", estado: "Activo", cargo: "Estudiante", campus: "Campus central", foto_perfil: "" },
  { id: 5, id_usuario: 5, identificacion: "1023456785", cedula: "1023456785", usuario: "lucia.paredes", password: PASSWORD_DEMO, nombre: "Lucía", apellido: "Paredes", correo: "lucia.paredes@uajs.edu.co", telefono: "", rol: "Docente", id_rol: 3, tipo_usuario: "Docente", programa: "Ingeniería de Sistemas", estado: "Activo", cargo: "Docente", campus: "Campus principal", foto_perfil: "" },
  { id: 6, id_usuario: 6, identificacion: "1023456784", cedula: "1023456784", usuario: "andres.ruiz", password: PASSWORD_DEMO, nombre: "Andrés", apellido: "Ruiz", correo: "andres.ruiz@uajs.edu.co", telefono: "", rol: "Estudiante", id_rol: 2, tipo_usuario: "Estudiante", programa: "Ingeniería de Sistemas", estado: "Activo", cargo: "Estudiante", campus: "Campus principal", foto_perfil: "" },
  { id: 7, id_usuario: 7, identificacion: "1023456783", cedula: "1023456783", usuario: "maria.torres", password: PASSWORD_DEMO, nombre: "María", apellido: "Torres", correo: "maria.torres@uajs.edu.co", telefono: "", rol: "Estudiante", id_rol: 2, tipo_usuario: "Estudiante", programa: "Ingeniería de Sistemas", estado: "Activo", cargo: "Estudiante", campus: "Campus principal", foto_perfil: "" },
  { id: 8, id_usuario: 8, identificacion: "1023456782", cedula: "1023456782", usuario: "jorge.salazar", password: PASSWORD_DEMO, nombre: "Jorge", apellido: "Salazar", correo: "jorge.salazar@uajs.edu.co", telefono: "", rol: "Estudiante", id_rol: 2, tipo_usuario: "Estudiante", programa: "Ingeniería de Sistemas", estado: "Activo", cargo: "Estudiante", campus: "Campus principal", foto_perfil: "" }
];

// Quita el hash de contraseña antes de enviar un usuario al cliente.
const sinPassword = ({ password, ...resto }) => resto;

// ==========================================
// ADAPTADORES: modelo interno -> fila de BD
// El mock guarda los datos con nombres "de UI" (id, nombre, hora...), pero
// el backend real responde columnas en snake_case. Sin esta traducción los
// mapeos del frontend reciben undefined y las tarjetas salen sin título ni
// identificador.
// ==========================================
const SERVICIO_ID = { Solicitudes: 1, Reservas: 2, Eventos: 3, Recursos: 4, PQRS: 5 };

const soloNumero = (valor) => {
  const encontrado = String(valor ?? "").match(/(\d+)$/);
  return encontrado ? Number(encontrado[1]) : null;
};

const idUsuarioPorNombre = (nombre) => {
  const user = USERS.find(u => `${u.nombre} ${u.apellido}`.trim() === String(nombre || "").trim());
  return user ? user.id_usuario : null;
};

const sumarHoras = (hora, horas = 2) => {
  const [h, m] = String(hora || "00:00").split(":").map(Number);
  return `${String((Number(h) + horas) % 24).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
};

const aSolicitud = (s) => ({
  id_solicitud: soloNumero(s.id),
  codigo: s.id,
  tipo: s.tipo,
  id_servicio: SERVICIO_ID[s.servicio] ?? null,
  servicio_nombre: s.servicio || "",
  prioridad: s.prioridad || "Media",
  dependencia: s.dependencia || "",
  fecha_solicitud: s.fecha_solicitud || s.fecha || "",
  descripcion: s.descripcion || "",
  estado: s.estado || "Registrada",
  respuesta: s.respuesta || "",
  solicitante: s.solicitante || "",
  usuario_nombre: s.solicitante || "",
  usuario_apellido: "",
  id_usuario: s.id_usuario ?? idUsuarioPorNombre(s.solicitante),
  id_responsable: s.id_responsable ?? null,
  responsable_nombre: s.responsable || "",
  historial: Array.isArray(s.historial) ? s.historial : []
});

const aEvento = (e) => ({
  id_evento: e.id_evento ?? e.id,
  nombre_evento: e.nombre_evento || e.nombre || "",
  descripcion: e.descripcion || "",
  fecha: e.fecha || "",
  hora_inicio: e.hora_inicio || e.hora || "",
  hora_fin: e.hora_fin || sumarHoras(e.hora || e.hora_inicio),
  ubicacion: e.ubicacion || e.lugar || "",
  tipo_evento: e.tipo_evento || e.categoria || "",
  estado: e.estado === "Activo" ? "Programado" : (e.estado || "Programado"),
  cupo: Number(e.cupo) || 0,
  inscritos: Number(e.inscritos) || 0,
  id_usuario: e.id_usuario ?? null,
  ponente: e.ponente || "",
  modalidad: e.modalidad || ""
});

const TITULO_NOTIFICACION = {
  Solicitud: "Actualización de solicitud",
  Reserva: "Movimiento de reserva",
  Evento: "Nuevo evento",
  PQRS: "Respuesta a PQRS"
};

const aNotificacion = (n) => ({
  id_notificacion: n.id_notificacion ?? n.id,
  id_usuario: n.id_usuario ?? 1,
  titulo: n.titulo || TITULO_NOTIFICACION[n.tipo] || "Notificación",
  mensaje: n.mensaje || "",
  tipo_notificacion: n.tipo_notificacion || n.tipo || "info",
  icono: n.icono || "bell",
  leida: n.leida === true || Number(n.leida) === 1 ? 1 : 0,
  fecha_envio: n.fecha_envio || (n.fecha ? `${n.fecha} 00:00:00` : "")
});

const aRecurso = (r) => ({
  id_recurso: r.id_recurso ?? r.id,
  codigo: r.codigo || "",
  nombre_recurso: r.nombre_recurso || r.nombre || "",
  tipo_recurso: r.tipo_recurso || r.tipo || "",
  descripcion: r.descripcion || "",
  ubicacion: r.ubicacion || "",
  capacidad: r.capacidad ?? null,
  estado: r.estado === "Activo" ? "Disponible" : (r.estado || "Disponible"),
  disponibilidad: r.disponibilidad || "Disponible"
});

const aPqrs = (p) => ({
  id_pqrs: p.id_pqrs ?? soloNumero(p.id),
  codigo: p.codigo || p.id,
  id_usuario: p.id_usuario ?? idUsuarioPorNombre(p.solicitante || p.nombre),
  tipo: p.tipo,
  fecha: p.fecha || "",
  estado: p.estado || "Registrada",
  descripcion: p.descripcion || "",
  respuesta: p.respuesta || "",
  fecha_respuesta: p.fecha_respuesta || null,
  prioridad: p.prioridad || "Media",
  asignado_a: p.asignado_a || p.asignadoA || "",
  asunto: p.asunto || String(p.descripcion || "").slice(0, 80),
  nombre: p.nombre || p.solicitante || "",
  sede: p.sede || "SINCELEJO",
  area: p.area || "PQRS",
  tipo_perfil: p.tipo_perfil || "Estudiante",
  tipo_documento: p.tipo_documento || "",
  identificacion: p.identificacion || "",
  telefono: p.telefono || "",
  correo: p.correo || "",
  adjunto: p.adjunto ?? null
});

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
  { id_reserva: 1, id_usuario: 1, id_recurso: "R-005", usuario_nombre: "Natalia Rodríguez", nombre_recurso: "Auditorio principal", tipo_recurso: "Auditorios", fecha_reserva: "2026-09-03", hora_inicio: "08:00", hora_fin: "10:00", motivo: "Cátedra de inteligencia artificial", observaciones: "", estado: "Confirmada" },
  { id_reserva: 2, id_usuario: 4, id_recurso: "R-003", usuario_nombre: "Andrés Torres", nombre_recurso: "Laboratorio de informática 1", tipo_recurso: "Laboratorios", fecha_reserva: "2026-09-05", hora_inicio: "14:00", hora_fin: "16:00", motivo: "Práctica de redes", observaciones: "", estado: "Pendiente" },
  { id_reserva: 3, id_usuario: 3, id_recurso: "R-005", usuario_nombre: "Laura Gómez", nombre_recurso: "Auditorio principal", tipo_recurso: "Auditorios", fecha_reserva: "2026-09-08", hora_inicio: "09:00", hora_fin: "11:00", motivo: "Conferencia académica", observaciones: "", estado: "Confirmada" },
  { id_reserva: 4, id_usuario: 2, id_recurso: "R-004", usuario_nombre: "Carlos Méndez", nombre_recurso: "Laboratorio de química", tipo_recurso: "Laboratorios", fecha_reserva: "2026-09-10", hora_inicio: "10:00", hora_fin: "12:00", motivo: "Práctica de laboratorio", observaciones: "Cancelada por mantenimiento.", estado: "Cancelada" },
  { id_reserva: 5, id_usuario: 5, id_recurso: "R-002", usuario_nombre: "Lucía Paredes", nombre_recurso: "Salón 205", tipo_recurso: "Salas", fecha_reserva: "2026-09-12", hora_inicio: "07:00", hora_fin: "09:00", motivo: "Tutoría de proyectos", observaciones: "", estado: "Confirmada" },
  { id_reserva: 6, id_usuario: 6, id_recurso: "R-007", usuario_nombre: "Andrés Ruiz", nombre_recurso: "Video proyector Epson 4K", tipo_recurso: "Equipos", fecha_reserva: "2026-09-15", hora_inicio: "13:00", hora_fin: "15:00", motivo: "Feria de empleabilidad", observaciones: "", estado: "Pendiente" }
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
let reservas = [...RESERVAS];

// Búsquedas tolerantes: el frontend puede enviar el id interno o el de BD.
const buscarSolicitud = (id) =>
  solicitudes.find(s => String(s.id) === String(id) || String(s.codigo) === String(id));

const buscarEvento = (id) =>
  eventos.find(e => String(e.id) === String(id) || String(e.id_evento) === String(id));

const buscarNotificacion = (id) =>
  notificaciones.find(n => String(n.id) === String(id) || String(n.id_notificacion) === String(id));

const buscarPqrs = (id) =>
  pqrs.find(p => String(p.id) === String(id) || String(soloNumero(p.id)) === String(id));

const buscarRecurso = (id) =>
  recursos.find(r => String(r.id) === String(id) || String(r.id_recurso) === String(id));

const buscarReserva = (id) =>
  reservas.find(r => String(r.id_reserva) === String(id));

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
  const { cedula, identificacion, usuario, correo, password } = req.body || {};
  // El frontend envía `cedula` (igual que el auth-service real). Se aceptan
  // también `identificacion`, `usuario` y `correo` para no romper clientes
  // antiguos ni los ejemplos de la documentación.
  const criterio = String(cedula || identificacion || usuario || correo || "").trim();
  const documento = criterio.replace(/[.\s-]/g, "");
  const user = USERS.find(u =>
    u.estado === "Activo" &&
    (
      u.cedula === criterio ||
      u.cedula === documento ||
      u.identificacion === criterio ||
      u.usuario === criterio ||
      u.correo === criterio
    )
  );
  if (!user || !(await bcrypt.compare(String(password || ""), user.password))) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = Buffer.from(JSON.stringify({ id: user.id_usuario, identificacion: user.identificacion, rol: user.id_rol })).toString('base64');
  res.json({ data: { ...sinPassword(user), rol: user.id_rol, token } });
});

app.get('/api/auth/me', async (req, res) => {
  await delay();
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  const user = USERS.find(u => u.id_usuario === req.user.id || u.id === req.user.id);
  if (!user) return res.status(401).json({ error: 'No autorizado' });
  res.json({ data: { ...sinPassword(user), rol: user.id_rol } });
});

// ==========================================
// USERS
// ==========================================
app.get('/api/users', async (req, res) => {
  await delay();
  res.json({ data: USERS.map(sinPassword) });
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
  res.json({ data: solicitudes.map(aSolicitud) });
});

app.get('/api/requests/:id', async (req, res) => {
  await delay();
  const item = buscarSolicitud(req.params.id);
  if (!item) return res.status(404).json({ error: 'Solicitud no encontrada' });
  res.json({ data: aSolicitud(item) });
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
  res.status(201).json({ data: aSolicitud(nueva) });
});

app.put('/api/requests/:id', async (req, res) => {
  await delay();
  const idx = solicitudes.findIndex(s => String(s.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Solicitud no encontrada' });
  solicitudes[idx] = { ...solicitudes[idx], ...req.body };
  res.json({ data: aSolicitud(solicitudes[idx]) });
});

app.patch('/api/requests/:id/advance', async (req, res) => {
  await delay();
  const ESTADOS = ["Registrada", "En revisión", "Asignada", "En proceso", "Resuelta", "Cerrada"];
  const idx = solicitudes.findIndex(s => String(s.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const posicion = ESTADOS.indexOf(solicitudes[idx].estado);
  if (posicion < ESTADOS.length - 1) {
    solicitudes[idx].estado = ESTADOS[posicion + 1];
  }
  res.json({ data: aSolicitud(solicitudes[idx]) });
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
  res.json({ data: eventos.map(aEvento) });
});

app.get('/api/events/:id', async (req, res) => {
  await delay();
  const item = buscarEvento(req.params.id);
  if (!item) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ data: aEvento(item) });
});

app.post('/api/events', async (req, res) => {
  await delay();
  const nuevo = { id: Date.now(), ...req.body, inscritos: 0 };
  eventos = [nuevo, ...eventos];
  res.status(201).json({ data: aEvento(nuevo) });
});

app.put('/api/events/:id', async (req, res) => {
  await delay();
  const idx = eventos.findIndex(e => String(e.id) === String(req.params.id) || String(e.id_evento) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Evento no encontrado' });
  eventos[idx] = { ...eventos[idx], ...req.body };
  res.json({ data: aEvento(eventos[idx]) });
});

app.delete('/api/events/:id', async (req, res) => {
  await delay();
  const item = buscarEvento(req.params.id);
  if (!item) return res.status(404).json({ error: 'Evento no encontrado' });
  eventos = eventos.filter(e => e !== item);
  res.json({ data: { success: true } });
});

app.post('/api/events/:id/register', async (req, res) => {
  await delay();
  const item = buscarEvento(req.params.id);
  if (!item) return res.status(404).json({ error: 'Evento no encontrado' });
  if (item.inscritos < item.cupo) {
    item.inscritos += 1;
  }
  res.json({ data: aEvento(item) });
});

// ==========================================
// NOTIFICACIONES (NOTIFICATIONS)
// ==========================================
app.get('/api/notifications', async (req, res) => {
  await delay();
  // Los datos demo son compartidos; se ignoran los filtros por usuario para
  // que cualquier cuenta vea el buzón completo.
  res.json({ data: notificaciones.map(aNotificacion) });
});

app.post('/api/notifications', async (req, res) => {
  await delay();
  const { tipo_notificacion, fecha_envio, ...resto } = req.body || {};
  const nueva = {
    id: Date.now(),
    ...resto,
    tipo: tipo_notificacion || resto.tipo || "info",
    fecha: String(fecha_envio || resto.fecha || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
    leida: Boolean(Number(resto.leida))
  };
  notificaciones = [nueva, ...notificaciones];
  res.status(201).json({ data: aNotificacion(nueva) });
});

app.put('/api/notifications/:id', async (req, res) => {
  await delay();
  const item = buscarNotificacion(req.params.id);
  if (!item) return res.status(404).json({ error: 'Notificación no encontrada' });
  const { tipo_notificacion, fecha_envio, leida, ...resto } = req.body || {};
  const actualizada = {
    ...item,
    ...resto,
    ...(tipo_notificacion ? { tipo: tipo_notificacion } : {}),
    ...(fecha_envio ? { fecha: String(fecha_envio).slice(0, 10) } : {}),
    ...(leida !== undefined ? { leida: Boolean(Number(leida)) } : {})
  };
  notificaciones = notificaciones.map(n => (n === item ? actualizada : n));
  res.json({ data: aNotificacion(actualizada) });
});

app.delete('/api/notifications/:id', async (req, res) => {
  await delay();
  const item = buscarNotificacion(req.params.id);
  if (!item) return res.status(404).json({ error: 'Notificación no encontrada' });
  notificaciones = notificaciones.filter(n => n !== item);
  res.json({ data: { success: true } });
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  await delay();
  const item = buscarNotificacion(req.params.id);
  if (!item) return res.status(404).json({ error: 'Notificación no encontrada' });
  item.leida = true;
  res.json({ data: aNotificacion(item) });
});

app.patch('/api/notifications/read-all', async (req, res) => {
  await delay();
  notificaciones = notificaciones.map(n => ({ ...n, leida: true }));
  res.json({ data: notificaciones.map(aNotificacion) });
});

// ==========================================
// PQRS (FEEDBACK)
// ==========================================
app.get('/api/feedback', async (req, res) => {
  await delay();
  res.json({ data: pqrs.map(aPqrs) });
});

app.get('/api/feedback/:id', async (req, res) => {
  await delay();
  const item = buscarPqrs(req.params.id);
  if (!item) return res.status(404).json({ error: 'PQRS no encontrada' });
  res.json({ data: aPqrs(item) });
});

app.post('/api/feedback', async (req, res) => {
  await delay();
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const nueva = {
    id: `PQRS-2026-${String(pqrs.length + 10).padStart(3, "0")}`,
    fecha: fechaHoy,
    estado: "Registrada",
    prioridad: req.body.prioridad || "Media",
    asignadoA: req.body.asignado_a || "",
    respuesta: "",
    historial: [{ estado: "Registrada", fecha: fechaHoy, detalle: "PQRS registrada por el usuario." }],
    ...req.body
  };
  nueva.id = `PQRS-2026-${String(pqrs.length + 10).padStart(3, "0")}`;
  nueva.fecha = fechaHoy;
  nueva.estado = "Registrada";
  nueva.historial = [{ estado: "Registrada", fecha: fechaHoy, detalle: "PQRS registrada por el usuario." }];
  pqrs = [nueva, ...pqrs];
  res.status(201).json({ data: aPqrs(nueva) });
});

app.put('/api/feedback/:id', async (req, res) => {
  await delay();
  const item = buscarPqrs(req.params.id);
  if (!item) return res.status(404).json({ error: 'PQRS no encontrada' });
  const actual = item;
  const actualizado = { ...actual, ...req.body };
  const fechaHoy = new Date().toISOString().slice(0, 10);
  if (req.body.estado && req.body.estado !== actual.estado) {
    actualizado.historial = [
      ...(actual.historial || []),
      { estado: req.body.estado, fecha: fechaHoy, detalle: req.body.detalle || `Estado actualizado a "${req.body.estado}".` }
    ];
  }
  pqrs = pqrs.map(p => (p === item ? actualizado : p));
  res.json({ data: aPqrs(actualizado) });
});

app.delete('/api/feedback/:id', async (req, res) => {
  await delay();
  const item = buscarPqrs(req.params.id);
  if (!item) return res.status(404).json({ error: 'PQRS no encontrada' });
  pqrs = pqrs.filter(p => p !== item);
  res.json({ data: { success: true } });
});

// ==========================================
// RECURSOS (RESOURCES)
// ==========================================
app.get('/api/resources', async (req, res) => {
  await delay();
  res.json({ data: recursos.map(aRecurso) });
});

app.get('/api/resources/:id', async (req, res) => {
  await delay();
  const item = buscarRecurso(req.params.id);
  if (!item) return res.status(404).json({ error: 'Recurso no encontrado' });
  res.json({ data: aRecurso(item) });
});

app.post('/api/resources', async (req, res) => {
  await delay();
  const nuevo = { id: `R-${Date.now()}`, ...req.body };
  recursos = [...recursos, nuevo];
  res.status(201).json({ data: aRecurso(nuevo) });
});

app.put('/api/resources/:id', async (req, res) => {
  await delay();
  const item = buscarRecurso(req.params.id);
  if (!item) return res.status(404).json({ error: 'Recurso no encontrado' });
  const actualizado = { ...item, ...req.body };
  recursos = recursos.map(r => (r === item ? actualizado : r));
  res.json({ data: aRecurso(actualizado) });
});

app.delete('/api/resources/:id', async (req, res) => {
  await delay();
  const item = buscarRecurso(req.params.id);
  if (!item) return res.status(404).json({ error: 'Recurso no encontrado' });
  recursos = recursos.filter(r => r !== item);
  res.json({ data: { success: true } });
});

// ==========================================
// RESERVAS (RESERVATIONS)
// ==========================================
app.get('/api/reservations', async (req, res) => {
  await delay();
  res.json({ data: reservas });
});

app.post('/api/reservations', async (req, res) => {
  await delay();
  const recurso = buscarRecurso(req.body.id_recurso) || {};
  const nueva = {
    id_reserva: Date.now(),
    estado: "Confirmada",
    ...req.body,
    usuario_nombre: req.body.usuario_nombre || "Usuario",
    nombre_recurso: req.body.nombre_recurso || recurso.nombre || recurso.nombre_recurso || "",
    tipo_recurso: req.body.tipo_recurso || recurso.tipo || recurso.tipo_recurso || ""
  };
  reservas = [nueva, ...reservas];
  res.status(201).json({ data: nueva });
});

app.put('/api/reservations/:id', async (req, res) => {
  await delay();
  const item = buscarReserva(req.params.id);
  if (!item) return res.status(404).json({ error: 'Reserva no encontrada' });
  const actualizada = { ...item, ...req.body };
  reservas = reservas.map(r => (r === item ? actualizada : r));
  res.json({ data: actualizada });
});

app.delete('/api/reservations/:id', async (req, res) => {
  await delay();
  const item = buscarReserva(req.params.id);
  if (!item) return res.status(404).json({ error: 'Reserva no encontrada' });
  reservas = reservas.filter(r => r !== item);
  res.json({ data: { success: true } });
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
      reservasPorEstado: contar(reservas, "estado", ["Confirmada","Pendiente","Cancelada"]),
      pqrsPorTipo: contar(pqrs, "tipo", ["Petición","Queja","Reclamo","Sugerencia"]),
      masUtilizados: contarPor(reservas, "nombre_recurso").slice(0, 5),
      serviciosDisponibles: SERVICIOS.length,
      totales: {
        solicitudes: solicitudes.length,
        reservas: reservas.length,
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
