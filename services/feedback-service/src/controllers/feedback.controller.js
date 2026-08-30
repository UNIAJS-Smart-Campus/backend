const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM pqrs');
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
        const { id_pqrs, tipo, fecha, estado, descripcion } = req.body;
        if (!tipo || !fecha || !estado || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO pqrs (id_pqrs, tipo, fecha, estado, descripcion) VALUES (?, ?, ?, ?, ?)',
            [id_pqrs || '', tipo, fecha, estado, descripcion]
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
        const { tipo, fecha, estado, descripcion } = req.body;
        const [result] = await pool.query(
            'UPDATE pqrs SET tipo = ?, fecha = ?, estado = ?, descripcion = ? WHERE id_pqrs = ?',
            [tipo, fecha, estado, descripcion, id]
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
