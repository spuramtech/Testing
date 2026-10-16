const { expect } = require('@playwright/test');

// Loans → Loan Management → Loan Disbursal (Manual Disbursement)
// List: tabs Approved / Fully Disbursed / Part Amount Disbursed / Stage Wise; Branch + "Show Loans".
// Open a loan via its Application No link. NEVER click the Actions icon – it is "Revert to Approval".
class LoanDisbursalPage {
  constructor(page) {
    this.page = page;
    this.showLoans = page.locator('button:visible').filter({ hasText: /Show Loans/ });
    this.disburseDate = page.locator('[formcontrolname=ppaymentdate]');
    this.payout = page.locator('[formcontrolname=ploandisbusableamount]');
    this.installmentStart = page.locator('[formcontrolname=pinstallmentstartdate]');
    this.submit = page.locator('button:visible').filter({ hasText: /Submit For Approval/i });
  }

  async open() {
    const p = this.page;
    const link = p.getByText('Loan Disbursal', { exact: true }).locator('visible=true').first();
    if (!(await link.isVisible().catch(() => false))) {
      // menu collapsed → Loans → Loan Management
      await p.getByText('Loans', { exact: true }).first().click();
      await p.getByText('Loan Management', { exact: true }).locator('visible=true').first().click();
    }
    await link.click();
    // the menu click sometimes does not navigate – retry once, then open the page address directly
    if (!(await p.waitForURL(/DisbursementView/, { timeout: 20_000 }).then(() => true).catch(() => false))) {
      await link.click().catch(() => {});
      if (!(await p.waitForURL(/DisbursementView/, { timeout: 15_000 }).then(() => true).catch(() => false))) await p.goto('/#/Loans/DisbursementView');
      await p.waitForURL(/DisbursementView/);
    }
    await this.showLoans.click();
    await p.locator('tr', { hasText: /GLNG|[A-Z]{3,}\d{10,}/ }).first().waitFor({ timeout: 15_000 }).catch(() => {});
  }

