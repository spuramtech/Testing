const base = require('@playwright/test');
const EmployeeFormPage = require('../pages/EmployeeFormPage');
const EmployeeListPage = require('../pages/EmployeeListPage');
const logger = require('../utils/logger');

exports.test = base.test.extend({
  employeeFormPage: async ({ page }, use) => use(new EmployeeFormPage(page)),
  employeeListPage: async ({ page }, use) => use(new EmployeeListPage(page)),
});

exports.test.beforeEach(async ({}, testInfo) => {
  logger.info(`Execution Start: ${testInfo.title}`);
});

exports.test.afterEach(async ({}, testInfo) => {
  logger.info(`Execution End: ${testInfo.title} - Status: ${testInfo.status}`);
});

exports.expect = base.expect;
