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

const { test: base, expect } = require('@playwright/test');
const { generateTestUser } = require('../utils/testData');
const usersApi = require('../api/usersApi');

const test = base.extend({
  createdUser: async ({ request }, use) => {
    // 1. Generate a unique customer and create it through the API.
    const user = generateTestUser();
    const createResponse = await usersApi.createUser(request, user);

    // Fail fast if setup is broken - the test cannot run without a customer.
    expect(createResponse.body.responseCode).toBe(201);

    // 2. Hand the customer to the test.
    await use(user);

    // 3. Cleanup: delete the customer so no test users accumulate on the site.
    //    Per project rules, a failed cleanup must not be silently ignored.
    const deleteResponse = await usersApi.deleteUser(request, user.email, user.password);
    if (deleteResponse.body.responseCode !== 200) {
      console.error(
        `CLEANUP FAILED for ${user.email}: ` +
        `HTTP ${deleteResponse.status} ${JSON.stringify(deleteResponse.body)}`
      );
    }
  },
});

module.exports = { test, expect };