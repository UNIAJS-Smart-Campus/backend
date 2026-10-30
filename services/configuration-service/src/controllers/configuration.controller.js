const pool = require('../config/database');

const idActor = (actor) => Number(actor?.id);
const esAdmin = (actor) => String(actor?.rol) === '1';

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

module.exports = { getAll, getOne, getByUserAndSection, create, update, remove };
