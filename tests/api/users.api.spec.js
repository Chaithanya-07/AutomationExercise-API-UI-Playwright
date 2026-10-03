// tests/api/users.api.spec.js
//
// Customer lifecycle through the API:
//   create -> verify -> get details -> verify data -> delete -> verify gone
//
// This test manages the customer explicitly (instead of using the
// createdUser fixture) because the create/delete calls ARE the scenario
// being tested here.

const { test, expect } = require('@playwright/test');
const { generateTestUser } = require('../../utils/testData');
const usersApi = require('../../api/usersApi');

test('full customer lifecycle: create, read, delete', async ({ request }) => {
  const user = generateTestUser();

  // 1. Create a unique test customer.
  const createResponse = await usersApi.createUser(request, user);
  expect(createResponse.status).toBe(200);
  expect(createResponse.body.responseCode).toBe(201);
  expect(createResponse.body.message).toBe('User created!');

  try {
    // 2. Get the customer's details by email.
    const detailResponse = await usersApi.getUserDetailByEmail(request, user.email);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.responseCode).toBe(200);

    // 3. The returned data matches what we sent.
    const returnedUser = detailResponse.body.user;
    expect(returnedUser.name).toBe(user.name);
    expect(returnedUser.email).toBe(user.email);
    expect(returnedUser.first_name).toBe(user.firstname);
    expect(returnedUser.last_name).toBe(user.lastname);
    expect(returnedUser.city).toBe(user.city);
    expect(returnedUser.state).toBe(user.state);
    expect(returnedUser.zipcode).toBe(user.zipcode);
  } finally {
    // 4. Cleanup: delete the test customer so none are left behind.
    //    A failed cleanup must not be silently ignored.
    const deleteResponse = await usersApi.deleteUser(request, user.email, user.password);

    if (deleteResponse.body.responseCode !== 200) {
      throw new Error(
        `Cleanup failed for ${user.email}: ` +
        `HTTP ${deleteResponse.status} ${JSON.stringify(deleteResponse.body)}`
      );
    }
    expect(deleteResponse.body.message).toBe('Account deleted!');

    // 5. The customer is really gone.
    const afterDelete = await usersApi.getUserDetailByEmail(request, user.email);
    expect(afterDelete.body.responseCode).toBe(404);
  }
});

test('getting details for a non-existent email returns account not found', async ({ request }) => {
  const { status, body } = await usersApi.getUserDetailByEmail(
    request,
    'no_such_user@example.com'
  );

  expect(status).toBe(200);
  expect(body.responseCode).toBe(404);
  expect(body.message).toContain('Account not found');
});