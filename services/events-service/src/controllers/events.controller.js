const pool = require('../config/database');
const { notificar } = require('../services/notifications.client');

function mapParticipante(row) {
    const nombre = [row.nombre, row.apellido].filter(Boolean).join(' ').trim();
    return {
        usuarioId: row.id_usuario,
        id_usuario: row.id_usuario,
        nombre: nombre || 'Inscrito',
        correo: row.correo || '',
        fecha: row.fecha_inscripcion
    };
}

async function participantesPorEvento(ids) {
    const mapa = new Map();
    if (!ids.length) return mapa;

    const [rows] = await pool.query(
        `SELECT i.id_evento, i.id_usuario, i.fecha_inscripcion, u.nombre, u.apellido, u.correo
         FROM inscripciones_eventos i
         LEFT JOIN usuarios u ON u.id_usuario = i.id_usuario
         WHERE i.id_evento IN (?)
         ORDER BY i.fecha_inscripcion ASC`,
        [ids]
    );

    for (const row of rows) {
        if (!mapa.has(row.id_evento)) mapa.set(row.id_evento, []);
        mapa.get(row.id_evento).push(mapParticipante(row));
    }
    return mapa;
}

function conParticipantes(evento, mapa) {
    const reales = mapa.get(evento.id_evento);
    if (reales && reales.length) {
        return { ...evento, participantes: reales, inscritos: reales.length };
    }
    // Compatibilidad con eventos antiguos que guardaban el JSON `participantes`.
    const legacy = Array.isArray(evento.participantes) ? evento.participantes : [];
    return { ...evento, participantes: legacy };
}

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM eventos_y_actividades ORDER BY fecha ASC, hora_inicio ASC');
        const mapa = await participantesPorEvento(rows.map((r) => r.id_evento));
        res.json({ data: rows.map((r) => conParticipantes(r, mapa)) });
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
        const mapa = await participantesPorEvento([rows[0].id_evento]);
        res.json({ data: conParticipantes(rows[0], mapa) });
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
        const [rows] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const actual = rows[0];
        const b = req.body;

        await pool.query(
            'UPDATE eventos_y_actividades SET nombre_evento = ?, descripcion = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, ubicacion = ?, tipo_evento = ?, estado = ?, id_usuario = ?, cupo = ?, inscritos = ? WHERE id_evento = ?',
            [
                b.nombre_evento ?? actual.nombre_evento,
                b.descripcion ?? actual.descripcion,
                b.fecha ?? actual.fecha,
                b.hora_inicio ?? actual.hora_inicio,
                b.hora_fin ?? actual.hora_fin,
                b.ubicacion ?? actual.ubicacion,
                b.tipo_evento ?? actual.tipo_evento,
                b.estado ?? actual.estado,
                b.id_usuario ?? actual.id_usuario,
                b.cupo ?? actual.cupo,
                b.inscritos ?? actual.inscritos,
                id
            ]
        );
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

async function register(req, res, next) {
    const idEvento = Number(req.params.id);
    if (!Number.isInteger(idEvento) || idEvento <= 0) {
        return res.status(400).json({ error: 'Evento inválido' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [eventos] = await connection.query(
            'SELECT * FROM eventos_y_actividades WHERE id_evento = ? FOR UPDATE',
            [idEvento]
        );
        if (!eventos.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        const evento = eventos[0];
        if (!['Activo', 'Programado'].includes(evento.estado)) {
            await connection.rollback();
            return res.status(409).json({ error: 'El evento no está disponible para inscripciones' });
        }

        const [previas] = await connection.query(
            'SELECT id_inscripcion FROM inscripciones_eventos WHERE id_evento = ? AND id_usuario = ?',
            [idEvento, req.actor.id]
        );
        if (previas.length) {
            await connection.rollback();
            return res.status(409).json({ error: 'Ya estás inscrito en este evento' });
        }

        const [conteo] = await connection.query(
            'SELECT COUNT(*) AS total FROM inscripciones_eventos WHERE id_evento = ?',
            [idEvento]
        );
        const inscritos = Number(conteo[0].total) || 0;
        const cupo = Number(evento.cupo) || 0;
        if (cupo > 0 && inscritos >= cupo) {
            await connection.rollback();
            return res.status(409).json({ error: 'El evento alcanzó su cupo máximo' });
        }

        await connection.query(
            'INSERT INTO inscripciones_eventos (id_evento, id_usuario) VALUES (?, ?)',
            [idEvento, req.actor.id]
        );
        await connection.query(
            'UPDATE eventos_y_actividades SET inscritos = ? WHERE id_evento = ?',
            [inscritos + 1, idEvento]
        );

        await connection.commit();

        notificar({
            id_usuario: req.actor.id,
            titulo: 'Inscripción confirmada',
            mensaje: `Te inscribiste al evento "${evento.nombre_evento}".`,
            tipo_notificacion: 'evento',
            icono: 'eventos'
        });

        res.status(201).json({
            data: { id_evento: idEvento, id_usuario: req.actor.id, inscritos: inscritos + 1 }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
}

async function unregister(req, res, next) {
    const idEvento = Number(req.params.id);
    if (!Number.isInteger(idEvento) || idEvento <= 0) {
        return res.status(400).json({ error: 'Evento inválido' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'DELETE FROM inscripciones_eventos WHERE id_evento = ? AND id_usuario = ?',
            [idEvento, req.actor.id]
        );
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'No estabas inscrito en este evento' });
        }

        const [conteo] = await connection.query(
            'SELECT COUNT(*) AS total FROM inscripciones_eventos WHERE id_evento = ?',
            [idEvento]
        );
        await connection.query(
            'UPDATE eventos_y_actividades SET inscritos = ? WHERE id_evento = ?',
            [Number(conteo[0].total) || 0, idEvento]
        );

        await connection.commit();
        res.status(204).send();
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
}

module.exports = { getAll, getOne, create, update, remove, register, unregister };
