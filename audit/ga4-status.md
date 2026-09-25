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

**All eleven verified in the field on production (22 Sep).** Every event has now been seen arriving,
not just written. DevTools confirmed the hits leave for our own domain (filter `sgtm`, three
`collect?v=2&tid=G-1F4T2NDY34` rows, all 200) and GA4 Realtime listed each event name.

**Bug found and fixed while testing: the empty cart killed `view_cart`.** Shopify sends `data.cart`
as `null` when the cart is empty; the handler dereferenced it straight away and threw, so the
subscriber died silently. Ten handlers had the same unguarded shape. All now bail cleanly on a
missing object (`86cb05f` plus the guard commit). Confirmed after the fix: an empty cart sends
nothing and does not throw, a cart with an item sends `view_cart`.

**`remove_from_cart` only fires from the cart page**, because the header bag opens a drawer and
nothing on the site links to `/cart`. Expect `view_cart` to stay near zero in production — correct
behaviour for a drawer store, but it looks exactly like a broken event to anyone who finds it later.

Still unknown: whether **`shipping_tier`** and **`payment_type`** actually populated. `shipping_tier`
reads `shippingLine.title` and `payment_type` reads `transactions[0].gateway`; neither field name
could be verified, as the Shopify docs lookup failed. Both are read guarded, so a missing field is
simply omitted and nothing breaks. Realtime does not show parameters, so answering this needs
`debug_mode: true` and DebugView.

**Promotion events wired 25 Sep — not yet verified.** The theme had been publishing
`custom_view_promotion` and `custom_select_promotion` from six banner sections since the promotion
work, and the pixel subscribed to neither, so it was dead code producing no data. The pixel now maps
them to GA4 `view_promotion` / `select_promotion`. Thirteen events wired, eleven proven in the field.

One assumption to confirm on the next paste: custom events carry their payload in
**`event.customData`**, not `event.data`. If that is wrong the events still fire but with empty
parameters rather than throwing. Check Realtime for `view_promotion` after scrolling a homepage
banner, and confirm `promotion_name` is populated rather than blank.

### Two debugging traps, both cost an hour to learn

**Tag Manager server Preview is blind on this store.** It claims sessions with a cookie on
`sgtm.spyoptic.com`, but the pixel runs in a sandboxed iframe on `spyoptic-com.myshopify.com`, so
that cookie is third-party and gets dropped. Preview sat completely empty while data flowed
perfectly. Use **DevTools → Network, filter `sgtm`** and **GA4 Realtime** instead.

**Pixel Helper reports "Did not load" on the first page after clicking Test.** The sandbox is still
registering when the extension snapshots the page. Every later navigation reports Loaded correctly.
Not a homepage fault — our pixel's top-level code is page-agnostic.

### Consent — verified end to end (25 Sep)

Pandectes GDPR (installed by Sylvain) is the CMP. Banner set to **Auto pilot — Worldwide**, shown to
every region including the US, where Shopify says one is not required.

The whole chain is proven through the real shopper path:

| Step | Evidence |
|---|---|
| Shopper declines on the banner | Pandectes dashboard logs it |
| Pandectes → Shopify Customer Privacy API | `currentVisitorConsent()` flips `'no'` ⇄ `'yes'` |
| Shopify → pixel | pixel reads the state at load |
| Declined → nothing sent | **0 of 397 requests** matched `sgtm` on a full page load |

Declining sends **nothing at all** — not even the anonymous pings standard Consent Mode would still
send. Shopify withholds the pixel entirely. That is stricter than required and the right outcome.

**Gotcha that cost an hour: consent chosen on the `/password` page is not written to Shopify.**
Pandectes logs the click but `currentVisitorConsent()` stays empty, which looks exactly like a broken
integration. Pre-launch only — there is no password gate once the store is live. **Always test
consent from a real storefront page.**

**`sale_of_data` is the one field Pandectes does not set** — it stayed empty while the other three
changed. That is the US "do not sell my data" signal, which Shopify already handles through its own
opt-out page in California and 14 other states. Our pixel treats an unset value as permissive, which
matches the US opt-out model.

Diagnostics worth keeping — run in the DevTools console on a storefront page, context `top`:

```js
window.Shopify.customerPrivacy.currentVisitorConsent()          // what Shopify holds
window.Shopify.customerPrivacy.setTrackingConsent(              // force a state to test with
  {analytics: false, marketing: false, preferences: false, sale_of_data: false},
  () => location.reload()
)
```

Then read `gcs` in the Payload tab of any `collect` request: `G111` = granted, `G100` = denied.
**Untick "Keep log" first** — stale rows from before a consent change will show the old value and
send you chasing a bug that is not there.

---

## 1. Yours — nothing blocking these

