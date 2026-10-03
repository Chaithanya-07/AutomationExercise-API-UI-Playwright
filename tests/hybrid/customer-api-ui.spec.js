// tests/hybrid/customer-api-ui.spec.js
//
// THE core Project 2 scenario - the same business flow validated
// across API and UI layers with one Playwright framework:
//
//   API create customer
//   -> API verify backend state
//   -> UI login with the same customer
//   -> UI verify "Logged in as <name>"
//   -> API verify backend still matches the data the UI displayed
//   -> UI logout
//   -> API delete customer (cleanup, done by the createdUser fixture)
//
// No hard-coded existing account is used: the `createdUser` fixture
// generates a unique customer (utils/testData.js), creates it through
// the API before the test and deletes it afterwards.

const { test, expect } = require('../../fixtures/api.fixture');
const usersApi = require('../../api/usersApi');
const LoginPage = require('../../pages/LoginPage');

test('customer created via API can log in via UI and matches backend state', async ({ page, request, createdUser }) => {
  // --- API layer: verify the backend state right after creation ---
  const detailResponse = await usersApi.getUserDetailByEmail(request, createdUser.email);
  expect(detailResponse.body.responseCode).toBe(200);

  const backendUser = detailResponse.body.user;
  expect(backendUser.email).toBe(createdUser.email);
  expect(backendUser.name).toBe(createdUser.name);

  // --- UI layer: the same customer logs in through the browser ---
  const loginPage = new LoginPage(page);
  await loginPage.open();

  await loginPage.login(createdUser.email, createdUser.password);

  // UI shows "Logged in as <name>" - capture what the UI displays.
  const loggedInHeader = loginPage.loggedInAs(createdUser.name);
  await expect(loggedInHeader).toBeVisible();
  const displayedName = (await loggedInHeader.textContent())
    .replace('Logged in as', '')
    .trim();

  // --- Consistency: UI value == test data == backend value ---
  expect(displayedName).toBe(createdUser.name);
  expect(backendUser.name).toBe(displayedName);

  // --- UI layer: log out ---
  await loginPage.logout();
  await expect(loginPage.loginHeading).toBeVisible();

  // --- API layer: cleanup ---
  // The createdUser fixture deletes the customer after the test
  // (create -> test -> delete, per the project cleanup rules).
});