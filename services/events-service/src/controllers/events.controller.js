const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM eventos_y_actividades');
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, id_usuario, cupo, inscritos } = req.body;
        if (!nombre_evento || !fecha || !hora_inicio || !hora_fin || !ubicacion || !tipo_evento || !estado) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO eventos_y_actividades (nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, id_usuario, cupo, inscritos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre_evento, descripcion || '', fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, id_usuario || 1, cupo || 0, inscritos || 0]
        );
        const [newEvent] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [result.insertId]);
        res.status(201).json({ data: newEvent[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, id_usuario, cupo, inscritos } = req.body;
        const [result] = await pool.query(
            'UPDATE eventos_y_actividades SET nombre_evento = ?, descripcion = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, ubicacion = ?, tipo_evento = ?, estado = ?, id_usuario = ?, cupo = ?, inscritos = ? WHERE id_evento = ?',
            [nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, id_usuario, cupo, inscritos, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const [updated] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
