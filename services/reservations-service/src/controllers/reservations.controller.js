const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, 
                   u.nombre AS usuario_nombre, 
                   u.apellido AS usuario_apellido,
                   rec.nombre_recurso,
                   rec.tipo_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
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
            SELECT r.*, 
                   u.nombre AS usuario_nombre, 
                   u.apellido AS usuario_apellido,
                   rec.nombre_recurso,
                   rec.tipo_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado } = req.body;
        if (!id_usuario || !id_recurso || !fecha_reserva || !hora_inicio || !hora_fin || !estado) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO reservas (id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo || '', estado]
        );
        const [newReservation] = await pool.query(`
            SELECT r.*, u.nombre AS usuario_nombre, rec.nombre_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [result.insertId]);
        res.status(201).json({ data: newReservation[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado } = req.body;
        const [result] = await pool.query(
            'UPDATE reservas SET id_usuario = ?, id_recurso = ?, fecha_reserva = ?, hora_inicio = ?, hora_fin = ?, motivo = ?, estado = ? WHERE id_reserva = ?',
            [id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo || '', estado, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        const [updated] = await pool.query(`
            SELECT r.*, u.nombre AS usuario_nombre, rec.nombre_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM reservas WHERE id_reserva = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
