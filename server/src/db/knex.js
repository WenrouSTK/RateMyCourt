// 统一的 Knex 实例：根据环境变量切换 SQLite / MySQL，业务代码无感
const path = require('path');
const knex = require('knex');
require('dotenv').config();

const client = process.env.DB_CLIENT || 'sqlite3';

const config = client === 'sqlite3'
  ? {
      client: 'sqlite3',
      connection: {
        filename: path.resolve(__dirname, '..', '..', process.env.DB_FILENAME || './data.db'),
      },
      useNullAsDefault: true,
    }
  : {
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
      pool: { min: 0, max: 10 },
    };

const db = knex(config);

module.exports = db;
