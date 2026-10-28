const pool = require('../config/database');
const { emitToUser, emitToAdmins, broadcast } = require('../realtime');

function esAdministrador(actor) {
    return Boolean(actor && actor.rol === 'Administrador');
}

async function contarNoLeidas(idUsuario) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) AS total FROM notificaciones WHERE id_usuario = ? AND leida = 0',
        [idUsuario]
    );
    return Number(rows[0]?.total || 0);
}

async function publicarNotificacion(notificacion, evento = 'notification:new') {
    if (!notificacion || notificacion.id_usuario == null) return;
    const unreadCount = await contarNoLeidas(notificacion.id_usuario);
    emitToUser(notificacion.id_usuario, evento, { notification: notificacion, unreadCount });
    emitToUser(notificacion.id_usuario, 'notifications:count', { unreadCount });
}

function anunciarCambio(resource, action, id) {
    broadcast('data:changed', { resource, action, id: id ?? null });
}

async function getAll(req, res, next) {
    try {
        const objetivo = esAdministrador(req.actor) && req.query.id_usuario
            ? Number(req.query.id_usuario)
            : req.actor.id;

        const [rows] = await pool.query(
            'SELECT * FROM notificaciones WHERE id_usuario = ? ORDER BY fecha_envio DESC LIMIT 200',
            [objetivo]
        );
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
        if (!esAdministrador(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No tienes acceso a esta notificación' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        if (!esAdministrador(req.actor)) {
            return res.status(403).json({ error: 'Solo un administrador puede crear notificaciones' });
        }
        const { id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio } = req.body;
        if (!id_usuario || !titulo || !mensaje) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_usuario, titulo, mensaje, tipo_notificacion || '', icono || '', leida || 0, fecha_envio || new Date()]
        );
        const [newNotif] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [result.insertId]);
        const notificacion = newNotif[0];
        res.status(201).json({ data: notificacion });

        // Entrega en tiempo real (no bloquea la respuesta HTTP).
        publicarNotificacion(notificacion).catch((error) => {
            console.warn(`[realtime] No se pudo publicar la notificación: ${error.message}`);
        });
        anunciarCambio('notifications', 'created', notificacion.id_notificacion);
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        if (!esAdministrador(req.actor)) {
            return res.status(403).json({ error: 'Solo un administrador puede modificar notificaciones' });
        }
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

        publicarNotificacion(updated[0], 'notification:updated').catch((error) => {
            console.warn(`[realtime] No se pudo publicar la actualización: ${error.message}`);
        });
        anunciarCambio('notifications', 'updated', id);
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!esAdministrador(req.actor)) {
            return res.status(403).json({ error: 'Solo un administrador puede eliminar notificaciones' });
        }
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

async function markRead(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id_usuario FROM notificaciones WHERE id_notificacion = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        if (!esAdministrador(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No tienes acceso a esta notificación' });
        }
        const [result] = await pool.query(
            'UPDATE notificaciones SET leida = 1 WHERE id_notificacion = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        const [updated] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        res.json({ data: updated[0] });

        publicarNotificacion(updated[0], 'notification:updated').catch((error) => {
            console.warn(`[realtime] No se pudo publicar la notificación leída: ${error.message}`);
        });
        anunciarCambio('notifications', 'read', id);
    } catch (error) {
        next(error);
    }
}

async function markAllRead(req, res, next) {
    try {
        const objetivo = esAdministrador(req.actor) && req.query.id_usuario
            ? Number(req.query.id_usuario)
            : req.actor.id;

        await pool.query('UPDATE notificaciones SET leida = 1 WHERE id_usuario = ?', [objetivo]);
        emitToUser(objetivo, 'notifications:all-read', { unreadCount: 0 });
        emitToUser(objetivo, 'notifications:count', { unreadCount: 0 });
        res.json({ data: { success: true } });
        anunciarCambio('notifications', 'read-all', null);
    } catch (error) {
        next(error);
    }
}

/**
 * Webhook interno: los demás microservicios lo usan para reportar cambios
 * y generar notificaciones en tiempo real sin acoplarse a Socket.IO.
 */
async function webhook(req, res, next) {
    try {
        const secreto = process.env.NOTIFICATIONS_WEBHOOK_SECRET;
        if (secreto && req.headers['x-webhook-secret'] !== secreto) {
            return res.status(401).json({ error: 'Webhook no autorizado' });
        }

        const {
            id_usuario, titulo, mensaje, tipo_notificacion, icono,
            referencia_tabla, referencia_id, resource, action, audience, silent
        } = req.body || {};

        if (!titulo || !mensaje) {
            return res.status(400).json({ error: 'Faltan campos requeridos: titulo y mensaje' });
        }

        let notificacion = null;

        if (id_usuario && !silent) {
            const [result] = await pool.query(
                'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, referencia_tabla, referencia_id, fecha_envio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    id_usuario, titulo, mensaje, tipo_notificacion || '', icono || '',
                    0, referencia_tabla || null, referencia_id ?? null, new Date()
                ]
            );
            const [rows] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [result.insertId]);
            notificacion = rows[0];
            await publicarNotificacion(notificacion);
        } else if (audience === 'admins') {
            emitToAdmins('notification:new', {
                notification: { id: null, titulo, mensaje, tipo_notificacion, icono, leida: false },
                unreadCount: null
            });
        }

        broadcast('data:changed', {
            resource: resource || 'notifications',
            action: action || 'updated',
            id: referencia_id ?? null,
            data: notificacion
        });

        res.status(202).json({ data: { received: true, notification: notificacion } });
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove, markRead, markAllRead, webhook };
