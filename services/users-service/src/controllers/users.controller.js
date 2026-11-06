const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const CAMPOS = 'u.id_usuario, u.identificacion, u.usuario, u.cedula, u.nombre, u.apellido, u.correo, u.telefono, u.id_rol, r.nombre_rol, u.tipo_usuario, u.programa, u.cargo, u.campus, u.foto_perfil, u.estado';
const SALT_ROUNDS = 10;

const CONSULTA_USUARIO = `
    SELECT ${CAMPOS}
    FROM usuarios u
    LEFT JOIN roles r ON r.id_rol = u.id_rol
`;

async function getAll(req, res, next) {
    try {
        // La tabla de usuarios crece con cada cuenta del campus y el frontend
        // paginará en el cliente. Se limita la respuesta (500 por defecto,
        // ?limit= para ajustar, tope 1000) para que una consulta maliciosa o un
        // crecimiento inesperado no devuelvan megabytes. Se ordena de más
        // reciente a antiguo para que el tope nunca oculte a un usuario recién
        // creado (el orden natural sería el contrario).
        const limite = Math.min(1000, Math.max(1, Number.parseInt(req.query.limit, 10) || 500));
        const [rows] = await pool.query(
            `${CONSULTA_USUARIO} ORDER BY u.id_usuario DESC LIMIT ?`,
            [limite]
        );
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`${CONSULTA_USUARIO} WHERE u.id_usuario = ?`, [id]);
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

        const [newUser] = await pool.query(`${CONSULTA_USUARIO} WHERE u.id_usuario = ?`, [result.insertId]);
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

        // Se permite actualizar solo algunos campos (p. ej. la foto de perfil
        // desde Configuración). Lo que no llega se conserva de la fila actual.
        const [actual] = await pool.query(
            `${CONSULTA_USUARIO} WHERE u.id_usuario = ?`,
            [id]
        );
        if (!actual.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const previo = actual[0];

        const finalNombre = nombre ?? previo.nombre;
        const finalCorreo = correo ?? previo.correo;
        const finalUsuario = usuario ?? previo.usuario;

        if (!finalNombre || !finalCorreo || !finalUsuario) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // La contraseña solo se sobrescribe si se envía una nueva.
        const campos = [
            'nombre = ?', 'apellido = ?', 'correo = ?', 'usuario = ?', 'cedula = ?',
            'telefono = ?', 'id_rol = ?', 'tipo_usuario = ?', 'programa = ?',
            'cargo = ?', 'campus = ?', 'foto_perfil = ?', 'estado = ?'
        ];
        const valores = [
            finalNombre,
            apellido ?? previo.apellido ?? '',
            finalCorreo,
            finalUsuario,
            cedula ?? previo.cedula ?? null,
            telefono ?? previo.telefono ?? '',
            id_rol ?? previo.id_rol ?? 2,
            tipo_usuario ?? previo.tipo_usuario ?? 'Estudiante',
            programa ?? previo.programa ?? '',
            cargo ?? previo.cargo ?? '',
            campus ?? previo.campus ?? 'Campus principal',
            foto_perfil ?? previo.foto_perfil ?? null,
            estado ?? previo.estado ?? 'Activo'
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

        const [updated] = await pool.query(`${CONSULTA_USUARIO} WHERE u.id_usuario = ?`, [id]);
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

async function getRoles(req, res, next) {
    try {
        const [rows] = await pool.query(
            'SELECT id_rol, nombre_rol, descripcion FROM roles ORDER BY id_rol'
        );
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

module.exports = { getAll, getOne, create, update, remove, getRoles };