  // Approved tab rows matching `filter` (grid search box, so all matches fit on one page):
  // [{ appNo, branch, loanType, loanName, applicant, contact, sanctioned }]
  async approvedLoans(filter = '') {
    if (filter) {
      await this.page.getByPlaceholder(/Search in all columns/i).locator('visible=true').first().fill(filter);
      await this.page.waitForTimeout(1000);
    }
    const out = [];
    for (const r of await this.page.locator('tr', { has: this.page.locator('td') }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      if (c.length >= 7 && /\d{8,}/.test(c[0])) out.push({ appNo: c[0], branch: c[1], loanType: c[2], loanName: c[3], applicant: c[4], contact: c[5], sanctioned: Number(c[6].replace(/[^\d.]/g, '')) });
    }
    return out;
  }

  async openLoan(appNo) {
    // search narrows the grid to this loan, then click its Application No link
    await this.page.getByPlaceholder(/Search in all columns/i).locator('visible=true').first().fill(appNo).catch(() => {});
    const row = this.page.locator('tr', { hasText: appNo }).first();
    await row.locator('td').first().getByText(appNo).click();
    await this.page.waitForURL(/DisbursementNew/);
    await expect(this.submit).toBeVisible();
  }

  async header() {
    const text = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const pick = (label) => (text.match(new RegExp(label + ' ([^A-Z]*?[\\d.,%]+[^ ]*)')) || [])[1];
    return {
      sanctioned: pick('Sanctioned Loan Amount'),
      tenure: pick('Tenure of Loan'),
      roi: pick('Rate of Interest'),
      available: (text.match(/Amount Available to Disburse ?: ([\d,.]+)/) || [])[1],
    };
  }

  // Mode of Payment is shown as buttons "Cash – 4,782.00 Dr" / "Bank :3,94,723.00 Cr" (radios are hidden behind them)
  async selectPaymentMode(mode = 'BANK') {
    const btn = this.page.getByText(new RegExp(`^\\s*${mode}\\s*[:–-]`, 'i')).locator('visible=true').first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(this.page.locator(`input[formcontrolname=pmodofpayment][value="${mode.toUpperCase()}"]`)).toBeChecked();
    return (await btn.innerText()).replace(/\s+/g, ' ').trim();
  }

  // Bank mode → Cheque / Online / Debit Card, then Bank Name (company bank, e.g. HDFC BANK - 1504546546) and:
  //   Online : Type of Payment (RTGS / NEFT / IMPS / UPI / INTRA BANK TRANSFER) + Reference No (text, formcontrolname pChequenumber)
  //   Cheque : Branch Name + Cheque No (select, formcontrolname pChequenumber)
  async fillBankDetails({ via = 'Online', bank, paymentType = 'NEFT', reference } = {}) {
    const p = this.page;
    await p.locator('label, span').filter({ hasText: new RegExp(`^\\s*${via}\\s*$`, 'i') }).locator('visible=true').first().click();
    await expect(p.locator(`input[formcontrolname=ptranstype][value="${via.toUpperCase()}"]`)).toBeChecked();
    const bankSel = p.locator('select[formcontrolname=pbankid]');
    await expect(bankSel).toBeVisible();
    const options = (await bankSel.locator('option').allInnerTexts()).map((t) => t.trim()).filter((t) => t && t !== 'Select');
    const label = bank ? options.find((o) => o.includes(bank)) : options[0];
    await bankSel.selectOption({ label });
    const result = { via, bank: label };
    if (/online/i.test(via)) {
      await p.locator('select[formcontrolname=ptypeofpayment]').selectOption({ label: paymentType });
      result.paymentType = paymentType;
      result.reference = reference || `AUTOTXN${Date.now().toString().slice(-8)}`;
      await p.locator('input[formcontrolname=pChequenumber]').fill(result.reference);
    } else if (/cheque/i.test(via)) {
      const chq = p.locator('select[formcontrolname=pChequenumber]');
      await chq.selectOption({ index: 1 });
      result.chequeNo = (await chq.locator('option:checked').innerText()).trim();
    }
    return result;
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }

  async messageText() {
    return (await this.messages()).map((t) => t.trim()).filter(Boolean).join(' | ');
  }

  async clearToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
    await this.page.waitForTimeout(300);
  }

  searchBox() {
    return this.page.getByPlaceholder(/Search in all columns/i).locator('visible=true').first();
  }

  async totalItems() {
    const m = (await this.page.locator('.k-pager-info:visible').first().innerText().catch(() => '')).match(/of (\d+) items/);
    return m ? Number(m[1]) : 0;
  }

  // every amount on the loan page, as numbers
  async amounts() {
    const text = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const num = (label) => { const m = text.match(new RegExp(label + '\\s*:?\\s*(-?[\\d,]+(?:\\.\\d+)?)')); return m ? Number(m[1].replace(/,/g, '')) : null; };
    return {
      sanctioned: num('Sanctioned Loan Amount'),
      previous: num('Previous Disbursed Amount'),
      available: num('Amount Available to Disburse'),
      adjustments: num('Less Adjustments'),
      broken: num('Broken Interest Amount \\(\\d+%\\)'),
      advanceEmi: num('Advance EMI Amount'),
      disbursed: num('Amount Disbursed'),
      emiType: (text.match(/EMI Type:\s*(\w+)/) || [])[1],
    };
  }

  async setPayout(value) {
    await this.payout.click({ clickCount: 3 });
    await this.payout.press('Control+A');
    await this.payout.press('Backspace');
    if (value !== '') await this.payout.pressSequentially(String(value), { delay: 20 });
    await this.payout.press('Tab');
    await this.page.waitForTimeout(800);
    return this.payout.inputValue();
  }

  async chooseVia(via) {
    await this.page.locator('label, span').filter({ hasText: new RegExp(`^\\s*${via}\\s*$`, 'i') }).locator('visible=true').first().click();
    await this.page.waitForTimeout(1000);
  }

  async optionTexts(formcontrolname) {
    return (await this.page.locator(`select[formcontrolname=${formcontrolname}]`).locator('option').allInnerTexts()).map((t) => t.trim()).filter((t) => t && t !== 'Select');
  }
}

module.exports = { LoanDisbursalPage };
