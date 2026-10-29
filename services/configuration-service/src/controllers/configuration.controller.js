const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        const { id_usuario } = req.query;
        let query = 'SELECT * FROM configuracion';
        const params = [];
        if (id_usuario) {
            query += ' WHERE id_usuario = ?';
            params.push(id_usuario);
        }
        const [rows] = await pool.query(query, params);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getByUserAndSection(req, res, next) {
    try {
        const { id_usuario, seccion } = req.params;
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
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, seccion, valor } = req.body;
        if (!id_usuario || !seccion || !valor) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO configuracion (id_usuario, seccion, valor) VALUES (?, ?, ?)',
            [id_usuario, seccion, JSON.stringify(valor)]
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
        const [result] = await pool.query(
            'UPDATE configuracion SET id_usuario = ?, seccion = ?, valor = ? WHERE id_config = ?',
            [id_usuario, seccion, JSON.stringify(valor), id]
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
        const [result] = await pool.query('DELETE FROM configuracion WHERE id_config = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, getByUserAndSection, create, update, remove };
