class LoginPage {
  constructor(page) {
    this.page = page;
    this.username = page.locator('input:not([type=password]):not([type=hidden]):not([type=checkbox])').first();
    this.password = page.locator('input[type=password]').first();
    this.signIn = page.getByRole('button', { name: /^sign in$/i });
  }

  async login(role = 'INT_APPRAISER1') {
    const user = process.env[`${role}_USER`];
    const pass = process.env[`${role}_PASSWORD`];
    if (!user || !pass) throw new Error(`Missing ${role}_USER / ${role}_PASSWORD in .env`);
    // QC occasionally hangs on the post-login redirect; retry the whole login once
    for (let attempt = 1; attempt <= 2; attempt++) {
      await this.page.goto('/');
      await this.username.fill(user);
      await this.password.fill(pass);
      await this.signIn.click();
      try {
        await this.page.waitForURL(/#\/Dashboard/i, { timeout: attempt === 1 ? 30_000 : 60_000 });
        return;
      } catch (e) {
        if (attempt === 2) throw e;
        console.log(`Login as ${role} did not reach Dashboard, retrying…`);
      }
    }
  }
}

module.exports = { LoginPage };
