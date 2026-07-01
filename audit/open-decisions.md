# SPY Optic → Shopify — Open Decisions (Phase 0)

> These must be answered BEFORE Phase 1 coding begins. Each decision affects the PDP or PLP build materially.

---

## 1. Prescription (RX) — HIGH PRIORITY

**✅ DECIDED: Skip for launch — link out to SportRx.**

"Buy in Prescription" button renders on eligible PDPs (`spec.available_rx = true`) as a secondary button linking to SportRx. No RX cart logic in Shopify. `spec.available_rx` controls button visibility only.

---

## 2. Virtual Try-On (VTO)

**✅ DECIDED: Drop for launch.**

No VTO widget or mount point in the PDP template. Can be added post-launch as an app block without template changes.

---

## 3. Compare Feature on PLPs

**✅ DECIDED: Keep — build 1:1 custom.**

Custom compare: checkbox on product cards, bottom comparison bar when 2+ selected, side-by-side overlay/page. Build as part of Phase 3 (PLP). Comparison state stored in sessionStorage or URL params.

---

## 4. Quick View on PLPs

**✅ DECIDED: Full custom modal — 1:1 copy of source.**

Custom Quick View modal: product images gallery, full variant picker (Frame Color swatches, Lens, Extra Lens), ATC button. Opens on hover-button click without leaving PLP. Build as part of Phase 3 (PLP).

---

## 5. Locales / International

**✅ DECIDED: Multi-locale from day 1 (Shopify Markets).**

Configure Shopify Markets for all 14 observed locales (US, BE-FR, CA-EN, CA-FR, DE, ES, FR, IE, IT, LU, NL, PT, UK, AT). Theme must use Shopify's translation system (`.t` filter, `locale` object) — no hardcoded strings in Liquid. Translations populated later; structure established now.

---

## 6. Reviews App

**✅ DECIDED: Yotpo (integrated later).**

Reserve the review widget slot in `product.default` (star rating near price, full review widget below description). Use a conditional app block mount point — renders empty until Yotpo is installed and configured. No placeholder stars hardcoded.

---

## 7. Curated Collections — Editorial vs. Grid

**Current site behavior:**
- Happy Boost Sun/Snow: currently standard product grids with collection title — minimal editorial
- Discord Series, SLAYco, Classics: ⚠️ not fully crawled — may have more editorial content

**Decision needed:**
- Which of the 9 curated collections need full `collection.story` editorial template (with hero + narrative copy)?
- Which can be standard `collection.default` with just a curated collection filter?
- Priority for Phase 3 build order?

---

## 8. Eyeglasses — Blue Light / Prescription Differentiation

**Current site behavior:**
- Blue light glasses (Happy Gaming, Happy Screen) appear on the eyeglasses PLP
- Prescription eyeglasses link out to SportRx
- "Buy in Prescription" present on eyeglasses PDPs even when `spec.available_rx = No`

**Decision needed:**
- Do blue light glasses use `product.default` same as sunglasses, or do they need a separate `product.blue-light` template?
- Same RX decision as #1 above — eyeglasses may have different RX flow than sunglasses.

---

## 9. Free Shipping Threshold — Inconsistency Found

**Observed on current site:**
- Homepage trust row: "Free Shipping for any order over $50"
- Cyrus Switch PDP trust badge: "Free Shipping for any order over $100"

**Decision needed:** What is the correct threshold? Confirm with marketing so we set ONE value in Layer 1 theme settings (trust badge copy is a theme setting, not hardcoded).

---

## 10. Announcement Bar — Editable or Pinned?

**Current content:** "🔥 CHECK OUT THE SALE SECTION" (links to /sale/)

**Decision needed:**
- Is the announcement bar content static (during sale season = just update the text setting)?
- Or does it need scheduling / multiple messages rotation?
- Cookie consent (Axeptio) — is this being migrated, replaced, or removed for Shopify?

---

## 11. Loyalty Program

**Current:** linked from homepage + footer — `/us/loyalty-program.html`. Page content unknown (not crawled).

**Decision needed:**
- Is the loyalty program a Shopify app (Yotpo Loyalty, LoyaltyLion, etc.) for the rebuild?
- Or is it an external URL / static page?
- Does the Shopify rebuild need a loyalty points display in the account section?

---

## Summary — Decisions Blocking Phase 1 Build

| # | Decision | Blocking |
|---|---|---|
| 1 | RX flow | PDP "Buy in Prescription" button + cart logic |
| 2 | VTO | PDP slot reservation |
| 3 | Compare | PLP card complexity |
| 4 | Quick View | PLP card complexity |
| 5 | Locales | Shopify Markets setup |
| 6 | Reviews app | PDP star rating block |
| 9 | Free shipping threshold | Layer 1 trust badge setting |

Decisions #1, 4, and 6 are the most blocking for Phase 1 (PDP build).
