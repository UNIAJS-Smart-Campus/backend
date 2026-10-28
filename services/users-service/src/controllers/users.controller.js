const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const CAMPOS_PUBLICOS = 'id_usuario, nombre, apellido, id_rol, tipo_usuario, programa, foto_perfil AS foto, estado';
const CAMPOS_ADMIN = 'id_usuario, identificacion, usuario, nombre, apellido, correo, telefono, id_rol, tipo_usuario, programa, foto_perfil AS foto, estado';

function esAdministrador(actor) {
    return Boolean(actor && actor.rol === 'Administrador');
}

async function getAll(req, res, next) {
    try {
        // Los usuarios no administradores solo ven el directorio público
        // (nombre, rol y programa), sin correo, teléfono ni identificación.
        const query = esAdministrador(req.actor)
            ? `SELECT ${CAMPOS_ADMIN} FROM usuarios ORDER BY nombre, apellido`
            : `SELECT ${CAMPOS_PUBLICOS} FROM usuarios ORDER BY nombre, apellido`;
        const [rows] = await pool.query(query);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const propio = Number(id) === req.actor.id;
        if (!esAdministrador(req.actor) && !propio) {
            return res.status(403).json({ error: 'No tienes acceso a este usuario' });
        }
        const [rows] = await pool.query(
            `SELECT ${CAMPOS_ADMIN} FROM usuarios WHERE id_usuario = ?`,
            [id]
        );
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
        if (!esAdministrador(req.actor)) {
            return res.status(403).json({ error: 'Solo un administrador puede crear usuarios' });
        }
        const { nombre, apellido, correo, usuario, password, telefono, id_rol, tipo_usuario, programa, identificacion, foto } = req.body;
        if (!nombre || !apellido || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, correo, usuario, contraseña, telefono, id_rol, tipo_usuario, programa, estado, identificacion, foto_perfil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, correo, usuario, passwordHash, telefono || '', id_rol || 4, tipo_usuario || 'Estudiante', programa || '', 'Activo', identificacion || usuario, foto || '']
        );
        const [newUser] = await pool.query(
            `SELECT ${CAMPOS_ADMIN} FROM usuarios WHERE id_usuario = ?`,
            [result.insertId]
        );
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        if (!esAdministrador(req.actor)) {
            return res.status(403).json({ error: 'Solo un administrador puede modificar usuarios' });
        }
        const { id } = req.params;
        const { nombre, apellido, correo, usuario, password, telefono, id_rol, tipo_usuario, programa, estado, foto } = req.body;

        const [existentes] = await pool.query('SELECT contraseña FROM usuarios WHERE id_usuario = ?', [id]);
        if (!existentes.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const passwordHash = password
            ? await bcrypt.hash(password, 10)
            : existentes[0].contraseña;

        const [result] = await pool.query(
            'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, usuario = ?, contraseña = ?, telefono = ?, id_rol = ?, tipo_usuario = ?, programa = ?, estado = ?, foto_perfil = ? WHERE id_usuario = ?',
            [nombre, apellido, correo, usuario, passwordHash, telefono || '', id_rol, tipo_usuario, programa || '', estado, foto || '', id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const [updated] = await pool.query(
            `SELECT ${CAMPOS_ADMIN} FROM usuarios WHERE id_usuario = ?`,
            [id]
        );
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!esAdministrador(req.actor)) {
            return res.status(403).json({ error: 'Solo un administrador puede desactivar usuarios' });
        }
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
