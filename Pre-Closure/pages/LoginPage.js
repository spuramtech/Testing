class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[type="text"], input[name="username"], input[name="email"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.signInButton = page.getByRole('button', { name: /sign in/i });
  }

  async goto(baseUrl) {
    await this.page.goto(baseUrl);
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}

module.exports = { LoginPage };
