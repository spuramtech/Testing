const { request } = require('@playwright/test');
const logger = require('../utils/logger');

// Verified live via network trace: the Angular app talks to a separate
// API host, not BASE_URL itself.
const API_BASE_URL = 'https://demonbfc-api.finsta.co.in';

class ApiClient {
  constructor(baseURL = API_BASE_URL, token = null) {
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

  async get(endpoint, params = {}) {
    logger.info(`API GET ${endpoint}`, { params });
    return this.context.get(endpoint, { params });
  }

  async post(endpoint, data = {}) {
    logger.info(`API POST ${endpoint}`, { data });
    return this.context.post(endpoint, { data });
  }

  async put(endpoint, data = {}) {
    logger.info(`API PUT ${endpoint}`, { data });
    return this.context.put(endpoint, { data });
  }

  async delete(endpoint) {
    logger.info(`API DELETE ${endpoint}`);
    return this.context.delete(endpoint);
  }

  async dispose() {
    if (this.context) await this.context.dispose();
  }
}

async function loginAndGetToken(username, password) {
  const ctx = await request.newContext({ baseURL: API_BASE_URL });
  const response = await ctx.post('/api/login', {
    data: { pUserName: username, pPassword: password, pbranchid: '', pbranchname: '', ptoken: '', pOtp: '' },
  });
  // A failed login can return a non-JSON or empty body — don't let that
  // throw and mask the actual status being asserted on.
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = { raw: await response.text().catch(() => '') };
  }
  await ctx.dispose();
  return { token: body.pToken, status: response.status(), body };
}

module.exports = ApiClient;
module.exports.API_BASE_URL = API_BASE_URL;
module.exports.loginAndGetToken = loginAndGetToken;
