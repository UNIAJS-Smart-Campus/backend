-- ============================================================
-- 001 — Historial en JSON para solicitudes y PQRS
-- ============================================================
-- requests-service y feedback-service esperan una columna `historial`
-- (el esquema original solo traía la tabla historial_solicitudes).
-- Ejecutar una sola vez sobre bases de datos ya creadas.
-- ============================================================

ALTER TABLE solicitudes ADD COLUMN historial JSON NULL AFTER respuesta;
ALTER TABLE pqrs ADD COLUMN historial JSON NULL AFTER adjunto;
