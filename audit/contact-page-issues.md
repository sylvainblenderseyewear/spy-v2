# Contact Us page — issue audit (11 Nov 2026)

**Ours:** `https://spyoptic-com.myshopify.com/pages/contact` → `templates/page.contact.json` + `sections/spy-contact-form.liquid` + `assets/spy-contact-form.js`
**Source:** `https://www.spyoptic.com/us/contactus`

**Method.** Both pages were rendered at exactly 1440 / 768 / 390 px in a same-origin srcdoc iframe
(the Chrome window is maximised at 1920 and will not resize), then measured from computed styles.
Console was read on a fresh load of our page. No form was submitted, so delivery itself is still untested.

---

## A. Functional

| # | Issue | Evidence | Fix |
|---|---|---|---|
| A1 | **Attachment field cannot deliver a file.** The form posts `application/x-www-form-urlencoded`, so the file input sends only the **file name**. Support gets a line `Attachment: photo.jpg` and no file — it reads like an attachment arrived. | rendered form: `enctype=application/x-www-form-urlencoded`, `name="contact[Attachment]"` | Decide: drop the field, replace it with "reply to our answer to send files", or add a form app / custom endpoint. |
| A2 | **Submissions go to `sylvain@blenderseyewear.com`** (store sender email), not a SPY support inbox. Shopify sends to one address only and keeps no record in admin. | `shop.contactEmail`; Shopify help: contact form → sender email | Settings → Notifications → Sender email. Note it is also the From address on all customer emails. |
| A3 | Hidden `contact[id]` puts a junk line in every email: `Id: SpyContact-template--28214863069491__form`. | `sections/spy-contact-form.liquid:111` | `form.id` already carries this; the hidden input can go. |
| A4 | Success and error states have never been run end to end. | — | One test submission once A2 is decided. |
| A5 | Redirect map points the old URL at the wrong handle: `/us/contactus → /pages/contact-us`, but the page is `/pages/contact`. The 301 would land on a 404. | `audit/redirect-urls.csv` | Fix the CSV (or the handle). |

## B. Pixel parity vs spyoptic.com

Measured at 1440. Everything below is **ours vs source**.

| # | Element | Ours | Source | Where |
|---|---|---|---|---|
| B1 | Field row pitch | **85 px** | **74.5 px** | `mb-5` + `mb-1.5` in the section; card ends up 750 px tall vs 655 |
| B2 | Input / select / textarea text | 15 px | 13 px | setting `input_size` |
| B3 | Label | 15 px / 500 / `#2c393e` | 16 px / 400 / `#1d2a2b` | setting `label_size`, `label_color`; weight is `font-medium` in code |
| B4 | Input padding-left | 12 px | 4 px | `px-3` in `control_class` |
| B5 | Input height / width | 38 / 297 | 36 / 305 | setting `input_height`; width follows card padding |
| B6 | Card padding | 26 px | 21 px | setting `card_padding` |
| B7 | Required asterisk | orange `#f27e37`, 15 px | **red `#df372b`**, 16 px | setting `required_color` |
| B8 | Submit label | 13 px / 700 / 0.52 px tracking | 12 px / 400 / normal | `font-bold tracking-[0.04em]` in code + `button_size` |
| B9 | Page title | `<h2><strong>` → 700, `#2c393e`, line box 45 | `<h1>` 600, `#1d2a2b`, line box 38 | text block in `templates/page.contact.json` |
| B10 | Intro paragraph margin | 8 px | 16 px | text block |
| B11 | Intro → card gap / card → footer | 40 px / **84 px** | 16 px / **16 px** | settings `padding_top`, `padding_bottom` |
| B12 | Textarea height | 123 | 109 | follows B2 + rows |
| B13 | Radio dot / its label | 16 px / 15 px label | 13 px / 16 px label | `h-4 w-4` in code |

**Deliberate deviations — do not "fix" these:**
input border `#8a8a8a` vs source `#e6e6e6`, help text `#6a6c77` vs `#818181`. Both came from the
Sep/Oct ADA pass (`audit/ada-performance-report.md`, A14: `#e6e6e6` is 1.25:1 and fails WCAG 1.4.11).
Reverting them re-breaks AA.

## C. Responsive

| # | Issue | Evidence |
|---|---|---|
| C1 | **Name row splits at the wrong width.** Source goes two-column at **544 px**; ours waits for Tailwind `md:` = **768 px**. Between 544 and 767 the source is side by side and ours is stacked. | sweep: source `543 → 1 col, 544 → 2 col`; ours `544 → 1 col, 768 → 2 col` |
| C2 | **Tablet card width is nothing like the source.** Source card: 323 px @768, 459 px @992, left-offset (x=103 / x=259). Ours: 678 px @768, 680 px @992, centred. 390 and 1440 match. | measured card boxes |

C2 is a judgment call. The source's tablet card is a narrow Bootstrap column with ~125 px name fields —
the same kind of broken-in-the-middle layout we chose not to copy in the header (992–1240).

## D. Accessibility (WCAG 2.1 AA is a project requirement)

| # | Issue | Rule |
|---|---|---|
| D1 | Both radio groups (Consumer/Business, Has B2B Account) have **no `fieldset`+`legend` and no `role="radiogroup"`** — the question is never announced, only the two options. | 1.3.1 / 3.3.2 |
| D2 | The `<fieldset data-spy-fields>` wrapper has no legend. | 1.3.1 |
| D3 | The file input is not tied to its "Accepted file …" note (`aria-describedby` missing). | 3.3.2 |
| D4 | Focus is only a 1 px border colour change (`#8a8a8a` → `#2c393e`), outline removed. | 2.4.7, and fails 2.4.11 in 2.2 |
| D5 | Per-field errors still lack `aria-invalid` / `aria-describedby` — only the summary box got `role="alert"`. | 3.3.1, open item A15 of the ADA report |
| D6 | Orange button with white text ≈ 2.6:1. Known brand-wide call, PM keeps the orange. | 1.4.3 |
| D7 | Duplicate id `rebuy-quick-view-product-id-undefined` ×3, injected by Rebuy on a page with no product. | 4.1.1, app side |

