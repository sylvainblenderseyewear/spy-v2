# Yotpo homepage reviews band — situation and solution

Researched 2026-09-05 → 2026-09-07. Target = live band 8 on spyoptic.com, "Real Reviews From Real
Customers" (see the goal capture and `audit/page-spec-homepage-measured.md`, where bands 7 + 8 were
originally marked out of scope).

## Verdict

The band is blank because of **Yotpo account configuration, not theme code**. A "whole store" carousel
(`data-type="site"`) reads Yotpo **site reviews**, and the account the storefront loads has none — even
though it holds thousands of *product* reviews. The homepage section settings are otherwise correct;
pointing that same configuration at the other account reproduces the goal 1:1.

**There are two fixes, and one of them needs no account change** — see Solution options. Earlier drafts
of this document said the band could not work on Staging at all. That was wrong: `data-mode="manual"`
renders there.

## Two accounts, and what each holds

One Yotpo **login** holds two **accounts**, switched from the bottom-left switcher. Each has its own app
key, review database and widget settings. Nothing is shared. Dashboard figures read from the Yotpo Home
screen of each account on 2026-09-07.

| | **S1** `spyoptic.com` | **S2** `Spyoptic-Staging` |
|---|---|---|
| app key | `QvaApx…` | `HnS18CO…` |
| configured domain | spyoptic.com | spy-staging.bollebrands.com |
| review requests sent | 366K | 1 |
| reviews collected | 15K | 3.4K |
| **reviews published** | **13.3K** | **3.1K** |
| average rating | 4.42 | 4.37 |
| **site reviews** | **2746** (avg 4.6) | **0** |
| carousel-eligible pool (widget bottomline) | 10535 | 1867 |
| product reviews keyed by | legacy SFCC PIDs + UPC-style SKUs | the **new** Shopify store's product ids |
| photo gallery it owns | `5fc6c17f1b07c32602d6712f` (used by spyoptic.com) | `600cb426ea00342fd9db2ca4` |
| V3 widget instance | `widget-reviews-main-widget` (1208122) | `widget-reviews-star-ratings` (1368930) |

**S2 is not an empty account.** It is a partially migrated one: 3.1K published reviews, correctly keyed
to the new Shopify store's product ids. Verified directly — `10396572188979` resolves to "Discord Soft
Matte Black", 58 reviews, avg 4.29, newest 2026-07-23. Its 415-id 404 rate against `spydevsylv` simply
means S2 is keyed to a *different* store than the dev store.

**Yotpo keeps two separate review pools.** *Product reviews* attach to a product. *Site reviews* are
about the store itself, and they are a much smaller, separate pool (S1: 2746 site vs 13.3K product).
`data-type="site"` reads site reviews **only**. That single fact is why the PDP works and the homepage
does not, and why a product-review migration alone would not fix this band.

## Carousel modes, measured per account

Every row rendered in a real browser at 1440. This is the table that decides the fix.

| carousel configuration | S1 `spyoptic.com` | S2 `Spyoptic-Staging` |
|---|---|---|
| `type="site"` + `mode="top_rated"` — **what the source uses** | renders, "2747 Reviews" | **blank** |
| `mode="top_rated"`, no type (auto store-wide) | renders | **blank** |
| `mode="most_recent"`, no type | renders | **blank** |
| **`mode="manual"`** (curated in Yotpo admin) | renders, "10535 Reviews", spread across LOGAN / REGION / BOWERY / FOUNDATION PLUS | **renders**, "1867 Reviews" |
| `mode="manual"` + explicit `data-review-ids` | renders | **renders**, 9 named reviews |
| `type="per_product"` + a valid id | renders | renders, "58 Reviews" |
| `type="both"` + a valid id | renders | renders, "58 Reviews" |
| `mode="manual"` combined with `type="site"` | — | blank (site forces the empty pool; never combine) |

On S2 only **manual** and **per-product** work. S2's curated manual list currently holds just three
reviews, all from Discord Soft Matte Black, so manual mode renders a three-slide carousel until the
selection is widened in Yotpo. S1's curated list is already a healthy multi-product spread.

