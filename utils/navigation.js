const { LoginPage } = require('../pages/LoginPage');

async function loginAndSelectBranch(page, baseUrl, creds, branchName = 'NEYVELI CAO') {
  const login = new LoginPage(page);
  await login.goto(baseUrl);
  await login.login(creds.username, creds.password);
  await page.waitForTimeout(3000);
  await page.getByText(branchName).first().click();
  await page.waitForTimeout(500);
  await page.getByText('Go', { exact: true }).click();
  await page.waitForTimeout(3000);
}

module.exports = { loginAndSelectBranch };
