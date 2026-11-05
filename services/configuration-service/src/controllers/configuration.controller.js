const pool = require('../config/database');

const idActor = (actor) => Number(actor?.id);
const esAdmin = (actor) => String(actor?.rol) === '1';
const SECCION_PERMISOS_ROLES = 'permisos_roles';

function exigirAdmin(req, res) {
    if (!esAdmin(req.actor)) {
        res.status(403).json({ error: 'Solo el administrador puede gestionar permisos por rol' });
        return false;
    }
    return true;
}

function normalizarPermisosRoles(valor) {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
    const resultado = {};
    for (const [rol, config] of Object.entries(valor)) {
        if (!config || typeof config !== 'object' || Array.isArray(config)) continue;
        resultado[rol] = {
            permisos: Array.isArray(config.permisos)
                ? [...new Set(config.permisos.filter((item) => typeof item === 'string'))]
                : [],
            acciones: Array.isArray(config.acciones)
                ? [...new Set(config.acciones.filter((item) => typeof item === 'string'))]
                : []
        };
    }
    return resultado;
}

async function getRolePermissions(req, res, next) {
    try {
        const [rows] = await pool.query(
            'SELECT valor FROM configuracion WHERE id_usuario IS NULL AND seccion = ? ORDER BY id_config DESC LIMIT 1',
            [SECCION_PERMISOS_ROLES]
        );
        if (!rows.length) return res.json({ data: null });
        let valor = rows[0].valor;
        if (typeof valor === 'string') {
            try {
                valor = JSON.parse(valor);
            } catch {
                return res.status(500).json({ error: 'La configuración de permisos está dañada' });
            }
        }
        res.json({ data: normalizarPermisosRoles(valor) });
    } catch (error) {
        next(error);
    }
}

async function updateRolePermissions(req, res, next) {
    try {
        if (!exigirAdmin(req, res)) return;
        const valor = normalizarPermisosRoles(req.body?.roles ?? req.body);
        if (!valor || !Object.keys(valor).length) {
            return res.status(400).json({ error: 'Debes enviar permisos válidos por rol' });
        }

        const serializado = JSON.stringify(valor);
        const [existentes] = await pool.query(
            'SELECT id_config FROM configuracion WHERE id_usuario IS NULL AND seccion = ? ORDER BY id_config DESC LIMIT 1',
            [SECCION_PERMISOS_ROLES]
        );
        if (existentes.length) {
            await pool.query(
                'UPDATE configuracion SET valor = ? WHERE id_config = ?',
                [serializado, existentes[0].id_config]
            );
        } else {
            await pool.query(
                'INSERT INTO configuracion (id_usuario, seccion, valor) VALUES (NULL, ?, ?)',
                [SECCION_PERMISOS_ROLES, serializado]
            );
        }
        res.json({ data: valor });
    } catch (error) {
        next(error);
    }
}

async function getAll(req, res, next) {
    try {
        // Cada usuario ve su propia configuración; solo el administrador
        // puede consultar la de otro con ?id_usuario=.
        const solicitado = req.query.id_usuario;
        const objetivo = esAdmin(req.actor) && solicitado ? solicitado : idActor(req.actor);
        const [rows] = await pool.query(
            'SELECT * FROM configuracion WHERE id_usuario = ?',
            [objetivo]
        );
        res.json({ data: rows });
    } catch (error) {
        next(error);
    }
}

async function getByUserAndSection(req, res, next) {
    try {
        const { id_usuario, seccion } = req.params;
        if (Number(id_usuario) !== idActor(req.actor) && !esAdmin(req.actor)) {
            return res.status(403).json({ error: 'No puedes ver la configuración de otro usuario' });
        }
        const [rows] = await pool.query(
            'SELECT * FROM configuracion WHERE id_usuario = ? AND seccion = ?',
            [id_usuario, seccion]
        );
        if (!rows.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        if (Number(rows[0].id_usuario) !== idActor(req.actor) && !esAdmin(req.actor)) {
            return res.status(403).json({ error: 'No puedes ver la configuración de otro usuario' });
        }
        res.json({ data: rows[0] });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const { id_usuario, seccion, valor } = req.body;
        const destino = esAdmin(req.actor) && id_usuario ? id_usuario : idActor(req.actor);
        if (!destino || !seccion || valor === undefined || valor === null) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const [result] = await pool.query(
            'INSERT INTO configuracion (id_usuario, seccion, valor) VALUES (?, ?, ?)',
            [destino, seccion, JSON.stringify(valor)]
        );
        const [newConfig] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [result.insertId]);
        res.status(201).json({ data: newConfig[0] });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const [actual] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [id]);
        if (!actual.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        const registro = actual[0];
        if (Number(registro.id_usuario) !== idActor(req.actor) && !esAdmin(req.actor)) {
            return res.status(403).json({ error: 'No puedes modificar la configuración de otro usuario' });
        }

        const { seccion, valor } = req.body;
        await pool.query(
            'UPDATE configuracion SET seccion = ?, valor = ? WHERE id_config = ?',
            [seccion ?? registro.seccion, JSON.stringify(valor ?? registro.valor), id]
        );
        const [updated] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [id]);
        res.json({ data: updated[0] });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const [actual] = await pool.query('SELECT * FROM configuracion WHERE id_config = ?', [id]);
        if (!actual.length) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        if (Number(actual[0].id_usuario) !== idActor(req.actor) && !esAdmin(req.actor)) {
            return res.status(403).json({ error: 'No puedes eliminar la configuración de otro usuario' });
        }
        await pool.query('DELETE FROM configuracion WHERE id_config = ?', [id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAll,
    getOne,
    getByUserAndSection,
    create,
    update,
    remove,
    getRolePermissions,
    updateRolePermissions
};
