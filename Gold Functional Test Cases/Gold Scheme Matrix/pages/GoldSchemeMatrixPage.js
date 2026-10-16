const { expect } = require('@playwright/test');
const { go } = require('../../common/utils/nav');

// Loans → Gold → Gold Loan Configuration → Gold Scheme Matrix
// Grid of schemes (Kendo, 10 per page) + side panel #add-gold-scheme for New / Edit.
class GoldSchemeMatrixPage {
  constructor(page) {
    this.page = page;
    this.panel = page.locator('#add-gold-scheme');
    this.company = page.locator('select:visible').first();
    this.newBtn = page.getByText('New Scheme').first();
    this.loan = page.locator('[formcontrolname=pLoanId]:visible');
    this.code = page.locator('[formcontrolname=pSchemeCode]:visible');
    this.name = page.locator('[formcontrolname=pSchemeName]:visible');
    this.tenure = page.locator('[formcontrolname=pTenureMonths]:visible');
    this.type = page.locator('[formcontrolname=pSchemeType]:visible');
    this.rate = page.locator('[formcontrolname=pRateOfInterest]:visible');
    this.effectiveFrom = page.locator('[formcontrolname=pEffectiveFrom]:visible');
    this.active = page.locator('#schemeStatusActive');
    this.inactive = page.locator('#schemeStatusInactive');
    this.applyAll = page.getByRole('button', { name: /Apply to all slabs/i });
    this.addSlab = page.getByRole('button', { name: /Add Slab/i });
    this.saveBtn = page.getByRole('button', { name: /Save Scheme/i });
    this.updateBtn = page.getByRole('button', { name: /Update Scheme/i });
    this.clearBtn = page.locator('button, a').filter({ hasText: /^\s*Clear\s*$/ }).locator('visible=true').last();
    this.pagerInfo = page.locator('.k-pager-info:visible').first();
    this.toasts = page.locator('.toast-message, .toast-title');
    this.calendar = page.locator('bs-datepicker-container');
  }

