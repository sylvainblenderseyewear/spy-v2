# Old site (spyoptic.com): card label logic

Checked 13 Nov 2026. Sources:
- Live: all cards from the 6 category grids (`Search-UpdateGrid`, 357 unique cards) and the
  `Product-Variation` JSON of 9 labelled / unlabelled products.
- Saved pages in `reference/` (Jul–Aug 2026, 166 unique cards) and the saved `main.js` / `search.js`.

## Short answer

The card label is **typed text stored on each product record** (plus a colour). The site prints it
as it is. Nothing works it out from the price, the promotion or a "new" flag, so labels can be
stale or missing.

## Markup and behaviour

```html
<div class="mb-auto product-tile-label" product-tile-label="Now Only $60"
     product-tile-label-color="#f57d31" style="color:#f57d31;border-color:#f57d31">Now Only $60</div>
```

- At most **one label per card**, in `.tile-labels-container` above "N colors available".
- Text and colour come from the server. Every label today is orange `#f57d31` (outline pill,
  13px bold uppercase; CSS in `audit/product-card-source-css.md`).
- JS (`swatchHover` in `main.js` / `search.js`): when you hover a colour swatch, the stickers change
  to that colour's stickers, but the label is written back with **its own** text and colour. So the
  label never changes per colour. An empty text hides it (`d-none`).
- The whole label row hides while the image is hovered (the swatches show instead).

## Model card vs colourway card

Each product record has its own label:
- **Model card** (several swatches, category grids) shows the model's label.
- **Colourway card** (one swatch, e.g. collection pages) shows that colourway's label.

| Model | Model card | Its colourway cards |
|---|---|---|
| COOPER | New · Starting from $105 ~~$150~~ | New, New, On Sale 30% Off (the $105 one) |
| DISCORD | (none) · from $105 ~~$120~~ | New ×2, On Sale 30% Off ×1, the rest none |
| LOGAN | On Sale 30% Off · from $50 ~~$120~~ | $120+ Value, Now Only $50; others none (one at 50% off with no label) |

## Labels live on 13 Nov 2026 (357 cards)

| Label | Cards | Relation to the price |
|---|---|---|
| (none) | 214 | 197 full price, **17 on sale with no label** (Discord, Flynn, Vaughn 54/56, Justice 57/59, Brody, Galactic MIPS, Marauder SE, Megalith, Marshall 2.0, Breakaway…) |
| New | 57 | 56 full price, 1 on sale (Cooper model card) |
| On Sale 30% Off | 11 | 9 really 30% off; Logan is 58% off; Rebar SE ANSI is full price |
| On Sale | 18 | all exactly 50% off (e.g. Dwight 57, Elijah 55/57) |
| Now Only $X / Now Just $X | 38 | X always equals the card's sale price ("Now Just $49" = blue-light screen styles) |
| $N+ Value, Now Only $X (and "Up to $N Value, …") | 19 | X = sale price; N is marketing copy, not the list price (e.g. $200+ vs $150 list) |

## Why it is typed data, not a rule

1. **Same promotion, different label:** Vaughn 54 (no label) and Dwight 57 ("On Sale") both run the
   promotion `50-off-sale-rx-selldown` at 50% off.
2. **Stale labels:** Rebar SE ANSI says "On Sale 30% Off" at full price with no sale promotion.
   Logan says "On Sale 30% Off" while it is 58% off.
3. **Not the promotion message:** Piper's card says "Now Only $60", but its promotion
   (`60-flat-price-sale-piper`) has the callout "🔥 $60 Flat – No Code Needed". The PDP shows that
   callout in its promotions block (`product.promotionsHtml`). Crossway Screen: card "Now Just $49",
   callout "Blue Light styles now just $49 — no code needed".
4. **Not the "new" flag:** Bowery's card says "New", but its `Product-Variation` JSON has `isNew: false`.
5. The label text is nowhere in the `Product-Variation` JSON, so the field name is not public. The
   markup names (`product-tile-label`, `product-tile-label-color`) point to a product attribute pair
   (text + colour) in SFCC.

Prices are a separate system: the sale price and the struck list price come from SFCC promotions
(fixed price like `70-sale-cooperxl-selldown`, or % off like `25-off-sale-sun-selldown`). The
merchandiser writes the label to match the promotion, by hand.

## What it means for the Shopify card

Our `snippets/spy-product-badge-text.liquid` prints `pdp.badge_text`, else an automatic
"On Sale X% Off" from the compare-at price, else "New" (`pdp.badge_new` or a `new` tag).

- The source has **no automatic rules**. Once compare-at prices are loaded, our automatic sale text
  would add labels where spyoptic.com shows none (the 17 cards above) and print the real % where the
  source text is stale. For 1:1, the card should print only the typed text. Keeping the automatic
  text as a fallback is a choice, not parity.
- The model card shows the model's own label on the source. Ours shows the label of the colourway
  the card fronts. A model-level label needs a place to live (for example the model collection).
- Every label needs data: the typed texts have to come from SFCC into a per-product field
  (`pdp.badge_text` is what the theme already reads; the field is not defined on the store).
