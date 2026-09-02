const BasePage = require('./BasePage');

// Verified live: single-step login form, no company/branch pre-selection.
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.locator('input[formcontrolname="pUserName"]');
    this.passwordInput = page.locator('input[formcontrolname="pPassword"]');
    this.signInButton = page.locator('input[type="submit"][value="Sign In"]');
  }

  async login(username, password) {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.signInButton);
    await this.page.waitForLoadState('networkidle').catch(() => null);
  }
}

module.exports = LoginPage;
