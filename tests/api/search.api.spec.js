// tests/api/search.api.spec.js
//
// Search endpoint: POST /api/searchProduct with form field `search_product`.

const { test, expect } = require('@playwright/test');
const productsApi = require('../../api/productsApi');

test('searching a valid term returns matching products', async ({ request }) => {
  const { status, body } = await productsApi.searchProducts(request, 'blue');

  expect(status).toBe(200);
  expect(body.responseCode).toBe(200);

  // Every returned product should mention the term (case-insensitive).
  expect(body.products.length).toBeGreaterThan(0);
  for (const product of body.products) {
    expect(product.name.toLowerCase()).toContain('blue');
  }
});

test('searching without the search_product parameter is rejected', async ({ request }) => {
  const { status, body } = await productsApi.searchProducts(request);

  // HTTP is still 200 - the failure is expressed in body.responseCode.
  expect(status).toBe(200);
  expect(body.responseCode).toBe(400);
  expect(body.message).toContain('search_product parameter is missing');
});