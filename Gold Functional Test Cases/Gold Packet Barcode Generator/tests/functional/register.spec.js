const { test, expect } = require('../../fixtures');

// Gold Packet Barcode Register as Branch Head. Writes blocked; cancellation replies are SIMULATED.
const regApi = (hits) => JSON.parse(hits.filter((h) => /getbarcoderegister/i.test(h.url) && h.text).pop()?.text || '[]');

test.describe('Gold Packet Barcode Register', () => {
  test('TC_PB_026 - Register opens from "View Register" with the expected columns @smoke @regression', async ({ register, page, record }) => {
    const th = (await page.locator('th:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    record(th.join(' | '));
    expect(page.url()).toMatch(/GoldPacketBarcodeRegister/);
    for (const c of ['Barcode no.', 'Type', 'Loan no.', 'Applicant Name', 'Created by', 'Created date', 'Status', 'Remarks', 'Action']) expect(th).toContain(c);
  });

  test('TC_PB_027 - Total items equals the number of records from the API @regression', async ({ register, apiHits, record }) => {
    const total = await register.totalItems();
    const api = regApi(apiHits);
    record(`Pager ${total}, API ${api.length}`);
    expect(total).toBe(api.length);
  });

  test('TC_PB_028 - First-page rows match the API (barcode, loan, status) @regression', async ({ register, apiHits, record }) => {
    const rows = await register.regRows();
    const byNo = Object.fromEntries(regApi(apiHits).map((r) => [r.pBarcodeno, r]));
    const bad = rows.filter((r) => !byNo[r.barcode] || byNo[r.barcode].pLoanid !== r.loan || byNo[r.barcode].pStatus !== r.status);
    record(`${rows.length} rows checked, ${bad.length} mismatches ${JSON.stringify(bad.slice(0, 2))}`);
    expect(rows.length).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  });

  test('TC_PB_029 - Status list offers All, Not Used, Used and Cancelled @regression', async ({ register, record }) => {
    const opts = (await register.regStatus.locator('option').allInnerTexts()).map((t) => t.trim());
    record(opts.join(', '));
    expect(opts).toEqual(['All statuses', 'Not Used', 'Used', 'Cancelled']);
  });

  for (const [id, status] of [['030', 'Not Used'], ['031', 'Used'], ['032', 'Cancelled']]) {
    test(`TC_PB_${id} - Status filter "${status}" shows only ${status} barcodes @regression`, async ({ register, record }) => {
      await register.filterStatus(status);
      const rows = await register.regRows();
      record(`${rows.length} rows: ${[...new Set(rows.map((r) => r.status))].join(', ')}`);
      test.skip(!rows.length, `no ${status} barcodes`);
      expect(rows.every((r) => r.status === status)).toBe(true);
    });
  }

  for (const [id, field, key] of [['033', 'loan number', 'loan'], ['034', 'barcode number', 'barcode'], ['035', 'applicant name', 'applicant']]) {
    test(`TC_PB_${id} - Search by ${field} @regression`, async ({ register, record }) => {
      const first = (await register.regRows())[0];
      await register.search(first[key]);
      const rows = await register.regRows();
      record(`"${first[key]}" → ${rows.length} rows`);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r[key].toLowerCase().includes(first[key].toLowerCase()))).toBe(true);
    });
  }

  test('TC_PB_036 - Search with no match shows no rows @regression', async ({ register, record }) => {
    await register.search('ZZNOMATCH999');
    const rows = await register.regRows();
    record(`${rows.length} rows`);
    expect(rows).toHaveLength(0);
  });

  test('TC_PB_037 - Only Not Used barcodes have a Cancel button @regression', async ({ register, record }) => {
    const rows = await register.regRows();
    const wrong = rows.filter((r) => r.canCancel !== (r.status === 'Not Used'));
    record(`${rows.length} rows, wrong: ${JSON.stringify(wrong)}`);
    expect(wrong).toEqual([]);
  });

  test('TC_PB_038 - Barcode numbers are BH…/AUD… by type and unique @regression', async ({ register, apiHits, record }) => {
    const all = regApi(apiHits);
    const nos = all.map((r) => r.pBarcodeno);
    const dup = nos.filter((n, i) => nos.indexOf(n) !== i);
    const badFmt = all.filter((r) => !(r.pType === 'Audit' ? /^AUD\d{10}$/ : /^BH\d{10}$/).test(r.pBarcodeno));
    record(`${nos.length} barcodes, duplicates ${dup.length}, bad format ${badFmt.map((r) => `${r.pBarcodeno}/${r.pType}`).join(', ') || 0}`);
    expect(dup).toEqual([]);
    expect(badFmt).toEqual([]);
  });

  test('TC_PB_039 - A loan has at most one Not Used BH barcode @regression', async ({ register, apiHits, record }) => {
    const unused = regApi(apiHits).filter((r) => r.pStatus === 'Not Used' && r.pType !== 'Audit').map((r) => r.pLoanid);
    const dup = [...new Set(unused.filter((l, i) => unused.indexOf(l) !== i))];
    record(`${unused.length} Not Used BH barcodes; loans with more than one: ${dup.join(', ') || 'none'}`);
    expect(dup).toEqual([]);
  });

  test('TC_PB_040 - A loan has at most one Used BH barcode (one packet per loan) @regression', async ({ register, apiHits, record }) => {
    const used = regApi(apiHits).filter((r) => r.pStatus === 'Used' && r.pType !== 'Audit').map((r) => r.pLoanid);
    const dup = [...new Set(used.filter((l, i) => used.indexOf(l) !== i))];
    record(`${used.length} Used BH barcodes; loans with more than one: ${dup.join(', ') || 'none'}`);
    expect(dup).toEqual([]);
  });

  test('TC_PB_041 - Loans in the BH list have no Used BH barcode @regression', async ({ register, apiHits, record }) => {
    const used = regApi(apiHits).filter((r) => r.pStatus === 'Used' && r.pType !== 'Audit');
    const usedLoans = new Set(used.map((r) => r.pLoanid));
    await register.open();
    const bh = (await register.loanOptions()).map((o) => o.split(' - ')[0]);
    const both = bh.filter((l) => usedLoans.has(l));
    record(`${bh.length} BH loans; already packeted: ${both.map((l) => `${l} (${used.filter((r) => r.pLoanid === l).map((r) => r.pBarcodeno).join(', ')})`).join('; ') || 'none'}`);
    expect(both).toEqual([]);
  });

  test('TC_PB_042 - Rows are listed newest first @regression', async ({ register, record }) => {
    const toKey = (d) => d.replace(/(\d{2})-(\d{2})-(\d{4}) (\d{2}:\d{2})/, '$3$2$1$4');
    const keys = (await register.regRows()).map((r) => toKey(r.created));
    record(keys.slice(0, 5).join(', '));
    expect(keys).toEqual([...keys].sort().reverse());
  });

  test('TC_PB_043 - Paging shows 10 rows per page and page 2 has different rows @regression', async ({ register, page, record }) => {
    const p1 = (await register.regRows()).map((r) => r.barcode);
    await page.locator('[title*="next page" i]:visible, [aria-label*="next page" i]:visible').first().click();
    await page.waitForTimeout(1000);
    const p2 = (await register.regRows()).map((r) => r.barcode);
    record(`Page 1 ${p1.length} rows, page 2 ${p2.length}: ${p2[0]}`);
    expect(p1.length).toBe(10);
    expect(p2.length).toBeGreaterThan(0);
    expect(p2.some((b) => p1.includes(b))).toBe(false);
  });
});

