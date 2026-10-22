# Test summary report · release 1.0

October 22, 2026 · following the [test plan](./TEST-PLAN.md).

## Result

**Automated and exploratory testing: exit criteria met.** The manual checklist on the live site is the last step before calling the release done.

| Exit criterion                         | Target                                               | Result                                                                            |
| -------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Automated tests on CI                  | 100% pass, none skipped                              | **179** unit and integration · **158** end to end (mobile and desktop) · all pass |
| Open bugs of severity High or Critical | 0                                                    | **0** (BUG-001 fixed with regression tests)                                       |
| Lighthouse                             | a11y 100 · SEO 100 · perf ≥ 90 · best practices ≥ 95 | a11y 100 · SEO 100 · best practices 100 · perf 90–100                             |
| Accessibility (axe, WCAG 2.2 AA)       | 0 violations                                         | **0**, every page, both themes, both viewports                                    |
| OWASP ZAP baseline                     | No Medium or High                                    | 0 high · 0 medium · 0 low                                                         |
| `npm audit` (production)               | No High or Critical                                  | 0 vulnerabilities                                                                 |
| Security headers on the live site      | —                                                    | Mozilla Observatory **A+** (135/100) · securityheaders.com **A+**                 |
| Exploratory findings                   | Fixed or explained                                   | 1 bug fixed · 1 false alarm explained                                             |
| Manual checklist                       | All pass                                             | ⏳ [7 checks](./MANUAL-CHECKLIST.md) waiting                                      |

## Coverage

All 15 Must and Should stories have test cases; 49 of the 58 test cases are automated (the other 9: 6 manual, 3 exploratory) and run on every pull request. See the [traceability matrix](./TEST-CASES.md).

## What this cycle changed

- **BUG-001 (High):** the bag and the pay button could show an old price after a maker edited it. The bag now updates itself and says what changed; the server refuses to charge a price the buyer did not see.
- **Faster pipeline:** one build shared by the E2E, Lighthouse and ZAP jobs instead of four builds; the Next.js build and the Playwright browser are cached between runs; the E2E suite runs in two shards at the same time, merged into one HTML report.

## Lessons

- **Tampering pointed at a real bug.** The tampered bag could not cost money, but asking "why does the bag trust this number?" found the honest case: a maker changing a price.
- **Write down false alarms.** One script read a page before the sign-in finished. Logging the cause saves the next person the same hour.
- **A new feature changes old assumptions.** Saving prices in the bag was fine until makers could edit prices (US-15). New stories now get a short "what does this make untrue?" check during refinement.
