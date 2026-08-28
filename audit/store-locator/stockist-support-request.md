# Stockist support request — draft

Account tag: **`map_w3rgrzyq`** · Shopify store: `spydevsylv.myshopify.com`

Send via the Stockist dashboard support widget or `support@stockist.co`.
Items 1 and 2 are the asks; item 3 is a question worth including in the same thread.

---

## Draft message

> **Subject:** Disabling CSS isolation + map key setup for account `map_w3rgrzyq`
>
> Hi,
>
> We're rebuilding spyoptic.com on Shopify and using Stockist for the store locator. We're
> replacing an existing locator, so the new page has to match a fairly specific design. Three things
> we'd like your help with.
>
> **1. Please disable CSS isolation on our account (`css_isolation: false`).**
>
> We're on layout v2. We need to style the widget from our own theme stylesheet — our design system
> is Tailwind, compiled and version-controlled in the theme, and we need the locator to inherit the
> same tokens as the rest of the site (brand colours, DIN typography, spacing).
>
> With the shadow root closed we can't reach the widget from theme CSS, and our only option is the
> Custom CSS box in the dashboard. That would put a large, hand-written stylesheet outside our
> repository and outside our build, which we'd very much like to avoid.
>
> Could you switch `css_isolation` to `false` for tag `map_w3rgrzyq`? If that isn't something you
> normally do, we'd appreciate knowing whether it's supported at all, or whether staying on layout
> v1.1 is the recommended route for a fully custom skin.
>
> **2. Map key setup.**
>
> Our account currently shows `"map": { "type": "mapbox", "preview": true }` and the widget displays
> the trial notice over the map. We'll be adding our own Mapbox token. Could you confirm:
>
> - Where the token goes in the dashboard, and whether a Mapbox **public** token (`pk.…`) is correct
> - Whether we can supply a custom **Mapbox Studio style URL** for the map (we're matching an
>   existing map design), and where that's configured
> - What referrer/URL restrictions we should set on the token — we need it to work on
>   `localhost:9292` (Shopify CLI theme dev), on `*.myshopify.com` theme previews, and eventually on
>   our production domain
>
> **3. Location limit.**
>
> Our full dealer network is **2,261 locations** across the US, Canada, France, Italy, Germany,
> Spain, Finland, Austria and Israel. The Premium plan lists a 2,000 limit. Is there a higher tier
> or a custom arrangement for accounts above 2,000? If not we'll scope the first release to
> US + Canada (1,131) using `country_lock`, but we'd rather plan for the full network up front.
>
> Thanks very much,
> [name]

---

## Why each item matters (internal notes — do not send)

**1 — CSS isolation.** Verified on our own tag: loading the supplied embed yields **0** reachable
`stockist-*` classes and `host.shadowRoot === null`; the same page with `?stnoshadow` yields **31**.
The widget injects a comment reading *"Need to change styling? Add your CSS to Stockist under
Settings > Appearance > Custom CSS"*, which confirms the Custom CSS box is the intended route when
isolation is on.

Fallback if they decline: layout **v1.1** renders in the light DOM with no ticket (it's a self-serve
toggle under Settings → Appearance), which is how the Blenders theme styled its locator. Costs us
v2's CSS grid — v1.1 uses JS-sized floats and fights back on layout.

Not affected either way, because they're `window` globals read by the widget regardless of where it
renders: `__stockist_build_result_template`, `__stockist_desktop_breakpoint`,
`__stockist_distance_units`, `__stockist_show_filter_dropdown`, and the event callbacks.

**2 — Map key.** `map.preview: true` means the map stops working when the trial ends, and because
our config uses `search.mode: "bounds"`, no map means **no results at all** — the list hangs on a
spinner. Reproduced against Stockist's public demo tag on localhost, which fails with
`RefererNotAllowedMapError`.

The reference site runs MapLibre GL against **TomTom** vector tiles (style `2/basic_street-light`).
Mapbox GL is a fork of the same engine, so a Mapbox Studio style is our closest match.

**3 — Limit.** 2,261 total: US 869 · FR 317 · CA 262 · IT 139 · DE 111 · ES 64 · FI 27 · AT 20 · IL 2.
Source: the live locator's own country index at `stores.spyoptic.com/en-gb/store-locator`.