test.describe('Gold Packet Barcode Register – cancel a barcode (simulated)', () => {
  async function openCancel(register, page) {
    await register.filterStatus('Not Used');
    const row = (await register.regRows()).find((r) => r.canCancel);
    test.skip(!row, 'no Not Used barcode to open the dialog on');
    await page.locator('tr:visible', { hasText: row.barcode }).getByRole('button', { name: /^\s*Cancel\s*$/ }).click();
    const d = register.cancelDialog();
    await expect(d).toBeVisible();
    return { row, d };
  }

  test('TC_PB_044 - Cancel dialog shows the barcode, type and loan and warns it is permanent @regression', async ({ register, page, record }) => {
    const { row, d } = await openCancel(register, page);
    const t = (await d.innerText()).replace(/\s+/g, ' ');
    record(t.slice(0, 260));
    expect(t).toContain(row.barcode);
    expect(t).toContain(row.loan);
    expect(t).toMatch(/permanently unusable/);
  });

  test('TC_PB_045 - Confirm cancellation without a reason is refused @regression', async ({ register, mockWrite, page, record }) => {
    const sent = await mockWrite('goldpacketbarcode/cancelbarcode', { pRecordid: 1 });
    const { d } = await openCancel(register, page);
    const btn = d.getByRole('button', { name: /Confirm cancellation/ });
    const disabled = await btn.isDisabled();
    if (!disabled) await btn.click();
    await page.waitForTimeout(1200);
    record(`Confirm disabled: ${disabled}; requests ${sent.length}; message "${await register.messages()}"`);
    expect(sent).toHaveLength(0);
  });

  test('TC_PB_046 - Whitespace-only reason is refused @regression', async ({ register, mockWrite, page, record }) => {
    const sent = await mockWrite('goldpacketbarcode/cancelbarcode', { pRecordid: 1 });
    const { d } = await openCancel(register, page);
    await register.reasonBox(d).fill('     ');
    const btn = d.getByRole('button', { name: /Confirm cancellation/ });
    const disabled = await btn.isDisabled();
    if (!disabled) await btn.click();
    await page.waitForTimeout(1200);
    record(`Confirm disabled: ${disabled}; requests ${sent.length}; message "${await register.messages()}"`);
    expect(sent).toHaveLength(0);
  });

  test('TC_PB_047 - Confirm cancellation sends the barcode and the reason @regression', async ({ register, mockWrite, page, record }) => {
    const sent = await mockWrite('goldpacketbarcode/cancelbarcode', { pRecordid: 1 });
    const { row, d } = await openCancel(register, page);
    await register.reasonBox(d).fill('sticker lost – autotest (simulated)');
    await d.getByRole('button', { name: /Confirm cancellation/ }).click();
    await page.waitForTimeout(1500);
    record(JSON.stringify(sent[0]));
    expect(sent).toHaveLength(1);
    expect(sent[0].pBarcodeno).toBe(row.barcode);
    expect(sent[0].pCancelreason).toMatch(/sticker lost – autotest/);
  });

  test('TC_PB_048 - Back closes the dialog and sends nothing @regression', async ({ register, mockWrite, page, record }) => {
    const sent = await mockWrite('goldpacketbarcode/cancelbarcode', { pRecordid: 1 });
    const { d } = await openCancel(register, page);
    await d.getByRole('button', { name: /^\s*Back\s*$/ }).click();
    await expect(d).toBeHidden();
    record(`Requests ${sent.length}`);
    expect(sent).toHaveLength(0);
  });

  test('TC_PB_049 - Failed cancellation (network) does not show success @regression', async ({ register, mockWrite, page, record }) => {
    await mockWrite('goldpacketbarcode/cancelbarcode', 'abort');
    const { d } = await openCancel(register, page);
    await register.reasonBox(d).fill('sticker lost – autotest (simulated)');
    await d.getByRole('button', { name: /Confirm cancellation/ }).click();
    await page.waitForTimeout(1500);
    const msg = await register.messages();
    record(`Message "${msg}"`);
    expect(msg).not.toMatch(/Success/i);
    expect(msg).toMatch(/error|could not|fail/i);
  });
});
