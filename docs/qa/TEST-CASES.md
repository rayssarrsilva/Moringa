# Test cases and traceability

Every Must and Should story maps to test cases, and every test case to the automated test that runs it on each pull request, or to the [manual checklist](./MANUAL-CHECKLIST.md). A reviewer can open any row and read the test.

**Type:** A = automated on CI · M = manual · X = exploratory (see [sessions](./EXPLORATORY-SESSIONS.md)).
**Status** on October 22, 2026: ✅ pass · 🔁 fixed in this cycle, now passing · ⏳ waiting for the manual run.

## Traceability matrix

| Story                             | Test case                                                                             | Type | Where                                                         | Status     |
| --------------------------------- | ------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------- | ---------- |
| **US-01** Browse the catalog      | TC-01 Filter by state and material; filters stay in the URL                           | A    | [catalog.spec](../../e2e/catalog.spec.ts)                     | ✅         |
|                                   | TC-02 Open a shared filtered link and see the same results                            | A    | catalog.spec                                                  | ✅         |
|                                   | TC-03 Remove one filter chip, keep the others                                         | A    | catalog.spec                                                  | ✅         |
|                                   | TC-04 Empty result has a way out                                                      | A    | catalog.spec                                                  | ✅         |
|                                   | TC-05 Broken filter values are ignored, not an error                                  | A, X | catalog.spec · S3                                             | ✅         |
| **US-02** See who made the piece  | TC-06 Price, stock, material, maker and link to the shop                              | A    | catalog.spec                                                  | ✅         |
|                                   | TC-07 Product, Review and Breadcrumb data for search engines                          | A    | catalog.spec                                                  | ✅         |
|                                   | TC-08 Unknown piece answers 404                                                       | A, X | catalog.spec · S7                                             | ✅         |
| **US-03** Save for later          | TC-09 A favorite saved before signing in is still there after                         | A    | [reviews-favorites.spec](../../e2e/reviews-favorites.spec.ts) | ✅         |
|                                   | TC-10 A paused piece shows as unavailable in favorites                                | A    | reviews-favorites.spec                                        | ✅         |
| **US-04** Read it in my language  | TC-11 The root address opens the browser's language                                   | A    | [home.spec](../../e2e/home.spec.ts)                           | ✅         |
|                                   | TC-12 Switching language keeps the page                                               | A    | home.spec                                                     | ✅         |
|                                   | TC-13 No Portuguese left on English pages (10 pages)                                  | X    | S6                                                            | ✅         |
| **US-05** Add to cart             | TC-14 Add a piece, header count updates                                               | A    | [checkout.spec](../../e2e/checkout.spec.ts)                   | ✅         |
|                                   | TC-15 Asking for more than the stock keeps the stock and says so                      | A    | checkout.spec                                                 | ✅         |
|                                   | TC-16 The bag survives a reload                                                       | A    | checkout.spec                                                 | ✅         |
|                                   | TC-17 One shipping per maker                                                          | A    | checkout.spec, [bag.test](../../src/lib/bag/bag.test.ts)      | ✅         |
|                                   | TC-18 The bag shows today's price, stock and availability                             | A    | [qa-regressions.spec](../../e2e/qa-regressions.spec.ts)       | 🔁 BUG-001 |
| **US-06** Fill the address by CEP | TC-19 A valid CEP fills street, district and city                                     | A    | checkout.spec                                                 | ✅         |
|                                   | TC-20 A CEP that does not exist lets the buyer type                                   | A    | checkout.spec                                                 | ✅         |
|                                   | TC-21 Every missing field is explained, focus goes to the first                       | A    | checkout.spec                                                 | ✅         |
| **US-07** Pay safely              | TC-22 The server re-prices the bag; the browser cannot set a price                    | A    | [pricing.test](../../src/lib/checkout/pricing.test.ts)        | ✅         |
|                                   | TC-23 The pay button shows the amount that will be charged                            | A    | qa-regressions.spec, pricing.test                             | 🔁 BUG-001 |
|                                   | TC-24 One order per maker; stock taken once if the webhook repeats                    | A    | [db integration](../../src/db/integration.test.ts)            | ✅         |
|                                   | TC-25 Pay with a test card on the live site, then see the order                       | M    | MC-01                                                         | ⏳         |
|                                   | TC-26 A declined card says so and keeps the bag                                       | M    | MC-02                                                         | ⏳         |
|                                   | TC-27 Pix in test mode                                                                | M    | MC-03                                                         | ⏳         |
| **US-08** Order timeline          | TC-28 Orders list with status                                                         | A    | [account.spec](../../e2e/account.spec.ts)                     | ✅         |
|                                   | TC-29 Timeline with tracking code                                                     | A    | account.spec                                                  | ✅         |
|                                   | TC-30 "I got my order" works at once and survives a reload                            | A, X | account.spec · S8 (double click)                              | ✅         |
|                                   | TC-31 Track without an account: same 404 for wrong code or wrong email                | A    | account.spec                                                  | ✅         |
|                                   | TC-32 One visitor never sees another visitor's demo orders                            | A    | db integration                                                | ✅         |
| **US-09** Review a piece          | TC-33 Stars and comment on a delivered piece; no second review                        | A    | reviews-favorites.spec                                        | ✅         |
|                                   | TC-34 Rating with the keyboard (arrow keys)                                           | A    | reviews-favorites.spec                                        | ✅         |
|                                   | TC-35 Only signed-in buyers can review                                                | A    | reviews-favorites.spec                                        | ✅         |
| **US-11** Shop onboarding         | TC-36 A new maker creates a shop with story and region                                | A    | [seller.spec](../../e2e/seller.spec.ts)                       | ✅         |
| **US-12** New piece wizard        | TC-37 Each step validates only its fields                                             | A    | seller.spec                                                   | ✅         |
|                                   | TC-38 The draft survives a reload                                                     | A    | seller.spec                                                   | ✅         |
|                                   | TC-39 Script tags and emoji in names are shown as text                                | X    | S1                                                            | ✅         |
|                                   | TC-40 Prices: negative, zero, letters and over the limit refused; "1.234,56" accepted | X    | S1                                                            | ✅         |
| **US-13** Shop overview           | TC-41 What to ship today, and the chart also as a table                               | A    | [seller-orders.spec](../../e2e/seller-orders.spec.ts)         | ✅         |
| **US-14** Ship an order           | TC-42 Paid → preparing → shipped with a valid tracking code                           | A    | seller-orders.spec                                            | ✅         |
|                                   | TC-43 The maker API refuses buyers and visitors                                       | A, X | seller-orders.spec · S3                                       | ✅         |
| **US-15** Manage pieces           | TC-44 Edit price, pause and sell again                                                | A    | [manage-pieces.spec](../../e2e/manage-pieces.spec.ts)         | ✅         |
|                                   | TC-45 Shared demo pieces are read-only                                                | A    | manage-pieces.spec                                            | ✅         |
|                                   | TC-46 An invalid field never moves the button under the click                         | A    | manage-pieces.spec                                            | ✅         |
| **US-16** See my reviews          | TC-47 The maker reads every review with its piece                                     | A    | reviews-favorites.spec                                        | ✅         |

