const { expect } = require('@playwright/test');

// Loans → Gold → Gold Estimate Approval Queue  (+ Internal Appraiser Verification page)
class GoldEstimateQueuePage {
  constructor(page) {
    this.page = page;
    // Buttons carry an icon, so match on visible text
    this.approve = page.locator('button:visible').filter({ hasText: /^\W*Approve\s*$/ }).first();
    this.revert = page.locator('button:visible').filter({ hasText: /^\W*Revert\s*$/ }).first();
  }

  async open() {
    const p = this.page;
    await p.waitForTimeout(1500);
    if (!/GoldEstimateApprovalQueue/.test(p.url())) {
      // Gold submenu may already be expanded; use the sidebar link directly when visible
      const link = p.getByText('Gold Estimate Approval Queue', { exact: true }).locator('visible=true').first();
      if (!(await link.isVisible())) {
        await p.getByText('Loans', { exact: true }).first().click();
        await p.getByText('Gold', { exact: true }).locator('visible=true').first().click();
      }
      await link.click();
    }
    await p.waitForURL(/GoldEstimateApprovalQueue/);
    await expect(p.getByText('GE NUMBER', { exact: false }).first()).toBeVisible();
    // rows load async; the queue may legitimately be empty (e.g. after the last estimate was approved)
    await p.locator('tr', { hasText: /GE\d{6,}/ }).first().waitFor({ timeout: 10_000 }).catch(() => {});
  }


  // [{ ge, customer, mobile, value, role, status, action }]
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr', { hasText: /GE\d{6,}/ }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      // Columns can shift (e.g. an empty Images cell) – find role / status by their text instead of position
      const status = c.find((t) => /Awaiting|Ready for Approval|Approved|Sent back|Revert/i.test(t)) || c[6];
      const role = c.find((t) => /^(Internal Appraiser|External Appraiser|Branch Head|Checker)/i.test(t) && t !== status) || c[5];
      out.push({ ge: c[0], customer: c[1], mobile: c[2], value: c[3], role, status, action: c[c.length - 1] });
    }
    return out;
  }

  async openVerify(ge) {
    await this.page.locator('tr', { hasText: ge }).getByRole('button', { name: /Verify/ }).click();
    await expect(this.page.getByText(ge, { exact: true })).toBeVisible();
    await expect(this.approve).toBeVisible();
  }

  async verificationSummary() {
    const text = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const pick = (label) => (text.match(new RegExp(label + ' (\\S+(?: \\S+)?)', 'i')) || [])[1];
    return {
      enteredBy: pick('ENTERED BY'),
      grossWeight: pick('GROSS WEIGHT'),
      netWeight: pick('NET WEIGHT'),
      ratePerGram: pick('RATE/G'),
      estimatedValue: pick('ESTIMATED VALUE'),
    };
  }

  // Click Approve and complete any confirmation / remarks popup the app shows
  async approveWithRemarks(remarks) {
    await this.approve.click();
    const dialog = this.page.locator('.modal.show, .swal2-popup, [role=dialog]:visible').first();
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = dialog.locator('textarea, input[type=text]').first();
      if (await box.isVisible().catch(() => false)) await box.fill(remarks);
      await dialog.locator('button').filter({ hasText: /approve|confirm|yes|ok|submit/i }).last().click();
    }
  }

  // Checker final approval: Approve → popup "Approve Gold Estimate – Select the entry to approve as the final value"
  // → select ONE record (radio) → Confirm Approve.
  // Each record shows the appraiser and one or two amounts:
  //   qc:      "Internal Appraiser - tryfinsta ₹ 1,03,885.99"                    (estimated value)
  //   host214: "Internal Appraiser - tryfinsta ₹ 1,38,393.9 / ₹ 1,03,643.19"     (appraisal / eligible amount)
  // `pick` = 'lowest' | 'highest' (by the LAST amount = value approved) | 'random' | '1', '2'… (position) | text in the record
  async approveFinal(pick = 'lowest') {
    await this.approve.click();
    const dialog = this.page.getByText('Approve Gold Estimate').locator('xpath=ancestor::*[.//button[contains(.,"Confirm Approve")]][1]');
    await expect(dialog).toBeVisible();
    const radios = dialog.locator('input[type=radio]');
    await expect(radios.first()).toBeAttached();
    const entries = [];
    for (let i = 0; i < (await radios.count()); i++) {
      const radio = radios.nth(i);
      // the record = nearest ancestor of this radio that shows an amount but holds no other radio
      const record = radio.locator('xpath=ancestor::*[contains(normalize-space(.),"₹") and count(.//input[@type="radio"])=1][1]');
      const text = (await record.innerText()).replace(/\s+/g, ' ').trim();
      const amounts = [...text.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/,/g, '')));
      entries.push({ index: i + 1, radio, text, amounts, value: amounts[amounts.length - 1] });
    }
    expect(entries.length, 'no records in the Approve Gold Estimate popup').toBeGreaterThan(0);

    let chosen;
    if (pick === 'lowest') chosen = entries.reduce((a, b) => (b.value < a.value ? b : a));
    else if (pick === 'highest') chosen = entries.reduce((a, b) => (b.value > a.value ? b : a));
    else if (pick === 'random') chosen = entries[Math.floor(Math.random() * entries.length)];
    else if (/^\d+$/.test(pick)) chosen = entries[Math.min(Number(pick), entries.length) - 1];
    else chosen = entries.find((e) => e.text.toLowerCase().includes(pick.toLowerCase())) || entries[0];

    await chosen.radio.check({ force: true });
    await expect(chosen.radio).toBeChecked();
    await dialog.getByRole('button', { name: /Confirm Approve/i }).click();
    return {
      chosen: `#${chosen.index} ${chosen.text}`,
      options: entries.map((e) => `#${e.index} ${e.text}`),
    };
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { GoldEstimateQueuePage };
