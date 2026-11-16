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

## Third pass, 13 Nov (functional)

**Method.** Live store (open, no password). Headless Chrome 157 drove the real page; every POST to
`/contact` was answered locally by `page.route`, so **nothing was sent**. Payloads were captured with
`HTMLFormElement.prototype.submit.call(form)`, which skips Shopify's captcha wrapper. The success state was
loaded directly as Shopify's redirect shows it: `/pages/contact?contact_posted=true#SpyContact-…`.
The source form was read once from Goran's Chrome (fetch from a robots.txt tab).

| # | Sev | Issue | Evidence |
|---|---|---|---|
| T1 | High | **The success message is hidden under the sticky header.** The redirect lands on the form's `#id`, the form top scrolls to y=0, and the header + announcement bar (to ~90 px desktop, ~105 px phone) cover the whole banner. Its `autofocus` never fires: Chrome skips autofocus when the URL has a fragment, so focus stays on `body`. The shopper sees an empty form and no "thanks", so a resubmit is likely. The error box sits in the same spot, so it should hide the same way (inferred, not reproduced). | banner 0–46 px @1440, 0–65 px @390; `activeElement` BODY with the hash; without the hash the banner sits at y=373 |
| T2 | High | **Attachment is a regression, not a missing extra.** The source posts `multipart/form-data` to `ContactUs-Subscribe` and really uploads the file (≤10 MB, 8 types, checked in the browser). Ours sends only the name: `contact[Attachment] = photo-of-broken-hinge.png`. Warranty claims lose their photos. (A1) | payload F5; source form attributes |
| T3 | High | Messages still go to `contactEmail` = `sylvain@blenderseyewear.com`, one personal inbox. (A2, unchanged) | Admin API, 13 Nov |
| T4 | Med | **Shopify's hCaptcha sits in the submit path and fails silently.** `ce_storefront_forms_captcha_hcaptcha.v1.5.3` cancels the native submit, loads `js.hcaptcha.com` on first use, runs an invisible check, then submits. On failure it only logs `form submit failed`. Our button has no busy state, so the shopper gets no sign while it waits or when it fails. Headless never passes, so no POST is sent even after 20 s (expected for bot protection). The real-shopper path is still untested. (A4) | submit `defaultPrevented` in the bubble phase; read from the script |
| T5 | Med | **Email accepts typos the source rejects.** `name@gmail` and `a@b` pass our `type=email`; the source's pattern rejects both. Either support gets an address it can't reply to, or Shopify rejects it and T6 hits. | `checkValidity()` vs the source `pattern` |
| T6 | Med | **A server-side error wipes the form.** Only `form.email` and `form.body` come back. First/last name, phone, customer type (resets to Consumer), company, country, topic, request and order number are lost. This is a platform limit: the contact form object has only `email` and `body` (`form.phone`, `first_name` and `last_name` belong to other form types, per shopify.dev). Keeping the rest needs a client-side save, e.g. sessionStorage before submit. | `sections/spy-contact-form.liquid:283,406` |
| T7 | Low | The country select is **68 KB of the 506 KB HTML**: `all_country_option_tags` adds province JSON to 37 countries, which nothing here uses. It also has no `autocomplete="country-name"` (WCAG 1.3.5). | live HTML; `:315-323` |
| T8 | Low | With JS off, or if `spy-contact-form.js` fails, every hidden field still posts: 8 × `Your request` (one per topic), `Has B2B account = No` for consumers, empty company/country and an empty `contact[name]`. The email would show the wrong request. | payload F8 (JS off) |
| T9 | Low | The success and error banners use hard-coded hex (`#c0392b`, `#fdeceb`, `#2e7d32`, `#edf7ed`), against the Layer 1 rule. Contrast passes (4.76:1 and 4.67:1). | `:125,137` |

**Matches the source (not bugs):** "Your request" preselects its first option, and so does the source
(no placeholder). So a shopper who never opens it sends "Advice/Product availability"; that is a data
call, not a parity bug. The footer signup and the contact form don't cross-talk: `?customer_posted=true` shows only
"Thanks for subscribing!", and `?contact_posted=true` shows only the contact banner.

**Verified good:** every flow posts only the visible fields (consumer, order with order number, business
with company + country). Business + B2B "Yes" shows only the message. An empty submit focuses First name and flags
the 5 required fields, and a reload resets cleanly with no hidden/shown mismatch. `contact[name]` is "First Last".

## Deep pass, 13 Nov (evening)

**Method.** Same rules (nothing sent). Added: the source form read field by field and its `contactUs.js`;
shopify.dev docs; axe-core 4.10.3 (WCAG 2.0/2.1/2.2 AA + best practice) in 4 states at 1440 and 390; a keyboard
walk; Decline vs Accept consent runs; hCaptcha's picture challenge measured (never solved); WebKit; Theme Check
on a clean worktree of HEAD; the Admin API (redirects, shop email); the store's policy pages.

