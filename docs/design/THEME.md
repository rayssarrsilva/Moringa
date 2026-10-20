# Moringa theme

Moringa uses Ipê 2.0, which already ships pure white and pure black surfaces. Moringa's theme only changes the actions: a solid forest green for the main action with white text, and black or white for secondary actions and focus. It remaps four semantic tokens in [`src/app/theme.css`](../../src/app/theme.css); no component was changed, which is what semantic tokens are for.

> History: Moringa started on Ipê 1.0, whose cream palette did not fit. The fix first lived here as a full override, then moved into Ipê itself as the 2.0 neutral palette, and this file shrank to the Moringa-specific choices.

## Contrast (WCAG 2.2)

| Pair                                | Light             | Ratio  | Dark              | Ratio |
| ----------------------------------- | ----------------- | ------ | ----------------- | ----- |
| Text on canvas                      | #0A0A0A / #FFF    | 19.8:1 | #FFF / #000       | 21:1  |
| Secondary text on canvas            | #555555 / #FFF    | 7.5:1  | #A3A3A3 / #000    | 8.3:1 |
| Secondary text on surface           | #555555 / #F4F4F4 | 6.8:1  | #A3A3A3 / #141414 | 7.3:1 |
| Primary button text                 | #FFF / #1F5A3A    | 8.1:1  | #FFF / #2E7D4F    | 5.1:1 |
| Primary button against canvas (3:1) | #1F5A3A / #FFF    | 8.1:1  | #2E7D4F / #000    | 4.2:1 |
| Form control border (3:1)           | #767676 / #FFF    | 4.5:1  | #8A8A8A / #000    | 6.1:1 |
| Danger text                         | #B8431F / #FFF    | 5.4:1  | #F08A62 / #000    | 8.5:1 |

Every page is also checked with axe-core in the Playwright tests, in both languages.
