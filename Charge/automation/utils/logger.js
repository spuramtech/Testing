const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { config } = require('./envConfig');

const logsDir = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `[${ts}] [${level.toUpperCase()}] ${stack || message}`;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'execution.log') }),
  ],
});

if (process.env.CI !== 'true') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
    })
  );
}

logger.executionStart = (suiteName) => logger.info(`===== EXECUTION START: ${suiteName} =====`);
logger.executionEnd = (suiteName) => logger.info(`===== EXECUTION END: ${suiteName} =====`);
logger.apiLog = (method, url, status) => logger.info(`API ${method} ${url} -> ${status}`);
logger.dbLog = (query) => logger.debug(`DB QUERY: ${query}`);

module.exports = { logger };
