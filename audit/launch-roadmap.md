# SPY // SFCC → Shopify Plus — Launch Roadmap

**Written:** 21 Sep 2026 · **Launch (P5):** 12 Oct 2026 · **Days remaining: 21 (3 working weeks)**
**Store audited:** `spyoptic-com.myshopify.com` ("SPY+ Optic", Shopify Plus) — all figures measured 16 Sep 2026 via Admin API, read-only. No writes were made.

Sequenced by **reversibility**, not by workstream: work that cannot be recovered after cutover gets the 21 days; work that can be fixed live gets an explicit post-launch slot and stops competing for attention.

---

## 0. Verdict

**The theme is not the risk. The catalog is.**

The storefront build — the bulk of `C:\spy-v2` and the thing not tracked anywhere on the Notion board — is substantially complete and already the published theme on production. What is not ready is the data it renders, and the phase that owns that data (**P1 · Data & Integrations**) ended **23 days ago** with most of its work undone.

We are entering P4 (QA & Cutover, starts today) with P1, P2 and P3 all open. QA cannot test a catalog that does not exist yet.

**Oct 12 is still reachable — but it is governed by a single unanswered question:** who owns the catalog data load, and when does it land? That answer is needed by **Fri 25 Sep**. Everything downstream (QA scripts, UAT, redirect verification, merchant feeds) depends on it. If it slips past the 25th, the date fails no matter how much gets personally executed, and we should choose deliberately between a scoped launch and a moved date (§7).

### Phase status against the board's own plan

| Phase | Planned window | Status on 21 Sep |
|---|---|---|
| P0 · Foundations | Jun 22 – Jun 30 | ✅ Complete (all 5 cards Done) |
| P1 · Data & Integrations | Jul 1 – **Aug 29** | ❌ **23 days overdue.** Catalog incomplete, 1 customer, gift cards Blocked since 20 Jul, Celigo↔NetSuite not reconnected |
| P2 · Front-End & Apps | Jul 14 – **Sep 20** | ⚠️ **Ended yesterday.** Theme done; Klaviyo, Attentive, CMP, loyalty migration not started |
| P3 · SEO / Legal / Analytics | Aug 1 – **Sep 25** | ⚠️ **4 days left.** 2 redirects exist, ADA not started, privacy/tax not started |
| P4 · QA & Cutover | **Sep 21** – Oct 11 | ▶️ **Starts today**, on top of unfinished P1–P3 |
| P5 · Launch | **Oct 12** | — |
| P6 · Hypercare & BFCM | Oct 12 – Nov 27 | — |

---

## 1. What is actually done

### Storefront / theme — substantially complete
Not represented on the Notion board at all. This is real, delivered work.

- `spy-v2/main` is the **MAIN (published) theme** on production
- 47 templates: 6 PDP variants, PLP + grouped PLP + collection story, 28 content pages, blog, article, 404, cart, search, password
- 31 custom `spy-*` sections, ~80 blocks, Tailwind 4 build pipeline (`npm run build:css`)
- Header/footer section groups, plus slim 404-scoped variants
- Yotpo wired: PDP star rating, review list, homepage gallery + carousel bands
- Stockist store locator built and styled against the Leadformance reference
- Page specs + measured design tokens for every page type under `/audit/`
- GA4 + server-side GTM: pixel live on staging, events verified end-to-end except `purchase`

### Notion — 7 cards Done
All 5 **Foundations & Access** · **Audit current Celigo flows & NetSuite integration points** · **PCI / payments onboarding**

### Apps installed on production
Yotpo Product Reviews · Yotpo Loyalty & Rewards · Rebuy · Matrixify · Loop Returns · Track by Loop (Wonderment) · Stockist Store Locator · ExpertVoice · Shopify Messaging

### Commerce plumbing in place
Delivery profile with a Domestic zone (Standard + Express, both active) · published checkout profile · single active location fulfilling online orders · Shopify Payments onboarded (PCI card Done)

---

## 2. Tier 0 — Ship-stoppers

**Definition: must be true on 12 Oct or we do not cut over.** Each one either takes money incorrectly, hides the catalogue, or breaks the order path.

