# GA4 + server-side GTM — status and remaining work

Last checked: **14 Sep 2026**. Section 1 complete. Update this file as items close.

**Key IDs**

| | |
|---|---|
| GA4 property | `G-1F4T2NDY34` ("Spy Optic", inside the Blenders Eyewear GA account) |
| Google tag | `GT-NS4QG8B8` |
| Server container | `GTM-K3RX42CH` ("Spy Optic - sGTM") |
| Tagging server | `https://server-side-tagging-hzl3a6ofra-uc.a.run.app` (Cloud Run) |
| GCP project | `gtm-k3rx42ch-yzrjm` (created by Sylvain) |
| Staging store | `spydevsylv.myshopify.com` |
| Production store | `spyoptic-com.myshopify.com` ("SPY+ Optic") — 725 products, 0 orders |
| Pixel source | `audit/ga4-custom-pixel.js` |

---

## Done and verified

- GA4 property, Google tag, server container created and published
- GA4 tag fires on an **All Events** trigger (was Page View only — would have dropped all ecommerce)
- Tagging server live; `/g/collect` returns 200 and GA4 answers `204`
- Server sets `FPID` cookie — HttpOnly, Secure, 2-year lifetime
- Pixel installed on staging and sending data
- Verified events: `page_view`, `view_item_list`, `view_item`, `begin_checkout`
- Item payload correct: `item_id`, `item_name`, `item_brand`, `item_category`, `item_variant`, `price`, `quantity`
- Consent granted (`gcs=G111`); identity persists across sessions (same `client_id`, session 3)
- Pixel runs **inside checkout** — the thing no theme snippet can do on Plus
- `page_location` fixed (was reporting the sandbox iframe URL); checkout URLs collapsed
- Theme: promotion tracking on 6 banner sections; carousel now reports `recommendation` not `collection`
- Committed and pushed: `d786f39`, `301fcbe`, `b2b46a7`

---

## 1. You, unblocked — all done (14 Sep)

| Task | Status |
|---|---|
| Event data retention → 14 months | done |
| User data retention → 14 months | already correct |
| Enhanced Measurement → off | done — stream now measures page views only |
| GitHub theme sync question | closed — known setup, changes are visible on production after a push |

Enhanced Measurement had to go because gtag runs inside Shopify's pixel sandbox: its automatic
`scroll`, outbound-click and site-search events were measuring a hidden iframe rather than the
page. The pixel sends the real events explicitly.

**Nothing further is in your own control.** Everything below waits on someone else.

Verified while checking: the GitHub sync does deploy to `spyoptic-com`'s published theme — all
theme files confirmed byte-identical to the repo. Note that the theme's `updatedAt` does **not**
change on sync writes, so it cannot be used to detect deployments.

---

## 2. You — send these requests

### 2a. Google Cloud access — the only item with a daily cost

Project `gtm-k3rx42ch-yzrjm`. Needed for two things:

- **BigQuery export.** Does not backfill. Every day it stays off is raw event data gone for good.
  Free at our volume, daily export only.
- **Load balancer** for `sgtm.spyoptic.com`.

Confirmed blocked: the GA4 BigQuery wizard shows no projects, and entering the ID by hand returns
"BigQuery project not found" — Google's wording for *no access*. The project may also need the
BigQuery API switched on.

Give Sylvain the easy option: he can do the BigQuery link himself in five minutes without granting
access. That solves the urgent half immediately.

### 2b. Payment method on staging

`checkout_completed` has never fired — the only unproven event in the funnel, and the one carrying
revenue. Payments settings are permission-denied for this account.

Smallest possible ask: **add a manual payment method on `spydevsylv` only**, once. Two minutes, no
permissions granted, production untouched.

Interim option needing nobody: a **100% discount code** produces a $0 order that completes without
any payment method. That proves the event fires and that `transaction_id` and `items` are right —
but leaves `value`, `tax` and `shipping` untested, since all three will be zero.

### 2c. Access to the old GA4 properties

`G-GS5WZT8YYD` and `G-PJEFBYCC2M` are live on the current SFCC site. Export 12 months of sessions,
conversion rate, revenue and channel mix **before access changes hands at cutover**. Without it
there is no honest answer to "does the new site perform better".

---

## 3. Once those unblock — yours to do

| # | Task | Depends on |
|---|---|---|
| 1 | Link BigQuery export, daily, US location | GCP access |
| 2 | **Fix Cloud Run minimum instances** | GCP access |
| 3 | Test order → verify `purchase` payload | payment method |
| 4 | Load balancer + `sgtm.spyoptic.com` DNS | GCP + DNS window |
| 5 | Swap `TAGGING_URL`, remove `debug_mode` | step 4 |
| 6 | Install Google & YouTube channel | step 3 |
| 7 | Decide the authoritative purchase source, dedupe on `transaction_id` | step 6 |
| 8 | Build the GA4-vs-Shopify-Admin reconciliation check | step 7 |

**On step 2 — this is a defect, not housekeeping.** A probe on 14 Sep returned **500**, then five
consecutive 200s. That is a cold start: the first request after idle fails. In production that means
silently dropped events, worst exactly when traffic resumes after a quiet period. The automatic
GTM setup provisions a container sized for testing.

**On step 6 — do not install the Google channel before step 3.** It becomes a second source of
purchase events. Installing it while purchase is untestable creates the double-counting problem
while blind to it.

---

## 4. At cutover

- Install the pixel on `spyoptic-com` — **it goes live the moment it connects**, so this is a launch
  action, not a preparation one
- Retire the SFCC tracking; annotate the launch date in GA4
- Internal traffic filter using the real team IPs (not before — it is permanent and not retroactive)
- Confirm `debug_mode` is gone from the deployed pixel

## 5. After launch

- Day 1: reconcile GA4 revenue against Shopify Admin
- Days 2–5: Meta CAPI and Google Ads through the same container, deduped on `transaction_id`
- Day 7: channel grouping against the SFCC baseline — watch for redirects inflating direct traffic
- Freeze: no tagging changes between mid-November and Cyber Monday

---

## Not this workstream — both still need owners

**Product data.** On production the same Fiona Femme Fatale is buyable at **$150 and at $75** as two
duplicate variants, and four replacement lenses are priced at **$0.00**. Roughly a third of a
20-product sample showed the duplication, across 725 products. Detail in
`audit/analytics-data-quality.md`. This is a live pricing exposure, not a reporting bug.

**The other fourteen tracking vendors.** The current site's consent banner gates fifteen, including
three affiliate networks (Pepperjam, Avantlink, Impact Radius), Meta, Klaviyo, Microsoft
Advertising, Clarity, Yotpo, accessiBe and Snowplow. Detail in `audit/analytics-live-site.md`.
If the affiliate tags stop firing at cutover, commissions break silently.
