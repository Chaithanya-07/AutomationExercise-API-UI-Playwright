// pages/ProductDetailsPage.js
//
// The /product_details/{id} page: name, category, price and availability
// are shown in the ".product-information" block.

const BasePage = require('./BasePage');

class ProductDetailsPage extends BasePage {
  constructor(page) {
    super(page);

    this.informationBlock = page.locator('.product-information');

    // Product name is the h2 inside the information block.
    this.productName = this.informationBlock.locator('h2');

    // e.g. "Category: Women > Tops"
    this.category = this.informationBlock.getByText('Category');

    // e.g. "Rs. 500"
    this.price = this.informationBlock.locator('span span');

    this.availability = this.informationBlock.getByText('Availability');
  }

  async open(productId) {
    await super.goto(`/product_details/${productId}`);
  }
}

module.exports = ProductDetailsPage;