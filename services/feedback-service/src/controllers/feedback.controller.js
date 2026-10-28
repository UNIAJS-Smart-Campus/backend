const pool = require('../config/database');

const CAMPOS = [
    'id_usuario', 'tipo', 'fecha', 'estado', 'descripcion', 'solicitante',
    'respuesta', 'fecha_respuesta', 'sede', 'area', 'asunto', 'tipo_perfil',
    'tipo_documento', 'identificacion', 'nombre', 'telefono', 'correo',
    'prioridad', 'asignado_a', 'adjunto', 'historial'
];

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM pqrs ORDER BY fecha DESC, id_pqrs DESC');
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
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const {
            tipo, fecha, estado, descripcion, sede, area, asunto, respuesta,
            tipo_perfil, tipo_documento, identificacion, nombre, telefono, correo,
            prioridad, asignado_a, adjunto, historial, id_usuario
        } = req.body;

        if (!tipo || !descripcion) {
            return res.status(400).json({ error: 'Tipo y descripción son requeridos' });
        }

        // `id_pqrs` es AUTO_INCREMENT: nunca se envía desde el cliente.
        const [result] = await pool.query(
            `INSERT INTO pqrs (${CAMPOS.join(', ')})
             VALUES (${CAMPOS.map(() => '?').join(', ')})`,
            [
                id_usuario ?? req.actor?.id ?? null,
                tipo,
                fecha || new Date().toISOString().slice(0, 10),
                estado || 'Abierta',
                descripcion,
                nombre || '',
                respuesta || '',
                null,
                sede || 'SINCELEJO',
                area || 'PQRS',
                asunto || '',
                tipo_perfil || 'Estudiante',
                tipo_documento || '',
                identificacion || '',
                nombre || '',
                telefono || '',
                correo || '',
                prioridad || 'Media',
                asignado_a || '',
                adjunto || null,
                historial ? JSON.stringify(historial) : null
            ]
        );
        const [newPqrs] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [result.insertId]);
        res.status(201).json({ data: newPqrs[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const [actualRows] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [id]);
        if (!actualRows.length) {
            return res.status(404).json({ error: 'PQRS no encontrada' });
        }
        const actual = actualRows[0];
        const b = req.body;

        await pool.query(
            `UPDATE pqrs SET id_usuario = ?, tipo = ?, fecha = ?, estado = ?, descripcion = ?,
                solicitante = ?, respuesta = ?, fecha_respuesta = ?, sede = ?, area = ?, asunto = ?,
                tipo_perfil = ?, tipo_documento = ?, identificacion = ?, nombre = ?, telefono = ?,
                correo = ?, prioridad = ?, asignado_a = ?, adjunto = ?, historial = ?
             WHERE id_pqrs = ?`,
            [
                b.id_usuario ?? actual.id_usuario,
                b.tipo ?? actual.tipo,
                b.fecha ?? actual.fecha,
                b.estado ?? actual.estado,
                b.descripcion ?? actual.descripcion,
                b.solicitante ?? actual.solicitante,
                b.respuesta ?? actual.respuesta,
                b.fecha_respuesta ?? actual.fecha_respuesta,
                b.sede ?? actual.sede,
                b.area ?? actual.area,
                b.asunto ?? actual.asunto,
                b.tipo_perfil ?? actual.tipo_perfil,
                b.tipo_documento ?? actual.tipo_documento,
                b.identificacion ?? actual.identificacion,
                b.nombre ?? actual.nombre,
                b.telefono ?? actual.telefono,
                b.correo ?? actual.correo,
                b.prioridad ?? actual.prioridad,
                b.asignado_a ?? actual.asignado_a,
                b.adjunto ?? actual.adjunto,
                b.historial !== undefined ? JSON.stringify(b.historial) : actual.historial,
                id
            ]
        );

        const [updated] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
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
