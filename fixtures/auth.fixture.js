// fixtures/auth.fixture.js
//
// Phase 3: authenticated browser state via Playwright storageState.
//
// What it does for EACH test (fully isolated - no shared users, no
// test-order dependencies):
//   1. creates a unique customer through the API
//   2. performs ONE UI login to establish the authenticated session
//   3. captures the session as a Playwright storageState
//   4. hands { user, state } to the test
//   5. deletes the customer afterwards (loud on cleanup failure)
//
// Tests build fresh contexts from `state` - no repeated login UI steps,
// while every test still owns its own customer and data.
//
// Verified live (2026-10-03): the session is a server-side `sessionid`
// cookie (httpOnly); a new context created from the saved state starts
// authenticated, and logging out invalidates the state server-side.

const { test: base, expect } = require('@playwright/test');
const { generateTestUser } = require('../utils/testData');
const usersApi = require('../api/usersApi');
const LoginPage = require('../pages/LoginPage');

const test = base.extend({
  authState: async ({ browser, request }, use) => {
    // 1. Unique customer through the API.
    const user = generateTestUser();
    const created = await usersApi.createUser(request, user);
    expect(created.body.responseCode).toBe(201);

    // 2. ONE UI login establishes the authenticated session.
    const loginContext = await browser.newContext();
    const loginPage = new LoginPage(await loginContext.newPage());
    await loginPage.open();
    await loginPage.login(user.email, user.password);
    await expect(loginPage.loggedInAs(user.name)).toBeVisible();

    // 3. Capture the authenticated state (session cookie) and close.
    const state = await loginContext.storageState();
    await loginContext.close();

    // 4. Provide customer + saved state to the test.
    await use({ user, state });

    // 5. Cleanup: delete the customer; its server session dies with it.
    const deleted = await usersApi.deleteUser(request, user.email, user.password);
    if (deleted.body.responseCode !== 200) {
      console.error(
        `CLEANUP FAILED for ${user.email}: ` +
        `HTTP ${deleted.status} ${JSON.stringify(deleted.body)}`
      );
    }
  },
});

module.exports = { test, expect };