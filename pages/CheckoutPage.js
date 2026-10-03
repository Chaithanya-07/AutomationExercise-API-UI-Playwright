// pages/CheckoutPage.js
//
// The /checkout page: shows the delivery address block for the
// logged-in customer and the "Place Order" link.

const BasePage = require('./BasePage');

class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);

    // The address block is filled from the authenticated customer's
    // account data - a cross-layer validation point.
    this.deliveryAddress = page.locator('#address_delivery');

    this.placeOrderLink = page.locator('a[href="/payment"]');
  }

  async open() {
    await super.goto('/checkout');
  }

  async placeOrder() {
    await this.placeOrderLink.click();
  }
}

module.exports = CheckoutPage;