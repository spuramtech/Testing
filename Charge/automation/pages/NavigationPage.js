const { BasePage } = require('./BasePage');
const { logger } = require('../utils/logger');

class NavigationPage extends BasePage {
  constructor(page) {
    super(page);
    this.nav = page.getByRole('navigation').first();
    this.loansMenuItem = this.nav.getByText('Loans', { exact: true }).first();
    this.loanConfigurationSubMenuItem = this.nav.getByText('Loan Configuration', { exact: true }).first();
    this.chargeSubMenuItem = this.nav.getByText('Charge', { exact: true }).first();
    this.chargeScreenSearchBox = page.locator('app-charges:visible input.search-k-cst');
  }

  /**
   * Idempotent: if the Charge screen is already showing (a previous test
   * left it open), this is a no-op. If the Loans > Loan Configuration
   * submenu is already expanded from a previous test in this worker, only
   * "Charge" needs clicking — re-clicking "Loans"/"Loan Configuration" in
   * that case races the submenu's collapse/expand animation and causes the
   * "Charge" click to be intercepted by the closing tooltip overlay.
   */
  async goToChargeScreen() {
    if (await this.chargeScreenSearchBox.isVisible().catch(() => false)) {
      logger.info('Already on Charge screen, skipping navigation');
      return;
    }

    logger.info('Navigating to Loans > Loan Configuration > Charge');
    if (await this.chargeSubMenuItem.isVisible().catch(() => false)) {
      await this.click(this.chargeSubMenuItem);
    } else {
      await this.click(this.loansMenuItem);
      await this.click(this.loanConfigurationSubMenuItem);
      await this.click(this.chargeSubMenuItem);
    }
    await this.chargeScreenSearchBox.waitFor({ state: 'visible' });
  }
}

module.exports = { NavigationPage };
