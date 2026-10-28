const pool = require('../config/database');
const { emitToUser } = require('../realtime');

const WEBHOOK_SECRET = process.env.NOTIFICATIONS_WEBHOOK_SECRET || '';

async function contarNoLeidas(idUsuario) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) AS total FROM notificaciones WHERE id_usuario = ? AND leida = 0',
        [idUsuario]
    );
    return Number(rows[0]?.total) || 0;
}

async function getAll(req, res, next) {
    try {
        const esAdmin = String(req.actor?.rol) === '1' || String(req.actor?.rol).toLowerCase() === 'administrador';
        const idSolicitado = req.query.id_usuario ? Number(req.query.id_usuario) : null;
        // Un usuario solo puede consultar sus propias notificaciones.
        const idUsuario = esAdmin ? idSolicitado : req.actor.id;

        let query = 'SELECT * FROM notificaciones';
        const params = [];
        if (idUsuario) {
            query += ' WHERE id_usuario = ?';
            params.push(idUsuario);
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
        emitToUser(newNotif[0].id_usuario, 'notification:new', {
            ...newNotif[0],
            unreadCount: await contarNoLeidas(newNotif[0].id_usuario)
        });
        res.status(201).json({ data: newNotif[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        const actual = rows[0];
        const b = req.body;

        await pool.query(
            'UPDATE notificaciones SET id_usuario = ?, titulo = ?, mensaje = ?, tipo_notificacion = ?, icono = ?, leida = ?, fecha_envio = ? WHERE id_notificacion = ?',
            [
                b.id_usuario ?? actual.id_usuario,
                b.titulo ?? actual.titulo,
                b.mensaje ?? actual.mensaje,
                b.tipo_notificacion ?? actual.tipo_notificacion,
                b.icono ?? actual.icono,
                b.leida ?? actual.leida,
                b.fecha_envio ?? actual.fecha_envio,
                id
            ]
        );
        const [updated] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        emitToUser(updated[0].id_usuario, 'notification:updated', {
            ...updated[0],
            unreadCount: await contarNoLeidas(updated[0].id_usuario)
        });
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id_usuario FROM notificaciones WHERE id_notificacion = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        await pool.query('DELETE FROM notificaciones WHERE id_notificacion = ?', [id]);
        emitToUser(rows[0].id_usuario, 'notification:updated', {
            id_notificacion: Number(id),
            eliminada: true,
            unreadCount: await contarNoLeidas(rows[0].id_usuario)
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

async function markRead(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            'SELECT * FROM notificaciones WHERE id_notificacion = ?',
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        if (rows[0].id_usuario !== req.actor.id) {
            return res.status(403).json({ error: 'No autorizado para modificar esta notificación' });
        }

        await pool.query('UPDATE notificaciones SET leida = 1 WHERE id_notificacion = ?', [id]);
        const unreadCount = await contarNoLeidas(req.actor.id);
        emitToUser(req.actor.id, 'notification:updated', { id_notificacion: Number(id), leida: true, unreadCount });
        res.json({ data: { ...rows[0], leida: 1 }, unreadCount });
    } catch (error) {
        next(error);
    }
}

async function markAllRead(req, res, next) {
    try {
        await pool.query('UPDATE notificaciones SET leida = 1 WHERE id_usuario = ? AND leida = 0', [req.actor.id]);
        emitToUser(req.actor.id, 'notifications:all-read', { unreadCount: 0 });
        res.json({ data: { unreadCount: 0 } });
    } catch (error) {
        next(error);
    }
}

/**
 * Webhook interno para que otros servicios generen notificaciones.
 * Se autentica con un secreto compartido, no con JWT de usuario.
 */
async function webhook(req, res, next) {
    try {
        if (!WEBHOOK_SECRET) {
            return res.status(503).json({ error: 'Webhook no configurado' });
        }
        if (req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
            return res.status(401).json({ error: 'Secreto de webhook inválido' });
        }

        const { id_usuario, titulo, mensaje, tipo_notificacion, icono, referencia_tabla, referencia_id } = req.body;
        if (!id_usuario || !titulo || !mensaje) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const [result] = await pool.query(
            `INSERT INTO notificaciones
                (id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, referencia_tabla, referencia_id)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
            [id_usuario, titulo, mensaje, tipo_notificacion || '', icono || '', referencia_tabla || null, referencia_id || null]
        );
        const [created] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [result.insertId]);
        const unreadCount = await contarNoLeidas(id_usuario);
        emitToUser(id_usuario, 'notification:new', { ...created[0], unreadCount });

        res.status(201).json({ data: created[0] });
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove, markRead, markAllRead, webhook };
