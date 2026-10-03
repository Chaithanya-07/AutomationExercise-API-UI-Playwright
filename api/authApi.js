// api/authApi.js
//
// Service layer for authentication endpoints on automationexercise.com.
//
// IMPORTANT (verified against the live API):
// - Requests are form-urlencoded, NOT JSON. A JSON body is rejected
//   as "missing parameters".
// - The HTTP status is 200 even for business failures; the real result
//   is in the JSON body field `responseCode` (200 / 400 / 404 ...).
//
// Every method returns { status, body } so tests can assert on both.

const API = '/api';

/**
 * POST /api/verifyLogin
 * Verifies whether a customer exists with the given email/password.
 * Call without arguments (or with only one) for the negative "missing
 * parameter" scenario - the form is only filled with what was provided.
 */
async function verifyLogin(request, email, password) {
  const form = {};
  if (email !== undefined) form.email = email;
  if (password !== undefined) form.password = password;

  const response = await request.post(`${API}/verifyLogin`, { form });
  return { status: response.status(), body: await response.json() };
}

module.exports = { verifyLogin };