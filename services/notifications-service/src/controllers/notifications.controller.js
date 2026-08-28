const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        const { id_usuario } = req.query;
        let query = 'SELECT * FROM notificaciones';
        const params = [];
        if (id_usuario) {
            query += ' WHERE id_usuario = ?';
            params.push(id_usuario);
        }
        query += ' ORDER BY fecha_envio DESC';
        const [rows] = await pool.query(query, params);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio } = req.body;
        if (!id_usuario || !titulo || !mensaje) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_usuario, titulo, mensaje, tipo_notificacion || '', icono || '', leida || 0, fecha_envio || new Date()]
        );
        const [newNotif] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [result.insertId]);
        res.status(201).json({ data: newNotif[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio } = req.body;
        const [result] = await pool.query(
            'UPDATE notificaciones SET id_usuario = ?, titulo = ?, mensaje = ?, tipo_notificacion = ?, icono = ?, leida = ?, fecha_envio = ? WHERE id_notificacion = ?',
            [id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        const [updated] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM notificaciones WHERE id_notificacion = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
