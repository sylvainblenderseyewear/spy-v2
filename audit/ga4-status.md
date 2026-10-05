# GA4 + server-side GTM — status and remaining work

Last checked: **1 Oct 2026**. **Launch is 12 Oct — 11 days out.**

The tracking is built and verified end to end through our own domain. **The consent layer was
rewritten to opt-in on 29 Sep and has not been tested or confirmed deployed** — see the Consent
section below, which is the only part of this document describing unproven work.

Everything else that remains is other people's permissions or launch-day actions.

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

### Consent — rewritten to opt-in 29 Sep, verified live 2 Oct

**Verified on production** during the GDPR audit (table in `ada-performance-report.md`):

| Path | Result |
|---|---|
| Before any click | **0 GA4 hits**, 0 Rebuy, no tracking cookies |
| Accept | GA4 runs **and the landing replay fires**; 20 hits over the next 10 page views |
| Decline | `_pandectes_gdpr` status `deny`, Shopify consent all `"no"` |
| Returning / later pages | Covered by the 10-page-view run — each page re-reads the saved choice |

That closes the cookie-parse worry: `pandectesChose()` is reading `_pandectes_gdpr` correctly across
page loads, which was the failure mode that would have silently stopped all tracking.

**Decline counted and controlled (5 Oct).** The last unmeasured path, now measured on production:

```
before any choice          0 / 56  requests to sgtm
after Decline + 3 pages    0 / 346 requests
after granting consent     2 × collect, status 200, 0.4 + 0.6 kB
```

The control matters as much as the zero: without it, a blocked request and a withheld one look
identical. Requests appearing with 200s straight after consent proves the gate was doing the
blocking, not an extension or a network fault.

**Two false alarms worth knowing about, both environmental:**
- An ad blocker in the test profile would have produced a zero that means nothing. Always run the
  grant-consent control in the same window.
- A proxy produced `(failed) net::ERR_SOCKET_NOT_CONNECTED` on both hits with a 47-second page load.
  `sgtm` was healthy throughout. Test on a direct connection.

**Rebuy before consent — closed.** The 29 Sep finding (`_rsession`, `_ruid`, 8 requests) no longer
reproduces; the audit shows 0 both before and after the theme fix.

#### Superseded: the state before 2 Oct

> **Read `audit/ada-performance-report.md` §"Cookie consent" for the current live state.** The
> consent findings from 29 Sep onwards were recorded there, not here.

**The model changed.** Until 29 Sep the pixel simply mirrored Shopify's Customer Privacy API. That
API returns a *computed* answer — "may we process analytics for this visitor" — which is **allowed**
outside the EU/EEA/UK/CH when no choice has been recorded. So a US or Serbian visitor was tracked
before clicking anything, while the banner showed its toggles off. Documented live on 29 Sep.

`57416cc` makes the pixel **opt-in everywhere**, matching Blenders:

- `event` and `set` commands queue in `pending[]` instead of reaching `dataLayer`
- **`gtag.js` is not loaded at all** until consent is granted
- Consent applies only once `hasChosen` is true — either `visitorConsentCollected` fired on this
  page, or a prior choice exists in the `_pandectes_gdpr` cookie (base64 JSON, `status` empty until
  the shopper picks) or Shopify's `_tracking_consent`
- Granted → the queue replays in order, so nothing before the click is lost
- Declined → the queue is dropped and later events are blocked

`js`, `config` and `consent` commands still pass straight through and sit in `dataLayer` until the
library arrives, which is the documented gtag pattern.

**Four paths still need testing, and none has been:**

| Path | Expected |
|---|---|
| First visit, no click | Zero requests to `sgtm`, forever |
| Accept | Queue replays, hits arrive with `gcs=G111` |
| Decline | Zero requests, queue dropped |
| Returning visitor with a saved choice | Cookie parsed, consent applied without a second click |

The fourth is the one most likely to fail quietly. It parses a cookie Pandectes owns with
`atob(decodeURIComponent(raw))` — if that format ever changes, the catch returns `false`, `hasChosen`
stays false, and **nobody is ever tracked** with no error anywhere.

**Also unconfirmed: whether this version is deployed.** The commit is code-only. Check the admin copy
contains `_pandectes_gdpr`; if it does not, production is still running the 25 Sep opt-out behaviour.

**This pre-empts an open decision.** `launch-roadmap.md` Open Decision #6 — whether Legal accepts
carrying the live site's US opt-out model to Shopify — is due 6 Oct and Not Started. Opt-in is the
safe default and fixes a real problem, but if Legal keeps US opt-out this needs reverting or making
region-aware, days before launch.

**Still open on the Pandectes side:** the Functionality blacklist is empty, so Rebuy (`_rsession`,
`_ruid`, eight requests) fires before consent. Rule needed: Script, `rebuyengine.com`, Functionality.

---

#### Superseded, kept for the method (25 Sep)

The chain below was verified under the old opt-out model. The evidence is still sound; what it proved
is no longer how the pixel behaves.

| Step | Evidence |
|---|---|
| Shopper declines on the banner | Pandectes dashboard logs it |
| Pandectes → Shopify Customer Privacy API | `currentVisitorConsent()` flips `'no'` ⇄ `'yes'` |
| Shopify → pixel | pixel reads the state at load |
| Declined → nothing sent | **0 of 397 requests** matched `sgtm` on a full page load |

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

## Verification run — 5 Oct

Eleven things that were assumed rather than measured, checked one by one a week before launch.

| | Checked | Result |
|---|---|---|
| 1 | GA4 hits after Decline | ✅ 0 before consent, 0 after declining + 3 pages, 2×200 after granting. Controlled |
| 4 | Promotion parameters | ✅ all four populated — `promotion_id` carries real section IDs |
| 5 | Internal traffic **filter** | ✅ exists, state Testing |
| 5b | Internal traffic **rule** | ❌ **"No rules yet"** — the filter excludes nothing. Blocked on team IPs |
| 6 | Uptime alert delivery | ✅ fired and recovered, both emails received within seconds |
| 7 | BigQuery still delivering | ✅ 9 daily tables, newest yesterday, no gaps |
| 8 | Data stream URL | ❌ still `https://www.spyoptic.com/us/` — the dead SFCC path |
| 9 | Staging separated | ❌ no staging property; `spydevsylv` still writes to `G-1F4T2NDY34` |
| 2, 3 | `shipping_tier`, `payment_type` | ⬜ needs a test order |
| 10 | `tax` | ⬜ not testable — store charges none |
| 11 | `item_id` vs the Google feed format | ⬜ **unverified assumption**, see below |

**5b is the one that looked done and wasn't.** A Data filter set to exclude `traffic_type = internal`
with no rule to set that parameter will switch to Active on launch day and silently exclude nothing,
while the checklist reads "internal traffic: done".

**On 11 — stated twice as fact, never checked.** The claim is that Shopify's Google channel publishes
feed IDs as `shopify_US_<productId>_<variantId>`, which is why our variant-ID `item_id` would not
join. That is from memory. Before anyone acts on the `item_id` decision, read an actual row in the
Merchant Center feed. If the format is different, the argument changes with it.

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