| | Task | Time | Why it matters |
|---|---|---|---|
| ~~1~~ | ~~Re-paste the pixel~~ — **done 21 Sep**, all 11 events verified | — | — |
| ~~2~~ | ~~Enable logging on `sgtm-backend`~~ — **done 22 Sep**, sample rate 1. Cloud CDN got switched on during the edit and was switched back off | — | — |
| ~~3~~ | ~~Fix the cold start~~ — **done 22 Sep**, min instances 0 → 1 | — | — |
| ~~4~~ | ~~Investigate the 4xx~~ — **done 22 Sep**, see below | — | — |
| ~~5~~ | ~~Link BigQuery~~ — **done 23 Sep**, daily event + user export, United States | — | — |
| ~~6~~ | ~~Unwanted referrals~~ — **done 23 Sep**: `paypal.com`, `shop.app`, `shopify.com`, `stripe.com`. Add `spyoptic.com` at cutover | — | — |
| 7 | **Internal traffic rule** — define it with the team's IPs, leave the filter on **Testing** | 15 min | Needs the team's IPs, so ask now. Switch to Active at cutover, not before — permanent and not retroactive |
| 8 | **"Purchases below 1" custom insight**, emailed daily | 5 min | The only thing that will tell you the pixel died after launch. Otherwise you find out when someone questions the revenue |
| 9 | **Enable 2SV**, save backup codes | 10 min | Hard deadline **20 Oct** — eight days after launch. Miss it and you lose GCP console access |
| 10 | **Separate staging from production GA4** — must happen before cutover | 30 min | See below |

**Staging is polluting the production property (found 23 Sep).** Both `spyoptic-com` and
`spydevsylv` run the same pixel with the same `G-1F4T2NDY34`, so every test on staging lands in the
same reports as real customers. Surfaced by GA4's own cross-domain suggestions, which offered both
store domains.

Harmless today — none of the data is real. **Not harmless after launch**: staging tests would inflate
sessions, add phantom add-to-carts, and a test order there would post fake revenue.

Fix: create a second GA4 property for staging and change `TAG_ID` in the staging store's pixel only.
Keeps the ability to verify tracking changes before they reach production, which is how this week's
work was done. The alternative — removing the pixel from staging — is simpler but gives up that
safety net.

**Tag diagnostics — decided 23 Sep, do not revisit.** GA4 flags *"Unsupported tag implementation
detected on Shopify"* and offers to migrate the tag into the Google & YouTube app. **Do not accept.**
That app sends to Google directly and cannot target a server container, so migrating would discard
`sgtm.spyoptic.com`, the first-party `FPID` cookie and the whole server-side design. "Unsupported"
means "not Google's recommended path", not "broken" — ours is verified working on real orders.

Related: when the Google & YouTube app is eventually installed for Merchant Center, **its GA4
measurement must be disabled**, or it becomes a second source of purchase events and double-counts
revenue.

The *"some pages are not tagged"* warning is a false positive: Google's crawler looks for gtag in the
page source, and ours runs inside Shopify's sandboxed pixel iframe where the crawler cannot see it.

**On the 4xx (closed 22 Sep).** 3,230 in a week, all of it internet background noise hitting the load
balancer's raw IP: `/.git/config`, `/remote/login`, `PROPFIND /`, favicon requests. Any public IP
collects this. **No `/g/collect` among them** — not one real event is being rejected.

**On the cold start (closed 22 Sep).** The Container instance count chart was a square wave flipping
between 0 and 1 all day — the container scaled to zero between visits and the first request after
each gap failed. That was the intermittent event loss seen during testing. Minimum instances is now
1, so one container stays warm.

Cost note: the service bills **Instance-based**, not request-based, so a pinned instance is roughly
**$45–50/month**, not the $10–30 estimated earlier. Request-based would cost about $7 but throttles
CPU between requests, which risks truncating the async sends GTM performs after responding — not a
trade worth making before launch, and worse once Meta CAPI and Google Ads route through the same
container. A Cloud Scheduler ping is not a cheaper alternative here: under instance-based billing,
keeping the container alive costs the same however you do it.

---

## 2. Waiting on other people

### ~~2a. BigQuery export~~ — done 23 Sep

Linked to `gtm-k3rx42ch-yzrjm`, location United States, **daily** export of both event data and user
data. Streaming deliberately not enabled: Google states it is best-effort with no completeness
guarantee, which is the wrong trade for revenue reconciliation, and Realtime already covers anything
genuinely time-sensitive. It can be added later without losing anything.

Dataset `analytics_553360689` appears in the Cloud console after the first overnight run. Worth
confirming a table lands — the link existing is not proof that data flows.

Blocked for two days on `serviceusage.services.enable` and `resourcemanager.projects.setIamPolicy`,
resolved once Sylvain granted access.

### 2b. Baseline export from the old GA4 — now the most time-critical item here

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
