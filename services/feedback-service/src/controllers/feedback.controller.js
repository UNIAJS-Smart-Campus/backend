const pool = require('../config/database');

const esGestor = (actor) => ['1', '4'].includes(String(actor?.rol));
const idActor = (actor) => Number(actor?.id);

// Columnas que el frontend puede enviar. La lista blanca evita inyección de
// columnas y, sobre todo, que un PUT parcial vacíe columnas NOT NULL al no
// venir en el body (mismo patrón que requests-service).
const CAMPOS = [
    'id_usuario', 'tipo', 'fecha', 'estado', 'descripcion', 'respuesta',
    'fecha_respuesta', 'sede', 'area', 'asunto', 'tipo_perfil',
    'tipo_documento', 'identificacion', 'nombre', 'telefono', 'correo',
    'prioridad', 'asignado_a', 'adjunto'
];

async function getAll(req, res, next) {
    try {
        const actor = req.actor;
        const [rows] = await pool.query(
            esGestor(actor) ? 'SELECT * FROM pqrs' : 'SELECT * FROM pqrs WHERE id_usuario = ?',
            esGestor(actor) ? [] : [idActor(actor)]
        );
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
        if (!esGestor(req.actor) && Number(rows[0].id_usuario) !== idActor(req.actor)) {
            return res.status(403).json({ error: 'No puedes ver una PQRS ajena' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { tipo, fecha, estado, descripcion } = req.body;
        if (!tipo || !fecha || !estado || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Una PQRS siempre queda a nombre de quien la radica (salvo gestores).
        if (!esGestor(req.actor)) {
            req.body.id_usuario = idActor(req.actor);
        }

        // Solo se insertan los campos presentes: el resto toma su DEFAULT.
        const columnas = [];
        const valores = [];
        for (const campo of CAMPOS) {
            if (req.body[campo] !== undefined && req.body[campo] !== null) {
                columnas.push(campo);
                valores.push(req.body[campo]);
            }
        }

        const [result] = await pool.query(
            `INSERT INTO pqrs (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
            valores
        );
        const [newPqrs] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [result.insertId]);
        res.status(201).json({ data: newPqrs[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        if (!esGestor(req.actor)) {
            return res.status(403).json({ error: 'Solo administración puede gestionar PQRS' });
        }
        const { id } = req.params;

        // Actualización parcial: solo las columnas presentes en el body.
        const asignaciones = [];
        const valores = [];
        for (const campo of CAMPOS) {
            if (req.body[campo] !== undefined) {
                asignaciones.push(`${campo} = ?`);
                valores.push(req.body[campo]);
            }
        }
        if (!asignaciones.length) {
            return res.status(400).json({ error: 'Nada que actualizar' });
        }
        valores.push(id);

        const [result] = await pool.query(
            `UPDATE pqrs SET ${asignaciones.join(', ')} WHERE id_pqrs = ?`,
            valores
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'PQRS no encontrada' });
        }
        const [updated] = await pool.query('SELECT * FROM pqrs WHERE id_pqrs = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!esGestor(req.actor)) {
            return res.status(403).json({ error: 'Solo administración puede eliminar PQRS' });
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
