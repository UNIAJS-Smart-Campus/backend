const pool = require('../config/database');
const { notificar } = require('../services/notifications.client');

const ROLES_GESTION = new Set(['Administrador', 'Administrativo', 'Funcionario']);

function esGestor(actor) {
    return Boolean(actor && ROLES_GESTION.has(actor.rol));
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

function stringifyJson(value) {
    return value == null ? null : JSON.stringify(value);
}

async function getAll(req, res, next) {
    try {
        const actor = req.actor;
        const params = [];
        let query = `
            SELECT s.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, sv.nombre AS servicio_nombre
            FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN servicios sv ON s.id_servicio = sv.id_servicio
        `;
        if (!esGestor(actor)) {
            query += ' WHERE s.id_usuario = ?';
            params.push(actor.id);
        }
        query += ' ORDER BY s.fecha_solicitud DESC';
        const [rows] = await pool.query(query, params);
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
        if (!esGestor(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No tienes acceso a esta solicitud' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { tipo, id_usuario, id_servicio, descripcion, solicitante, estado, respuesta, codigo, fecha_solicitud, prioridad, historial } = req.body;
        if (!tipo || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const inicial = ['REGISTRADA', 'Registrada'];
        const propietario = esGestor(req.actor) && id_usuario ? Number(id_usuario) : req.actor.id;
        const historiaInicial = Array.isArray(historial) && historial.length
            ? historial
            : [{
                id: 1,
                tipo: 'CREACION',
                fecha: (fecha_solicitud || new Date()).toString().slice(0, 16).replace('T', ' '),
                usuario: solicitante || '',
                descripcion: 'Solicitud registrada.'
            }];
        const [result] = await pool.query(
            'INSERT INTO solicitudes (codigo, tipo, id_usuario, id_servicio, fecha_solicitud, descripcion, solicitante, estado, respuesta, prioridad, historial) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [codigo || '', tipo, propietario, id_servicio || null, fecha_solicitud || new Date(), descripcion, solicitante || '', estado || 'REGISTRADA', respuesta || '', prioridad || 'Media', stringifyJson(historiaInicial)]
        );
        const [newReq] = await pool.query('SELECT * FROM solicitudes WHERE id_solicitud = ?', [result.insertId]);
        res.status(201).json({ data: newReq[0] });

        notificar({
            id_usuario: propietario,
            titulo: 'Solicitud registrada',
            mensaje: `Tu solicitud ${codigo || `#${result.insertId}`} fue registrada correctamente.`,
            tipo_notificacion: 'Solicitud',
            icono: 'solicitudes',
            referencia_tabla: 'solicitudes',
            referencia_id: result.insertId,
            resource: 'requests',
            action: 'created'
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { tipo, id_usuario, id_servicio, descripcion, solicitante, estado, respuesta, codigo, fecha_solicitud, prioridad, historial } = req.body;
        const [existingRows] = await pool.query('SELECT * FROM solicitudes WHERE id_solicitud = ?', [id]);
        if (!existingRows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const prev = existingRows[0];
        const gestor = esGestor(req.actor);
        if (!gestor && Number(prev.id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No puedes modificar esta solicitud' });
        }

        let nuevosHistorial = Array.isArray(historial) ? historial : (parseJson(prev.historial) || []);
        const estadoFinal = gestor ? estado : prev.estado;
        const proximaPrioridad = gestor ? (prioridad || prev.prioridad || 'Media') : prev.prioridad;
        const proximaRespuesta = gestor ? (respuesta != null ? respuesta : prev.respuesta) : prev.respuesta;
        const propietarioFinal = gestor ? id_usuario : prev.id_usuario;
        if (estadoFinal && prev.estado !== estadoFinal) {
            nuevosHistorial = [...nuevosHistorial, {
                id: (nuevosHistorial.length || 0) + 1,
                tipo: 'ESTADO',
                estado: estadoFinal,
                fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
                usuario: solicitante || '',
                descripcion: `Estado actualizado a "${estadoFinal}".`
            }];
        }
        await pool.query(
            'UPDATE solicitudes SET codigo = ?, tipo = ?, id_usuario = ?, id_servicio = ?, fecha_solicitud = ?, descripcion = ?, solicitante = ?, estado = ?, respuesta = ?, prioridad = ?, historial = ? WHERE id_solicitud = ?',
            [codigo, tipo, propietarioFinal, id_servicio, fecha_solicitud, descripcion, solicitante, estadoFinal, proximaRespuesta, proximaPrioridad, stringifyJson(nuevosHistorial), id]
        );
        const [updated] = await pool.query('SELECT * FROM solicitudes WHERE id_solicitud = ?', [id]);
        res.json({ data: updated[0] });

        const cambioEstado = Boolean(estadoFinal && prev.estado !== estadoFinal);
        notificar({
            id_usuario: prev.id_usuario,
            titulo: cambioEstado ? 'Solicitud actualizada' : 'Solicitud editada',
            mensaje: cambioEstado
                ? `Tu solicitud ${prev.codigo || `#${id}`} cambió al estado "${estadoFinal}".`
                : `Tu solicitud ${prev.codigo || `#${id}`} fue actualizada.`,
            tipo_notificacion: 'Solicitud',
            icono: 'solicitudes',
            referencia_tabla: 'solicitudes',
            referencia_id: id,
            resource: 'requests',
            action: 'updated',
            silent: !cambioEstado
        });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!esGestor(req.actor)) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar solicitudes' });
        }
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
