# Test plan · Moringa

Based on the structure of ISO/IEC/IEEE 29119-3, trimmed to what a two-sided marketplace of this size needs.

|                  |                                                             |
| ---------------- | ----------------------------------------------------------- |
| Version          | 1.0 · October 22, 2026                                      |
| Author           | Rayssa Roberta                                              |
| Product          | Moringa, live at <https://moringa-silk.vercel.app>          |
| Build under test | `main` after the day 13 merge, plus the fixes in this cycle |

## 1. Scope

**In scope:** every story in the [backlog](../discovery/BACKLOG.md) marked Must or Should (US-01 to US-09, US-11 to US-16), in Portuguese and English, light and dark themes, mobile (Pixel 7, 320 px) and desktop (1440 px). Also the API routes, security headers, rate limits and the Stripe test-mode payment.

**Out of scope:** US-10 (saved addresses, a "Could" left out of this release), real money (Stripe stays in test mode), browsers other than Chromium in automation (Firefox and Safari are covered by the manual checklist), load testing.

## 2. Approach

The [test pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), plus exploration where scripts are blind.

| Level          | What it proves                                                                           | Tools                                         | Runs             |
| -------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------- |
| Unit           | Rules with no UI: bag, pricing, order state machine, rate limits, CSP                    | Vitest                                        | Every PR         |
| Integration    | The same SQL the app sends to Neon, on a real Postgres                                   | Vitest + PGlite                               | Every PR         |
| Component      | Forms and interactive pieces in isolation                                                | Testing Library                               | Every PR         |
| End to end     | Whole journeys, two viewports, both themes, axe on every page                            | Playwright, 2 shards                          | Every PR         |
| Non-functional | Performance, accessibility, SEO, security headers, vulnerabilities                       | Lighthouse CI, OWASP ZAP, CodeQL, `npm audit` | Every PR         |
| Exploratory    | What nobody thought to script: odd input, tampering, reflow, keyboard                    | Session-based (charters, time-boxed)          | Once per release |
| Manual         | What needs a person or the real environment: screen reader, live payment, other browsers | [Manual checklist](./MANUAL-CHECKLIST.md)     | Once per release |

## 3. Risks that shape the plan

| Risk                                          | Impact                               | Where testing goes                                             |
| --------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| Charging a price different from the one shown | High: money and trust (CDC, art. 30) | Pricing unit tests, checkout E2E, exploratory charter S2       |
| One visitor seeing another's data             | High: LGPD                           | Demo isolation integration tests, API without session (S3)     |
| A maker unable to ship                        | High: the sale stops                 | Order state machine unit tests, ship dialog E2E                |
| Excluding keyboard or screen reader users     | High: WCAG 2.2 AA is a project goal  | axe in every E2E, keyboard charter S5, screen reader checklist |
| Payment webhook delivered twice               | Medium                               | Integration test on a real Postgres: stock taken once          |
| Slow pages on 4G                              | Medium                               | Lighthouse budget ≥ 90                                         |

## 4. Environments

| Environment                                   | Data                                            | Used for                               |
| --------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| CI (GitHub Actions, Ubuntu)                   | Sample catalog, no database, memory rate limits | Every automated level                  |
| Local production build                        | Sample catalog                                  | Exploratory sessions                   |
| Production (Vercel + Neon + Stripe test mode) | Seeded demo data, per-browser demo sessions     | Manual checklist, third-party scanners |

## 5. Entry and exit criteria

**Entry:** the build passes lint, types and the schema check; the feature's story has acceptance criteria.

**Exit (release):**

- 100% of automated tests pass on CI, with no test marked as skipped.
- No open bug of severity High or Critical.
- Lighthouse accessibility and SEO 100, performance ≥ 90, best practices ≥ 95.
- OWASP ZAP baseline with no Medium or High alert; `npm audit` with no High or Critical.
- Every exploratory finding either fixed with a regression test, or explained.

## 6. Severity and priority

| Severity | Meaning                                                               |
| -------- | --------------------------------------------------------------------- |
| Critical | Data loss, money taken wrongly, security breach; no workaround        |
| High     | A main journey is broken or misleading; the workaround is not obvious |
| Medium   | A journey works with friction, or a rule is wrong in an edge case     |
| Low      | Cosmetic, or only in an unlikely situation                            |

Priority says how soon to fix (P1 this release, P2 next, P3 when convenient), and can differ from severity.

## 7. Deliverables

- [Test cases and traceability matrix](./TEST-CASES.md)
- [Exploratory session notes](./EXPLORATORY-SESSIONS.md)
- [Bug reports](./BUG-REPORTS.md)
- [Manual checklist](./MANUAL-CHECKLIST.md)
- [Test summary report](./TEST-SUMMARY.md)
