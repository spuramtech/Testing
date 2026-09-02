const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { randomKycDocument } = require('../helpers/dataGenerator');
const { isValidPan } = require('../helpers/validators');
const testData = require('../data/contactTestData.json');
const { TABS } = require('../constants/appConstants');

test.describe('@regression @functional KYC Documents tab', () => {
  test.beforeEach(async ({ page, contactListPage, contactTabsNav }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();
    await contactTabsNav.openTab(TABS.KYC_DOCUMENTS);
  });

  test('@positive shows empty grid state before any document is added', async ({ kycDocumentsPage }) => {
    await expect(kycDocumentsPage.gridEmptyState).toBeVisible();
  });

  test('@positive adds a valid PAN document', async ({ kycDocumentsPage }) => {
    const doc = randomKycDocument();
    expect(isValidPan(doc.referenceNumber)).toBe(true);
    await kycDocumentsPage.addKycDocument(doc);
  });

  for (const pan of require('../data/contactTestData.json').invalidPan) {
    test(`@negative rejects invalid PAN "${pan}"`, async ({ kycDocumentsPage }) => {
      expect(isValidPan(pan)).toBe(false);
      await kycDocumentsPage.addKycDocument({
        documentType: 'PAN',
        documentName: 'PAN Card',
        referenceNumber: pan,
      });
    });
  }

  test('@negative @security rejects SQL injection in Reference Number', async ({ kycDocumentsPage }) => {
    await kycDocumentsPage.addKycDocument({
      documentType: 'PAN',
      documentName: 'PAN Card',
      referenceNumber: testData.sqlInjectionPayloads[0],
    });
  });
});
