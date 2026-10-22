<div align="center">

# 🏺 Moringa

**An online fair for people who make things by hand in Brazil.**

**[Open the live site](https://moringa-silk.vercel.app/en)** · **English** · [Português](./README.pt-BR.md)

[![CI](https://github.com/rayssarrsilva/Moringa/actions/workflows/ci.yml/badge.svg)](https://github.com/rayssarrsilva/Moringa/actions/workflows/ci.yml)
[![CodeQL](https://github.com/rayssarrsilva/Moringa/actions/workflows/codeql.yml/badge.svg)](https://github.com/rayssarrsilva/Moringa/actions/workflows/codeql.yml)
[![Mozilla Observatory: A+](<https://img.shields.io/badge/Mozilla_Observatory-A%2B_(135%2F100)-2e7d4f>)](https://developer.mozilla.org/en-US/observatory/analyze?host=moringa-silk.vercel.app)
[![Security headers: A+](https://img.shields.io/badge/securityheaders.com-A%2B-2e7d4f)](https://securityheaders.com/?q=https%3A%2F%2Fmoringa-silk.vercel.app%2F&followRedirects=on)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

<img src="./docs/screenshots/home-desktop.jpg" alt="Moringa home page: the headline 'Handmade in Brazil, with the story of who made it', a search field, region filters and the week's new pieces." width="860">

</div>

---

## Why "Moringa"?

A moringa is the handmade clay jar that keeps water cool. In many Brazilian homes, it is where the glass of water offered to every guest comes from. This project carries the same idea: welcome people, and make room for the hands behind each piece.

## What it is

A marketplace with two sides, each with its own panel:

- **Buyers** find pieces by region, material and price, read the story of who made them, save favorites, pay through Stripe (test mode, card or Pix), follow every step of the order and review what arrived.
- **Makers** open a shop with their story, list pieces in a guided form, edit or pause them, see their sales and ship orders. When they add a tracking code, the buyer sees it right away.

Everything works in Portuguese and English, in a light and a dark theme, on a phone or a desktop, with a keyboard or a screen reader.

Built with the [Ipê Design System](https://github.com/rayssarrsilva/Ipe), also mine.

## Try it

No sign-up: each demo account is one click, and what you do stays in your browser for 7 days.

| Who                      | Where                                                 | What to try                                                                                   |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Marina**, buyer        | [/en/conta](https://moringa-silk.vercel.app/en/conta) | Orders in every state, the live timeline, "I got my order", reviews                           |
| **Dona Lúcia**, ceramist | [/en/loja](https://moringa-silk.vercel.app/en/loja)   | Sales chart (with a table view), ship an order with a tracking code, edit or pause a piece    |
| **A new maker**          | [/en/loja](https://moringa-silk.vercel.app/en/loja)   | Open a shop from zero and publish the first piece                                             |
| **Anyone**               | [/en/pecas](https://moringa-silk.vercel.app/en/pecas) | Filter, add to the bag, pay with the test card `4242 4242 4242 4242`, any future date and CVC |

## Quality at a glance

Measured on the live site and on every pull request. Last checked on October 22, 2026.

| Area                  | Result                                                                                                                                                                                                                                                               | How it is checked                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Performance           | Lighthouse 90–100 on mobile (slow 4G simulated)                                                                                                                                                                                                                      | [Lighthouse CI](./lighthouserc.cjs), 4 pages × 3 runs, on every PR                                                |
| Accessibility         | Lighthouse 100 · 0 axe violations · WCAG 2.2 AA                                                                                                                                                                                                                      | axe on every page in both themes, plus keyboard and focus tests in Playwright; screen reader pass in the QA cycle |
| SEO                   | Lighthouse 100                                                                                                                                                                                                                                                       | hreflang, canonical, Open Graph images, sitemap, Product and Review JSON-LD                                       |
| Security headers      | [Mozilla Observatory **A+** (135/100, 12/12 tests)](https://developer.mozilla.org/en-US/observatory/analyze?host=moringa-silk.vercel.app) · [securityheaders.com **A+**](https://securityheaders.com/?q=https%3A%2F%2Fmoringa-silk.vercel.app%2F&followRedirects=on) | Third-party scanners on the live site                                                                             |
| Vulnerability scan    | OWASP ZAP baseline: 0 high · 0 medium · 0 low                                                                                                                                                                                                                        | [ZAP plan](./.zap/baseline.yaml) on every PR                                                                      |
| Code and dependencies | CodeQL `security-extended` · `npm audit`: 0 vulnerabilities                                                                                                                                                                                                          | [CodeQL](./.github/workflows/codeql.yml), Dependabot                                                              |
| Tests                 | 173 unit and integration · 150 end-to-end (mobile and desktop)                                                                                                                                                                                                       | Vitest, PGlite (real Postgres), Playwright                                                                        |

## Screenshots

|                                                                                                                                                                                              |                                                                                                                                                                                                         |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|  <img src="./docs/screenshots/piece-desktop.jpg" alt="Piece page: clay jar with price, stock, shipping, the maker's story and reviews." width="420"><br>Piece page, with the maker's story   | <img src="./docs/screenshots/order-timeline-desktop.jpg" alt="Order timeline: paid, preparing, shipped with a tracking code, and delivered still to come." width="420"><br>Order timeline, updated live |
| <img src="./docs/screenshots/maker-panel-dark.jpg" alt="Maker panel in the dark theme: orders to ship, sales in 30 days and a weekly revenue chart." width="420"><br>Maker panel, dark theme |                            <img src="./docs/screenshots/maker-orders-dark.jpg" alt="Maker orders board in the dark theme, grouped by status." width="420"><br>Orders to ship                            |
|                         <img src="./docs/screenshots/catalog-mobile.jpg" alt="Catalog on a phone: filters and a grid of pieces." width="220"><br>Catalog on a phone                          |                      <img src="./docs/screenshots/checkout-mobile.jpg" alt="Checkout on a phone: name, email and address filled from the CEP." width="220"><br>Checkout on a phone                      |

## Discovery

- [Product brief](./docs/discovery/BRIEF.md)
- [Personas](./docs/discovery/PERSONAS.md)
- [Backlog with acceptance criteria](./docs/discovery/BACKLOG.md)
- [Job requirements map](./docs/discovery/JOB-REQUIREMENTS.md)
- [FigJam: journeys, order lifecycle and sitemap](https://www.figma.com/board/Hfz7wLzJGGltovUDZtSSAc)

## Design

- [Wireframes with UX notes](https://www.figma.com/design/vp371wwKQRWh4elNOk1S1D)
- [High-fidelity screens and clickable prototype](https://www.figma.com/design/o3irY2VOsGjlLt3fiAPTU0), built only with Ipê components
- [Design decisions](./docs/design/README.md)

## Stack

| Layer             | Tools                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- |
| App               | Next.js 16 (App Router, Server Components, Server Actions) · React 19 · TypeScript (strict) |
| UI                | Ipê Design System 2.0 · Tailwind CSS 4 · next-intl (pt-BR, en)                              |
| Data              | Postgres on Neon · Drizzle ORM with versioned migrations · TanStack Query · Zustand         |
| Forms             | React Hook Form · Zod (one schema in the browser and on the server)                         |
| Auth and payments | Auth.js v5 (JWT) · Stripe Checkout in test mode (card and Pix) with a signed webhook        |
| Quality           | Vitest · Testing Library · PGlite · Playwright · axe · Lighthouse CI · OWASP ZAP · CodeQL   |
| Delivery          | GitHub Actions · Dependabot · Vercel                                                        |

## Run it locally

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL from Neon
npm run db:migrate           # create or update the tables
npm run db:seed              # add the demo makers and pieces
npm run dev                  # http://localhost:3000
```

| Command             | What it does                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `npm test`          | Unit and component tests (Vitest + Testing Library)                                 |
| `npm run test:e2e`  | End-to-end and axe accessibility tests in Chromium, mobile and desktop (Playwright) |
| `npm run lint`      | ESLint with zero warnings allowed                                                   |
| `npm run typecheck` | TypeScript in strict mode                                                           |
| `npm run build`     | Production build                                                                    |

### Without a database

Skip the `DATABASE_URL` and the app runs on the built-in sample catalog. CI uses this mode, so tests never depend on a live database.

### Catalog API

`GET /api/pieces` takes the same params as the catalog page, for example `/api/pieces?regiao=nordeste&material=palha&preco_max=150&ordem=menor-preco`. `GET /api/pieces/{slug}` returns one piece, or a JSON 404.

### Demo account

The buyer area at `/pt/conta` has a one-click demo login as **Marina**, with orders in every state (paid, shipped with a tracking code, delivered). There are no passwords: a demo login only sees demo data. On Vercel, set `AUTH_SECRET` (run `npx auth secret` to generate one).

### Database migrations

The schema lives in `src/db/schema.ts`. After changing it, run `npm run db:generate` and commit the new file in `drizzle/`. CI fails if the schema and the migrations disagree (`npm run db:check`).

Every Vercel build runs `npm run db:migrate` before `next build`, so the database always matches the code being deployed. Migrations are additive (add first, remove in a later release), so the live site keeps working during a deploy. The first databases were created with `db:push`; the migrate script detects that and records the baseline instead of recreating tables.

### Tests

- `npm test` runs unit, component and database integration tests. The integration tests start a real Postgres in memory with [PGlite](https://pglite.dev), create the schema from `src/db/schema.ts` and run the same Drizzle queries the app sends to Neon.
- `npm run test:e2e` runs Playwright on mobile and desktop, with axe accessibility checks in both themes.
- `npm run lhci` builds the site and runs [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) three times on four pages (home, catalog, piece, shop in English). The pull request fails below these scores (latest results in [Quality at a glance](#quality-at-a-glance)):

| Performance | Accessibility | Best practices | SEO |
| :---------: | :-----------: | :------------: | :-: |
|    ≥ 90     |      100      |      ≥ 95      | 100 |

### Payments (Stripe test mode)

Without `STRIPE_SECRET_KEY`, checkout runs as a demo and goes straight to the confirmation page. To try the real flow:

1. Create a Stripe account, stay in **test mode**, and copy the secret key (`sk_test_…`) into `.env.local`. Live keys are refused on purpose.
2. In Dashboard → Settings → Payment methods, turn on **Cards** and **Pix**.
3. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and copy the `whsec_…` secret into `STRIPE_WEBHOOK_SECRET`.
4. Pay with the test card `4242 4242 4242 4242`, any future date and any CVC. Use `4000 0000 0000 0002` to see a declined card.

Each maker gets their own order. Orders start as `pending` and the webhook moves them to `paid` (card right away, Pix when the bank confirms) or `canceled` (Pix expired), following the order lifecycle in FigJam.

### Workflow

- Every change goes through a branch and a pull request. CI runs lint, types, unit tests, build, E2E, Lighthouse, the ZAP scan, `npm audit` and CodeQL on each one.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) and are checked by commitlint.
- Work is planned on the [project board](https://github.com/users/rayssarrsilva/projects/4) in one-week sprints.

## Security

Built against the [OWASP Top 10](https://owasp.org/Top10/) and [ASVS level 2](https://owasp.org/www-project-application-security-verification-standard/). The [threat model](./docs/security/THREAT-MODEL.md) lists each risk, what stops it and where in the code.

- **Content Security Policy with a fresh nonce on every request.** Only this response's scripts run: no inline script, no `eval`, no other origins, no framing.
- **HSTS (preload), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`** on every page, API route and file.
- **Rate limits** on sign-in, checkout, guest order tracking and every write, stored in Postgres so they hold across serverless instances. The client is a salted hash of the IP, never the IP itself.
- **Origin checks** on every POST route, on top of `SameSite` cookies and the built-in check of Server Actions.
- **Server-side rules:** prices re-calculated, ownership checked in every query, one order state machine, signed and idempotent Stripe webhook.
- **Supply chain:** CodeQL, Dependabot, `npm audit` gate, GitHub Actions pinned by commit, read-only workflow token.
- Found a problem? See [SECURITY.md](./SECURITY.md) or [`/.well-known/security.txt`](https://datatracker.ietf.org/doc/html/rfc9116).

| Check                                                                                                                        | Result                                   |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [Mozilla HTTP Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=moringa-silk.vercel.app), live site  | **A+** · 135/100 · 12 of 12 tests passed |
| [securityheaders.com](https://securityheaders.com/?q=https%3A%2F%2Fmoringa-silk.vercel.app%2F&followRedirects=on), live site | **A+**                                   |
| [OWASP ZAP](https://www.zaproxy.org) baseline scan, every pull request                                                       | 0 high · 0 medium · 0 low                |
| `npm audit` (production dependencies)                                                                                        | 0 vulnerabilities                        |
| CSP violations in the browser (Playwright)                                                                                   | 0                                        |

## Author

Made with care by **Rayssa Roberta** · [LinkedIn](https://www.linkedin.com/in/rayssa-r-14936622a) · [Portfolio](https://portfoliorayssarrsilva.site)

## License

[MIT](./LICENSE)
