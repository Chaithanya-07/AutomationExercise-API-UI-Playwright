// tests/ui/login.spec.js
//
// Login scenarios:
// - invalid credentials -> red error message
// - valid credentials   -> "Logged in as <name>" header
//
// The valid-login test does NOT use a hard-coded account. It takes an
// API-created customer from the `createdUser` fixture (created before
// the test, deleted after it) - a small API -> UI hybrid in itself.

const { test, expect } = require('../../fixtures/api.fixture');
const LoginPage = require('../../pages/LoginPage');

test('login with invalid credentials shows an error', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();

  await loginPage.login('no_such_user@example.com', 'WrongPass123');

  await expect(loginPage.loginError).toBeVisible();
});

test('login with valid API-created customer succeeds and can log out', async ({ page, createdUser }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();

  await loginPage.login(createdUser.email, createdUser.password);

  // Header shows "Logged in as <signup name>".
  await expect(loginPage.loggedInAs(createdUser.name)).toBeVisible();

  // Logging out returns to the login page.
  await loginPage.logout();
  await expect(loginPage.loginHeading).toBeVisible();
});