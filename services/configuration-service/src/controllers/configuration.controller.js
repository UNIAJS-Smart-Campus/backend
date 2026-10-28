const pool = require('../config/database');

function esAdministrador(actor) {
    return Boolean(actor && actor.rol === 'Administrador');
}

async function getAll(req, res, next) {
    try {
        const objetivo = esAdministrador(req.actor) && req.query.id_usuario
            ? Number(req.query.id_usuario)
            : req.actor.id;
        const [rows] = await pool.query('SELECT * FROM configuracion WHERE id_usuario = ?', [objetivo]);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getByUserAndSection(req, res, next) {
    try {
        const { id_usuario, seccion } = req.params;
        if (!esAdministrador(req.actor) && Number(id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No tienes acceso a esta configuración' });
        }
        const [rows] = await pool.query(
            'SELECT * FROM configuracion WHERE id_usuario = ? AND seccion = ?',
            [id_usuario, seccion]
        );
        if (!rows.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        if (!esAdministrador(req.actor) && Number(rows[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No tienes acceso a esta configuración' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, seccion, valor } = req.body;
        if (!seccion || valor === undefined) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const propietario = esAdministrador(req.actor) && id_usuario ? Number(id_usuario) : req.actor.id;
        const [result] = await pool.query(
            'INSERT INTO configuracion (id_usuario, seccion, valor) VALUES (?, ?, ?)',
            [propietario, seccion, JSON.stringify(valor)]
        );
        const [newConfig] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [result.insertId]);
        res.status(201).json({ data: newConfig[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { id_usuario, seccion, valor } = req.body;
        const [existentes] = await pool.query('SELECT id_usuario FROM configuracion WHERE id_config = ?', [id]);
        if (!existentes.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        if (!esAdministrador(req.actor) && Number(existentes[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No puedes modificar esta configuración' });
        }
        const propietario = esAdministrador(req.actor) && id_usuario
            ? Number(id_usuario)
            : existentes[0].id_usuario;

        const [result] = await pool.query(
            'UPDATE configuracion SET id_usuario = ?, seccion = ?, valor = ? WHERE id_config = ?',
            [propietario, seccion, JSON.stringify(valor), id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        const [updated] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [existentes] = await pool.query('SELECT id_usuario FROM configuracion WHERE id_config = ?', [id]);
        if (!existentes.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        if (!esAdministrador(req.actor) && Number(existentes[0].id_usuario) !== req.actor.id) {
            return res.status(403).json({ error: 'No puedes eliminar esta configuración' });
        }
        await pool.query('DELETE FROM configuracion WHERE id_config = ?', [id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, getByUserAndSection, create, update, remove };
