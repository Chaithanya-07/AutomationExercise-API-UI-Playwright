# AutomationExercise API + UI Playwright — Project 2

Full-stack test automation for **[automationexercise.com](https://automationexercise.com)** using a **single Playwright framework** that covers API, UI and hybrid (API → UI → API) scenarios.

> **Phase 1** — foundation (POM, API service layer, fixtures, dynamic data, first hybrid flow). See [Phase 1 report](#actual-results) below.
> **Phase 2** — API chaining, update coverage, negative/boundary tests, lightweight response validation, stronger hybrid consistency. See [Phase 2](#phase-2--api-chaining-update--negative-coverage--consistency) below.
> **Phase 3** — authentication, session state (storageState), and an authenticated end-to-end order flow. See [Phase 3](#phase-3--authentication-session-state--end-to-end-order-flow) below.

## Current Project Status

- **Project 1 — QADemo** — COMPLETE / FROZEN
- **Project 2 — Automation Exercise**
  - **Phase 1** — COMPLETE / APPROVED — 54/54
  - **Phase 2** — COMPLETE / APPROVED — 87/87
  - **Phase 3** — IMPLEMENTED / FINAL MENTOR REVIEW — 108 scheduled runs, 0 failed, 1 flaky
  - **Phase 4** — NOT STARTED

## Project Objective

The core interview story of this project:

> **API creates the customer → UI validates the customer can use the application → API verifies the backend state.**

One framework, one business scenario, validated across both layers.

## AUT — Why Automation Exercise

- Website: https://automationexercise.com
- API documentation: https://automationexercise.com/api_list

Automation Exercise provides a customer-facing e-commerce UI **and** documented practice APIs against the same backend. That makes it possible to verify *the same business data* through the API and through the browser — which is exactly what this framework needs.

## Architecture

```text
AutomationExercise-API-UI-Playwright/
├── tests/
│   ├── ui/                       # browser-only scenarios
│   │   ├── home.spec.js
│   │   ├── login.spec.js
│   │   ├── signup.spec.js
│   │   └── products.spec.js
│   ├── api/                      # API-only scenarios
│   │   ├── products.api.spec.js
│   │   ├── search.api.spec.js
│   │   ├── auth.api.spec.js
│   │   └── users.api.spec.js
│   └── hybrid/                   # API + UI in one flow
│       ├── customer-api-ui.spec.js
│       └── search-consistency.spec.js
│   └── auth/                     # Phase 3: authentication & session state
│       ├── storage-state.spec.js   # storageState reuse + logout invalidation
│       ├── invalid-login.spec.js   # negative authentication (UI layers)
│       └── order-flow.spec.js      # authenticated end-to-end order flow
├── pages/                         # Page Object Model (UI)
│   ├── BasePage.js                # navigation + logged-in header helpers
│   ├── HomePage.js
│   ├── LoginPage.js                # login form + signup entry form
│   ├── SignupPage.js                # account information form
│   ├── ProductsPage.js
│   ├── ProductDetailsPage.js        # + quantity, add to cart, modal
│   ├── CartPage.js                  # Phase 3: cart table + proceed to checkout
│   ├── CheckoutPage.js              # Phase 3: delivery address + place order
│   ├── PaymentPage.js               # Phase 3: card details form
│   └── OrderConfirmationPage.js    # Phase 3: order placed + invoice link
├── api/                           # reusable API service layer
│   ├── authApi.js                  # verifyLogin
│   ├── productsApi.js               # productsList, brandsList, searchProduct
│   └── usersApi.js                  # createAccount, getUserDetailByEmail,
│                                   # updateAccount, deleteAccount
├── fixtures/
│   ├── api.fixture.js             # `createdUser`: API-created customer
│                                   # (created before test, deleted after)
│   └── auth.fixture.js            # Phase 3: `authState` — API customer +
│                                   # one UI login + captured storageState
├── utils/
│   └── testData.js                # unique customer generator
├── test-data/
│   └── users.example.json         # shape of the generated customer
├── playwright.config.js
└── package.json
```

**Separation of concerns** (the key design rule):

- The **API layer** owns endpoint paths, HTTP methods, request format and response parsing.
- The **tests** own business intent, flow and assertions:

```js
const response = await usersApi.createUser(request, userData);
```

## Verified API Contracts

Every endpoint was verified against the **live** system before being used (safe request → observe → confirm). Documented at https://automationexercise.com/api_list.

| Method | Endpoint | Observed HTTP | `responseCode` (success) | Request format |
|---|---|---|---|---|
| GET | `/api/productsList` | 200 | 200 | — |
| GET | `/api/brandsList` | 200 | 200 | — (POST rejected: body `responseCode 405`) |
| POST | `/api/searchProduct` | 200 | 200 | form-urlencoded `search_product` |
| POST | `/api/verifyLogin` | 200 | 200 | form-urlencoded `email` + `password` |
| POST | `/api/createAccount` | 200 | 201 | form-urlencoded (all account + address fields) |
| GET | `/api/getUserDetailByEmail` | 200 | 200 | query parameter `email` |
| PUT | `/api/updateAccount` | 200 | 200 | form-urlencoded |
| DELETE | `/api/deleteAccount` | 200 | 200 | form body (`email` + `password`) on the DELETE request |

### Differences from / quirks of the documented API (all verified live)

1. **HTTP status is (almost) always 200** — business failures are expressed in the body's `responseCode` field (400/404/405). Tests therefore assert on `body.responseCode`, not the HTTP status. The one exception found: POST to `/api/deleteAccount` returns a real **HTTP 405**.
2. **Requests are form-urlencoded, not JSON.** A JSON body to `/api/verifyLogin` is treated as "missing parameters" (`responseCode 400`).
3. **`DELETE /api/deleteAccount` carries a form body** (`email`, `password`). POST is not accepted for this endpoint (HTTP 405) — the DELETE method with a body is the working contract.
4. **`GET /api/brandsList` works as documented**; POST is rejected with body `responseCode 405`.
5. Responses are JSON but served with `Content-Type: text/html`.

## Test Coverage

### UI

- **Home** — page loads; navigation, product section, footer present
- **Login** — invalid credentials → error message; valid (API-created) customer → "Logged in as …" → logout
- **Signup** — full UI registration with a unique email → "Account Created!" → logged-in header; account deleted through the API (cleanup)
- **Products** — listing loads; search narrows results; product details page matches the clicked product

### API

- **Products** — get all products; validate expected fields on every product; get all brands
- **Search** — valid term returns matching products; missing `search_product` parameter rejected
- **Auth** — valid login verified; invalid login rejected (404); missing parameter rejected (400)
- **Customer** — full lifecycle: create (201) → read & verify data → delete (200) → confirm gone (404); non-existent email lookup returns 404

### Hybrid (the core flow)

`tests/hybrid/customer-api-ui.spec.js`:

1. `generateTestUser()` creates a unique customer (`utils/testData.js`)
2. **API** `createAccount` registers the customer (via the `createdUser` fixture)
3. **API** `getUserDetailByEmail` verifies the backend state
4. **UI** the same customer logs in through the browser
5. **UI** header shows "Logged in as \<name\>"
6. **Consistency check** — UI-displayed name == test data == backend record
7. **UI** logout
8. **API** `deleteAccount` cleanup (fixture)

## Test Data

- No real or hard-coded credentials are used anywhere.
- `utils/testData.js` generates a unique customer per run: `qa_user_<timestamp><random>@example.com`.
- The signup name embeds the same suffix so UI assertions match exact test data.
- `test-data/users.example.json` documents the customer shape.

## Cleanup

Every API- or UI-created customer is deleted in the same test run. The cleanup policy (final Phase 3 state):

- **both customer fixtures use `try/finally`** — `createdUser` (`fixtures/api.fixture.js`) and `authState` (`fixtures/auth.fixture.js`) wrap setup and teardown, so **cleanup is attempted even when setup fails** after the account may have been created. No API-created customer is orphaned by a broken setup.
- the `createdUser` fixture deletes its customer after each test; a `404` on delete is accepted only when the account was never created (nothing to clean up).
- **cleanup failure fails the test when there is no prior test failure** — a customer that survives cleanup is never a silently passing test.
- **when the test has already failed, the cleanup failure is logged loudly without masking the original error.**
- `tests/api/users.api.spec.js` verifies deletion inside the test (delete → 404 on lookup)
- the UI signup test registers through the browser, then deletes its account through the **API** (deterministic in every browser — the header "Delete Account" link click proved unreliable in WebKit) and verifies the 404 lookup

## Execution

```bash
npm install
npx playwright install chromium firefox webkit

npx playwright test tests/ui       # UI only
npx playwright test tests/api       # API only
npx playwright test tests/hybrid    # hybrid only
npx playwright test tests/auth     # authentication + session state (Phase 3)
npx playwright test                 # everything, all 3 browsers
npm run report                      # open the HTML report
```

## Actual Results

Full suite run on **2026-10-03** — Playwright 1.63.0, Node v24.13.0, Windows 11, against the live https://automationexercise.com.

| Suite | Scenarios | Runs (× 3 browsers) | Passed | Failed |
|---|---|---|---|---|
| UI (`tests/ui`) | 7 | 21 | 21 | 0 |
| API (`tests/api`) | 10 | 30 | 30 | 0 |
| Hybrid (`tests/hybrid`) | 1 | 3 | 3 | 0 |
| **Total** | **18** | **54** | **54** | **0** |

- Browsers: Chromium, Firefox, WebKit — all passing
- Duration: ~1.7 minutes
- HTML report: `playwright-report/index.html` (open with `npm run report`)

## Known Limitations

- **Phase 1 scope only** — no schema-validation framework, network interception, mocking, advanced API chaining, CI/CD or Docker yet (planned for later Project 2 phases).
- **UI signup form selectors could not be pre-verified with plain HTTP** — the site returns 403 for non-browser form POSTs (anti-bot). They were verified live through Playwright browser runs instead.
- **WebKit does not navigate on the products page's "View Product" link click** (Chromium and Firefox do). The details test therefore reads the product id from the link and opens `/product_details/{id}` directly — deterministic in all browsers.
- **Product count assertion is `> 0`**, not an exact count, because the live catalog can change.
- The live site is slow and occasionally flaky; timeouts are generous (60s test, 30s navigation, 10s expect) to match.

---

# Phase 2 — API Chaining, Update + Negative Coverage, Consistency

## Objective

Make the framework more realistic and reusable: stronger API chaining, customer update coverage, useful negative/boundary scenarios, lightweight response validation, API-driven UI test data, and stronger API ↔ UI consistency — without regressing the Phase 1 baseline.

## New API Contracts Verified Live (2026-10-03)

| Scenario | Observed `responseCode` | Verified message |
|---|---|---|
| `createAccount` without `password` | 400 | "Bad request, password parameter is missing in POST request." |
| `createAccount` with an already-registered email | 400 | "Email already exists!" |
| `createAccount` with a **malformed email** (`...@`, no domain) | **201 — accepted** | "User created!" |
| `verifyLogin` — existing email + **wrong password** | 404 | "User not found!" (indistinguishable from unknown email) |
| `getUserDetailByEmail` without `email` | 400 | "Bad request, email parameter is missing in GET request." |
| `searchProduct` with a no-match term | 200 | `products: []` (empty list is success) |
| `GET /api/searchProduct` (wrong method) | 405 | "This request method is not supported." |
| `POST /api/productsList` (wrong method) | 405 | "This request method is not supported." |
| `updateAccount` on a non-existent email | 404 | "Account not found!" |
| **`updateAccount` is a PARTIAL update** | 200 | Only fields present in the form change; others keep their previous values (verified by updating just `name` on a live record). |

Notable finding: the API performs **no email format validation at all** — any string is accepted as an email unless the exact string is already registered. This is documented and covered honestly instead of pretending a rejection exists.

## API Chaining (tests/api/customer-lifecycle.api.spec.js)

One test drives the full chain and asserts the state transition after each step:

```
create (201) -> read (verify data) -> update selected fields (name, city)
-> read again (changed fields changed, untouched fields preserved)
-> delete (200) -> read (404 not found)
```

Cleanup is guaranteed with a `finally` block: if any step fails mid-chain, the customer is still deleted (never silently).

## Update Flow

`PUT /api/updateAccount` with `email` + `password` (to identify the account) plus only the fields to change. The lifecycle test verifies the changed fields **and** that untouched fields (`first_name`, `state`, `zipcode`, …) kept their values — proving the partial-update behavior.

## Negative and Boundary Tests (tests/api/negative.api.spec.js)

9 scenarios: missing required field, duplicate email, malformed-email acceptance (documented boundary), wrong password for existing email, missing email param on lookup, empty search result, two wrong-method calls, and update of a non-existent customer. Every expected code/message was verified live first — nothing invented.

## Response Validation (utils/apiValidation.js)

Lightweight, readable validators — deliberately **not** a schema framework:

- `expectApiSuccess(response, code)` — HTTP 200, parsed JSON object, expected `responseCode`
- `expectApiError(response, code)` — business error code + string `message`
- `expectUserShape(user)` — required customer fields present, `id` is a number, email contains `@`

Business assertions stay visible in the tests; only the transport-level contract is centralized.

## Hybrid Consistency (Phase 2)

1. **UI → API** (`tests/ui/signup.spec.js`, extended): the UI registration creates backend state; the test then reads the customer via `getUserDetailByEmail` and verifies **every submitted field** matches the backend record, before API cleanup.
2. **API ↔ UI search consistency** (`tests/hybrid/search-consistency.spec.js`): the same search term (`blue`) through the API and through the browser must return the **identical product name set** (verified live first: both return the same 7 products).
3. The Phase 1 API → UI → API customer flow (`tests/hybrid/customer-api-ui.spec.js`) is unchanged and still passing.

Note: Automation Exercise has **no profile-edit page in the UI**, so a UI-driven account update consistency flow is not available; the signup-verification and search-consistency scenarios are the genuine alternatives.

## Fixtures and Test Data

- `createdUser` fixture: unchanged — it already prepared, provided and cleaned state cleanly (per the Phase 2 brief, extended only where needed: it is reused by the new duplicate-email and wrong-password negative tests).
- `utils/testData.js`: unchanged — same unique-customer generator (`qa_user_<timestamp><random>@example.com`).
- `test-data/users.example.json`: unchanged template, no real credentials, no secrets.

## Cleanup

Same reliable create → test → delete discipline as Phase 1, plus: the lifecycle chain test deletes in a `finally` block even if a step fails; the malformed-email boundary test deletes its created account too.

## Phase 2 Actual Results (2026-10-03, Playwright 1.63.0, Node v24.13.0)

| Suite | Scenarios | Runs (× 3 browsers) | Passed | Failed |
|---|---|---|---|---|
| UI (`tests/ui`) | 7 | 21 | 21 | 0 |
| API (`tests/api`) | 20 | 60 | 60 | 0 |
| Hybrid (`tests/hybrid`) | 2 | 6 | 6 | 0 |
| **Total** | **29** | **87** | **87** | **0** |

- Browsers: Chromium, Firefox, WebKit — all passing
- All Phase 1 tests still pass (no regressions)

## Phase 2 Limitations

- No UI profile-update page exists on Automation Exercise, so UI-driven account-update consistency is not possible (documented above).
- The wrong-method 405 responses live in the body `responseCode` — the API does not use real HTTP 405s for those (the one real HTTP 405 is POST on `/api/deleteAccount`).
- Search-consistency compares product **names**, not the full product payloads (the UI listing does not render ids/prices in a comparable way).

---

# Phase 3 — Authentication, Session State, End-to-End Order Flow

## Objective

Demonstrate that the framework handles a realistic **authenticated** workflow, not just isolated API/UI tests: valid and invalid authentication, reusable authenticated browser state (`storageState`), cross-layer validation of the authenticated user, and a full **login → cart → checkout → payment → order confirmation** business flow — without regressing the Phase 1/2 baselines.

## Authentication Architecture

Three layers, each with a single responsibility:

1. **API layer** (`api/usersApi.js`, `api/authApi.js`) — account creation, lookup, `verifyLogin`, deletion. The API has no login-token endpoint, so authenticated state is established through the **UI login** and captured from the browser.
2. **UI layer** (`pages/LoginPage.js`, `pages/BasePage.js`) — login form interaction, the logged-in header indicator (`"Logged in as <name>"`), logout, and the header links whose visibility encodes auth state (`/logout` visible only when logged in, `/login` only when logged out).
3. **Fixture/auth-state layer** (`fixtures/auth.fixture.js`) — the `authState` fixture: creates a unique customer via the API, performs **one** UI login, captures the session with `context.storageState()`, and hands `{ user, state }` to the test. The customer is deleted afterwards.

### How the session actually works (verified live)

- The authenticated session is a **server-side `sessionid` cookie** (httpOnly, SameSite=Lax) set by the UI login.
- A new browser context created from the saved storageState **starts authenticated** — no login UI steps.
- **Logging out invalidates the state server-side**: after a logout, a second context built from the *same* saved state is a guest again. The state is not a reusable credential that survives logout — this is asserted in a test.

## storageState Strategy — Fast, but Isolated

The `authState` fixture deliberately does **not** share one global authenticated state across tests:

- Every test gets its **own** unique API-created customer and its own captured state → no test-order dependencies, no shared mutable user state.
- The benefit is still real: within a test, the authenticated context(s) are created directly from the saved state, so tests never repeat login UI steps.
- The saved state dies with the customer: the fixture deletes the account in cleanup, and the server session dies with it.

## Phase 3 Test Coverage (tests/auth/)

| File | Scenario | Layers |
|---|---|---|
| `storage-state.spec.js` | A new context from saved storageState starts authenticated (logged-in indicator + logout control visible; backend record cross-checked via API) | UI + API |
| `storage-state.spec.js` | Logging out invalidates the saved session state **server-side** (second context from the same state is a guest) | UI |
| `invalid-login.spec.js` | Empty login fields → blocked by **browser** HTML5 validation, never submitted (inputs `:invalid`, no server error, still on `/login`) | UI |
| `invalid-login.spec.js` | Malformed email format → blocked by browser `type="email"` validation, never submitted | UI |
| `invalid-login.spec.js` | Well-formed unknown email + known password → **server** rejects with "Your email or password is incorrect!", no authenticated state | UI |
| `invalid-login.spec.js` | Known email + wrong password → server rejects, no authenticated state | UI |
| `order-flow.spec.js` | Authenticated customer orders a product end to end (see below) | UI |

### Invalid authentication — both validation layers covered

Verified live first, then tested: the login form uses **HTML5 validation** (`type="email"`, `required`), so empty fields and malformed email formats are blocked client-side — no server error appears and the form is never submitted (asserted via the CSS `:invalid` pseudo-class plus absence of the server error). Well-formed credentials that don't match an account are submitted and rejected **server-side** with the site's actual red error message. In every negative case the test also asserts the user **did not reach an authenticated state** (no logged-in indicator, signup/login link still visible).

Note: the API layer performs **no** email-format validation at all (Phase 2 finding), so the format boundary only exists in the UI — covered there, honestly.

## End-to-End Order Flow (tests/auth/order-flow.spec.js)

The realistic authenticated business flow, using the reused storageState (no login steps in the test):

```
authenticated context (storageState)
→ product details page → Add to cart → modal → View Cart
→ cart shows the item → Proceed To Checkout
→ checkout: delivery address block == the API-created customer's account data
→ Place Order → payment form (test card data)
→ "Order Placed!" confirmation + dynamically assigned invoice id
```

The checkout step is the cross-layer proof that the session belongs to *our* customer: `#address_delivery` renders the account's title, first/last name, address, city and zipcode exactly as generated by `utils/testData.js` and registered through the API.

## Cleanup

- `authState` fixture: setup and teardown are wrapped in try/finally — if the UI login or the storageState capture fails **before** the test body runs, the login context is still closed and the API-created customer is still deleted. No customer survives a broken setup, and no browser context leaks.
- `createdUser` fixture (`fixtures/api.fixture.js`): the generated email/password are held locally **before** the create request, so cleanup is attempted even when `createAccount` throws **after** the server may have committed the account (timeout, lost response, unparseable body) — that account would otherwise be orphaned with no teardown path. A `404` on delete is accepted only when the account was never confirmed as created (nothing to clean up).
- A failed customer deletion is an **explicit test failure** in both customer fixtures (never a silently passing test). When the test itself already failed, the cleanup failure is logged loudly without masking the original error.
- `tests/auth/order-flow.spec.js` closes its manually created authenticated context in a `finally` block, so the context is released on success and on failure alike.
- Test isolation: each test owns its customer and its state; nothing is shared between tests.
- Known limitation: **orders cannot be deleted** — the site has no orders API. Placing the order empties the cart, and the account deletion removes the customer, but the order record remains on the practice site (documented, not hidden).

## Phase 3 Actual Results

### Original Phase 3 baseline (2026-10-03, Playwright 1.63.0, Node v24.13.0)

| Suite | Scenarios | Runs (× 3 browsers) | Passed | Failed |
|---|---|---|---|---|
| UI (`tests/ui`) | 7 | 21 | 21 | 0 |
| API (`tests/api`) | 20 | 60 | 60 | 0 |
| Hybrid (`tests/hybrid`) | 2 | 6 | 6 | 0 |
| Auth (`tests/auth`) | 7 | 21 | 21 | 0 |
| **Total** | **36** | **108** | **108** | **0** |

- Browsers: Chromium, Firefox, WebKit — all passing (including the order flow and the WebKit modal/cart navigation)
- Full-suite regression run after Phase 3: **108 passed, 0 failed** (~3.6 minutes), run with `retries: 0` — all Phase 1 and Phase 2 tests unchanged and still green

### Final state after the cleanup-hardening pass (2026-10-06)

Both customer fixtures (`authState` and `createdUser`) now guarantee teardown through try/finally, so no API-created customer can be orphaned by a broken setup. Final full-suite run, all suites × Chromium/Firefox/WebKit:

| Suite | Scenarios | Runs (× 3 browsers) | Passed | Flaky | Failed |
|---|---|---|---|---|---|
| UI (`tests/ui`) | 7 | 21 | 21 | 0 | 0 |
| API (`tests/api`) | 20 | 60 | 60 | 0 | 0 |
| Hybrid (`tests/hybrid`) | 2 | 6 | 6 | 0 | 0 |
| Auth (`tests/auth`) | 7 | 21 | 20 | 1 | 0 |
| **Total** | **36** | **108** | **107** | **1** | **0** |

- **108 scheduled test runs completed successfully with 0 failures; 107 passed on the first attempt and 1 was flaky/passed on retry.**
- Exact breakdown: **108 scheduled runs** · **107 passed on first attempt** · **1 flaky** · **0 failed** · **108 ultimately successful after retry**.
- Duration ~3.5 minutes.
- The retried run was `tests/auth/storage-state.spec.js` › "logging out invalidates the saved session state server-side" (Firefox).
- Same-day runs with `retries: 0` (honest first-run reporting) surfaced one Chromium flake each, on **different** tests — see the live-site instability note below. Both passed on immediate re-run, and neither involves the cleanup code or the modified fixtures: this is environment instability, not a framework regression.
- Browsers: Chromium, Firefox, WebKit — no failures on any engine; Phase 1 and Phase 2 tests remain unchanged and green.

## Phase 3 Limitations

- **No orders API exists**, so an order cannot be verified or deleted through the API. The invoice id is asserted as dynamically assigned (`/download_invoice/<id>`), and the checkout's delivery address block is the cross-layer validation point instead.
- The authenticated state must be captured via UI login (no API login-token endpoint); the storageState is therefore per-customer, not a pre-seeded reusable login.
- Login format validation is HTML5 client-side only — the API accepts malformed emails (Phase 2 finding); the negative tests cover the UI boundary where it actually exists.
- **Live-site instability (observed 2026-10-06)**: the site intermittently injects a full-viewport Google Ads overlay on `/checkout` (`ins.adsbygoogle` occupying `100vw × 100vh`), which can intercept the "Place Order" click on Chromium so the flow never reaches `/payment`; a separate run flaked on a `toHaveTitle` timing check in `tests/ui/home.spec.js`. Both passed on immediate re-run and on retry. This is third-party/environment noise on the practice site — documented rather than hidden or masked with retries.

## Interview Talking Points

### Q1 — How do you handle authentication in Playwright?

Two ways, used deliberately: for tests that exercise the login form itself, I log in through the UI (`LoginPage` page object). For tests that need an authenticated *user*, I establish the session once (UI login in the `authState` fixture), capture it with `context.storageState()`, and build contexts from that state — so auth setup is one step, not a repeated UI flow.

### Q2 — Why would you use `storageState`?

To avoid re-running the login UI steps before every test. On this site each UI login costs several seconds across three browsers; with storageState the login happens once per test in the fixture and the test contexts start already authenticated. It also lets me assert session behavior itself (reuse, server-side invalidation on logout).

### Q3 — What is the difference between logging in through the UI and creating authenticated state?

UI login exercises the application's real authentication form — that's what the login tests verify. Creating authenticated state is *setup*: it produces a session (cookies) that tests can consume without caring how it was made. Conflating them wastes time — tests for "checkout works" shouldn't fail because a login selector changed, and login tests shouldn't be repeated implicitly everywhere.

### Q4 — How do you prevent authentication state from leaking between tests?

Every test gets its own unique API-created customer and its own captured storageState from the `authState` fixture — nothing is cached globally or ordered. Contexts are created per test and closed at the end. The fixture also deletes the customer afterwards, so no account accumulates, and the server session dies with the account.

### Q5 — How do you combine API and UI testing?

Through fixtures and the business flow: the API creates and later deletes the customer, the UI validates the customer can actually use the application, and the API verifies the backend record (e.g., storageState test: UI proves the session is authenticated; `getUserDetailByEmail` proves the backend record matches). The order flow adds a third cross-layer point: the checkout delivery address rendered by the UI must equal the API-created account data.

### Q6 — How would you test invalid login scenarios?

First verify the real behavior — never assume. Here the form has HTML5 validation, so empty fields and malformed email formats are blocked client-side (asserted via `:invalid` and the absence of a server response); unknown email or wrong password are rejected by the server with its actual message. Each negative test also asserts the user never reaches an authenticated state. Notably, the API layer does no format validation at all — that asymmetry is a genuine finding, and I cover the boundary where it exists (the UI).

### Q7 — Why not perform UI login before every test?

It's slow (three browsers × repeated multi-second login flows), it makes auth failures look like product failures, and it couples every test to the login form's selectors. With the storageState fixture, only the fixture touches the login form; tests consume an authenticated context.

### Q8 — When would you avoid reusing authentication state?

When the test *is* about authentication (login/logout tests must do the real login), when state must be fresh or isolated (permissions, roles), when the session is mutable server-side (here: logout invalidates the state server-side, so a saved state is not a permanent credential), or when a global setup would create test-order dependencies. I keep the state per-test for exactly that reason — the speed benefit without shared mutable state.

### Q9 — How do you clean up test data?

Create → test → delete in the same run. Fixtures guarantee cleanup through try/finally; cleanup failures fail the test when there is no prior failure and are logged without masking an existing failure. Lifecycle tests also delete in finally blocks, while UI-signup tests clean up through the API. The one thing this site cannot clean is orders because there is no orders API — that limitation is documented honestly.

### Q10 — How do you keep authentication tests stable across Chromium, Firefox and WebKit?

I assert on behavior and stable selectors, not cosmetics: the site's `data-qa` attributes, the logged-in header indicator, and header links whose visibility encodes auth state. The HTML5-validation tests assert the standard `:invalid` pseudo-class, which all three engines support. And this site has known WebKit quirks (plain link clicks not navigating) — where that applied (Phase 1/2) I navigated by URL instead; the Phase 3 flows were verified in WebKit directly, including the cart modal and checkout navigation.
