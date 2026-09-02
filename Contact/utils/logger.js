const winston = require('winston');
const path = require('path');
const { LOG_LEVEL } = require('./envLoader');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
  })
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: path.resolve(__dirname, '..', 'logs', 'execution.log'),
    }),
    new winston.transports.File({
      filename: path.resolve(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
    }),
  ],
});

module.exports = logger;
