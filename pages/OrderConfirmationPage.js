// pages/OrderConfirmationPage.js
//
// The page shown after a successful payment: an "Order Placed!"
// confirmation and a link to download the invoice. The invoice id
// is assigned dynamically by the site per order.

const BasePage = require('./BasePage');

class OrderConfirmationPage extends BasePage {
  constructor(page) {
    super(page);
    this.orderPlacedHeading = page.locator('b', { hasText: 'Order Placed' });
    this.invoiceLink = page.locator('a[href*="download_invoice"]');
  }
}

module.exports = OrderConfirmationPage;