// pages/BasePage.js
//
// Shared parent for all page objects. Holds the page and offers
// navigation plus header helpers that apply to every page
// (the header changes when a customer is logged in).

class BasePage {
  constructor(page) {
    this.page = page;
  }

  // All navigations use domcontentloaded - the site pulls heavy ad
  // scripts, so waiting for the full "load" event can exceed 30s.
  async goto(path) {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  // --- Logged-in header helpers (shared across pages) ---

  // Header shows: "Logged in as <name>" once a customer is logged in.
  loggedInAs(name) {
    return this.page.locator(`a:has-text("Logged in as ${name}")`);
  }

  async logout() {
    await this.page.click('a[href="/logout"]');
  }
}

module.exports = BasePage;