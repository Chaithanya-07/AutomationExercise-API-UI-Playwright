// tests/api/products.api.spec.js
//
// Products and brands endpoints.
//
// Verified contract: HTTP status is 200 even for business failures;
// the real result is body.responseCode.

const { test, expect } = require('@playwright/test');
const productsApi = require('../../api/productsApi');

test('get all products returns the full catalog', async ({ request }) => {
  const { status, body } = await productsApi.getAllProducts(request);

  expect(status).toBe(200);
  expect(body.responseCode).toBe(200);
  expect(Array.isArray(body.products)).toBe(true);
  expect(body.products.length).toBeGreaterThan(0);
});

test('every product has the expected fields', async ({ request }) => {
  const { body } = await productsApi.getAllProducts(request);

  const expectedFields = ['id', 'name', 'price', 'brand', 'category'];
  for (const product of body.products) {
    for (const field of expectedFields) {
      expect(product, `product ${product.id} missing field '${field}'`).toHaveProperty(field);
    }
  }
});

test('get all brands returns a non-empty brand list', async ({ request }) => {
  const { status, body } = await productsApi.getAllBrands(request);

  expect(status).toBe(200);
  expect(body.responseCode).toBe(200);
  expect(Array.isArray(body.brands)).toBe(true);
  expect(body.brands.length).toBeGreaterThan(0);
});