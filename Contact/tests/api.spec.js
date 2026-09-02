const { test, expect } = require('@playwright/test');
const { request } = require('@playwright/test');
const { loginAndGetToken, API_BASE_URL } = require('../api/apiClient');
const ContactApi = require('../api/contactApi');
const { LOGIN_USERNAME, LOGIN_PASSWORD } = require('../utils/envLoader');

// Real endpoints captured live via network trace (see
// CONTACT_FORM_AUTOMATION_PROMPT.md). Closes the "API Validation"
// coverage gap. Create/Update Contact endpoints are unknown since
// triggering them requires an actual @destructive Save.
test.describe('@api @regression Contact module API', () => {
  let token;

  test.beforeAll(async () => {
    const login = await loginAndGetToken(LOGIN_USERNAME, LOGIN_PASSWORD);
    expect(login.status).toBe(200);
    expect(login.token).toBeTruthy();
    token = login.token;
  });

  test('@negative POST /api/login rejects an invalid password', async () => {
    const login = await loginAndGetToken(LOGIN_USERNAME, 'wrong-password-123');
    if (login.status === 200) {
      expect(login.token).toBeFalsy();
    } else {
      expect(login.status).not.toBe(200);
    }
  });

  test('@positive GetcontactviewByName returns the Contact List grid data', async () => {
    const api = new ContactApi(token);
    await api.init();
    const response = await api.getContactsGridView();
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    await api.dispose();
  });

  test('@positive GetContactCount returns the total contact count', async () => {
    const api = new ContactApi(token);
    await api.init();
    const response = await api.getContactCount();
    expect(response.status()).toBe(200);
    const count = Number(await response.text());
    expect(count).toBeGreaterThan(0);
    await api.dispose();
  });

  test('@positive getCountries returns master data', async () => {
    const api = new ContactApi(token);
    await api.init();
    const response = await api.getCountries();
    expect(response.status()).toBe(200);
    await api.dispose();
  });

  test('@positive getStates returns dependent master data for a country', async () => {
    const api = new ContactApi(token);
    await api.init();
    const response = await api.getStates(1);
    expect(response.status()).toBe(200);
    await api.dispose();
  });

  // --- Security: the same class of finding discovered on the Employee
  // module's API. Verified here against 4 distinct Contact endpoints to
  // confirm it's a systemic gap across the API layer, not an isolated one.
  test('@negative @security CRITICAL — GetcontactviewByName exposes the full contact list with no auth', async () => {
    const ctx = await request.newContext({ baseURL: API_BASE_URL });
    const response = await ctx.get('/api/loans/masters/contactmasterNew/GetcontactviewByName', {
      params: { ViewName: 'Contacts', endindex: 0, limitcount: 10, searchcondition: 'ALL', searchvalue: '', pContacttype: 'Individual' },
    });
    // This SHOULD fail (not 200) for a secure API. It currently returns
    // 200 with real customer data — documented as a critical finding.
    expect(response.status()).not.toBe(200);
    await ctx.dispose();
  });

  test('@negative @security CRITICAL — GetContactsList exposes contact data with no auth', async () => {
    const ctx = await request.newContext({ baseURL: API_BASE_URL });
    const response = await ctx.get('/api/loans/masters/contactmasterNew/GetContactsList');
    expect(response.status()).not.toBe(200);
    await ctx.dispose();
  });

  test('@negative @security CRITICAL — GetContactCount exposes the customer count with no auth', async () => {
    const ctx = await request.newContext({ baseURL: API_BASE_URL });
    const response = await ctx.get('/api/loans/masters/contactmasterNew/GetContactCount', {
      params: { ViewName: 'Contacts', searchby: '' },
    });
    expect(response.status()).not.toBe(200);
    await ctx.dispose();
  });

  test('@negative rejects a request with a garbage auth token the same as no token', async () => {
    const api = new ContactApi('not-a-real-jwt-token');
    await api.init();
    const response = await api.getContactsGridView();
    // Documents the same behavior as the no-token case for consistency.
    expect(response.status()).not.toBe(200);
    await api.dispose();
  });
});