## E. Content

| # | Issue |
|---|---|
| E1 | The page body still carries SFCC leftovers: `<!-- dwMarker="content" dwContentID="contactus-message" … -->` and an inline `style="color:#f27e37"` on the B2B link (hard-coded hex, bypasses the palette). Admin → Content → Pages → Contact Us. |
| E2 | Contact details are inherited from Bollé: phone `1 (800) 779-3937` here, plus `web-int@bollebrands.com` on Offers & Conditions and `contact@bollebrands.com` in the legal notices. |

## F. Code nits

| # | Issue |
|---|---|
| F1 | `{{ form.email }}` and `{{ form.body }}` are echoed unescaped (`sections/spy-contact-form.liquid:268,391`). Stock Horizon does the same, so this is hardening, not a known hole — add `| escape`. |

---

## Fixed — pushed as `ff3ed13`, verified live 12 Nov

`sections/spy-contact-form.liquid`, `templates/page.contact.json`, `assets/tailwind.css`, `audit/redirect-urls.csv`

- **B1–B6, B8, B11–B13** — label 16/400 sitting straight on the field, input and select 36 px with 13 px
  text and 4 px inset, card padding 21, rows 16 px apart, controls are `block` (an inline textarea was
  adding 6 px), band padding 8/16, radios 13 px, button 12 px regular with no tracking.
  Row step is now **74 px** (source 74.5) and the card is **657 px** tall (source 655, was 750).
  Intro→card and card→footer are **16 px** on both.
- **B7** — asterisk is the source red `#df372b`.
- **C1** — name row and submit row split at **544 px**, like the source (was Tailwind's 768).
- **A3** — hidden `contact[id]` dropped, so the email no longer carries the junk `Id:` line.
- **A5** — redirect map now points at `/pages/contact`.
- **D1, D2, D3, D5** — both radio groups are `role="radiogroup"` (new `audience_label` setting names the
  first one, the B2B one points at its question), the legend-less `fieldset` is a `div`, the file input is
  tied to its accepted-types note, and a failed email gets `aria-invalid` + a pointer to the error box.
- **D4** — keyboard focus now draws the theme's standard 2 px ring (`focus:outline-none` had to go: in
  Tailwind v4 it sets `--tw-outline-style: none`, which kills any later `outline-2`).
- **F1** — `form.email` and `form.body` are escaped.

**Left alone on purpose:** label and title colour stay `#2c393e` (brand token; the source's `#1d2a2b` is
indistinguishable and would hard-code a second near-black), the title still renders 700 where the source
says 600 (our DIN has no semibold, so both paint Bold), and the card stays wide on tablet (C2).
About 4 px of the old gap remains: our radio sits centred on its label line, the source's sits higher.

**Still open:** A1 attachment (needs a product decision), A2 recipient inbox (admin), A4 end-to-end test,
B9/B10 title line box and intro paragraph margin (Horizon text block), D6 orange contrast, D7 Rebuy ids,
E1/E2 page copy (admin).

## Second pass, 12 Nov (after the fix shipped)

No regressions: layout matches the source at 1440/768/390, the Consumer/Business/B2B flows still switch,
the console is clean, tab order is 10 controls in source order with nothing hidden-but-focusable, and no
duplicate ids come from our markup. The source also stars Company and Country, so our
required-when-shown matches its intent. Our email field is `type=email` where the source uses `text`.

New findings, none of them caused by the fix:

| # | Issue | Evidence |
|---|---|---|
| P1 | **180 checkout-web chunks, 3.3 MB decoded, load on this page.** 220 preload/prefetch links in total, 180 for checkout. None of it is in the server HTML, so a script injects it at runtime — most likely Shopify/Shop Pay checkout prefetch, worth confirming before chasing. | `performance.getEntriesByType('resource')`, `fetch('/pages/contact')` has 0 `checkout-web` |
| P2 | Page total: **359 requests, ~5.4 MB decoded**, of which theme assets are 65 req / 1,073 KB (`tailwind.css` 291 KB and Horizon's `styles.css` 325 KB decoded). | same run |
| P3 | **Server HTML is 528 KB** for a form page — Rebuy's inline config alone appears 157 times. | `fetch` length |
| P4 | **Apps with no job here still run**: Yotpo widgets, AMP Back in Stock, Rebuy, ExpertVoice (logs "Initializing discount functionality"), Clarity brand-agents. Content templates could opt out. | console + resource list |
| P5 | **No structured data on the page — or on the homepage** (0 `ld+json` blocks). A `ContactPage` / `Organization` block belongs here. Cross-cutting SEO rule asks for it. | DOM + homepage HTML |
| P6 | 13 px inputs with `initial-scale=1` make iOS Safari zoom on focus. The source has the same viewport and the same 13 px, so this is inherited, not a regression — but it is a real phone annoyance. | both viewport metas |
| P7 | Country select carries all 239 options on a US store (the source has 242). Matches the source; worth asking whether it should. | option counts |

## Verified good

Topic → sub-question map and the Order Number rule match the source exactly for all 9 topics
(and "Find a bollé retailer" is correctly reworded to SPY). Business → Has B2B account → Yes/No
paths show the same fields as the source. Mobile at 390 matches: card 348 vs 345, full-width button,
no horizontal scroll. Card border, radius and the orange are right. No console errors.
Meta description and canonical are present.
