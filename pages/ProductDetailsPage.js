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

    // Quantity input next to the Add to cart button.
    this.quantityInput = page.locator('#quantity');

    // Add to cart button inside the information block.
    this.addToCartButton = this.informationBlock.locator('button.cart');

    // "View Cart" link inside the confirmation modal shown after
    // adding an item to the cart.
    this.viewCartModalLink = page.locator('.modal-content a[href="/view_cart"]');
  }

  async open(productId) {
    await super.goto(`/product_details/${productId}`);
  }

  // Adds the current product (with optional quantity) to the cart.
  async addToCart(quantity) {
    if (quantity) {
      await this.quantityInput.fill(String(quantity));
    }
    await this.addToCartButton.click();
  }

  // Continues from the "Added!" modal to the cart page.
  async viewCartFromModal() {
    await this.viewCartModalLink.click();
  }
}

module.exports = ProductDetailsPage;