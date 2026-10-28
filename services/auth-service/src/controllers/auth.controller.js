const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado en auth-service');
}

async function login(req, res, next) {
    try {
        const { identificacion, password } = req.body;
        if (!identificacion || !password) {
            return res.status(400).json({ error: 'Identificación y contraseña son requeridos' });
        }

        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, apellido, correo, id_rol, tipo_usuario, foto_perfil AS foto, contraseña, estado FROM usuarios WHERE (identificacion = ? OR cedula = ?) AND estado = ?',
            [identificacion, identificacion, 'Activo']
        );

        const user = rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Soporta contraseñas hasheadas (bcrypt) y, por compatibilidad, texto plano.
        const passwordValida = typeof user.contraseña === 'string' && user.contraseña.startsWith('$2')
            ? await bcrypt.compare(password, user.contraseña)
            : user.contraseña === password;

        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                id: user.id_usuario,
                identificacion,
                rol: user.id_rol,
                tipo_usuario: user.tipo_usuario
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        const { contraseña, ...userSafe } = user;
        userSafe.id_usuario = user.id_usuario;
        userSafe.identificacion = identificacion;
        userSafe.rol = user.id_rol;
        userSafe.token = token;

        res.json({ data: userSafe });
    } catch (error) {
        next(error);
    }
}

async function register(req, res, next) {
    try {
        const { nombre, apellido, correo, usuario, password, telefono } = req.body;
        if (!nombre || !apellido || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, correo, identificacion, contraseña, telefono, id_rol, tipo_usuario, estado, foto_perfil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, correo, usuario, passwordHash, telefono || '', 4, 'Estudiante', 'Activo', req.body.foto || '']
        );

        const [newUser] = await pool.query('SELECT id_usuario, nombre, apellido, correo, identificacion, id_rol, tipo_usuario, foto_perfil AS foto, estado FROM usuarios WHERE id_usuario = ?', [result.insertId]);
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        next(error);
    }
}

async function me(req, res, next) {
    try {
        const user = req.user;
        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, apellido, correo, id_rol, tipo_usuario, foto_perfil AS foto, estado FROM usuarios WHERE id_usuario = ?',
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