  async open() {
    await go(this.page, 'Gold Loan Configuration', ['Loans', 'Gold']);
    await this.page.waitForURL(/GoldLoanConfiguration/);
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.getByText('Gold Scheme Matrix', { exact: true }).first().click();
    await this.page.waitForURL(/open=GoldSchemeMatrix/);
    await expect(this.newBtn).toBeVisible();
    await expect(this.pagerInfo).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  // Re-open the screen through the menu (a page reload logs the session out on this app)
  async reopen() {
    if (await this.panel.isVisible().catch(() => false)) await this.page.keyboard.press('Escape');
    await this.open();
  }

  async openNew() {
    await this.newBtn.click();
    await expect(this.code).toBeVisible();
    await this.page.waitForTimeout(300);
  }

  // ---- grid ----
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr:visible', { has: this.page.locator('[title=Edit]') }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((x) => x.replace(/\s+/g, ' ').trim());
      const [code, ...nameParts] = c[0].split(' ');
      out.push({
        code, name: nameParts.join(' '), tenure: num(c[1]), type: c[2], rate: num(c[3]), paise: num(c[4]), paiseText: c[4],
        ltv: (c[5].match(/[\d.]+(?=%)/g) || []).map(Number), on: await r.locator('input[type=checkbox]').isChecked().catch(() => null),
      });
    }
    return out;
  }

  async totalItems() {
    const m = (await this.pagerInfo.innerText()).match(/of (\d+) items/);
    return m ? Number(m[1]) : 0;
  }

  async nextPage() {
    const nx = this.page.locator('.k-pager-nav[title*="next" i]:visible').first();
    if (!(await nx.count()) || /disabled/.test(await nx.getAttribute('class'))) return false;
    await nx.click();
    await this.page.waitForTimeout(400);
    return true;
  }

  async allRows() {
    const seen = new Map();
    for (let i = 0; i < 20; i++) {
      for (const r of await this.rows()) seen.set(`${r.code}|${r.tenure}`, r); // code is unique only per tenure
      if (!(await this.nextPage())) break;
    }
    return [...seen.values()];
  }

  // Bring the row for `code` on screen (paging from the first page). Returns the row locator or null.
  async findRow(code) {
    const first = this.page.locator('.k-pager-nav[title*="first" i]:visible').first();
    if ((await first.count()) && !/disabled/.test(await first.getAttribute('class'))) { await first.click(); await this.page.waitForTimeout(300); }
    for (let i = 0; i < 20; i++) {
      // the code is its own element inside the first cell (name follows without a space in textContent)
      const row = this.page.locator('tr:visible', { has: this.page.locator(`td:first-child :text-is("${code}")`) }).first();
      if (await row.isVisible().catch(() => false)) return row;
      if (!(await this.nextPage())) return null;
    }
    return null;
  }

  // ---- slab table in the panel: [{ range, rbi, rate, paise, internal ('Not offered' or number), included }]
  slabRows() {
    return this.page.locator('tr:visible').filter({ hasText: /\d – / });
  }

  async slabs() {
    const out = [];
    for (const r of await this.slabRows().all()) {
      const inputs = r.locator('input');
      const txt = (await r.innerText()).replace(/\s+/g, ' ');
      const pcts = txt.match(/[\d.]+%/g) || [];
      out.push({
        range: (txt.match(/^[\d,]+ – [\d,A-Za-z]+/) || [''])[0],
        rate: Number(await inputs.nth(0).inputValue()),
        paise: Number(await inputs.nth(1).inputValue()),
        rateEditable: await inputs.nth(0).isEditable(),
        paiseEditable: await inputs.nth(1).isEditable(),
        rbi: num(pcts[0]),
        internal: /Not offered/.test(txt) ? 'Not offered' : num(pcts[1]),
        included: !/Not offered/.test(txt),
      });
    }
    return out;
  }

  async setSlabRate(i, rate) {
    const inp = this.slabRows().nth(i).locator('input').first();
    await inp.fill(String(rate));
    await inp.press('Tab');
    await this.page.waitForTimeout(200);
  }

  async toggleSlab(i) {
    await this.slabRows().nth(i).locator('[title*="this amount range"]').click();
    await this.page.waitForTimeout(200);
  }

  async typeInto(locator, value) {
    await locator.fill('');
    if (String(value) !== '') await locator.pressSequentially(String(value));
    await locator.press('Tab');
    await this.page.waitForTimeout(200);
  }

  // Fill the header fields: { loan, code, name, tenure, type: 'BULLET'|'MONTHLY', rate, active }
  async fill(d) {
    if (d.loan !== undefined) await this.loan.selectOption(d.loan ? { label: d.loan } : { index: 0 });
    if (d.code !== undefined) await this.code.fill(d.code);
    if (d.name !== undefined) await this.name.fill(d.name);
    if (d.tenure !== undefined) await this.tenure.fill(String(d.tenure));
    if (d.type) await this.type.selectOption(d.type === 'MONTHLY' ? { index: 1 } : { index: 0 });
    if (d.rate !== undefined) { await this.rate.fill(String(d.rate)); await this.rate.press('Tab'); }
    if (d.active === false) await this.inactive.check({ force: true });
    if (d.active === true) await this.active.check({ force: true });
    await this.page.waitForTimeout(200);
  }

  async values() {
    return {
      loan: await this.loan.inputValue(), loanText: await this.loan.locator('option:checked').innerText(),
      code: await this.code.inputValue(), name: await this.name.inputValue(), tenure: await this.tenure.inputValue(),
      type: await this.type.inputValue(), rate: await this.rate.inputValue(), effectiveFrom: await this.effectiveFrom.inputValue(),
      active: await this.active.isChecked(),
    };
  }

  async messages() {
    return (await this.toasts.allInnerTexts()).join(' | ');
  }

  async waitMessage() {
    await expect(this.toasts.first()).toBeVisible();
    await this.page.waitForTimeout(600);
    return this.messages();
  }

  async clearToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
    await this.page.waitForTimeout(200);
  }
}

function num(text) {
  const n = Number(String(text ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && String(text ?? '').match(/\d/) ? n : NaN;
}

// Internal LTV rule (verified on host214): Bullet = RBI / (1 + rate × tenure/12); Monthly = RBI / (1 + rate/12)
function internalLtv(rbi, rate, tenure, type) {
  const months = type === 'MONTHLY' ? 1 : tenure;
  return Math.round((rbi / (1 + (rate / 100) * (months / 12))) * 100) / 100;
}

module.exports = { GoldSchemeMatrixPage, num, internalLtv };
