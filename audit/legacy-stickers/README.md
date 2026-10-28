# Product card stickers — mirrored from spyoptic.com

The stickers at the top right of a product card (Happy Boost, ANSI, Cat. 4, bonus lens, Deadbolt, Mips)
come from **product tags**, one `badge::` tag per sticker. This follows the `badge::mips` /
`badge::bonus-lens` tags from commit 6bf9413. The tags copy what the legacy site shows, product by
product. No metafield, variant or collection data was changed.

## Tags, art and order

Cards print the stickers in this order, the legacy site's slot order:

| Tag | Sticker | File in Shopify Files | Legacy art |
|---|---|---|---|
| `badge::bonus-lens` | Bonus lens | `spy-bonuslens-2-clear.png` | `spy-bonuslens-2.png` |
| `badge::deadbolt` | Deadbolt | `spy-deadbolt-clear.png` | `spy-deadbolt.png` |
| `badge::happy-boost` | Happy Boost | `pictohappyboost-clear.png` | `pictohappyboost.png` |
| `badge::ansi-z87` | ANSI Z87 | `ANSI_SVG_Z87_V1.svg` | `ANSI_SVG_Z87_V1.svg` |
| `badge::ansi-z87-2-plus` | ANSI Z87-2+ | `ANSI_SVG_NEW_V4.svg` | `ANSI_SVG_NEW_V4.svg` |
| `badge::cat-4` | CAT. 4 LENS | `MurdrdOut-CAT4-clear.svg` | `26-SPY-Digital-PDP-Icon-MurdrdOut-CAT4.svg` |
| `badge::not-for-driving` | NOT FOR USE WHILE DRIVING | `MurdrdOut-WARNING.svg` (migrated 24 Oct) | `26-SPY-Digital-PDP-Icon-MurdrdOut-WARNING.svg` |
| `badge::mips` | Mips | `mipslogo.png` | `mipslogo.png` |

Since 28 Oct 2026 every sticker has a **transparent background**, so it sits on any photo without a box
(Goran's call; it differs from the legacy site on purpose):

- ANSI Z87, ANSI Z87-2+, Not for driving and Mips are the legacy files as they are (already transparent; the
  yellow circle is the Mips logo itself).
- Happy Boost, Bonus lens and Deadbolt are the legacy PNGs with their white backing removed (Happy Boost face,
  Bonus lens fill, Deadbolt square; Deadbolt keeps the white text in its circle). Edge pixels were un-blended
  from white, so there is no white fringe on dark photos.
- CAT. 4 LENS lost its black tile and prints its text black, like Not for driving.

The untouched legacy originals (`ANSI_SVG_*`, `spy-bonuslens-2.png`, `spy-deadbolt.png`, `pictohappyboost.png`,
`mipslogo.png`, `MurdrdOut-CAT4.svg`) are in Files too, so going back is a file name in
`snippets/spy-tech-badges.liquid`. The WebPs migrated on 24 Aug are unused: the two ANSI ones had a solid white
back and were 50px rasters. Transparent art also needs a clear background on the PDP: the gallery's white
image backing skips `.spy-pdp-stickers` (`src/tailwind.css`).
Geometry is the legacy one: 40px wide, height from the art, 11.2px from the top, 5px from the right,
4px apart, the whole row at 70% under 544px (`src/tailwind.css`). The product page shows the same tags on
its photo at the legacy PDP size, 50px wide (`snippets/product-media-gallery-content.liquid`).

To add a sticker to a new product, add its tag in the admin. To swap the art, replace the file in Files
or use the image settings on the card blocks.

## How each product's tags were decided

`scripts/card-stickers.mjs` reads a product export and `colourways.json`. A product stands for the
colourway its card shows (frame + the lens of its first variant in stock). First match wins:

1. **legacy colourway** — the legacy site lists this frame + lens: copy its stickers (73 products)
2. **legacy frame** — same frame, other lens: the frame's model stickers + lens rule (48)
3. **legacy model** — stickers on every legacy colourway of the model + lens rule (102)
4. **not on legacy** — lens rule; Mips on a "... MIPS" helmet (28)

Lens rule: "Happy Boost" in the lens name gives Happy Boost (not on Megalith, which never shows it on the
legacy site); "Murdered Out" gives Cat. 4 + not for driving. On the legacy site this rule holds for 258 of
259 colourways. "Color"-only placeholder products have no Lens option; their title carries the lens.

## Files

- `colourways.json` — the legacy crawl: 575 colourways (tile default + swatches) from the sunglasses,
  goggles, snow-helmets and eyeglasses PLPs at `?sz=200`, 23 Oct 2026, with their stickers. 0 conflicts.
- `card-stickers.csv` — one row per product: model, frame, shown lens, how it was decided, tags.
- `card-stickers.jsonl` — the `tagsAdd` variables that were applied (251 products).

## Applied

24 Oct 2026, 251 of 1,185 products (drafts included). A fresh export afterwards gave 0 tags missing.
The Shopify connector blocks bulk mutations, so the tags went in as three aliased `tagsAdd` documents
(about 84 each; the connector caps a document at 16,384 characters).

Re-run after the catalog migration:

```
node scripts/card-stickers.mjs <export.jsonl> audit/legacy-stickers/colourways.json <out-dir>
```

It only adds tags and lists any `badge::` tag the rules don't give as "extra".

## Known differences from the legacy site

- **Resting sticker on 7 grouped cards** (CYRUS, REBAR ANSI, FLYNN, FLYNN 5050, COOPER, REGION XL,
  LOGAN): the card fronts a different colourway than the legacy tile, so its photo and stickers differ.
  The stickers are right for the colourway shown; only the front choice differs (collection order).
- **ANSI levels copy the legacy stickers**, which disagree with our variant `spec.ansi_rating` and with
  the legacy PDP tech lists for Mainline ANSI (sticker Z87, data Z87-2+), Rebar ANSI and Rebar SE ANSI
  (sticker Z87-2+, data Z87) and Overhaul XL (sticker Z87, no rating). The PDP spec table still reads the
  variant data. One tag change per product fixes a level once SPY confirms.
- **Not on the legacy site**, so inferred: Marauder Elite, Marauder AF / SE AF / Elite AF / SE LBF, Marshall 2.0 AF,
  replacement lenses for Waypoint, Marauder SE, Marshall 2.0 and Megalith (Happy Boost by lens name only,
  no bonus lens or Deadbolt), Astronomic / Lil Astronomic / Interstellar / Galactic 2.0 MIPS (Mips).
