const pool = require('../config/database');

// Lista blanca de columnas que el frontend puede enviar. Evita inyección de
// columnas y que un PUT parcial vacíe columnas NOT NULL (mismo patrón que
// feedback-service y requests-service).
const CAMPOS = [
    'id_usuario', 'titulo', 'categoria', 'fecha', 'autor', 'contenido',
    'estado', 'programa', 'tipo_vigencia', 'vigencia', 'destacado'
];

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, u.nombre AS usuario_nombre
            FROM info_academica p
            LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
            ORDER BY p.fecha DESC
        `);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT p.*, u.nombre AS usuario_nombre
            FROM info_academica p
            LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
            WHERE p.id_publicacion = ?
        `, [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { titulo, categoria, fecha, autor, contenido } = req.body;
        if (!titulo || !categoria || !fecha || !autor || !contenido) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Solo se insertan los campos presentes: el resto toma su DEFAULT.
        const columnas = [];
        const valores = [];
        for (const campo of CAMPOS) {
            if (req.body[campo] !== undefined && req.body[campo] !== null) {
                columnas.push(campo);
                valores.push(campo === 'id_usuario' ? req.body[campo] || 1 : req.body[campo]);
            }
        }

        const [result] = await pool.query(
            `INSERT INTO info_academica (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
            valores
        );
        const [newPub] = await pool.query('SELECT * FROM info_academica WHERE id_publicacion = ?', [result.insertId]);
        res.status(201).json({ data: newPub[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
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
            `UPDATE info_academica SET ${asignaciones.join(', ')} WHERE id_publicacion = ?`,
            valores
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        const [updated] = await pool.query('SELECT * FROM info_academica WHERE id_publicacion = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM info_academica WHERE id_publicacion = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
