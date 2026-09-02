const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { randomIndividualContact, randomAddress, randomKycDocument, randomBankAccount } = require('../helpers/dataGenerator');
const { TABS } = require('../constants/appConstants');

// This spec performs a real Save & Continue / final submit and therefore
// creates a live record in the shared Contact List. Excluded by default —
// run explicitly with: npx playwright test --grep @destructive
test.describe('@e2e @destructive Create a full Individual contact end-to-end', () => {
  test('@destructive creates contact across all 8 tabs and verifies it in the list', async ({
    page,
    contactListPage,
    contactTabsNav,
    contactInfoPage,
    addressDetailsPage,
    kycDocumentsPage,
    bankDetailsPage,
    incomeDetailsPage,
  }) => {
    const contact = randomIndividualContact();

    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();

    await contactInfoPage.fillMandatory(contact);
    await contactTabsNav.goNext();

    await contactTabsNav.openTab(TABS.ADDRESS_DETAILS);
    await addressDetailsPage.addAddress(randomAddress());
    await contactTabsNav.saveAndContinue();

    await contactTabsNav.openTab(TABS.KYC_DOCUMENTS);
    await kycDocumentsPage.addKycDocument(randomKycDocument());
    await contactTabsNav.saveAndContinue();

    await contactTabsNav.openTab(TABS.BANK_DETAILS);
    await bankDetailsPage.addBankAccount(randomBankAccount());
    await contactTabsNav.saveAndContinue();

    await contactTabsNav.openTab(TABS.INCOME_DETAILS);
    await incomeDetailsPage.fillTopLevelIncome({
      grossAnnualIncome: 1000000,
      netAnnualIncome: 850000,
      averageAnnualExpenses: 300000,
    });
    await contactTabsNav.saveAndContinue();

    await contactListPage.open();
    await contactListPage.searchContact(contact.firstName);
    await expect(contactListPage.contactCardByName(contact.firstName).first()).toBeVisible();
  });
});
