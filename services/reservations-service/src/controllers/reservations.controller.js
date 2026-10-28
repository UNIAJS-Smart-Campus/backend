const pool = require('../config/database');
const { notificar } = require('../services/notifications.client');

const ROLES_GESTION = new Set(['Administrador', 'Administrativo', 'Funcionario']);
const ESTADOS_INACTIVOS = new Set(['Cancelada', 'Rechazada']);

function esGestor(actor) {
    return Boolean(actor && ROLES_GESTION.has(actor.rol));
}

async function getAll(req, res, next) {
    try {
        const params = [];
        let query = `
            SELECT r.*, 
                   u.nombre AS usuario_nombre, 
                   u.apellido AS usuario_apellido,
                   rec.nombre_recurso,
                   rec.tipo_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
        `;
        if (!esGestor(req.actor)) {
            query += ' WHERE r.id_usuario = ?';
            params.push(req.actor.id);
        }
        query += ' ORDER BY r.fecha_reserva DESC, r.hora_inicio ASC';
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
        if (!esGestor(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No tienes acceso a esta reserva' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado } = req.body;
        if (!id_recurso || !fecha_reserva || !hora_inicio || !hora_fin || !estado) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const propietario = esGestor(req.actor) && id_usuario ? Number(id_usuario) : req.actor.id;

        // Evita dobles reservas del mismo recurso en horarios que se solapan.
        const [conflictos] = await pool.query(
            `SELECT id_reserva FROM reservas
             WHERE id_recurso = ? AND fecha_reserva = ? AND estado NOT IN ('Cancelada', 'Rechazada')
               AND hora_inicio < ? AND hora_fin > ?
             LIMIT 1`,
            [id_recurso, fecha_reserva, hora_fin, hora_inicio]
        );
        if (conflictos.length) {
            return res.status(409).json({ error: 'El recurso ya está reservado en ese horario' });
        }

        const [result] = await pool.query(
            'INSERT INTO reservas (id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [propietario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo || '', estado]
        );
        const [newReservation] = await pool.query(`
            SELECT r.*, u.nombre AS usuario_nombre, rec.nombre_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [result.insertId]);
        res.status(201).json({ data: newReservation[0] });

        notificar({
            id_usuario: propietario,
            titulo: 'Reserva registrada',
            mensaje: `Tu reserva para ${newReservation[0].nombre_recurso || 'el recurso'} el ${fecha_reserva} de ${hora_inicio} a ${hora_fin} fue registrada.`,
            tipo_notificacion: 'Reserva',
            icono: 'reservas',
            referencia_tabla: 'reservas',
            referencia_id: result.insertId,
            resource: 'reservations',
            action: 'created'
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado } = req.body;
        const [existingRows] = await pool.query('SELECT * FROM reservas WHERE id_reserva = ?', [id]);
        if (!existingRows.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        const prev = existingRows[0];
        const gestor = esGestor(req.actor);
        if (!gestor && Number(prev.id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No puedes modificar esta reserva' });
        }

        const recursoFinal = id_recurso ?? prev.id_recurso;
        const fechaFinal = fecha_reserva ?? prev.fecha_reserva;
        const inicioFinal = hora_inicio ?? prev.hora_inicio;
        const finFinal = hora_fin ?? prev.hora_fin;
        const motivoFinal = motivo ?? prev.motivo;
        const propietarioFinal = gestor ? (id_usuario ?? prev.id_usuario) : prev.id_usuario;
        const estadoFinal = gestor
            ? (estado ?? prev.estado)
            : (estado === 'Cancelada' ? 'Cancelada' : prev.estado);

        if (!ESTADOS_INACTIVOS.has(estadoFinal)) {
            const [conflictos] = await pool.query(
                `SELECT id_reserva FROM reservas
                 WHERE id_recurso = ? AND fecha_reserva = ? AND id_reserva <> ?
                   AND estado NOT IN ('Cancelada', 'Rechazada')
                   AND hora_inicio < ? AND hora_fin > ?
                 LIMIT 1`,
                [recursoFinal, fechaFinal, id, finFinal, inicioFinal]
            );
            if (conflictos.length) {
                return res.status(409).json({ error: 'El recurso ya está reservado en ese horario' });
            }
        }

        const [result] = await pool.query(
            'UPDATE reservas SET id_usuario = ?, id_recurso = ?, fecha_reserva = ?, hora_inicio = ?, hora_fin = ?, motivo = ?, estado = ? WHERE id_reserva = ?',
            [propietarioFinal, recursoFinal, fechaFinal, inicioFinal, finFinal, motivoFinal || '', estadoFinal, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        const [updated] = await pool.query(`
            SELECT r.*, u.nombre AS usuario_nombre, rec.nombre_recurso
            FROM reservas r
            LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
            WHERE r.id_reserva = ?
        `, [id]);
        res.json({ data: updated[0] });

        const cambioEstado = Boolean(estadoFinal && prev.estado !== estadoFinal);
        notificar({
            id_usuario: prev.id_usuario,
            titulo: cambioEstado ? 'Reserva actualizada' : 'Reserva editada',
            mensaje: cambioEstado
                ? `Tu reserva de ${prev.fecha_reserva} cambió al estado "${estadoFinal}".`
                : `Tu reserva de ${prev.fecha_reserva} fue actualizada.`,
            tipo_notificacion: 'Reserva',
            icono: 'reservas',
            referencia_tabla: 'reservas',
            referencia_id: id,
            resource: 'reservations',
            action: 'updated',
            silent: !cambioEstado
        });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id_usuario FROM reservas WHERE id_reserva = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        if (!esGestor(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No puedes eliminar esta reserva' });
        }
        const [result] = await pool.query('DELETE FROM reservas WHERE id_reserva = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
