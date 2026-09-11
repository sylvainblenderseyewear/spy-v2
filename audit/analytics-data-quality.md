# Product data problems that break analytics — and two that break selling

Checked 2026-09-10 against the **production** store `spyoptic-com` ("SPY+ Optic",
Shopify Plus, 725 products) via the Admin API. Sample of 20 products.

The first two items are not really analytics problems. They are pricing problems
that analytics happened to surface.

---

## 1. Duplicate variants — 6 of 20 products sampled

The same variant exists twice on one product: once with a UPC-style numeric SKU,
once with a SPY reference SKU. They differ only by a separator in the title.

| Product | SKU | Variant title | Price |
|---|---|---|---|
| Fiona Femme Fatale | `670299033355` | Small Medium / Happy Bronze Fade | **$150.00** |
| Fiona Femme Fatale | `YS073002` | Small‑Medium / Happy Bronze Fade | **$75.00** |
| Cyrus 5050 Optical 58 | `5700000000175` | Large / SPY Demo Lens with SPY Lens Print | $93.30 |
| Cyrus 5050 Optical 58 | `YV119001` | Large / Demo W/ Spy+ Lens Print | $93.30 |
| Discord Gaming Matte Black | `5700000000104` | **Large** / Happy Gaming | $75.00 |
| Discord Gaming Matte Black | `YV056001` | **Medium‑Large** / Happy Gaming | $75.00 |
| Drake 54 Matte Black | `573104973000` | Medium / Demo  W/ Spy+ Lens Print | $80.00 |
| Drake 54 Matte Black | `YV029002` | Medium / Demo W/ Spy+ Lens Print | $80.00 |
| Logan Clear Smoke | `670939204352` | Small Medium / …Silver Mirror | $130.00 |
| Logan Clear Smoke | `YS020001` | Small‑Medium / …Silver Mirror | $130.00 |
| Helm Optical 56 Black | `5700000000081` | Medium / Demo  W/ Spy+ Lens Print | $93.30 |
| Helm Optical 56 Black | `YV019001` | Medium / Demo W/ Spy+ Lens Print | $93.30 |

**Fiona is the serious one:** the same pair is buyable at $150 or $75 depending on
which variant the customer lands on. Discord Gaming's two copies disagree about
the size as well — Large vs Medium‑Large.

Note the two SKU schemes map to a real distinction upstream (UPC vs SPY reference
`YS…`/`YV…`), so this looks like the migration writing both identifier systems as
separate variants instead of one variant with two identifiers.

**Analytics effect:** every product-list impression is counted twice, and product
performance splits across two IDs, so no product ever shows its true numbers.

---

## 2. `$0.00` variants on ACTIVE products

| Product | SKU | Price |
|---|---|---|
| Helm Replacement Lens | `YS015001-P` | $0.00 |
| Helm Replacement Lens | `YS015002-P` | $0.00 |
| Cyrus Replacement Lens | `YS005002-P` | $0.00 |
| Cyrus Replacement Lens | `YS005003-P` | $0.00 |

All four are the `-P` (polarized) reference SKUs. Their UPC-keyed twins on the same
products are correctly priced at $30.00, so this is the same duplication problem as
above with the price left unset.

**Analytics effect:** purchases reported with `value: 0`, pulling average order
value down and making revenue reconciliation fail.

---

## 3. `vendor` is both "Spy" and "SPY"

Confirmed on production, not just staging. "SPY" on Logan Matte Black Orange
Flames, Monolith Speed Black, Discord SOSI, Foundation Maze Blue; "Spy" on the
rest.

**Analytics effect:** GA4 reports two brands. Cosmetic, trivially fixed, but it
makes every brand-level report wrong until it is.

The pixel normalises this with `.toUpperCase()` as a stopgap — see
`audit/ga4-custom-pixel.js`. That hides it in GA4; it does not fix the catalog,
the Merchant Center feed, or anything else reading `vendor`.

---

## 4. `productType` — better than expected

Production uses six real types: Sunglasses, Eyeglasses, Snow Goggles, Motocross
Goggles, Accessories, Gear. Staging had everything typed "Sunglasses".

Good enough for a broad `item_category`. Still flat, where the live SFCC site
sends a hierarchy (`sunglasses` → `sunglasses-mens-sunglasses`), so matching the
existing GA4 taxonomy still needs the collection path — see
`audit/analytics-live-site.md` §2.

---

## What to do

1. **Raise items 1 and 2 with whoever owns the NetSuite/Matrixify migration today.**
   They are live pricing exposures on a store with 725 products, not reporting bugs.
   The 20-product sample suggests roughly a third of the catalog is affected;
   someone should run the full count.
2. **Decide which SKU scheme survives** — UPC or SPY reference — and make the other
   an identifier on the same variant, not a second variant.
3. **Normalise `vendor`** to one casing.
4. **Then re-check the `item_id` decision.** Variant ID is still right while
   duplicates exist, because the duplicates really are separate variant records.
   Once they are merged, revisit whether SKU becomes the better key.
