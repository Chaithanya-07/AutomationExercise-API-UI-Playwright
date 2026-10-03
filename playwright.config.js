// playwright.config.js
//
// Project 2 - Automation Exercise (https://automationexercise.com)
// One Playwright framework covering API, UI and hybrid tests.
//
// Phase 1 deliberately keeps this simple: three browsers, list +
// HTML reporter, no cross-browser parallel tuning yet.

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,          // the live site can be slow
  fullyParallel: false,        // keep runs predictable against a live site
  retries: 0,                  // report honest first-run results
  workers: 2,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: 'https://automationexercise.com',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // The live site is slow - give assertions room before failing.
  expect: { timeout: 10 * 1000 },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});