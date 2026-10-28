const pool = require('../config/database');

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
        const {
            titulo, categoria, fecha, autor, contenido,
            imagen, estado, programa, tipo_vigencia, vigencia, destacado
        } = req.body;

        if (!titulo || !categoria || !fecha || !autor || !contenido) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const [result] = await pool.query(
            `INSERT INTO info_academica
                (titulo, categoria, fecha, autor, contenido, imagen, estado, programa, tipo_vigencia, vigencia, destacado, id_usuario)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                titulo,
                categoria,
                fecha,
                autor,
                contenido,
                imagen || null,
                estado || 'Publicado',
                programa || 'Toda la comunidad',
                tipo_vigencia || 'Permanente',
                vigencia || null,
                destacado ? 1 : 0,
                req.actor?.id || null
            ]
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
        const [actualRows] = await pool.query('SELECT * FROM info_academica WHERE id_publicacion = ?', [id]);
        if (!actualRows.length) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        const actual = actualRows[0];
        const b = req.body;

        await pool.query(
            `UPDATE info_academica SET titulo = ?, categoria = ?, fecha = ?, autor = ?, contenido = ?,
                imagen = ?, estado = ?, programa = ?, tipo_vigencia = ?, vigencia = ?, destacado = ?
             WHERE id_publicacion = ?`,
            [
                b.titulo ?? actual.titulo,
                b.categoria ?? actual.categoria,
                b.fecha ?? actual.fecha,
                b.autor ?? actual.autor,
                b.contenido ?? actual.contenido,
                b.imagen ?? actual.imagen,
                b.estado ?? actual.estado,
                b.programa ?? actual.programa,
                b.tipo_vigencia ?? actual.tipo_vigencia,
                b.vigencia ?? actual.vigencia,
                b.destacado !== undefined ? (b.destacado ? 1 : 0) : actual.destacado,
                id
            ]
        );

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
