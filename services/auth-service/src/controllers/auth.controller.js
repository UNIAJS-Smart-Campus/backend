const crypto = require('crypto');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { correoConfigurado, enviarRecuperacion } = require('../config/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';
// Access JWT: TTL corto (default 30 min) para limitar el daño de un token
// robado. Se renueva silenciosamente con el refresh token.
// Refresh token: 7 días por defecto, almacenado con hash en `sesiones` para
// permitir revocación inmediata (logout o fuerza bruta).
const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '30m';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '7d';
// Cookies HttpOnly: en producción (HTTPS) van con Secure + SameSite=None para
// que viajen cross-origin (front en Vercel, API en Render). En desarrollo
// (HTTP) van con SameSite=Lax y sin Secure.
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const COOKIE_SAMESITE = COOKIE_SECURE ? 'none' : 'lax';
const COOKIE_OPTIONS_BASE = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/'
};
const SALT_ROUNDS = 10;

// Anti fuerza bruta por cuenta: además del límite por IP del gateway, una
// cuenta se bloquea temporalmente tras varios fallos (ataques distribuidos).
const MAX_INTENTOS_LOGIN = 10;
const BLOQUEO_LOGIN_MS = 15 * 60 * 1000;
const intentosLogin = new Map();

function claveLogin(criterio) {
    return String(criterio || '').replace(/[.\s-]/g, '').toLowerCase();
}

function segundosBloqueo(clave) {
    const estado = intentosLogin.get(clave);
    if (!estado?.hasta) return 0;
    if (estado.hasta <= Date.now()) {
        intentosLogin.delete(clave);
        return 0;
    }
    return Math.ceil((estado.hasta - Date.now()) / 1000);
}

// Etiqueta legible del dispositivo a partir del User-Agent (sin dependencias).
function etiquetaDispositivo(agente = '') {
    const ua = String(agente);
    const navegador = /Edg\//.test(ua) ? 'Edge'
        : /OPR\/|Opera/.test(ua) ? 'Opera'
            : /Chrome\//.test(ua) ? 'Chrome'
                : /Firefox\//.test(ua) ? 'Firefox'
                    : /Safari\//.test(ua) ? 'Safari'
                        : 'Navegador';
    const sistema = /Android/.test(ua) ? 'Android'
        : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
            : /Windows/.test(ua) ? 'Windows'
                : /Mac OS X/.test(ua) ? 'macOS'
                    : /Linux/.test(ua) ? 'Linux'
                        : 'Sistema desconocido';
    return `${navegador} · ${sistema}`;
}

/**
 * Deja constancia del inicio de sesión en la tabla `auditoria` (que hasta
 * ahora no se usaba). Se guarda solo lo necesario para mostrarlo en
 * Configuración → Seguridad: dispositivo e IP. Nunca bloquea el login.
 */
async function registrarAcceso(usuario, req) {
    try {
        const ip = String(req.headers['x-forwarded-for'] || req.ip || '')
            .split(',')[0]
            .trim();
        const detalle = JSON.stringify({
            dispositivo: etiquetaDispositivo(req.headers['user-agent']),
            ip
        }).slice(0, 500);

        await pool.query(
            `INSERT INTO auditoria (id_usuario, accion, entidad, detalle)
             VALUES (?, 'LOGIN', 'sesion', ?)`,
            [usuario.id_usuario, detalle]
        );
    } catch (error) {
        console.warn('[auth] no se pudo registrar el acceso:', error.message);
    }
}

function registrarFalloLogin(clave) {
    const estado = intentosLogin.get(clave);
    const fallos = (estado?.fallos || 0) + 1;
    if (fallos >= MAX_INTENTOS_LOGIN) {
        intentosLogin.set(clave, { fallos: 0, hasta: Date.now() + BLOQUEO_LOGIN_MS });
    } else {
        intentosLogin.set(clave, { fallos, hasta: 0 });
    }
}

// El token del correo solo es válido 1 hora.
const RESET_TTL_MS = 60 * 60 * 1000;
// A dónde apunta el enlace del correo (front en desarrollo: Vite).
const FRONT_URL = (process.env.FRONT_URL || 'http://localhost:5173').replace(/\/$/, '');

/** SHA-256 del token: en la BD se guarda el hash, nunca el token en claro. */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function generarSid() {
    return crypto.randomBytes(16).toString('hex');
}

function generarRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
}

/**
 * Convierte '30m', '7d', '24h' o un número a segundos.
 */
function ttlSegundos(texto) {
    const match = String(texto).match(/^(\d+)\s*([smhd]?)$/i);
    if (!match) return Number(texto) || 0;
    const valor = Number(match[1]);
    const unidad = (match[2] || 's').toLowerCase();
    const porUnidad = { s: 1, m: 60, h: 3600, d: 86400 };
    return valor * (porUnidad[unidad] || 1);
}

