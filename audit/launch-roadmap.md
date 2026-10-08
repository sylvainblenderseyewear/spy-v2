# SPY // SFCC → Shopify Plus — Launch Roadmap

**Written:** 21 Sep 2026 · **Rebased:** 7 Oct 2026 · **Re-measured:** 8 Oct 2026 · **Launch (P5):** 1 Nov 2026 · **Days remaining: 24 (3.5 working weeks)**
**Store audited:** `spyoptic-com.myshopify.com` ("SPY+ Optic", Shopify Plus) — all figures measured 16 Sep 2026 via Admin API, read-only. No writes were made.

> **Rebase note — 7 Oct 2026.** Sylvain moved the cutover from **12 Oct** to **1 Nov 2026**. This document was re-dated on 7 Oct: every due date, the week-by-week plan, the gates and §9 now run to 1 Nov. **No status changed** — nothing is marked done that was not already done on 21 Sep. Items whose original due date has already passed are flagged **OVERDUE** and carried forward with a new date; the point of the rebase is to show what slipped, not to hide it. Every measured figure (725 products, 327 unpublished, 104 duplicate-SKU products, ~35 dead nav links, 16 $0.00 products) is unchanged and still dates from the 16 Sep audit. Note that **1 Nov 2026 falls on a Sunday** — the cutover and war room are a weekend shift and day 1 lands Mon 2 Nov.

> **Re-measure note — 8 Oct 2026.** The 7 Oct rebase deliberately froze every status at 21 Sep so the
> slip stayed visible. That was honest about the delay but left the document **understating real
> progress in six places**. Every figure below has now been re-queried against the production Admin API
> on 8 Oct. **The catalog data load landed on 24 Sep** — descriptions, spec metafields, product media,
> and the full customer and order history — which answers §10 Q1, the question this plan said governs
> the date. BigQuery, the CMP and the GA4 pixel were also already done. Nothing genuinely open has been
> quietly closed: publication state, collections, pages, redirects, pricing and inventory are
> **unchanged to the unit** since 16 Sep, and are flagged as such. Rows corrected on 8 Oct are marked
> **[re-measured 8 Oct]**.

Sequenced by **reversibility**, not by workstream: work that cannot be recovered after cutover gets the 24 days; work that can be fixed live gets an explicit post-launch slot and stops competing for attention.

---

## 0. Verdict

**The theme is not the risk. The catalog data has landed. What is left is catalog _structure_.** [re-measured 8 Oct]

The storefront build — the bulk of `C:\spy-v2` and the thing not tracked anywhere on the Notion board — is substantially complete and already the published theme on production. **The data it renders arrived on 24 Sep**: product descriptions, spec metafields and media are populated, and the customer and order history is migrated. That closes the largest part of **P1 · Data & Integrations**, which this document previously recorded as 39 days overdue with most of its work undone.

What has not moved is everything *structural* around that data, and it is all mechanical work with no external dependency: **327 products still unpublished, 10 of 11 sampled nav collections still do not exist, 5 nav pages still 404, 2 URL redirects, 0 tracked inventory, 16 $0.00 products, all 6 custom PDP templates still unassigned.** Those figures are identical to 16 Sep — 22 days with no change.

So the risk has changed shape rather than gone away. QA can now test a catalog that exists; it cannot test a navigation that does not.

**1 Nov is reachable, and the question that used to govern it is answered.** [re-measured 8 Oct] The catalog data load — due 25 Sep, recorded here as overdue — **landed on 24 Sep** without being reported back to this document. Everything downstream of it (QA scripts, UAT, redirect verification, merchant feeds) is now unblocked.

The date is now governed by something smaller and entirely in our own hands: **the structural catalog work in T0-3, T0-4, T0-5 and T0-6.** None of it waits on another team. All of it is measured in hours. If it has still not started by **Fri 16 Oct**, choose deliberately between a scoped launch and a moved date (§7, §9) — but it would be a scheduling failure, not a dependency failure, and it should be named as one.

**What the 20 extra days actually buy.** They are real slack on the work we control. Part of it has since been spent well — the catalog load, product descriptions and spec metafields all landed on 24 Sep. What the slack still has to cover is the `technology` and `collection_story` metaobjects, the unused PDP templates, Search & Discovery and ADA remediation. Several Tier 2 items move in front of launch because of it (§6, Week 4). They buy **nothing** on the work that is waiting on someone else — the Celigo/NetSuite order flow, gift-card balances, Klaviyo/Attentive consent, Legal's consent review. Those were late on 21 Sep and are later now; a longer runway only helps there if the chase restarts today. **[re-measured 8 Oct]** Customer migration has since come off that list, and so has the CMP. **Nine of ten Tier 0 items and six of nine Tier 1 items remain past their original date** (§2, §3).

### Phase status against the board's own plan

