const { Client } = require('@elastic/elasticsearch');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const client = new Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: process.env.ELASTICSEARCH_USERNAME ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
    } : undefined,
    tls: {
        rejectUnauthorized: false
    }
});

const INDEX_PREFIX = process.env.ELASTICSEARCH_INDEX_PREFIX || 'uajs_';

const INDICATORS = {
    USUARIOS: `${INDEX_PREFIX}usuarios`,
    RECURSOS: `${INDEX_PREFIX}recursos`,
    EVENTOS: `${INDEX_PREFIX}eventos`,
    SOLICITUDES: `${INDEX_PREFIX}solicitudes`,
    PQRS: `${INDEX_PREFIX}pqrs`,
    INFO_ACADEMICA: `${INDEX_PREFIX}info_academica`
};

module.exports = { client, INDICATORS, INDEX_PREFIX };