### How spyoptic.com handles a send (reference for the fixes)

- Submit disables the button and starts a spinner, runs reCAPTCHA v3, then posts the whole form by AJAX as
  `multipart/form-data` to `ContactUs-Subscribe` (60 s timeout).
- Success resets the form and adds a `role="alert"` message to `<body>` (fixed toast) for 3 s. Errors use the same toast in red.
- Field errors show inline ("This field is required." + red border) on keyup, blur and submit, and the page scrolls to the form.
- A file is checked when picked: ≤10 MB and one of 8 types, or it is cleared with a message.
- Each topic option carries `data-emailto` (copied into a hidden `receiverEmail`) and `data-showordernumber`.
  **Every topic goes to `contact@bollebrands.com`.**
- Stars: First, Last, E-Mail, Company, Country, My Question, Comment. "Your request" and "Order Number" have none.
  Max lengths 50/50/250/50/50 match ours.

### New findings

| # | Sev | Issue | Evidence |
|---|---|---|---|
| T10 | High | **The right inbox is known.** The store's own Contact-information policy publishes `customerservice@spyoptic.com`, and the source sends every topic to `contact@bollebrands.com`. Ours still goes to one personal address (T3). Shopify's contact form has a single recipient, so per-topic routing would need an app or a hook. | `/policies/contact-information`; source `data-emailto`; Admin API |
| T11 | Med | **Submit has no visible keyboard focus** (WCAG 2.4.7 AA). It gets a 1 px *white* outline 2 px outside the orange button on a white page, and the fill doesn't change. The fields have the 2 px slate ring, and the radio a 1 px dark ring. | keyboard Tab: `solid 1px rgb(255,255,255) offset 2px` |
| T12 | Med | **No feedback while sending or per field.** The source disables Submit and shows a spinner, shows inline field errors, and shows a toast on success. Ours shows browser bubbles one field at a time, has no busy state, and hides its "thanks" (T1). | source `contactUs.js` |
| T13 | Med | **The old URL has no redirect.** `/us/contactus` answers 404 on Shopify. The CSV maps it, but no Shopify redirect exists (other redirects do), so old links and Google results will hit a 404 at cutover. | Admin API `urlRedirects(path:/us/contactus)` = none |
| T14 | Low | The country list has a selectable `---` option (from `all_country_option_tags`) that passes `required`, and United States is option 227 of 239. | live markup; accessibility tree |
| T15 | Low | "Your request" shows a required star although it can never be empty; the source shows none there. | source labels |
| T16 | Low | 10 of the 12 colour settings in `page.contact.json` are hex (slate `#2c393e` and others). Only the button and the note use the palette, so a brand colour change in theme settings won't reach this form. The notify-me block already uses `--color-spy-positive` / `--color-spy-negative` for its messages. | `templates/page.contact.json:233-255` |
| T17 | Low | No SEO description is set, so Shopify uses the intro text, "order inquires" typo included. No `ContactPage` structured data (P5). | `<meta name=description>`; 0 `ld+json` |
| T18 | Low | Theme Check: `ExcessiveSettingsCount`, 46 settings (max 40) on the section. Nothing else on the contact files. | clean-worktree run |
| T19 | Low | The PDP notify-me fallback form (also `form 'contact'`) has T1's cause too: its success line lands under the sticky header. In GA4 its sends also count as `contact_form` leads. | `blocks/spy-notify-me.liquid:70-78` |

**T1, root cause confirmed.** The theme already measures the sticky bar in `--spy-header-offset` (90 px desktop,
106 px phone, set in `layout/theme.liquid:85`). But `scroll-padding-top` is `auto` on `html` and `.page-wrapper`,
and the form's `scroll-margin-top` is 0. `blocks/spy-yotpo-reviews.liquid` already uses a scroll margin for the same
reason. The `autofocus` pattern comes from Horizon's own `blocks/contact-form.liquid`; with the `#form` fragment it
never runs, in Chrome or WebKit.

### Checked and fine

