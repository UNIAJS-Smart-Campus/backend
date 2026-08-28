const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, sv.nombre AS servicio_nombre
            FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN servicios sv ON s.id_servicio = sv.id_servicio
        `);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT s.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, sv.nombre AS servicio_nombre
            FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN servicios sv ON s.id_servicio = sv.id_servicio
            WHERE s.id_solicitud = ?
        `, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { tipo, id_usuario, id_servicio, descripcion, solicitante, estado, respuesta, codigo, fecha_solicitud } = req.body;
        if (!tipo || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO solicitudes (codigo, tipo, id_usuario, id_servicio, fecha_solicitud, descripcion, solicitante, estado, respuesta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [codigo || '', tipo, id_usuario || null, id_servicio || null, fecha_solicitud || new Date(), descripcion, solicitante || '', estado || 'Registrada', respuesta || '']
        );
        const [newReq] = await pool.query('SELECT * FROM solicitudes WHERE id_solicitud = ?', [result.insertId]);
        res.status(201).json({ data: newReq[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { tipo, id_usuario, id_servicio, descripcion, solicitante, estado, respuesta, codigo, fecha_solicitud } = req.body;
        const [result] = await pool.query(
            'UPDATE solicitudes SET codigo = ?, tipo = ?, id_usuario = ?, id_servicio = ?, fecha_solicitud = ?, descripcion = ?, solicitante = ?, estado = ?, respuesta = ? WHERE id_solicitud = ?',
            [codigo, tipo, id_usuario, id_servicio, fecha_solicitud, descripcion, solicitante, estado, respuesta, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const [updated] = await pool.query('SELECT * FROM solicitudes WHERE id_solicitud = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM solicitudes WHERE id_solicitud = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
