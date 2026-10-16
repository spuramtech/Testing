const { expect } = require('@playwright/test');
const nav = require('../utils/nav');

// Loans → Gold → Gold Token: approved estimates appear as tokens; selecting one opens a 2-tab wizard
// (Member: nominee + KYC → Next → Loan Details: amount requested → Save)
class GoldTokenPage {
  constructor(page) {
    this.page = page;
    this.nomineeName = page.locator('[formcontrolname=pnomineename]');
    this.relationship = page.locator('ng-select[formcontrolname=prelationship]');
    this.nomineeContact = page.locator('[formcontrolname=pcontactno]');
    this.proportion = page.locator('[formcontrolname=pPercentage]');
    this.idProofType = page.locator('select[formcontrolname=pDocumentGroupId]');
    this.idProof = page.locator('select[formcontrolname=pDocumentName]');
    this.reference = page.locator('[formcontrolname=preferencenumber]');
    this.amountRequested = page.locator('[formcontrolname=pAmountrequsetd]');
    this.tenure = page.locator('[formcontrolname=pTenure]');
    this.interest = page.locator('[formcontrolname=pInterestrate]');
  }

  button(text) {
    return this.page.locator('button:visible, a:visible').filter({ hasText: new RegExp(`^\\W*${text}\\s*$`) }).last();
  }

  async open() {
    const p = this.page;
    await nav.go(p, 'Gold Token', ['Loans', 'Gold']);
    await p.waitForURL(/GoldLoanToken/);
    await expect(p.getByText('Available Gold Loan Tokens')).toBeVisible();
    await p.locator('tr', { hasText: /UID\d+/ }).first().waitFor({ timeout: 15_000 }).catch(() => {}); // grid loads async; may be empty
  }

  // [{ token, customer, mobile, type, value }]
  async tokens() {
    const out = [];
    for (const r of await this.page.locator('tr', { hasText: /UID\d+/ }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.trim());
      out.push({ token: c[1], customer: c[2], mobile: c[3], type: c[4], value: c[5] });
    }
    return out;
  }

  async selectToken(token) {
    await this.page.locator('tr', { hasText: token }).locator('input[type=radio]').check({ force: true });
    await expect(this.nomineeName).toBeVisible();
  }

  // Token Overview cards. qc: label + sibling value; host214: value inside the same card → fall back to the card text.
  async overview() {
    const read = async (label) => {
      const lab = this.page.getByText(label, { exact: true }).first();
      const sib = (await lab.locator('xpath=following-sibling::*[1]').innerText().catch(() => '')).trim();
      if (sib) return sib;
      const card = (await lab.locator('xpath=ancestor::*[1]').innerText().catch(() => '')).replace(/\s+/g, ' ');
      return (card.match(new RegExp(`${label}\\s*([\\d,.]+)`, 'i')) || [])[1] || '';
    };
    // Loan limit card: qc "Estimate Value" / host214 "Eligible Loan Amount (LTV)"
    const eligible = (await read('Eligible Loan Amount \(LTV\)')) || (await read('Estimate Value'));
    return { estimateValue: eligible, appraisalValue: await read('Appraisal Value'), articleQty: await read('Article Qty') };
  }

  async addNominee(n) {
    await this.nomineeName.fill(n.name);
    await this.relationship.click();
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: new RegExp(`^\\s*${n.relationship}\\s*$`) }).first().click();
    await this.nomineeContact.fill(n.contact);
    await this.proportion.fill(String(n.proportion));
    if (n.kyc) {
      await this.idProofType.selectOption({ label: n.kyc.type });
      await this.idProof.selectOption({ label: n.kyc.name });
      await this.reference.fill(n.kyc.reference);
      if (n.kyc.file) await this.page.locator('input[type=file]').first().setInputFiles(n.kyc.file);
    }
    await this.page.getByText('Add', { exact: true }).locator('visible=true').last().click();
    await expect(this.page.locator('tr', { hasText: n.name })).toBeVisible();
  }

  async next() {
    await this.button('Next').click();
    await expect(this.amountRequested).toBeVisible();
  }

  async save() {
    await this.button('Save').click();
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }

  static num(t) {
    return Number(String(t).replace(/[^\d.]/g, ''));
  }
}

module.exports = { GoldTokenPage };
