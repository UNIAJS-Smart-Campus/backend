const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
    // TLS opcional: bases de datos externas (p. ej. TiDB
    // Serverless) exigen conexion cifrada. DB_SSL=1 activa TLS;
    // DB_SSL_VERIFY=0 cifra sin validar el certificado.
    ...(process.env.DB_SSL === '1'
        ? { ssl: { rejectUnauthorized: process.env.DB_SSL_VERIFY !== '0' } }
        : {})
});

module.exports = pool;
