const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { EMPLOYMENT_TYPE, TABS } = require('../constants/appConstants');

test.describe('@regression @functional Employment Details tab', () => {
  test.beforeEach(async ({ page, contactListPage, contactTabsNav }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();
    await contactTabsNav.openTab(TABS.EMPLOYMENT_DETAILS);
  });

  test('@positive defaults to Employed segment', async ({ employmentDetailsPage }) => {
    await expect(employmentDetailsPage.employedToggle).toBeVisible();
  });

  test('@positive fills Employed details', async ({ employmentDetailsPage }) => {
    await employmentDetailsPage.fillEmployedDetails({
      organizationName: 'Kapil IT Pvt Ltd',
      employmentRole: 'QA Engineer',
      officePhone: '01123456789',
      totalWorkExperience: '5',
      reportingTo: 'Manager Name',
    });
  });

  test('@positive switches to Self Employed segment', async ({ employmentDetailsPage }) => {
    await employmentDetailsPage.selectEmploymentType(EMPLOYMENT_TYPE.SELF_EMPLOYED);
  });

  test('@positive switches to Others segment', async ({ employmentDetailsPage }) => {
    await employmentDetailsPage.selectEmploymentType(EMPLOYMENT_TYPE.OTHERS);
  });

  test('@negative rejects negative Total Work Experience', async ({ employmentDetailsPage }) => {
    await employmentDetailsPage.fillEmployedDetails({ totalWorkExperience: '-5' });
  });
});
