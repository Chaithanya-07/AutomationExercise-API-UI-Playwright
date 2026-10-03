// tests/ui/home.spec.js
//
// Verify the AUT loads and the main page structure is present.

const { test, expect } = require('@playwright/test');
const HomePage = require('../../pages/HomePage');

test('home page loads with main navigation and product section', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  // The site's page title.
  await expect(page).toHaveTitle(/Automation Exercise/);

  // Header carousel, main navigation and product listing are visible.
  await expect(home.slider).toBeVisible();
  await expect(home.navigation).toBeVisible();
  await expect(home.featuresHeading).toBeVisible();

  // Footer subscription box.
  await expect(home.subscriptionHeading).toBeVisible();
});