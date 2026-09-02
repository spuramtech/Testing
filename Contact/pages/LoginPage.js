const BasePage = require('./BasePage');

// VERIFIED against live app DOM (app-user-login component, Angular 8 / ng8.2.2).
// Login is a single step: User Name + Password + Sign In (no company/branch
// pre-selection screen on this Finsta instance).
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.locator('input[formcontrolname="pUserName"]');
    this.passwordInput = page.locator('input[formcontrolname="pPassword"]');
    this.signInButton = page.locator('input[type="submit"][value="Sign In"]');
    this.passwordVisibilityToggle = page.locator('i.fa-eye-slash, i.fa-eye');
    this.welcomePopupCloseIcon = page.locator('.modal .close, .welcome-popup .close-icon');
  }

  async login(username, password) {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.signInButton);
    await this.page.waitForLoadState('networkidle').catch(() => null);
  }

  async dismissWelcomePopupIfPresent() {
    if (await this.isVisible(this.welcomePopupCloseIcon)) {
      await this.click(this.welcomePopupCloseIcon);
    }
  }
}

module.exports = LoginPage;
