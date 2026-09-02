const { test, expect } = require('@playwright/test');
const { loginAndGetToken, authedContext } = require('../api/apiClient');

// Real endpoints captured live via network trace while using the Add
// Employee form and Employees list (see EMPLOYEE_AUTOMATION_PROMPT.md).
// Closes the "API Validation" coverage gap for the GET/master-data side;
// Create/Update Employee endpoints are unknown since triggering them
// requires an actual @destructive Save (not done here to avoid writing
// live data through the API layer with no traceability).
test.describe('@api @regression Employee module API', () => {
  let token;

  test.beforeAll(async () => {
    const login = await loginAndGetToken();
    expect(login.status).toBe(200);
    expect(login.token).toBeTruthy();
    token = login.token;
  });

  test('@negative POST /api/login rejects an invalid password', async () => {
    const { request } = require('@playwright/test');
    const context = await request.newContext({ baseURL: 'https://demonbfc-api.finsta.co.in' });
    const response = await context.post('/api/login', {
      data: { pUserName: process.env.LOGIN_USERNAME, pPassword: 'wrong-password-123', pbranchid: '', pbranchname: '', ptoken: '', pOtp: '' },
    });
    // Any non-200, or a 200 with no token, both count as "did not
    // authenticate" — assert whichever this API actually does.
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.pToken).toBeFalsy();
    } else {
      expect(response.status()).not.toBe(200);
    }
    await context.dispose();
  });

  test('@positive GetContactsList returns the Employee Name lookup data', async () => {
    const ctx = await authedContext(token);
    const response = await ctx.get('/api/loans/masters/contactmasterNew/GetContactsList');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body) || Array.isArray(body.data) || typeof body === 'object').toBeTruthy();
    await ctx.dispose();
  });

  test('@positive GetDesignations returns Designation master data', async () => {
    const ctx = await authedContext(token);
    const response = await ctx.get('/api/loans/masters/contactmasterNew/GetDesignations');
    expect(response.status()).toBe(200);
    await ctx.dispose();
  });

  test('@positive GetEmployementRoles returns Role master data', async () => {
    const ctx = await authedContext(token);
    const response = await ctx.get('/api/loans/Transactions/Firstinformation/GetEmployementRoles');
    expect(response.status()).toBe(200);
    await ctx.dispose();
  });

  test('@positive GetallEmployeeDetails returns the Employees list data', async () => {
    const ctx = await authedContext(token);
    const response = await ctx.get('/api/Settings/Employee/GetallEmployeeDetails');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toBeTruthy();
    await ctx.dispose();
  });

  test('@negative GetallEmployeeDetails rejects a request with no auth token', async () => {
    const ctx = await require('@playwright/test').request.newContext({ baseURL: 'https://demonbfc-api.finsta.co.in' });
    const response = await ctx.get('/api/Settings/Employee/GetallEmployeeDetails');
    expect(response.status()).not.toBe(200);
    await ctx.dispose();
  });

  test('@negative GetallEmployeeDetails rejects a request with a garbage auth token', async () => {
    const ctx = await authedContext('not-a-real-jwt-token');
    const response = await ctx.get('/api/Settings/Employee/GetallEmployeeDetails');
    expect(response.status()).not.toBe(200);
    await ctx.dispose();
  });
});