| # | Item | Evidence | Owner | Due |
|---|---|---|---|---|
| **T0-1** | **$0.00 products** — 16 products carry a $0.00 variant; **6 are free in every variant** (SS25 SPY Palms Tee, SS25 SPY Bear CA Republic Tee, SPY B&B Surf Cap Black, Box Logo SS Tee Black, SPY Diego Snapback Hat Gaslamp Navy, SPY Diego Snapback Hat Friar Brown). 10 partial — including **Cyrus Switch Matte Black** and **Cyrus Switch Translucent Gunmetal**, $0.00 variants sitting beside $200 ones | Admin API, 16 Sep | You + Finance (prices) | **25 Sep** |
| **T0-2** | **Duplicate SKU schemes** — 104 products carry both a SPY `Y*` reference SKU and a UPC numeric SKU **as separate variant records**. Same pair buyable at two prices (Fiona Femme Fatale: $150 and $75). Also disagreeing sizes (Discord Gaming: Large vs Medium-Large) | 119 `Y*` products, 15 clean → 104 affected | You + whoever owns the migration | **2 Oct** |
| **T0-3** | **327 of 725 products unpublished** to Online Store. Concentrated in winter: **Snow Goggles 19/127 visible, Snow Helmets 3/68**, Eyeglasses 149/251. Launching at the start of ski season with 3 helmets | `published_status` split, 16 Sep | You (mechanical) + Merch (confirm intent) | **25 Sep** |
| **T0-4** | **~35 of ~50 main-nav collection links resolve to nothing** — the entire Sale tree (7 links), all men's/women's splits, every curated collection (Discord Series, Helm Series, Trail, Classics, Lifestyle, Flag, Happy Boost Snow, SLAYCo, Merch, Crypto), all replacement-lens collections, apparel sub-categories, youth moto, Happy Gaming / Happy Screen | Menu vs `collectionByHandle`, 16 Sep | You | **2 Oct** |
| **T0-5** | **Homepage references `fishing-sunglasses`** — collection does not exist | `templates/index.json` | You | **25 Sep** |
| **T0-6** | **5 nav pages missing** → 404: `prescription-sunglasses`, `prescription-eyeglasses`, `prescription-snow-goggles`, `prescription-moto-goggles`, `tech-guide` | Published pages list, 16 Sep | You + Marketing (copy) | **2 Oct** |
| **T0-7** | **Celigo → NetSuite → 3PL order flow unproven.** P0 card, due 20 Aug, Not Started. No order has ever traversed the chain | Notion; 0 orders on store | Ops + Dev | **2 Oct** |
| **T0-8** | **Payments live test** — real transaction + refund. `checkout_completed` has never fired; `purchase` is the only unproven event and the one carrying revenue | `audit/ga4-status.md` §2b | Finance + you | **2 Oct** |
| **T0-9** | **Consent / CMP** — no consent app installed. Live site gates 15 vendors through Axeptio. CCPA/CPRA review Not Started | App list, 16 Sep; `audit/analytics-live-site.md` §3 | Legal + you | **6 Oct** |
| **T0-10** | **Inventory is not tracked** — `tracked: false` on every variant, 0 products with stock, no sync. Currently sells because tracking is off; that is a fallback, not a design | Admin API, 16 Sep | Ops + Dev (via T0-7) | **6 Oct** |

---

## 3. Tier 1 — Irreversible at cutover

**Definition: permanently lost if missed. There is no second chance on any of these.** They deserve the calendar before anything in Tier 2, even though several look less urgent.

