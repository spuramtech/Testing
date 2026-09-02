const { test, expect } = require('@playwright/test');
const { DbClient } = require('../../database/dbClient');
const { ChargeQueries } = require('../../database/chargeQueries');
const testData = require('../../data/chargeTestData.json');

/**
 * Database-level validation. Requires DB credentials in .env and network
 * access to the DB host — skipped by default unless RUN_DB_TESTS=true.
 */
test.describe('Charge database validation @database @regression', () => {
  test.skip(process.env.RUN_DB_TESTS !== 'true', 'Set RUN_DB_TESTS=true to run database validation tests');

  let db;

  test.beforeAll(async () => {
    db = new DbClient();
    await db.connect();
  });

  test.afterAll(async () => {
    await db.close();
  });

  test('inserted Charge is persisted with correct values @positive', async () => {
    const rows = await db.query(ChargeQueries.findByName, [testData.validCharge.chargeName]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].type_of_ledger).toBe(testData.validCharge.typeOfLedger);
  });

  test('updated Charge is persisted with the new values @positive', async () => {
    const rows = await db.query(ChargeQueries.findByName, [testData.updateCharge.chargeName]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].type_of_ledger).toBe(testData.updateCharge.typeOfLedger);
    expect(rows[0].applicable).toBe(testData.updateCharge.applicable);
  });

  test('deleted Charge no longer exists in the table @negative', async () => {
    const rows = await db.query(ChargeQueries.findByName, ['Deleted Charge Name']);
    expect(rows.length).toBe(0);
  });
});
