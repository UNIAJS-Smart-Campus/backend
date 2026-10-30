const pool = require('../config/database');
const { emitToUser } = require('../realtime');

const idActor = (actor) => Number(actor?.id);
const esAdmin = (actor) => String(actor?.rol) === '1';

async function contarNoLeidas(idUsuario) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) AS total FROM notificaciones WHERE id_usuario = ? AND leida = 0',
        [idUsuario]
    );
    return Number(rows[0]?.total || 0);
}

async function emitirCambio(idUsuario, evento, notificacion) {
    emitToUser(idUsuario, evento, {
        notification: notificacion,
        unreadCount: await contarNoLeidas(idUsuario)
    });
}

async function getAll(req, res, next) {
    try {
        // El buzón es personal: siempre se filtra por el actor del JWT.
        const [rows] = await pool.query(
            'SELECT * FROM notificaciones WHERE id_usuario = ? ORDER BY fecha_envio DESC',
            [idActor(req.actor)]
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
        if (!esAdmin(req.actor) && Number(rows[0].id_usuario) !== idActor(req.actor)) {
            return res.status(403).json({ error: 'No puedes ver una notificación ajena' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio } = req.body;
        const destino = esAdmin(req.actor) && id_usuario ? id_usuario : idActor(req.actor);

        if (!destino || !titulo || !mensaje) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [destino, titulo, mensaje, tipo_notificacion || '', icono || '', leida || 0, fecha_envio || new Date()]
        );
        const [newNotif] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [result.insertId]);
        await emitirCambio(destino, 'notification:new', newNotif[0]);
        res.status(201).json({ data: newNotif[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const [actual] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        if (!actual.length) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        const notificacion = actual[0];
        if (!esAdmin(req.actor) && Number(notificacion.id_usuario) !== idActor(req.actor)) {
            return res.status(403).json({ error: 'No puedes modificar una notificación ajena' });
        }

        // El dueño no puede reasignar la notificación a otro usuario.
        const CAMPOS = ['titulo', 'mensaje', 'tipo_notificacion', 'icono', 'leida', 'fecha_envio'];
        const asignaciones = [];
        const valores = [];
        for (const campo of CAMPOS) {
            if (req.body[campo] !== undefined) {
                asignaciones.push(`${campo} = ?`);
                valores.push(campo === 'leida' ? (req.body[campo] ? 1 : 0) : req.body[campo]);
            }
        }
        if (!asignaciones.length) {
            return res.status(400).json({ error: 'Nada que actualizar' });
        }
        valores.push(id);
        await pool.query(`UPDATE notificaciones SET ${asignaciones.join(', ')} WHERE id_notificacion = ?`, valores);

        const [updated] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        await emitirCambio(notificacion.id_usuario, 'notification:updated', updated[0]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [actual] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [id]);
        if (!actual.length) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        const notificacion = actual[0];
        if (!esAdmin(req.actor) && Number(notificacion.id_usuario) !== idActor(req.actor)) {
            return res.status(403).json({ error: 'No puedes eliminar una notificación ajena' });
        }
        await pool.query('DELETE FROM notificaciones WHERE id_notificacion = ?', [id]);
        await emitirCambio(notificacion.id_usuario, 'notification:updated', null);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

/**
 * POST /webhook — lo usan los demás microservicios (events, reservations,
 * requests, feedback) con el secreto compartido. No pasa por el gateway ni
 * por el actor del JWT.
 */
async function webhook(req, res, next) {
    try {
        const secreto = process.env.NOTIFICATIONS_WEBHOOK_SECRET;
        if (!secreto || req.headers['x-webhook-secret'] !== secreto) {
            return res.status(401).json({ error: 'Webhook no autorizado' });
        }

        const { id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio } = req.body || {};
        if (!id_usuario || !titulo || !mensaje) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const [result] = await pool.query(
            'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo_notificacion, icono, leida, fecha_envio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_usuario, titulo, mensaje, tipo_notificacion || '', icono || '', leida || 0, fecha_envio || new Date()]
        );
        const [nueva] = await pool.query('SELECT * FROM notificaciones WHERE id_notificacion = ?', [result.insertId]);
        await emitirCambio(id_usuario, 'notification:new', nueva[0]);
        res.status(201).json({ data: nueva[0] });
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove, webhook };