| # | Item | Why it cannot wait | Owner | Due |
|---|---|---|---|---|
| **T1-1** | **301 redirect map.** 2 redirects exist on production. The SFCC site has thousands of indexed URLs (`/us/{cat}/{name}-{PID}.html`). `audit/redirect-urls.csv` has 50 rows, all Pending | Ranking equity lost at cutover is not recoverable by adding redirects in week 2 — the crawl has already happened and the 404s are already banked | You | **9 Oct** |
| **T1-2** | **GA4 baseline export** from `G-GS5WZT8YYD` and `G-PJEFBYCC2M` (the two live SFCC properties) — 12 months of sessions, conversion rate, revenue, channel mix | **Access changes hands at cutover.** Without it there is no honest answer to "did the new site perform better", ever | Marketing / you | **2 Oct** |
| **T1-3** | **BigQuery export link** on GCP project `gtm-k3rx42ch-yzrjm` | **BigQuery does not backfill.** Every day it stays off is raw event data gone permanently. Free at our volume | Sylvain (5-min task, no access grant needed) | **25 Sep** |
| **T1-4** | **Gift card / store-credit balances.** Notion P0, **Blocked since 20 Jul** — two months with no movement | Balances not migrated before cutover become customer-facing disputes with no source of truth once SFCC is dark | Finance + Dev | **2 Oct** |
| **T1-5** | **Affiliate tag continuity** — Pepperjam, Avantlink, Impact Radius all run on the live site. None has an owner on the board | If affiliate tags stop firing at cutover, **commissions break silently**. Partners discover it before we do, and the attribution gap cannot be reconstructed | Marketing | **6 Oct** |
| **T1-6** | **Klaviyo + Attentive consent state.** Both Not Started; due 5 Sep. Klaviyo is P0 | Subscriber consent that is not migrated **cannot be re-obtained** without a fresh opt-in campaign. TCPA/CAN-SPAM exposure | Marketing + Dev | **2 Oct** |
| **T1-7** | **Customer migration.** Production has **1 customer**. Order history, saved addresses, loyalty balances | Customers landing on a site that has never heard of them, at the moment of highest scrutiny | Dev + Ops | **6 Oct** |
| **T1-8** | **Yotpo account decision.** Two accounts: **S1** (13.3K reviews, keyed to SFCC PIDs + UPC SKUs) and **S2** (3.1K reviews, keyed to the **new Shopify product IDs**). `yotpo.product_id` definition **does not exist on production** — it was applied to staging only | Pick S1 and 360 products need the legacy-ID mapping re-applied to production. Pick S2 and we launch showing 3.1K of 13.3K reviews. Either way the star ratings are blank today | You | **2 Oct** |
| **T1-9** | **Internal traffic filter + `debug_mode` removal + SFCC tag retirement** at cutover | GA4 IP filters are **not retroactive**. Launch-week data is the data you keep | You | **12 Oct** |

---

## 4. Tier 2 — Recoverable in week 1–2

**Definition: real gaps that are visibly imperfect but fixable on a live store.** Do not let these consume October.

| # | Item | Measured | Target |
|---|---|---|---|
| T2-1 | **Product descriptions — 0 of 115 sampled have any.** PDP description block renders empty catalogue-wide | `descriptionHtml: ""` | Week 1–2 post-launch, prioritised by traffic |
| T2-2 | **`templateSuffix` is null on all 115 sampled** — all 6 custom PDP templates (snow-goggle, moto-goggle, helmet, lens, apparel) are **built and unused**. Every product renders on `product.default` | Admin API | Mechanical; do it in week 2 of Oct if it doesn't fit before |
| T2-3 | **`technology` metaobject has 1 entry** (needs ~10: Happy Lens, Happy Boost, Anti-Fog, Anti-Scratch, Eco Materials, Magnetic Lens, Mono Shield, PC Lens, Snap Hinge, MIPS). Tech badges, lens-info modal and tech-guide pages render empty | `metaobjectsCount: 1` | Week 1 post-launch |
| T2-4 | **`collection_story` metaobject has 0 entries** — `collection.story` template has no data to render | `metaobjectsCount: 0` | Follows T0-4 |
| T2-5 | **Search & Discovery not installed** → PLP facets limited to Availability/Price. Colour facet additionally blocked on a colour-family metafield | App list | Week 1 post-launch |
| T2-6 | **Sparse spec metafields** — sampled products carry only `frame_color`, `lens_name`, `available_rx`. No `reference`, `fit`, `weight_g`, `lens_material`, `vlt_percent`, `lens_category`, `technologies`. Technical Information table renders nearly empty | Admin API | With the catalog load |
| T2-7 | **Products with zero media.** Present in the sample at a material rate; exact count needs a Matrixify export (image filters are not supported in Admin search) | Sample | Week 1, after counting |
| T2-8 | **Duplicate product records** — near-identical handle pairs (`…-snow-helmet` / `…-snow-helmet-0438`) across helmets; 43 products have a `-0` handle suffix | Admin API | Merge after T0-2 |
| T2-9 | **`vendor` is both "Spy" and "SPY"** — GA4 reports two brands. Pixel masks it with `.toUpperCase()`; catalogue, Merchant Center feed and anything else reading `vendor` still see two | `audit/analytics-data-quality.md` §3 | Trivial, week 1 |
| T2-10 | **ADA / WCAG 2.1 AA audit** — P0 on the board, Not Started, due 25 Sep | Notion | Start pre-launch, remediate continuously |

