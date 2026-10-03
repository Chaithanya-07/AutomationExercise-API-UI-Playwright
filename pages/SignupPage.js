// pages/SignupPage.js
//
// The account information form reached after submitting name + email
// on the login page ("ENTER ACCOUNT INFORMATION").
//
// NOTE: curl-based probing of this form is blocked by the site (403 for
// non-browser POSTs), so these selectors are exercised with a real
// browser in tests/ui/signup.spec.js.

const BasePage = require('./BasePage');

class SignupPage extends BasePage {
  constructor(page) {
    super(page);

    this.accountInfoHeading = page.getByText('Enter Account Information');

    // Title radio buttons: id_gender1 = Mr, id_gender2 = Mrs.
    this.titleMr = page.locator('#id_gender1');
    this.titleMrs = page.locator('#id_gender2');

    this.password = page.locator('[data-qa="password"]');

    // Date of birth dropdowns.
    this.birthDay = page.locator('[data-qa="days"]');
    this.birthMonth = page.locator('[data-qa="months"]');
    this.birthYear = page.locator('[data-qa="years"]');

    this.newsletter = page.locator('#newsletter');

    // Address information.
    this.firstName = page.locator('[data-qa="first_name"]');
    this.lastName = page.locator('[data-qa="last_name"]');
    this.company = page.locator('[data-qa="company"]');
    this.address = page.locator('[data-qa="address"]');
    this.address2 = page.locator('[data-qa="address2"]');
    this.country = page.locator('[data-qa="country"]');
    this.state = page.locator('[data-qa="state"]');
    this.city = page.locator('[data-qa="city"]');
    this.zipcode = page.locator('[data-qa="zipcode"]');
    this.mobileNumber = page.locator('[data-qa="mobile_number"]');

    this.createAccountButton = page.locator('[data-qa="create-account"]');

    // Account created confirmation page.
    this.accountCreatedHeading = page.getByText('Account Created!');
    this.continueButton = page.locator('[data-qa="continue-button"]');
  }

  /**
   * Fill the account information form and submit it.
   * `user` is the object produced by utils/testData.js generateTestUser().
   */
  async fillAccountInformation(user) {
    if (user.title === 'Mrs') {
      await this.titleMrs.check();
    } else {
      await this.titleMr.check();
    }

    await this.password.fill(user.password);

    await this.birthDay.selectOption(user.birth_date);
    await this.birthMonth.selectOption(user.birth_month);
    await this.birthYear.selectOption(user.birth_year);

    await this.newsletter.check();

    await this.firstName.fill(user.firstname);
    await this.lastName.fill(user.lastname);
    await this.company.fill(user.company);
    await this.address.fill(user.address1);
    await this.address2.fill(user.address2);
    await this.country.selectOption(user.country);
    await this.state.fill(user.state);
    await this.city.fill(user.city);
    await this.zipcode.fill(user.zipcode);
    await this.mobileNumber.fill(user.mobile_number);

    await this.createAccountButton.click();
  }

  /**
   * On the "Account Created!" page: click Continue, which returns to
   * the home page with the customer logged in.
   */
  async continueAfterCreation() {
    await this.continueButton.click();
  }
}

module.exports = SignupPage;