const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

let io = null;

function roomForUser(idUsuario) {
    return `user:${idUsuario}`;
}

function esRolAdministrativo(rol) {
    const valor = String(rol ?? '').toLowerCase();
    return ['1', '4', 'administrador', 'administrativo', 'funcionario'].includes(valor);
}

/**
 * Inicializa Socket.IO sobre el servidor HTTP del servicio.
 * El cliente debe enviar el JWT en `socket.handshake.auth.token`.
 */
function initRealtime(httpServer) {
    io = new Server(httpServer, {
        path: '/socket.io',
        cors: {
            origin: true,
            credentials: true,
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    io.use((socket, next) => {
        if (!JWT_SECRET) {
            return next(new Error('JWT_SECRET no configurado'));
        }

        const header = socket.handshake.headers?.authorization;
        let token = socket.handshake.auth?.token
            || (header && header.startsWith('Bearer ') ? header.slice(7) : null);

        // Fallback: leer access_token de la cookie HttpOnly del handshake.
        // El cliente ya no puede incluir auth.token (el token no es accesible
        // desde JavaScript: vive en cookie HttpOnly). El navegador envía la
        // cookie automáticamente en el handshake HTTP de Socket.IO.
        if (!token) {
            const cookies = socket.handshake.headers?.cookie || '';
            const match = cookies.match(/(?:^|;\s*)access_token=([^;]+)/);
            if (match) token = match[1];
        }

        if (!token) {
            return next(new Error('Token requerido'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET, {
                algorithms: ['HS256']
            });
            if (!decoded?.id) {
                return next(new Error('Token inválido'));
            }
            socket.data.actor = decoded;
            next();
        } catch (error) {
            next(new Error('Token inválido o expirado'));
        }
    });

    io.on('connection', (socket) => {
        const { id, rol } = socket.data.actor;

        socket.join(roomForUser(id));
        if (esRolAdministrativo(rol)) {
            socket.join('admins');
        }
    });

    return io;
}

function getIO() {
    return io;
}

function emitToUser(idUsuario, event, payload) {
    if (!io || idUsuario == null) return;
    io.to(roomForUser(idUsuario)).emit(event, payload);
}

function emitToAdmins(event, payload) {
    if (!io) return;
    io.to('admins').emit(event, payload);
}

function broadcast(event, payload) {
    if (!io) return;
    io.emit(event, payload);
}

module.exports = { initRealtime, getIO, emitToUser, emitToAdmins, broadcast };
