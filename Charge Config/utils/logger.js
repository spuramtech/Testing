const winston = tryRequireWinston();

function tryRequireWinston() {
  try {
    return require('winston');
  } catch {
    return null;
  }
}

const fallbackLogger = {
  info: (...args) => console.log('[INFO]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

function buildWinstonLogger() {
  const { createLogger, format, transports } = winston;
  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}] ${message}`)
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
    ],
  });
}

const logger = winston ? buildWinstonLogger() : fallbackLogger;

module.exports = { logger };