| Phase | Planned window | Status on 7 Oct |
|---|---|---|
| P0 · Foundations | Jun 22 – Jun 30 | ✅ Complete (all 5 cards Done) |
| P1 · Data & Integrations | Jul 1 – **Aug 29** | ⚠️ **Largely closed 24 Sep** [re-measured 8 Oct] — catalog data, descriptions, spec metafields and the full customer + order history all loaded. Still open: gift cards (Blocked since 20 Jul), Celigo↔NetSuite not reconnected, inventory untracked |
| P2 · Front-End & Apps | Jul 14 – **Sep 20** | ⚠️ **17 days overdue.** Theme done; Klaviyo, Attentive, CMP, loyalty migration not started |
| P3 · SEO / Legal / Analytics | Aug 1 – **Sep 25** | ⚠️ **12 days overdue.** 2 redirects exist, ADA not started, privacy/tax not started |
| P4 · QA & Cutover | **Sep 21** – ~~Oct 11~~ → **Oct 31** | ▶️ **In progress since 21 Sep**, on top of unfinished P1–P3 |
| P5 · Launch | ~~Oct 12~~ → **Sun 1 Nov** | — |
| P6 · Hypercare & BFCM | Oct 12 – Nov 27 → **1 Nov – Nov 27** | — (the move eats 20 days of the hypercare window; BFCM does not move) |

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
- GA4 + server-side GTM: **pixel live on production since 21 Sep**, 13 events verified end-to-end except `purchase`; consent opt-in chain verified 2 + 5 Oct; BigQuery linked and delivering; uptime alert live
- **Rebuy Smart Cart — in flight** as a mini-cart workstream (new scope, not a ship-stopper, pre-launch): spec `docs/superpowers/specs/2026-10-07-rebuy-smart-cart-design.md` · plan `docs/superpowers/plans/2026-10-07-rebuy-smart-cart.md`

### Catalog + customer data — landed 24 Sep [re-measured 8 Oct]

Not reported to this document at the time; found by re-querying the Admin API on 8 Oct.

- **Product descriptions** populated — 30 of 40 sampled carry real marketing copy
- **Spec metafields** expanded from 3 keys to 7 (`fit`, `frame_material`, `frame_color`, `lens_material`, `polarized`, `photochromic`, `available_rx`)
- **Product media** present on 39 of 40 sampled
- **10,000+ customers** and **10,000+ orders** with real SFCC order numbers, PAID, non-test
- **`fit_guide` metaobject** — 13 entries (not previously tracked here)

### Notion — 7 cards Done
All 5 **Foundations & Access** · **Audit current Celigo flows & NetSuite integration points** · **PCI / payments onboarding**

### Apps installed on production
Yotpo Product Reviews · Yotpo Loyalty & Rewards · Rebuy · Matrixify · Loop Returns · Track by Loop (Wonderment) · Stockist Store Locator · ExpertVoice · Shopify Messaging

### Commerce plumbing in place
Delivery profile with a Domestic zone (Standard + Express, both active) · published checkout profile · single active location fulfilling online orders · Shopify Payments onboarded (PCI card Done)

---

## 2. Tier 0 — Ship-stoppers

**Definition: must be true on 1 Nov or we do not cut over.** Each one either takes money incorrectly, hides the catalogue, or breaks the order path.

**All ten were due before today; nine are still open.** [re-measured 8 Oct] **T0-9 (CMP) is closed** — Pandectes is installed and the consent chain verified, leaving only Legal’s review. Each remaining row keeps its original date struck through so the slip stays visible, and carries a new date pegged to the rebased gates (§7).

