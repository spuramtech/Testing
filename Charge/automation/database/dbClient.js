const { config } = require('../utils/envConfig');
const { logger } = require('../utils/logger');

/**
 * Thin wrapper providing a common interface over mysql2 and pg,
 * selected via DB_TYPE in the environment file.
 */
class DbClient {
  constructor(dbConfig = config.db) {
    this.dbConfig = dbConfig;
    this.connection = null;
  }

  async connect() {
    if (this.dbConfig.type === 'postgres') {
      const { Client } = require('pg');
      this.connection = new Client({
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        database: this.dbConfig.name,
        user: this.dbConfig.user,
        password: this.dbConfig.password,
      });
      await this.connection.connect();
    } else {
      const mysql = require('mysql2/promise');
      this.connection = await mysql.createConnection({
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        database: this.dbConfig.name,
        user: this.dbConfig.user,
        password: this.dbConfig.password,
      });
    }
    return this.connection;
  }

  async query(sql, params = []) {
    logger.dbLog(sql);
    if (this.dbConfig.type === 'postgres') {
      const result = await this.connection.query(sql, params);
      return result.rows;
    }
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}

module.exports = { DbClient };
