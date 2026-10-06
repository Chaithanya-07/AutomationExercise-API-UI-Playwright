// fixtures/api.fixture.js
//
// Extends the base Playwright test with an API-created test customer.
//
// Why: several tests need an existing customer before they can do anything
// meaningful (valid login, hybrid flows). Creating it through the API is
// faster and more stable than creating it through the UI, and the fixture
// guarantees the customer is deleted afterwards so we never leave test
// users behind on the live site.
//
// The fixture only orchestrates: the actual API calls live in the API
// service layer (api/usersApi.js). Tests just ask for a `createdUser`.
//
// Setup and cleanup are wrapped in try/finally. The generated email/password
// are kept locally BEFORE the create request, so cleanup is still attempted
// when createUser() throws AFTER the server may have committed the account
// (timeout, lost response, unparseable body) - otherwise that account would
// be orphaned on the live site with no teardown path.
//
// A cleanup failure fails the test - unless the test/setup already failed,
// in which case it is logged loudly WITHOUT masking the original error.
// A 404 on delete is an acceptable terminal state only when the account was
// never confirmed as created (nothing to clean up).

const { test: base, expect } = require('@playwright/test');
const { generateTestUser } = require('../utils/testData');
const usersApi = require('../api/usersApi');

const test = base.extend({
  createdUser: async ({ request }, use) => {
    // 1. Generate a unique customer. The email/password are held locally
    //    for the whole fixture, so cleanup always has the credentials even
    //    if the create request throws before its response is parsed.
    const user = generateTestUser();

    // The create call is about to be sent: from here on the account may
    // exist on the server even if the call throws, so cleanup is attempted.
    let createAttempted = false;
    // Set only once the server confirms the account (responseCode 201);
    // until then a 404 on delete means "never created" and is acceptable.
    let accountConfirmed = false;
    // Set when setup or the test body already failed, so a cleanup problem
    // is logged WITHOUT masking the original error.
    let priorFailure = null;

    try {
      // 2. Create the customer through the API.
      createAttempted = true;
      const createResponse = await usersApi.createUser(request, user);

      // Fail fast if setup is broken - the test cannot run without a customer.
      expect(createResponse.body.responseCode).toBe(201);
      accountConfirmed = true;

      // 3. Hand the customer to the test.
      await use(user);
    } catch (error) {
      priorFailure = error;
      throw error;
    } finally {
      // 4. Cleanup: always attempt the delete - including when the create
      //    call threw after the server may have committed the account.
      if (createAttempted) {
        let cleanupFailure = null;
        try {
          const deleteResponse = await usersApi.deleteUser(request, user.email, user.password);
          const responseCode = deleteResponse.body.responseCode;
          const deleted = responseCode === 200;
          const neverCreated = responseCode === 404 && !accountConfirmed;
          // A 404 is an acceptable terminal state only when the account was
          // never confirmed as created - there is nothing left to clean up.
          if (!deleted && !neverCreated) {
            cleanupFailure =
              `CLEANUP FAILED for ${user.email}: ` +
              `HTTP ${deleteResponse.status} ${JSON.stringify(deleteResponse.body)}`;
          }
        } catch (deleteError) {
          cleanupFailure =
            `CLEANUP FAILED for ${user.email}: delete request threw ` +
            `${deleteError.message}`;
        }
        if (cleanupFailure) {
          console.error(cleanupFailure);
          // Per project rules a failed cleanup must not be silently ignored:
          // fail the test/setup. But if the test body already failed, keep
          // the original error - never mask it.
          if (!priorFailure) throw new Error(cleanupFailure);
        }
      }
    }
  },
});

module.exports = { test, expect };