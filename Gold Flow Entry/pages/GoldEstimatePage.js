const { expect } = require('@playwright/test');
const nav = require('../utils/nav');

// Loans → Gold → Gold Estimates (New Estimate)
class GoldEstimatePage {
  constructor(page) {
    this.page = page;
    this.contact = page.locator('ng-select[formcontrolname=pCustomername]');
    this.loanName = page.locator('select[formcontrolname=pLoantypeid]');
    this.scheme = page.locator('select', { has: page.locator('option', { hasText: 'Not applied' }) });
    this.remarks = page.locator('textarea[formcontrolname=pRemarks]');
    this.save = page.locator('button:visible').filter({ hasText: /^\s*Save\s*$/ }).last();
  }

  async open() {
    const p = this.page;
    await nav.go(p, 'Gold Estimates', ['Loans', 'Gold']);
    await p.waitForURL(/#\/Loans\/GoldEstimates/);
    await expect(this.contact).toBeVisible();
  }

  async selectContact(search) {
    await this.contact.click();
    await this.contact.locator('input').fill(search);
    const option = this.page.locator('ng-dropdown-panel .ng-option', { hasText: new RegExp(search, 'i') }).first();
    await expect(option).toBeVisible();
    await this.page.waitForTimeout(1000); // search results re-render while typing
    const name = (await option.innerText()).replace(/\s+/g, ' ').trim();
    await option.click();
    await expect(this.page.locator('ng-dropdown-panel')).toBeHidden();
    await expect(this.articleRows().first()).toBeVisible();
    return name;
  }

  // Selects the last (newest) scheme whose label contains `label`; returns the chosen label
  async selectScheme(label) {
    if (!label) return null;
    const opts = (await this.scheme.locator('option').allInnerTexts()).map((o) => o.trim());
    const match = opts.filter((o) => o.toLowerCase().includes(label.toLowerCase())).pop();
    if (!match) throw new Error(`No scheme matching "${label}". Available: ${opts.join(' | ')}`);
    await this.scheme.selectOption({ label: match });
    return match;
  }

  // "Review Gold Estimate" dialog shown after Save → returns its summary text, then Confirm & Save
  async confirmReview() {
    const dialog = this.page.getByText('Review Gold Estimate').locator('xpath=ancestor::*[.//button[contains(.,"Confirm")]][1]');
    const warning = this.page.locator('.toast-message, .swal2-html-container').first();
    await expect(dialog.or(warning).first()).toBeVisible();
    if (!(await dialog.isVisible())) {
      throw new Error(`Save did not open "Review Gold Estimate" – the app said: ${(await this.messages()).join(' | ')}`);
    }
    const summary = (await dialog.innerText()).replace(/\s+/g, ' ');
    await dialog.getByRole('button', { name: /Confirm & Save/i }).click();
    return summary;
  }

  // Article-type <select> in each grid row; the row is its nearest ancestor that also holds the purity ng-select
  articleTypeSelects() {
    return this.page.locator('select:visible', { has: this.page.locator('option', { hasText: 'NECKLACE' }) });
  }

  articleRows() {
    return this.articleTypeSelects().locator('xpath=ancestor::tr[1]');
  }

  // Columns: 1 Purity, 2 Article Type, 3 Quantity, 4 Gross Weight, 5 Stone/Wastage, 6 Stone Count, 7 Net Wt, 8 Purity Ded %, 9 Pure Net Wt ...
  async fillArticle(rowIndex, a) {
    const row = this.articleRows().nth(rowIndex);
    const cell = (n) => row.locator(`td[aria-colindex="${n}"] input`);
    await row.locator('td[aria-colindex="2"] select').selectOption({ label: a.type });
    await cell(3).fill(String(a.quantity));
    await cell(4).fill(String(a.grossWeight));
    await cell(5).fill(String(a.stoneWastage));
    await cell(6).fill(String(a.stoneCount));
    await cell(6).press('Tab');
    await this.page.waitForTimeout(500);
    return (await row.innerText()).replace(/\s+/g, ' ');
  }

  // Upload via the cloud button next to "Upload Gold Articles Images" (opens a file chooser)
  async uploadImage(filePath) {
    const section = this.page.getByText(/Upload Gold Articles Images/i).first().locator('xpath=ancestor::div[.//button][1]');
    const [chooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      section.locator('button').first().click(),
    ]);
    await chooser.setFiles(filePath);
    const name = require('path').basename(filePath);
    await expect(section.locator('input[type=text]').first()).toHaveValue(new RegExp(name.replace('.', '\\.'), 'i'), { timeout: 30_000 });
  }

  // Totals box. Labels differ between app versions, e.g. qc: "TOTAL APPRAISAL VALUE"; host214: "APPRAISAL VALUE"
  // (+ RATE / GRAM, LTV % SCHEME, ELIGIBLE LOAN AMOUNT (LTV)). Each entry lists the accepted labels;
  // optional fields return null when the screen version doesn't have them.
  async totals() {
    const read = async (labels, optional = false) => {
      for (const label of labels) {
        const esc = label.replace(/[()/%]/g, (c) => '\\' + c);
        const lab = this.page.getByText(new RegExp(`^\\s*${esc}\\s*$`, 'i')).first(); // CSS upper-cases labels
        if (await lab.count()) {
          const text = (await lab.locator('xpath=..').innerText()).replace(/\s+/g, ' ');
          return text.replace(new RegExp(esc, 'i'), '').trim();
        }
      }
      if (optional) return null;
      throw new Error(`Totals label not found: ${labels.join(' / ')}`);
    };
    return {
      pureNetWeight: await read(['TOTAL PURE NETWEIGHT', 'TOTAL PURE NET WEIGHT']),
      quantity: await read(['TOTAL QUANTITY']),
      appraisalValue: await read(['TOTAL APPRAISAL VALUE', 'APPRAISAL VALUE']),
      ratePerGram: await read(['RATE / GRAM', 'RATE/GRAM'], true),
      ltvScheme: await read(['LTV % SCHEME'], true),
      eligibleLoan: await read(['ELIGIBLE LOAN AMOUNT (LTV)', 'ELIGIBLE LOAN AMOUNT'], true),
    };
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { GoldEstimatePage };