- Consent doesn't touch the spam check: the form is bound to hCaptcha the same after Decline and after Accept.
- A challenged shopper sees the picture challenge properly. Phone: 320×490, centred and on top. Laptop 1366×620:
  520×570, over the sticky header, with Skip/Verify reachable. (The docs' `/challenge` page is a second fallback.)
- axe, 4 states × 2 widths: no structural violations in the form. Only contrast fails: the orange Submit (2.68:1,
  D6) and the orange "B2B account" link in the intro (2.68:1, inline style from E1).
- Keyboard order matches the source; arrow keys switch both radio groups and reveal the business fields.
- Every failed request on the page is third-party (Shop Pay hop, accessiBe config 404, Clarity chunks 429).
- WebKit: native validation works (focus to First name, 5 invalid).
- GA4 counts `generate_lead` once per tab, so reloads don't inflate it (`audit/ga4-custom-pixel.js:339-346`).
- The intro copy, phone and hours match the source word for word.

**Still unknown without a real send:** Shopify's verdict on `name@gmail`, the exact notification email support
gets, and whether the old site also mailed the customer a confirmation (Shopify doesn't).

## Fixed — pushed 16 Nov as `c7c21ba`, verified live

Files: `sections/spy-contact-form.liquid`, `assets/spy-contact-form.js`, `templates/page.contact.json`,
`locales/en.default.json` (new `content.spy_contact` group), `blocks/spy-notify-me.liquid`, `assets/spy-notify-me.js`,
and `assets/tailwind.css` (rebuilt).

| Item | Fix |
|---|---|
| T1 | The form gets `scroll-margin-top: calc(var(--spy-header-offset) + 16px)`, so the #form jump clears the sticky bar. JS focuses the thanks/error box and takes focus back once after the browser's own fragment step moves it to `body` (traced: it fires ~30 ms after DOMContentLoaded, with no script involved). |
| T11 | Submit has a 2 px slate focus ring, offset 2 px (`--cf-focus-border`). |
| T12 + T4 | Errors show under each field ("This field is required." / "Please enter a valid email address."), with `aria-invalid` and `aria-describedby`; the browser bubble is turned off, and the first bad field gets focus. Submit shows "Sending…" (aria-busy, focus kept) and blocks a second send. After 12 s with no page change it says "Your message could not be sent. Please try again." in a `role=alert` line, waiting while an hCaptcha puzzle is open. |
| T5 | Email `pattern` needs a dot and a 2+ letter ending (`name@gmail`, `a@b`, `a@b.c` rejected). |
| T6 | Answers are kept in sessionStorage on submit. They come back only when the page returns with the error box, and are dropped on any other visit (30 min limit). |
| T7 + T14 | The country list is built without province data (12 KB, was 68 KB). Shopify's selectable `---` is replaced by the shopper's own country plus a disabled `---`, and the select has `autocomplete="country-name"`. |
| T15 | No star on "Your request". |
| T16 + T9 | 9 template colours now point at the palette with the same values. The input border is empty, so it follows the theme's Input border setting. The banners use the theme's `--color-error` / `--color-success`. Their light tint is a 6% layer behind the text, not `color-mix()`: Tailwind 4.3 gives any `color-mix()` a full-strength fallback, which would paint dark-red text on a dark-red box in browsers without it. Only the required-star red stays hex (no red in the palette). |
| T8 | Hidden groups start `disabled` in the markup, so a page without JS posts only what is visible. |
| T19 | The notify-me form has the same scroll margin; its message is focusable and gets focus after a send. |

**Verified** (offline LiquidJS render spliced into the live page, local CSS + JS, nothing sent): 45/45 browser
checks pass. Layout is unchanged at 1440/768/390 (same card size and the same box for every field). Payloads match
the old ones for all paths. Shopify's hCaptcha still binds to the new markup. The thanks/error boxes sit below the
sticky bar and keep focus. Notify-me was checked on a local page with the block's markup at 1440 and 390. Theme Check
adds nothing new on these files beyond the old 46-settings warning; only translation keys for the 30 unused locales.

**Shipped 16 Nov.** Rebased onto 29 newer commits; the overlap was the `show_attachment` default (2339a3e) and the
notify-me loader (3b3ca43, cd5305c), with no conflicts. `assets/tailwind.css` was built from the exact commit tree (a
clean build of HEAD reproduced HEAD's CSS byte for byte), and only the `spy_contact` hunk of `locales/en.default.json` went in.
The CSS changes by 14 new rules and 7 old hex rules. Theme Check on that tree adds only the 4 new keys' missing
translations. The live theme's checksums matched git for all 7 files within seconds. Checks on the real live page
at 1440 and 390 passed 14/14 (thanks box below the bar and focused, inline errors, Submit ring, "Sending…", no script
errors), and the offline suite passed 47/47 against that day's page.
**Still to do:** one real send to see Shopify's side (needs Goran's yes, since it emails the store inbox).

**Not fixed here (decisions / admin):** T3/T10 recipient, T13 `/us/contactus` redirect, T17 SEO description,
T18 settings count. T2 is settled for now: 2339a3e (13 Nov) switched the attachment field off. The notify-me error
text uses `--color-spy-negative` (#d7403a, 4.48:1, just under AA); left as is.
