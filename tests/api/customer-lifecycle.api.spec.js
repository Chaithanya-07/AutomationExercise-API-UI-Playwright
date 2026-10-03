// tests/api/customer-lifecycle.api.spec.js
//
// Phase 2 - API chaining: the full customer lifecycle as ONE chain,
// asserting the state transition after every step:
//
//   create -> read -> update selected fields -> read again
//   -> verify changed AND preserved fields -> delete -> read (not found)
//
// Verified live contracts this chain relies on (2026-10-03):
// - updateAccount is a PARTIAL update: only fields present in the form
//   change; everything else keeps its previous value.
// - deleteAccount needs the DELETE method with a form body.

const { test, expect } = require('@playwright/test');
const { generateTestUser } = require('../../utils/testData');
const usersApi = require('../../api/usersApi');
const {
  expectApiSuccess,
  expectApiError,
  expectUserShape,
} = require('../../utils/apiValidation');

test('customer lifecycle chain: create -> read -> update -> read -> delete -> not found', async ({ request }) => {
  const user = generateTestUser();

  // Selected fields to change in the update step.
  const newName = `QA Renamed ${user.name.slice(-5)}`;
  const newCity = 'Mumbai';

  let deleted = false;

  // 1. CREATE - customer goes from "does not exist" to "exists".
  const createResponse = await usersApi.createUser(request, user);
  expectApiSuccess(createResponse, 201);
  expect(createResponse.body.message).toBe('User created!');

  try {
    // 2. READ - backend state matches the data we sent.
    const readResponse = await usersApi.getUserDetailByEmail(request, user.email);
    expectApiSuccess(readResponse);
    expectUserShape(readResponse.body.user);
    expect(readResponse.body.user.name).toBe(user.name);
    expect(readResponse.body.user.city).toBe(user.city);
    expect(readResponse.body.user.email).toBe(user.email);

    // 3. UPDATE selected fields only (name + city).
    const updateResponse = await usersApi.updateUser(request, {
      email: user.email,
      password: user.password, // identifies the account
      name: newName,
      city: newCity,
    });
    expectApiSuccess(updateResponse);
    expect(updateResponse.body.message).toBe('User updated!');

    // 4. READ again - the changed fields changed...
    const reReadResponse = await usersApi.getUserDetailByEmail(request, user.email);
    expectApiSuccess(reReadResponse);
    expect(reReadResponse.body.user.name).toBe(newName);
    expect(reReadResponse.body.user.city).toBe(newCity);
    // ...and the untouched fields kept their values (partial update).
    expect(reReadResponse.body.user.email).toBe(user.email);
    expect(reReadResponse.body.user.first_name).toBe(user.firstname);
    expect(reReadResponse.body.user.last_name).toBe(user.lastname);
    expect(reReadResponse.body.user.state).toBe(user.state);
    expect(reReadResponse.body.user.zipcode).toBe(user.zipcode);

    // 5. DELETE - customer goes from "exists" to "not exists".
    const deleteResponse = await usersApi.deleteUser(request, user.email, user.password);
    expectApiSuccess(deleteResponse);
    expect(deleteResponse.body.message).toBe('Account deleted!');
    deleted = true;

    // 6. READ - the customer is really gone.
    const afterDeleteResponse = await usersApi.getUserDetailByEmail(request, user.email);
    expectApiError(afterDeleteResponse, 404);
  } finally {
    // Cleanup guarantee: if any step failed mid-chain, still remove the
    // customer so no test user is left behind. Never silent on failure.
    if (!deleted) {
      const cleanup = await usersApi.deleteUser(request, user.email, user.password);
      if (cleanup.body.responseCode !== 200) {
        console.error(
          `CLEANUP FAILED for ${user.email}: ` +
          `HTTP ${cleanup.status} ${JSON.stringify(cleanup.body)}`
        );
      }
    }
  }
});