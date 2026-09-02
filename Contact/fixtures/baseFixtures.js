const base = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const ContactListPage = require('../pages/ContactListPage');
const { ContactTabsNav } = require('../pages/ContactTabsNav');
const ContactInfoPage = require('../pages/ContactInfoPage');
const AddressDetailsPage = require('../pages/AddressDetailsPage');
const KycDocumentsPage = require('../pages/KycDocumentsPage');
const BankDetailsPage = require('../pages/BankDetailsPage');
const PersonalDetailsPage = require('../pages/PersonalDetailsPage');
const GstPage = require('../pages/GstPage');
const EmploymentDetailsPage = require('../pages/EmploymentDetailsPage');
const IncomeDetailsPage = require('../pages/IncomeDetailsPage');
const logger = require('../utils/logger');

exports.test = base.test.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  contactListPage: async ({ page }, use) => use(new ContactListPage(page)),
  contactTabsNav: async ({ page }, use) => use(new ContactTabsNav(page)),
  contactInfoPage: async ({ page }, use) => use(new ContactInfoPage(page)),
  addressDetailsPage: async ({ page }, use) => use(new AddressDetailsPage(page)),
  kycDocumentsPage: async ({ page }, use) => use(new KycDocumentsPage(page)),
  bankDetailsPage: async ({ page }, use) => use(new BankDetailsPage(page)),
  personalDetailsPage: async ({ page }, use) => use(new PersonalDetailsPage(page)),
  gstPage: async ({ page }, use) => use(new GstPage(page)),
  employmentDetailsPage: async ({ page }, use) => use(new EmploymentDetailsPage(page)),
  incomeDetailsPage: async ({ page }, use) => use(new IncomeDetailsPage(page)),
});

exports.test.beforeEach(async ({}, testInfo) => {
  logger.info(`Execution Start: ${testInfo.title}`);
});

exports.test.afterEach(async ({}, testInfo) => {
  logger.info(`Execution End: ${testInfo.title} - Status: ${testInfo.status}`);
});

exports.expect = base.expect;
