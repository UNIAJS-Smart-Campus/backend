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
        const [rows] = esGestor(req.actor)
            ? await pool.query('SELECT * FROM pqrs ORDER BY fecha DESC')
            : await pool.query('SELECT * FROM pqrs WHERE id_usuario = ? ORDER BY fecha DESC', [req.actor.id]);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'PQRS no encontrada' });
        }
        if (!esGestor(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No tienes acceso a esta PQRS' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const {
            tipo, fecha, estado, descripcion,
            solicitante, prioridad, asignado_a, respuesta, historial,
            sede, tipo_perfil, tipo_documento, identificacion, nombre, telefono, correo, area, asunto, adjunto, id_usuario
        } = req.body;
        if (!tipo || !fecha || !estado || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const propietario = esGestor(req.actor) && id_usuario ? Number(id_usuario) : req.actor.id;
        const historialInicial = Array.isArray(historial) && historial.length
            ? historial
            : [{
                id: 1,
                tipo: 'CREACION',
                fecha: `${fecha} 08:00`,
                usuario: solicitante || nombre || 'Anónimo',
                descripcion: 'PQRS registrada.'
            }];
        const [result] = await pool.query(
            `INSERT INTO pqrs (
                tipo, fecha, estado, descripcion, solicitante, prioridad, asignado_a, respuesta, historial,
                sede, tipo_perfil, tipo_documento, identificacion, nombre, telefono, correo, area, asunto, adjunto, id_usuario
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tipo, fecha, estado, descripcion, solicitante || nombre || 'Anónimo', prioridad || 'Media', asignado_a || '', respuesta || '',
                stringifyJson(historialInicial),
                sede || 'SINCELEJO', tipo_perfil || '', tipo_documento || '', identificacion || '', nombre || '', telefono || '', correo || '',
                area || '', asunto || '', stringifyJson(adjunto), propietario
            ]
        );
        const nuevoId = result.insertId;
        const [newPqrs] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [nuevoId]);
        res.status(201).json({ data: newPqrs[0] });

        notificar({
            id_usuario: propietario,
            titulo: 'PQRS registrada',
            mensaje: `Tu PQRS ${nuevoId} fue registrada correctamente.`,
            tipo_notificacion: 'PQRS',
            icono: 'pqrs',
            referencia_tabla: 'pqrs',
            referencia_id: null,
            resource: 'feedback',
            action: 'created'
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const {
            tipo, fecha, estado, descripcion,
            solicitante, prioridad, asignado_a, respuesta, historial,
            sede, tipo_perfil, tipo_documento, identificacion, nombre, telefono, correo, area, asunto, adjunto, id_usuario
        } = req.body;
        const [existingRows] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [id]);
        if (!existingRows.length) {
            return res.status(404).json({ error: 'PQRS no encontrada' });
        }
        const prev = existingRows[0];
        const gestor = esGestor(req.actor);
        if (!gestor && Number(prev.id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No puedes modificar esta PQRS' });
        }

        const estadoFinal = gestor ? (estado ?? prev.estado) : prev.estado;
        const prioridadFinal = gestor ? (prioridad || prev.prioridad || 'Media') : prev.prioridad;
        const asignadoFinal = gestor ? (asignado_a ?? prev.asignado_a) : prev.asignado_a;
        const respuestaFinal = gestor ? (respuesta != null ? respuesta : prev.respuesta) : prev.respuesta;
        const propietarioFinal = gestor ? (id_usuario ?? prev.id_usuario) : prev.id_usuario;

        let nuevosHistorial = Array.isArray(historial) ? historial : (parseJson(prev.historial) || []);
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
            `UPDATE pqrs SET
                tipo = ?, fecha = ?, estado = ?, descripcion = ?, solicitante = ?, prioridad = ?, asignado_a = ?, respuesta = ?, historial = ?,
                sede = ?, tipo_perfil = ?, tipo_documento = ?, identificacion = ?, nombre = ?, telefono = ?, correo = ?, area = ?, asunto = ?, adjunto = ?, id_usuario = ?
            WHERE id_pqrs = ?`,
            [
                tipo ?? prev.tipo, fecha ?? prev.fecha, estadoFinal, descripcion ?? prev.descripcion,
                solicitante ?? prev.solicitante ?? '', prioridadFinal, asignadoFinal || '', respuestaFinal || '',
                stringifyJson(nuevosHistorial),
                sede ?? prev.sede ?? '', tipo_perfil ?? prev.tipo_perfil ?? '', tipo_documento ?? prev.tipo_documento ?? '',
                identificacion ?? prev.identificacion ?? '', nombre ?? prev.nombre ?? '', telefono ?? prev.telefono ?? '',
                correo ?? prev.correo ?? '', area ?? prev.area ?? '', asunto ?? prev.asunto ?? '',
                adjunto !== undefined ? stringifyJson(adjunto) : prev.adjunto,
                propietarioFinal,
                id
            ]
        );
        const [updated] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [id]);
        res.json({ data: updated[0] });

        const cambioEstado = Boolean(estadoFinal && prev.estado !== estadoFinal);
        notificar({
            id_usuario: prev.id_usuario,
            titulo: cambioEstado ? 'PQRS actualizada' : 'PQRS editada',
            mensaje: cambioEstado
                ? `Tu PQRS ${id} cambió al estado "${estadoFinal}".`
                : `Tu PQRS ${id} fue actualizada.`,
            tipo_notificacion: 'PQRS',
            icono: 'pqrs',
            referencia_tabla: 'pqrs',
            referencia_id: null,
            resource: 'feedback',
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
            return res.status(403).json({ error: 'No tienes permiso para eliminar PQRS' });
        }
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM pqrs WHERE id_pqrs = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'PQRS no encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };