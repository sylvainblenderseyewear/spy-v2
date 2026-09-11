# Live site analytics inventory — spyoptic.com (US)

Captured 2026-09-10 from `https://www.spyoptic.com/us/` via Playwright. Everything
below is what the **current SFCC site** runs, and is the baseline the Shopify build
has to match or deliberately drop.

---

## 1. Google stack

| Thing | Value | Notes |
|---|---|---|
| GTM web container | `GTM-WWB4P3K` | Loaded from `googletagmanager.com` — **client-side only** |
| GA4 property A | `G-GS5WZT8YYD` | Cookie `_ga_GS5WZT8YYD` present |
| GA4 property B | `G-PJEFBYCC2M` | Cookie `_ga_PJEFBYCC2M` present |
| Google Ads | `_gcl_au` cookie | Two Axeptio vendors: `google_ads` + `Google_Ads` |
| GA4 developer ID | `developer_id.dNGFkYj` | Set via dataLayer — a partner integration |

**There is no server-side tagging on the live site.** `gtm.js` comes straight from
Google. So sGTM on Shopify is new capability, not a migration of something existing.

**Two GA4 properties are live, and neither is the new `G-1F4T2NDY34`.** Whatever
history matters for year-on-year comparison lives in these two, not in the new
property. Export the baseline from them before access is lost.

---

## 2. GA4 ecommerce schema in use (the taxonomy to match)

Real `view_item_list` payload from the homepage:

```json
{
  "item_id": "257654",
  "item_name": "CYRUS SWITCH",
  "currency": "USD",
  "affiliation": "SPY OPTIC US",
  "item_brand": "SPY",
  "item_category": "sunglasses",
  "item_category2": "sunglasses-mens-sunglasses",
  "item_category3": "",
  "item_list_name": "sunglasses_sunglasses-mens-sunglasses_",
  "item_variant": "matte-black_happy-gray-green-&-happy-gray-green-with-black-mirror-",
  "price": 200,
  "index": 0
}
```

Four things to carry over:

- **`item_id` is the SFCC PID** (`257654`) — the same number in the product URL
  `/us/sunglasses/cyrus-switch-257654.html`. Not a SKU, not a UPC.
- **`item_name` is the uppercase model name**, not the full product title.
- **`item_category` is hierarchical**, taken from the category path — `sunglasses`
  then `sunglasses-mens-sunglasses`. Our staging `productType` is "Sunglasses" for
  everything, so category must come from the **collection**, not the product type.
- **`item_list_name` is built as** `category_subcategory_` (trailing underscore
  included). Ugly, but consistent, and existing reports depend on the shape.

`affiliation: "SPY OPTIC US"` is set on every item — worth keeping for when other
regions arrive.

---

## 3. Consent — Axeptio

| Thing | Value |
|---|---|
| Client ID | `605a100625fdd05e1b1e125a` |
| Consent Mode | v2, already correct |
| Defaults | all four signals `denied`, `wait_for_update: 500` |
| Observed state (US) | all four `granted`, `ads_data_redaction: false` |

Axeptio pushes `axeptio_update` with a `consent_mode` object, then a pair of
`axeptio_activate_<vendor>` / `axeptio_enable_<vendor>` events per vendor. GTM
triggers fire off those events, so any tag moved to Shopify needs the same bridge —
plus `Shopify.customerPrivacy.setTrackingConsent`, which SFCC does not have.

US visitors are served an opt-out model: tags are granted by default. Confirm with
legal before copying that behaviour to the new site.

---

## 4. Every vendor behind the consent banner

Fifteen, in Axeptio's own words:

`SalesForce Commerce Cloud` · `google_ads` · `facebook_pixel` · `google_analytics` ·
`__kla_id` (Klaviyo) · `yotpo` · `Pepperjam` · `Hookit` · `Microsoft Advertising` ·
`Avantlink` · `accessiBe_tag` · `expervoice_tag` · `impact_tech` · `aHrefs Analytics` ·
`Google_Ads`

**GA4 is roughly one-eighth of the actual tagging scope.** Three separate affiliate
networks are running (Pepperjam, Avantlink, Impact), and each needs an owner before
launch or affiliate commissions break silently.

---

## 5. Confirmed by cookie

| Cookie | Tool |
|---|---|
| `_ga`, `_ga_GS5WZT8YYD`, `_ga_PJEFBYCC2M` | GA4 ×2 |
| `_gcl_au` | Google Ads |
| `_uetvid` | Microsoft Advertising (Bing UET) |
| `_clck` | Microsoft Clarity |
| `_sp_id.c7d0`, `_sp_ses.c7d0` | **Snowplow** — not mentioned by anyone so far |
| `__kla_id` | Klaviyo |
| `IR_34571`, `IR_PI`, `IR_gbd` | Impact Radius |
| `__cq_uuid`, `__cq_seg`, `cqcid`, `cquid` | CQuotient / Einstein recommendations |
| `dwanonymous_*`, `dwac_*`, `dw_dnt` | SFCC native analytics |
| `datadome` | DataDome bot protection |
| `axeptio_*` | CMP state |

**Meta pixel ID: `1533321731910531`** — found in the CQuotient request payload.

**Klaviyo company ID: `X9Hdku`.**

**Yotpo app key: `QvaApxqlVlVEebmfd34wHH7scAuVMAkdvdejcqyr`** (the S1 spyoptic.com
account), loyalty loader `q1EjVq6lldXeVNiF39HXwA`.

---

## 6. Dies at replatform

- `dwanalytics-22.2.js`, `dwac-21.7.js` — SFCC native analytics.
- CQuotient / Einstein (`gretel.min.js`, `p.cquotient.com/pebble`) — powers the
  current "Others also like". Replaced by Shopify recommendations, which means the
  recommendation quality baseline resets. Worth measuring before and after.
- DataDome — Shopify has its own protection; confirm nobody expects DataDome rules
  to carry over.

---

## 7. What this changes for the build

1. **`item_id` decision reopens.** The live site keys on SFCC PID. Shopify variant ID
   is clean and matches the auto-generated Merchant Center feed, but breaks every
   join to pre-launch GA4 data and existing Google Ads audiences. Recommended:
   **variant ID as `item_id`** — since Merchant Center re-keys at replatform
   anyway — **plus the SFCC PID as a secondary parameter**, so product-level history
   stays joinable. The PID has to exist on every product regardless, for the 301
   redirect map.
2. **`item_category` must come from the collection**, not `productType`, and should
   be hierarchical to match `item_category` / `item_category2`.
3. **The baseline export is urgent** and comes from `G-GS5WZT8YYD` /
   `G-PJEFBYCC2M`, not the new property.
4. **Scope check:** the analytics workstream as scoped covers GA4 and sGTM. The live
   site runs fourteen other vendors. Someone needs to own the list.
