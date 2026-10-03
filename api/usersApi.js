// api/usersApi.js
//
// Service layer for customer (user) endpoints on automationexercise.com.
//
// Verified against the live API (2026-10-03):
// - createAccount: POST, form-urlencoded with all account + address fields.
// - getUserDetailByEmail: GET with `email` as a query parameter.
// - updateAccount: PUT, form-urlencoded.
// - deleteAccount: DELETE method with a form-urlencoded BODY
//   (email + password). POST is not allowed here - the server answers
//   HTTP 405. This is unusual but confirmed on the live system.
// - HTTP status is 200 even for business failures; assert on
//   body.responseCode instead.

const API = '/api';

/**
 * POST /api/createAccount - registers a new customer.
 * `user` is the object produced by utils/testData.js generateTestUser().
 */
async function createUser(request, user) {
  const response = await request.post(`${API}/createAccount`, { form: user });
  return { status: response.status(), body: await response.json() };
}

/**
 * GET /api/getUserDetailByEmail - fetches customer details by email.
 */
async function getUserDetailByEmail(request, email) {
  const response = await request.get(`${API}/getUserDetailByEmail`, {
    params: { email },
  });
  return { status: response.status(), body: await response.json() };
}

/**
 * PUT /api/updateAccount - updates an existing customer.
 * The form must contain email + password (to identify the account)
 * plus the fields to change.
 */
async function updateUser(request, user) {
  const response = await request.put(`${API}/updateAccount`, { form: user });
  return { status: response.status(), body: await response.json() };
}

/**
 * DELETE /api/deleteAccount - deletes a customer.
 * Verified contract: DELETE method + form body with email and password.
 */
async function deleteUser(request, email, password) {
  const response = await request.delete(`${API}/deleteAccount`, {
    form: { email, password },
  });
  return { status: response.status(), body: await response.json() };
}

module.exports = { createUser, getUserDetailByEmail, updateUser, deleteUser };