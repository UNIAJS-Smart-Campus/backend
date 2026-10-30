-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-10-2026 a las 20:42:51
-- Versión del servidor: 8.0.46
-- Versión de PHP: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `uajs_smart_campus`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auditoria`
--

CREATE TABLE `auditoria` (
  `id_auditoria` bigint NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `accion` varchar(60) NOT NULL,
  `entidad` varchar(60) NOT NULL,
  `id_entidad` varchar(60) DEFAULT NULL,
  `detalle` varchar(500) DEFAULT '',
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id_config` int NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `seccion` varchar(60) NOT NULL,
  `valor` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id_config`, `id_usuario`, `seccion`, `valor`, `created_at`, `updated_at`) VALUES
(1, 1, 'general', '{\"tema\":\"claro\",\"notificaciones\":true}', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(2, 1, 'notificaciones', '{\"email\":true,\"push\":true,\"resumen\":\"diario\"}', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(3, 1, 'apariencia', '{\"tema\":\"claro\",\"fuente\":\"media\",\"densidad\":\"normal\"}', '2026-09-30 23:00:40', '2026-10-20 03:34:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos_y_actividades`
--

CREATE TABLE `eventos_y_actividades` (
  `id_evento` int NOT NULL,
  `nombre_evento` varchar(150) NOT NULL,
  `descripcion` text,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `ubicacion` varchar(120) NOT NULL,
  `tipo_evento` enum('Académico','Cultural','Deportivo','Formación','Institucional') NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'Programado',
  `id_usuario` int DEFAULT NULL,
  `cupo` int DEFAULT '0',
  `inscritos` int DEFAULT '0',
  `participantes` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `eventos_y_actividades`
--

INSERT INTO `eventos_y_actividades` (`id_evento`, `nombre_evento`, `descripcion`, `fecha`, `hora_inicio`, `hora_fin`, `ubicacion`, `tipo_evento`, `estado`, `id_usuario`, `cupo`, `inscritos`, `created_at`, `updated_at`) VALUES
(1, 'Bienvenida a nuevos estudiantes', 'Acto de bienvenida para el periodo nuevo', '2026-09-15', '08:00:00', '10:00:00', 'Auditorio Principal', 'Académico', 'Programado', 1, 300, 180, '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(2, 'Taller de Emprendimiento', 'Taller de ideas de negocio para estudiantes', '2026-09-18', '14:00:00', '17:00:00', 'Sala de Conferencias 1', 'Formación', 'Programado', 1, 40, 35, '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(3, 'Feria de Empleabilidad', 'Encuentro con empresas aliadas', '2026-09-22', '09:00:00', '13:00:00', 'Auditorio Principal', 'Cultural', 'Programado', 1, 300, 210, '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(4, 'Torneo Deportivo Intercampus', 'Encuentro deportivo entre facultades', '2026-10-02', '07:00:00', '12:00:00', 'Cancha central', 'Deportivo', 'Programado', 1, 120, 60, '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(5, 'Seminario de Investigación', 'Presentación de resultados de investigación', '2026-09-25', '10:00:00', '12:30:00', 'Auditorio VIP', 'Académico', 'Programado', 1, 60, 41, '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(6, 'Concierto de Música Andina', 'Presentación artística de fin de semestre', '2026-10-10', '18:00:00', '21:00:00', 'Auditorio Principal', 'Cultural', 'Programado', 1, 300, 240, '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(7, 'Jornada de Puertas Abiertas', 'Recorrido por instalaciones y programas', '2026-10-05', '09:00:00', '16:00:00', 'Campus principal', 'Académico', 'Programado', 1, 200, 120, '2026-10-17 04:59:51', '2026-10-17 04:59:51'),
(8, 'Taller de Ofimática', 'Introducción a herramientas de productividad', '2026-10-12', '15:00:00', '18:00:00', 'Laboratorio de Informatica 1', 'Formación', 'Programado', 5, 25, 18, '2026-10-17 04:59:51', '2026-10-17 04:59:51'),
(10, 'QA Evento', '', '2026-12-20', '08:00:00', '10:00:00', 'QA', 'Académico', 'Programado', 1, 0, 0, '2026-10-21 22:34:28', '2026-10-21 22:34:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_solicitudes`
--

CREATE TABLE `historial_solicitudes` (
  `id_historial` int NOT NULL,
  `id_solicitud` int NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `estado` varchar(20) DEFAULT NULL,
  `responsable` varchar(120) DEFAULT '',
  `usuario` varchar(120) DEFAULT '',
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `descripcion` varchar(500) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `historial_solicitudes`
--

INSERT INTO `historial_solicitudes` (`id_historial`, `id_solicitud`, `tipo`, `estado`, `responsable`, `usuario`, `fecha`, `descripcion`) VALUES
(1, 1, 'CREACION', 'REGISTRADA', '', 'Andrés Torres', '2026-09-01 09:00:00', 'Solicitud registrada.'),
(2, 1, 'ESTADO', 'EN_REVISION', 'Carlos Méndez', 'Carlos Méndez', '2026-09-01 09:15:00', 'Verificación de disponibilidad y logística del espacio.'),
(3, 1, 'ASIGNACION', 'ASIGNADA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-02 10:30:00', 'Auditorio principal asignado como responsable.'),
(4, 1, 'ESTADO', 'EN_PROCESO', 'Carlos Méndez', 'Carlos Méndez', '2026-09-02 11:05:00', 'Se está confirmando agenda y recursos audiovisuales.'),
(5, 2, 'CREACION', 'REGISTRADA', '', 'Valentina Morales', '2026-09-02 08:20:00', 'Solicitud registrada.'),
(6, 2, 'NOTA', NULL, '', 'Carlos Méndez', '2026-09-02 09:00:00', 'Se solicita documento de identidad adicional.'),
(7, 3, 'CREACION', 'REGISTRADA', '', 'Isabella Ramírez', '2026-09-04 07:40:00', 'Solicitud registrada.'),
(8, 3, 'ESTADO', 'EN_REVISION', 'Carlos Méndez', 'Carlos Méndez', '2026-09-04 08:00:00', 'Verificación de disponibilidad del laboratorio.'),
(9, 3, 'ASIGNACION', 'ASIGNADA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-05 09:10:00', 'Laboratorio asignado para la práctica.'),
(10, 3, 'ESTADO', 'EN_PROCESO', 'Carlos Méndez', 'Carlos Méndez', '2026-09-06 14:00:00', 'Sesión ejecutada con equipos activos.'),
(11, 3, 'ESTADO', 'RESUELTA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-07 16:30:00', 'Reserva cerrada sin incidencias.'),
(12, 4, 'CREACION', 'REGISTRADA', '', 'Camila Herrera', '2026-09-05 10:10:00', 'Solicitud registrada.'),
(13, 5, 'CREACION', 'REGISTRADA', '', 'Daniela Ortiz', '2026-09-06 08:00:00', 'Solicitud registrada.'),
(14, 5, 'ESTADO', 'EN_REVISION', 'Carlos Méndez', 'Carlos Méndez', '2026-09-06 08:30:00', 'Caso asignado a soporte tecnológico.'),
(15, 5, 'ASIGNACION', 'ASIGNADA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-07 09:00:00', 'Técnico responsable definido para la revisión.'),
(16, 5, 'ESTADO', 'EN_PROCESO', 'Carlos Méndez', 'Carlos Méndez', '2026-09-07 11:20:00', 'Diagnóstico inicial de la falla.'),
(17, 5, 'PAUSA', 'PAUSADA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-08 10:00:00', 'En espera de respuesta del proveedor de red.'),
(18, 6, 'CREACION', 'REGISTRADA', '', 'Andrés Torres', '2026-09-08 06:50:00', 'Solicitud registrada.'),
(19, 6, 'ESTADO', 'EN_REVISION', 'Carlos Méndez', 'Carlos Méndez', '2026-09-08 07:15:00', 'Verificación de disponibilidad de equipos.'),
(20, 6, 'ASIGNACION', 'ASIGNADA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-09 08:40:00', 'Dos equipos asignados al evento.'),
(21, 6, 'ESTADO', 'EN_PROCESO', 'Carlos Méndez', 'Carlos Méndez', '2026-09-10 13:00:00', 'Entrega finalizada para la actividad.'),
(22, 6, 'ESTADO', 'RESUELTA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-12 17:20:00', 'Equipos devueltos y revisados.'),
(23, 6, 'ESTADO', 'CERRADA', 'Carlos Méndez', 'Carlos Méndez', '2026-09-13 09:00:00', 'Solicitud cerrada por el sistema.'),
(24, 4, 'ESTADO', 'EN_REVISION', '', 'Andrés Torres', '2026-09-30 23:12:41', 'Revision de prueba'),
(25, 2, 'NOTA', NULL, '', 'Carlos Méndez', '2026-09-30 23:12:46', 'Nota de prueba'),
(26, 7, 'CREACION', 'RADICADA', '', 'QA Probe', '2026-10-21 22:34:28', 'Solicitud registrada.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `info_academica`
--

CREATE TABLE `info_academica` (
  `id_publicacion` int NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `titulo` varchar(200) NOT NULL,
  `categoria` varchar(80) NOT NULL,
  `fecha` date NOT NULL,
  `autor` varchar(120) NOT NULL,
  `contenido` text NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'Publicado',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `programa` varchar(120) NOT NULL DEFAULT 'Toda la comunidad',
  `tipo_vigencia` varchar(20) NOT NULL DEFAULT 'Permanente',
  `vigencia` date DEFAULT NULL,
  `destacado` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `info_academica`
--

INSERT INTO `info_academica` (`id_publicacion`, `id_usuario`, `titulo`, `categoria`, `fecha`, `autor`, `contenido`, `imagen`, `estado`, `created_at`, `updated_at`, `programa`, `tipo_vigencia`, `vigencia`, `destacado`) VALUES
(1, 3, 'Calendario Académico 2026-2', 'Calendario', '2026-09-01', 'Laura Gómez', 'Fechas oficiales del calendario académico del segundo semestre de 2026.', NULL, 'Publicado', '2026-09-30 23:00:40', '2026-10-17 05:02:29', 'Toda la comunidad', 'Hasta', '2026-12-20', 1),
(2, 5, 'Lineamientos de Proyectos', 'Normatividad', '2026-08-20', 'María Fernanda Cárdenas', 'Lineamientos metodológicos para el desarrollo de proyectos de grado.', NULL, 'Publicado', '2026-09-30 23:00:40', '2026-10-17 05:02:29', 'Ingeniería de Software', 'Permanente', NULL, 0),
(3, 1, 'Protocolo de Uso de Espacios', 'Normatividad', '2026-07-15', 'Natalia Rodríguez', 'Protocolo de reserva y uso de espacios académicos de la institución.', NULL, 'Publicado', '2026-09-30 23:00:40', '2026-10-17 03:19:39', 'Toda la comunidad', 'Permanente', NULL, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripciones_eventos`
--

CREATE TABLE `inscripciones_eventos` (
  `id_inscripcion` int NOT NULL,
  `id_evento` int NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_inscripcion` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `inscripciones_eventos`
--

INSERT INTO `inscripciones_eventos` (`id_inscripcion`, `id_evento`, `id_usuario`, `fecha_inscripcion`) VALUES
(1, 1, 4, '2026-09-30 23:00:40'),
(2, 1, 6, '2026-09-30 23:00:40'),
(3, 1, 10, '2026-09-30 23:00:40'),
(4, 1, 14, '2026-09-30 23:00:40'),
(5, 1, 17, '2026-09-30 23:00:40'),
(6, 2, 4, '2026-09-30 23:00:40'),
(7, 2, 6, '2026-09-30 23:00:40'),
(8, 2, 14, '2026-09-30 23:00:40'),
(9, 3, 4, '2026-09-30 23:00:40'),
(10, 3, 10, '2026-09-30 23:00:40'),
(11, 3, 17, '2026-09-30 23:00:40'),
(12, 5, 6, '2026-09-30 23:00:40'),
(13, 5, 14, '2026-09-30 23:00:40'),
(14, 7, 4, '2026-10-17 04:59:51'),
(15, 7, 10, '2026-10-17 04:59:51'),
(16, 7, 19, '2026-10-17 04:59:51'),
(17, 8, 6, '2026-10-17 04:59:51'),
(18, 8, 19, '2026-10-17 04:59:51'),
(19, 8, 20, '2026-10-17 04:59:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id_notificacion` int NOT NULL,
  `id_usuario` int NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo_notificacion` varchar(40) DEFAULT '',
  `icono` varchar(40) DEFAULT '',
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `referencia_tabla` varchar(40) DEFAULT NULL,
  `referencia_id` int DEFAULT NULL,
  `fecha_envio` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `titulo`, `mensaje`, `tipo_notificacion`, `icono`, `leida`, `referencia_tabla`, `referencia_id`, `fecha_envio`) VALUES
(1, 1, 'Solicitud recibida', 'Tu solicitud SOL-2026-001 fue registrada correctamente.', 'solicitud', 'check', 0, NULL, NULL, '2026-09-01 09:00:00'),
(2, 1, 'Reserva confirmada', 'La reserva del Auditorio Principal está confirmada.', 'reserva', 'calendar', 0, NULL, NULL, '2026-09-01 12:30:00'),
(3, 4, 'Solicitud en revisión', 'Tu solicitud está siendo revisada por el área de registro.', 'solicitud', 'clock', 0, NULL, NULL, '2026-09-02 08:20:00'),
(4, 4, 'Evento próximo', 'La bienvenida a nuevos estudiantes será el 15 de septiembre.', 'evento', 'megaphone', 0, NULL, NULL, '2026-09-03 10:00:00'),
(5, 6, 'Recordatorio de taller', 'El taller de emprendimiento comienza a las 2:00 p. m.', 'evento', 'bell', 1, NULL, NULL, '2026-09-04 09:15:00'),
(6, 17, 'Soporte en pausa', 'Tu caso está en espera del proveedor de red.', 'solicitud', 'pause', 0, NULL, NULL, '2026-09-08 10:05:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pqrs`
--

CREATE TABLE `pqrs` (
  `id_pqrs` int NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `tipo` enum('Petición','Queja','Reclamo','Sugerencia') NOT NULL,
  `fecha` date NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'Abierta',
  `descripcion` text NOT NULL,
  `solicitante` varchar(120) NOT NULL DEFAULT '',
  `respuesta` text,
  `fecha_respuesta` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sede` varchar(40) NOT NULL DEFAULT 'SINCELEJO',
  `area` varchar(120) NOT NULL DEFAULT 'PQRS',
  `asunto` varchar(200) NOT NULL DEFAULT '',
  `tipo_perfil` varchar(40) NOT NULL DEFAULT 'Estudiante',
  `tipo_documento` varchar(80) NOT NULL DEFAULT '',
  `identificacion` varchar(30) NOT NULL DEFAULT '',
  `nombre` varchar(120) NOT NULL DEFAULT '',
  `telefono` varchar(30) NOT NULL DEFAULT '',
  `correo` varchar(120) NOT NULL DEFAULT '',
  `prioridad` varchar(20) NOT NULL DEFAULT 'Media',
  `asignado_a` varchar(120) NOT NULL DEFAULT '',
  `adjunto` varchar(255) DEFAULT NULL,
  `historial` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `pqrs`
--

INSERT INTO `pqrs` (`id_pqrs`, `id_usuario`, `tipo`, `fecha`, `estado`, `descripcion`, `respuesta`, `fecha_respuesta`, `created_at`, `updated_at`, `sede`, `area`, `asunto`, `tipo_perfil`, `tipo_documento`, `identificacion`, `nombre`, `telefono`, `correo`, `prioridad`, `asignado_a`, `adjunto`) VALUES
(1, 4, 'Petición', '2026-09-03', 'Resuelta', 'Solicitud de actualización de la información académica en el portal.', 'Información actualizada.', '2026-09-05', '2026-09-30 23:00:40', '2026-10-17 05:02:28', 'SINCELEJO', 'Admisiones y Registro', 'Actualización de datos académicos', 'Estudiante', '', '1023456786', 'Andrés Torres', '3001234504', 'andres.torres@uajs.edu.co', 'Media', 'Admisiones y Registro', NULL),
(2, 6, 'Queja', '2026-09-04', 'En proceso', 'Los proyectores del salón no encienden durante las clases.', NULL, NULL, '2026-09-30 23:00:40', '2026-10-17 05:02:28', 'SINCELEJO', 'Sistemas e Infraestructura TI', 'Proyectores del salón no encienden', 'Estudiante', '', '1023456784', 'Valentina Morales', '3001234506', 'valentina.morales@uajs.edu.co', 'Alta', 'Sistemas e Infraestructura TI', NULL),
(3, 10, 'Reclamo', '2026-09-06', 'Abierta', 'El laboratorio de física no tiene elementos de seguridad disponibles.', NULL, NULL, '2026-09-30 23:00:40', '2026-10-17 05:02:29', 'CARTAGENA', 'Facultad de Ciencias de la Ingeniería', 'Falta de elementos de seguridad en laboratorio', 'Estudiante', '', '1023456780', 'Isabella Ramírez', '3001234510', 'isabella.ramirez@uajs.edu.co', 'Alta', '', NULL),
(4, 14, 'Sugerencia', '2026-09-08', 'Resuelta', 'Habilitar un punto de recarga adicional en la biblioteca.', 'Punto habilitado en piso 2.', '2026-09-10', '2026-09-30 23:00:40', '2026-10-17 05:02:28', 'SINCELEJO', 'Biblioteca', 'Punto de recarga adicional en biblioteca', 'Estudiante', '', '1023456776', 'Camila Herrera', '3001234514', 'camila.herrera@uajs.edu.co', 'Baja', 'Biblioteca', NULL),
(5, 17, 'Petición', '2026-09-10', 'Abierta', 'Solicitar segunda salida del laboratorio por actividades CAMPUS.', NULL, NULL, '2026-09-30 23:00:40', '2026-10-17 05:02:28', 'SINCELEJO', 'Facultad de Ciencias de la Ingeniería', 'Segunda salida del laboratorio para actividades CAMPUS', 'Estudiante', '', '1023456773', 'Daniela Ortiz', '3001234517', 'daniela.ortiz@uajs.edu.co', 'Media', '', NULL),
(8, NULL, 'Queja', '2026-12-01', 'Abierta', 'QA pqrs probe', NULL, NULL, '2026-10-21 22:34:28', '2026-10-21 22:34:28', 'SINCELEJO', 'PQRS', '', 'Estudiante', '', '', '', '', '', 'Media', '', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recursos`
--

CREATE TABLE `recursos` (
  `id_recurso` int NOT NULL,
  `nombre_recurso` varchar(120) NOT NULL,
  `codigo` varchar(40) DEFAULT '',
  `tipo_recurso` enum('Salas','Laboratorios','Auditorios','Equipos') NOT NULL,
  `descripcion` text,
  `ubicacion` varchar(120) NOT NULL,
  `capacidad` int DEFAULT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'Disponible',
  `disponibilidad` varchar(30) NOT NULL DEFAULT 'Disponible',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `recursos`
--

INSERT INTO `recursos` (`id_recurso`, `nombre_recurso`, `codigo`, `tipo_recurso`, `descripcion`, `ubicacion`, `capacidad`, `estado`, `disponibilidad`, `created_at`, `updated_at`) VALUES
(1, 'Auditorio Principal', 'REC-001', 'Auditorios', 'Auditorio para eventos institucionales', 'Edificio A - Piso 1', 300, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(2, 'Sala de Conferencias 1', 'REC-002', 'Salas', 'Sala para reuniones y talleres', 'Edificio B - Piso 2', 40, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(3, 'Sala de Conferencias 2', 'REC-003', 'Salas', 'Sala para reuniones', 'Edificio B - Piso 2', 30, 'Ocupada', 'Ocupada', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(4, 'Laboratorio de Informatica 1', 'REC-004', 'Laboratorios', 'Laboratorio de computación', 'Edificio C - Piso 1', 30, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-10-17 03:19:37'),
(5, 'Laboratorio de Fisica', 'REC-005', 'Laboratorios', 'Laboratorio de prácticas', 'Edificio C - Piso 2', 25, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-10-17 03:19:37'),
(6, 'Proyector Portatil 1', 'REC-006', 'Equipos', 'Proyector para presentaciones', 'Bodega tecnológica', 1, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(7, 'Proyector Portatil 2', 'REC-007', 'Equipos', 'Proyector para presentaciones', 'Bodega tecnológica', 1, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(8, 'Sala de Estudio 1', 'REC-008', 'Salas', 'Sala de estudio individual', 'Biblioteca - Piso 3', 8, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(9, 'Sala de Estudio 2', 'REC-009', 'Salas', 'Sala de estudio individual', 'Biblioteca - Piso 3', 8, 'Mantenimiento', 'Mantenimiento', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(10, 'Auditorio VIP', 'REC-010', 'Auditorios', 'Auditorio pequeño para reuniones', 'Edificio A - Piso 3', 60, 'Disponible', 'Disponible', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(11, 'Sala de Estudio 3', 'REC-011', 'Salas', 'Sala de estudio grupal', 'Biblioteca - Piso 4', 12, 'Disponible', 'Disponible', '2026-10-17 04:59:51', '2026-10-17 04:59:51'),
(12, 'Laboratorio de Química', 'REC-012', 'Laboratorios', 'Laboratorio para prácticas de química', 'Edificio D - Piso 1', 20, 'Disponible', 'Disponible', '2026-10-17 04:59:51', '2026-10-17 04:59:51'),
(13, 'Trípode de Audio', 'REC-013', 'Equipos', 'Micrófonos y mesa de sonido', 'Bodega tecnológica', 1, 'Disponible', 'Disponible', '2026-10-17 04:59:51', '2026-10-17 04:59:51'),
(14, 'Kit Audiovisual', 'REC-014', 'Equipos', 'Cámara, micrófono y luces para eventos', 'Bodega tecnológica', 1, 'En mantenimiento', 'En mantenimiento', '2026-10-17 04:59:51', '2026-10-17 04:59:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id_reserva` int NOT NULL,
  `id_usuario` int NOT NULL,
  `id_recurso` int NOT NULL,
  `fecha_reserva` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `motivo` varchar(500) DEFAULT '',
  `observaciones` varchar(500) DEFAULT '',
  `estado` varchar(30) NOT NULL DEFAULT 'Confirmada',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`id_reserva`, `id_usuario`, `id_recurso`, `fecha_reserva`, `hora_inicio`, `hora_fin`, `motivo`, `observaciones`, `estado`, `created_at`, `updated_at`) VALUES
(1, 4, 1, '2026-09-16', '08:00:00', '11:00:00', 'Bienvenida a nuevos estudiantes', '', 'Confirmada', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(2, 6, 2, '2026-09-18', '14:00:00', '17:00:00', 'Taller de emprendimiento', '', 'Confirmada', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(3, 10, 4, '2026-09-19', '09:00:00', '12:00:00', 'Práctica de redes', '', 'Confirmada', '2026-09-30 23:00:40', '2026-10-17 03:19:39'),
(4, 14, 10, '2026-09-25', '10:00:00', '12:30:00', 'Seminario de investigación', '', 'Confirmada', '2026-09-30 23:00:40', '2026-10-17 03:19:39'),
(5, 17, 3, '2026-09-17', '09:00:00', '11:00:00', 'Reunión de proyecto', '', 'Pendiente', '2026-09-30 23:00:40', '2026-10-17 03:19:39'),
(6, 4, 6, '2026-09-22', '08:00:00', '18:00:00', 'Feria de empleabilidad', '', 'Confirmada', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(7, 6, 7, '2026-09-22', '08:00:00', '18:00:00', 'Feria de empleabilidad', '', 'Confirmada', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(8, 10, 5, '2026-09-21', '10:00:00', '13:00:00', 'Práctica de física', '', 'Cancelada', '2026-09-30 23:00:40', '2026-10-17 03:19:39'),
(9, 14, 8, '2026-09-20', '07:00:00', '09:00:00', 'Sesión de estudio', '', 'Confirmada', '2026-09-30 23:00:40', '2026-10-17 03:19:39'),
(10, 17, 2, '2026-09-23', '15:00:00', '17:00:00', 'Taller grupal', '', 'Pendiente', '2026-09-30 23:00:40', '2026-09-30 23:00:40'),
(11, 4, 10, '2026-09-24', '09:00:00', '11:00:00', 'Reunión de coordinación', '', 'Confirmada', '2026-09-30 23:00:40', '2026-10-17 03:19:39'),
(12, 6, 4, '2026-09-26', '14:00:00', '17:00:00', 'Práctica de bases de datos', '', 'Confirmada', '2026-09-30 23:00:40', '2026-10-17 03:19:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int NOT NULL,
  `nombre_rol` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`, `descripcion`, `created_at`) VALUES
(1, 'Administrador', 'Acceso total al sistema', '2026-09-30 23:00:40'),
(2, 'Estudiante', 'Comunidad estudiantil', '2026-09-30 23:00:40'),
(3, 'Docente', 'Personal docente', '2026-09-30 23:00:40'),
(4, 'Administrativo', 'Personal administrativo', '2026-09-30 23:00:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id_servicio` int NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id_servicio`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'Solicitudes', 'Peticiones y trámites académicos', 'Activo'),
(2, 'Reservas', 'Reservas de espacios y equipos', 'Activo'),
(3, 'Eventos', 'Eventos y actividades institucionales', 'Activo'),
(4, 'Recursos', 'Préstamos de recursos', 'Activo'),
(5, 'PQRS', 'Peticiones, quejas y reclamos', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes`
--

CREATE TABLE `solicitudes` (
  `id_solicitud` int NOT NULL,
  `codigo` varchar(30) DEFAULT '',
  `tipo` varchar(120) NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `id_servicio` int DEFAULT NULL,
  `id_responsable` int DEFAULT NULL,
  `prioridad` enum('Baja','Media','Alta') DEFAULT 'Media',
  `dependencia` varchar(120) DEFAULT '',
  `fecha_solicitud` date DEFAULT (curdate()),
  `descripcion` text NOT NULL,
  `solicitante` varchar(120) DEFAULT '',
  `estado` varchar(20) NOT NULL DEFAULT 'REGISTRADA',
  `respuesta` text,
  `historial` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `solicitudes`
--

INSERT INTO `solicitudes` (`id_solicitud`, `codigo`, `tipo`, `id_usuario`, `id_servicio`, `id_responsable`, `prioridad`, `dependencia`, `fecha_solicitud`, `descripcion`, `solicitante`, `estado`, `respuesta`, `created_at`, `updated_at`) VALUES
(1, 'SOL-2026-001', 'Reserva de auditorio', 4, 2, 2, 'Media', 'Bienestar Universitario', '2026-09-01', 'Reserva del auditorio principal para la cátedra de inteligencia artificial aplicada.', 'Andrés Torres', 'EN_PROCESO', 'Se está confirmando agenda y recursos audiovisuales.', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(2, 'SOL-2026-002', 'Constancia académica', 6, 1, NULL, 'Alta', 'Registro y Control', '2026-09-02', 'Solicitud de constancia de notas para trámites administrativos del semestre actual.', 'Valentina Morales', 'EN_REVISION', '', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(3, 'SOL-2026-003', 'Reserva de laboratorio', 10, 2, 2, 'Media', 'Laboratorios', '2026-09-04', 'Uso del laboratorio de informática 3 para práctica de redes y configuración básica.', 'Isabella Ramírez', 'RESUELTA', 'Reserva cerrada sin incidencias.', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(4, 'SOL-2026-004', 'Inscripción a evento', 14, 3, NULL, 'Baja', 'Bienestar Universitario', '2026-09-05', 'Inscripción al taller de emprendimiento y liderazgo del programa académico.', 'Camila Herrera', 'EN_REVISION', '', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(5, 'SOL-2026-005', 'Soporte técnico', 17, 5, 2, 'Alta', 'Infraestructura Tecnológica', '2026-09-06', 'Reporte de fallas en los equipos del laboratorio de sistemas y conexión a red.', 'Daniela Ortiz', 'PAUSADA', 'En espera de respuesta del proveedor de red.', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(6, 'SOL-2026-006', 'Préstamo de equipos', 4, 4, 2, 'Media', 'Logística', '2026-09-08', 'Préstamo de dos proyectores para la feria de empleabilidad y actividades de ingreso.', 'Andrés Torres', 'CERRADA', 'Equipos devueltos y revisados.', '2026-09-30 23:00:40', '2026-10-17 03:19:38'),
(7, '', 'Certificado', NULL, NULL, NULL, 'Media', '', '2026-10-21', 'QA solicitud', 'QA Probe', 'RADICADA', '', '2026-10-21 22:34:28', '2026-10-21 22:34:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL,
  `identificacion` varchar(50) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `cedula` varchar(20) DEFAULT NULL,
  `contraseña` varchar(120) NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `apellido` varchar(80) NOT NULL DEFAULT '',
  `correo` varchar(120) NOT NULL,
  `telefono` varchar(30) DEFAULT '',
  `id_rol` int NOT NULL DEFAULT '2',
  `tipo_usuario` varchar(50) DEFAULT 'Estudiante',
  `programa` varchar(120) DEFAULT '',
  `cargo` varchar(120) DEFAULT '',
  `campus` varchar(80) DEFAULT 'Campus principal',
  `foto_perfil` varchar(255) DEFAULT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'Activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reset_token` varchar(64) DEFAULT NULL,
  `reset_expira` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `identificacion`, `usuario`, `cedula`, `contraseña`, `nombre`, `apellido`, `correo`, `telefono`, `id_rol`, `tipo_usuario`, `programa`, `cargo`, `campus`, `foto_perfil`, `estado`, `created_at`, `updated_at`, `reset_token`, `reset_expira`) VALUES
(1, 'admin', 'admin', '1023456789', '$2a$10$mY6PGsh03VzUqdqUv2dOsuKfb0BB6E5VRw1lBXdPA.Omo5u1HPRja', 'Natalia', 'Rodríguez', 'natalia.rodriguez@uajs.edu.co', '3001234501', 1, 'Administrador', 'Dirección Académica', 'Coordinadora general', 'Campus principal', 'https://api.dicebear.com/7.x/initials/svg?seed=NR', 'Activo', '2026-09-30 23:00:40', '2026-10-21 23:19:42', NULL, NULL),
(2, 'funcionario', 'funcionario', '1023456788', '$2b$10$0xd66BZ.LmIpfMtA2lwgYORJ6zN77loShn9bbzoM14ethQ8K/LUl.', 'Carlos', 'Méndez', 'carlos.mendez@uajs.edu.co', '3001234502', 4, 'Administrativo', 'Bienestar Universitario', 'Analista de servicios', 'Campus Norte', 'https://api.dicebear.com/7.x/initials/svg?seed=CM', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(3, 'profesor', 'profesor', '1023456787', '$2b$10$eTSIfdRx9JvoMQqpeaEk.uMoZMtPiRaW9p6EJLfPCl2I2H8cYMXd.', 'Laura', 'Gómez', 'laura.gomez@uajs.edu.co', '3001234503', 3, 'Docente', 'Matemáticas', 'Docente titular', 'Campus central', 'https://api.dicebear.com/7.x/initials/svg?seed=LG', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(4, 'estudiante', 'estudiante', '1023456786', '$2b$10$9PhdDHIrhjAC.4AzuA2Npuyp69sIYhTd5JTeFVfAn5FF00Jx2.Ktq', 'Andrés', 'Torres', 'andres.torres@uajs.edu.co', '3001234504', 2, 'Estudiante', 'Ingeniería de Sistemas', 'Estudiante', 'Campus central', 'https://api.dicebear.com/7.x/initials/svg?seed=AT', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(5, 'docente2', 'docente2', '1023456785', '$2b$10$/./s5cPZlUM/Dn2p6l/ZGO1I4b89oB14WCDYq.dGPaIpbDOSIcQtO', 'María Fernanda', 'Cárdenas', 'mf.cardenas@uajs.edu.co', '3001234505', 3, 'Docente', 'Ingeniería de Software', 'Profesora de proyectos', 'Campus principal', 'https://api.dicebear.com/7.x/initials/svg?seed=MC', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(6, 'estudiante2', 'estudiante2', '1023456784', '$2b$10$ggWijrvImYiutiWGQsoIDOeg7UYPXmIuGHQOAMPleCM0OrJUJvdwe', 'Valentina', 'Morales', 'valentina.morales@uajs.edu.co', '3001234506', 2, 'Estudiante', 'Administración de Empresas', 'Estudiante', 'Campus occidente', 'https://api.dicebear.com/7.x/initials/svg?seed=VM', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(7, 'admin2', 'admin2', '1023456783', '$2b$10$ZMBrdGNZlUQ3zjIpxN5EpuwuxKaVO.1HhTY4eWgPwwflnXecELTPW', 'Javier', 'Álvarez', 'javier.alvarez@uajs.edu.co', '3001234507', 1, 'Administrador', 'Tecnología e innovación', 'Director de operación', 'Campus principal', 'https://api.dicebear.com/7.x/initials/svg?seed=JA', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(8, 'admvo', 'admvo', '1023456782', '$2b$10$K5xCFspjxugRZ9t5PqH3C.VOkKVurobC8mZWKA0HZzV8RDdiAK3Ei', 'Sofía', 'Jiménez', 'sofia.jimenez@uajs.edu.co', '3001234508', 4, 'Administrativo', 'Servicios estudiantiles', 'Coordinadora administrativa', 'Campus centro', 'https://api.dicebear.com/7.x/initials/svg?seed=SJ', 'Inactivo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(9, 'docente3', 'docente3', '1023456781', '$2b$10$HGZSfXjUjLQfflE7OAY0e.62hNPYSSEAwOy/Cn1Dy/.hqij.5mfOW', 'Ricardo', 'Torres', 'ricardo.torres@uajs.edu.co', '3001234509', 3, 'Docente', 'Física', 'Docente de laboratorio', 'Campus central', 'https://api.dicebear.com/7.x/initials/svg?seed=RT', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(10, 'estudiante3', 'estudiante3', '1023456780', '$2b$10$Scwvrt3iuFP5v8D2n0HOWONBRMYzyKMGBedoZbUuRa.ivzZraX8Zm', 'Isabella', 'Ramírez', 'isabella.ramirez@uajs.edu.co', '3001234510', 2, 'Estudiante', 'Ingeniería Civil', 'Estudiante', 'Campus Norte', 'https://api.dicebear.com/7.x/initials/svg?seed=IR', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(11, 'admin3', 'admin3', '1023456779', '$2b$10$JqJ7zx.og7gz0nfD3vNwOOEPzeRr0mR0dx/alBPtJ6IasBfN3O2Tu', 'Andrés', 'Gutiérrez', 'andres.gutierrez@uajs.edu.co', '3001234511', 1, 'Administrador', 'Tecnologías de la información', 'Director de sistemas', 'Campus principal', 'https://api.dicebear.com/7.x/initials/svg?seed=AG', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(12, 'admvo2', 'admvo2', '1023456778', '$2b$10$zcNHmbV3hIp9QWzcAfNJjedp0qLHDNSaBlyEFbMiQlolXI3W6iWHi', 'Paula', 'Vargas', 'paula.vargas@uajs.edu.co', '3001234512', 4, 'Administrativo', 'Recursos Humanos', 'Analista de talento humano', 'Campus occidente', 'https://api.dicebear.com/7.x/initials/svg?seed=PV', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(13, 'docente4', 'docente4', '1023456777', '$2b$10$yDtqeMqPAMXfsuwHGoeSuecY7.jZI7BgunM8X04MjIaSE59yDtc7G', 'Fernando', 'Castillo', 'fernando.castillo@uajs.edu.co', '3001234513', 3, 'Docente', 'Economía', 'Docente titular', 'Campus central', 'https://api.dicebear.com/7.x/initials/svg?seed=FC', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(14, 'estudiante4', 'estudiante4', '1023456776', '$2b$10$f1XEQJfMdka6/jwR1FGuYeyIrcgJmBP/lPT2YzUCMeH9qUcELaTIS', 'Camila', 'Herrera', 'camila.herrera@uajs.edu.co', '3001234514', 2, 'Estudiante', 'Derecho', 'Estudiante', 'Campus centro', 'https://api.dicebear.com/7.x/initials/svg?seed=CH', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(15, 'admin4', 'admin4', '1023456775', '$2b$10$CARolFuz.Z4QtCO7KRmuO.Lm1.uyT8cmQ6DRYuBZBuj075On9xlx.', 'Luisa', 'Cardona', 'luisa.cardona@uajs.edu.co', '3001234515', 1, 'Administrador', 'Administración', 'Rectora', 'Campus principal', 'https://api.dicebear.com/7.x/initials/svg?seed=LC', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(16, 'docente5', 'docente5', '1023456774', '$2b$10$.X8lPrniPyF92M5CJu2D2eU/0wwTbAv4WiOdPTGwHKsLNSxxovnQa', 'Sebastián', 'Rojas', 'sebastian.rojas@uajs.edu.co', '3001234516', 3, 'Docente', 'Idiomas', 'Docente de inglés', 'Campus occidente', 'https://api.dicebear.com/7.x/initials/svg?seed=SR', 'Inactivo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(17, 'estudiante5', 'estudiante5', '1023456773', '$2b$10$spzAFQi1EgNrRuYn3wsIN.yMdskol3uk1pPeuEMs044OwBVMSShOW', 'Daniela', 'Ortiz', 'daniela.ortiz@uajs.edu.co', '3001234517', 2, 'Estudiante', 'Psicología', 'Estudiante', 'Campus Norte', 'https://api.dicebear.com/7.x/initials/svg?seed=DO', 'Activo', '2026-09-30 23:00:40', '2026-10-17 03:19:37', NULL, NULL),
(18, 'docente6', 'docente6', '1023456772', '$2b$10$QDihPhHNRhbWwzqVHk/mYOf8ExUayC3DyVwX0xrywsjGSQzn21uhu', 'Oscar', 'Navas', 'oscar.navas@uajs.edu.co', '3001234518', 3, 'Docente', 'Ingeniería Industrial', 'Coordinador de laboratorio', 'Campus principal', 'https://api.dicebear.com/7.x/initials/svg?seed=ON', 'Activo', '2026-10-17 04:59:51', '2026-10-17 04:59:51', NULL, NULL),
(19, 'estudiante6', 'estudiante6', '1023456771', '$2b$10$so1Tes5WXnxzJjcc2ocoZ.aQ7uHuVElM64scKguSWYc2pWnAYg/5K', 'Mateo', 'Rengifo', 'mateo.rengifo@uajs.edu.co', '3001234519', 2, 'Estudiante', 'Administración de Empresas', 'Estudiante', 'Campus central', 'https://api.dicebear.com/7.x/initials/svg?seed=MR', 'Activo', '2026-10-17 04:59:51', '2026-10-17 04:59:51', NULL, NULL),
(20, 'estudiante7', 'estudiante7', '1023456770', '$2b$10$XEvWMbDYCicNAeo8xBIZOuYUyK7FGV0U1I3gniR.e07n9eLpZwIqK', 'Catalina', 'Salinas', 'catalina.salinas@uajs.edu.co', '3001234520', 2, 'Estudiante', 'Ingeniería de Sistemas', 'Estudiante', 'Campus Norte', 'https://api.dicebear.com/7.x/initials/svg?seed=CS', 'Activo', '2026-10-17 04:59:51', '2026-10-17 04:59:51', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_reservas_detalle`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_reservas_detalle` (
`id_reserva` int
,`id_usuario` int
,`id_recurso` int
,`fecha_reserva` date
,`hora_inicio` time
,`hora_fin` time
,`motivo` varchar(500)
,`observaciones` varchar(500)
,`estado` varchar(30)
,`created_at` timestamp
,`updated_at` timestamp
,`usuario_nombre` varchar(80)
,`nombre_recurso` varchar(120)
,`tipo_recurso` enum('Salas','Laboratorios','Auditorios','Equipos')
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_solicitudes_detalle`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_solicitudes_detalle` (
`id_solicitud` int
,`codigo` varchar(30)
,`tipo` varchar(120)
,`id_usuario` int
,`id_servicio` int
,`id_responsable` int
,`prioridad` enum('Baja','Media','Alta')
,`dependencia` varchar(120)
,`fecha_solicitud` date
,`descripcion` text
,`solicitante` varchar(120)
,`estado` varchar(20)
,`respuesta` text
,`created_at` timestamp
,`updated_at` timestamp
,`usuario_nombre` varchar(80)
,`usuario_apellido` varchar(80)
,`servicio_nombre` varchar(80)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_reservas_detalle`
--
DROP TABLE IF EXISTS `v_reservas_detalle`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_reservas_detalle`  AS SELECT `r`.`id_reserva` AS `id_reserva`, `r`.`id_usuario` AS `id_usuario`, `r`.`id_recurso` AS `id_recurso`, `r`.`fecha_reserva` AS `fecha_reserva`, `r`.`hora_inicio` AS `hora_inicio`, `r`.`hora_fin` AS `hora_fin`, `r`.`motivo` AS `motivo`, `r`.`observaciones` AS `observaciones`, `r`.`estado` AS `estado`, `r`.`created_at` AS `created_at`, `r`.`updated_at` AS `updated_at`, `u`.`nombre` AS `usuario_nombre`, `rec`.`nombre_recurso` AS `nombre_recurso`, `rec`.`tipo_recurso` AS `tipo_recurso` FROM ((`reservas` `r` left join `usuarios` `u` on((`r`.`id_usuario` = `u`.`id_usuario`))) left join `recursos` `rec` on((`r`.`id_recurso` = `rec`.`id_recurso`))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_solicitudes_detalle`
--
DROP TABLE IF EXISTS `v_solicitudes_detalle`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_solicitudes_detalle`  AS SELECT `s`.`id_solicitud` AS `id_solicitud`, `s`.`codigo` AS `codigo`, `s`.`tipo` AS `tipo`, `s`.`id_usuario` AS `id_usuario`, `s`.`id_servicio` AS `id_servicio`, `s`.`id_responsable` AS `id_responsable`, `s`.`prioridad` AS `prioridad`, `s`.`dependencia` AS `dependencia`, `s`.`fecha_solicitud` AS `fecha_solicitud`, `s`.`descripcion` AS `descripcion`, `s`.`solicitante` AS `solicitante`, `s`.`estado` AS `estado`, `s`.`respuesta` AS `respuesta`, `s`.`created_at` AS `created_at`, `s`.`updated_at` AS `updated_at`, `u`.`nombre` AS `usuario_nombre`, `u`.`apellido` AS `usuario_apellido`, `sv`.`nombre` AS `servicio_nombre` FROM ((`solicitudes` `s` left join `usuarios` `u` on((`s`.`id_usuario` = `u`.`id_usuario`))) left join `servicios` `sv` on((`s`.`id_servicio` = `sv`.`id_servicio`))) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  ADD PRIMARY KEY (`id_auditoria`),
  ADD KEY `idx_auditoria_usuario` (`id_usuario`),
  ADD KEY `idx_auditoria_fecha` (`fecha`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id_config`),
  ADD UNIQUE KEY `uq_config` (`id_usuario`,`seccion`);

--
-- Indices de la tabla `eventos_y_actividades`
--
ALTER TABLE `eventos_y_actividades`
  ADD PRIMARY KEY (`id_evento`),
  ADD KEY `fk_eventos_usuario` (`id_usuario`),
  ADD KEY `idx_eventos_fecha` (`fecha`);

--
-- Indices de la tabla `historial_solicitudes`
--
ALTER TABLE `historial_solicitudes`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `idx_historial_solicitud` (`id_solicitud`);

--
-- Indices de la tabla `info_academica`
--
ALTER TABLE `info_academica`
  ADD PRIMARY KEY (`id_publicacion`),
  ADD KEY `fk_info_academica_usuario` (`id_usuario`),
  ADD KEY `idx_info_academica_fecha` (`fecha`);

--
-- Indices de la tabla `inscripciones_eventos`
--
ALTER TABLE `inscripciones_eventos`
  ADD PRIMARY KEY (`id_inscripcion`),
  ADD UNIQUE KEY `uq_inscripcion` (`id_evento`,`id_usuario`),
  ADD KEY `fk_inscripciones_usuario` (`id_usuario`),
  ADD KEY `idx_inscripciones_evento_fecha` (`id_evento`,`fecha_inscripcion`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `idx_notificaciones_usuario_leida` (`id_usuario`,`leida`),
  ADD KEY `idx_notificaciones_usuario_fecha` (`id_usuario`,`fecha_envio`);

--
-- Indices de la tabla `pqrs`
--
ALTER TABLE `pqrs`
  ADD PRIMARY KEY (`id_pqrs`),
  ADD KEY `fk_pqrs_usuario` (`id_usuario`),
  ADD KEY `idx_pqrs_estado` (`estado`);

--
-- Indices de la tabla `recursos`
--
ALTER TABLE `recursos`
  ADD PRIMARY KEY (`id_recurso`),
  ADD KEY `idx_recursos_tipo` (`tipo_recurso`),
  ADD KEY `idx_recursos_disponibilidad` (`disponibilidad`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id_reserva`),
  ADD UNIQUE KEY `uq_reserva` (`id_recurso`,`fecha_reserva`,`hora_inicio`),
  ADD KEY `fk_reservas_usuario` (`id_usuario`),
  ADD KEY `idx_reservas_fecha` (`fecha_reserva`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre_rol` (`nombre_rol`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id_servicio`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `fk_solicitudes_servicio` (`id_servicio`),
  ADD KEY `fk_solicitudes_responsable` (`id_responsable`),
  ADD KEY `idx_solicitudes_estado` (`estado`),
  ADD KEY `idx_solicitudes_usuario` (`id_usuario`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `identificacion` (`identificacion`),
  ADD UNIQUE KEY `usuario` (`usuario`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `idx_usuarios_estado` (`estado`),
  ADD KEY `idx_usuarios_rol` (`id_rol`),
  ADD KEY `idx_usuarios_estado_rol` (`estado`,`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  MODIFY `id_auditoria` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id_config` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `eventos_y_actividades`
--
ALTER TABLE `eventos_y_actividades`
  MODIFY `id_evento` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `historial_solicitudes`
--
ALTER TABLE `historial_solicitudes`
  MODIFY `id_historial` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `info_academica`
--
ALTER TABLE `info_academica`
  MODIFY `id_publicacion` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `inscripciones_eventos`
--
ALTER TABLE `inscripciones_eventos`
  MODIFY `id_inscripcion` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `pqrs`
--
ALTER TABLE `pqrs`
  MODIFY `id_pqrs` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `recursos`
--
ALTER TABLE `recursos`
  MODIFY `id_recurso` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id_reserva` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id_servicio` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  MODIFY `id_solicitud` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD CONSTRAINT `fk_configuracion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `eventos_y_actividades`
--
ALTER TABLE `eventos_y_actividades`
  ADD CONSTRAINT `fk_eventos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `historial_solicitudes`
--
ALTER TABLE `historial_solicitudes`
  ADD CONSTRAINT `fk_historial_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`) ON DELETE CASCADE;

--
-- Filtros para la tabla `info_academica`
--
ALTER TABLE `info_academica`
  ADD CONSTRAINT `fk_info_academica_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `inscripciones_eventos`
--
ALTER TABLE `inscripciones_eventos`
  ADD CONSTRAINT `fk_inscripciones_evento` FOREIGN KEY (`id_evento`) REFERENCES `eventos_y_actividades` (`id_evento`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_inscripciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pqrs`
--
ALTER TABLE `pqrs`
  ADD CONSTRAINT `fk_pqrs_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `fk_reservas_recurso` FOREIGN KEY (`id_recurso`) REFERENCES `recursos` (`id_recurso`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reservas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD CONSTRAINT `fk_solicitudes_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_solicitudes_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_solicitudes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
