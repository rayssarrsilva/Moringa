# Design · Moringa

| Artifact                              | Link                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Journeys, order lifecycle and sitemap | [FigJam](https://www.figma.com/board/Hfz7wLzJGGltovUDZtSSAc)                                                  |
| Wireframes with UX notes (14 screens) | [Figma · Moringa](https://www.figma.com/design/vp371wwKQRWh4elNOk1S1D)                                        |
| High-fidelity screens and prototype   | [Figma · Ipê Design System, section "Moringa · Screens"](https://www.figma.com/design/o3irY2VOsGjlLt3fiAPTU0) |

## Process

1. **Discovery:** brief, proto-personas and journeys ([docs/discovery](../discovery)).
2. **Wireframes:** grayscale, mobile first, one yellow note per screen explaining the decision and linking the user story (US-01, US-08…).
3. **High fidelity:** the same screens rebuilt only with Ipê components, variables and text styles. Nothing is drawn with a raw hex color except photo placeholders.
4. **Prototype:** two flows in Figma (open the file and press Present):
   - _Buyer · purchase:_ home → piece → bag → address → confirmation → order timeline
   - _Seller · ship an order:_ overview → ship dialog with tracking code

## Screens

| #   | Screen                    | Ipê components used                  | Story |
| --- | ------------------------- | ------------------------------------ | ----- |
| S01 | Home                      | Input, Button (ghost, secondary)     | US-01 |
| S03 | Piece                     | Badge, Button, Tabs                  | US-02 |
| S04 | Bag                       | Button, Toast                        | US-05 |
| S05 | Checkout · address        | Input (focus, required, hint), Badge | US-06 |
| S06 | Order confirmed           | Button                               | US-07 |
| S08 | Order timeline            | Badge, Button                        | US-08 |
| S10 | New piece · price error   | Input (error state), Button          | US-12 |
| S11 | Shop overview             | Badge, Button                        | US-13 |
| S12 | Ship an order             | Dialog, Input, Button                | US-14 |
| D1  | Catalog · desktop         | Checkbox, Badge, Button              | US-01 |
| D2  | Seller overview · desktop | Badge, Button                        | US-13 |

## Decisions worth knowing

- **Story before specs.** On the piece page, the maker block comes right after the buy buttons.
- **Total before sign-in.** The bag shows shipping and total before asking for an account.
- **One order per maker.** A bag with two makers becomes two orders, because each maker ships on their own.
- **Status is never color only.** Timeline steps and badges always carry text, so they work with screen readers and Windows High Contrast.
- **Charts have a table.** The seller sales chart has a "Show as table" toggle with the same numbers.
- **Plain words for makers.** "Ship today", not "Fulfillment queue".

## Design and code parity

The prototype covered the main flows before any code existed. Some screens were then designed directly in code, on the same Ipê components and tokens, and checked with axe and screenshots instead of a Figma round first. They are listed here so nobody mistakes them for gaps.

| Built in code after the prototype                        | Story | Based on                                    |
| -------------------------------------------------------- | ----- | ------------------------------------------- |
| Edit, pause and resume a piece; read-only example pieces | US-15 | S10 (new piece) form and the S11 piece list |
| Reviews on the piece page and the review form            | US-09 | S03 (piece) and S08 (order timeline)        |
| The maker's reviews                                      | US-16 | S11 (shop overview)                         |
| Favorites                                                | US-03 | S03 (piece) and the catalog grid            |
| Guest order tracking and the system status page          | US-08 | S08 (order timeline)                        |
| Dark theme in charcoal                                   | —     | [THEME.md](./THEME.md)                      |
| Rate-limit and error messages                            | —     | Ipê feedback tokens                         |

**Dark theme:** the charcoal dark theme was designed in code after the Figma screens. Its values and contrast checks live in [`theme.css`](../../src/app/theme.css) and [THEME.md](./THEME.md), which are the source of truth until the next Figma pass.

## Found while designing

- The Ipê Badge tones Success, Danger and Info lose their 16% tint when instanced in Figma and render as solid color with dark text. The coded component is not affected (it uses `color-mix`). Fixed by hand in these screens; to be fixed in the Ipê Figma library.
