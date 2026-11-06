const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        // Catálogo pequeño (decenas de filas), pero con tope defensivo
        // (500 por defecto, ?limit=, tope 1000). Sin ORDER BY a propósito:
        // mientras no se supere el tope, el orden natural es el mismo de
        // siempre y la página no cambia.
        const limite = Math.min(1000, Math.max(1, Number.parseInt(req.query.limit, 10) || 500));
        const [rows] = await pool.query('SELECT * FROM recursos LIMIT ?', [limite]);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM recursos WHERE id_recurso = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { nombre_recurso, codigo, tipo_recurso, descripcion, ubicacion, capacidad, estado, disponibilidad } = req.body;
        if (!nombre_recurso || !tipo_recurso || !ubicacion || !estado || !disponibilidad) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO recursos (nombre_recurso, codigo, tipo_recurso, descripcion, ubicacion, capacidad, estado, disponibilidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre_recurso, codigo || '', tipo_recurso, descripcion || '', ubicacion, capacidad || null, estado, disponibilidad]
        );
        const [newResource] = await pool.query('SELECT * FROM recursos WHERE id_recurso = ?', [result.insertId]);
        res.status(201).json({ data: newResource[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre_recurso, codigo, tipo_recurso, descripcion, ubicacion, capacidad, estado, disponibilidad } = req.body;
        const [result] = await pool.query(
            'UPDATE recursos SET nombre_recurso = ?, codigo = ?, tipo_recurso = ?, descripcion = ?, ubicacion = ?, capacidad = ?, estado = ?, disponibilidad = ? WHERE id_recurso = ?',
            [nombre_recurso, codigo, tipo_recurso, descripcion, ubicacion, capacidad, estado, disponibilidad, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }
        const [updated] = await pool.query('SELECT * FROM recursos WHERE id_recurso = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM recursos WHERE id_recurso = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