Staging's keying was mis-stated in earlier notes: it is keyed to the **Production Shopify store's**
product ids, not this dev store's. `10396572188979` returns 4.3 / 58 there, while all 415 `spydevsylv`
ids in `audit/yotpo-product-map.csv` return 404. Do not scan Staging with dev-store ids and conclude it
is empty.

## Which store is which

| Store | Yotpo app | What renders |
|---|---|---|
| `spydevsylv.myshopify.com` (this repo, theme `spy-v2/main`) | **not installed** | nothing — verified below |
| `spyoptic-com.myshopify.com` | installed | the store the symptoms come from |
| `www.spyoptic.com` | n/a (Salesforce) | the source being cloned |

Measured through `shopify theme dev` on 2026-09-07: on `spydevsylv` there are **zero** Yotpo script
tags, zero Yotpo network requests, and `window.yotpo` is `undefined` — on the homepage *and* on a PDP.
Every widget container is present but empty, including the PDP star rating and review list, which
correctly emit `data-product-id="673119038863"` from the metafield. The `current.blocks` app-embed entry
is also absent from the live `spy-v2/main` `settings_data.json` (Shopify drops it because the app is not
installed) even though the git repo still carries it.

**Consequence: Yotpo cannot be tested on this store at all.** Any Yotpo verification has to happen on
`spyoptic-com.myshopify.com`, which is password-gated.

## Second symptom — the Visual UGC gallery band

**Galleries are account-scoped too, and a gallery id from the wrong account renders nothing.** Verified
fresh in a browser, all four combinations:

| app key | gallery id | result |
|---|---|---|
| **S2** (the connected account) | **`600cb426ea00342fd9db2ca4`** | **renders — 70 images, "@SPYOPTIC" title** |
| S2 | `5fc6c17f1b07c32602d6712f` | **blank** |
| S1 | `5fc6c17f1b07c32602d6712f` | renders — 59 images (what spyoptic.com does) |
| S1 | `600cb426ea00342fd9db2ca4` | blank |

The live `spy-v2/main` theme has `gallery_id: "5fc6c17f1b07c32602d6712f"` — **S1's gallery** — so on an
S2-connected store that band is blank. Fix is one value: set the gallery id to
`600cb426ea00342fd9db2ca4` for as long as the store is on S2. The git repo happens to hold the correct id
already (in `custom` mode); only the live theme is wrong.

S2's gallery needs no other work: 70 images and the "@SPYOPTIC" title are already configured, more than
the source's 59.

## Root cause

1. The storefront loads the **Spyoptic-Staging** app key.
2. The homepage carousel requests site reviews.
3. Staging has zero site reviews, so Yotpo returns `[{"method":"carousels","result":" "}]` — HTTP 200,
   no error, nothing rendered.
4. Product-level widgets on the PDP still work, because Staging *is* keyed to that store's product ids.

That asymmetry — PDP fine, homepage blank — is fully explained by the two pools.

## Ruled out, with evidence

Each was tested in a browser against both accounts, not reasoned about. Harness method is recorded in
the `yotpo-widget-test-harness` memory.

| Suspected cause | Result |
|---|---|
| missing `data-yotpo-element-id` on the two widgets | not a cause — Yotpo assigns 1 and 2 itself; blank on Staging with ids, renders on Production without |
| widget order (gallery before carousel) | not a cause — swapping order changes nothing |
| `yotpo-size-7` class the source carries | **no effect at all** — carousel identical 1410×239, gallery identical 1440×255 with and without |
| the newer app-embed loader ignoring classic markup | not a cause — `cdn-widgetsrepository…/v1/loader/<key>` pulls `widget.js?v2enforce=true` itself; both widgets render under it |
| pasted `data-type="per_product"` snippet with `{{ product.id }}` empty on a homepage | not a cause — Yotpo falls back to store-wide product reviews and still renders |
| markup or block mode | not a cause — the live config reproduces the goal exactly under Production |

## Measured spec of the working band

Rendered from the Production account, which is the same account and same `widget.css` the source uses —
so once the account is right, fidelity is automatic. Captures: `.playwright-mcp/yotpo-band-{1440,768,390}.png`
and `.playwright-mcp/yotpo-live-config-under-production.png` (gitignored; move into `audit/` if a
committed baseline is wanted).

