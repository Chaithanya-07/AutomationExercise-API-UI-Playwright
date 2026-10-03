// pages/LoginPage.js
//
// The /login page has TWO forms:
// 1. "Login to your account"    - existing customers (email + password)
// 2. "New User Signup!"         - starts registration for a new customer
//
// Selectors use the site's data-qa attributes, which are stable.

const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/login';

    // --- "Login to your account" form ---
    this.loginHeading = page.getByText('Login to your account');
    this.loginEmail = page.locator('[data-qa="login-email"]');
    this.loginPassword = page.locator('[data-qa="login-password"]');
    this.loginButton = page.locator('[data-qa="login-button"]');

    // Red error message shown for wrong credentials.
    this.loginError = page.getByText('Your email or password is incorrect!');

    // --- "New User Signup!" form ---
    this.signupHeading = page.getByText('New User Signup!');
    this.signupName = page.locator('[data-qa="signup-name"]');
    this.signupEmail = page.locator('[data-qa="signup-email"]');
    this.signupButton = page.locator('[data-qa="signup-button"]');
  }

  async open() {
    await super.goto(this.url);
  }

  /**
   * Log in with an existing customer's credentials.
   * On success the site redirects to the home page with a
   * "Logged in as <name>" header.
   */
  async login(email, password) {
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginButton.click();
  }

  /**
   * Step 1 of UI registration: submit name + email, which takes the
   * customer to the account information form (pages/SignupPage.js).
   */
  async startSignup(name, email) {
    await this.signupName.fill(name);
    await this.signupEmail.fill(email);
    await this.signupButton.click();
  }
}

module.exports = LoginPage;