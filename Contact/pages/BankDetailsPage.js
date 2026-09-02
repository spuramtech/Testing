const BasePage = require('./BasePage');

// Scoped to #bank container (see AddressDetailsPage comment on why).
class BankDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.locator('#bank');
    const fc = (name) => this.container.locator(`[formcontrolname="${name}"]`);
    this.ifscCodeInput = fc('pBankifscCode');
    this.bankNameCombobox = this.container.locator('.ng-select').nth(0);
    this.branchCombobox = this.container.locator('.ng-select').nth(1);
    this.cityInput = fc('pCity');
    this.accountTypeDropdown = this.container.locator('select#pAccountType');
    this.modeOfOperationDropdown = this.container.locator('select#pModeofOperation');
    this.nameAsPerBankInput = fc('pNameasPerYourBank');
    this.accountNumberInput = fc('pBankAccountNo');
    // Verified live: "Add" is an <a class="btn">, not a <button>.
    this.addButton = this.container.locator('a.btn:visible').filter({ hasText: 'Add' });
    // Result grid is an <ngx-datatable>, not a native <table> (see
    // AddressDetailsPage comment).
    this.gridRows = this.container.locator('datatable-body-row');
    this.selectPrimaryRadio = this.container.locator('datatable-body-row input[type="radio"]');
  }

  // .ng-option elements from a previously-closed dropdown can linger in the
  // DOM (hidden) — every lookup below is scoped to :visible so a stale
  // option from another ng-select on the page is never picked up instead
  // of the one actually open.
  async pickNthNgOption(comboboxLocator, index) {
    await this.click(comboboxLocator);
    const option = this.page.locator('.ng-dropdown-panel .ng-option:visible').nth(index);
    await option.waitFor({ state: 'visible', timeout: 5000 });
    const text = await option.textContent();
    await option.click();
    await this.page.waitForTimeout(400);
    return text;
  }

  // Not every bank in this shared demo instance has branches seeded, and
  // which one does can shift over time (live, mutable demo data) — so a
  // hardcoded "known good" bank/branch pair is not durable. Instead, try
  // successive banks from the live list until one actually has a non-empty
  // branch dropdown, and use that.
  async selectBankWithBranches(maxAttempts = 5) {
    for (let i = 0; i < maxAttempts; i++) {
      await this.pickNthNgOption(this.bankNameCombobox, i);
      await this.click(this.branchCombobox);
      const firstBranchOption = this.page.locator('.ng-dropdown-panel .ng-option:visible').first();
      const hasOption = await firstBranchOption
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (hasOption) {
        await firstBranchOption.click();
        // Selecting a branch auto-populates IFSC/City asynchronously —
        // wait for that to actually land before returning, so callers never
        // race it (fixed sleeps here were flaky under parallel load).
        await this.ifscCodeInput
          .evaluate((el) => new Promise((resolve) => {
            const deadline = Date.now() + 10000;
            const check = () => {
              if (el.value || Date.now() > deadline) return resolve();
              requestAnimationFrame(check);
            };
            check();
          }))
          .catch(() => null);
        await this.page.waitForTimeout(200);
        // The auto-fill call occasionally never lands within the poll
        // window on this live demo backend — if IFSC is still blank, this
        // bank/branch combo didn't come through cleanly; try the next bank
        // rather than submit a form the app will reject.
        if (!(await this.ifscCodeInput.inputValue())) {
          await this.page.keyboard.press('Escape').catch(() => null);
          continue;
        }
        return;
      }
      // Close the empty branch panel and try the next bank.
      await this.page.keyboard.press('Escape');
    }
    throw new Error(`No bank with a non-empty branch list found in first ${maxAttempts} options`);
  }

  async addBankAccount({ ifsc, bankName, branch, city, accountType, modeOfOperation, nameAsPerBank, accountNumber }) {
    // Bank Name is mandatory for Add to succeed. Selecting it resets IFSC
    // (an app behavior, not a bug in this framework) and makes Branch
    // mandatory too, so Bank Name/Branch must be chosen BEFORE IFSC is
    // filled, never after.
    if (bankName && branch) {
      await this.selectNgOption(this.bankNameCombobox, bankName);
      await this.selectNgOption(this.branchCombobox, branch);
      // Selecting Branch auto-populates IFSC + City (reverse of IFSC-driven
      // lookup) — overwriting that afterward resets Branch back to empty,
      // an app behavior, not a bug here. Only apply a caller-supplied
      // ifsc/city if the auto-fill left them blank.
      if (ifsc && !(await this.ifscCodeInput.inputValue())) await this.fill(this.ifscCodeInput, ifsc);
      if (city && !(await this.cityInput.inputValue())) await this.fill(this.cityInput, city);
    } else {
      // Caller doesn't care which bank/branch — self-heal against whichever
      // bank currently has branches on this live demo instance. Never touch
      // IFSC/City afterward: selecting a branch already fills them, and any
      // manual write here — even a guarded one — has a race window against
      // that auto-fill that occasionally clobbers Branch back to empty.
      await this.selectBankWithBranches();
    }
    if (accountType) await this.selectDropdown(this.accountTypeDropdown, accountType);
    if (modeOfOperation) await this.selectDropdown(this.modeOfOperationDropdown, modeOfOperation);
    await this.fill(this.nameAsPerBankInput, nameAsPerBank);
    await this.fill(this.accountNumberInput, accountNumber);
    await this.click(this.addButton);
    // Grid insert (when it succeeds) is an async re-render (ngx-datatable).
    // Give it a moment to settle before a caller reads row count — but
    // don't assert an increase here: this method is also used by negative
    // tests where Add is expected to silently reject bad input.
    await this.page.waitForTimeout(1000);
  }

  async getBankRowCount() {
    return this.gridRows.count();
  }
}

module.exports = BankDetailsPage;