Source markup, from `reference/Homepage/…html`:

```html
<div class="yotpo yotpo-pictures-widget yotpo-size-7" data-gallery-id="5fc6c17f1b07c32602d6712f" data-yotpo-element-id="2">
<div class="yotpo yotpo-reviews-carousel yotpo-size-7" data-background-color="transparent" data-mode="top_rated"
     data-type="site" data-count="9" data-show-bottomline="1" data-autoplay-enabled="1"
     data-autoplay-speed="3000" data-show-navigation="1" data-yotpo-element-id="1" style="max-width: 1890px;">
```

### Responsive behaviour

| viewport | gallery box | tile | carousel box | reviews per view | slide |
|---|---|---|---|---|---|
| 1440 | 1440 × 255 | 201 × 201 | 1410 × 239 | 3 | 403 |
| 768 | 768 × 203 | — | 738 × 282 | 2 | 300 |
| 390 | 390 × 174 | 125 × 125 | 360 × 299 | 1 | 300 |

Yotpo's own breakpoints, from `widget.js`: ≥960 → 3 per view, 600–959 → 2, below → 1. These are Yotpo's,
not the source's container ladder, and they are not configurable. Arrows show at every width. Nine
reviews are requested (`data-count="9"`, capped at 9 by Yotpo) and cloned to 12–15 slides for looping.

### Typography and colour — all owned by Yotpo

| element | value |
|---|---|
| headline "Real Reviews From Real Customers" | Open Sans 18.2px / 700 / `#4f4f4f` |
| review title | Open Sans 18.2px / 700 / `#4f4f4f` |
| stars | `#e7721b`, 19px |
| bottomline label | "2747 Reviews" beside a half-star rating |
| gallery title "@SPYOPTIC" | Yotpo gallery setting: 34px desktop / 30px mobile, `#56575f` |

**Both headings are rendered by Yotpo, not the theme** — the gallery title comes from `title.text` in the
account's `generic_gallery_settings`, the carousel headline from `#carousel-top-panel .headline`. Never
build theme headings for these bands.

### What the theme controls

Only placement: section order, full-bleed width, and the 15px gap between the two bands. Two traps:

- **Do not hard-code `max-width: 1890px`.** Yotpo writes that inline at runtime from the viewport; at
  1440 it computes 1410px. The value in the source markup is a runtime artifact of a ~1920 capture.
- **Do not add `yotpo-size-7`.** Measured identical with and without, at every breakpoint.

## Solution options

### Option A0 — keep S2, switch the band to `manual` mode (smallest change, no migration)

Two steps, and the account stays as it is:

1. **In Yotpo (S2) → On-Site Widgets → Reviews Carousel**, set **Review logic** to `Manual` and move
   **Show** off `Site Reviews`. Then curate the reviews to feature — the list holds three Discord reviews
   today; widen it to a spread across the catalogue, the way S1's list is.
2. **In the theme**, render the carousel with `data-mode="manual"` and no `data-type="site"`.

Mapping the Yotpo screen's two dropdowns to the attributes, all measured on S2 with no product on the page:

| Review logic | Show | Result on S2 |
|---|---|---|
| Auto - Top Rated | **Site Reviews** | **blank** — the current setting, and what Yotpo's own preview reports as "Not Enough Reviews" |
| Auto - Top Rated | Product Reviews | blank |
| Auto - Top Rated | Both | blank |
| **Manual** | Product Reviews | **renders, "1867 Reviews"** |
| **Manual** | Both | **renders, "1867 Reviews"** |
| **Manual** | Site Reviews | blank — site forces the empty pool |

So `Review logic = Manual` is the one required change; `Show` only has to avoid `Site Reviews`. Keep
Number of Reviews at 9, autoplay 3000ms, and the count and arrows checkboxes on — those already match the
source. The headline "Real Reviews From Real Customers" is configured identically on both accounts, so it
needs no change.

The band then shows real reviews with an "1867 Reviews" summary. Keeps the correctly-keyed account, needs
no Yotpo migration, and does not touch the PDP.

Theme note: `blocks/spy-app-embed.liquid` exposes `mode` as a select of `top_rated` / `most_recent` only,
so `manual` needs either one extra option on that existing select (plus an optional `data-review-ids`
text setting) or the block's **Custom code** mode with the snippet pasted in. Custom code respects the
standing rule of not adding new Yotpo `embed` cases.

