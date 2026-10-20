# Job requirements map

Moringa is built to cover what real **junior frontend (React + Next.js)** job posts ask for. Each row points to where the requirement lives in this project. The links will be filled in as the code is written.

| What job posts ask for                       | Where it is in Moringa                                                                                                                                | Status |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Semantic HTML, CSS3, responsive layout       | Every screen, mobile first                                                                                                                            | ⏳     |
| Modern JavaScript and TypeScript             | The whole codebase, strict TypeScript · [strict `tsconfig.json`](../../tsconfig.json)                                                                 | 🚧     |
| React, hooks, reusable components            | The app UI, built on the Ipê Design System                                                                                                            | ⏳     |
| Next.js App Router                           | Routes, Server Components and Server Actions for the catalog and both panels · [`src/app/[locale]`](../../src/app/%5Blocale%5D)                       | 🚧     |
| Consuming REST APIs                          | Own `/api` routes (catalog, orders) and the public ViaCEP API                                                                                         | ⏳     |
| State management (Redux, Zustand or similar) | Zustand for the cart, TanStack Query for panel data with caching and optimistic UI                                                                    | ⏳     |
| Forms and validation                         | React Hook Form + Zod in the new-piece wizard and the address form                                                                                    | ⏳     |
| Jest and React Testing Library               | Vitest + React Testing Library (Jest-compatible API), TDD on the cart logic · [`src/**/*.test.ts(x)`](../../src/lib/order-status.test.ts)             | 🚧     |
| Cypress or similar E2E                       | Playwright, with buyer and seller sessions in the same test · [`e2e/`](../../e2e/home.spec.ts)                                                        | 🚧     |
| Git, branches and pull requests              | PR template, Conventional Commits, code review on every change · [PR template](../../.github/pull_request_template.md), commitlint                    | 🚧     |
| Agile, sprints                               | GitHub Projects board, issues from the [backlog](./BACKLOG.md), one-week sprints · [Project board](https://github.com/users/rayssarrsilva/projects/4) | 🚧     |
| CI/CD                                        | GitHub Actions and Vercel preview deploys on every pull request · [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)                        | 🚧     |
| Nice to have: e-commerce                     | Full shop with cart, Stripe Checkout (test mode) and order lifecycle                                                                                  | ⏳     |
| Nice to have: SEO                            | Metadata, Open Graph, sitemap, structured data for products                                                                                           | ⏳     |
| Nice to have: accessibility                  | WCAG 2.2 AA, axe in Playwright, manual NVDA checks                                                                                                    | ⏳     |
| Nice to have: Core Web Vitals                | Lighthouse CI budget on every pull request                                                                                                            | ⏳     |
| Nice to have: design systems                 | Ipê, published on npm by the same author                                                                                                              | ✅     |
| Nice to have: i18n                           | next-intl, `/pt` and `/en` routes · [`messages/`](../../messages) and [`src/i18n`](../../src/i18n)                                                    | 🚧     |
| Nice to have: Node.js                        | API routes and the Stripe webhook                                                                                                                     | ⏳     |
| Discovery and UX                             | [Brief](./BRIEF.md), [personas](./PERSONAS.md), FigJam flows, Figma screens                                                                           | ✅     |

Sources used to build this list: junior frontend postings on Indeed Brasil, Codilar and hackajob (October 2026).

🚧 = foundation in place, grows with each feature. ✅ = done. ⏳ = planned.