| # | Item | Evidence | Owner | Due |
|---|---|---|---|---|
| **T0-1** | **$0.00 products** — 16 products carry a $0.00 variant; **6 are free in every variant** (SS25 SPY Palms Tee, SS25 SPY Bear CA Republic Tee, SPY B&B Surf Cap Black, Box Logo SS Tee Black, SPY Diego Snapback Hat Gaslamp Navy, SPY Diego Snapback Hat Friar Brown). 10 partial — including **Cyrus Switch Matte Black** and **Cyrus Switch Translucent Gunmetal**, $0.00 variants sitting beside $200 ones | Admin API, 16 Sep | You + Finance (prices) | ~~25 Sep~~ **OVERDUE as of 7 Oct** → **9 Oct** |
| **T0-2** | **Duplicate SKU schemes** — 104 products carry both a SPY `Y*` reference SKU and a UPC numeric SKU **as separate variant records**. Same pair buyable at two prices (Fiona Femme Fatale: $150 and $75). Also disagreeing sizes (Discord Gaming: Large vs Medium-Large) | 119 `Y*` products, 15 clean → 104 affected | You + whoever owns the migration | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **16 Oct** |
| **T0-3** | **327 of 725 products unpublished** to Online Store. Concentrated in winter: **Snow Goggles 19/127 visible, Snow Helmets 3/68**, Eyeglasses 149/251. Launching at the start of ski season with 3 helmets | `published_status` split, 16 Sep | You (mechanical) + Merch (confirm intent) | ~~25 Sep~~ **OVERDUE as of 7 Oct** → **9 Oct** |
| **T0-4** | **~35 of ~50 main-nav collection links resolve to nothing** — the entire Sale tree (7 links), all men's/women's splits, every curated collection (Discord Series, Helm Series, Trail, Classics, Lifestyle, Flag, Happy Boost Snow, SLAYCo, Merch, Crypto), all replacement-lens collections, apparel sub-categories, youth moto, Happy Gaming / Happy Screen | Menu vs `collectionByHandle`, 16 Sep | You | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **16 Oct** |
| **T0-5** | **Homepage references `fishing-sunglasses`** — collection does not exist | `templates/index.json` | You | ~~25 Sep~~ **OVERDUE as of 7 Oct** → **9 Oct** |
| **T0-6** | **5 nav pages missing** → 404: `prescription-sunglasses`, `prescription-eyeglasses`, `prescription-snow-goggles`, `prescription-moto-goggles`, `tech-guide` | Published pages list, 16 Sep | You + Marketing (copy) | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **16 Oct** |
| **T0-7** | **Celigo → NetSuite → 3PL order flow unproven.** P0 card, due 20 Aug, Not Started. No order has ever traversed the chain | Notion; 0 orders on store | Ops + Dev | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **16 Oct** (blocked on another team — the slack does not help here) |
| **T0-8** | **Payments live test** — real transaction + refund. `checkout_completed` has never fired; `purchase` is the only unproven event and the one carrying revenue | `audit/ga4-status.md` §2b | Finance + you | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **16 Oct** |
| ~~**T0-9**~~ | ~~**Consent / CMP** — no consent app installed~~ — **CMP done** [re-measured 8 Oct]. **Pandectes GDPR** is installed and live in Strict mode; the opt-in chain was audited 2 Oct and the decline path measured 5 Oct (0 hits before a choice, replay on grant). **Still open: Legal’s CCPA/CPRA review and the opt-in vs opt-out decision** (§10 Q6) | `appInstallations` 8 Oct; `audit/ga4-status.md` | Legal | **23 Oct** — now Legal only |
| **T0-10** | **Inventory is not tracked** — `tracked: false` on every variant, 0 products with stock, no sync. Currently sells because tracking is off; that is a fallback, not a design | Admin API, 16 Sep | Ops + Dev (via T0-7) | ~~6 Oct~~ **OVERDUE as of 7 Oct** → **23 Oct** (follows T0-7) |

---

## 3. Tier 1 — Irreversible at cutover

**Definition: permanently lost if missed. There is no second chance on any of these.** They deserve the calendar before anything in Tier 2, even though several look less urgent.

**Seven of the nine were due before today; two have since closed.** [re-measured 8 Oct] **T1-3 (BigQuery) was done on 23 Sep and T1-7 (customer migration) on 24 Sep** — both were recorded here as overdue because the 7 Oct rebase froze status. T1-1 (23 Oct) is not yet late; T1-9 is a cutover action and moves with the date. Of the rest, **T1-2, T1-4 and T1-6 sit with other teams**, so the 20 extra days are not help, only a longer wait — and **T1-2, the GA4 baseline export, is the only item on this page that becomes impossible at cutover rather than merely late.**

