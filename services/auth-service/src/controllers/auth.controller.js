const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'uajs_secret_key_2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

async function login(req, res, next) {
    try {
        const { usuario, password } = req.body;
        if (!usuario || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, apellido, correo, id_rol, tipo_usuario, contraseña, estado FROM usuarios WHERE usuario = ? AND estado = ?',
            [usuario, 'Activo']
        );

        const user = rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        if (user.contraseña !== password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id_usuario, usuario, rol: user.id_rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        const { contraseña, ...userSafe } = user;
        userSafe.id_usuario = user.id_usuario;
        userSafe.token = token;

        res.json({ data: userSafe });
    } catch (error) {
        next(error);
    }
}

async function register(req, res, next) {
    try {
        const { nombre, apellido, correo, usuario, password, telefono, id_rol, programa, tipo_usuario } = req.body;
        if (!nombre || !apellido || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, correo, usuario, contraseña, telefono, id_rol, programa, tipo_usuario, estado, identificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, correo, usuario, password, telefono || '', id_rol || 2, programa || '', tipo_usuario || 'Estudiante', 'Activo', usuario]
        );

        const [newUser] = await pool.query('SELECT id_usuario, nombre, apellido, correo, usuario, id_rol, tipo_usuario, estado FROM usuarios WHERE id_usuario = ?', [result.insertId]);
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        next(error);
    }
}

async function me(req, res, next) {
    try {
        const user = req.user;
        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, apellido, correo, usuario, id_rol, tipo_usuario, estado FROM usuarios WHERE id_usuario = ?',
            [user.id]
        );
        if (!rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

module.exports = { login, register, me };
