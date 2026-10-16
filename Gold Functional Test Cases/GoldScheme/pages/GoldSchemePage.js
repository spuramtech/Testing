const { expect } = require('@playwright/test');

// Loans → Gold → Gold Loan Configuration → Gold Scheme Matrix
class GoldSchemePage {
  constructor(page) {
    this.page = page;
    this.loan = page.locator('[formcontrolname=pLoanId]:visible');
    this.code = page.locator('[formcontrolname=pSchemeCode]:visible');
    this.name = page.locator('[formcontrolname=pSchemeName]:visible');
    this.tenure = page.locator('[formcontrolname=pTenureMonths]:visible');
    this.type = page.locator('[formcontrolname=pSchemeType]:visible');
    this.rate = page.locator('[formcontrolname=pRateOfInterest]:visible');
    this.effectiveFrom = page.locator('[formcontrolname=pEffectiveFrom]:visible');
    this.applyToSlabs = page.getByRole('button', { name: /Apply to all slabs/i });
    this.save = page.getByRole('button', { name: /Save Scheme/i });
  }

  async open() {
    const p = this.page;
    // The sidebar may already be expanded (Gold submenu open) – only expand when the link is not visible
    const glc = p.getByText('Gold Loan Configuration', { exact: true }).locator('visible=true').first();
    if (!(await glc.isVisible().catch(() => false))) {
      await p.getByText('Loans', { exact: true }).first().click();
      await p.getByText('Gold', { exact: true }).locator('visible=true').first().click();
    }
    await glc.click();
    await p.waitForURL(/GoldLoanConfiguration/);
    await p.getByText('Gold Scheme Matrix', { exact: true }).click();
    await p.waitForURL(/open=GoldSchemeMatrix/);
    await expect(p.getByText('New Scheme')).toBeVisible();
  }

  async openNew() {
    await this.page.getByText('New Scheme').click();
    await expect(this.code).toBeVisible();
  }

  // Slab rows in the "Interest & Internal LTV by amount slab" table
  slabRows() {
    return this.page.locator('tr', { has: this.page.locator('input:visible') }).filter({ hasText: /\d[\d,]* – / });
  }

  async fill(d) {
    await this.loan.selectOption({ label: d.loan });
    await this.code.fill(d.code);
    await this.name.fill(d.name);
    await this.tenure.fill(String(d.tenure));
    await this.type.selectOption({ index: d.type === 'Bullet' ? 0 : 1 });
    await this.rate.fill(String(d.rate));
    await this.applyToSlabs.click();
    await this.page.locator(`input#${d.active ? 'schemeStatusActive' : 'schemeStatusInactive'}`).check({ force: true });
  }

  // [{ slab, interest, paise, ltv }]
  async slabs() {
    const out = [];
    for (const r of await this.slabRows().all()) {
      const cells = await r.locator('td').allInnerTexts();
      const inputs = r.locator('input');
      out.push({ slab: cells[0].trim(), interest: Number(await inputs.nth(0).inputValue()), paise: Number(await inputs.nth(1).inputValue()), ltv: cells[4].trim() });
    }
    return out;
  }

  gridRow(code) {
    return this.page.locator('tr', { hasText: code }).first();
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { GoldSchemePage };