| # | Item | Why it cannot wait | Owner | Due |
|---|---|---|---|---|
| **T1-1** | **301 redirect map.** 2 redirects exist on production. The SFCC site has thousands of indexed URLs (`/us/{cat}/{name}-{PID}.html`). `audit/redirect-urls.csv` has 50 rows, all Pending | Ranking equity lost at cutover is not recoverable by adding redirects in week 2 — the crawl has already happened and the 404s are already banked | You | ~~9 Oct~~ → **23 Oct** (not yet late; the move turns 3 days of headroom into 9) |
| **T1-2** | **GA4 baseline export** from `G-GS5WZT8YYD` and `G-PJEFBYCC2M` (the two live SFCC properties) — 12 months of sessions, conversion rate, revenue, channel mix | **Access changes hands at cutover.** Without it there is no honest answer to "did the new site perform better", ever | Marketing / you | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **9 Oct** (sits with Marketing — the slack does not help) |
| ~~**T1-3**~~ | ~~**BigQuery export link** on GCP project `gtm-k3rx42ch-yzrjm`~~ — **DONE 23 Sep** [re-measured 8 Oct]. Daily event + user export, United States. Verified still delivering on 5 Oct: 9 daily tables, newest the day before, no gaps. The data lost is 21–23 Sep only | — | — | ✅ |
| **T1-4** | **Gift card / store-credit balances.** Notion P0, **Blocked since 20 Jul** — two months with no movement | Balances not migrated before cutover become customer-facing disputes with no source of truth once SFCC is dark | Finance + Dev | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **16 Oct** (Blocked since 20 Jul — a longer runway does not unblock it) |
| **T1-5** | **Affiliate tag continuity** — Pepperjam, Avantlink, Impact Radius all run on the live site. None has an owner on the board | If affiliate tags stop firing at cutover, **commissions break silently**. Partners discover it before we do, and the attribution gap cannot be reconstructed | Marketing | ~~6 Oct~~ **OVERDUE as of 7 Oct** → **23 Oct** (still has no owner) |
| **T1-6** | **Klaviyo + Attentive consent state.** Both Not Started; due 5 Sep. Klaviyo is P0 | Subscriber consent that is not migrated **cannot be re-obtained** without a fresh opt-in campaign. TCPA/CAN-SPAM exposure | Marketing + Dev | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **16 Oct** (sits with Marketing — the slack does not help) |
| ~~**T1-7**~~ | ~~**Customer migration.** Production has **1 customer**~~ — **DONE 24 Sep** [re-measured 8 Oct]. **10,000+ customers and 10,000+ orders** (`AT_LEAST` precision), carrying real SFCC order numbers (`SPUS002788xx`), financial status PAID, non-test, all bulk-loaded 24 Sep 05:19 UTC. **Still to verify in UAT:** saved addresses, loyalty balances, and that login/reset resolves against the migrated records | — | Dev + Ops | ✅ loaded — **UAT 21 Oct** |
| **T1-8** | **Yotpo account decision.** Two accounts: **S1** (13.3K reviews, keyed to SFCC PIDs + UPC SKUs) and **S2** (3.1K reviews, keyed to the **new Shopify product IDs**). `yotpo.product_id` definition **does not exist on production** — it was applied to staging only | Pick S1 and 360 products need the legacy-ID mapping re-applied to production. Pick S2 and we launch showing 3.1K of 13.3K reviews. Either way the star ratings are blank today | You | ~~2 Oct~~ **OVERDUE as of 7 Oct** → **9 Oct** (ours to decide, no external dependency) |
| **T1-9** | **Internal traffic filter + `debug_mode` removal + SFCC tag retirement** at cutover | GA4 IP filters are **not retroactive**. Launch-week data is the data you keep | You | ~~12 Oct~~ → **1 Nov** (cutover action) |

---

## 4. Tier 2 — Recoverable in week 1–2

**Definition: real gaps that are visibly imperfect but fixable on a live store.** Do not let these consume the Tier 0 / Tier 1 calendar — Week 4 is their slot, and only if Gate C held.

The 20 extra days are genuinely useful here: this is the one tier where slack converts directly into quality. Week 4 (26–31 Oct) is reserved for it, so several targets below move in front of the cutover. Nothing here has been marked done — only re-targeted.

| # | Item | Measured | Target |
|---|---|---|---|
| ~~T2-1~~ | ~~**Product descriptions — 0 of 115 sampled have any**~~ — **largely landed 24 Sep** [re-measured 8 Oct]: **30 of 40 sampled carry real copy**. The gap is now apparel, pouches and replacement lenses, not eyewear | 40-product sample, 8 Oct | Count the remainder and fill the tail — Week 4, much smaller job than planned |
| T2-2 | **`templateSuffix` is null on all 115 sampled** — all 6 custom PDP templates (snow-goggle, moto-goggle, helmet, lens, apparel) are **built and unused**. Every product renders on `product.default` | Admin API | Mechanical; the move makes it a pre-launch item — Week 4, with the catalog load |
| T2-3 | **`technology` metaobject has 1 entry** (needs ~10: Happy Lens, Happy Boost, Anti-Fog, Anti-Scratch, Eco Materials, Magnetic Lens, Mono Shield, PC Lens, Snap Hinge, MIPS). Tech badges, lens-info modal and tech-guide pages render empty | `metaobjectsCount: 1` | Pull into Week 4 pre-launch; week 1 post-launch at the latest |
| T2-4 | **`collection_story` metaobject has 0 entries** — `collection.story` template has no data to render | `metaobjectsCount: 0` | Follows T0-4 |
| T2-5 | **Search & Discovery not installed** → PLP facets limited to Availability/Price. Colour facet additionally blocked on a colour-family metafield | App list | Install + configure facets pre-launch (Week 3) — the slack buys this one |
| T2-6 | **Spec metafields — partly landed** [re-measured 8 Oct]. Now populated: `fit`, `frame_material`, `frame_color`, `lens_material`, `polarized`, `photochromic`, `available_rx` (3 keys → 7). **Still absent: `reference`, `weight_g`, `vlt_percent`, `lens_category`, `technologies`** — so the Technical Information table renders partially, and the lens-info modal still has no VLT or category | 40-product sample, 8 Oct | Week 4 — needs a second load, not a first one |
| T2-7 | **Products with zero media.** Present in the sample at a material rate; exact count needs a Matrixify export (image filters are not supported in Admin search) | Sample | Week 1, after counting |
| T2-8 | **Duplicate product records** — near-identical handle pairs (`…-snow-helmet` / `…-snow-helmet-0438`) across helmets; 43 products have a `-0` handle suffix | Admin API | Merge after T0-2 |
| T2-9 | **`vendor` is both "Spy" and "SPY"** — GA4 reports two brands. Pixel masks it with `.toUpperCase()`; catalogue, Merchant Center feed and anything else reading `vendor` still see two | `audit/analytics-data-quality.md` §3 | Trivial, week 1 |
| T2-10 | **ADA / WCAG 2.1 AA audit** — P0 on the board, Not Started, due 25 Sep | Notion | **OVERDUE** — the 25 Sep board start date passed with nothing started. Start now, remediation pass in Week 4, continue post-launch |

