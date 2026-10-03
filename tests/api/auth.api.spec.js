// tests/api/auth.api.spec.js
//
// verifyLogin endpoint: POST /api/verifyLogin, form-urlencoded
// (JSON bodies are rejected as missing parameters - verified live).
//
// The valid-login test uses the `createdUser` fixture, which creates a
// unique customer through the API before the test and deletes it after.

const { test, expect } = require('../../fixtures/api.fixture');
const authApi = require('../../api/authApi');

test('valid credentials verify successfully', async ({ request, createdUser }) => {
  const { status, body } = await authApi.verifyLogin(request, createdUser.email, createdUser.password);

  expect(status).toBe(200);
  expect(body.responseCode).toBe(200);
  expect(body.message).toBe('User exists!');
});

test('invalid credentials are rejected with user not found', async ({ request }) => {
  const { status, body } = await authApi.verifyLogin(
    request,
    'no_such_user@example.com',
    'WrongPass123'
  );

  expect(status).toBe(200); // HTTP stays 200; business status is in the body
  expect(body.responseCode).toBe(404);
  expect(body.message).toBe('User not found!');
});

test('missing email parameter is rejected', async ({ request }) => {
  const { status, body } = await authApi.verifyLogin(request, undefined, 'SomePass123');

  expect(status).toBe(200);
  expect(body.responseCode).toBe(400);
  expect(body.message).toContain('email or password parameter is missing');
});