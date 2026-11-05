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
                : [],
            programas: Array.isArray(config.programas)
                ? [...new Set(config.programas
                    .filter((item) => typeof item === 'string')
                    .map((item) => item.trim())
                    .filter(Boolean))]
                : []
        };
    }
    return resultado;
}

async function getRolePermissions(req, res, next) {
    try {
        const [roles] = await pool.query(
            `SELECT r.id_rol, r.nombre_rol,
                    c.tipo, c.clave,
                    p.programa
             FROM roles r
             LEFT JOIN rol_capacidades c ON c.id_rol = r.id_rol
             LEFT JOIN rol_programas p ON p.id_rol = r.id_rol
             ORDER BY r.id_rol, c.tipo, c.clave, p.programa`
        );
        const resultado = {};
        for (const fila of roles) {
            const rol = resultado[fila.nombre_rol] ||= {
                permisos: [],
                acciones: [],
                programas: []
            };
            if (fila.tipo === 'permiso' && fila.clave) rol.permisos.push(fila.clave);
            if (fila.tipo === 'accion' && fila.clave) rol.acciones.push(fila.clave);
            if (fila.programa) rol.programas.push(fila.programa);
        }
        for (const rol of Object.values(resultado)) {
            rol.permisos = [...new Set(rol.permisos)];
            rol.acciones = [...new Set(rol.acciones)];
            rol.programas = [...new Set(rol.programas)];
        }
        res.json({ data: Object.keys(resultado).length ? resultado : null });
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

        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [roles] = await conexion.query('SELECT id_rol, nombre_rol FROM roles');
            const idPorNombre = new Map(roles.map((rol) => [rol.nombre_rol, rol.id_rol]));

            for (const [nombre, config] of Object.entries(valor)) {
                const idRol = idPorNombre.get(nombre);
                if (!idRol) continue;

                await conexion.query('DELETE FROM rol_capacidades WHERE id_rol = ?', [idRol]);
                await conexion.query('DELETE FROM rol_programas WHERE id_rol = ?', [idRol]);

                const capacidades = [
                    ...config.permisos.map((clave) => [idRol, 'permiso', clave]),
                    ...config.acciones.map((clave) => [idRol, 'accion', clave])
                ];
                if (capacidades.length) {
                    await conexion.query(
                        'INSERT INTO rol_capacidades (id_rol, tipo, clave) VALUES ?',
                        [capacidades]
                    );
                }
                if (config.programas.length) {
                    await conexion.query(
                        'INSERT INTO rol_programas (id_rol, programa) VALUES ?',
                        [config.programas.map((programa) => [idRol, programa])]
                    );
                }
            }
            await conexion.commit();
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
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
