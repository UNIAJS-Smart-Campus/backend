const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';
const BCRYPT_ROUNDS = 10;

if (!JWT_SECRET) {
    // Sin secreto configurado cualquier token sería falsificable.
    throw new Error('JWT_SECRET no está definido en el entorno');
}

const ES_HASH_BCRYPT = /^\$2[aby]\$/;

async function login(req, res, next) {
    try {
        const { identificacion, password } = req.body;
        if (!identificacion || !password) {
            return res.status(400).json({ error: 'Identificación y contraseña son requeridos' });
        }

        const [rows] = await pool.query(
            'SELECT id_usuario, identificacion, usuario, nombre, apellido, correo, id_rol, tipo_usuario, contraseña, estado FROM usuarios WHERE identificacion = ? OR usuario = ? OR cedula = ?',
            [identificacion, identificacion, identificacion]
        );

        const user = rows[0];
        if (!user || user.estado !== 'Activo') {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        let isValid = false;
        if (ES_HASH_BCRYPT.test(user.contraseña)) {
            isValid = await bcrypt.compare(password, user.contraseña);
        } else {
            // Compatibilidad con contraseñas antiguas en texto plano.
            isValid = user.contraseña === password;
            if (isValid) {
                // Migración transparente a bcrypt en el primer inicio de sesión.
                const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
                await pool.query('UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?', [hash, user.id_usuario]);
            }
        }

        if (!isValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                id: user.id_usuario,
                usuario: user.usuario,
                rol: user.id_rol,
                tipo_usuario: user.tipo_usuario,
                nombre: [user.nombre, user.apellido].filter(Boolean).join(' ').trim()
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        const { contraseña, ...userSafe } = user;
        userSafe.rol = user.id_rol;
        userSafe.token = token;

        res.json({ data: userSafe });
    } catch (error) {
        next(error);
    }
}

async function register(req, res, next) {
    try {
        const { nombre, apellido, correo, usuario, identificacion, password, telefono } = req.body;
        if (!nombre || !apellido || !correo || !password) {
            return res.status(400).json({ error: 'Nombre, apellido, correo y contraseña son requeridos' });
        }

        // `identificacion` y `usuario` son NOT NULL en la tabla `usuarios`.
        const loginUsuario = (usuario || identificacion || correo).trim();
        const loginIdentificacion = (identificacion || usuario || correo).trim();
        if (!loginUsuario || !loginIdentificacion) {
            return res.status(400).json({ error: 'Usuario o identificación son requeridos' });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

        // El autorregistro siempre crea estudiantes: nunca se confía en `id_rol`.
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, correo, usuario, identificacion, contraseña, telefono, id_rol, tipo_usuario, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, correo, loginUsuario, loginIdentificacion, hash, telefono || '', 2, 'Estudiante', 'Activo']
        );

        const [newUser] = await pool.query(
            'SELECT id_usuario, nombre, apellido, correo, usuario, identificacion, id_rol, tipo_usuario, estado FROM usuarios WHERE id_usuario = ?',
            [result.insertId]
        );
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El usuario, la identificación o el correo ya están registrados' });
        }
        next(error);
    }
}

async function me(req, res, next) {
    try {
        const user = req.user;
        const [rows] = await pool.query(
            'SELECT id_usuario, usuario, identificacion, nombre, apellido, correo, id_rol, tipo_usuario, estado FROM usuarios WHERE id_usuario = ?',
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
