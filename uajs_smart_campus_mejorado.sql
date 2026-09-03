-- ============================================================
-- Base de Datos UAJS Smart Campus - Adaptada al Frontend
-- Versión: 2.0 - Mejorada y Optimizada
-- ============================================================

-- DROP DATABASE IF EXISTS uajs_smart_campus;
-- CREATE DATABASE uajs_smart_campus;
USE uajs_smart_campus;

-- ============================================================
-- TABLA 1: ROLES - Roles del sistema
-- ============================================================
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
  id_rol INT PRIMARY KEY AUTO_INCREMENT,
  nombre_rol VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO roles (nombre_rol, descripcion, estado) VALUES
('Administrador', 'Gestiona el sistema y sus usuarios.', 'Activo'),
('Estudiante', 'Usuario que pertenece a la comunidad estudiantil.', 'Activo'),
('Docente', 'Usuario encargado de actividades académicas.', 'Activo'),
('Administrativo', 'Personal administrativo de la universidad.', 'Activo');

-- ============================================================
-- TABLA 2: USUARIOS - Datos de usuarios del sistema
-- ============================================================
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  identificacion VARCHAR(20) NOT NULL UNIQUE,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  foto_perfil VARCHAR(255),
  id_rol INT NOT NULL,
  programa VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT,
  INDEX idx_usuario (usuario),
  INDEX idx_correo (correo),
  INDEX idx_estado (estado),
  INDEX idx_rol (id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO usuarios (identificacion, usuario, contraseña, nombre, apellido, correo, telefono, id_rol, programa, estado) VALUES
('1001234567', 'admin', 'admin123', 'Juan', 'Administrador', 'juan.admin@uajs.edu.co', '3001234567', 1, 'Dirección Académica', 'Activo'),
('1002345678', 'carlos.mendez', 'pass123', 'Carlos', 'Méndez', 'carlos.mendez@uajs.edu.co', '3002345678', 2, 'Ingeniería de Sistemas', 'Activo'),
('1003456789', 'laura.gomez', 'pass123', 'Laura', 'Gómez', 'laura.gomez@uajs.edu.co', '3003456789', 3, 'Departamento Académico', 'Activo'),
('1004567890', 'natalia.rodriguez', 'pass123', 'Natalia', 'Rodríguez', 'natalia.rodriguez@uajs.edu.co', '3004567890', 2, 'Ingeniería de Sistemas', 'Activo'),
('1005678901', 'lucia.paredes', 'pass123', 'Lucía', 'Paredes', 'lucia.paredes@uajs.edu.co', '3005678901', 2, 'Administración de Empresas', 'Activo'),
('1006789012', 'andres.ruiz', 'pass123', 'Andrés', 'Ruiz', 'andres.ruiz@uajs.edu.co', '3006789012', 2, 'Ingeniería Industrial', 'Activo'),
('1007890123', 'maria.torres', 'pass123', 'María', 'Torres', 'maria.torres@uajs.edu.co', '3007890123', 2, 'Contabilidad', 'Activo'),
('1008901234', 'jorge.salazar', 'pass123', 'Jorge', 'Salazar', 'jorge.salazar@uajs.edu.co', '3008901234', 4, 'Servicios Administrativos', 'Activo');

-- ============================================================
-- TABLA 3: SERVICIOS - Servicios disponibles en el sistema
-- ============================================================
DROP TABLE IF EXISTS servicios;
CREATE TABLE servicios (
  id_servicio INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  icono VARCHAR(50),
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO servicios (nombre, descripcion, icono, estado) VALUES
('Solicitudes', 'Registra y da seguimiento a tus solicitudes de servicios académicos.', 'solicitudes', 'Activo'),
('Reservas', 'Reserva salones, laboratorios, auditorios y equipos del campus.', 'reservas', 'Activo'),
('Recursos', 'Consulta los recursos disponibles de la universidad.', 'recursos', 'Activo'),
('Eventos', 'Descubre las actividades y eventos organizados por la comunidad.', 'eventos', 'Activo'),
('Notificaciones', 'Recibe avisos de cambios de estado, reservas y eventos.', 'notificaciones', 'Activo'),
('PQRS', 'Presenta peticiones, quejas, reclamos y sugerencias.', 'pqrs', 'Activo');

-- ============================================================
-- TABLA 4: SOLICITUDES - Solicitudes de servicios
-- ============================================================
DROP TABLE IF EXISTS solicitudes;
CREATE TABLE solicitudes (
  id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(100) NOT NULL,
  id_usuario INT,
  id_servicio INT,
  fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
  descripcion TEXT,
  solicitante VARCHAR(100) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'Registrada',
  respuesta TEXT,
  fecha_respuesta DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE SET NULL,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_usuario (id_usuario),
  INDEX idx_fecha (fecha_solicitud)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO solicitudes (codigo, tipo, id_usuario, id_servicio, fecha_solicitud, descripcion, solicitante, estado, respuesta) VALUES
('SOL-2026-001', 'Reserva de auditorio', 4, 1, '2026-08-10 10:30:00', 'Reserva del auditorio principal para la semana de ingeniería.', 'Natalia Rodríguez', 'En proceso', ''),
('SOL-2026-002', 'Constancia académica', 2, 1, '2026-08-12 14:15:00', 'Solicitud de constancia de notas del semestre actual.', 'Carlos Méndez', 'Registrada', ''),
('SOL-2026-003', 'Reserva de laboratorio', 5, 3, '2026-08-13 09:45:00', 'Laboratorio de informática 3 para práctica de redes.', 'Lucía Paredes', 'Resuelta', 'Reserva culminada con éxito.'),
('SOL-2026-004', 'Inscripción a evento', 6, 4, '2026-08-14 11:20:00', 'Inscripción al seminario de investigación aplicada.', 'Andrés Ruiz', 'En revisión', ''),
('SOL-2026-005', 'Queja', 7, 6, '2026-08-15 15:00:00', 'Queja por el estado de los equipos del laboratorio 2.', 'María Torres', 'Asignada', ''),
('SOL-2026-006', 'Préstamo de equipos', 8, 3, '2026-08-16 10:00:00', 'Préstamo de video proyectores para el foro estudiantil.', 'Jorge Salazar', 'Cerrada', 'Solicitud cerrada por el sistema.');

-- ============================================================
-- TABLA 5: HISTORIAL_SOLICITUDES - Registro de cambios de estado
-- ============================================================
DROP TABLE IF EXISTS historial_solicitudes;
CREATE TABLE historial_solicitudes (
  id_historial INT PRIMARY KEY AUTO_INCREMENT,
  id_solicitud INT NOT NULL,
  estado_anterior VARCHAR(30),
  estado_nuevo VARCHAR(30) NOT NULL,
  observaciones TEXT,
  usuario_cambio INT,
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
  FOREIGN KEY (usuario_cambio) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_solicitud (id_solicitud),
  INDEX idx_fecha (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABLA 6: RECURSOS - Recursos disponibles (salas, labs, etc)
-- ============================================================
DROP TABLE IF EXISTS recursos;
CREATE TABLE recursos (
  id_recurso INT PRIMARY KEY AUTO_INCREMENT,
  nombre_recurso VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  tipo_recurso ENUM('Salas', 'Laboratorios', 'Auditorios', 'Equipos') NOT NULL,
  descripcion VARCHAR(255),
  ubicacion VARCHAR(100) NOT NULL,
  capacidad INT,
  estado VARCHAR(30) NOT NULL DEFAULT 'Activo',
  disponibilidad VARCHAR(30) NOT NULL DEFAULT 'Disponible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo_recurso),
  INDEX idx_estado (estado),
  INDEX idx_disponibilidad (disponibilidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO recursos (nombre_recurso, codigo, tipo_recurso, descripcion, ubicacion, capacidad, estado, disponibilidad) VALUES
('Salón 101', 'REC-101', 'Salas', 'Salón de clase estándar con proyector y pizarra', 'Bloque A · Piso 1', 40, 'Activo', 'Disponible'),
('Salón 205', 'REC-205', 'Salas', 'Salón de clase estándar con conexión a internet', 'Bloque A · Piso 2', 30, 'Activo', 'Ocupado'),
('Laboratorio de informática 1', 'REC-LAB1', 'Laboratorios', 'Laboratorio con 25 equipos de cómputo de última generación', 'Bloque B · Piso 1', 25, 'Activo', 'Disponible'),
('Laboratorio de química', 'REC-LABQ', 'Laboratorios', 'Laboratorio de prácticas de química con equipos especializados', 'Bloque B · Piso 2', 20, 'En mantenimiento', 'Ocupado'),
('Auditorio principal', 'REC-AUD1', 'Auditorios', 'Auditorio principal del campus con sistema de sonido profesional', 'Bloque C', 300, 'Activo', 'Disponible'),
('Auditorio B', 'REC-AUD2', 'Auditorios', 'Auditorio secundario con proyección 4K', 'Bloque C · Piso 2', 120, 'Activo', 'Ocupado'),
('Video proyector', 'REC-EQ1', 'Equipos', 'Proyector de video Full HD para presentaciones', 'Bodega de tecnología', 1, 'Activo', 'Disponible'),
('Computador portátil', 'REC-EQ2', 'Equipos', 'Portátil Dell XPS para préstamo a estudiantes', 'Bodega de tecnología', 1, 'Inactivo', 'Ocupado'),
('Laboratorio de física', 'REC-LABF', 'Laboratorios', 'Laboratorio de prácticas de física', 'Bloque B · Piso 3', 20, 'Activo', 'Disponible'),
('Salón de tutorías', 'REC-TUT', 'Salas', 'Sala para tutorías y asesorías académicas', 'Bloque A · Piso 3', 15, 'Activo', 'Disponible');

-- ============================================================
-- TABLA 7: RESERVAS - Reservas de recursos
-- ============================================================
DROP TABLE IF EXISTS reservas;
CREATE TABLE reservas (
  id_reserva INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_recurso INT NOT NULL,
  fecha_reserva DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  motivo VARCHAR(255),
  estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_recurso) REFERENCES recursos(id_recurso) ON DELETE CASCADE,
  INDEX idx_usuario (id_usuario),
  INDEX idx_recurso (id_recurso),
  INDEX idx_fecha (fecha_reserva),
  INDEX idx_estado (estado),
  UNIQUE KEY uq_reserva (id_recurso, fecha_reserva, hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO reservas (id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado) VALUES
(1, 1, '2026-08-18', '08:00:00', '10:00:00', 'Semana de la Ingeniería', 'Confirmada'),
(5, 3, '2026-08-20', '14:00:00', '17:00:00', 'Seminario de investigación', 'Pendiente'),
(4, 5, '2026-08-20', '09:00:00', '18:00:00', 'Semana de la Ingeniería', 'Confirmada'),
(5, 4, '2026-08-21', '08:00:00', '12:00:00', 'Práctica de laboratorio', 'Cancelada'),
(6, 2, '2026-08-22', '14:00:00', '17:00:00', 'Seminario de investigación', 'Confirmada'),
(8, 7, '2026-08-25', '10:00:00', '12:00:00', 'Foro estudiantil', 'Pendiente'),
(2, 1, '2026-08-28', '11:00:00', '13:00:00', 'Clase de Cálculo I', 'Confirmada'),
(3, 9, '2026-09-01', '15:00:00', '17:00:00', 'Práctica de Física', 'Pendiente');

-- ============================================================
-- TABLA 8: EVENTOS_Y_ACTIVIDADES - Eventos y actividades del campus
-- ============================================================
DROP TABLE IF EXISTS eventos_y_actividades;
CREATE TABLE eventos_y_actividades (
  id_evento INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  nombre_evento VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cupo INT NOT NULL,
  inscritos INT NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  ubicacion VARCHAR(100) NOT NULL,
  tipo_evento ENUM('Académico', 'Cultural', 'Deportivo', 'Formación') NOT NULL,
  modalidad ENUM('Presencial', 'Virtual', 'Híbrido') NOT NULL DEFAULT 'Presencial',
  estado VARCHAR(30) NOT NULL DEFAULT 'Activo',
  imagen VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo_evento),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO eventos_y_actividades (id_usuario, nombre_evento, descripcion, cupo, inscritos, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, modalidad, estado) VALUES
(1, 'Semana de la Ingeniería', 'Jornada de conferencias y talleres con invitados del sector productivo.', 120, 104, '2026-08-20', '09:00:00', '18:00:00', 'Auditorio principal', 'Académico', 'Presencial', 'Finalizado'),
(1, 'Seminario de investigación aplicada', 'Presentación de proyectos de investigación de estudiantes y docentes.', 40, 38, '2026-08-22', '14:00:00', '17:00:00', 'Salón 205', 'Académico', 'Presencial', 'Finalizado'),
(3, 'Foro estudiantil', 'Espacio de diálogo sobre la vida universitaria y bienestar estudiantil.', 80, 52, '2026-08-25', '10:00:00', '12:00:00', 'Auditorio B', 'Cultural', 'Presencial', 'Activo'),
(1, 'Feria universitaria 2026', 'Exposición de programas académicos, servicios y emprendimientos estudiantiles.', 200, 176, '2026-08-28', '08:00:00', '16:00:00', 'Patio central', 'Cultural', 'Presencial', 'Activo'),
(3, 'Taller de emprendimiento', 'Taller práctico para la creación de planes de negocio.', 30, 12, '2026-09-02', '15:00:00', '18:00:00', 'Laboratorio de informática 1', 'Formación', 'Presencial', 'Activo'),
(1, 'Cátedra de Inteligencia Artificial', 'Conferencia magistral sobre tendencias en IA y machine learning.', 150, 118, '2026-09-08', '10:00:00', '12:00:00', 'Auditorio principal', 'Académico', 'Híbrido', 'Activo');

-- ============================================================
-- TABLA 9: INSCRIPCIONES_EVENTOS - Inscripciones a eventos
-- ============================================================
DROP TABLE IF EXISTS inscripciones_eventos;
CREATE TABLE inscripciones_eventos (
  id_inscripcion INT PRIMARY KEY AUTO_INCREMENT,
  id_evento INT NOT NULL,
  id_usuario INT NOT NULL,
  fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado_inscripcion VARCHAR(30) NOT NULL DEFAULT 'Confirmada',
  FOREIGN KEY (id_evento) REFERENCES eventos_y_actividades(id_evento) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  UNIQUE KEY uq_inscripcion (id_evento, id_usuario),
  INDEX idx_evento (id_evento),
  INDEX idx_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABLA 10: PQRS - Peticiones, Quejas, Reclamos y Sugerencias
-- ============================================================
DROP TABLE IF EXISTS pqrs;
CREATE TABLE pqrs (
  id_pqrs VARCHAR(20) PRIMARY KEY,
  id_usuario INT,
  tipo ENUM('Petición', 'Queja', 'Reclamo', 'Sugerencia') NOT NULL,
  fecha DATE NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'En revisión',
  descripcion TEXT NOT NULL,
  respuesta TEXT,
  fecha_respuesta DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_tipo (tipo),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO pqrs (id_pqrs, id_usuario, tipo, fecha, estado, descripcion) VALUES
('PQRS-2026-011', 7, 'Reclamo', '2026-08-02', 'Asignada', 'Reclamo por el estado de los equipos del laboratorio de informática 2.'),
('PQRS-2026-012', 8, 'Sugerencia', '2026-08-05', 'Cerrada', 'Sugerencia para ampliar los horarios de atención de la biblioteca.'),
('PQRS-2026-013', 4, 'Petición', '2026-08-09', 'Resuelta', 'Solicitud de información sobre el proceso de homologación.'),
('PQRS-2026-014', 5, 'Queja', '2026-08-12', 'En revisión', 'Queja por la demora en la entrega de constancias académicas.');

-- ============================================================
-- TABLA 11: NOTIFICACIONES - Sistema de notificaciones
-- ============================================================
DROP TABLE IF EXISTS notificaciones;
CREATE TABLE notificaciones (
  id_notificacion INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
  tipo_notificacion VARCHAR(50),
  icono VARCHAR(50),
  leida TINYINT(1) NOT NULL DEFAULT 0,
  referencia_tabla VARCHAR(50),
  referencia_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_usuario (id_usuario),
  INDEX idx_leida (leida),
  INDEX idx_fecha (fecha_envio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO notificaciones (id_usuario, titulo, mensaje, fecha_envio, tipo_notificacion, icono, leida) VALUES
(4, 'Solicitud', 'Tu solicitud SOL-2026-001 cambió al estado En proceso.', '2026-08-14 10:30:00', 'Solicitud', 'solicitudes', 0),
(4, 'Reserva', 'Reserva del auditorio principal confirmada para el 18 de agosto.', '2026-08-13 14:15:00', 'Reserva', 'reservas', 0),
(1, 'Evento', 'Nuevo evento: Seminario de investigación aplicada.', '2026-08-12 11:45:00', 'Evento', 'eventos', 1),
(7, 'Solicitud', 'Tu PQRS SOL-2026-005 fue asignada al técnico responsable.', '2026-08-11 09:20:00', 'Solicitud', 'solicitudes', 0),
(5, 'Reserva', 'Recordatorio: tu reserva del laboratorio de química vence mañana.', '2026-08-10 08:00:00', 'Reserva', 'reservas', 1),
(1, 'Evento', 'Publicación: Convocatoria a la feria universitaria 2026.', '2026-08-08 15:30:00', 'Evento', 'eventos', 1);

-- ============================================================
-- TABLA 12: INFO_ACADEMICA - Información y publicaciones académicas
-- ============================================================
DROP TABLE IF EXISTS info_academica;
CREATE TABLE info_academica (
  id_publicacion INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT,
  titulo VARCHAR(150) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  fecha DATE NOT NULL,
  autor VARCHAR(100) NOT NULL,
  contenido TEXT NOT NULL,
  imagen VARCHAR(255),
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_categoria (categoria),
  INDEX idx_fecha (fecha),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO info_academica (id_usuario, titulo, categoria, fecha, autor, contenido) VALUES
(3, 'Convocatoria periodo académico 2026-1', 'Convocatoria', '2026-03-15', 'Laura Gómez', 'Se abre el período de inscripción para el primer semestre 2026. Los estudiantes deberán completar su matrícula antes del 28 de marzo.'),
(3, 'Taller de Metodología de Investigación', 'Taller', '2026-04-10', 'Laura Gómez', 'Se realizará un taller práctico sobre métodos de investigación cuantitativa y cualitativa para estudiantes de posgrado.'),
(3, 'Resultados parciales Cálculo I', 'Resultado', '2026-04-22', 'Laura Gómez', 'Se publican los resultados del primer parcial de Cálculo I. Los estudiantes pueden revisar en la plataforma académica.');

-- ============================================================
-- TABLA 13: CONFIGURACION - Configuración de usuario
-- ============================================================
DROP TABLE IF EXISTS configuracion;
CREATE TABLE configuracion (
  id_config INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  seccion VARCHAR(50) NOT NULL,
  valor LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  UNIQUE KEY uq_config (id_usuario, seccion),
  INDEX idx_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABLA 14: AUDITORÍA - Registro de acciones del sistema
-- ============================================================
DROP TABLE IF EXISTS auditoria;
CREATE TABLE auditoria (
  id_auditoria INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT,
  tabla_afectada VARCHAR(50) NOT NULL,
  tipo_accion VARCHAR(20) NOT NULL,
  datos_anteriores LONGTEXT,
  datos_nuevos LONGTEXT,
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_usuario (id_usuario),
  INDEX idx_tabla (tabla_afectada),
  INDEX idx_fecha (fecha_accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- ÍNDICES Y OPTIMIZACIONES FINALES
-- ============================================================

-- Índices compositos para búsquedas frecuentes
CREATE INDEX idx_reservas_usuario_fecha ON reservas(id_usuario, fecha_reserva);
CREATE INDEX idx_solicitudes_usuario_estado ON solicitudes(id_usuario, estado);
CREATE INDEX idx_eventos_fecha_estado ON eventos_y_actividades(fecha, estado);
CREATE INDEX idx_notificaciones_usuario_leida ON notificaciones(id_usuario, leida);

-- ============================================================
-- VISTA: Resumen de solicitudes del usuario
-- ============================================================
DROP VIEW IF EXISTS v_solicitudes_usuario;
CREATE VIEW v_solicitudes_usuario AS
SELECT 
  s.id_solicitud,
  s.codigo,
  s.tipo,
  s.estado,
  s.solicitante,
  u.correo,
  s.fecha_solicitud,
  srv.nombre AS servicio,
  COUNT(hs.id_historial) AS cambios_estado
FROM solicitudes s
LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
LEFT JOIN servicios srv ON s.id_servicio = srv.id_servicio
LEFT JOIN historial_solicitudes hs ON s.id_solicitud = hs.id_solicitud
GROUP BY s.id_solicitud;

-- ============================================================
-- VISTA: Disponibilidad de recursos
-- ============================================================
DROP VIEW IF EXISTS v_recursos_disponibles;
CREATE VIEW v_recursos_disponibles AS
SELECT 
  r.id_recurso,
  r.nombre_recurso,
  r.tipo_recurso,
  r.capacidad,
  r.ubicacion,
  r.estado,
  COUNT(DISTINCT CASE WHEN res.estado = 'Confirmada' THEN res.id_reserva END) AS reservas_activas,
  r.capacidad - COUNT(DISTINCT CASE WHEN res.estado = 'Confirmada' THEN res.id_reserva END) AS capacidad_disponible
FROM recursos r
LEFT JOIN reservas res ON r.id_recurso = res.id_recurso 
  AND res.fecha_reserva = CURDATE() 
  AND res.estado = 'Confirmada'
GROUP BY r.id_recurso;

-- ============================================================
COMMIT;
-- ============================================================
