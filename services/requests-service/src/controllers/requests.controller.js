const pool = require('../config/database');
const { notificar } = require('../services/notifications.client');

const esGestor = (actor) => ['1', '4'].includes(String(actor?.rol));
const idActor = (actor) => Number(actor?.id);

const SELECT_SOLICITUD = `
    SELECT s.*,
           u.nombre   AS usuario_nombre,
           u.apellido AS usuario_apellido,
           sv.nombre  AS servicio_nombre,
           r.nombre   AS responsable_nombre
    FROM solicitudes s
    LEFT JOIN usuarios  u  ON s.id_usuario     = u.id_usuario
    LEFT JOIN servicios  sv ON s.id_servicio    = sv.id_servicio
    LEFT JOIN usuarios  r  ON s.id_responsable = r.id_usuario
`;

async function getHistorial(idSolicitud) {
    const [rows] = await pool.query(
        `SELECT id_historial AS id, tipo, estado, responsable, usuario, fecha, descripcion
         FROM historial_solicitudes
         WHERE id_solicitud = ?
         ORDER BY fecha ASC, id_historial ASC`,
        [idSolicitud]
    );
    return rows;
}

async function getAll(req, res, next) {
    try {
        const actor = req.actor;
        const filtro = esGestor(actor) ? '' : ' WHERE s.id_usuario = ?';
        const params = esGestor(actor) ? [] : [idActor(actor)];
        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
        const offset = (page - 1) * limit;
        const query = hasPagination
            ? `${SELECT_SOLICITUD}${filtro} ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC LIMIT ? OFFSET ?`
            : `${SELECT_SOLICITUD}${filtro}`;
        const [rows] = await pool.query(query, hasPagination ? [...params, limit, offset] : params);

        let total = null;
        if (hasPagination) {
            const [[count]] = await pool.query(
                `SELECT COUNT(*) AS total FROM solicitudes s${filtro}`,
                params
            );
            total = Number(count.total);
        }

        // El historial viaja anidado para no disparar una consulta por solicitud.
        // Solo se consultan las solicitudes visibles para este actor.
        let historial = [];
        if (rows.length > 0) {
            const ids = rows.map((row) => row.id_solicitud);
            const placeholders = ids.map(() => '?').join(', ');
            [historial] = await pool.query(
                `SELECT id_historial AS id, id_solicitud, tipo, estado, responsable, usuario, fecha, descripcion
                 FROM historial_solicitudes
                 WHERE id_solicitud IN (${placeholders})
                 ORDER BY fecha ASC, id_historial ASC`,
                ids
            );
        }

        const porSolicitud = new Map();
        for (const item of historial) {
            if (!porSolicitud.has(item.id_solicitud)) {
                porSolicitud.set(item.id_solicitud, []);
            }
            const { id_solicitud, ...entrada } = item;
            porSolicitud.get(item.id_solicitud).push(entrada);
        }

        const data = rows.map((row) => ({
            ...row,
            historial: porSolicitud.get(row.id_solicitud) || []
        }));

        if (hasPagination) {
            return res.json({
                data: {
                    items: data,
                    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
                }
            });
        }
        res.json({ data });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        if (!esGestor(req.actor) && Number(rows[0].id_usuario) !== idActor(req.actor)) {
            return res.status(403).json({ error: 'No puedes ver una solicitud ajena' });
        }
        const historial = await getHistorial(id);
        res.json({ data: { ...rows[0], historial } });
    } catch (error) {
        next(error);
    }
}