---

## 5. Tier 3 — Deferred to Phase 2

Confirmed out of scope for 12 Oct. Listed so they stop being re-litigated.

- **Markets / multi-locale** — you've cut this; production stays single-locale English/US. The theme already avoids hardcoded strings, so the structure survives for later.
- **Flexport migration** (board: Nov 10) · **B2B full build-out** (Nov 20)
- **VTO** and **Compare** — decided out in Phase 0 (`audit/open-decisions.md`)
- **Meta CAPI / Google Ads / TikTok through sGTM** — board has these at P1 High; `audit/ga4-status.md` correctly schedules them for days 2–5 post-launch, deduped on `transaction_id`
- **Cloud Run minimum instances** — launch week at the earliest; the free Cloud Scheduler ping is the better first move

---

## 6. Week-by-week

### Week 1 · Mon 21 – Sun 27 Sep — *unblock and stop the bleeding*

**The governing action is Monday's, not Friday's.**

| Day | Action |
|---|---|
| **Mon 21** | **Escalate catalog ownership to Sylvain in writing** (§8 Q1). This is the single decision that governs the date. Same message: BigQuery link request (T1-3), GA4 baseline export request (T1-2) |
| Mon 21 | Full `$0.00` list to Finance for correct prices (T0-1). Do not guess prices |
| Tue 22 | Publish the hidden 327 — or get Merch to confirm which are intentionally hidden (T0-3). Mechanical, highest visible payoff of the week |
| Tue 22 | Fix `fishing-sunglasses` on the homepage (T0-5) — either create the collection or repoint the section |
| Wed 23 | Generate the 301 map from the SFCC sitemap + PID list; `audit/redirect-urls.csv` goes from 50 rows to complete (T1-1) |
| Wed 23 | Yotpo account decision (T1-8); if S1, re-apply `yotpo.product_id` to production |
| Thu 24 | Chase Marketing: Klaviyo + Attentive install and consent migration (T1-6). Both are already 16 days past their board date |
| Fri 25 | **GATE A** (§7) |

### Week 2 · Mon 28 Sep – Sun 4 Oct — *build and integrate*

| Day | Action |
|---|---|
| Mon 28 | Build the missing collections (T0-4). Automatable from `collection::MODEL` tags + product types — spec the rules once, generate the set |
| Tue 29 | Create the 5 missing pages (T0-6); Marketing supplies copy, prescription pages link out to SportRx per the Phase 0 decision |
| Wed 30 | Celigo end-to-end test with Ops: order → NetSuite → 3PL → inventory → tracking (T0-7) |
| Thu 1 Oct | Payments live test: real transaction + refund; verify the `purchase` payload and `transaction_id` (T0-8) |
| Fri 2 Oct | Dedupe pass on the 104 dual-SKU products (T0-2) — decide which scheme survives, make the other an identifier on the same variant |
| Fri 2 Oct | **GATE B** (§7) |

### Week 3 · Mon 5 – Sun 11 Oct — *verify and freeze*

| Day | Action |
|---|---|
| Mon 5 | Consent/CMP installed and bridged to `Shopify.customerPrivacy.setTrackingConsent` (T0-9) |
| Mon 5 | Cutover runbook + rollback plan written (board card, Oct 5) |
| Tue 6 | Full functional QA: browse → cart → checkout → order → NetSuite → 3PL → tracking. Desktop 1440 / tablet 768 / mobile 390 |
| Wed 7 | Data-integrity UAT: login/reset, order history, gift cards, loyalty (T1-4, T1-7) |
| Thu 8 | Load the 301 map; verify a sample against live SFCC URLs (T1-1) |
| Thu 8 | Lower DNS TTL on `spyoptic.com` — must be done ≥48h before cutover |
| Fri 9 | **GATE C** (§7) |
| Sat 10–Sun 11 | Content + inventory freeze; final delta data load (board card, Oct 11) |

