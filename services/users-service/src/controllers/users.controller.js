const pool = require('../config/database');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 10;

// Fuente de verdad de roles: tabla `roles`.
const ROLES_DB = {
    1: 'Administrador',
    2: 'Estudiante',
    3: 'Docente',
    4: 'Administrativo'
};

const CAMPOS_PUBLICOS = 'id_usuario, identificacion, usuario, nombre, apellido, correo, telefono, id_rol, tipo_usuario, programa, cargo, campus, estado';

function rolValido(idRol, tipoUsuario) {
    const id = Number(idRol);
    if (ROLES_DB[id]) {
        return { id, tipo: ROLES_DB[id] };
    }
    // Si llega un rol inexistente se conserva el tipo recibido solo si es válido.
    const tipo = Object.values(ROLES_DB).includes(tipoUsuario) ? tipoUsuario : 'Estudiante';
    const idDerivado = Number(Object.keys(ROLES_DB).find((key) => ROLES_DB[key] === tipo)) || 2;
    return { id: idDerivado, tipo };
}

async function getAll(req, res, next) {
    try {
        const [rows] = await pool.query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios ORDER BY id_usuario ASC`);
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id_usuario = ?`, [id]);
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
        const { nombre, apellido, correo, usuario, password, telefono, id_rol, tipo_usuario, programa, cargo, campus, identificacion } = req.body;
        if (!nombre || !apellido || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const rol = rolValido(id_rol, tipo_usuario);
        const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, correo, usuario, contraseña, telefono, id_rol, tipo_usuario, programa, cargo, campus, estado, identificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, correo, usuario, hash, telefono || '', rol.id, rol.tipo, programa || '', cargo || '', campus || 'Campus principal', 'Activo', identificacion || usuario]
        );
        const [newUser] = await pool.query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id_usuario = ?`, [result.insertId]);
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El usuario, la identificación o el correo ya están registrados' });
        }
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre, apellido, correo, usuario, password, telefono, id_rol, tipo_usuario, programa, cargo, campus, estado, identificacion } = req.body;

        const [actualRows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        if (!actualRows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const actual = actualRows[0];
        const rol = rolValido(id_rol ?? actual.id_rol, tipo_usuario ?? actual.tipo_usuario);

        let hash = actual.contraseña;
        if (password) {
            if (String(password).length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }
            hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
        }

        await pool.query(
            'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, usuario = ?, identificacion = ?, contraseña = ?, telefono = ?, id_rol = ?, tipo_usuario = ?, programa = ?, cargo = ?, campus = ?, estado = ? WHERE id_usuario = ?',
            [
                nombre ?? actual.nombre,
                apellido ?? actual.apellido,
                correo ?? actual.correo,
                usuario ?? actual.usuario,
                identificacion ?? actual.identificacion,
                hash,
                telefono ?? actual.telefono,
                rol.id,
                rol.tipo,
                programa ?? actual.programa,
                cargo ?? actual.cargo,
                campus ?? actual.campus,
                estado ?? actual.estado,
                id
            ]
        );

        const [updated] = await pool.query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id_usuario = ?`, [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El usuario, la identificación o el correo ya están registrados' });
        }
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
