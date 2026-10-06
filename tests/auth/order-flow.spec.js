// tests/auth/order-flow.spec.js
//
// Phase 3 section 8: a realistic authenticated end-to-end
// business flow - placing an order.
//
// Flow: authenticated state (reused from storageState, no login UI
// steps) -> product details -> add to cart -> cart -> checkout ->
// delivery address equals the API-created customer's account data
// -> payment -> order confirmation with a dynamically assigned
// invoice id.
//
// Cleanup: the authState fixture deletes the customer after the
// test. The order itself cannot be deleted - the site has no
// orders API (documented limitation).

const { test, expect } = require('../../fixtures/auth.fixture');
const ProductDetailsPage = require('../../pages/ProductDetailsPage');
const CartPage = require('../../pages/CartPage');
const CheckoutPage = require('../../pages/CheckoutPage');
const PaymentPage = require('../../pages/PaymentPage');
const OrderConfirmationPage = require('../../pages/OrderConfirmationPage');

test('an authenticated customer can order a product end to end', async ({
  browser,
  authState,
}) => {
  // Start from the REUSED authenticated state - no login steps here.
  // This context is created manually, so the test also closes it
  // manually - in a finally block, so it happens on success AND on
  // failure (a leaked context keeps the authenticated cookies alive).
  const context = await browser.newContext({ storageState: authState.state });

  try {
    const page = await context.newPage();

    // 1. Open a product's details and add it to the cart.
    const details = new ProductDetailsPage(page);
    await details.open(1);
    await details.addToCart();
    await details.viewCartFromModal();

    // 2. The cart holds the added product.
    const cart = new CartPage(page);
    await expect(cart.productRows).toHaveCount(1);

    // 3. Checkout: the delivery address block is filled from the
    //    authenticated customer's account data - cross-layer proof
    //    that the session belongs to OUR API-created user. The block
    //    shows the account's address fields (title + first/last name),
    //    not the login display name. The site renders the title with a
    //    trailing period: "Mr. QA Tester".
    await cart.proceedToCheckout();
    const checkout = new CheckoutPage(page);
    await expect(checkout.deliveryAddress).toContainText('Your delivery address');
    await expect(checkout.deliveryAddress)
      .toContainText(`${authState.user.title}. ${authState.user.firstname} ${authState.user.lastname}`);
    await expect(checkout.deliveryAddress).toContainText(authState.user.address1);
    await expect(checkout.deliveryAddress).toContainText(authState.user.city);
    await expect(checkout.deliveryAddress).toContainText(authState.user.zipcode);

    // 4. Pay with test card data.
    await checkout.placeOrder();
    const payment = new PaymentPage(page);
    await payment.payWithTestCard(authState.user.lastname);

    // 5. Order confirmed, with a dynamically assigned invoice id.
    const confirmation = new OrderConfirmationPage(page);
    await expect(confirmation.orderPlacedHeading).toBeVisible();
    const invoiceHref = await confirmation.invoiceLink.getAttribute('href');
    expect(invoiceHref).toMatch(/\/download_invoice\/\d+$/);
  } finally {
    // The context belongs to this test, not to Playwright's automatic
    // teardown - always close it, whatever the flow above did.
    await context.close();
  }
});
