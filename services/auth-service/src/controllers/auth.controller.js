const crypto = require('crypto');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { correoConfigurado, enviarRecuperacion } = require('../config/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';
const SALT_ROUNDS = 10;

// El token del correo solo es válido 1 hora.
const RESET_TTL_MS = 60 * 60 * 1000;
// A dónde apunta el enlace del correo (front en desarrollo: Vite).
const FRONT_URL = (process.env.FRONT_URL || 'http://localhost:5173').replace(/\/$/, '');

/** SHA-256 del token: en la BD se guarda el hash, nunca el token en claro. */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET no está definido. Defínelo en el .env antes de arrancar auth-service.'
    );
}

/**
 * Compara un password contra lo almacenado y, si la fila venía en texto
 * plano (seed antiguo), la migra a hash en el mismo login.
 *
 * @returns {Promise<boolean>} true si el password coincide.
 */
async function verificarPassword(usuario, password) {
    const almacenado = usuario.contraseña;

    const esHash = typeof almacenado === 'string' &&
        /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(almacenado);

    if (esHash) {
        return bcrypt.compare(password, almacenado);
    }

    // Migración transparente: la fila es de la semilla en texto plano.
    if (almacenado !== password) return false;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query('UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?', [hash, usuario.id_usuario]);
    return true;
}

async function login(req, res, next) {
    try {
        const { cedula, password } = req.body;
        if (!cedula || !password) {
            return res.status(400).json({ error: 'Cédula y contraseña son requeridas' });
        }

        const criterio = String(cedula).trim();
        // Igual que en recuperación: la cédula puede venir con puntos,
        // espacios o guiones ("1.023.456.789").
        const documento = criterio.replace(/[.\s-]/g, "");
        const documentoBuscado = documento || criterio;

        const [rows] = await pool.query(
            `SELECT id_usuario, identificacion, usuario, nombre, apellido, correo, id_rol,
                    tipo_usuario, programa, cargo, contraseña, foto_perfil, estado
             FROM usuarios
             WHERE cedula IS NOT NULL
               AND (
                   cedula = ?
                   OR REPLACE(REPLACE(REPLACE(cedula, '.', ''), '-', ''), ' ', '') = ?
               )
               AND estado = ?
             ORDER BY CASE WHEN cedula = ? THEN 0 ELSE 1 END
             LIMIT 1`,
            [criterio, documentoBuscado, 'Activo', criterio]
        );

        const user = rows[0];
        // Mismo mensaje para usuario inexistente y password incorrecto, para no
        // revelar qué identificaciones existen.
        const coincide = user ? await verificarPassword(user, password) : false;
        if (!coincide) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id_usuario, identificacion: user.identificacion, rol: user.id_rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        const { contraseña, ...userSafe } = user;
        userSafe.identificacion = user.identificacion;
        userSafe.rol = user.id_rol;
        userSafe.token = token;

        res.json({ data: userSafe });
    } catch (error) {
        next(error);
    }
}