function cookieDe(req, nombre) {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(new RegExp('(?:^|;\\s*)' + nombre + '=([^;]+)'));
    return match ? match[1] : null;
}

/**
 * Establece las cookies HttpOnly de access y refresh token.
 * Nunca se envían los tokens en el cuerpo de la respuesta.
 */
function establecerCookiesSesion(res, accessToken, refreshToken) {
    res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS_BASE,
        maxAge: ttlSegundos(ACCESS_EXPIRES) * 1000
    });
    res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS_BASE,
        maxAge: ttlSegundos(REFRESH_EXPIRES) * 1000
    });
}

/**
 * Borra las cookies de sesión del cliente.
 */
function borrarCookiesSesion(res) {
    const clearOpts = { path: '/', ...(COOKIE_SECURE ? { secure: true, sameSite: 'none' } : {}) };
    res.clearCookie('access_token', clearOpts);
    res.clearCookie('refresh_token', clearOpts);
}

/**
 * Guarda (o actualiza) una sesión de refresh en la tabla `sesiones`.
 */
async function guardarSesion(sid, idUsuario, refreshToken, expires) {
    await pool.query(
        `INSERT INTO sesiones (sid, id_usuario, token_hash, expires_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), expires_at = VALUES(expires_at), revocada = 0`,
        [sid, idUsuario, hashToken(refreshToken), expires]
    );
}

async function revocarSesionPorSid(sid) {
    if (!sid) return false;
    const [r] = await pool.query(
        'UPDATE sesiones SET revocada = 1 WHERE sid = ? AND revocada = 0',
        [sid]
    );
    return (r.affectedRows || 0) > 0;
}

async function revocarSesionPorRefreshToken(refreshToken) {
    if (!refreshToken) return false;
    const hash = hashToken(refreshToken);
    const [rows] = await pool.query(
        'SELECT sid FROM sesiones WHERE token_hash = ? AND revocada = 0 AND expires_at > NOW() LIMIT 1',
        [hash]
    );
    if (!rows.length) return false;
    await pool.query('UPDATE sesiones SET revocada = 1 WHERE sid = ?', [rows[0].sid]);
    return true;
}

/**
 * Renueva el par de tokens: valida el refresh token, rota (nuevo sid, nuevo
 * refresh token, invalida el anterior) y establece las cookies.
 */
async function rotarSesion(refreshToken, res) {
    const hash = hashToken(refreshToken);
    const [rows] = await pool.query(
        `SELECT sid, id_usuario FROM sesiones
         WHERE token_hash = ? AND revocada = 0 AND expires_at > NOW()
         LIMIT 1`,
        [hash]
    );
    if (!rows.length) {
        borrarCookiesSesion(res);
        return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }
    const { sid, id_usuario } = rows[0];

    // Rotar: invalido el refresh token actual.
    await pool.query('UPDATE sesiones SET revocada = 1 WHERE sid = ?', [sid]);

    const nuevoSid = generarSid();
    const nuevoRefresh = generarRefreshToken();
    const expira = new Date(Date.now() + ttlSegundos(REFRESH_EXPIRES) * 1000);

    const [usuarios] = await pool.query(
        'SELECT id_usuario, identificacion, id_rol FROM usuarios WHERE id_usuario = ?',
        [id_usuario]
    );
    const usuario = usuarios[0];
    if (!usuario) {
        borrarCookiesSesion(res);
        return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const accessToken = jwt.sign(
        { id: usuario.id_usuario, identificacion: usuario.identificacion, rol: usuario.id_rol, sid: nuevoSid },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES }
    );

    await guardarSesion(nuevoSid, id_usuario, nuevoRefresh, expira);
    establecerCookiesSesion(res, accessToken, nuevoRefresh);
    return res.json({ data: { mensaje: 'Sesión renovada' } });
}

/**
 * Cierra la sesión: revoca en la tabla `sesiones` y borra las cookies.
 */
