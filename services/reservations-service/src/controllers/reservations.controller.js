const pool = require('../config/database');
const { notificar } = require('../services/notifications.client');

const esGestor = (actor) => ['1', '4'].includes(String(actor?.rol));
const idActor = (actor) => Number(actor?.id);

async function getAll(req, res, next) {
    try {
        const actor = req.actor;
        const filtro = esGestor(actor) ? '' : ' WHERE r.id_usuario = ?';
        const params = esGestor(actor) ? [] : [idActor(actor)];
        const [rows] = await pool.query(`
            SELECT r.*,
                   u.nombre AS usuario_nombre,
                   u.apellido AS usuario_apellido,
                   rec.nombre_recurso,
                   rec.tipo_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            ${filtro}
        `, params);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT r.*,
                   u.nombre AS usuario_nombre,
                   u.apellido AS usuario_apellido,
                   rec.nombre_recurso,
                   rec.tipo_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        if (!esGestor(req.actor) && Number(rows[0].id_usuario) !== idActor(req.actor)) {
            return res.status(403).json({ error: 'No puedes ver una reserva ajena' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado } = req.body;
        // Un usuario normal solo puede reservar para sí mismo.
        const idUsuarioFinal = esGestor(req.actor) ? (id_usuario || idActor(req.actor)) : idActor(req.actor);
        if (!idUsuarioFinal || !id_recurso || !fecha_reserva || !hora_inicio || !hora_fin || !estado) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO reservas (id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [idUsuarioFinal, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo || '', estado]
        );
        const [newReservation] = await pool.query(`
            SELECT r.*, u.nombre AS usuario_nombre, rec.nombre_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [result.insertId]);

        const reserva = newReservation[0];
        notificar({
            id_usuario: idUsuarioFinal,
            titulo: 'Reserva registrada',
            mensaje: `Tu reserva de ${reserva.nombre_recurso || 'un recurso'} para el ${fecha_reserva} (${hora_inicio} - ${hora_fin}) quedó ${estado}.`,
            tipo_notificacion: 'Reserva',
            icono: 'reservas'
        });
        res.status(201).json({ data: reserva });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const [actual] = await pool.query('SELECT id_usuario FROM reservas WHERE id_reserva = ?', [id]);
        if (!actual.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        if (!esGestor(req.actor)) {
            if (Number(actual[0].id_usuario) !== idActor(req.actor)) {
                return res.status(403).json({ error: 'No puedes modificar una reserva ajena' });
            }
            // Un usuario solo puede cancelar; no cambia fechas, recurso ni dueño.
            await pool.query('UPDATE reservas SET estado = ? WHERE id_reserva = ?', ['Cancelada', id]);
        } else {
            const { id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado } = req.body;
            const [result] = await pool.query(
                'UPDATE reservas SET id_usuario = ?, id_recurso = ?, fecha_reserva = ?, hora_inicio = ?, hora_fin = ?, motivo = ?, estado = ? WHERE id_reserva = ?',
                [id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo || '', estado, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }
        }

        const [updated] = await pool.query(`
            SELECT r.*, u.nombre AS usuario_nombre, rec.nombre_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [id]);

        const reservaActualizada = updated[0];
        notificar({
            id_usuario: reservaActualizada.id_usuario,
            titulo: 'Reserva actualizada',
            mensaje: `Tu reserva de ${reservaActualizada.nombre_recurso || 'un recurso'} cambió a estado ${reservaActualizada.estado}.`,
            tipo_notificacion: 'Reserva',
            icono: 'reservas'
        });
        res.json({ data: reservaActualizada });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [actual] = await pool.query('SELECT id_usuario FROM reservas WHERE id_reserva = ?', [id]);
        if (!actual.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        if (!esGestor(req.actor) && Number(actual[0].id_usuario) !== idActor(req.actor)) {
            return res.status(403).json({ error: 'No puedes eliminar una reserva ajena' });
        }
        await pool.query('DELETE FROM reservas WHERE id_reserva = ?', [id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
