# Threat model

**Method:** STRIDE, per the [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html).
**Checked against:** OWASP Top 10 (2021) and ASVS 4.0 level 2.
**Last review:** October 2026, day 12 of the project.

## What we protect

| Asset                               | Why it matters                                              |
| ----------------------------------- | ----------------------------------------------------------- |
| Buyers' names, emails and addresses | Personal data (LGPD). One visitor must never see another's. |
| Orders and their status             | A buyer or maker acting on someone else's order.            |
| Prices and stock                    | Paying less than the real price, or selling what is gone.   |
| The maker's catalog                 | A visitor changing what everyone else sees.                 |
| Secrets (database, Stripe, Auth.js) | Full control of the data and the payments.                  |

## Trust boundaries

```
Browser ──HTTPS──▶ Vercel (proxy.ts → pages, Server Actions, /api) ──▶ Neon Postgres
                          ▲                         │
          Stripe webhook ─┘ (signed)                └──▶ Stripe Checkout (test mode)
Browser ──HTTPS──▶ ViaCEP (address from the CEP, read-only)
```

## Threats and what stops them

| STRIDE                     | Threat                                                 | Control                                                                                                                                                                                    | Where                                                              |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| **S**poofing               | Sign in as someone else                                | Auth.js JWT session in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie; demo accounts tied to a per-browser device id                                                                       | [`src/auth.ts`](../../src/auth.ts)                                 |
| Spoofing                   | Fake "payment succeeded"                               | Webhook signature checked on the raw body; the order is only marked paid from Stripe's event                                                                                               | [`api/stripe/webhook`](../../src/app/api/stripe/webhook/route.ts)  |
| **T**ampering              | Change the price in the browser                        | The server re-prices the bag from the database; the browser only sends slugs and quantities                                                                                                | [`pricing.ts`](../../src/lib/checkout/pricing.ts)                  |
| Tampering                  | Edit another maker's piece, or the public demo pieces  | Ownership checked in every query; demo makers only edit what their browser created                                                                                                         | [`seller/db-repository.ts`](../../src/lib/seller/db-repository.ts) |
| Tampering                  | Cross-site request forgery                             | `SameSite=Lax` cookies; Server Actions' origin check (Next.js); `Sec-Fetch-Site`/`Origin` check on every POST route                                                                        | [`guard.ts`](../../src/lib/security/guard.ts)                      |
| Tampering                  | Skip an order step (e.g. "delivered" before "shipped") | One state machine on the server decides every transition and who may make it                                                                                                               | [`order-status.ts`](../../src/lib/order-status.ts)                 |
| **R**epudiation            | "I never shipped it"                                   | Each step stores when it happened, and only one role may take it (the maker ships, the buyer confirms), so the step itself says who acted; shipping also needs the carrier's tracking code | [`orders/timeline.ts`](../../src/lib/orders/timeline.ts)           |
| **I**nformation disclosure | Guess order codes to read addresses                    | Guest lookup needs code **and** email; same answer for "wrong" and "not yours"; 10 tries per 10 minutes                                                                                    | [`api/orders/lookup`](../../src/app/api/orders/lookup/route.ts)    |
| Information disclosure     | Cross-site scripting steals data                       | CSP with a per-request nonce and `strict-dynamic`, no `unsafe-eval`, no inline script; React escapes output; JSON-LD escapes `<`                                                           | [`headers.ts`](../../src/lib/security/headers.ts)                  |
| Information disclosure     | Clickjacking, referrer leaks, sniffing                 | `frame-ancestors 'none'`, `X-Frame-Options`, `Referrer-Policy`, `nosniff`, HSTS preload, COOP                                                                                              | [`next.config.ts`](../../next.config.ts)                           |
| Information disclosure     | Secrets in the repo                                    | Only in environment variables; GitHub secret scanning with push protection; live Stripe keys refused in code                                                                               | [`stripe.ts`](../../src/lib/stripe.ts)                             |
| **D**enial of service      | Scripted sign-ins or checkouts                         | Rate limits stored in Postgres, shared by every server instance; `429` with `Retry-After`                                                                                                  | [`rate-limit.ts`](../../src/lib/security/rate-limit.ts)            |
| **E**levation of privilege | A buyer calls the maker API                            | Role checked on the server in every maker route and action                                                                                                                                 | [`seller/viewer.ts`](../../src/lib/seller/viewer.ts)               |
| Elevation of privilege     | A compromised dependency or workflow                   | Lockfile + `npm ci`; Dependabot; `npm audit` gate; CodeQL; actions pinned by commit; workflows with read-only token                                                                        | [`.github`](../../.github)                                         |

## Accepted risks

- **Inline style attributes** (`style-src-attr 'unsafe-inline'`): used for data-driven colours and chart heights. They cannot run code, and `img-src 'self'` limits what a `url()` could reach. `<style>` elements still need the nonce.
- **Rate limits by IP:** people behind one shared IP (a school, a company) share a limit. The limits are generous for people and low for scripts.
- **No separate audit log.** The order timeline records when each step happened; a full audit trail (user id, IP hash) would come before real money moves.
- **Demo accounts are public on purpose.** Their data lives 7 days, scoped to one browser.
- **ZAP exceptions** (in [`.zap/baseline.yaml`](../../.zap/baseline.yaml)): the "PII" match is Stripe's public test card, shown on purpose; "no anti-CSRF token" points at the catalog's GET filter form, which changes nothing.

## Dependency alerts with no fix

`npm audit --omit=dev` (what ships to users) has no findings, and CI blocks any High or Critical there. Development tools are handled like this:

- **Fixed by forcing a safe version** (`overrides` in `package.json`): `tmp`, `basic-ftp` and `uuid` inside Lighthouse CI, and `esbuild` inside drizzle-kit. Lint, migrations, unit tests and Lighthouse CI were run again with the forced versions.
- **No patched version exists yet**, so the alerts are dismissed in GitHub with the reason below, and checked again when Dependabot opens an update:

| Package                         | Advisory                                                                                                                                                                   | Reaches it                           | Why it is not exploitable here                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `braces` ≤ 3.0.3 (High)         | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), denial of service on crafted patterns                                                            | ESLint config of Next.js             | Only expands the project's own glob patterns while linting; never sees outside input                 |
| `extract-zip` ≤ 2.0.1 (High)    | [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv), [GHSA-7pqw-9j4j-h8q3](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3), symlink path traversal | Puppeteer inside Lighthouse CI       | Only unzips a browser Puppeteer downloads; Lighthouse CI here uses the Chrome already on the machine |
| `sprintf-js` ≤ 1.1.3 (Moderate) | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), denial of service on unbounded precision                                                         | Argument parser inside Lighthouse CI | Formats the tool's own help and error messages, not outside input                                    |

## How it is verified

| Check                                                                        | When                          | Result                    |
| ---------------------------------------------------------------------------- | ----------------------------- | ------------------------- |
| Unit and integration tests for limits, origin checks, CSP and `security.txt` | Every pull request            | ✅                        |
| Playwright: headers on pages, API and files; no CSP violation in the browser | Every pull request            | ✅                        |
| OWASP ZAP baseline (spider + passive rules)                                  | Every pull request            | 0 high · 0 medium · 0 low |
| CodeQL `security-extended` (TypeScript and Actions)                          | Every pull request and weekly | —                         |
| `npm audit --omit=dev --audit-level=high`                                    | Every pull request            | 0 vulnerabilities         |
| Mozilla HTTP Observatory · securityheaders.com                               | After deploy                  | —                         |
