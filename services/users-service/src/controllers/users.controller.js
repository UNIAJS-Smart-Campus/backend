const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const CAMPOS = 'id_usuario, identificacion, usuario, cedula, nombre, apellido, correo, telefono, id_rol, tipo_usuario, programa, cargo, campus, foto_perfil, estado';
const SALT_ROUNDS = 10;

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query(`SELECT ${CAMPOS} FROM usuarios`);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`SELECT ${CAMPOS} FROM usuarios WHERE id_usuario = ?`, [id]);
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
        const {
            nombre, apellido, correo, usuario, password, cedula,
            telefono, id_rol, tipo_usuario, programa, cargo, campus, identificacion, foto_perfil
        } = req.body;

        if (!nombre || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const [existente] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE identificacion = ? OR correo = ? LIMIT 1',
            [identificacion || usuario, correo]
        );
        if (existente.length) {
            return res.status(409).json({ error: 'El usuario o el correo ya están registrados' });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const [result] = await pool.query(
            `INSERT INTO usuarios
                (identificacion, usuario, cedula, contraseña, nombre, apellido, correo,
                 telefono, id_rol, tipo_usuario, programa, cargo, campus, foto_perfil, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')`,
            [
                identificacion || usuario,
                usuario,
                cedula || null,
                hash,
                nombre,
                apellido || '',
                correo,
                telefono || '',
                id_rol || 2,
                tipo_usuario || 'Estudiante',
                programa || '',
                cargo || '',
                campus || 'Campus principal',
                foto_perfil || null
            ]
        );

        const [newUser] = await pool.query(`SELECT ${CAMPOS} FROM usuarios WHERE id_usuario = ?`, [result.insertId]);
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const {
            nombre, apellido, correo, usuario, cedula, password,
            telefono, id_rol, tipo_usuario, programa, cargo, campus, estado, foto_perfil
        } = req.body;

        if (!nombre || !correo || !usuario) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // La contraseña solo se sobrescribe si se envía una nueva.
        const campos = [
            'nombre = ?', 'apellido = ?', 'correo = ?', 'usuario = ?', 'cedula = ?',
            'telefono = ?', 'id_rol = ?', 'tipo_usuario = ?', 'programa = ?',
            'cargo = ?', 'campus = ?', 'foto_perfil = ?', 'estado = ?'
        ];
        const valores = [
            nombre, apellido || '', correo, usuario, cedula || null,
            telefono || '', id_rol || 2, tipo_usuario || 'Estudiante', programa || '',
            cargo || '', campus || 'Campus principal', foto_perfil || null, estado || 'Activo'
        ];

        if (password) {
            campos.push('contraseña = ?');
            valores.push(await bcrypt.hash(password, SALT_ROUNDS));
        }

        valores.push(id);

        const [result] = await pool.query(
            `UPDATE usuarios SET ${campos.join(', ')} WHERE id_usuario = ?`,
            valores
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const [updated] = await pool.query(`SELECT ${CAMPOS} FROM usuarios WHERE id_usuario = ?`, [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            'UPDATE usuarios SET estado = ? WHERE id_usuario = ?',
            ['Inactivo', id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove };
