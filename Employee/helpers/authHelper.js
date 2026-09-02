const LoginPage = require('../pages/LoginPage');
const logger = require('../utils/logger');

async function loginAsDefaultUser(page) {
  const loginPage = new LoginPage(page);
  logger.info('Logging in as default test user');
  await loginPage.goto(process.env.BASE_URL);
  await loginPage.login(process.env.LOGIN_USERNAME, process.env.LOGIN_PASSWORD);
}

module.exports = { loginAsDefaultUser };
