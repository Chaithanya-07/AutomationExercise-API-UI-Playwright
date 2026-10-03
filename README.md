# AutomationExercise API + UI Playwright — Project 2

Full-stack test automation for **[automationexercise.com](https://automationexercise.com)** using a **single Playwright framework** that covers API, UI and hybrid (API → UI → API) scenarios.

> **Phase 1** — foundation (POM, API service layer, fixtures, dynamic data, first hybrid flow). See [Phase 1 report](#actual-results) below.
> **Phase 2** — API chaining, update coverage, negative/boundary tests, lightweight response validation, stronger hybrid consistency. See [Phase 2](#phase-2--api-chaining-update--negative-coverage--consistency) below.

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
│       └── customer-api-ui.spec.js
├── pages/                         # Page Object Model (UI)
│   ├── BasePage.js                # navigation + logged-in header helpers
│   ├── HomePage.js
│   ├── LoginPage.js                # login form + signup entry form
│   ├── SignupPage.js                # account information form
│   ├── ProductsPage.js
│   └── ProductDetailsPage.js
├── api/                           # reusable API service layer
│   ├── authApi.js                  # verifyLogin
│   ├── productsApi.js               # productsList, brandsList, searchProduct
│   └── usersApi.js                  # createAccount, getUserDetailByEmail,
│                                   # updateAccount, deleteAccount
├── fixtures/
│   └── api.fixture.js             # `createdUser`: API-created customer
│                                   # (created before test, deleted after)
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

Every API- or UI-created customer is deleted in the same test run:

- the `createdUser` fixture deletes its customer after each test and **fails loudly** (logged error) if deletion fails
- `tests/api/users.api.spec.js` verifies deletion inside the test (delete → 404 on lookup)
- the UI signup test registers through the browser, then deletes its account through the **API** (deterministic in every browser — the header "Delete Account" link click proved unreliable in WebKit) and verifies the 404 lookup

## Execution

```bash
npm install
npx playwright install chromium firefox webkit

npx playwright test tests/ui       # UI only
npx playwright test tests/api       # API only
npx playwright test tests/hybrid    # hybrid only
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