# Backlog

User stories grouped by epic. Each one becomes a GitHub issue on the project board, with its acceptance criteria written in Gherkin so they turn directly into test cases.

Priority uses MoSCoW: **M** must have · **S** should have · **C** could have.
Sprint 1 = days 4–7, Sprint 2 = days 8–12.

## Epic 1 · Discover

**US-01 · Browse the catalog** · M · Sprint 1
As a buyer, I want to filter pieces by state, material and price so that I find what fits me.

```gherkin
Given I am on the catalog
When I choose the state "Pernambuco" and the material "Cerâmica"
Then I only see ceramic pieces made in Pernambuco
And the filters are kept in the URL so I can share the page
```

**US-02 · See who made the piece** · M · Sprint 1
As a buyer, I want to read the maker's story on the piece page so that I know who I am buying from.

```gherkin
Given I open a piece page
Then I see photos, price, stock, materials and the maker's name and region
When I select the maker's name
Then I go to their shop page with all their pieces
```

**US-03 · Save for later** · S · Sprint 1
As a buyer, I want to save pieces to favorites so that I can come back to them.

```gherkin
Given I am not signed in
When I save a piece to favorites and then sign in
Then the piece is still in my favorites
```

**US-04 · Read it in my language** · M · Sprint 1
As a visitor, I want to switch between Portuguese and English so that I understand everything.

```gherkin
Given I am on any page in Portuguese
When I switch to English
Then I stay on the same page, now in English, with an /en address
```

## Epic 2 · Buy

**US-05 · Add to cart** · M · Sprint 1
As a buyer, I want a cart that remembers my pieces so that I can pay for them together.

```gherkin
Given a piece has 2 in stock
When I try to add 3 to the cart
Then the cart keeps 2 and tells me only 2 are available
And the cart is still there after I reload the page
```

**US-06 · Fill the address by CEP** · S · Sprint 1
As a buyer, I want my address filled in from my CEP so that checkout is faster.

```gherkin
Given I type a valid CEP
Then street, neighborhood, city and state are filled in
When the CEP does not exist
Then I see "CEP não encontrado" and can type the address by hand
```

**US-07 · Pay safely** · M · Sprint 1
As a buyer, I want to pay through a trusted checkout so that I feel safe.

```gherkin
Given my cart has pieces and an address
When I pay with the Stripe test card 4242 4242 4242 4242
Then I see the order confirmation
And the order appears as "Paid" in my orders and in the maker's orders
When the payment is declined
Then I return to the cart with my pieces still there
```

## Epic 3 · Follow my order (buyer area)

**US-08 · Order timeline** · M · Sprint 1
As a buyer, I want to see each step of my order so that I never have to ask the maker.

```gherkin
Given I have a paid order
When the maker marks it as shipped with a tracking code
Then my timeline shows "Shipped" and the tracking code without a page refresh
```

**US-09 · Review a piece** · S · Sprint 2
As a buyer, I want to review a piece after it arrives so that I can thank the maker and help other buyers.

```gherkin
Given my order is "Delivered"
When I give 5 stars and write a comment
Then the review appears on the piece page and in the maker's reviews
And I cannot review the same order twice
```

**US-10 · Manage addresses** · C · Sprint 2
As a buyer, I want to save addresses so that I do not type them again.

## Epic 4 · Open my shop (seller, before the sale)

**US-11 · Shop onboarding** · M · Sprint 2
As a maker, I want to create my shop with my story and region so that buyers know who I am.

```gherkin
Given I signed up as a maker
When I fill in my shop name, story and region
Then my shop page is public and shows my story
```

**US-12 · New piece wizard** · M · Sprint 2
As a maker, I want to list a piece step by step with a preview so that I publish it without mistakes.

```gherkin
Given I am on step "Price and stock"
When I leave the price empty and press "Continue"
Then I stay on the step and the field says "Informe o preço"
And focus moves to that field
When all steps are valid and I press "Publish"
Then the piece appears in the catalog
```

## Epic 5 · Run my shop (seller, after the sale)

**US-13 · Shop overview** · M · Sprint 2
As a maker, I want a summary of sales, revenue and orders to ship so that I know what to do today.

```gherkin
Given I have 3 paid orders and 1 shipped order
Then the overview shows 3 orders to ship
And the sales chart has a text alternative with the same numbers
```

**US-14 · Ship an order** · M · Sprint 2
As a maker, I want to mark an order as shipped with a tracking code so that the buyer is informed.

```gherkin
Given an order is "Preparing"
When I add the tracking code "BR123456789BR" and confirm
Then the order moves to "Shipped" and leaves my "to ship" list
```

**US-15 · Manage pieces** · S · Sprint 2
As a maker, I want to edit, pause or restock a piece so that the catalog matches what I have.

```gherkin
Given a piece is paused
Then it does not appear in the catalog
But buyers who have it in favorites see it as "Unavailable"
```

**US-16 · See my reviews** · C · Sprint 2
As a maker, I want to read the reviews I received so that I can learn from buyers.

## Cross-cutting (every story)

- Works with keyboard only and is announced correctly by a screen reader.
- Works at 320px wide and at 200% zoom.
- Light and dark themes, Portuguese and English.
- Covered by unit or component tests; main flows also by Playwright.
