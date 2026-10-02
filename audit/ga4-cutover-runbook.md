# GA4 + sGTM — cutover runbook

For **12 Oct 2026**. Ordered, with a verification for every step, because launch day is not when to
work out what "done" looks like.

Status of the build is in `ga4-status.md`; the gaps are in `ga4-gap-analysis.md`.

**One correction to the older roadmap:** it lists "install the GA4 pixel on production" as a launch
action. The pixel has been connected to `spyoptic-com` since 21 Sep and has been collecting
throughout. The cutover action is to **confirm**, not install.

---

## Before the day — must be closed by 10 Oct

| | Why it cannot wait for the day |
|---|---|
| **Consent four-path test passing** (`node scripts/consent.mjs`) | The opt-in rewrite is deployed but unproven. A failure found on launch day is either untracked traffic or a tracking blackout |
| **Decision #6 answered** — opt-in or US opt-out | The code already chose opt-in. Reversing it on the day is a code change plus a re-paste |
| **Rebuy blocker rule** in Pandectes (Script, `rebuyengine.com`, Functionality) | Rebuy fires before consent today. It is a consent defect, not a tracking one, and it is someone else's console |
| **Team IP addresses collected** | The internal traffic filter is a launch-day switch, and chasing IPs on the day is how it gets skipped |
| **Baseline export** from `G-GS5WZT8YYD` / `G-PJEFBYCC2M` | Access usually moves with the old site. After that there is no comparison, ever, at any price |
| **Pixel re-pasted** if `PENDING_MAX` is absent from the admin copy | Two committed fixes are not deployed |

---

## Launch day, in order

### 1. Before DNS moves

**Confirm the pixel is connected and current.** Settings → Customer events → SPY GA4.
*Verify:* status Connected; code contains `_pandectes_gdpr` and `PENDING_MAX`; no `debug_mode`.

**Confirm the tagging server is healthy.**
*Verify:* `https://sgtm.spyoptic.com/healthz` returns 200. Uptime check shows no open incident.

**Screenshot GA4 Realtime.** A before picture makes the after picture readable.

### 2. At the moment of cutover

**Annotate the launch in GA4.** Admin → Data display → Annotations. Date, time, one line.
*Verify:* the annotation appears on a Realtime or report chart.

**Activate the internal traffic filter.** Admin → Data collection and modification → Data filters →
Internal Traffic → **Testing → Active**.
*Verify:* the filter reads Active. **Not retroactive** — anything before this is in the data forever.

**Add `spyoptic.com` to unwanted referrals.** Data streams → the web stream → Configure tag settings
→ Show all → List unwanted referrals → add as "Referral domain contains".
*Verify:* five conditions listed — `paypal.com`, `shop.app`, `shopify.com`, `stripe.com`,
`spyoptic.com`.

**Correct the data stream URL.** It still reads `https://www.spyoptic.com/us/`, which is the old SFCC
path. Change to the live storefront URL.
*Verify:* the stream details show the new URL. Cosmetic, but it is the label everyone reads later.

### 3. Retire the old tracking — same hour, not either side of it

**Remove the SFCC container `GTM-WWB4P3K`** and the two old GA4 tags
(`G-GS5WZT8YYD`, `G-PJEFBYCC2M`).
*Verify:* load the live site, DevTools Network, filter `google-analytics` and `googletagmanager` —
only `G-1F4T2NDY34` via `sgtm.spyoptic.com` should appear.

Leaving both running double-counts. Removing it early loses the last hours of baseline. Same hour.

### 4. Smoke test — a real order through the live site

Home → product → add to cart → checkout → pay → thank-you page.

*Verify in Realtime, in this order:* `page_view` · `view_item` · `add_to_cart` · `begin_checkout` ·
`add_shipping_info` · `add_payment_info` · `purchase`.

Then open the `purchase` event and check `transaction_id` matches the Shopify order ID, and `value`
matches the order total.

**If `purchase` does not appear, stop and escalate.** Everything else can be fixed later; revenue
tracking cannot be reconstructed.

### 5. Create the "purchases stopped" alert

Pointless before launch — it would have fired daily. Create it now.

Reports → Insights → View all insights → **Create** → custom insight → evaluate **daily** →
**Purchases is below 1** → email yourself.
*Verify:* the insight is listed and the notification address is right.

---

## Rollback

There is no rollback for analytics in the usual sense — data already sent cannot be recalled.

What can be undone, in order of likelihood:

| Symptom | Action |
|---|---|
| Pixel throwing, events malformed | Settings → Customer events → **Disconnect**. Stops collection instantly. Data gaps beat corrupt data |
| Tagging server down | Nothing to do at the theme level. Events are lost for the outage. The uptime alert is the only warning |
| Double-counted purchases | Usually the Google & YouTube channel adding its own GA4 tag. Disable its measurement, keep the feed |
| Consent not gating | Disconnect the pixel until it is fixed. This one is a legal exposure, not a data one |

Disconnecting the pixel is safe and reversible. Use it rather than editing code under pressure.

---

## Day 1 after

**Reconcile GA4 revenue against Shopify Admin.** Expect a mismatch and know why before you look:
`value` includes tax and shipping; Shopify's net sales excludes both. **Agree which number is
authoritative before this comparison**, or an hour disappears into a difference that is definitional.

Also remember **refunds are invisible to GA4** — there is no browser event for them. From the first
return onward, GA4 runs above Shopify and the gap grows.

**Confirm BigQuery delivered.** `analytics_553360689` should have an `events_` table for launch day.

## Days 2–5

Install the Google & YouTube channel for Merchant Center — **and disable its GA4 measurement**, or it
becomes a second source of purchase events. Then Meta CAPI and Google Ads through the same server
container, deduped on `transaction_id`.

Decide `item_id` before Google Ads goes live, not after. See `ga4-gap-analysis.md`.

## Day 7

Channel grouping against the SFCC baseline, watching for redirects inflating direct traffic.

## Then freeze

No tagging changes between mid-November and Cyber Monday.

---

## Handover

The uptime alert for `sgtm.spyoptic.com` goes to a single personal address. Before anyone's
involvement ends, move it to a shared one. An alert nobody reads is worse than no alert, because the
system looks monitored.
