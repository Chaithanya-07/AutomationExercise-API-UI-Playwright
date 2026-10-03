// tests/auth/storage-state.spec.js
//
// Phase 3 sections A, C and 7: valid authentication, storageState
// reuse and cross-layer validation.
//
// The authState fixture creates a unique API customer, logs in once
// through the UI, and captures the session as a storageState. Each
// test below builds brand-new contexts from that saved state - no
// login UI steps inside the tests themselves.

const { test, expect } = require('../../fixtures/auth.fixture');
const HomePage = require('../../pages/HomePage');
const usersApi = require('../../api/usersApi');

test('a new context created from saved storageState starts authenticated', async ({
  browser,
  request,
  authState,
}) => {
  // Fresh context built from the captured state - no login performed.
  const context = await browser.newContext({ storageState: authState.state });
  const home = new HomePage(await context.newPage());
  await home.open();

  // Meaningful authenticated state, not just a successful navigation:
  // the logged-in indicator and the logout control are both visible.
  await expect(home.loggedInAs(authState.user.name)).toBeVisible();
  await expect(home.logoutLink).toBeVisible();

  // Cross-layer: the backend record for this session's customer
  // still matches the generated test data.
  const detail = await usersApi.getUserDetailByEmail(request, authState.user.email);
  expect(detail.body.responseCode).toBe(200);
  expect(detail.body.user.name).toBe(authState.user.name);

  await context.close();
});

test('logging out invalidates the saved session state server-side', async ({
  browser,
  authState,
}) => {
  // First context from the state logs out - verified live: the
  // sessionid cookie is invalidated on the server, not just locally.
  const ctx1 = await browser.newContext({ storageState: authState.state });
  const p1 = new HomePage(await ctx1.newPage());
  await p1.open();
  await p1.logout();
  await ctx1.close();

  // A second context from the SAME saved state is a guest again.
  const ctx2 = await browser.newContext({ storageState: authState.state });
  const p2 = new HomePage(await ctx2.newPage());
  await p2.open();
  await expect(p2.loggedInAs(authState.user.name)).toHaveCount(0);
  await expect(p2.signupLoginLink).toBeVisible();
  await ctx2.close();
});