Trade-off: the summary count and the review mix are curated, not automatic, so someone has to maintain
the selection. It also will not read "2747 Reviews" like the source.

**Fidelity trade-off, and it is a visible one.** The source band is site reviews, so its cards carry no
product name — only stars, date, title, body, "Read More" and the reviewer. A manual or product-review
carousel renders `.carousel-review-product-text` under every card (measured: "LOGAN", "REGION", "BOWERY",
"FOUNDATION PLUS" on S1; "Discord Soft Matte Black" on S2). So Option A0 produces a *working* band, not a
**1:1** one. A pixel-identical band requires a site-review pool, which means Option A, or migrating the
2747 site reviews into S2, or collecting store reviews on the new store.

### Option A — connect the Yotpo app to the S1 `spyoptic.com` account

Point the Yotpo app on `spyoptic-com.myshopify.com` at the `https://www.spyoptic.com` Yotpo account.

- The band renders exactly like the source with **zero code changes**.
- Brings the full history: 2746 site reviews, plus the real product-review counts (Discord 686, Logan
  288, Foundation 466) instead of the handful hand-moved into Staging.
- Fixes the review-submission destination as a side effect: that account becomes the correct home.
- The homepage gallery id must move to `5fc6c17f1b07c32602d6712f` at the same time. The live theme
  already uses it; the git repo still holds the Staging gallery `600cb426…`.
- `yotpo.product_id` (360 products, Production keys) becomes correct rather than harmful.

### Option B — stay on Spyoptic-Staging

Yotpo must migrate **both pools**, site reviews included, or the band stays blank. Also keep
`yotpo.product_id` **empty** on `spyoptic-com.myshopify.com`, because Staging resolves that store's plain
Shopify ids — populating legacy ids there would break every PDP widget.

### Option C — interim, if something must be visible now

A single-product carousel does render on Staging (9 of the 58 reviews on `10396572188979`). It will not
match the source. Set the block's "Reviews shown" to one product.

## Follow-on risks

- **Never load `widget.js` twice.** Two accounts initialising on one page blanked widgets before; the
  manual loader and its `yotpo_app_key` setting were deleted in `d669f06` for that reason. Yotpo has no
  guard against double-loading.
- **The account key is site-wide**, so a "write a review" form submits into whichever account the app
  embed is connected to. Settle the account before wiring review submission.
- **The repo lags the live theme.** Git holds the older gallery config (`custom` mode, Staging gallery);
  live `spy-v2/main` holds the correct `yotpo_gallery` mode with the Production gallery. Pushing the repo
  as-is would overwrite the good live settings. Read theme files with
  `themes(roles:[MAIN]){files(filenames:[…]){body}}` before trusting the working copy.

## Open item

A test review posted from a PDP appeared in the Production account. A form on a Staging-connected page
should submit into Staging. Most likely the test predates `d669f06` (2026-09-03 20:18), when the theme
still loaded a second script carrying the Production key. If the test was made after that date, the
account connection on `spyoptic-com.myshopify.com` needs re-checking directly. No public review created
since 2026-09-01 exists on either account across all 415 mapped products, so the review is sitting in a
moderation queue.

## How to verify after the change

1. Open the homepage on `spyoptic-com.myshopify.com`. Confirm exactly one `widget.js` request, and note
   its app key.
2. Confirm the carousel bottomline reads the full site-review count, not zero.
3. Screenshot at 1440 / 768 / 390 and diff against the table above: 3 / 2 / 1 reviews per view.
4. Check the console for errors, and confirm the PDP star rating and review list still resolve.

## Method

Yotpo's classic batch endpoint (`POST staticw2.yotpo.com/batch/app_key/<key>/domain_key/<dk>/widget/<method>`)
returns HTTP 200 with `result: " "` for an empty widget, which is indistinguishable from a markup bug —
so every conclusion here was reproduced in a real browser instead. One HTML file per hypothesis, served
locally, driven through Playwright, reading `innerHTML.length`, box geometry and computed styles per
widget. Full method in the `yotpo-widget-test-harness` memory.
