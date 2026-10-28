-- ============================================================
-- 004 — Normalizar estados de solicitudes
-- ============================================================
-- La UI compara los estados en mayúsculas (`REGISTRADA`, `EN_REVISION`, …).
-- En datos viejos quedaron variantes como `Registrada` o el typo `RADICADA`,
-- que dejaban la solicitud sin etiqueta y sin acciones disponibles.
-- Ejecutar una sola vez sobre bases de datos ya creadas.
-- ============================================================

UPDATE solicitudes
SET estado = 'REGISTRADA'
WHERE UPPER(TRIM(estado)) IN ('RADICADA', 'REGISTRADA');

UPDATE solicitudes
SET estado = UPPER(TRIM(estado))
WHERE estado <> BINARY UPPER(TRIM(estado));