### Launch · Mon 12 Oct

| Time | Action |
|---|---|
| AM | **GATE D — final go/no-go** |
| Cutover | Disable password · connect domain · DNS switch |
| +0h | **Install the GA4 pixel on production** — it goes live the moment it connects, so this is a launch action, not a preparation one |
| +0h | Retire SFCC tags · annotate launch date in GA4 · confirm `debug_mode` is gone |
| +1h | Smoke test: place a real order end-to-end through to 3PL |
| +2h | Apply the internal traffic filter using real team IPs (T1-9) |
| All day | War room / monitoring (board card) |

### Day 1–5 post-launch
Reconcile GA4 revenue against Shopify Admin (day 1) · Meta CAPI + Google Ads through the container, deduped on `transaction_id` (days 2–5) · channel grouping vs the SFCC baseline, watching for redirects inflating direct traffic (day 7) · then Tier 2, in order.

**Freeze all tagging changes from mid-November to Cyber Monday.**

---

## 7. Gates

Each gate is a written go/no-go. Failing a gate is not a reason to push through — it is the signal to invoke §9.

| Gate | Date | Must be true |
|---|---|---|
| **A** | **Fri 25 Sep** | Catalog ownership answered with a date · $0.00 prices supplied by Finance · publication state corrected or confirmed · BigQuery linked · GA4 baseline export requested |
| **B** | **Fri 2 Oct** | Every nav link resolves · 301 map generated · Celigo order flow proven end-to-end · payments tested with a real transaction and refund · Klaviyo + Attentive installed with consent migrated |
| **C** | **Fri 9 Oct** | Full QA pass · consent live · analytics verified · gift cards and customers migrated · runbook + rollback signed off · DNS TTL lowered |
| **D** | **Mon 12 Oct, AM** | Gate C holds after the freeze and delta load · rollback rehearsed · war room staffed |

---

## 8. Dependencies — not yours

Each row is a chase-list item: who owns it, the exact ask, and the date it must land to protect 12 Oct.

| Owner | The exact ask | Needed by | Board status |
|---|---|---|---|
| **Sylvain (PM)** | Who owns the catalog data load (descriptions, images, spec metafields, collections), and what date does it land? Is there a NetSuite/Matrixify export staged anywhere? — *nothing exists in the repo* | **25 Sep** | Not on board |
| **Sylvain (PM)** | Link the GA4 BigQuery export on `gtm-k3rx42ch-yzrjm`. Five minutes, no access grant needed. **Does not backfill** | **25 Sep** | Not on board |
| **Sylvain (PM)** | Google Cloud access for the load balancer + Cloud Run config, or confirm Cloud Run domain mapping is available (free path) | 28 Sep | Not on board |
| **Finance** | Correct prices for 16 products with $0.00 variants, 6 of them free in every variant | **25 Sep** | Not on board |
| **Finance** | Tax configuration (Shopify Tax / US nexus) + sign-off | 2 Oct | Not Started, due 25 Aug |
| **Finance + Dev** | Gift card / store-credit balance export, reconciled — **Blocked since 20 Jul** | **2 Oct** | **Blocked**, P0 |
| **Marketing** | Klaviyo: connect, rebuild flows, migrate lists/segments, **preserve consent** | **2 Oct** | Not Started, due 5 Sep, P0 |
| **Marketing** | Attentive: reconnect, migrate subscribers + consent (TCPA) | 2 Oct | Not Started, due 5 Sep |
| **Marketing** | Own the 3 affiliate networks (Pepperjam, Avantlink, Impact) through cutover | **6 Oct** | No owner |
| **Marketing** | Export 12 months of baseline from `G-GS5WZT8YYD` + `G-PJEFBYCC2M` before access changes hands | **2 Oct** | Not on board |
| **Marketing** | Copy for the 4 prescription pages + tech-guide index | 29 Sep | Not on board |
| **Marketing / Merch** | Confirm the free-shipping threshold — homepage says $50, PDP says $100 | 2 Oct | Open since Phase 0 |
| **Merch** | Confirm which of the 327 unpublished products are intentionally hidden | **25 Sep** | Not on board |
| **Ops + Dev** | Reconnect 3PL to NetSuite via Celigo, own + test | **2 Oct** | Not Started, due 20 Aug, P0 |
| **Legal** | Cookie consent / CCPA-CPRA review; confirm whether the US opt-out model carries over | **6 Oct** | Not Started, due 15 Sep |
| **Legal** | Updated privacy policy, terms, returns/refund for the new stack | 6 Oct | Not Started, due 1 Sep |
| **Legal + Marketing** | Email/SMS consent + marketing compliance review (CAN-SPAM / TCPA) | 2 Oct | Not Started, due 20 Aug |
| **Dev + vendor** | ADA / WCAG 2.1 AA audit | start 25 Sep | Not Started, P0 |

