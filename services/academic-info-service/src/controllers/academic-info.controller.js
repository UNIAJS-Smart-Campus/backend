const pool = require('../config/database');

const ROLES_PUBLICAR = new Set(['Administrador', 'Docente']);

function puedePublicar(actor) {
    return Boolean(actor && ROLES_PUBLICAR.has(actor.rol));
}

function esAdministrador(actor) {
    return Boolean(actor && actor.rol === 'Administrador');
}

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
        if (!puedePublicar(req.actor)) {
            return res.status(403).json({ error: 'No tienes permiso para publicar información académica' });
        }
        const { titulo, categoria, fecha, autor, contenido, estado } = req.body;
        if (!titulo || !categoria || !fecha || !autor || !contenido) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO info_academica (titulo, categoria, fecha, autor, contenido, id_usuario, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [titulo, categoria, fecha, autor, contenido, req.actor.id, estado || 'Pendiente']
        );
        const [newPub] = await pool.query('SELECT * FROM info_academica WHERE id_publicacion = ?', [result.insertId]);
        res.status(201).json({ data: newPub[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        if (!puedePublicar(req.actor)) {
            return res.status(403).json({ error: 'No tienes permiso para modificar publicaciones' });
        }
        const { id } = req.params;
        const { titulo, categoria, fecha, autor, contenido, id_usuario, estado } = req.body;
        const [existingRows] = await pool.query('SELECT id_usuario FROM info_academica WHERE id_publicacion = ?', [id]);
        if (!existingRows.length) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        if (!esAdministrador(req.actor) && Number(existingRows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'Solo puedes modificar tus propias publicaciones' });
        }
        const propietarioFinal = esAdministrador(req.actor) ? (id_usuario ?? existingRows[0].id_usuario) : existingRows[0].id_usuario;
        const [result] = await pool.query(
            'UPDATE info_academica SET titulo = ?, categoria = ?, fecha = ?, autor = ?, contenido = ?, id_usuario = ?, estado = ? WHERE id_publicacion = ?',
            [titulo, categoria, fecha, autor, contenido, propietarioFinal, estado, id]
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
        if (!puedePublicar(req.actor)) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar publicaciones' });
        }
        const { id } = req.params;
        const [existingRows] = await pool.query('SELECT id_usuario FROM info_academica WHERE id_publicacion = ?', [id]);
        if (!existingRows.length) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        if (!esAdministrador(req.actor) && Number(existingRows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'Solo puedes eliminar tus propias publicaciones' });
        }
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
