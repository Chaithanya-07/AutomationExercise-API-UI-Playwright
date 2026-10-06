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
//   5. deletes the customer afterwards (explicit failure on cleanup
//      problems - a cleanup failure fails the test, never silently)
//
// Setup and cleanup are wrapped in try/finally: if the UI login or
// the state capture fails BEFORE use(), the login context is still
// closed and the API-created customer is still deleted. The customer
// never survives a broken setup, and no browser context leaks.
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
    const user = generateTestUser();
    // The create request completed: from here on, treat the account as
    // existing so cleanup always attempts the delete - even if the 201
    // assertion below fails.
    let customerCreated = false;
    let loginContext = null;
    // Set when setup or the test body itself failed, so a cleanup
    // problem is logged WITHOUT masking the original error.
    let priorFailure = null;

    try {
      // 1. Unique customer through the API.
      const created = await usersApi.createUser(request, user);
      customerCreated = true;
      expect(created.body.responseCode).toBe(201);

      // 2. ONE UI login establishes the authenticated session.
      loginContext = await browser.newContext();
      const loginPage = new LoginPage(await loginContext.newPage());
      await loginPage.open();
      await loginPage.login(user.email, user.password);
      await expect(loginPage.loggedInAs(user.name)).toBeVisible();

      // 3. Capture the authenticated state (session cookie) and close.
      const state = await loginContext.storageState();
      await loginContext.close();
      loginContext = null;

      // 4. Provide customer + saved state to the test.
      await use({ user, state });
    } catch (error) {
      priorFailure = error;
      throw error;
    } finally {
      // Always close the login context, including when setup failed
      // mid-login or the state capture threw before the close above.
      if (loginContext) {
        await loginContext.close().catch((closeError) => {
          console.error(
            `CLEANUP WARNING: login context for ${user.email} failed to close: ` +
            `${closeError.message}`
          );
        });
      }

      // 5. Always delete the customer - also when setup failed after the
      //    account was created. Its server session dies with it.
      if (customerCreated) {
        let cleanupFailure = null;
        try {
          const deleted = await usersApi.deleteUser(request, user.email, user.password);
          if (deleted.body.responseCode !== 200) {
            cleanupFailure =
              `CLEANUP FAILED for ${user.email}: customer was not deleted - ` +
              `HTTP ${deleted.status} ${JSON.stringify(deleted.body)}`;
          }
        } catch (deleteError) {
          cleanupFailure =
            `CLEANUP FAILED for ${user.email}: delete request threw ` +
            `${deleteError.message}`;
        }
        if (cleanupFailure) {
          console.error(cleanupFailure);
          // Explicit cleanup failure: the test cannot pass while its
          // customer survives on the site. But if the setup/test body
          // already failed, keep the original error - never mask it.
          if (!priorFailure) throw new Error(cleanupFailure);
        }
      }
    }
  },
});

module.exports = { test, expect };
