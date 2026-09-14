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

## Cost analysis — what runs a meter, and when

Written for a simple rule: **nothing should be metering before the store earns.** Figures are
approximate US-region list prices and worth re-checking; the shape of the answer is what matters.

Current state: the GCP project billed **$0.00 for 1–14 Sep 2026**. Nothing is metering today.

### Free, permanently — no decision needed

| Task | Why free |
|---|---|
| GA4 itself | Standard GA4 is free. Only GA4 360 costs, and nothing here needs it |
| Server container (GTM) | Tag Manager is free; only the hosting costs |
| The pixel, theme code, all event tracking | Our own code |
| BigQuery **daily** export | Export is free. Streaming export is not — we are not using it |
| Google-managed SSL certificate | Free either way |
| Purchase testing, dedupe, baseline export, production pixel install | Configuration only |
| Meta CAPI and Google Ads through the container | Reuses the server already running |

### Free now, small later

| Task | Pre-launch | After launch |
|---|---|---|
| **BigQuery storage** | Effectively zero — no traffic | 10 GiB/month free, then ~$0.02/GiB. A store this size stays near the free tier for months |
| **BigQuery queries** | Zero | 1 TiB/month free. Normal analysis never approaches it |
| **Cloud Run requests** | Zero | 2M requests/month free, then ~$0.40/million. Likely free or a few dollars |

**Conclusion: link BigQuery now.** It costs nothing pre-launch, removes a launch-week task, and the
export cannot capture data retroactively once real traffic starts.

### The only two real costs

**1. Cloud Run minimum instances — ~$10–30/month, optional**

Fixes the cold start (first request after idle fails). Pre-launch it protects nothing, because there
is no traffic to lose. After launch a busy store keeps the container warm on its own, so the real
exposure is a handful of events in the quietest overnight hours.

- **Free alternative:** a Cloud Scheduler job pinging the server every 5 minutes prevents scale-to-zero.
  ~8,600 requests/month, inside the free allowance. Less robust than a reserved instance, but free.
- **Start the meter:** launch week, if at all.

**2. Custom domain for the tagging server — free or ~$18–25/month, depending on the path**

| Path | Cost | DNS record |
|---|---|---|
| **Cloud Run domain mapping** | **free** | CNAME → `ghs.googlehosted.com` |
| External load balancer | ~$18–25/month standing, plus ~$0.01/GB | A → static IP |

Try the mapping first — Cloud Run → service → Custom domains. If it is offered, this whole cost
disappears. Google prefers the load balancer for high-scale production, but at this volume the
mapping is very likely sufficient.

If only the load balancer is available, the meter starts the moment the forwarding rule exists, so
build it **close to launch, not now** — while still leaving 3–5 days for certificate issuance and
DNS propagation, which cannot be rushed.

### Recommended schedule

| When | Do | Cost starts |
|---|---|---|
| **Now** | BigQuery API + export link | none |
| **Now** | Try Cloud Run domain mapping. If it works, add the CNAME and finish the domain for free | none |
| **Now** | Purchase testing, as soon as a test gateway exists | none |
| **T-2 weeks** | If mapping was unavailable: build the load balancer, add DNS, wait for the certificate | ~$18–25/month |
| **Launch week** | Cloud Scheduler ping, or minimum instances if you want the stronger option | none, or ~$10–30/month |
| **At cutover** | Production pixel, retire SFCC tags, traffic filter, remove `debug_mode` | none |
| **After launch** | Google channel, dedupe, Meta CAPI, Google Ads, reconciliation | none |

### Worst case

If the domain mapping is unavailable and you choose minimum instances, the standing cost is roughly
**$30–55/month**, none of it starting before launch week. If the mapping works and you use the
scheduler ping, the ongoing cost is close to **zero**.

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
