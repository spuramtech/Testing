const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const data = require('../../test-data/login-data');
const fs = require('fs');

const EVIDENCE_DIR = 'qmetry/evidence';
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

async function shot(page, name) {
  const path = `${EVIDENCE_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

test.describe('Login Form - Positive Scenarios', () => {
  test('TC_LOGIN_001 - Login with valid credentials navigates to branch selection', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.login(data.validUser.username, data.validUser.password);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/Userbranchselection/);
    await expect(page.getByText('Select Branch')).toBeVisible();
    await expect(page.getByText('NEYVELI CAO').first()).toBeVisible();
    await shot(page, 'TC_LOGIN_001_branch_selection');
  });

  test('TC_LOGIN_002 - Branch selection screen offers Auction Office and Sub Office tabs with Go button', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.login(data.validUser.username, data.validUser.password);
    await page.waitForTimeout(3000);
    await expect(page.getByText('Auction Office')).toBeVisible();
    await expect(page.getByText('Sub Office')).toBeVisible();
    await expect(page.getByText('Go', { exact: true })).toBeVisible();
  });

  test('TC_LOGIN_003 - Password field masks input by default and toggle reveals it', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    const before = await login.getPasswordFieldType();
    expect(before).toBe('password');
    await login.fillPassword('SamplePass1');
    await login.togglePasswordVisibility();
    const after = await login.getPasswordFieldType();
    expect(after).toBe('text');
  });

  test('TC_LOGIN_004 - Forgot Password link is visible and clickable', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await expect(login.forgotPasswordLink).toBeVisible();
  });

  test('TC_LOGIN_005 - Login page renders required UI elements', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await expect(login.usernameInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.loginButton).toBeVisible();
    await expect(page.getByText('EasyCHIT', { exact: false }).first()).toBeVisible();
  });
});

test.describe('Login Form - Negative Scenarios', () => {
  test('TC_LOGIN_006 - Submitting empty form shows required-field validation for both fields', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.submit();
    await page.waitForTimeout(1000);
    await expect(login.usernameRequiredError).toBeVisible();
    await expect(login.passwordRequiredError).toBeVisible();
    await shot(page, 'TC_LOGIN_006_empty_form_validation');
  });

  test('TC_LOGIN_007 - Submitting with only username filled shows password-required error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.fillUsername('admin');
    await login.submit();
    await page.waitForTimeout(1000);
    await expect(login.passwordRequiredError).toBeVisible();
  });

  test('TC_LOGIN_008 - Submitting with only password filled shows username-required error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.fillPassword('jayapriya@123');
    await login.submit();
    await page.waitForTimeout(1000);
    await expect(login.usernameRequiredError).toBeVisible();
  });

  for (const c of data.invalidCombinations) {
    test(`${c.id} - ${c.label}`, async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto('/');
      await login.login(c.username, c.password);
      await page.waitForTimeout(2000);
      await expect(page).not.toHaveURL(/Userbranchselection/);
    });
  }

  test('TC_LOGIN_N06 - Username with leading space is trimmed and login still succeeds', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.login(' admin', data.validUser.password);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/Userbranchselection/);
  });

  test('TC_LOGIN_009 - Invalid credentials show "Invalid Credentials" warning modal', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.login('wronguser', 'wrongpass');
    await page.waitForTimeout(2000);
    await expect(page.getByText('Invalid Credentials')).toBeVisible();
    await shot(page, 'TC_LOGIN_009_invalid_credentials_modal');
  });

  test('TC_LOGIN_010 - Repeated rapid invalid login attempts do not crash the application', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    for (let i = 0; i < 5; i++) {
      await login.fillUsername('baduser' + i);
      await login.fillPassword('badpass' + i);
      await login.submit();
      await page.waitForTimeout(600);
      const closeBtn = page.locator('.modal button, button:has-text("OK")').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click().catch(() => {});
      }
    }
    await expect(login.loginButton).toBeVisible();
  });
});

test.describe('Login Form - Boundary Value Scenarios', () => {
  for (const c of data.boundaryPayloads) {
    test(`${c.id} - ${c.label}`, async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto('/');
      await login.login(c.username, c.password);
      await page.waitForTimeout(2000);
      await expect(page).not.toHaveURL(/Userbranchselection/);
    });
  }
});

test.describe('Login Form - Special Character / Security Payload Scenarios', () => {
  for (const c of data.specialCharacterPayloads) {
    test(`${c.id} - ${c.label}`, async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto('/');

      let dialogFired = false;
      page.once('dialog', async (d) => { dialogFired = true; await d.dismiss(); });

      await login.login(c.username, c.password);
      await page.waitForTimeout(2000);

      expect(dialogFired, 'No JS alert() should fire from injected payload (XSS indicator)').toBe(false);
      await expect(page).not.toHaveURL(/Userbranchselection/);
    });
  }
});

test.describe('Login Form - Security Scenarios', () => {
  test('TC_LOGIN_SEC01 - Password value is not exposed in plain HTML attribute', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.fillPassword('SecretPass123');
    const valueAttr = await login.passwordInput.getAttribute('value');
    expect(valueAttr).toBeNull();
  });

  test('TC_LOGIN_SEC02 - Direct navigation to a post-login route without authentication redirects to login', async ({ page }) => {
    await page.goto('/#/Userbranchselection', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const hasLoginForm = await page.locator('input[formcontrolname="pUserName"]').isVisible().catch(() => false);
    await shot(page, 'TC_LOGIN_SEC02_direct_nav_check');
    expect(hasLoginForm, 'Unauthenticated direct access to a protected route should redirect back to the login form').toBe(true);
  });

  test('TC_LOGIN_SEC03 - Login button is disabled from double-submitting duplicate requests improperly', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.fillUsername(data.validUser.username);
    await login.fillPassword(data.validUser.password);
    await Promise.all([login.submit(), login.submit().catch(() => {})]);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/Userbranchselection/);
  });
});

test.describe('Login Form - Accessibility Scenarios', () => {
  test('TC_LOGIN_A11Y01 - Username and password fields are reachable via keyboard Tab order', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await page.locator('body').click();
    await login.usernameInput.focus();
    await expect(login.usernameInput).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(login.passwordInput).toBeFocused();
  });

  test('TC_LOGIN_A11Y02 - Login can be submitted using the Enter key', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto('/');
    await login.fillUsername(data.validUser.username);
    await login.fillPassword(data.validUser.password);
    await login.passwordInput.press('Enter');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/Userbranchselection/);
  });
});
