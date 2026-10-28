const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

let io = null;

function roomForUser(idUsuario) {
    return `user:${idUsuario}`;
}

function esRolAdministrativo(actor = {}) {
    const rol = String(actor.rol ?? '');
    const tipo = String(actor.tipo_usuario ?? '');
    return ['1', '4', 'administrador', 'administrativo', 'funcionario'].includes(rol.toLowerCase())
        || ['administrador', 'administrativo', 'funcionario'].includes(tipo.toLowerCase());
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
        const token = socket.handshake.auth?.token
            || (header && header.startsWith('Bearer ') ? header.slice(7) : null);

        if (!token) {
            return next(new Error('Token requerido'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
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
        const actor = socket.data.actor || {};
        const id = actor.id;

        if (!id) {
            socket.disconnect(true);
            return;
        }

        socket.join(roomForUser(id));
        if (esRolAdministrativo(actor)) {
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
