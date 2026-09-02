class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[formcontrolname="pUserName"]');
    this.passwordInput = page.locator('input[formcontrolname="pPassword"]');
    this.loginButton = page.getByRole('button', { name: 'LOGIN' });
    this.forgotPasswordLink = page.locator('a.btn-forgot');
    this.passwordToggleIcon = page.locator('a i.fa-eye-slash, a i.fa-eye');
    this.usernameRequiredError = page.getByText('Username is required');
    this.passwordRequiredError = page.getByText('Password is required');
    this.invalidCredentialsModal = page.getByText('Invalid Credentials');
    this.modalCloseButton = page.locator('.modal button, .modal .close, button:has-text("OK"), button:has-text("Close")').first();
  }

  async goto(baseUrl) {
    await this.page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await this.page.waitForTimeout(800);
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async fillUsername(username) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.loginButton.click();
  }

  async getPasswordFieldType() {
    return this.passwordInput.getAttribute('type');
  }

  async togglePasswordVisibility() {
    await this.passwordToggleIcon.first().click();
  }
}

module.exports = { LoginPage };