---

## 5. Tier 3 — Deferred to Phase 2

Confirmed out of scope for 1 Nov. Listed so they stop being re-litigated. The move does **not** reopen any of them — it shortens the gap to the Phase 2 dates instead.

- **Markets / multi-locale** — you've cut this; production stays single-locale English/US. The theme already avoids hardcoded strings, so the structure survives for later.
- **Flexport migration** (board: Nov 10) · **B2B full build-out** (Nov 20) — now 9 and 19 days after cutover instead of 29 and 39. Either they move too, or they land on top of hypercare
- **VTO** and **Compare** — decided out in Phase 0 (`audit/open-decisions.md`)
- **Meta CAPI / Google Ads / TikTok through sGTM** — board has these at P1 High; `audit/ga4-status.md` correctly schedules them for days 2–5 post-launch, deduped on `transaction_id`
- **Cloud Run minimum instances** — launch week at the earliest; the free Cloud Scheduler ping is the better first move

---

## 6. Week-by-week

Rebuilt on 7 Oct for the 1 Nov cutover. Four week-blocks instead of three; the fourth is the slack the move actually bought, and it is reserved for catalog depth and the freeze — **not** for new scope.

### Week 1 · Mon 5 – Sun 11 Oct — *clear the overdue wave*

**Two days of this week are already gone, and the whole of the original Weeks 1–2 is now past due.** Nothing here is a fresh start; it is the 25 Sep and 2 Oct lists, re-dated.

| Day | Action |
|---|---|
| ~~Mon 5 – Tue 6~~ | Elapsed. No status change recorded. Every Tier 0 item and seven Tier 1 items carry forward **OVERDUE** |
| **Wed 7** | **Re-escalate catalog ownership to Sylvain in writing** (§8 Q1). The 25 Sep answer never landed and it still governs the date — the new date does not change that. Same message: BigQuery link (T1-3), GA4 baseline export (T1-2) |
| Wed 7 | Re-send the `$0.00` list to Finance for correct prices (T0-1). Do not guess prices |
| Wed 7 | Yotpo account decision (T1-8) — ours alone, no external dependency, so there is no reason it is still open |
| Thu 8 | Publish the hidden 327 — or get Merch to confirm which are intentionally hidden (T0-3). Mechanical, highest visible payoff of the week |
| Thu 8 | Fix `fishing-sunglasses` on the homepage (T0-5) — either create the collection or repoint the section |
| Thu 8 | Chase Marketing again: Klaviyo + Attentive install and consent migration (T1-6). Over a month past their 5 Sep board date |
| Fri 9 | **GATE A** (§7) — the same gate that was set for 25 Sep, now two weeks late |

### Week 2 · Mon 12 – Sun 18 Oct — *build and integrate*

| Day | Action |
|---|---|
| Mon 12 | Generate the 301 map from the SFCC sitemap + PID list; `audit/redirect-urls.csv` goes from 50 rows to complete (T1-1) |
| Mon 12 | Build the missing collections (T0-4). Automatable from `collection::MODEL` tags + product types — spec the rules once, generate the set |
| Tue 13 | Create the 5 missing pages (T0-6); Marketing supplies copy, prescription pages link out to SportRx per the Phase 0 decision |
| Wed 14 | Celigo end-to-end test with Ops: order → NetSuite → 3PL → inventory → tracking (T0-7). Blocked on another team since 20 Aug — book the slot now, not on the day |
| Thu 15 | Payments live test: real transaction + refund; verify the `purchase` payload and `transaction_id` (T0-8) |
| Fri 16 | Dedupe pass on the 104 dual-SKU products (T0-2) — decide which scheme survives, make the other an identifier on the same variant |
| Fri 16 | **GATE B** (§7) |

### Week 3 · Mon 19 – Sun 25 Oct — *verify*

