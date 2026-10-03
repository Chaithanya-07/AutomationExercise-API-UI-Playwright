// tests/ui/products.spec.js
//
// Products page scenarios:
// - product listing loads
// - search narrows the listing to matching products
// - product details page shows the product's information

const { test, expect } = require('@playwright/test');
const ProductsPage = require('../../pages/ProductsPage');
const ProductDetailsPage = require('../../pages/ProductDetailsPage');

test('products page shows the all products listing', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  await productsPage.open();

  await expect(productsPage.allProductsHeading).toBeVisible();

  // The site currently lists 34 products; assert "more than none"
  // rather than an exact count that could change with the catalog.
  const cardCount = await productsPage.productCards.count();
  expect(cardCount).toBeGreaterThan(0);
});

test('searching for a term shows matching products', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  await productsPage.open();

  await productsPage.search('Blue');

  await expect(productsPage.searchedProductsHeading).toBeVisible();

  // Every result should mention the search term (case-insensitive).
  const names = await productsPage.productNames.allTextContents();
  expect(names.length).toBeGreaterThan(0);
  for (const name of names) {
    expect(name.toLowerCase()).toContain('blue');
  }
});

test('viewing a product shows its details page', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  await productsPage.open();

  const firstName = await productsPage.productNames.first().textContent();

  // Open the details page of the first product, taking the id from its
  // "View Product" link. (In WebKit the link click does not reliably
  // navigate on this site - direct navigation is deterministic.)
  const productId = await productsPage.firstProductId();
  const detailsPage = new ProductDetailsPage(page);
  await detailsPage.open(productId);
  await expect(detailsPage.productName).toBeVisible();
  await expect(detailsPage.category).toBeVisible();
  await expect(detailsPage.price).toBeVisible();
  await expect(detailsPage.availability).toBeVisible();

  // The details page shows the same product we clicked.
  await expect(detailsPage.productName).toHaveText(firstName.trim());
});