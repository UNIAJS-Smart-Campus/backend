-- ============================================================
-- 002 — Columnas que esperan feedback-service y events-service
-- ============================================================
-- El esquema original no traía `pqrs.solicitante` ni
-- `eventos_y_actividades.participantes`, aunque el código los usa.
-- Ejecutar una sola vez sobre bases de datos ya creadas.
-- ============================================================

ALTER TABLE pqrs
    ADD COLUMN solicitante varchar(120) NOT NULL DEFAULT '' AFTER descripcion;

ALTER TABLE eventos_y_actividades
    ADD COLUMN participantes JSON NULL AFTER inscritos;
