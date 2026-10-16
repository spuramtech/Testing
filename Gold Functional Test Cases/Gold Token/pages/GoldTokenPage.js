const { expect } = require('@playwright/test');
const { go } = require('../../common/utils/nav');

// Loans → Gold → Gold Token (#/Loans/GoldLoanToken). New Tokens / Used Tokens; selecting a token opens
// Token Overview + Member (nominee, KYC) → Next → Loan Details (amount) → Save.
class GoldTokenPage {
  constructor(page) {
    this.page = page;
    this.date = page.locator('[formcontrolname=ptodayDate]:visible').first();
    this.nomineeName = page.locator('[formcontrolname=pnomineename]:visible');
    this.relationship = page.locator('ng-select[formcontrolname=prelationship]');
    this.nomineeContact = page.locator('[formcontrolname=pcontactno]:visible');
    this.proportion = page.locator('[formcontrolname=pPercentage]:visible');
    this.idProofType = page.locator('select[formcontrolname=pDocumentGroupId]:visible');
    this.idProof = page.locator('select[formcontrolname=pDocumentName]:visible');
    this.reference = page.locator('[formcontrolname=preferencenumber]:visible');
    this.loanName = page.locator('[formcontrolname=pLoanid]:visible');
    this.amount = page.locator('[formcontrolname=pAmountrequsetd]:visible');
    this.tenure = page.locator('[formcontrolname=pTenure]:visible');
    this.interest = page.locator('[formcontrolname=pInterestrate]:visible');
    this.addBtn = page.getByText('Add', { exact: true }).locator('visible=true').last();
    this.nextBtn = this.button('Next');
    this.backBtn = this.button('Back');
    this.saveBtn = this.button('Save');
    this.toasts = page.locator('.toast-message, .toast-title');
  }

  button(text) {
    return this.page.locator('button:visible, a:visible').filter({ hasText: new RegExp(`^\\W*${text}\\s*$`) }).last();
  }

  async open() {
    await go(this.page, 'Gold Token', ['Loans', 'Gold']);
    await this.page.waitForURL(/GoldLoanToken/);
    await expect(this.page.getByText('Available Gold Loan Tokens')).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.locator('tr:visible', { hasText: /UID\d+/ }).first().waitFor({ timeout: 10_000 }).catch(() => {});
  }

  // [{ token, customer, mobile, type, value }]
  async tokens() {
    const out = [];
    for (const r of await this.page.locator('tr:visible', { hasText: /UID\d+/ }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      out.push({ token: c[1], customer: c[2], mobile: c[3], type: c[4], value: num(c[5]) });
    }
    return out;
  }

  async tabCounts() {
    const t = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    return { newTokens: Number((t.match(/New Tokens\s*(\d+)/) || [])[1]), usedTokens: Number((t.match(/Used Tokens\s*(\d+)/) || [])[1]) };
  }

  async selectToken(token) {
    await this.page.locator('tr:visible', { hasText: token }).locator('input[type=radio]').check({ force: true });
    await expect(this.nomineeName).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(800);
  }

  // Token Overview: { appraisal, eligible, articleQty }
  async overview() {
    const t = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const after = (label) => num((t.split('Token Overview')[1] || t).match(new RegExp(`${label}\\s*([\\d,.]+)`))?.[1]);
    return { appraisal: after('Appraisal Value'), eligible: after('Eligible Loan Amount \\(LTV\\)'), articleQty: after('Article Qty') };
  }

  async memberInfo() {
    return ((await this.page.locator('body').innerText()).replace(/\s+/g, ' ').match(/Member Information(.*?)Nominee Details/) || [])[1] || '';
  }

  async pickRelationship(name) {
    await this.relationship.click();
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: new RegExp(`^\\s*${name}\\s*$`) }).first().click();
  }

  // n = { name, relationship, contact, proportion, kyc: { type, name, reference } }
  async fillNominee(n) {
    if (n.name !== undefined) await this.nomineeName.fill(n.name);
    if (n.relationship) await this.pickRelationship(n.relationship);
    if (n.contact !== undefined) await this.nomineeContact.fill(n.contact);
    if (n.proportion !== undefined) await this.proportion.fill(String(n.proportion));
    if (n.kyc) {
      await this.idProofType.selectOption({ label: n.kyc.type });
      await this.page.waitForTimeout(500);
      await this.idProof.selectOption({ label: n.kyc.name });
      await this.reference.fill(n.kyc.reference);
    }
  }

  async addNominee(n) {
    await this.fillNominee(n);
    await this.addBtn.click();
    await this.page.waitForTimeout(500);
  }

  nomineeRows() {
    return this.page.locator('tr:visible').filter({ has: this.page.locator('td') }).filter({ hasText: /Mother|Father|Spouse|Son|Daughter|Brother|Sister/ });
  }

  async toLoanDetails(nominees = [{ name: 'LAKSHMI QA', relationship: 'Mother', contact: '9876500011', proportion: 100 }]) {
    for (const n of nominees) await this.addNominee(n);
    await this.nextBtn.click();
    await expect(this.amount).toBeVisible();
    await expect(this.tenure).not.toHaveValue('', { timeout: 30_000 }); // scheme terms load after Next
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(1500); // scheme values load late and would wipe an early amount
  }

  async typeAmount(v) {
    await this.amount.fill('');
    if (String(v) !== '') await this.amount.pressSequentially(String(v));
    await this.amount.press('Tab');
    await this.page.waitForTimeout(700);
    return this.amount.inputValue();
  }

  async messages() {
    return (await this.toasts.allInnerTexts()).join(' | ');
  }

  async waitMessage() {
    await expect(this.toasts.first()).toBeVisible();
    await this.page.waitForTimeout(500);
    return this.messages();
  }

  async clearToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
    await this.page.waitForTimeout(200);
  }
}

function num(text) {
  const m = String(text ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

module.exports = { GoldTokenPage, num };
