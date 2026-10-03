// pages/CartPage.js
//
// The /view_cart page: table of cart items plus the
// "Proceed To Checkout" button.

const BasePage = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page);

    // One row per cart item. The site does not expose a stable table
    // id on this page, so the selector is the union of the two ids
    // the live page has served (verified live 2026-10-03).
    this.productRows = page.locator(
      '#cart_info_table tbody tr, #cart_info tbody tr'
    );

    // "Proceed To Checkout" link. Scoped by text because the
    // check_out class also appears on hidden duplicate links.
    this.proceedToCheckoutButton = page.locator('a.check_out', {
      hasText: 'Proceed To Checkout',
    });
  }

  async open() {
    await super.goto('/view_cart');
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }
}

module.exports = CartPage;