| Day | Action |
|---|---|
| Mon 19 | Consent/CMP installed and bridged to `Shopify.customerPrivacy.setTrackingConsent` (T0-9) |
| Mon 19 | Inventory tracking switched on and synced, once Celigo is proven (T0-10, follows T0-7) |
| Mon 19 | Cutover runbook + rollback plan written (board card, originally Oct 5) |
| Tue 20 | Full functional QA: browse → cart → checkout → order → NetSuite → 3PL → tracking. Desktop 1440 / tablet 768 / mobile 390 |
| Tue 20 | Rebuy Smart Cart mini-cart in QA with the rest of the funnel (new scope, pre-launch, not a ship-stopper) |
| Wed 21 | Data-integrity UAT: login/reset, order history, gift cards, loyalty (T1-4, T1-7) |
| Thu 22 | Load the 301 map; verify a sample against live SFCC URLs (T1-1) |
| Thu 22 | Install Search & Discovery and configure the facets (T2-5) — the extra week pulls this in front of launch |
| Fri 23 | **GATE C** (§7) |

### Week 4 · Mon 26 – Sat 31 Oct — *the slack, then freeze*

**This is the week the move bought.** It is for catalog depth and the freeze. If Gate C did not hold, this week is for Gate C, not for Tier 2.

| Day | Action |
|---|---|
| Mon 26 | Product descriptions, top-traffic PDPs first (T2-1) — the pass that did not fit before |
| Mon 26 | Apply the 6 custom PDP templates via `templateSuffix` (T2-2) |
| Tue 27 | Spec metafields with the catalog load (T2-6); seed the ~10 `technology` metaobjects (T2-3) |
| Wed 28 | `collection_story` entries for the curated collections (T2-4, follows T0-4); `vendor` case fix (T2-9) |
| Wed 28 | ADA / WCAG remediation pass (T2-10) |
| Thu 29 | Lower DNS TTL on `spyoptic.com` — must be done ≥48h before cutover |
| Thu 29 | Content + inventory freeze begins |
| Fri 30 | **GATE C2** (§7) — freeze holds and Gate C is still true a week later |
| Sat 31 | Final delta data load (board card, originally Oct 11) |

### Launch · Sun 1 Nov

**1 Nov 2026 is a Sunday.** The cutover, the smoke test and the war room are a weekend shift, and day 1 reconciliation falls on Mon 2 Nov. Staffing needs confirming with Sylvain (§10 Q9).

| Time | Action |
|---|---|
| AM | **GATE D — final go/no-go** |
| Cutover | Disable password · connect domain · DNS switch |
| +0h | **Confirm** the GA4 pixel is connected and current — it has been live on production since **21 Sep**, so this is a check, not an install. Verify `PENDING_MAX` is in the deployed copy and `debug_mode` is gone. Full sequence in `audit/ga4-cutover-runbook.md` |
| +0h | Retire SFCC tags · annotate launch date in GA4 · confirm `debug_mode` is gone |
| +1h | Smoke test: place a real order end-to-end through to 3PL |
| +2h | Apply the internal traffic filter using real team IPs (T1-9) |
| All day | War room / monitoring (board card) |

### Day 1–5 post-launch
Reconcile GA4 revenue against Shopify Admin (day 1, Mon 2 Nov) · Meta CAPI + Google Ads through the container, deduped on `transaction_id` (days 2–5, Tue 3 – Fri 6 Nov) · channel grouping vs the SFCC baseline, watching for redirects inflating direct traffic (day 7, Sat 7 Nov) · then Tier 2, in order.

**Freeze all tagging changes from mid-November to Cyber Monday.** This is the one place the new date hurts: the 12 Oct plan left roughly five weeks between launch and the freeze, and 1 Nov leaves about two. Everything in the days 1–5 list has to land in that window or wait until December.

---

## 7. Gates

Each gate is a written go/no-go. Failing a gate is not a reason to push through — it is the signal to invoke §9.

The extra week adds one checkpoint (**C2**) so the gap between Gate C and the cutover is not seven unwatched days.

| Gate | Date | Must be true |
|---|---|---|
| **A** | ~~Fri 25 Sep~~ → **Fri 9 Oct** | **Re-run 8 Oct: 2 of 5 pass, 1 unknown.** ✅ Catalog ownership — answered by the data arriving on 24 Sep, not by a reply · ✅ BigQuery linked (23 Sep, verified delivering 5 Oct) · ❌ $0.00 prices from Finance — **still 16 products, unchanged** · ❌ publication state corrected or confirmed — **still 327 unpublished, unchanged** · ❓ GA4 baseline export requested — **still no owner, and the only gate item that cannot be recovered after cutover** |
| **B** | ~~Fri 2 Oct~~ → **Fri 16 Oct** | Every nav link resolves · 301 map generated · Celigo order flow proven end-to-end · payments tested with a real transaction and refund · Klaviyo + Attentive installed with consent migrated |
| **C** | ~~Fri 9 Oct~~ → **Fri 23 Oct** | Full QA pass · consent live · analytics verified · gift cards and customers migrated · runbook + rollback signed off |
| **C2** | **Fri 30 Oct** | Gate C still true a week on · DNS TTL lowered · content + inventory freeze holding · Tier 2 catalog work landed or consciously dropped |
| **D** | ~~Mon 12 Oct~~ → **Sun 1 Nov, AM** | Gate C2 holds after the freeze and delta load · rollback rehearsed · war room staffed (on a Sunday — confirm cover) |

