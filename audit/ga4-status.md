# GA4 + server-side GTM — status and remaining work

Last checked: **21 Sep 2026**. **Launch is 12 Oct — three weeks out.**

The tracking is built, live and verified end to end through our own domain. What remains is other
people's permissions, a short list of launch-day actions, and one thing only you can do today.

**Key IDs**

| | |
|---|---|
| GA4 property | `G-1F4T2NDY34` ("Spy Optic", inside the Blenders Eyewear GA account) |
| Google tag | `GT-NS4QG8B8` |
| Server container | `GTM-K3RX42CH` ("Spy Optic - sGTM") |
| Tagging domain | `https://sgtm.spyoptic.com` — load balancer → Cloud Run `server-side-tagging` |
| GCP project | `gtm-k3rx42ch-yzrjm` (created by Sylvain; you now have access, but not IAM admin) |
| Staging store | `spydevsylv.myshopify.com` |
| Production store | `spyoptic-com.myshopify.com` ("SPY+ Optic") |
| Pixel source | `audit/ga4-custom-pixel.js` |

---

## Done and verified

**The full funnel is wired — 11 events.**

```
page_view → view_item_list → view_item → search
         → add_to_cart → remove_from_cart → view_cart
         → begin_checkout → add_shipping_info → add_payment_info → purchase
```

- **`purchase` fully verified (18 Sep)** — five test orders on production via the Bogus Gateway,
  all through `sgtm.spyoptic.com`. Every field mapping originally guessed from Shopify's docs is now
  proven against real orders:
  - `transaction_id` = Shopify order id, not the checkout token
  - `value` matches the order total exactly (spy1005: 195)
  - `shipping` = 15 on the Express order — the last untested field, now confirmed
  - `items[]` carries name, brand, category, variant, price and quantity
  - Item `price` displays as micros in DebugView (`180000000` = $180). Confirmed by arithmetic:
    spy1005 was $195 total, $15 express, so the item really was $180. Display convention, not a fault.
  - **`tax` remains untested** — the store charges no tax, so every order returned `0`. Same code
    path as `shipping`, which is proven, so the risk is low. Re-check if tax is ever configured.

- **`sgtm.spyoptic.com` is live (17 Sep)** — Google-managed certificate issued, valid to 16 Dec,
  auto-renewing. Returns 200 and sets `FPID` from our own domain, which is the whole point of the
  server-side setup. Load balancer `sgtm-lb` → `sgtm-backend` → `sgtm-neg` → Cloud Run. CDN off,
  Cloud Armor removed.

- GA4 property, Google tag, server container created and published
- GA4 tag fires on an **All Events** trigger (was Page View only — would have dropped all ecommerce)
- `FPID` cookie is server-set: HttpOnly, Secure, 2-year lifetime
- Consent granted (`gcs=G111`); identity persists across sessions and days (same `client_id`)
- Pixel runs **inside checkout** — the thing no theme snippet can do on Plus
- `page_location` fixed (was reporting the sandbox iframe URL); checkout tokens collapsed
- Enhanced Measurement off — its automatic events were measuring the hidden pixel iframe
- Event and user data retention both 14 months
- Theme: promotion tracking on 6 banner sections; carousel reports `recommendation` not `collection`
- `debug_mode` removed from the pixel source (`b4dcb36`)

**Not yet seen in the field (added 21 Sep, `86cb05f`):** `remove_from_cart`, `add_shipping_info`,
`add_payment_info`. The events themselves are safe; what is unconfirmed is two optional parameters.
`shipping_tier` reads `shippingLine.title` and `payment_type` reads `transactions[0].gateway`, and
neither field name could be verified — the Shopify docs lookup failed. Both are read guarded, so a
missing field is simply omitted. **Check for them on the next test order in Server Preview.**

---

## 1. Yours — nothing blocking these

| | Task | Time | Why it matters |
|---|---|---|---|
| 1 | **Re-paste the pixel** into Settings → Customer events on both stores | 5 min | The three new events and the `debug_mode` removal are in git but not deployed. One paste covers both |
| 2 | **Enable logging** on `sgtm-backend` | 5 min | Currently Disabled. If something breaks at launch you are blind |
| 3 | **Fix the cold start** — Cloud Scheduler ping every 5 min (free), or min instances = 1 (~$10–30/mo) | 20 min | Reproduced twice: first request after idle returns 500. In production that silently drops events, worst exactly when traffic resumes |
| 4 | **Enable 2SV**, save backup codes | 10 min | Hard deadline **20 Oct** — eight days after launch. Miss it and you lose GCP console access |

