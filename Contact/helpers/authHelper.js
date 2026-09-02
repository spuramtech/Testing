const { LOGIN_USERNAME, LOGIN_PASSWORD, BASE_URL } = require('../utils/envLoader');
const LoginPage = require('../pages/LoginPage');
const logger = require('../utils/logger');

async function loginAsDefaultUser(page) {
  const loginPage = new LoginPage(page);
  logger.info('Logging in as default test user');
  await loginPage.goto(BASE_URL);
  await loginPage.login(LOGIN_USERNAME, LOGIN_PASSWORD);
  await loginPage.dismissWelcomePopupIfPresent();
}

module.exports = { loginAsDefaultUser };
