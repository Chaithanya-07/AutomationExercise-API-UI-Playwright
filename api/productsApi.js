// api/productsApi.js
//
// Service layer for product/brand endpoints on automationexercise.com.
//
// Verified against the live API:
// - productsList and brandsList are GET requests.
//   (brandsList rejects POST with body responseCode 405.)
// - searchProduct is POST with form field `search_product`.
// - HTTP status is 200 even for business failures; assert on
//   body.responseCode instead.

const API = '/api';

/**
 * GET /api/productsList - returns all products.
 */
async function getAllProducts(request) {
  const response = await request.get(`${API}/productsList`);
  return { status: response.status(), body: await response.json() };
}

/**
 * GET /api/brandsList - returns all brands.
 */
async function getAllBrands(request) {
  const response = await request.get(`${API}/brandsList`);
  return { status: response.status(), body: await response.json() };
}

/**
 * POST /api/searchProduct - searches products by name.
 * Call without a term for the negative "missing parameter" scenario.
 */
async function searchProducts(request, searchTerm) {
  const options = {};
  if (searchTerm !== undefined) options.form = { search_product: searchTerm };

  const response = await request.post(`${API}/searchProduct`, options);
  return { status: response.status(), body: await response.json() };
}

// --- Deliberately wrong-method calls, used only by negative tests ---
// Verified live (2026-10-03): these endpoints answer with body
// responseCode 405 "This request method is not supported.".

/**
 * GET /api/searchProduct - WRONG method (search is POST only).
 */
async function searchProductsViaGet(request) {
  const response = await request.get(`${API}/searchProduct`);
  return { status: response.status(), body: await response.json() };
}

/**
 * POST /api/productsList - WRONG method (products list is GET only).
 */
async function getAllProductsViaPost(request) {
  const response = await request.post(`${API}/productsList`, { form: {} });
  return { status: response.status(), body: await response.json() };
}

module.exports = {
  getAllProducts,
  getAllBrands,
  searchProducts,
  searchProductsViaGet,
  getAllProductsViaPost,
};