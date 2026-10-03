// pages/HomePage.js
//
// Locators for the automationexercise.com home page.

const BasePage = require('./BasePage');

class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/';

    // The carousel at the top of the home page - a simple
    // "did the page actually load" indicator.
    this.slider = page.locator('#slider');

    // "Features Items" - the main product listing section.
    this.featuresHeading = page.getByText('Features Items');

    // Main navigation bar (Home / Products / Cart / ...).
    this.navigation = page.locator('ul.navbar-nav');

    // Footer subscription box.
    this.subscriptionHeading = page.getByText('Subscription');
  }

  async open() {
    await super.goto(this.url);
  }
}

module.exports = HomePage;