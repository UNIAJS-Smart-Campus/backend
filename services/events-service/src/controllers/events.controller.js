const pool = require('../config/database');
const { notificar } = require('../services/notifications.client');

const ROLES_PUBLICAR = new Set(['Administrador', 'Docente']);

function puedePublicar(actor) {
    return Boolean(actor && ROLES_PUBLICAR.has(actor.rol));
}

function esAdministrador(actor) {
    return Boolean(actor && actor.rol === 'Administrador');
}

function parseJson(value) {
    if (value == null) return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }
    return value;
}

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM eventos_y_actividades ORDER BY fecha ASC, hora_inicio ASC');
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
        if (!puedePublicar(req.actor)) {
            return res.status(403).json({ error: 'No tienes permiso para publicar eventos' });
        }
        const { nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, cupo, inscritos, participantes } = req.body;
        if (!nombre_evento || !fecha || !hora_inicio || !hora_fin || !ubicacion || !tipo_evento || !estado) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const parseados = parseJson(participantes) || [];
        const [result] = await pool.query(
            'INSERT INTO eventos_y_actividades (nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, id_usuario, cupo, inscritos, participantes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre_evento, descripcion || '', fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, req.actor.id, cupo || 0, inscritos || 0, JSON.stringify(parseados)]
        );
        const [newEvent] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [result.insertId]);
        res.status(201).json({ data: newEvent[0] });

        notificar({
            titulo: 'Evento creado',
            mensaje: `El evento "${nombre_evento}" fue publicado.`,
            tipo_notificacion: 'Evento',
            icono: 'eventos',
            referencia_tabla: 'eventos_y_actividades',
            referencia_id: result.insertId,
            resource: 'events',
            action: 'created',
            silent: true
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        if (!puedePublicar(req.actor)) {
            return res.status(403).json({ error: 'No tienes permiso para modificar eventos' });
        }
        const { id } = req.params;
        const { nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, id_usuario, cupo, inscritos, participantes } = req.body;
        const [existingRows] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (!existingRows.length) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const prev = existingRows[0];
        if (!esAdministrador(req.actor) && Number(prev.id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'Solo puedes modificar tus propios eventos' });
        }
        const propietarioFinal = esAdministrador(req.actor) ? (id_usuario ?? prev.id_usuario) : prev.id_usuario;
        const proximoInscritos = inscritos != null ? inscritos : prev.inscritos;
        const proximosParticipantes = participantes != null ? JSON.stringify(parseJson(participantes) || []) : prev.participantes;
        await pool.query(
            'UPDATE eventos_y_actividades SET nombre_evento = ?, descripcion = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, ubicacion = ?, tipo_evento = ?, estado = ?, id_usuario = ?, cupo = ?, inscritos = ?, participantes = ? WHERE id_evento = ?',
            [nombre_evento, descripcion, fecha, hora_inicio, hora_fin, ubicacion, tipo_evento, estado, propietarioFinal, cupo, proximoInscritos, proximosParticipantes, id]
        );
        const [updated] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        res.json({ data: updated[0] });

        notificar({
            titulo: 'Evento actualizado',
            mensaje: `El evento "${updated[0].nombre_evento}" fue actualizado.`,
            tipo_notificacion: 'Evento',
            icono: 'eventos',
            referencia_tabla: 'eventos_y_actividades',
            referencia_id: id,
            resource: 'events',
            action: 'updated',
            silent: true
        });
    } catch (error) {
        next(error);
    }
}

async function register(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const id_usuario = req.actor.id;
        const [rows] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const evento = rows[0];
        const participantes = parseJson(evento.participantes) || [];
        const yaInscrito = participantes.some(
            (p) => Number(p.id) === Number(id_usuario) || Number(p.usuarioId) === Number(id_usuario)
        );
        if (yaInscrito) {
            return res.status(400).json({ error: 'Ya estás inscrito en este evento' });
        }
        const nuevos = [...participantes, { id: Number(id_usuario), usuarioId: Number(id_usuario), nombre: nombre || String(id_usuario), fecha: new Date().toISOString().slice(0, 10) }];
        await pool.query(
            'UPDATE eventos_y_actividades SET inscritos = ?, participantes = ? WHERE id_evento = ?',
            [evento.inscritos + 1, JSON.stringify(nuevos), id]
        );
        const [updated] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        res.json({ data: updated[0] });

        notificar({
            id_usuario,
            titulo: 'Inscripción confirmada',
            mensaje: `Tu inscripción al evento "${evento.nombre_evento}" quedó confirmada.`,
            tipo_notificacion: 'Evento',
            icono: 'eventos',
            referencia_tabla: 'eventos_y_actividades',
            referencia_id: Number(id),
            resource: 'events',
            action: 'registered'
        });
    } catch (error) {
        next(error);
    }
}

async function unregister(req, res, next) {
    try {
        const { id } = req.params;
        const id_usuario = req.actor.id;
        const [rows] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const evento = rows[0];
        const participantes = parseJson(evento.participantes) || [];
        const restantes = participantes.filter(
            (p) => Number(p.id) !== Number(id_usuario) && Number(p.usuarioId) !== Number(id_usuario)
        );
        if (restantes.length === participantes.length) {
            return res.status(400).json({ error: 'No estás inscrito en este evento' });
        }
        await pool.query(
            'UPDATE eventos_y_actividades SET inscritos = ?, participantes = ? WHERE id_evento = ?',
            [Math.max(0, evento.inscritos - 1), JSON.stringify(restantes), id]
        );
        const [updated] = await pool.query('SELECT * FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        res.json({ data: updated[0] });

        notificar({
            titulo: 'Inscripción cancelada',
            mensaje: `Un participante canceló su inscripción al evento "${evento.nombre_evento}".`,
            tipo_notificacion: 'Evento',
            icono: 'eventos',
            referencia_tabla: 'eventos_y_actividades',
            referencia_id: Number(id),
            resource: 'events',
            action: 'unregistered',
            silent: true
        });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!puedePublicar(req.actor)) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar eventos' });
        }
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id_usuario FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        if (!esAdministrador(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'Solo puedes eliminar tus propios eventos' });
        }
        const [result] = await pool.query('DELETE FROM eventos_y_actividades WHERE id_evento = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove, register, unregister };