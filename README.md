# AutomationExercise API + UI Playwright — Project 2

Full-stack test automation for **[automationexercise.com](https://automationexercise.com)** using a **single Playwright framework** that covers API, UI and hybrid (API → UI → API) scenarios.

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