async function cerrarSesion(req, res) {
    const refreshToken = cookieDe(req, 'refresh_token');
    let revocado = await revocarSesionPorRefreshToken(refreshToken);

    // Fallback: si no hay refresh token válido, intentar por el access token
    // (su sid permite revocar la sesión aunque el JWT ya haya expirado).
    if (!revocado) {
        const accessToken = cookieDe(req, 'access_token');
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, JWT_SECRET);
                if (decoded.sid) {
                    await revocarSesionPorSid(decoded.sid);
                    revocado = true;
                }
            } catch {
                // Token expirado o inválido: no hay nada que revocar.
            }
        }
    }

    borrarCookiesSesion(res);
    return res.json({ data: { mensaje: 'Sesión cerrada' } });
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

    // Solo se aceptan hashes bcrypt. Ya no hay fallback a texto plano:
    // una fila antigua sin hash debe migrarse antes de permitir el login.
    if (!esHash) return false;

    return bcrypt.compare(password, almacenado);
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

        const clave = claveLogin(criterio);
        const espera = segundosBloqueo(clave);
        if (espera > 0) {
            res.set('Retry-After', String(espera));
            return res.status(429).json({
                error: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(espera / 60)} minuto(s).`
            });
        }

        const [rows] = await pool.query(
            `SELECT id_usuario, identificacion, usuario, cedula, nombre, apellido, correo,
                    telefono, id_rol, tipo_usuario, programa, cargo, campus,
                    contraseña, foto_perfil, estado
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
            registrarFalloLogin(clave);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        intentosLogin.delete(clave);

        const sid = generarSid();
        const token = jwt.sign(
            { id: user.id_usuario, identificacion: user.identificacion, rol: user.id_rol, sid },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRES }
        );

        const refreshToken = generarRefreshToken();
        const expira = new Date(Date.now() + ttlSegundos(REFRESH_EXPIRES) * 1000);
        await guardarSesion(sid, user.id_usuario, refreshToken, expira);

        await registrarAcceso(user, req);

        establecerCookiesSesion(res, token, refreshToken);

        const { contraseña, ...userSafe } = user;
        userSafe.identificacion = user.identificacion;
        userSafe.rol = user.id_rol;

        res.json({ data: userSafe });
    } catch (error) {
        next(error);
    }
}

async function register(req, res, next) {
    try {
        const {
            nombre, apellido, correo, usuario, password, telefono,
            cedula, programa, cargo, campus
        } = req.body;
        if (!nombre || !apellido || !correo || !usuario || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        if (String(password).length < 8 || Buffer.byteLength(String(password), 'utf8') > 72) {
            return res.status(400).json({
                error: 'La contraseña debe tener entre 8 y 72 caracteres'
            });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim())) {
            return res.status(400).json({ error: 'El correo no tiene un formato válido' });
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
                cedula || usuario,
                hash,
                nombre,
                apellido,
                correo,
                telefono || '',
                // El registro público siempre crea estudiantes. Los roles se
                // asignan desde users-service por un administrador; nunca se
                // acepta id_rol/tipo_usuario del cliente.
                2,
                'Estudiante',
                programa || '',
                cargo || '',
                campus || 'Campus principal'
            ]
        );

        const [newUser] = await pool.query(
            'SELECT id_usuario, identificacion, usuario, cedula, nombre, apellido, correo, telefono, id_rol, tipo_usuario, programa, cargo, campus, foto_perfil, estado FROM usuarios WHERE id_usuario = ?',
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
        if (String(password).length < 8) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 8 caracteres'
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
            'SELECT id_usuario, identificacion, usuario, cedula, nombre, apellido, correo, telefono, id_rol, tipo_usuario, programa, cargo, campus, foto_perfil, estado FROM usuarios WHERE id_usuario = ?',
            [user.id]
        );
        if (!rows.length) {
            // El token es válido pero el usuario ya no existe (cuenta eliminada
            // o base reconstruida): se responde 401, no 404, para que el
            // cliente lo trate como sesión inválida y cierre sesión en vez de
            // quedarse con un token que hace fallar cada escritura.
            return res.status(401).json({ error: 'La sesión ya no es válida' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /auth/accesos
 * Últimos inicios de sesión del usuario autenticado. Alimenta la sección
 * Configuración → Seguridad → "Sesiones y dispositivos" con datos reales
 * de la tabla `auditoria` (antes esa lista era fija en el frontend).
 */
async function accesos(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT id_auditoria, detalle, fecha
             FROM auditoria
             WHERE id_usuario = ? AND accion = 'LOGIN'
             ORDER BY fecha DESC, id_auditoria DESC
             LIMIT 10`,
            [req.user.id]
        );

        const data = rows.map((fila) => {
            let detalle = {};
            try {
                detalle = JSON.parse(fila.detalle || '{}');
            } catch {
                // Detalle antiguo en texto plano: se deja vacío.
            }
            return {
                id: fila.id_auditoria,
                dispositivo: detalle.dispositivo || 'Dispositivo desconocido',
                ip: detalle.ip || '',
                fecha: fila.fecha
            };
        });

        res.json({ data });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /auth/refresh
 * Renueva el access token usando la cookie de refresh token. Rota el par:
 * invalida el refresh actual y emite uno nuevo. Nunca devuelve tokens en el
 * cuerpo (viajan en cookies HttpOnly).
 */
async function refresh(req, res, next) {
    try {
        await rotarSesion(cookieDe(req, 'refresh_token'), res);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /auth/logout
 * Revoca la sesión en la tabla `sesiones` y borra las cookies. El token deja
 * de ser válido inmediatamente (no hay que esperar a que expire).
 */
async function logout(req, res, next) {
    try {
        await cerrarSesion(req, res);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    register,
    recuperar,
    restablecer,
    me,
    accesos,
    refresh,
    logout
};
