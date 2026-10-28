const pool = require('../config/database');

// MySQL DATE no acepta el ISO completo (`2026-09-08T00:00:00.000Z`).
function fechaDia(valor) {
    if (!valor) return valor;
    if (valor instanceof Date) {
        const mes = String(valor.getMonth() + 1).padStart(2, '0');
        const dia = String(valor.getDate()).padStart(2, '0');
        return `${valor.getFullYear()}-${mes}-${dia}`;
    }
    const texto = String(valor);
    const iso = texto.match(/^\d{4}-\d{2}-\d{2}/);
    if (iso) return iso[0];
    const fecha = new Date(texto);
    if (Number.isNaN(fecha.getTime())) return texto;
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function esAdmin(actor = {}) {
    const rol = String(actor.rol ?? '').toLowerCase();
    return rol === '1' || rol === 'administrador' || rol === '4' || rol === 'administrativo';
}

// Fecha de hoy en la misma zona local que usa `fechaDia`, sin depender de UTC.
function hoyDia() {
    return fechaDia(new Date());
}

function esFechaPasada(fecha) {
    return Boolean(fecha) && fecha < hoyDia();
}

const SELECT_RESERVA = `
    SELECT r.*,
           u.nombre AS usuario_nombre,
           u.apellido AS usuario_apellido,
           rec.nombre_recurso,
           rec.tipo_recurso
    FROM reservas r
    LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
    LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
`;

async function getAll(req, res, next) {
    try {
        if (esAdmin(req.actor)) {
            const [rows] = await pool.query(`${SELECT_RESERVA} ORDER BY r.fecha_reserva DESC, r.hora_inicio ASC`);
            return res.json({ data: rows });
        }
        const [rows] = await pool.query(
            `${SELECT_RESERVA} WHERE r.id_usuario = ? ORDER BY r.fecha_reserva DESC, r.hora_inicio ASC`,
            [req.actor.id]
        );
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`${SELECT_RESERVA} WHERE r.id_reserva = ?`, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        if (!esAdmin(req.actor) && rows[0].id_usuario !== req.actor.id) {
            return res.status(403).json({ error: 'No autorizado para ver esta reserva' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function getOcupados(req, res, next) {
    try {
        const { fecha, hora_inicio, hora_fin } = req.query;
        if (!fecha) {
            return res.status(400).json({ error: 'La fecha es obligatoria' });
        }

        let query = `
            SELECT id_reserva, id_recurso, hora_inicio, hora_fin
            FROM reservas
            WHERE fecha_reserva = ? AND estado <> 'Cancelada'
        `;
        const params = [fechaDia(fecha)];

        // Si llegan ambas horas, solo se devuelven las reservas que se cruzan.
        if (hora_inicio && hora_fin) {
            if (hora_inicio >= hora_fin) {
                return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
            }
            query += ' AND hora_inicio < ? AND ? < hora_fin';
            params.push(hora_fin, hora_inicio);
        }

        query += ' ORDER BY hora_inicio ASC';
        const [rows] = await pool.query(query, params);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado } = req.body;
        // El dueño de la reserva siempre es el usuario autenticado.
        const id_usuario = req.actor.id;

        if (!id_recurso || !fecha_reserva || !hora_inicio || !hora_fin) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        if (hora_inicio >= hora_fin) {
            return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
        }

        const fecha = fechaDia(fecha_reserva);
        if (esFechaPasada(fecha)) {
            return res.status(400).json({ error: 'No se puede reservar en una fecha pasada' });
        }

        const [conflictos] = await pool.query(
            `SELECT id_reserva FROM reservas
             WHERE id_recurso = ? AND fecha_reserva = ? AND estado <> 'Cancelada'
               AND hora_inicio < ? AND ? < hora_fin`,
            [id_recurso, fecha, hora_fin, hora_inicio]
        );
        if (conflictos.length) {
            return res.status(409).json({ error: 'El recurso ya está reservado en ese horario' });
        }

        const [result] = await pool.query(
            'INSERT INTO reservas (id_usuario, id_recurso, fecha_reserva, hora_inicio, hora_fin, motivo, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_usuario, id_recurso, fecha, hora_inicio, hora_fin, motivo || '', estado || 'Pendiente']
        );
        const [newReservation] = await pool.query(`${SELECT_RESERVA} WHERE r.id_reserva = ?`, [result.insertId]);
        res.status(201).json({ data: newReservation[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const [actualRows] = await pool.query('SELECT * FROM reservas WHERE id_reserva = ?', [id]);
        if (!actualRows.length) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        const actual = actualRows[0];
        const admin = esAdmin(req.actor);

        if (!admin && actual.id_usuario !== req.actor.id) {
            return res.status(403).json({ error: 'No autorizado para modificar esta reserva' });
        }

        const b = req.body;
        const estado = b.estado ?? actual.estado;

        // Un usuario solo puede cancelar su propia reserva; el resto de
        // cambios de estado quedan reservados a administración.
        if (!admin && estado !== 'Cancelada') {
            return res.status(403).json({ error: 'Solo puedes cancelar tus reservas' });
        }

        const nuevaFecha = b.fecha_reserva !== undefined
            ? fechaDia(b.fecha_reserva)
            : fechaDia(actual.fecha_reserva);
        const nuevaHoraInicio = b.hora_inicio ?? actual.hora_inicio;
        const nuevaHoraFin = b.hora_fin ?? actual.hora_fin;
        const nuevoRecurso = admin ? (b.id_recurso ?? actual.id_recurso) : actual.id_recurso;

        // Solo se valida la fecha cuando se está moviendo la reserva: así se
        // puede cancelar o cambiar el estado de una reserva histórica.
        if (b.fecha_reserva !== undefined && esFechaPasada(nuevaFecha) && nuevaFecha !== fechaDia(actual.fecha_reserva)) {
            return res.status(400).json({ error: 'No se puede reservar en una fecha pasada' });
        }
        if (nuevaHoraInicio >= nuevaHoraFin) {
            return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
        }

        if (estado !== 'Cancelada') {
            const [conflictos] = await pool.query(
                `SELECT id_reserva FROM reservas
                 WHERE id_reserva <> ? AND id_recurso = ? AND fecha_reserva = ? AND estado <> 'Cancelada'
                   AND hora_inicio < ? AND ? < hora_fin`,
                [id, nuevoRecurso, nuevaFecha, nuevaHoraFin, nuevaHoraInicio]
            );
            if (conflictos.length) {
                return res.status(409).json({ error: 'El recurso ya está reservado en ese horario' });
            }
        }

        await pool.query(
            'UPDATE reservas SET id_usuario = ?, id_recurso = ?, fecha_reserva = ?, hora_inicio = ?, hora_fin = ?, motivo = ?, estado = ? WHERE id_reserva = ?',
            [
                admin ? (b.id_usuario ?? actual.id_usuario) : actual.id_usuario,
                nuevoRecurso,
                nuevaFecha,
                nuevaHoraInicio,
                nuevaHoraFin,
                b.motivo ?? actual.motivo,
                estado,
                id
            ]
        );

        const [updated] = await pool.query(`${SELECT_RESERVA} WHERE r.id_reserva = ?`, [id]);
        res.json({ data: updated[0] });
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
        if (!esAdmin(req.actor) && rows[0].id_usuario !== req.actor.id) {
            return res.status(403).json({ error: 'No autorizado para eliminar esta reserva' });
        }
        await pool.query('DELETE FROM reservas WHERE id_reserva = ?', [id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, getOcupados, create, update, remove };
