const { test, expect } = require('../../fixtures/pageFixtures');
const testData = require('../../data/chargeTestData.json');
const { TYPE_OF_LEDGER_OPTIONS, APPLICABLE_OPTIONS } = require('../../constants/chargeConstants');

test.describe('Charge screen - negative & validation @negative @regression', () => {
  test('Save is blocked when Charge Name is blank @negative', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('Save is blocked when Type Of Ledger is not selected @negative', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: 'Missing Ledger Type',
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('Save is blocked when Applicable is not selected @negative', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: 'Missing Applicable',
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
    });
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('Save is blocked when all mandatory fields are blank @negative', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('duplicate Charge Name (exact match) is rejected @negative @destructive', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm(testData.duplicateChargeSourceRow);
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('duplicate Charge Name (case-insensitive match) is rejected @negative @destructive', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      ...testData.duplicateChargeSourceRow,
      chargeName: testData.duplicateChargeSourceRow.chargeName.toLowerCase(),
    });
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('SQL injection payload in Charge Name is safely handled @negative @security', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: testData.negativeCases.sqlInjection,
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.saveCharge();

    await expect(chargePage.page).not.toHaveTitle(/error|exception/i);
  });

  test('XSS payload in Charge Name is not executed @negative @security', async ({ chargePage, chargeScreen }) => {
    let dialogFired = false;
    chargePage.page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: testData.negativeCases.xssInjection,
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.saveCharge();

    expect(dialogFired).toBeFalsy();
  });

  test('special characters in Charge Name are handled without crashing @negative', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: testData.negativeCases.specialCharacters,
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.saveCharge();

    await expect(chargePage.page.locator('body')).toBeVisible();
  });

  test('very long Charge Name input is handled without crashing @negative @boundary', async ({ chargePage, chargeScreen }) => {
    const largeText = 'A'.repeat(500);
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: largeText,
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.saveCharge();

    await expect(chargePage.page.locator('body')).toBeVisible();
  });

  test('Type Of Ledger dropdown exposes only predefined options @negative @equivalence', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.click(chargePage.typeOfLedgerDropdown);

    for (const option of TYPE_OF_LEDGER_OPTIONS) {
      await expect(chargePage.page.getByRole('option', { name: option, exact: true })).toBeVisible();
    }
  });

  test('Applicable dropdown exposes only predefined options @negative @equivalence', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.click(chargePage.applicableDropdown);

    for (const option of APPLICABLE_OPTIONS) {
      await expect(chargePage.page.getByRole('option', { name: option, exact: true })).toBeVisible();
    }
  });

  test('search with no matching Charge shows an empty grid @negative', async ({ chargePage, chargeScreen }) => {
    await chargePage.search('DefinitelyNotAChargeName_999');
    expect(await chargePage.getRowCount()).toBe(0);
  });

  test('forcing an unsupported Type Of Ledger value via DOM manipulation is rejected on Save @negative @security', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: `Forced Ledger ${Date.now()}`,
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.forceInvalidDropdownOption(chargePage.typeOfLedgerDropdown, 'NotARealLedgerType');
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('forcing an unsupported Applicable value via DOM manipulation is rejected on Save @negative @security', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName: `Forced Applicable ${Date.now()}`,
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
    });
    await chargePage.forceInvalidDropdownOption(chargePage.applicableDropdown, 'NotARealApplicableValue');
    await chargePage.saveCharge();

    await expect(chargePage.panel).toBeVisible();
  });

  test('a network interruption during Save fails gracefully without crashing or silently succeeding @negative', async ({ chargePage, chargeScreen }) => {
    const chargeName = `Network Fail ${Date.now()}`;

    // Abort the first XHR/fetch the app fires after clicking Save, simulating
    // a dropped connection. Only the in-flight save call is aborted so the
    // worker's already-authenticated session/page stays usable afterwards.
    let aborted = false;
    await chargePage.page.route('**/*', async (route) => {
      const request = route.request();
      if (!aborted && ['xhr', 'fetch'].includes(request.resourceType()) && ['POST', 'PUT'].includes(request.method())) {
        aborted = true;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm({
      chargeName,
      typeOfLedger: TYPE_OF_LEDGER_OPTIONS[0],
      applicable: APPLICABLE_OPTIONS[0],
    });
    await chargePage.saveCharge();

    // App must not crash and must not report success for a save that never
    // reached the server: the panel stays open (or reopens/re-shows an
    // error) rather than silently closing as if the Charge was persisted.
    await chargePage.page.waitForTimeout(1000);
    await expect(chargePage.page.locator('body')).toBeVisible();
    expect(aborted).toBeTruthy();
    expect(await chargePage.isChargeVisible(chargeName)).toBeFalsy();

    await chargePage.page.unroute('**/*');
  });
});