---

## 9. If Gate A fails

If catalog ownership is unresolved on 25 Sep, do not carry the uncertainty into October. Two honest options — this is a business call, not a technical one:

**Option 1 — Scoped launch on 12 Oct.** Launch with the categories that are actually complete. **Sunglasses is 127/127 published; Motocross Goggles 61/63.** Snow Goggles (19/127) and Snow Helmets (3/68) follow in week 2. The cost: going live at the start of ski season without the snow range, which is a marketing problem, not an engineering one.

**Option 2 — Move to 26 Oct.** Two extra weeks, still clear of the BFCM freeze and inside the board's own P6 window. Buys room for the catalog load, the dedupe and the Tier 2 work to land before customers see it.

**What not to do:** launch on 12 Oct with the full catalogue half-populated. Empty descriptions on 725 PDPs, dead nav links and duplicate products do more lasting brand and SEO damage than either option above.

---

## 10. Open questions

1. **Catalog** — who owns the load, when does it land, and does a staged export exist anywhere? *(governs the date)*
2. **Yotpo** — S1 with re-applied legacy ID mapping, or S2 with 3.1K of 13.3K reviews?
3. **Publication** — are the 327 unpublished products intentional, or an incomplete import?
4. **SKU scheme** — does UPC or SPY reference survive the dedupe? The other becomes an identifier on the same variant, not a second variant.
5. **Sale collections** — is there a Sale season at launch? Seven nav links currently point at nothing.
6. **Consent model** — the US site serves opt-out (tags granted by default). Does Legal accept carrying that to Shopify?
7. **Free shipping** — $50 or $100?
8. **Redirect source** — is there an SFCC URL export, or do we crawl to build the map?

---

## Appendix — how this was verified

All store figures measured **16 Sep 2026** against `spyoptic-com.myshopify.com` via the Admin GraphQL API, read-only. Sampling noted where a full count was not available.

| Claim | Method |
|---|---|
| 327 unpublished, per-type split | `productsCount(query: "published_status:...")` |
| 104 dual-SKU products | `sku:Y*` = 119, minus `Y*`-only = 15 |
| 16 products with $0.00 variants, 6 fully free | `products(query: "price:0")`, all 16 inspected |
| 0 descriptions, 0 `templateSuffix` | 115-product sample across two pages |
| ~35 dead nav links | Main menu items resolved against `collectionByHandle` |
| 5 missing pages | Menu targets vs the published pages list |
| 2 URL redirects, 1 customer, 0 orders | `urlRedirectsCount`, `customersCount`, `ordersCount` |
| Metaobject counts | `metaobjectDefinitions { metaobjectsCount }` |
| `yotpo.product_id` absent | `metafieldDefinitions(ownerType: PRODUCT, namespace: "yotpo")` → empty |
| Inventory untracked | `inventoryItem.tracked: false`; `inventory_total:>0` → 0 |
| Installed apps | `appInstallations` |

**Not verifiable via the API, needs a Matrixify export:** exact count of products with zero media; exact count of duplicate product records. Matrixify is installed on production.

Prior audits this builds on: `audit/ga4-status.md` · `audit/analytics-live-site.md` · `audit/analytics-data-quality.md` · `audit/yotpo-homepage-reviews.md` · `audit/yotpo-rollback.md` · `audit/open-decisions.md` · `audit/metafield-map.md`