async function register(req, res, next) {
    try {
        const {
            nombre, apellido, correo, usuario, password, telefono,
            id_rol, tipo_usuario, cedula, programa, cargo, campus
        } = req.body;
        if (!nombre || !apellido || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const [existente] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE identificacion = ? OR usuario = ? OR correo = ?',
            [usuario, usuario, correo]
        );
        if (existente.length) {
            return res.status(409).json({ error: 'El usuario o el correo ya están registrados' });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        // `identificacion` y `usuario` son NOT NULL: en el registro público se
        // usa el mismo valor para ambos, igual que hace users-service.create.
        const [result] = await pool.query(
            `INSERT INTO usuarios
                (identificacion, usuario, cedula, contraseña, nombre, apellido, correo,
                 telefono, id_rol, tipo_usuario, programa, cargo, campus, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')`,
            [
                usuario,
                usuario,
                cedula || null,
                hash,
                nombre,
                apellido,
                correo,
                telefono || '',
                id_rol || 2,
                tipo_usuario || 'Estudiante',
                programa || '',
                cargo || '',
                campus || 'Campus principal'
            ]
        );

        const [newUser] = await pool.query(
            'SELECT id_usuario, identificacion, usuario, nombre, apellido, correo, id_rol, tipo_usuario, programa, cargo, estado FROM usuarios WHERE id_usuario = ?',
            [result.insertId]
        );
        res.status(201).json({ data: newUser[0] });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /auth/recuperar
 * Recibe correo, número de cédula o identificación, y si la cuenta existe
 * envía un correo con un enlace para restablecer la contraseña.
 *
 * Responde 200 siempre que el formato sea válido (aunque la cuenta no exista)
 * para no revelar qué usuarios están registrados. Si NO hay SMTP configurado
 * responde 503 y un mensaje honesto en lugar de fingir que envió el correo.
 */
async function recuperar(req, res, next) {
    try {
        const { identificacion, cedula, correo } = req.body;
        const criterio =
            (identificacion && String(identificacion).trim()) ||
            (cedula && String(cedula).trim()) ||
            (correo && String(correo).trim());

        if (!criterio) {
            return res.status(400).json({
                error: 'Indica tu correo o número de cédula'
            });
        }

        // La cédula suele escribirse con puntos, espacios o guiones
        // ("1.023.456.789"). Se compara también sin separadores para que
        // funcione igual de escrita de cualquier forma.
        const documento = criterio.replace(/[.\s-]/g, "");
        const documentoBuscado = documento || criterio;

        if (!correoConfigurado()) {
            return res.status(503).json({
                error:
                    'El servicio de correo no está configurado. Contacta al ' +
                    'administrador del campus para restablecer tu contraseña.'
            });
        }

        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, correo FROM usuarios
             WHERE identificacion = ?
                OR correo = ?
                OR cedula = ?
                OR (
                    cedula IS NOT NULL
                    AND REPLACE(REPLACE(REPLACE(cedula, '.', ''), '-', ''), ' ', '') = ?
                )
             LIMIT 1`,
            [criterio, criterio, criterio, documentoBuscado]
        );

        // Cuenta inexistente: misma respuesta genérica, sin enviar nada.
        if (rows.length) {
            const usuario = rows[0];
            const token = crypto.randomBytes(32).toString('hex');
            const expira = new Date(Date.now() + RESET_TTL_MS);

            await pool.query(
                'UPDATE usuarios SET reset_token = ?, reset_expira = ? WHERE id_usuario = ?',
                [hashToken(token), expira, usuario.id_usuario]
            );

            const enlace = `${FRONT_URL}/recuperar?token=${token}`;
            await enviarRecuperacion(usuario.correo, enlace);
        }

        res.json({
            data: {
                mensaje:
                    'Si los datos coinciden con una cuenta, enviamos el enlace ' +
                    'al correo registrado en tu cuenta.'
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /auth/restablecer
 * Recibe el token del correo y la nueva contraseña; si es válido y no ha
 * expirado, guarda la nueva contraseña (bcrypt) y limpia el token.
 */
async function restablecer(req, res, next) {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
        }
        if (String(password).length < 6) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const [rows] = await pool.query(
            `SELECT id_usuario FROM usuarios
             WHERE reset_token = ? AND reset_expira > NOW() LIMIT 1`,
            [hashToken(String(token))]
        );

        // Token inválido o expirado: mensaje único para no dar pistas.
        if (!rows.length) {
            return res.status(400).json({
                error: 'El enlace no es válido o ya expiró. Solicita uno nuevo.'
            });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.query(
            `UPDATE usuarios
                SET contraseña = ?, reset_token = NULL, reset_expira = NULL
              WHERE id_usuario = ?`,
            [hash, rows[0].id_usuario]
        );

        res.json({ data: { mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' } });
    } catch (error) {
        next(error);
    }
}

async function me(req, res, next) {
    try {
        const user = req.user;
        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, apellido, correo, id_rol, tipo_usuario, programa, cargo, foto_perfil, estado FROM usuarios WHERE id_usuario = ?',
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

module.exports = { login, register, recuperar, restablecer, me };
