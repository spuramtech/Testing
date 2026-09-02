const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { RESIDENTIAL_STATUS, MARITAL_STATUS, TABS } = require('../constants/appConstants');

test.describe('@regression @functional Personal Details tab', () => {
  test.beforeEach(async ({ page, contactListPage, contactTabsNav }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();
    await contactTabsNav.openTab(TABS.PERSONAL_DETAILS);
  });

  test('@positive defaults to Resident and Married', async ({ personalDetailsPage }) => {
    await expect(personalDetailsPage.residentRadio).toBeChecked();
    await expect(personalDetailsPage.marriedRadio).toBeChecked();
  });

  test('@positive switches Residential Status to Non-Resident', async ({ personalDetailsPage }) => {
    await personalDetailsPage.setResidentialStatus(RESIDENTIAL_STATUS.NON_RESIDENT);
    await expect(personalDetailsPage.nonResidentRadio).toBeChecked();
  });

  for (const status of Object.values(MARITAL_STATUS)) {
    test(`@positive selects Marital Status: ${status}`, async ({ personalDetailsPage }) => {
      await personalDetailsPage.setMaritalStatus(status);
    });
  }

  test('@positive fills Birth & Nationality details', async ({ personalDetailsPage }) => {
    await personalDetailsPage.fillBirthDetails({
      placeOfBirth: 'New Delhi',
      countryOfBirth: 'India',
      nationality: 'Indian',
      religion: 'Hindu',
    });
  });
});
