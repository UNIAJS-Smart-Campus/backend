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

async function listarInscripciones(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT i.id_inscripcion, i.id_usuario, i.fecha_inscripcion,
                    u.nombre, u.apellido, u.programa, u.correo
             FROM inscripciones_eventos i
             LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
             WHERE i.id_evento = ?
             ORDER BY i.fecha_inscripcion ASC`,
            [id]
        );
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function inscribir(req, res, next) {
    let conn;
    try {
        const { id } = req.params;
        const { id_usuario } = req.body;

        if (!id_usuario) {
            return res.status(400).json({ error: 'id_usuario es obligatorio' });
        }

        // Verificar cupo e insertar en la misma transacción: sin ella, dos
        // inscripciones simultáneas pueden pasarse el cupo.
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [evento] = await conn.query(
            'SELECT id_evento, cupo, inscritos FROM eventos_y_actividades WHERE id_evento = ? FOR UPDATE',
            [id]
        );
        if (!evento.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        const { cupo, inscritos } = evento[0];
        if (cupo > 0 && Number(inscritos) >= Number(cupo)) {
            await conn.rollback();
            return res.status(409).json({ error: 'No hay cupo disponible para este evento' });
        }

        const [existente] = await conn.query(
            'SELECT id_inscripcion FROM inscripciones_eventos WHERE id_evento = ? AND id_usuario = ?',
            [id, id_usuario]
        );
        if (existente.length) {
            await conn.rollback();
            return res.status(409).json({ error: 'El usuario ya está inscrito en este evento' });
        }

        await conn.query(
            'INSERT INTO inscripciones_eventos (id_evento, id_usuario) VALUES (?, ?)',
            [id, id_usuario]
        );
        await conn.query(
            'UPDATE eventos_y_actividades SET inscritos = inscritos + 1 WHERE id_evento = ?',
            [id]
        );

        const [updated] = await conn.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        await conn.commit();

        res.status(201).json({ data: updated[0] });
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        next(error);
    } finally {
        if (conn) conn.release();
    }
}

async function desinscribir(req, res, next) {
    let conn;
    try {
        const { id, idUsuario } = req.params;

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            'DELETE FROM inscripciones_eventos WHERE id_evento = ? AND id_usuario = ?',
            [id, idUsuario]
        );
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'No existe la inscripción' });
        }

        await conn.query(
            'UPDATE eventos_y_actividades SET inscritos = GREATEST(inscritos - 1, 0) WHERE id_evento = ?',
            [id]
        );

        const [updated] = await conn.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        await conn.commit();

        res.json({ data: updated[0] });
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        next(error);
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    getAll, getOne, create, update, remove,
    listarInscripciones, inscribir, desinscribir
};
