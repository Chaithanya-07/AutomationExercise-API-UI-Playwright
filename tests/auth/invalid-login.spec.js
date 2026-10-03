// tests/auth/invalid-login.spec.js
//
// Phase 3 section B: invalid authentication.
//
// Behavior verified live (2026-10-03):
// - The login form uses HTML5 validation (type="email" + required),
//   so empty fields and malformed email formats are blocked by the
//   BROWSER - the form is never submitted and no server error appears.
// - Well-formed credentials that simply don't match an account are
//   submitted and answered by the SERVER with the red message
//   "Your email or password is incorrect!".
//
// Both layers are asserted: the expected feedback appears AND the
// user never reaches an authenticated state.

const { test, expect } = require('../../fixtures/api.fixture');
const LoginPage = require('../../pages/LoginPage');
const HomePage = require('../../pages/HomePage');

test('empty login fields are blocked by browser validation and never submitted', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.loginButton.click();

  // The browser blocks the submit: the required inputs are :invalid
  // (standard CSS pseudo-class, supported by all three engines).
  await expect(page.locator('[data-qa="login-email"]:invalid')).toHaveCount(1);
  await expect(page.locator('[data-qa="login-password"]:invalid')).toHaveCount(1);

  // Nothing was submitted: no server error, still on the login page.
  await expect(loginPage.loginError).toHaveCount(0);
  expect(page.url()).toContain('/login');
});

test('a malformed email format is blocked by browser validation and never submitted', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login('not-an-email-address', 'Test@1234');

  // type="email" rejects the format client-side.
  await expect(page.locator('[data-qa="login-email"]:invalid')).toHaveCount(1);

  // Nothing was submitted: no server error, still on the login page.
  await expect(loginPage.loginError).toHaveCount(0);
  expect(page.url()).toContain('/login');
});

test('a well-formed but unknown email with a known password is rejected by the server', async ({
  page,
  createdUser,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  // Well-formed email that does not exist; the password belongs to
  // the created customer, proving email and password must BOTH match.
  await loginPage.login('no_such_user_' + Date.now() + '@example.com', createdUser.password);

  // Server-side rejection with the site's actual error message.
  await expect(loginPage.loginError).toBeVisible();

  // And the user did NOT reach an authenticated state.
  const home = new HomePage(page);
  await expect(home.loggedInAs(createdUser.name)).toHaveCount(0);
  await expect(home.signupLoginLink).toBeVisible();
});

test('a known email with an invalid password is rejected by the server', async ({
  page,
  createdUser,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(createdUser.email, 'WrongPass123!');

  // Server-side rejection with the site's actual error message.
  await expect(loginPage.loginError).toBeVisible();

  // And the user did NOT reach an authenticated state.
  const home = new HomePage(page);
  await expect(home.loggedInAs(createdUser.name)).toHaveCount(0);
  await expect(home.signupLoginLink).toBeVisible();
});