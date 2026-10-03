// pages/PaymentPage.js
//
// The /payment page: card details form shown during checkout.
// All inputs use data-qa attributes with hyphenated names
// (verified live 2026-10-03).

const BasePage = require('./BasePage');

class PaymentPage extends BasePage {
  constructor(page) {
    super(page);
    this.nameOnCard = page.locator('[data-qa="name-on-card"]');
    this.cardNumber = page.locator('[data-qa="card-number"]');
    this.cvc = page.locator('[data-qa="cvc"]');
    this.expiryMonth = page.locator('[data-qa="expiry-month"]');
    this.expiryYear = page.locator('[data-qa="expiry-year"]');
    this.payButton = page.locator('[data-qa="pay-button"]');
  }

  // Fills the card form with test data and submits the payment.
  async payWithTestCard(nameOnCard) {
    await this.nameOnCard.fill(nameOnCard);
    await this.cardNumber.fill('4111111111111111');
    await this.cvc.fill('123');
    await this.expiryMonth.fill('12');
    await this.expiryYear.fill('2030');
    await this.payButton.click();
  }
}

module.exports = PaymentPage;