# Product brief · Moringa

> A moringa is the handmade clay jar that keeps water cool. In many Brazilian homes, it is where the glass of water offered to every guest comes from.

## Problem

People who make things by hand in Brazil (ceramists, weavers, woodworkers, seamstresses) mostly sell through Instagram DMs, WhatsApp and local fairs. That works, but it costs them time: answering the same questions, sending photos one by one, keeping track of who paid and what still needs to ship. Buyers, on their side, find a piece they love and then lose track of it, never know when it will arrive, and rarely learn who made it.

Big marketplaces solve the logistics but erase the person behind the piece.

## Proposal

An online fair where every piece carries the story of who made it, and where both sides have a clear, calm panel:

- **Buyers** discover pieces by region, material and price, pay in a few steps and follow their order until it arrives.
- **Makers** set up a shop with their story, list pieces in a guided form and ship orders from one place. When they mark an order as shipped, the buyer sees it immediately.

## Goals

| Goal                                   | How we will know                                                       |
| -------------------------------------- | ---------------------------------------------------------------------- |
| A buyer completes a purchase easily    | Checkout E2E test passes; a first-time user finishes it without help   |
| A maker lists a piece without help     | New-piece wizard completed in under 3 minutes in a usability check     |
| Both sides always know an order status | Every status change shows up on the other side without a page refresh  |
| Nobody is left out                     | WCAG 2.2 AA, keyboard and screen reader checks pass on every main flow |
| It feels fast on a mid-range phone     | Lighthouse performance ≥ 90 and good Core Web Vitals on mobile         |

## Scope

**In (MVP):** catalog with search and filters, piece and shop pages, favorites, cart, Stripe Checkout in test mode, buyer area (orders, timeline, tracking, reviews, addresses), seller onboarding, new-piece wizard, seller area (overview, orders, pieces, reviews), sign-in, Portuguese and English, light and dark themes.

**Out (for now):** real payments and payouts, shipping price calculation, chat between buyer and maker, mobile app, admin moderation.

## Constraints

- Free tiers only (Vercel, Neon, Stripe test mode, Vercel Blob).
- Built on the Ipê Design System (`@rayssarrsilva/ipe`).
- Every screen bilingual from day one.

## Discovery artifacts

- [Personas](./PERSONAS.md)
- [Backlog with acceptance criteria](./BACKLOG.md)
- [Job requirements map](./JOB-REQUIREMENTS.md)
- FigJam: buyer journey, seller journey, order lifecycle and sitemap — <https://www.figma.com/board/Hfz7wLzJGGltovUDZtSSAc>

## Assumptions to validate

The personas are proto-personas, built from public information about how makers sell today. Before the Figma screens are final, the plan is to talk to at least 3 real makers and 3 buyers and update this brief with what they say.
