const { BasePage } = require('./BasePage');
const { logger } = require('../utils/logger');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    // Labels have no <label for>/placeholder association in the DOM, so
    // locate each textbox as the input immediately following its label text.
    this.usernameInput = page.getByText('User Name', { exact: true }).locator('xpath=following::input[1]');
    this.passwordInput = page.getByText('Password', { exact: true }).locator('xpath=following::input[1]');
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.invalidCredentialsDialog = page.getByRole('alertdialog').filter({ hasText: /invalid credentials/i });
  }

  async open(baseUrl) {
    await this.goto(baseUrl);
  }

  async login(username, password) {
    logger.info(`Logging in as ${username}`);
    await this.fill(this.usernameInput.first(), username);
    await this.fill(this.passwordInput.first(), password);
    await this.click(this.signInButton);
  }
}

module.exports = { LoginPage };
