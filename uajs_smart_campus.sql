-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 28-08-2026 a las 01:44:13
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

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
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id_config` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `seccion` varchar(50) NOT NULL,
  `valor` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`valor`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos_y_actividades`
--

CREATE TABLE `eventos_y_actividades` (
  `id_evento` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre_evento` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `cupo` int(11) NOT NULL,
  `inscritos` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `tipo_evento` varchar(50) NOT NULL,
  `estado` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `eventos_y_actividades`
--

INSERT INTO `eventos_y_actividades` (`id_evento`, `id_usuario`, `nombre_evento`, `descripcion`, `cupo`, `inscritos`, `fecha`, `hora_inicio`, `hora_fin`, `ubicacion`, `tipo_evento`, `estado`) VALUES
(1, 1, 'Semana de la Ingeniería', 'Jornada de conferencias y talleres con invitados del sector productivo.', 120, 104, '2026-08-20', '09:00:00', '18:00:00', 'Auditorio principal', 'Académico', 'Finalizado'),
(2, 1, 'Seminario de investigación aplicada', 'Presentación de proyectos de investigación de estudiantes y docentes.', 40, 38, '2026-08-22', '14:00:00', '17:00:00', 'Salón 205', 'Académico', 'Finalizado'),
(3, 3, 'Foro estudiantil', 'Espacio de diálogo sobre la vida universitaria y bienestar estudiantil.', 80, 52, '2026-08-25', '10:00:00', '12:00:00', 'Auditorio B', 'Cultural', 'Activo'),
(4, 1, 'Feria universitaria 2026', 'Exposición de programas académicos, servicios y emprendimientos estudiantiles.', 200, 176, '2026-08-28', '08:00:00', '16:00:00', 'Patio central', 'Cultural', 'Activo'),
(5, 3, 'Taller de emprendimiento', 'Taller práctico para la creación de planes de negocio.', 30, 12, '2026-09-02', '15:00:00', '18:00:00', 'Laboratorio de informática 1', 'Formación', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `info_academica`
--

CREATE TABLE `info_academica` (
  `id_publicacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `fecha` date NOT NULL,
  `autor` varchar(100) NOT NULL,
  `contenido` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `info_academica`
--

INSERT INTO `info_academica` (`id_publicacion`, `id_usuario`, `titulo`, `categoria`, `fecha`, `autor`, `contenido`) VALUES
(1, 3, 'Convocatoria periodo académico 2026-1', 'Convocatoria', '2026-03-15', 'Laura Gómez', 'Se abre el período de inscripción para el primer semestre 2026. Los estudiantes deberán completar su matrícula antes del 28 de marzo.'),
(2, 3, 'Taller de Metodología de Investigación', 'Taller', '2026-04-10', 'Laura Gómez', 'Se realizará un taller práctico sobre métodos de investigación cuantitativa y cualitativa para estudiantes de posgrado.'),
(3, 3, 'Resultados parciales Cálculo I', 'Resultado', '2026-04-22', 'Laura Gómez', 'Se publican los resultados del primer parcial de Cálculo I. Los estudiantes pueden revisar en la plataforma académica.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` datetime NOT NULL,
  `tipo_notificacion` varchar(50) DEFAULT NULL,
  `icono` varchar(50) NOT NULL,
  `leida` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `titulo`, `mensaje`, `fecha_envio`, `tipo_notificacion`, `icono`, `leida`) VALUES
(1, 4, 'Solicitud', 'Tu solicitud SOL-2026-001 cambió al estado En proceso.', '2026-08-14 00:00:00', 'Solicitud', 'solicitudes', 0),
(2, 4, 'Reserva', 'Reserva del auditorio principal confirmada para el 18 de agosto.', '2026-08-13 00:00:00', 'Reserva', 'reservas', 0),
(3, 1, 'Evento', 'Nuevo evento: Seminario de investigación aplicada.', '2026-08-12 00:00:00', 'Evento', 'eventos', 1),
(4, 7, 'Solicitud', 'Tu PQRS SOL-2026-005 fue asignada al técnico responsable.', '2026-08-11 00:00:00', 'Solicitud', 'solicitudes', 0),
(5, 5, 'Reserva', 'Recordatorio: tu reserva del laboratorio de química vence mañana.', '2026-08-10 00:00:00', 'Reserva', 'reservas', 1),
(6, 1, 'Evento', 'Publicación: Convocatoria a la feria universitaria 2026.', '2026-08-08 00:00:00', 'Evento', 'eventos', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pqrs`
--

CREATE TABLE `pqrs` (
  `id_pqrs` varchar(20) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `fecha` date NOT NULL,
  `estado` varchar(30) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pqrs`
--

INSERT INTO `pqrs` (`id_pqrs`, `tipo`, `fecha`, `estado`, `descripcion`) VALUES
('PQRS-2026-011', 'Reclamo', '2026-08-02', 'Asignada', 'Reclamo por el estado de los equipos del laboratorio de informática 2.'),
('PQRS-2026-012', 'Sugerencia', '2026-08-05', 'Cerrada', 'Sugerencia para ampliar los horarios de atención de la biblioteca.'),
('PQRS-2026-013', 'Petición', '2026-08-09', 'Resuelta', 'Solicitud de información sobre el proceso de homologación.'),
('PQRS-2026-014', 'Queja', '2026-08-12', 'En revisión', 'Queja por la demora en la entrega de constancias académicas.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recursos`
--

CREATE TABLE `recursos` (
  `id_recurso` int(11) NOT NULL,
  `nombre_recurso` varchar(100) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `tipo_recurso` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `capacidad` int(11) DEFAULT NULL,
  `estado` varchar(30) NOT NULL,
  `disponibilidad` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recursos`
--

INSERT INTO `recursos` (`id_recurso`, `nombre_recurso`, `codigo`, `tipo_recurso`, `descripcion`, `ubicacion`, `capacidad`, `estado`, `disponibilidad`) VALUES
(1, 'Salón 101', 'REC-101', 'Salas', 'Salón de clase estándar', 'Bloque A · Piso 1', 40, 'Activo', 'Disponible'),
(2, 'Salón 205', 'REC-205', 'Salas', 'Salón de clase estándar', 'Bloque A · Piso 2', 30, 'Activo', 'Ocupado'),
(3, 'Laboratorio de informática 1', 'REC-LAB1', 'Laboratorios', 'Laboratorio con equipos de cómputo', 'Bloque B · Piso 1', 25, 'Activo', 'Disponible'),
(4, 'Laboratorio de química', 'REC-LABQ', 'Laboratorios', 'Laboratorio de prácticas de química', 'Bloque B · Piso 2', 20, 'En mantenimiento', 'Ocupado'),
(5, 'Auditorio principal', 'REC-AUD1', 'Auditorios', 'Auditorio principal del campus', 'Bloque C', 300, 'Activo', 'Disponible'),
(6, 'Auditorio B', 'REC-AUD2', 'Auditorios', 'Auditorio secundario', 'Bloque C · Piso 2', 120, 'Activo', 'Ocupado'),
(7, 'Video proyector', 'REC-EQ1', 'Equipos', 'Proyector de video para presentaciones', 'Bodega de tecnología', 1, 'Activo', 'Disponible'),
(8, 'Computador portátil', 'REC-EQ2', 'Equipos', 'Portátil para préstamo', 'Bodega de tecnología', 1, 'Inactivo', 'Ocupado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id_reserva` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_recurso` int(11) NOT NULL,
  `fecha_reserva` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `estado` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`id_reserva`, `id_usuario`, `id_recurso`, `fecha_reserva`, `hora_inicio`, `hora_fin`, `motivo`, `estado`) VALUES
(1, 1, 1, '2026-08-18', '08:00:00', '10:00:00', 'Semana de la Ingeniería', 'Confirmada'),
(2, 5, 3, '2026-08-20', '14:00:00', '17:00:00', 'Seminario de investigación', 'Pendiente'),
(3, 4, 5, '2026-08-20', '09:00:00', '18:00:00', 'Semana de la Ingeniería', 'Confirmada'),
(4, 5, 4, '2026-08-21', '08:00:00', '12:00:00', 'Práctica de laboratorio', 'Cancelada'),
(5, 6, 2, '2026-08-22', '14:00:00', '17:00:00', 'Seminario de investigación', 'Confirmada'),
(6, 8, 7, '2026-08-25', '10:00:00', '12:00:00', 'Foro estudiantil', 'Pendiente'),
(7, 1, 1, '2026-08-18', '08:00:00', '10:00:00', 'Semana de la Ingeniería', 'Confirmada'),
(8, 5, 3, '2026-08-20', '14:00:00', '17:00:00', 'Seminario de investigación', 'Pendiente'),
(9, 4, 5, '2026-08-20', '09:00:00', '18:00:00', 'Semana de la Ingeniería', 'Confirmada'),
(10, 5, 4, '2026-08-21', '08:00:00', '12:00:00', 'Práctica de laboratorio', 'Cancelada'),
(11, 6, 2, '2026-08-22', '14:00:00', '17:00:00', 'Seminario de investigación', 'Confirmada'),
(12, 8, 7, '2026-08-25', '10:00:00', '12:00:00', 'Foro estudiantil', 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` varchar(50) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `estado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`, `descripcion`, `estado`) VALUES
(1, 'Administrador', 'Gestiona el sistema y sus usuarios.', 'Activo'),
(2, 'Estudiante', 'Usuario que pertenece a la comunidad estudiantil.', 'Activo'),
(3, 'Docente', 'Usuario encargado de actividades académicas.', 'Activo'),
(4, 'Administrativo', 'Personal administrativo de la universidad.', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id_servicio` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id_servicio`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'Solicitudes', 'Registra y da seguimiento a tus solicitudes de servicios académicos.', 'Activo'),
(2, 'Reservas', 'Reserva salones, laboratorios, auditorios y equipos del campus.', 'Activo'),
(3, 'Recursos', 'Consulta los recursos disponibles de la universidad.', 'Activo'),
(4, 'Eventos', 'Descubre las actividades y eventos organizados por la comunidad.', 'Activo'),
(5, 'Notificaciones', 'Recibe avisos de cambios de estado, reservas y eventos.', 'Activo'),
(6, 'PQRS', 'Presenta peticiones, quejas, reclamos y sugerencias.', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes`
--

CREATE TABLE `solicitudes` (
  `id_solicitud` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `id_servicio` int(11) DEFAULT NULL,
  `fecha_solicitud` datetime DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `solicitante` varchar(100) NOT NULL,
  `estado` varchar(30) DEFAULT NULL,
  `respuesta` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitudes`
--

INSERT INTO `solicitudes` (`id_solicitud`, `codigo`, `tipo`, `id_usuario`, `id_servicio`, `fecha_solicitud`, `descripcion`, `solicitante`, `estado`, `respuesta`) VALUES
(1, 'SOL-2026-001', 'Reserva de auditorio', 4, 1, '2026-08-10 00:00:00', 'Reserva del auditorio principal para la semana de ingeniería.', 'Natalia Rodríguez', 'En proceso', ''),
(2, 'SOL-2026-002', 'Constancia académica', 2, 1, '2026-08-12 00:00:00', 'Solicitud de constancia de notas del semestre actual.', 'Carlos Méndez', 'Registrada', ''),
(3, 'SOL-2026-003', 'Reserva de laboratorio', 5, 3, '2026-08-13 00:00:00', 'Laboratorio de informática 3 para práctica de redes.', 'Lucía Paredes', 'Resuelta', 'Reserva culminada con éxito.'),
(4, 'SOL-2026-004', 'Inscripción a evento', 6, 4, '2026-08-14 00:00:00', 'Inscripción al seminario de investigación aplicada.', 'Andrés Ruiz', 'En revisión', ''),
(5, 'SOL-2026-005', 'Queja', 7, 6, '2026-08-15 00:00:00', 'Queja por el estado de los equipos del laboratorio 2.', 'María Torres', 'Asignada', ''),
(6, 'SOL-2026-006', 'Préstamo de equipos', 8, 3, '2026-08-16 00:00:00', 'Préstamo de video proyectores para el foro estudiantil.', 'Jorge Salazar', 'Cerrada', 'Solicitud cerrada por el sistema.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `identificacion` varchar(20) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `programa` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `tipo_usuario` varchar(30) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `estado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `identificacion`, `usuario`, `id_rol`, `nombre`, `apellido`, `correo`, `programa`, `telefono`, `tipo_usuario`, `contraseña`, `estado`) VALUES
(1, 'admin', 'admin', 1, 'Natalia', 'Rodríguez', 'natalia.rodriguez@uajs.edu.co', 'Ingeniería de Sistemas', '3001112233', 'Administrador', 'admin123', 'Activo'),
(2, 'funcionario', 'funcionario', 4, 'Carlos', 'Méndez', 'carlos.mendez@uajs.edu.co', 'Bienestar Universitario', '3002223344', 'Administrativo', 'func123', 'Activo'),
(3, 'profesor', 'profesor', 3, 'Laura', 'Gómez', 'laura.gomez@uajs.edu.co', 'Matemáticas', '3003334455', 'Docente', 'prof123', 'Activo'),
(4, 'estudiante', 'estudiante', 2, 'Andrés', 'Torres', 'andres.torres@uajs.edu.co', 'Ingeniería de Sistemas', '3004445566', 'Estudiante', 'est123', 'Activo'),
(5, 'lucia.paredes', 'lucia.paredes', 3, 'Lucía', 'Paredes', 'lucia.paredes@uajs.edu.co', 'Ingeniería de Sistemas', '3005556677', 'Docente', 'lucia123', 'Activo'),
(6, 'andres.ruiz', 'andres.ruiz', 2, 'Andrés', 'Ruiz', 'andres.ruiz@uajs.edu.co', 'Ingeniería de Sistemas', '3006667788', 'Estudiante', 'andres123', 'Activo'),
(7, 'maria.torres', 'maria.torres', 2, 'María', 'Torres', 'maria.torres@uajs.edu.co', 'Ingeniería de Sistemas', '3007778899', 'Estudiante', 'maria123', 'Activo'),
(8, 'jorge.salazar', 'jorge.salazar', 2, 'Jorge', 'Salazar', 'jorge.salazar@uajs.edu.co', 'Ingeniería de Sistemas', '3008889900', 'Estudiante', 'jorge123', 'Activo');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id_config`),
  ADD KEY `FK_config_usuario` (`id_usuario`);

--
-- Indices de la tabla `eventos_y_actividades`
--
ALTER TABLE `eventos_y_actividades`
  ADD PRIMARY KEY (`id_evento`),
  ADD KEY `FK_eventos_usuario` (`id_usuario`);

--
-- Indices de la tabla `info_academica`
--
ALTER TABLE `info_academica`
  ADD PRIMARY KEY (`id_publicacion`),
  ADD KEY `FK_infoac_usuario` (`id_usuario`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `FK_notificaciones_usuario` (`id_usuario`);

--
-- Indices de la tabla `pqrs`
--
ALTER TABLE `pqrs`
  ADD PRIMARY KEY (`id_pqrs`);

--
-- Indices de la tabla `recursos`
--
ALTER TABLE `recursos`
  ADD PRIMARY KEY (`id_recurso`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id_reserva`),
  ADD KEY `FK_reservas_usuario` (`id_usuario`),
  ADD KEY `FK_reservas_recurso` (`id_recurso`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id_servicio`);

--
-- Indices de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `FK_solicitudes_usuario` (`id_usuario`),
  ADD KEY `FK_solicitudes_servicio` (`id_servicio`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `identificacion` (`identificacion`),
  ADD KEY `fk_usuarios_roles` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id_config` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `eventos_y_actividades`
--
ALTER TABLE `eventos_y_actividades`
  MODIFY `id_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `info_academica`
--
ALTER TABLE `info_academica`
  MODIFY `id_publicacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `recursos`
--
ALTER TABLE `recursos`
  MODIFY `id_recurso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id_reserva` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id_servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  MODIFY `id_solicitud` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD CONSTRAINT `FK_config_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `eventos_y_actividades`
--
ALTER TABLE `eventos_y_actividades`
  ADD CONSTRAINT `FK_eventos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `info_academica`
--
ALTER TABLE `info_academica`
  ADD CONSTRAINT `FK_infoac_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `FK_notificaciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `FK_reservas_recurso` FOREIGN KEY (`id_recurso`) REFERENCES `recursos` (`id_recurso`),
  ADD CONSTRAINT `FK_reservas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD CONSTRAINT `FK_solicitudes_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`),
  ADD CONSTRAINT `FK_solicitudes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
