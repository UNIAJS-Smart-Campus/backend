const pool = require('../config/database');

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT id_usuario, identificacion, usuario, nombre, apellido, correo, telefono, id_rol, tipo_usuario, programa, estado FROM usuarios');
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id_usuario, identificacion, usuario, nombre, apellido, correo, telefono, id_rol, tipo_usuario, programa, estado FROM usuarios WHERE id_usuario = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { nombre, apellido, correo, usuario, password, telefono, id_rol, tipo_usuario, programa, identificacion } = req.body;
        if (!nombre || !apellido || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, correo, usuario, contraseña, telefono, id_rol, tipo_usuario, programa, estado, identificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, correo, usuario, password, telefono || '', id_rol || 2, tipo_usuario || 'Estudiante', programa || '', 'Activo', identificacion || usuario]
        );
        const [newUser] = await pool.query('SELECT id_usuario, nombre, apellido, correo, usuario, id_rol, tipo_usuario, programa, estado FROM usuarios WHERE id_usuario = ?', [result.insertId]);
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre, apellido, correo, usuario, telefono, id_rol, tipo_usuario, programa, estado } = req.body;
        const [result] = await pool.query(
            'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, usuario = ?, telefono = ?, id_rol = ?, tipo_usuario = ?, programa = ?, estado = ? WHERE id_usuario = ?',
            [nombre, apellido, correo, usuario, telefono || '', id_rol, tipo_usuario, programa || '', estado, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const [updated] = await pool.query('SELECT id_usuario, nombre, apellido, correo, usuario, id_rol, tipo_usuario, programa, estado FROM usuarios WHERE id_usuario = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('UPDATE usuarios SET estado = ? WHERE id_usuario = ?', ['Inactivo', id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
