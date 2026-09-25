# GA4 — gaps and open decisions

Written 25 Sep 2026, three weeks before the 12 Oct launch. The tracking works; this is the list of
what it does not yet capture and what has to be decided before those choices get expensive.

Status of the build itself is in `audit/ga4-status.md`. This file is only the gaps.

---

## What the server-side investment currently buys

```
storefront (sandboxed pixel)
  └─ gtag.js from Google
     └─ every hit → sgtm.spyoptic.com          first-party
        └─ load balancer → Cloud Run (min 1 instance, us-central1)
           └─ GTM-K3RX42CH: one GA4 tag, All Events
              └─ GA4 G-1F4T2NDY34 → BigQuery (daily)
```

The server container is a **pass-through**. One tag, no enrichment, no second destination. So the
roughly $50/month is currently paying for one thing: the first-party `FPID` cookie, which is real
value on Safari but is maybe a fifth of what the architecture can do.

The rest arrives when Meta CAPI and Google Ads route through the same container and share one
deduplicated purchase event. That is planned for launch week. Worth remembering that the cost is
running now and most of the benefit is still ahead — it is not a reason to change course, but it is
the honest position if anyone asks what the money buys.

---

## Decisions needed before 12 Oct

### 1. `item_id` — variant ID, or Google feed ID?

We send the Shopify **variant ID**. Shopify's Google channel publishes feed IDs in the form
`shopify_US_<productId>_<variantId>`.

When Google Ads goes live in launch week, dynamic remarketing and Merchant Center reporting join on
item ID. They will not match.

**Why it has to be decided now:** changing `item_id` after launch splits every item report into a
before and an after, permanently. There is no migration.

Options: keep the variant ID and accept that Google Ads item-level reporting is broken; or switch to
the feed format and accept that it is uglier in GA4's own reports. A third path is sending both, with
the feed ID as `item_id` and the variant as a custom parameter.

### 2. Does GA4 revenue include tax and shipping?

`value` currently sends `totalPrice`, which is the full order total. Shopify's "net sales" excludes
both tax and shipping.

They will not match on day one. Someone will call it a tracking bug. Agree the definition now, write
it down, and the day-one reconciliation becomes a five-minute check instead of an afternoon.

### 3. Refunds are invisible

GA4 has a `refund` event. Refunds happen in the Shopify admin, not the browser, so **no pixel event
exists for them**. GA4 revenue will drift permanently above Shopify's, and the gap grows with every
return — SPY offers 30-day returns, so this is not hypothetical.

The fix is Measurement Protocol fired from a Shopify `refunds/create` webhook. It does not need
building before launch, but it needs an owner before the first month closes, or the first monthly
reconciliation will not balance and nobody will know why.

---

## Gaps with no launch deadline

**No `user_id`.** Logged-in customers are not stitched across devices and User-ID reporting is
unavailable. Shopify exposes the customer at checkout.

**No `coupon` / discount data.** `checkout.discountApplications` is available and unused. SPY runs a
20%-off first-order offer on the homepage, and its effect on AOV and margin is currently
unmeasurable.

**No `select_item`.** Shopify has no standard product-click event, and Horizon's `ProductSelectEvent`
is an internal DOM event for variant pickers that never reaches analytics. So `view_item_list` fires,
but nothing records which list a shopper clicked from — which is the main thing list tracking exists
for. Would need a custom event, the same pattern as the promotion banners.

**No enhanced conversions.** Hashed email from checkout improves Google Ads match rates. Relevant
once Ads is live, not before.

---

## Operational risk

**Nothing watches the tagging server.** Load balancer logging is on, but there is no alert policy. If
`sgtm.spyoptic.com` starts returning 5xx overnight, tracking stops silently and nobody learns until
someone opens GA4 days later. A Cloud Monitoring uptime check plus one alert policy is about fifteen
minutes and closes the largest silent-failure path in the design.

**Single region.** Everything is `us-central1`. A regional outage stops all tracking. Acceptable at
this scale, but it should be a known acceptance rather than a surprise.

**Staging shares the production property.** Both stores use `G-1F4T2NDY34`. Blocked on account-level
GA4 permission. Harmless until launch, then it inflates sessions and could post phantom revenue.

---

## Not a tagging problem, but it lands in the same reports

Vendor casing is inconsistent ("Spy" and "SPY"), product types are mostly the single value
"Sunglasses", some products exist as duplicate variants at two different prices, and four replacement
lenses are priced at `$0.00`. Detail in `audit/analytics-data-quality.md`.

No amount of tagging fixes any of it, and every one of them will show up as a confusing number in a
GA4 item report. It still has no owner.

---

## Ranked, if only some of this gets done

| | Why it is where it is |
|---|---|
| 1 | **Uptime alert on the tagging server** — fifteen minutes, removes the only failure mode nobody would notice |
| 2 | **Decide `item_id`** — costs nothing today, unrecoverable after launch |
| 3 | **Agree the revenue definition** — prevents day-one panic over a mismatch that is not a fault |
| 4 | **Plan the refund event** — needs an owner, not code, before the first month closes |
| 5 | Everything else — genuine improvements, no deadline |