---

## 8. Dependencies — not yours

Each row is a chase-list item: who owns it, the exact ask, and the date it must land to protect 1 Nov.

**This is the section the extra 20 days do not help.** Every row below is waiting on another team, and **every one of them was already past its date on 7 Oct**. A later cutover lengthens the wait; it does not shorten the queue. Re-send each ask with the new date attached — a moved launch read as "we have time now" is how 1 Nov fails the same way 12 Oct did.

| Owner | The exact ask | Needed by | Board status |
|---|---|---|---|
| ~~**Sylvain (PM)**~~ | ~~Who owns the catalog data load, and what date does it land?~~ — **ANSWERED by delivery, 24 Sep** [re-measured 8 Oct]. Descriptions, spec metafields, media, customers and orders all loaded. **Replacement ask: who ran it, and will they run a second pass** for `reference`, `weight_g`, `vlt_percent`, `lens_category`, `technologies` — and for the collections, which did *not* come with it? | **16 Oct** | Not on board |
| ~~**Sylvain (PM)**~~ | ~~Link the GA4 BigQuery export on `gtm-k3rx42ch-yzrjm`~~ — **DONE 23 Sep**, verified delivering 5 Oct | — | ✅ |
| **Sylvain (PM)** | Google Cloud access for the load balancer + Cloud Run config, or confirm Cloud Run domain mapping is available (free path) | ~~28 Sep~~ **OVERDUE** → 16 Oct | Not on board |
| **Finance** | Correct prices for 16 products with $0.00 variants, 6 of them free in every variant | ~~25 Sep~~ **OVERDUE** → **9 Oct** | Not on board |
| **Finance** | Tax configuration (Shopify Tax / US nexus) + sign-off | ~~2 Oct~~ **OVERDUE** → 16 Oct | Not Started, due 25 Aug |
| **Finance + Dev** | Gift card / store-credit balance export, reconciled — **Blocked since 20 Jul** | ~~2 Oct~~ **OVERDUE** → **16 Oct** | **Blocked**, P0 |
| **Marketing** | Klaviyo: connect, rebuild flows, migrate lists/segments, **preserve consent** | ~~2 Oct~~ **OVERDUE** → **16 Oct** | Not Started, due 5 Sep, P0 |
| **Marketing** | Attentive: reconnect, migrate subscribers + consent (TCPA) | ~~2 Oct~~ **OVERDUE** → 16 Oct | Not Started, due 5 Sep |
| **Marketing** | Own the 3 affiliate networks (Pepperjam, Avantlink, Impact) through cutover | ~~6 Oct~~ **OVERDUE** → **23 Oct** | No owner |
| **Marketing** | Export 12 months of baseline from `G-GS5WZT8YYD` + `G-PJEFBYCC2M` before access changes hands | ~~2 Oct~~ **OVERDUE** → **9 Oct** | Not on board |
| **Marketing** | Copy for the 4 prescription pages + tech-guide index | ~~29 Sep~~ **OVERDUE** → 13 Oct | Not on board |
| **Marketing / Merch** | Confirm the free-shipping threshold — homepage says $50, PDP says $100 | ~~2 Oct~~ **OVERDUE** → 16 Oct | Open since Phase 0 |
| **Merch** | Confirm which of the 327 unpublished products are intentionally hidden | ~~25 Sep~~ **OVERDUE** → **9 Oct** | Not on board |
| **Ops + Dev** | Reconnect 3PL to NetSuite via Celigo, own + test | ~~2 Oct~~ **OVERDUE** → **16 Oct** | Not Started, due 20 Aug, P0 |
| **Legal** | Cookie consent / CCPA-CPRA review; confirm whether the US opt-out model carries over | ~~6 Oct~~ **OVERDUE** → **23 Oct** | Not Started, due 15 Sep |
| **Legal** | Updated privacy policy, terms, returns/refund for the new stack | ~~6 Oct~~ **OVERDUE** → 23 Oct | Not Started, due 1 Sep |
| **Legal + Marketing** | Email/SMS consent + marketing compliance review (CAN-SPAM / TCPA) | ~~2 Oct~~ **OVERDUE** → 16 Oct | Not Started, due 20 Aug |
| **Dev + vendor** | ADA / WCAG 2.1 AA audit | ~~start 25 Sep~~ **OVERDUE** → start **9 Oct** | Not Started, P0 |

---

## 9. If Gate A fails