## Across every story

| Area          | Test case                                                                 | Type | Where                                              | Status |
| ------------- | ------------------------------------------------------------------------- | ---- | -------------------------------------------------- | ------ |
| Accessibility | TC-48 axe (WCAG 2.2 AA) on every page, both themes, both viewports        | A    | every E2E spec                                     | ✅     |
|               | TC-49 First Tab is "Skip to content"; 25 tab stops all with visible focus | A, X | home.spec · S5                                     | ✅     |
|               | TC-50 No horizontal scroll at 320 px (WCAG 1.4.10), 11 pages              | A, X | home.spec · S4                                     | ✅     |
|               | TC-51 NVDA + Chrome: buy a piece and follow the order                     | M    | MC-04                                              | ⏳     |
|               | TC-52 200% zoom and Windows High Contrast                                 | M    | MC-05                                              | ⏳     |
| Security      | TC-53 CSP with nonce, headers on pages, API and files                     | A    | [security.spec](../../e2e/security.spec.ts)        | ✅     |
|               | TC-54 Rate limit answers 429 with Retry-After; another site gets 403      | A    | [guard.test](../../src/lib/security/guard.test.ts) | ✅     |
|               | TC-55 Personal APIs answer 401 without a session                          | A, X | account.spec · S3                                  | ✅     |
|               | TC-56 ZAP baseline with no Medium or High alert                           | A    | CI `zap` job                                       | ✅     |
| Performance   | TC-57 Lighthouse budget on 4 pages                                        | A    | CI `lighthouse` job                                | ✅     |
| Compatibility | TC-58 Firefox and Safari (or a real iPhone)                               | M    | MC-06                                              | ⏳     |