---

## 2. Waiting on other people

### 2a. BigQuery export — escalated 21 Sep

You can now see project `gtm-k3rx42ch-yzrjm`, but the GA4 link needs two permissions your role does
not grant: `serviceusage.services.enable` and `resourcemanager.projects.setIamPolicy`. The second is
needed because GA4 adds its own service account to the project IAM policy in order to write.

Either Sylvain does the link himself (five minutes, nothing granted), or he adds **Service Usage
Admin** + **Project IAM Admin**, or **Owner**. Settings when it happens: United States, **Daily
only** — streaming export costs money.

Free at our volume, but **the export never backfills**, so every day it is off after launch is raw
event data gone for good.

### 2b. Baseline export from the old GA4 — the most time-critical item here

`G-GS5WZT8YYD` and `G-PJEFBYCC2M` are live on the current SFCC site. Twelve months of sessions,
conversion rate, revenue and channel mix need exporting **before access changes hands at cutover**.
Access to those properties usually disappears the moment the old site does. Without it there is no
honest answer to "is the new site better".

### 2c. Bogus Gateway on production

Still enabled, with real payments not configured. Not analytics, but it is a launch blocker sitting
on nobody's list.

### 2d. Test orders spy1001–spy1005

Cannot be deleted from this account. Shopify also requires orders be archived or cancelled first,
and only test or manual-payment orders can ever be deleted. Cosmetic — lowest priority of anything
in this document.

---

## 3. At cutover — 12 Oct

- Confirm the pixel is connected on `spyoptic-com` and `debug_mode` is gone from the deployed copy
- Retire the SFCC tracking (`GTM-WWB4P3K`) — needs coordinating so it happens the same hour, not
  days before or weeks after
- Annotate the launch date in GA4
- Internal traffic filter with the team's real IPs — **only now**; it is permanent and not retroactive
- Smoke-test one real order all the way through
- Re-verify `tax` if tax has been configured by then

## 4. After launch

| When | Do |
|---|---|
| Day 1 | Reconcile GA4 revenue against Shopify Admin |
| Days 2–5 | Install the Google & YouTube channel, decide the authoritative purchase source, dedupe on `transaction_id`. Then Meta CAPI and Google Ads through the same container |
| Day 7 | Channel grouping against the SFCC baseline — watch for redirects inflating direct traffic |
| Mid-Nov → Cyber Monday | Freeze. No tagging changes |

**Do not install the Google channel before purchase is reconciled.** It becomes a second source of
purchase events, and installing it blind creates double-counting you cannot see.

---

## Costs — what is metering now

The GCP project billed **$0.00 for 1–14 Sep**. That changed on 17 Sep: the load balancer is a
standing charge from the moment the forwarding rule exists, roughly **$18–25/month** plus ~$0.01/GB.
It is running now, pre-launch, and it is the price of a first-party cookie domain.

Free permanently: GA4 itself, the GTM server container, all our own pixel and theme code, the
Google-managed certificate, BigQuery **daily** export, Meta CAPI and Google Ads through the
container already running.

Free now, small later: BigQuery storage (10 GiB/month free, then ~$0.02/GiB), BigQuery queries
(1 TiB/month free), Cloud Run requests (2M/month free, then ~$0.40/million). A store this size sits
near the free tier for months.

The one remaining choice is the cold-start fix in section 1: the Cloud Scheduler ping is free and
sufficient at ~8,600 requests/month; minimum instances is stronger and costs ~$10–30/month. Either
way, start it launch week, not now.

Figures are approximate US-region list prices and worth re-checking. **Worst case** — load balancer
plus minimum instances — is roughly **$30–55/month** ongoing.

---

## Not this workstream — both still need owners

**Product data.** On production the same Fiona Femme Fatale is buyable at **$150 and at $75** as two
duplicate variants, and four replacement lenses are priced at **$0.00**. Roughly a third of a
20-product sample showed the duplication, across 725 products. Detail in
`audit/analytics-data-quality.md`. This is a live pricing exposure, not a reporting bug.

**The other fourteen tracking vendors.** The current site's consent banner gates fifteen, including
three affiliate networks (Pepperjam, Avantlink, Impact Radius), Meta, Klaviyo, Microsoft
Advertising, Clarity, Yotpo, accessiBe and Snowplow. Detail in `audit/analytics-live-site.md`.
If the affiliate tags stop firing at cutover, commissions break silently and nobody notices for
weeks. Somebody needs to own that list before 12 Oct.
