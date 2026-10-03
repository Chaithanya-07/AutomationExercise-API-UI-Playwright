// tests/hybrid/search-consistency.spec.js
//
// Phase 2 - cross-layer consistency: the SAME search term must return the
// SAME products through the API and through the UI.
//
//   API  POST /api/searchProduct "blue"  -> known product names
//   UI   /products search box "blue"     -> displayed product names
//   -> both sets must be identical
//
// Verified live (2026-10-03) before this test was written: for the term
// "blue" the API and the UI return the identical set of 7 product names.

const { test, expect } = require('@playwright/test');
const productsApi = require('../../api/productsApi');
const ProductsPage = require('../../pages/ProductsPage');

test('API and UI return the same products for the same search term', async ({ page, request }) => {
  const term = 'blue';

  // --- API layer: search through the documented endpoint ---
  const apiResponse = await productsApi.searchProducts(request, term);
  expect(apiResponse.body.responseCode).toBe(200);

  const apiNames = apiResponse.body.products
    .map((product) => product.name.trim())
    .sort();
  expect(apiNames.length).toBeGreaterThan(0);

  // --- UI layer: search through the browser ---
  const productsPage = new ProductsPage(page);
  await productsPage.open();
  await productsPage.search(term);

  const uiNames = (await productsPage.productNames.allTextContents())
    .map((name) => name.trim())
    .sort();

  // --- Consistency: the UI shows exactly what the API returns ---
  expect(uiNames).toEqual(apiNames);
});