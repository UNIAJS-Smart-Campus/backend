-- ============================================================
-- 003 — Alinear categorías de eventos entre frontend y BD
-- ============================================================
-- El frontend ofrece la categoría "Institucional", que no estaba en el
-- ENUM de `eventos_y_actividades.tipo_evento` y provocaba el error 1265
-- (Data truncated) al crear el evento en MySQL estricto.
-- Ejecutar una sola vez sobre bases de datos ya creadas.
-- ============================================================

ALTER TABLE eventos_y_actividades
    MODIFY COLUMN tipo_evento ENUM('Académico', 'Cultural', 'Deportivo', 'Formación', 'Institucional') NOT NULL;
