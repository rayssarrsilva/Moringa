<div align="center">

# 🏺 Moringa

**An online fair for people who make things by hand in Brazil.**

**English** · [Português](./README.pt-BR.md)

_In progress · day 4 of 12: project setup_

</div>

---

## Why "Moringa"?

A moringa is the handmade clay jar that keeps water cool. In many Brazilian homes, it is where the glass of water offered to every guest comes from. This project carries the same idea: welcome people, and make room for the hands behind each piece.

## What it is

A marketplace with two sides, each with its own panel:

- **Buyers** find pieces by region, material and price, read the story of who made them, pay through Stripe (test mode) and follow every step of the order.
- **Makers** open a shop with their story, list pieces in a guided form and ship orders. When they add a tracking code, the buyer sees it right away.

Built with the [Ipê Design System](https://github.com/rayssarrsilva/Ipe).

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

Next.js (App Router) · TypeScript · Ipê + Tailwind CSS v4 · next-intl · Auth.js · Drizzle + Postgres (Neon) · Zustand · TanStack Query · React Hook Form + Zod · Stripe Checkout · Vitest + Testing Library · Playwright · Lighthouse CI · GitHub Actions · Vercel

## Run it locally

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL from Neon
npm run db:push              # create the tables
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

### Payments (Stripe test mode)

Without `STRIPE_SECRET_KEY`, checkout runs as a demo and goes straight to the confirmation page. To try the real flow:

1. Create a Stripe account, stay in **test mode**, and copy the secret key (`sk_test_…`) into `.env.local`. Live keys are refused on purpose.
2. In Dashboard → Settings → Payment methods, turn on **Cards** and **Pix**.
3. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and copy the `whsec_…` secret into `STRIPE_WEBHOOK_SECRET`.
4. Pay with the test card `4242 4242 4242 4242`, any future date and any CVC. Use `4000 0000 0000 0002` to see a declined card.

Each maker gets their own order. Orders start as `pending` and the webhook moves them to `paid` (card right away, Pix when the bank confirms) or `canceled` (Pix expired), following the order lifecycle in FigJam.

### Workflow

- Every change goes through a branch and a pull request. CI runs lint, types, unit tests, build and E2E on each one.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) and are checked by commitlint.
- Work is planned on the [project board](https://github.com/users/rayssarrsilva/projects/4) in one-week sprints.

## Author

Made with care by **Rayssa Roberta** · [LinkedIn](https://www.linkedin.com/in/rayssa-r-14936622a) · [Portfolio](https://portfoliorayssarrsilva.site)

## License

[MIT](./LICENSE)
