const { request } = require('@playwright/test');
const { config } = require('../utils/envConfig');
const { logger } = require('../utils/logger');

class ApiClient {
  constructor(baseURL = config.apiBaseUrl, token = null) {
    this.baseURL = baseURL;
    this.token = token;
    this.context = null;
  }

  async init() {
    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    return this.context;
  }

  async dispose() {
    if (this.context) {
      await this.context.dispose();
    }
  }

  async get(endpoint, options = {}) {
    const response = await this.context.get(endpoint, options);
    logger.apiLog('GET', endpoint, response.status());
    return response;
  }

  async post(endpoint, data, options = {}) {
    const response = await this.context.post(endpoint, { data, ...options });
    logger.apiLog('POST', endpoint, response.status());
    return response;
  }

  async put(endpoint, data, options = {}) {
    const response = await this.context.put(endpoint, { data, ...options });
    logger.apiLog('PUT', endpoint, response.status());
    return response;
  }

  async delete(endpoint, options = {}) {
    const response = await this.context.delete(endpoint, options);
    logger.apiLog('DELETE', endpoint, response.status());
    return response;
  }
}

module.exports = { ApiClient };
