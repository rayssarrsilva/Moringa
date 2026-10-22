# Bug reports

## Open bugs

None. Every bug below is fixed and has a test that fails if it comes back.

## BUG-001 · The bag and the pay button showed an old price

| Field       | Value                                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Found       | October 22, 2026, exploratory session S2                                                                                                                                                                              |
| Severity    | **High**: the amount on the pay button could differ from the amount charged (CDC, art. 30 and 31)                                                                                                                     |
| Priority    | **P1**                                                                                                                                                                                                                |
| Environment | Production build, Chromium; affects every browser                                                                                                                                                                     |
| Status      | Fixed in this release · regression tests in [`qa-regressions.spec.ts`](../../e2e/qa-regressions.spec.ts), [`bag.test.ts`](../../src/lib/bag/bag.test.ts), [`pricing.test.ts`](../../src/lib/checkout/pricing.test.ts) |

**Steps to reproduce**

1. As a buyer, add a piece that costs R$ 120 (shipping R$ 20) to the bag.
2. As the maker of that piece, edit it and change the price to R$ 150 (US-15).
3. As the buyer, open the bag, then the checkout.

(The shared demo pieces are read-only, so on the live demo the same state is reached by editing the saved bag in the browser's storage, which is what the regression test does.)

**Expected:** the bag and the button say R$ 150 + shipping, and the buyer is told the price changed.
**Actual:** the bag and the button kept saying "Pagar R$ 140". Stripe would show and charge R$ 170.

**Cause:** the bag saved a copy of the piece (price, shipping, stock) when it was added and never compared it with the catalog again. The server always charged the right price, but nothing warned the buyer before that.

**Fix**

- When the bag or the checkout opens, it fetches the pieces on sale and updates price, shipping and stock; a piece paused or sold out is taken out. A notice lists every change ("o preço mudou de R$ 120 para R$ 150").
- The checkout sends the prices the buyer is looking at. If any no longer holds, the server refuses to charge and the page refreshes the values. The server still never takes a price from the browser.

## Bugs found and fixed during development

Found by the automated tests, the scanners or a person using the site, before this QA cycle. Listed because each one changed how the project is tested.

| ID     | What happened                                                                                                                                             | Found by                              | Severity | Fix and guard                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| DEV-01 | In the new piece wizard, the "Continue" click could publish the piece and skip the review step (React reused the same button and switched it to `submit`) | E2E                                   | High     | Distinct `key` per button · seller.spec                                                                       |
| DEV-02 | A paid order did not show in the buyer's list on the live site                                                                                            | **Rayssa, manual test in production** | High     | Orders tied to the browser's demo session · db integration "keeps one visitor's actions away"                 |
| DEV-03 | The deploy failed with Postgres error 42703 (a column the code expected did not exist)                                                                    | Vercel build                          | High     | Versioned migrations that run before every build; CI fails when the schema has no migration                   |
| DEV-04 | An error message appearing on blur pushed the button down mid-click, so the click missed                                                                  | E2E                                   | Medium   | Validate on submit, then while typing (GOV.UK pattern) · manage-pieces.spec                                   |
| DEV-05 | The ship dialog sent focus to the close button instead of the tracking code field                                                                         | E2E + axe                             | Medium   | `onOpenAutoFocus` to the input · seller-orders.spec                                                           |
| DEV-06 | Horizontal scroll at 320 px on the catalog and header                                                                                                     | E2E                                   | Medium   | Grid `minmax(0,1fr)`, header sizing · home.spec "small phones"                                                |
| DEV-07 | Two conflicting sets of hreflang links (HTTP header and HTML)                                                                                             | Lighthouse                            | Medium   | One source: page metadata                                                                                     |
| DEV-08 | Locale cookie readable by scripts; API CSP without `form-action`                                                                                          | OWASP ZAP                             | Low      | `HttpOnly` cookie, stricter API CSP · security.spec                                                           |
| DEV-09 | The character counter said "0/600" on a description that was already filled                                                                               | Screenshot review                     | Low      | Counter starts from the saved text · manage-pieces.spec. Root cause is in the Ipê Textarea, to be fixed there |
| DEV-10 | Missing `/favicon.ico` logged a console error                                                                                                             | Lighthouse                            | Low      | Favicon added                                                                                                 |
| DEV-11 | Double gap under the CEP field                                                                                                                            | Screenshot review                     | Low      | Message moved into the field's group                                                                          |
| DEV-12 | The migration test sometimes timed out on CI (Postgres in memory takes ~5 s to start)                                                                     | CI, flaky test                        | Low      | 30 s timeout for that file; ran 3× green                                                                      |

## How a new bug is reported

Through the repository's [bug template](../../.github/ISSUE_TEMPLATE/bug_report.yml): steps, expected, actual, environment, severity. A fix is not merged without a test that fails before it.