Gate A already failed once. It was set for 25 Sep, catalog ownership was not answered, and the move to 1 Nov is what followed. **The move is the mitigation — it is not a second free pass.** If ownership is still unresolved at the rebased Gate A on **9 Oct**, do not carry the uncertainty into the back half of October. Two honest options — this is a business call, not a technical one:

**Option 1 — Scoped launch on 1 Nov.** Launch with the categories that are actually complete. **Sunglasses is 127/127 published; Motocross Goggles 61/63.** Snow Goggles (19/127) and Snow Helmets (3/68) follow in week 2. The cost: going live partway into ski season without the snow range, which is a marketing problem, not an engineering one — and a worse one on 1 Nov than it was on 12 Oct.

**Option 2 — Move again. There is no longer a clean slot.** The equivalent of the old "two extra weeks" is **15 Nov**, which lands inside the mid-November tagging freeze and the BFCM run-up, and leaves no hypercare room before Cyber Monday. The next genuinely clean window is after BFCM, in December. **1 Nov is effectively the last clean date this year** — that is the real cost of the 20 days, and Sylvain should hear it that way rather than as free slack.

**What not to do:** launch on 1 Nov with the full catalogue half-populated. Empty descriptions on 725 PDPs, dead nav links and duplicate products do more lasting brand and SEO damage than either option above.

---

## 10. Open questions

1. ~~**Catalog** — who owns the load, when does it land?~~ **Answered 24 Sep by delivery.** [re-measured 8 Oct] Replacement question: **who ran the load, and will they run a second pass** for the missing spec keys and — critically — for the **collections**, which did not come with it? *(T0-4 is now the governing item, not the data)*
2. **Yotpo** — S1 with re-applied legacy ID mapping, or S2 with 3.1K of 13.3K reviews?
3. **Publication** — are the 327 unpublished products intentional, or an incomplete import?
4. **SKU scheme** — does UPC or SPY reference survive the dedupe? The other becomes an identifier on the same variant, not a second variant.
5. **Sale collections** — is there a Sale season at launch? Seven nav links currently point at nothing.
6. **Consent model** — the US site serves opt-out (tags granted by default). Does Legal accept carrying that to Shopify?
7. **Free shipping** — $50 or $100?
8. **Redirect source** — is there an SFCC URL export, or do we crawl to build the map?
9. **Sunday cutover** — 1 Nov 2026 is a Sunday. Who staffs the war room, Ops and 3PL on a weekend, and does Shopify/3PL support cover it? *(new with the rebase)*
10. **BFCM collision** — launch is now 4 weeks before Cyber Monday, inside the board's P6 Hypercare & BFCM window. Does the mid-November tagging freeze still hold, and do Flexport (Nov 10) and B2B (Nov 20) move? *(new with the rebase)*

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

### Re-measured 8 Oct 2026

Same method, same store, read-only. Run to separate what had actually moved from what the frozen
7 Oct rebase still showed as open.

| Claim | 16 Sep | 8 Oct |
|---|---|---|
| Total products | 725 | **725** — unchanged |
| Unpublished | 327 | **327** — unchanged |
| Snow Goggles published | 19/127 | **19/127** — unchanged |
| Snow Helmets published | 3/68 | **3/68** — unchanged |
| $0.00 products | 16 | **16** — unchanged |
| `sku:Y*` products | 119 | **119** — unchanged |
| URL redirects | 2 | **2** — unchanged |
| Products with inventory | 0 | **0** — unchanged |
| `fishing-sunglasses` | missing | **still missing** |
| Nav collections probed | ~35 dead | **10 of 11 still null** — only `mens-sunglasses` resolves |
| Prescription + tech-guide pages | 5 missing | **still missing** |
| `technology` metaobject | 1 | **1** — unchanged |
| `collection_story` metaobject | 0 | **0** — unchanged |
| `templateSuffix` | null on all | **null on all 40 sampled** |
| Search & Discovery | not installed | **not installed** |
| Customers | 1 | **10,000+** (`AT_LEAST`) |
| Orders | 0 | **10,000+**, SFCC numbers, PAID, non-test |
| Descriptions | 0 of 115 | **30 of 40 sampled** |
| spec metafield keys | 3 | **7** |
| Consent app | none | **Pandectes GDPR installed** |
| Total collections | — | **173** |

Gift card count could not be read — the connector lacks `read_gift_cards`, so **T1-4 remains unverified
either way** and must be confirmed by hand in the admin.

**Not verifiable via the API, needs a Matrixify export:** exact count of products with zero media; exact count of duplicate product records. Matrixify is installed on production.

Prior audits this builds on: `audit/ga4-status.md` · `audit/analytics-live-site.md` · `audit/analytics-data-quality.md` · `audit/yotpo-homepage-reviews.md` · `audit/yotpo-rollback.md` · `audit/open-decisions.md` · `audit/metafield-map.md`