async function registrarHistorial(idSolicitud, { tipo, estado, responsable = '', usuario = '', descripcion = '' }) {
    await pool.query(
        `INSERT INTO historial_solicitudes (id_solicitud, tipo, estado, responsable, usuario, descripcion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idSolicitud, tipo, estado || null, responsable, usuario, descripcion]
    );
}

async function create(req, res, next) {
    try {
        const {
            tipo, id_usuario, id_servicio, id_responsable, prioridad, dependencia,
            descripcion, solicitante, estado, respuesta, codigo, fecha_solicitud
        } = req.body;

        if (!tipo || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Un usuario normal no puede crear solicitudes a nombre de otro.
        const idUsuarioFinal = esGestor(req.actor) ? (id_usuario || null) : idActor(req.actor);

        const [result] = await pool.query(
            `INSERT INTO solicitudes
                (codigo, tipo, id_usuario, id_servicio, id_responsable, prioridad, dependencia,
                 fecha_solicitud, descripcion, solicitante, estado, respuesta)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                codigo || '', tipo, idUsuarioFinal, id_servicio || null, id_responsable || null,
                prioridad || 'Media', dependencia || '', fecha_solicitud || new Date(), descripcion,
                solicitante || '', estado || 'REGISTRADA', respuesta || ''
            ]
        );

        await registrarHistorial(result.insertId, {
            tipo: 'CREACION',
            estado: estado || 'REGISTRADA',
            usuario: solicitante || '',
            descripcion: 'Solicitud registrada.'
        });

        const [newReq] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [result.insertId]);
        const historial = await getHistorial(result.insertId);
        const solicitud = newReq[0];
        notificar({
            id_usuario: idUsuarioFinal,
            titulo: 'Solicitud registrada',
            mensaje: `Tu solicitud ${solicitud.codigo || solicitud.id_solicitud} (${tipo}) quedó en estado ${solicitud.estado}.`,
            tipo_notificacion: 'Solicitud',
            icono: 'solicitudes'
        });
        res.status(201).json({ data: { ...solicitud, historial } });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        if (!esGestor(req.actor)) {
            return res.status(403).json({ error: 'Solo administración puede modificar solicitudes' });
        }
        const { id } = req.params;
        const body = req.body || {};

        const [previas] = await pool.query('SELECT estado FROM solicitudes WHERE id_solicitud = ?', [id]);
        if (!previas.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Solo se tocan las columnas presentes en el body: un PUT parcial no
        // debe vaciar dependencia, prioridad, respuesta, etc.
        const EDITABLES = {
            codigo: 'codigo',
            tipo: 'tipo',
            id_usuario: 'id_usuario',
            id_servicio: 'id_servicio',
            id_responsable: 'id_responsable',
            prioridad: 'prioridad',
            dependencia: 'dependencia',
            fecha_solicitud: 'fecha_solicitud',
            descripcion: 'descripcion',
            solicitante: 'solicitante',
            estado: 'estado',
            respuesta: 'respuesta'
        };

        const campos = [];
        const valores = [];
        for (const [clave, columna] of Object.entries(EDITABLES)) {
            if (body[clave] !== undefined) {
                campos.push(`${columna} = ?`);
                valores.push(body[clave] === '' ? null : body[clave]);
            }
        }

        if (!campos.length) {
            const historial = await getHistorial(id);
            const [sinCambios] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [id]);
            return res.json({ data: { ...sinCambios[0], historial } });
        }

        valores.push(id);
        await pool.query(
            `UPDATE solicitudes SET ${campos.join(', ')} WHERE id_solicitud = ?`,
            valores
        );

        // Solo se audita si el estado realmente cambió.
        const estado = body.estado;
        if (estado && estado !== previas[0].estado) {
            await registrarHistorial(id, {
                tipo: 'ESTADO',
                estado,
                usuario: body.solicitante || '',
                descripcion: `Estado actualizado a ${estado}.`
            });
        }

        const [updated] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [id]);
        const historial = await getHistorial(id);
        notificar({
            id_usuario: updated[0].id_usuario,
            titulo: 'Solicitud actualizada',
            mensaje: `Tu solicitud ${updated[0].codigo || id} quedó en estado ${updated[0].estado}.`,
            tipo_notificacion: 'Solicitud',
            icono: 'solicitudes'
        });
        res.json({ data: { ...updated[0], historial } });
    } catch (error) {
        next(error);
    }
}

/** POST /:id/avance — ejecuta una acción del flujo y deja registro en el historial. */
async function advance(req, res, next) {
    try {
        if (!esGestor(req.actor)) {
            return res.status(403).json({ error: 'Solo administración puede cambiar el estado' });
        }
        const { id } = req.params;
        const { accion, estado, responsable = '', usuario = '', descripcion = '' } = req.body || {};

        if (!estado) {
            return res.status(400).json({ error: 'El estado destino es obligatorio' });
        }

        const [rows] = await pool.query(
            'SELECT id_solicitud, id_responsable, estado FROM solicitudes WHERE id_solicitud = ?',
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const solicitud = rows[0];
        const nuevoResponsable = responsable || solicitud.id_responsable || null;

        const campos = ['estado = ?', 'id_responsable = ?'];
        const valores = [estado, nuevoResponsable];

        if (accion === 'resolver' || accion === 'cerrar' || accion === 'rechazar') {
            campos.push('respuesta = ?');
            valores.push(descripcion);
        }

        valores.push(id);
        await pool.query(`UPDATE solicitudes SET ${campos.join(', ')} WHERE id_solicitud = ?`, valores);

        const TIPOS = {
            revisar: 'ESTADO',
            asignar: 'ASIGNACION',
            proceso: 'ESTADO',
            pausar: 'PAUSA',
            reanudar: 'REANUDA',
            resolver: 'ESTADO',
            cerrar: 'ESTADO',
            rechazar: 'RECHAZO',
            reabrir: 'REAPERTURA',
            nota: 'NOTA'
        };

        await registrarHistorial(id, {
            tipo: TIPOS[accion] || 'NOTA',
            estado,
            responsable: responsable || '',
            usuario,
            descripcion: descripcion || `Acción ${accion} aplicada.`
        });

        const [updated] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [id]);
        const historial = await getHistorial(id);
        notificar({
            id_usuario: updated[0].id_usuario,
            titulo: 'Solicitud actualizada',
            mensaje: `Tu solicitud ${updated[0].codigo || id} cambió a estado ${updated[0].estado}.`,
            tipo_notificacion: 'Solicitud',
            icono: 'solicitudes'
        });
        res.json({ data: { ...updated[0], historial } });
    } catch (error) {
        next(error);
    }
}

/** POST /:id/notas — agrega una nota suelta al historial sin cambiar el estado. */
async function addNota(req, res, next) {
    try {
        if (!esGestor(req.actor)) {
            return res.status(403).json({ error: 'Solo administración puede agregar notas' });
        }
        const { id } = req.params;
        const { usuario = '', descripcion = '' } = req.body || {};

        if (!descripcion.trim()) {
            return res.status(400).json({ error: 'La nota no puede estar vacía' });
        }

        const [rows] = await pool.query('SELECT id_solicitud FROM solicitudes WHERE id_solicitud = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        await registrarHistorial(id, { tipo: 'NOTA', usuario, descripcion });

        const [updated] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [id]);
        const historial = await getHistorial(id);
        res.status(201).json({ data: { ...updated[0], historial } });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!esGestor(req.actor)) {
            return res.status(403).json({ error: 'Solo administración puede eliminar solicitudes' });
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

module.exports = { getAll, getOne, create, update, advance, addNota, remove };
