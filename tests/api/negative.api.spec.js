// tests/api/negative.api.spec.js
//
// Phase 2 - negative and boundary coverage.
//
// Every expected responseCode and message below was VERIFIED against the
// live API before being written here (2026-10-03) - nothing is invented.
//
// Verified behaviors:
// - createAccount without password        -> 400 "...password parameter is missing..."
// - createAccount with a duplicate email   -> 400 "Email already exists!"
// - createAccount with a malformed email   -> ACCEPTED (the API performs NO
//   email format validation; documented as the honest boundary behavior)
// - verifyLogin, existing email + WRONG password -> 404 "User not found!"
//   (the API does not distinguish wrong password from unknown email)
// - getUserDetailByEmail without email     -> 400 "...email parameter is missing..."
// - searchProduct with a no-match term     -> 200 with products: []
// - GET /api/searchProduct (wrong method)  -> 405 "This request method is not supported."
// - POST /api/productsList (wrong method)  -> 405 "This request method is not supported."
// - updateAccount on a non-existent email  -> 404 "Account not found!"

const { test, expect } = require('../../fixtures/api.fixture');
const { generateTestUser } = require('../../utils/testData');
const usersApi = require('../../api/usersApi');
const productsApi = require('../../api/productsApi');
const authApi = require('../../api/authApi');
const { expectApiError, expectApiSuccess } = require('../../utils/apiValidation');

test('createAccount without password is rejected', async ({ request }) => {
  const user = generateTestUser();
  const { password, ...userWithoutPassword } = user;

  const response = await usersApi.createUser(request, userWithoutPassword);
  expectApiError(response, 400);
  expect(response.body.message).toContain('password parameter is missing');
});

test('createAccount with an already-registered email is rejected', async ({ request, createdUser }) => {
  // The `createdUser` fixture guarantees a real, existing email.
  const duplicateAttempt = generateTestUser();
  duplicateAttempt.email = createdUser.email;

  const response = await usersApi.createUser(request, duplicateAttempt);
  expectApiError(response, 400);
  expect(response.body.message).toBe('Email already exists!');
});

test('verifyLogin with the wrong password for an existing customer returns user not found', async ({ request, createdUser }) => {
  // Verified live: the API gives the same answer for a wrong password as
  // for an unknown email - it does not distinguish the two cases.
  const response = await authApi.verifyLogin(request, createdUser.email, 'WrongPass123');

  expectApiError(response, 404);
  expect(response.body.message).toBe('User not found!');
});

test('getUserDetailByEmail without the email parameter is rejected', async ({ request }) => {
  const response = await usersApi.getUserDetailByEmail(request, undefined);
  expectApiError(response, 400);
  expect(response.body.message).toContain('email parameter is missing');
});

test('createAccount performs no email format validation (malformed email accepted)', async ({ request }) => {
  // Verified live: a clearly malformed email is ACCEPTED (201) - the API
  // only checks uniqueness, never the format. Documented as the honest
  // boundary behavior instead of pretending a rejection exists.
  const user = generateTestUser();
  user.email = `qa_malformed_${Date.now()}@`; // no domain part

  const response = await usersApi.createUser(request, user);
  expectApiSuccess(response, 201);

  // Cleanup: the malformed-email account must be removed too.
  const cleanup = await usersApi.deleteUser(request, user.email, user.password);
  expect(cleanup.body.responseCode).toBe(200);
});

test('searching a term that matches nothing returns an empty product list', async ({ request }) => {
  const response = await productsApi.searchProducts(request, 'zzzqxnoqsuchproduct');
  expectApiSuccess(response, 200);
  expect(response.body.products).toEqual([]);
});

test('GET on the search endpoint is not supported', async ({ request }) => {
  const response = await productsApi.searchProductsViaGet(request);
  expectApiError(response, 405);
  expect(response.body.message).toBe('This request method is not supported.');
});

test('POST on the products list endpoint is not supported', async ({ request }) => {
  const response = await productsApi.getAllProductsViaPost(request);
  expectApiError(response, 405);
  expect(response.body.message).toBe('This request method is not supported.');
});

test('updateAccount on a non-existent customer returns account not found', async ({ request }) => {
  const response = await usersApi.updateUser(request, {
    email: 'no_such_user_qa999@example.com',
    password: 'SomePass123',
    name: 'Ghost User',
  });
  expectApiError(response, 404);
  expect(response.body.message).toBe('Account not found!');
});