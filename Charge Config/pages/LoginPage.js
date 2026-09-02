const { BasePage } = require('./BasePage');
const { logger } = require('../utils/logger');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.getByPlaceholder(/user\s*name|email/i).or(page.locator('input[type="email"], input[name*="user" i]')).first();
    this.passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]')).first();
    this.signInButton = page.getByRole('button', { name: /sign in/i });
  }

  async open() {
    await this.goto('/');
  }

  async login(username, password) {
    logger.info(`Logging in as ${username}`);
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}

module.exports = { LoginPage };
