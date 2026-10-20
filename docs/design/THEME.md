# Moringa theme

Moringa uses Ipê 2.0, which already ships pure white and pure black surfaces. Moringa's theme only changes the actions: a solid forest green for the main action with white text, and black or white for secondary actions and focus. It remaps four semantic tokens in [`src/app/theme.css`](../../src/app/theme.css); no component was changed, which is what semantic tokens are for.

> History: Moringa started on Ipê 1.0, whose cream palette did not fit. The fix first lived here as a full override, then moved into Ipê itself as the 2.0 neutral palette, and this file shrank to the Moringa-specific choices.

## Dark theme

The dark theme uses charcoal greys instead of pure black, in the spirit of Spotify's dark mode: `#121212` for the page, `#1E1E1E` for cards and `#282828` for raised surfaces. Pure black next to white text tires the eyes on long browsing sessions; charcoal keeps the contrast high without the glare.

The header has a theme button. Without a saved choice the site follows the device; the choice is saved in `localStorage` and applied by a small script in `<head>` before the first paint, so the page never flashes the other theme.

## Contrast (WCAG 2.2)

| Pair                                | Light             | Ratio  | Dark              | Ratio  |
| ----------------------------------- | ----------------- | ------ | ----------------- | ------ |
| Text on canvas                      | #0A0A0A / #FFF    | 19.8:1 | #FFF / #121212    | 18.7:1 |
| Secondary text on canvas            | #555555 / #FFF    | 7.5:1  | #B3B3B3 / #121212 | 8.9:1  |
| Secondary text on surface           | #555555 / #F4F4F4 | 6.8:1  | #B3B3B3 / #1E1E1E | 8.0:1  |
| Primary button text                 | #FFF / #1F5A3A    | 8.1:1  | #FFF / #2E7D4F    | 5.0:1  |
| Primary button against canvas (3:1) | #1F5A3A / #FFF    | 8.1:1  | #2E7D4F / #121212 | 3.7:1  |
| Form control border (3:1)           | #767676 / #FFF    | 4.5:1  | #8A8A8A / #121212 | 5.4:1  |
| Danger text                         | #B8431F / #FFF    | 5.4:1  | #F08A62 / #121212 | 7.6:1  |

Every page is also checked with axe-core in the Playwright tests, in both languages and both themes.
