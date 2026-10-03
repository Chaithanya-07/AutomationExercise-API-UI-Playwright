// pages/ProductsPage.js
//
// The /products page: "All Products" listing plus the search box.

const BasePage = require('./BasePage');

class ProductsPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/products';

    this.allProductsHeading = page.getByText('All Products');

    // Search box in the header area.
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');

    // "Searched Products" heading shown after a search.
    this.searchedProductsHeading = page.getByText('Searched Products');

    // Product cards in the main listing.
    // NOTE: the site uses an underscore here (features_items).
    this.productCards = page.locator('.features_items .product-image-wrapper');

    // Name shown inside a product card (e.g. "Blue Top").
    this.productNames = page.locator('.features_items .productinfo p');

    // "View Product" links (one per card) -> /product_details/{id}.
    this.viewProductLinks = page.locator('.features_items a[href^="/product_details"]');
  }

  async open() {
    await super.goto(this.url);
  }

  /**
   * Type a term into the search box and submit. Results appear in the
   * same listing area with a "Searched Products" heading.
   */
  async search(term) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  /**
   * Product id of the first product in the list, taken from its
   * "View Product" link (/product_details/{id}).
   */
  async firstProductId() {
    const href = await this.viewProductLinks.first().getAttribute('href');
    return href.split('/').pop();
  }
}

module.exports = ProductsPage;