const { DB_CLIENT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require('../utils/envLoader');
const logger = require('../utils/logger');

class DbClient {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (DB_CLIENT === 'postgres') {
      const { Client } = require('pg');
      this.connection = new Client({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
      });
      await this.connection.connect();
    } else {
      const mysql = require('mysql2/promise');
      this.connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
      });
    }
    logger.info(`Connected to ${DB_CLIENT} database: ${DB_NAME}`);
  }

  async query(sql, params = []) {
    logger.info(`DB Query: ${sql}`, { params });
    if (DB_CLIENT === 'postgres') {
      const result = await this.connection.query(sql, params);
      return result.rows;
    }
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      logger.info('Database connection closed');
    }
  }
}

module.exports = DbClient;
