/**
 * ============================================================
 * Transformación de uajs_smart_campus.sql para TiDB
 * ============================================================
 * phpMyAdmin (MySQL 8) declara las columnas AUTO_INCREMENT en el
 * CREATE TABLE y luego "corrige" el contador con sentencias:
 *
 *   ALTER TABLE `usuarios`
 *     MODIFY `id_usuario` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;
 *
 * TiDB rechaza ese MODIFY:
 *   "Unsupported modify column: can't set auto_increment"
 * y, peor, si solo se elimina la sentencia la columna queda SIN
 * auto_increment (el CREATE TABLE no lo trae), con lo que la app
 * falla al insertar sin id ("Field 'id_usuario' doesn't have a
 * default value").
 *
 * Esta transformación:
 *   1. inyecta `AUTO_INCREMENT` en la definición de la columna
 *      dentro del CREATE TABLE correspondiente;
 *   2. convierte cada MODIFY en `ALTER TABLE `x` AUTO_INCREMENT=N`
 *      (sintaxis soportada por TiDB) para fijar el contador, o lo
 *      elimina si el MODIFY no traía contador (tabla `auditoria`);
 *   3. elimina las tablas "stand-in" que phpMyAdmin crea para las
 *      vistas del conteo de objetos esperados (ya las dropea el
 *      propio dump antes de crear la vista real).
 *
 * No se modifica el archivo del dump: se aplica en memoria al
 * importar (ver inicializarBaseDeDatos en start-all.js).
 * ============================================================
 */

// Sentencias ALTER TABLE ... MODIFY ... AUTO_INCREMENT del dump.
// El contador se extrae con una busqueda aparte sobre la sentencia
// completa: con un grupo opcional perezoso, el primer
// `AUTO_INCREMENT` de la linea (el de la definicion de columna)
// captura antes que el que trae el `=N` y el contador se perdria.
const RE_MODIFY_IA = /ALTER TABLE `(\w+)`\s+MODIFY\s+`(\w+)`[^;]*;/gi;

/**
 * Aplica las transformaciones descritas arriba al dump.
 * @param {string} dump texto completo de uajs_smart_campus.sql
 * @returns {string} SQL listo para importar en TiDB
 */
function prepararSqlSemilla(dump) {
    // 1) Recolectar pares (tabla, columna, contador).
    const modificaciones = [];
    for (const m of dump.matchAll(RE_MODIFY_IA)) {
        const contador = (m[0].match(/AUTO_INCREMENT\s*=\s*(\d+)/i) || [])[1] || null;
        modificaciones.push({
            tabla: m[1],
            columna: m[2],
            contador,
            sentencia: m[0]
        });
    }

    let sql = dump;

    // 0) Vistas: quitar el DEFINER de phpMyAdmin
    //    (`DEFINER=`root`@`localhost``). TiDB no tiene ese usuario,
    //    y con SQL SECURITY DEFINER la vista queda ilegible
    //    ("definer/invoker of view lack rights to use them").
    //    Sin DEFINER, la vista se ejecuta con permisos de quien
    //    consulta (el usuario de la app), que es lo correcto.
    sql = sql.replace(
        /CREATE ALGORITHM=UNDEFINED DEFINER=`[^`]*`@`[^`]*` SQL SECURITY DEFINER VIEW/g,
        'CREATE VIEW'
    );

    for (const mod of modificaciones) {
        // 2) Localizar el CREATE TABLE de la tabla y su bloque de columnas.
        const marca = `CREATE TABLE \`${mod.tabla}\` (`;
        const inicio = sql.indexOf(marca);
        if (inicio === -1) continue;

        const fin = sql.indexOf(') ENGINE=', inicio);
        if (fin === -1) continue;

        const bloque = sql.slice(inicio, fin);
        const reColumna = new RegExp('^\\s*`' + mod.columna + '`[^\\r\\n]*', 'm');
        const coincidencia = bloque.match(reColumna);
        if (!coincidencia) continue;

        let linea = coincidencia[0];
        if (!/AUTO_INCREMENT/i.test(linea)) {
            if (linea.endsWith(',')) {
                linea = `${linea.slice(0, -1).trimEnd()} AUTO_INCREMENT,`;
            } else {
                linea = `${linea} AUTO_INCREMENT`;
            }
            const bloqueNuevo = bloque.replace(coincidencia[0], linea);
            sql = sql.slice(0, inicio) + bloqueNuevo + sql.slice(fin);
        }

        // 3) MODIFY -> ALTER TABLE ... AUTO_INCREMENT=N (o quitarlo).
        const reemplazo = mod.contador
            ? `ALTER TABLE \`${mod.tabla}\` AUTO_INCREMENT=${mod.contador};`
            : '';
        sql = sql.replace(mod.sentencia, reemplazo);
    }

    return sql;
}

/**
 * Número de objetos (tablas + vistas) que debe quedar en el esquema
 * tras importar el dump transformado.
 *
 * phpMyAdmin crea además 2 tablas "stand-in" (una por vista) que
 * dropea justo antes de crear la vista real: no cuentan al final.
 *
 * @param {string} sql SQL ya transformado
 * @returns {number}
 */
function contarObjetosDeclarados(sql) {
    const creadas = (sql.match(/^\s*CREATE TABLE /gm) || []).length;
    const vistas = (sql.match(/^\s*CREATE .*VIEW /gm) || []).length;
    const eliminadas = (sql.match(/^\s*DROP TABLE IF EXISTS /gmi) || []).length;
    return creadas + vistas - eliminadas;
}

module.exports = { prepararSqlSemilla, contarObjetosDeclarados };
