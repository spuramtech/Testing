const { test, expect } = require('@playwright/test');
const { ChargeApi } = require('../../api/chargeApi');
const testData = require('../../data/chargeTestData.json');

/**
 * API-level Charge tests. Endpoint paths in api/chargeApi.js are placeholders —
 * confirm actual routes via the app's network tab before enabling in CI.
 */
test.describe('Charge API @api @regression', () => {
  let chargeApi;

  test.beforeEach(async () => {
    chargeApi = new ChargeApi();
    await chargeApi.init();
  });

  test.afterEach(async () => {
    await chargeApi.dispose();
  });

  test('fetch Charge list returns 200 and an array payload @smoke', async () => {
    const response = await chargeApi.fetchChargeList();
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body?.data ?? body)).toBeTruthy();
  });

  test('create Charge via API returns 201 with the created record @positive @destructive', async () => {
    const response = await chargeApi.createCharge({
      chargeName: `API Charge ${Date.now()}`,
      typeOfLedger: testData.validCharge.typeOfLedger,
      applicable: testData.validCharge.applicable,
    });
    expect([200, 201]).toContain(response.status());
  });

  test('create Charge with missing mandatory fields returns 4xx @negative', async () => {
    const response = await chargeApi.createCharge({});
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('fetch Charge by non-existent id returns 404 @negative', async () => {
    const response = await chargeApi.fetchChargeById('non-existent-id-999999');
    expect(response.status()).toBe(404);
  });

  test('update Charge via API returns 200 with the updated record @positive @destructive', async () => {
    const created = await chargeApi.createCharge({
      chargeName: `API Charge ${Date.now()}`,
      typeOfLedger: testData.validCharge.typeOfLedger,
      applicable: testData.validCharge.applicable,
    });
    const createdBody = await created.json();
    const id = createdBody?.data?.id ?? createdBody?.id;

    const response = await chargeApi.updateCharge(id, {
      chargeName: testData.updateCharge.chargeName,
      typeOfLedger: testData.updateCharge.typeOfLedger,
      applicable: testData.updateCharge.applicable,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body?.data?.chargeName ?? body?.chargeName).toBe(testData.updateCharge.chargeName);
  });

  test('update Charge with missing mandatory fields returns 4xx @negative', async () => {
    const response = await chargeApi.updateCharge('some-existing-id', {});
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('update non-existent Charge returns 404 @negative', async () => {
    const response = await chargeApi.updateCharge('non-existent-id-999999', {
      chargeName: testData.updateCharge.chargeName,
      typeOfLedger: testData.updateCharge.typeOfLedger,
      applicable: testData.updateCharge.applicable,
    });
    expect(response.status()).toBe(404);
  });

  test('delete Charge via API returns success and the record is no longer fetchable @positive @destructive', async () => {
    const created = await chargeApi.createCharge({
      chargeName: `API Charge To Delete ${Date.now()}`,
      typeOfLedger: testData.validCharge.typeOfLedger,
      applicable: testData.validCharge.applicable,
    });
    const createdBody = await created.json();
    const id = createdBody?.data?.id ?? createdBody?.id;

    const deleteResponse = await chargeApi.deleteCharge(id);
    expect([200, 204]).toContain(deleteResponse.status());

    const fetchResponse = await chargeApi.fetchChargeById(id);
    expect(fetchResponse.status()).toBe(404);
  });

  test('delete non-existent Charge returns 404 @negative', async () => {
    const response = await chargeApi.deleteCharge('non-existent-id-999999');
    expect(response.status()).toBe(404);
  });

  test('Charge list response conforms to the expected schema @positive', async () => {
    const response = await chargeApi.fetchChargeList();
    const body = await response.json();
    const list = body?.data ?? body;

    expect(Array.isArray(list)).toBeTruthy();
    for (const item of list) {
      expect(item).toEqual(
        expect.objectContaining({
          chargeName: expect.any(String),
          typeOfLedger: expect.any(String),
          applicable: expect.any(String),
        })
      );
    }
  });

  test('unauthenticated request to fetch Charge list is rejected @negative @security', async () => {
    const unauthenticatedApi = new ChargeApi();
    await unauthenticatedApi.init();
    // no token set, so no Authorization header is sent

    const response = await unauthenticatedApi.fetchChargeList();
    expect([401, 403]).toContain(response.status());

    await unauthenticatedApi.dispose();
  });

  test('request with an expired/invalid token is rejected @negative @security', async () => {
    const invalidTokenApi = new ChargeApi(undefined, 'expired-or-invalid-token');
    await invalidTokenApi.init();

    const response = await invalidTokenApi.fetchChargeList();
    expect([401, 403]).toContain(response.status());

    await invalidTokenApi.dispose();
  });
});
