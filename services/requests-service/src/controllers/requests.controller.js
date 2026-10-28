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

function esGestor(actor = {}) {
    const rol = String(actor.rol ?? '').toLowerCase();
    return ['1', 'administrador', '4', 'administrativo'].includes(rol);
}

const ESTADOS_VALIDOS = [
    'REGISTRADA', 'EN_REVISION', 'ASIGNADA', 'EN_PROCESO',
    'PAUSADA', 'RESUELTA', 'CERRADA', 'RECHAZADA'
];

// La UI y la base usan estados en mayúsculas. Se toleran variantes viejas
// (`Registrada`, `RADICADA`) para que el badge y las acciones sigan funcionando.
function estadoNormalizado(valor, fallback = 'REGISTRADA') {
    if (!valor) return fallback;
    const estado = String(valor).trim().toUpperCase();
    if (estado === 'RADICADA') return 'REGISTRADA';
    return ESTADOS_VALIDOS.includes(estado) ? estado : fallback;
}

function historialActual(valor) {
    if (Array.isArray(valor)) return valor;
    if (typeof valor === 'string') {
        try {
            const parsed = JSON.parse(valor);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function fechaHoraLocal() {
    const ahora = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())} `
        + `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
}

function nuevoEvento(historial, evento) {
    const ids = historial.map((e) => Number(e?.id) || 0);
    return {
        ...evento,
        id: (ids.length ? Math.max(...ids) : 0) + 1,
        fecha: evento.fecha || fechaHoraLocal()
    };
}

const DESCRIPCION_ESTADO = {
    REGISTRADA: 'Solicitud registrada.',
    EN_REVISION: 'La solicitud pasa a revisión.',
    ASIGNADA: 'Solicitud asignada.',
    EN_PROCESO: 'Se inicia la atención de la solicitud.',
    PAUSADA: 'Solicitud pausada.',
    RESUELTA: 'Solicitud resuelta.',
    CERRADA: 'Solicitud cerrada.',
    RECHAZADA: 'Solicitud rechazada.'
};

const DESCRIPCION_TIPO = {
    ASIGNACION: 'Solicitud asignada.',
    NOTA: 'Nota agregada.',
    PAUSA: 'Solicitud pausada.',
    REANUDA: 'Se retoma la atención de la solicitud.',
    REAPERTURA: 'Solicitud reabierta.',
    RECHAZO: 'Solicitud rechazada.'
};

function tipoEventoEstado(anterior, nuevo) {
    if (nuevo === 'RECHAZADA') return 'RECHAZO';
    if (nuevo === 'PAUSADA') return 'PAUSA';
    if (anterior === 'PAUSADA' && nuevo === 'EN_PROCESO') return 'REANUDA';
    if (['RESUELTA', 'CERRADA', 'RECHAZADA'].includes(anterior) && nuevo === 'EN_REVISION') {
        return 'REAPERTURA';
    }
    return 'ESTADO';
}

function descripcionEvento(tipo, estado, motivo) {
    const texto = String(motivo || '').trim();
    const base = DESCRIPCION_TIPO[tipo] || DESCRIPCION_ESTADO[estado] || 'Estado actualizado.';
    if (!texto) return base;
    if (tipo === 'RECHAZO') return `Rechazada: ${texto}`;
    if (tipo === 'REAPERTURA') return `Reabierta: ${texto}`;
    return texto;
}

const SELECT_SOLICITUD = `
    SELECT s.*,
           u.nombre AS usuario_nombre,
           u.apellido AS usuario_apellido,
           sv.nombre AS servicio_nombre,
           r.nombre AS responsable_nombre
    FROM solicitudes s
    LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
    LEFT JOIN servicios sv ON s.id_servicio = sv.id_servicio
    LEFT JOIN usuarios r ON s.id_responsable = r.id_usuario
`;

async function getAll(req, res, next) {
    try {
        if (esGestor(req.actor)) {
            const [rows] = await pool.query(`${SELECT_SOLICITUD} ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC`);
            return res.json({ data: rows });
        }
        const [rows] = await pool.query(
            `${SELECT_SOLICITUD} WHERE s.id_usuario = ? ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC`,
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
        const [rows] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        if (!esGestor(req.actor) && rows[0].id_usuario !== req.actor.id) {
            return res.status(403).json({ error: 'No autorizado para ver esta solicitud' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const {
            tipo, id_servicio, servicio, descripcion, solicitante, estado, respuesta,
            codigo, fecha_solicitud, prioridad, dependencia, historial
        } = req.body;

        if (!tipo || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // La UI envía el nombre del servicio (`servicio`), no el id.
        let servicioId = id_servicio || null;
        if (!servicioId && servicio) {
            const [servicios] = await pool.query(
                'SELECT id_servicio FROM servicios WHERE nombre = ? LIMIT 1',
                [String(servicio).trim()]
            );
            servicioId = servicios.length ? servicios[0].id_servicio : null;
        }

        const actor = String(req.headers['x-user-name'] || solicitante || 'Usuario').trim();
        let historialFinal = historialActual(historial);
        if (!historialFinal.length) {
            historialFinal = [nuevoEvento([], {
                tipo: 'CREACION',
                usuario: actor,
                descripcion: 'Solicitud registrada.'
            })];
        }

        const [result] = await pool.query(
            `INSERT INTO solicitudes
                (codigo, tipo, id_usuario, id_servicio, fecha_solicitud, descripcion,
                 solicitante, estado, respuesta, prioridad, dependencia, historial)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                codigo || '',
                tipo,
                req.actor.id,
                servicioId,
                fechaDia(fecha_solicitud) || new Date().toISOString().slice(0, 10),
                descripcion,
                solicitante || actor,
                estadoNormalizado(estado),
                respuesta || '',
                prioridad || 'Media',
                dependencia || '',
                JSON.stringify(historialFinal)
            ]
        );
        // Se devuelve la fila con los mismos joins que el listado para que la UI
        // pueda insertarla sin mostrar solicitante/servicio vacíos.
        const [newReq] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [result.insertId]);
        res.status(201).json({ data: newReq[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const [actualRows] = await pool.query('SELECT * FROM solicitudes WHERE id_solicitud = ?', [id]);
        if (!actualRows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const actual = actualRows[0];
        const gestor = esGestor(req.actor);

        if (!gestor && actual.id_usuario !== req.actor.id) {
            return res.status(403).json({ error: 'No autorizado para modificar esta solicitud' });
        }

        const b = req.body;
        // Solo administración/atención puede reasignar o cambiar el estado.
        const estadoAnterior = estadoNormalizado(actual.estado, 'REGISTRADA');
        const estado = gestor ? estadoNormalizado(b.estado ?? actual.estado, estadoAnterior) : estadoAnterior;
        const idResponsable = gestor ? (b.id_responsable ?? actual.id_responsable) : actual.id_responsable;
        const prioridad = gestor ? (b.prioridad ?? actual.prioridad) : actual.prioridad;
        const dependencia = gestor ? (b.dependencia ?? actual.dependencia) : actual.dependencia;
        const respuesta = b.respuesta ?? actual.respuesta;

        // La UI puede mandar el nombre del servicio en lugar del id.
        let servicioId = b.id_servicio ?? actual.id_servicio;
        if (!b.id_servicio && b.servicio) {
            const [servicios] = await pool.query(
                'SELECT id_servicio FROM servicios WHERE nombre = ? LIMIT 1',
                [String(b.servicio).trim()]
            );
            servicioId = servicios.length ? servicios[0].id_servicio : servicioId;
        }

        // El historial se construye en el backend para que cualquier cliente
        // (no solo la UI) deje rastro. `motivo` es el texto de nota/pausa/rechazo.
        const actor = String(req.headers['x-user-name'] || 'Sistema').trim();
        const motivo = typeof b.motivo === 'string' ? b.motivo.trim() : '';
        let historial = historialActual(b.historial !== undefined ? b.historial : actual.historial);

        if (idResponsable !== actual.id_responsable) {
            let responsableNombre = null;
            if (idResponsable) {
                const [responsables] = await pool.query(
                    'SELECT nombre, apellido FROM usuarios WHERE id_usuario = ?',
                    [idResponsable]
                );
                if (responsables.length) {
                    responsableNombre = [responsables[0].nombre, responsables[0].apellido]
                        .filter(Boolean).join(' ').trim();
                }
            }
            historial = [...historial, nuevoEvento(historial, {
                tipo: 'ASIGNACION',
                responsable: responsableNombre || 'Sin asignar',
                usuario: actor,
                descripcion: motivo
                    || (responsableNombre ? `Asignada a ${responsableNombre}.` : 'Solicitud asignada.')
            })];
        } else if (estado !== estadoAnterior) {
            const tipo = tipoEventoEstado(estadoAnterior, estado);
            historial = [...historial, nuevoEvento(historial, {
                tipo,
                estado,
                usuario: actor,
                descripcion: descripcionEvento(tipo, estado, motivo)
            })];
        } else if (motivo) {
            historial = [...historial, nuevoEvento(historial, {
                tipo: 'NOTA',
                usuario: actor,
                descripcion: motivo
            })];
        }

        await pool.query(
            `UPDATE solicitudes SET codigo = ?, tipo = ?, id_usuario = ?, id_servicio = ?,
                id_responsable = ?, prioridad = ?, dependencia = ?, fecha_solicitud = ?,
                descripcion = ?, solicitante = ?, estado = ?, respuesta = ?, historial = ?
             WHERE id_solicitud = ?`,
            [
                b.codigo ?? actual.codigo,
                b.tipo ?? actual.tipo,
                b.id_usuario ?? actual.id_usuario,
                servicioId,
                idResponsable,
                prioridad,
                dependencia,
                b.fecha_solicitud !== undefined ? fechaDia(b.fecha_solicitud) : fechaDia(actual.fecha_solicitud),
                b.descripcion ?? actual.descripcion,
                b.solicitante ?? actual.solicitante,
                estado,
                respuesta,
                JSON.stringify(historial),
                id
            ]
        );

        const [updated] = await pool.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = ?`, [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id_usuario FROM solicitudes WHERE id_solicitud = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        if (!esGestor(req.actor) && rows[0].id_usuario !== req.actor.id) {
            return res.status(403).json({ error: 'No autorizado para eliminar esta solicitud' });
        }
        await pool.query('DELETE FROM solicitudes WHERE id_solicitud = ?', [id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
