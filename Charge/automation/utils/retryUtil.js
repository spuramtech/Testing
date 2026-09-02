const { logger } = require('./logger');

/**
 * Retries an async operation with backoff instead of relying on hardcoded waits.
 */
async function retry(fn, { retries = 3, delayMs = 500, label = 'operation' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      logger.warn(`Retry ${attempt}/${retries} failed for ${label}: ${error.message}`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

module.exports = { retry };
