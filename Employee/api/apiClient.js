const { request } = require('@playwright/test');

const API_BASE_URL = 'https://demonbfc-api.finsta.co.in';

async function loginAndGetToken() {
  const context = await request.newContext({ baseURL: API_BASE_URL });
  const response = await context.post('/api/login', {
    data: {
      pUserName: process.env.LOGIN_USERNAME,
      pPassword: process.env.LOGIN_PASSWORD,
      pbranchid: '',
      pbranchname: '',
      ptoken: '',
      pOtp: '',
    },
  });
  const body = await response.json();
  await context.dispose();
  return { token: body.pToken, status: response.status(), body };
}

async function authedContext(token) {
  return request.newContext({
    baseURL: API_BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

module.exports = { API_BASE_URL, loginAndGetToken, authedContext };
