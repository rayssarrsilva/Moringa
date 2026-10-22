# Exploratory testing sessions

Session-based test management ([SBTM](https://www.satisfice.com/download/session-based-test-management)): each session has a charter, a time box and notes. The sessions ran on October 22, 2026 against a local production build with the sample catalog, Chromium, assisted by Playwright scripts so that every observation can be repeated.

**Summary:** 8 charters, about 2 h. **1 bug found** (BUG-001, High), **1 false alarm** explained, everything else as expected.

| #   | Charter                                                                                           | Time   | Result                       |
| --- | ------------------------------------------------------------------------------------------------- | ------ | ---------------------------- |
| S1  | Explore the maker forms **with hostile and unusual input** to find injection or validation gaps   | 20 min | ✅ No injection, limits hold |
| S2  | Explore the **bag and checkout with tampered browser storage** to find ways to pay a wrong amount | 25 min | 🐞 BUG-001                   |
| S3  | Explore the **API without a session and with odd parameters** to find data leaks                  | 15 min | ✅                           |
| S4  | Explore **every page at 320 px** to find reflow failures (WCAG 1.4.10)                            | 10 min | ✅                           |
| S5  | Explore the home and header **with the keyboard only** to find lost or invisible focus            | 10 min | ✅                           |
| S6  | Explore **10 English pages** to find untranslated text                                            | 10 min | ✅                           |
| S7  | Explore **unknown addresses** to find wrong status codes                                          | 10 min | ✅                           |
| S8  | Explore **signed-in edge cases** (missing order, double clicks, wrong role)                       | 20 min | ✅ 1 false alarm             |

## Notes

### S1 · Hostile input in the new piece wizard

- Name `<img src=x onerror=alert(1)> Jarra "aspas" & 🏺`, description `<script>alert(2)</script> …`: published, shown as text on the maker's page; no dialog opened and no tag in the HTML. The emoji is kept.
- Price `-5`, `0`, `abc` and `99999999`: refused at the "Price and stock" step. `1.234,56` accepted as R$ 1.234,56, which is how a Brazilian maker would type it.
- **Verdict:** as expected. React escapes output; Zod checks every field again on the server.

### S2 · Tampered bag

- Added "Cesto de palha" (R$ 120, 3 in stock), then changed the saved bag to price R$ 0,01 and quantity 500.
- The bag page showed **R$ 0,01 × 500 = R$ 5** and a total of R$ 25. The checkout button said "Pagar R$ 25".
- Submitting: the server refused ("Alguns dados não passaram na verificação"), because it re-prices from the database and limits quantity to 99. **No money at risk.**
- Thinking about why the bag trusted the saved price led to the real problem: since US-15 a maker can change a price, so **a normal buyer, with no tampering, would see the old price on the pay button** and be charged the new one. → **BUG-001.**

### S3 · API without a session

- `GET /api/me/orders`, `GET /api/me/orders/{code}`, `GET /api/seller/orders`, `POST /api/seller/orders/{code}/shipped`: all **401**.
- `POST /api/orders/lookup` with a real code and a wrong email: **404**, the same answer as a wrong code (no enumeration).
- `GET /api/pieces?preco_min=abc&ordem=<x>`: 200 with the default query; bad values ignored.
- `GET /api/pieces/<script>`: JSON 404. The slug is echoed in the JSON message, which is harmless here (`Content-Type: application/json`, `nosniff`, CSP `default-src 'none'`). Noted, not a bug.

### S4 · 320 px

`/pt`, catalog, piece, bag, checkout, shop (EN), order tracking, account, maker landing, favorites and status: **0 px of horizontal overflow** on all 11.

### S5 · Keyboard only

First Tab lands on "Pular para o conteúdo". The next 25 stops follow the visual order (logo, menu, languages, theme, search, favorites, account, bag, then the content) and **all 25 have a visible focus ring**.

### S6 · Untranslated text

`/en`, catalog, piece, bag, account, maker landing, order tracking, favorites, status and shops: no Portuguese UI text and no Portuguese titles. Makers' names and stories stay in their own words on purpose.

### S7 · Unknown addresses

`/pt/pecas/nao-existe` and `/en/lojas/nope`: 404 with the localized "not at the fair" page. `/xx`: 404 with the bilingual fallback.

### S8 · Signed-in edge cases

- **False alarm:** the first script opened `/pt/conta/pedidos/MOR-0000000` and got **200**. Re-run waiting for the sign-in to finish: **404**, as the code says. The script had opened the page before the session cookie existed and was sent to the account page. Logged here so nobody spends time on it again.
- Double click on "Recebi meu pedido": the order moves to "Delivered" once, no error.
- Lúcia (maker) opening a buyer's order address: 404. Lúcia opening `/pt/loja/pecas/nao-existe/editar`: 404.
