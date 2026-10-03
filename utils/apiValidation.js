// utils/apiValidation.js
//
// Lightweight, reusable response validation for the automationexercise.com
// API. Phase 2 addition.
//
// Why: the site returns HTTP 200 for almost everything - the business
// result lives in the JSON body's `responseCode` field (400/404/405...).
// These validators assert that transport-level contract ONCE (HTTP status,
// parsed JSON body, responseCode) so tests can stay focused on business
// assertions. Deliberately NOT a schema-validation framework.

const { expect } = require('@playwright/test');

/**
 * Assert a successful API response with the expected business responseCode.
 */
function expectApiSuccess(response, expectedResponseCode = 200) {
  expect(response.status).toBe(200);
  expect(response.body, 'body should be a parsed JSON object').toBeInstanceOf(Object);
  expect(response.body.responseCode).toBe(expectedResponseCode);
}

/**
 * Assert a business error: the given responseCode plus a readable message.
 * (HTTP status is still 200 on this site for business failures.)
 */
function expectApiError(response, expectedResponseCode) {
  expect(response.status).toBe(200);
  expect(response.body.responseCode).toBe(expectedResponseCode);
  expect(typeof response.body.message).toBe('string');
}

/**
 * Assert a customer record has the required fields with sane types.
 */
function expectUserShape(user) {
  expect(user, 'user should be an object').toBeInstanceOf(Object);

  const requiredFields = [
    'id', 'name', 'email',
    'first_name', 'last_name',
    'address1', 'country', 'state', 'city', 'zipcode',
  ];
  for (const field of requiredFields) {
    expect(user, `user record should have field '${field}'`).toHaveProperty(field);
  }

  expect(typeof user.id).toBe('number');
  expect(String(user.email)).toContain('@');
}

module.exports = { expectApiSuccess, expectApiError, expectUserShape };