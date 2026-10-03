// tests/ui/signup.spec.js
//
// Full UI registration flow:
//   login page -> enter name/email -> account information form
//   -> "Account Created!" -> logged in header
//
// Cleanup: the account is deleted through the API at the end of the
// test, so no test user is left behind on the live site.
// The site blocks non-browser form POSTs (403), so this flow can only
// be exercised with a real browser - which is what this test does.

const { test, expect } = require('@playwright/test');
const { generateTestUser } = require('../../utils/testData');
const usersApi = require('../../api/usersApi');
const LoginPage = require('../../pages/LoginPage');
const SignupPage = require('../../pages/SignupPage');

test('register a new customer through the UI and delete the account afterwards', async ({ page, request }) => {
  const user = generateTestUser();

  // Step 1: start signup from the login page with a unique email.
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.startSignup(user.name, user.email);

  // Step 2: fill the account information form and submit.
  const signupPage = new SignupPage(page);
  await signupPage.accountInfoHeading.waitFor();
  await signupPage.fillAccountInformation(user);

  // Step 3: account creation is confirmed.
  await expect(signupPage.accountCreatedHeading).toBeVisible();

  // Step 4: the header shows "Logged in as <name>".
  await signupPage.continueAfterCreation();
  await expect(loginPage.loggedInAs(user.name)).toBeVisible();

  // Step 5 (Phase 2 consistency): the UI just changed backend state by
  // creating this account - verify through the API that the backend
  // record matches exactly what the UI submitted.
  const detailResponse = await usersApi.getUserDetailByEmail(request, user.email);
  expect(detailResponse.body.responseCode).toBe(200);

  const backendUser = detailResponse.body.user;
  expect(backendUser.name).toBe(user.name);
  expect(backendUser.email).toBe(user.email);
  expect(backendUser.first_name).toBe(user.firstname);
  expect(backendUser.last_name).toBe(user.lastname);
  expect(backendUser.address1).toBe(user.address1);
  expect(backendUser.city).toBe(user.city);
  expect(backendUser.state).toBe(user.state);
  expect(backendUser.zipcode).toBe(user.zipcode);

  // Cleanup: delete the account so no test user remains.
  // Deletion goes through the API - deterministic in every browser.
  // (In WebKit, the header "Delete Account" link click did not
  // reliably navigate on this site - verified during Phase 1.)
  const deleteResponse = await usersApi.deleteUser(request, user.email, user.password);
  expect(deleteResponse.body.responseCode).toBe(200);
  expect(deleteResponse.body.message).toBe('Account deleted!');

  // The customer is really gone.
  const afterDelete = await usersApi.getUserDetailByEmail(request, user.email);
  expect(afterDelete.body.responseCode).toBe(404);
});