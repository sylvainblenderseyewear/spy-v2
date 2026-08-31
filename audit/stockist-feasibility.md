# Stockist feasibility — can it reproduce `stores.spyoptic.com/en-gb`?

---

## 0. The SPY account — read live from the public config API

Tag **`map_w3rgrzyq`** (from the embed snippet). Config is public and unauthenticated:
`https://stockist.co/api/v1/map_w3rgrzyq/widget.js` · last modified `2026-08-27 11:22:45 PST`.

**State: freshly installed, entirely default, no data.**

| Fact | Value | Consequence |
|---|---|---|
| `filters` | `[]` | the reference's 5 product filters don't exist yet |
| `custom_fields` | `[]` | none |
| Locations | **0** | verified nil at San Diego, Paris, Milan, Toronto, Berlin |
| `custom_css` | `""` | nothing styled yet |
| `css_isolation` | **`true`** | closed shadow DOM is live — confirmed on this tag |
| `map.preview` | **`true`** | **no map key** — map works only during trial |
| `whitelabel` | **`false`** | "Powered by Stockist" branding shows |

Rendering the supplied snippet confirms the isolation empirically:

| Load | `stockist-*` classes reachable | `host.shadowRoot` |
|---|---|---|
| as supplied | **0** | `null` |
| `?stnoshadow` | **31** | `null` |

The widget also renders this notice over the map:
> *Stockist needs a map key from Mapbox or Google to show your map. However, you can preview the map
> during the trial period… To finish setup and remove this notice, add a map key to your Stockist account.*

### Config deltas vs the reference

| Setting | Now | Target | Note |
|---|---|---|---|
| `layout` | `horizontal_list_left` | same | ✅ already correct |
| `search.mode` | `bounds` | same | ✅ search-as-you-pan already on |
| `map.type` | `mapbox` | same | ✅ closest engine to the reference's MapLibre |
| `side_panel_width` | `350` | `512` | |
| `container.height` | `600` | full viewport | |
| `desktop_breakpoint` | `700` | `1024` | dodges the reference's broken 768 |
| `units` | `mi` | `km` + Miles toggle | reference is en-gb |
| `geolocation.button` | **`none`** | in-field button | reference has one |
| `browser_geolocation` | `mobile` | desktop too | |
| `autocomplete_types` | `["regions"]` | `+ addresses` | |
| `search.name_autocomplete` | `false` | `true` | reference blends store names |
| `feature_color` | `#333333` | `#f57f29` | |
| `overview.color` | `#333333` | `#f57f29` | cluster colour |
| `markers` | default red `#ea4335`, 27×43 | SPY orange teardrop + cross | |
| `filters` | `[]` | 5 product categories | |

> **Note on exposure:** the tag appears in page source, and both `/widget.js` and
> `/locations/search` are unauthenticated. Once populated, the full dealer list is publicly
> downloadable as JSON. This matches the current Leadformance site (also a public locator), so it is
> not a new exposure — but it should be a conscious decision, not a surprise.

---

Verified 2026-08-28 by dissecting the live Stockist v2 widget (`stockist.co/embed/v1/widget.min.js`,
280 KB), its account config API, and a local harness rendering a real Stockist widget.
Target spec: `audit/page-spec-store-locator.md`.

**Verdict: yes — substantially closer than Stockist's own documentation suggests.**
The public help pages understate the product badly. Source inspection found a result-template
override, an events API, ~90 runtime flags and a native filter-dropdown UI, none of which are
documented in the customization articles.

---

## 1. The one thing that decides everything: Shadow DOM

Stockist v2 renders inside a **closed** shadow root:

```js
t.attachShadow({ mode: "closed" })
  .appendChild(document.createComment(
    ' Need to change styling? Add your CSS to Stockist under "Settings > Appearance > Custom CSS" '))
```

Closed means `element.shadowRoot === null`: **no external CSS and no external JS can reach inside.**
Verified — on `stockist.co/demo` a full-document sweep finds **0** `stockist-*` classes.

But the decision is a config value, not a hard-coded one:

```js
d = T => document.location.search?.includes?.(T)          // reads the QUERY STRING
L = () => {                                               // "useCssIsolation"
  let T = e.css_isolation;                                // ← per-account config
  if (f() !== e.layout_version) T = (f() == "2");
  if (d("stshadow")) T = true; else if (d("stnoshadow")) T = false;
  return T && document.head.attachShadow && window.customElements;
}
```

Loading the same demo with **`?stnoshadow`** renders into the light DOM — the same sweep now finds
**36** `stockist-*` classes. Proven.

> **Action required:** `css_isolation` is served from `/api/v1/{tag}/widget.js` per account.
> Ask Stockist support to set **`css_isolation: false`** on the SPY account.
> `?stnoshadow` is a debug flag (it reads `document.location.search`) and must not be shipped.

### Isolation by layout version — measured

| Mode | `stockist-*` classes reachable | Widget root | Layout engine |
|---|---|---|---|
| **v2 (default)** | **0** — closed shadow root | — | — |
| v1 (`?stv10`) | 29 | `#stockist-widget` | `display: block`, floats |
| v1.1 (`?stv11`) | 37 | `#stockist-widget` | `display: block`, floats |
| v2 + `?stnoshadow` | 38 | `.stockist-layout` | **`display: grid`** |

**v1 and v1.1 render in the light DOM with no ticket required** — layout version is a self-serve
toggle in Settings → Appearance. This is why the Blenders theme
(`reference/blenderseyewear/assets/theme.css`) could style `#stockist-widget .stockist-side-panel`
and `.stockist-result-list` with ordinary CSS.

So there is no hard blocker, only a quality trade:

- **Route A — v2 + `css_isolation:false`** (preferred). Native CSS grid; re-templating
  `grid-template-columns` to `512px 1fr` is one declaration. Newest feature set. Needs a support ticket.
- **Route B — v1.1** (fallback, self-serve today). Light DOM out of the box, but the layout is
  `.stockist-horizontal` > `.stockist-side-panel` + `.stockist-map` sized by Stockist's own JS.
  Forcing the reference grid onto it partly works and partly fights back — measured: the panel
  took `512px` but the map kept its JS-computed `1120px`. Older widget, more CSS combat.

`__stockist_build_result_template` is checked **before** the version branch
(`H && (B=H(...)); B || (B = isLayoutVersion("2") ? … : …)`), so the custom card template works on
both routes.

---

## 2. Widget DOM (light-DOM mode) — verified live

```
.stockist-layout                                    display: GRID   ← re-templatable
├── form.stockist-search-form
│   ├── .stockist-search-fields-horizontal
│   │   ├── .stockist-search-query
│   │   │   └── .stockist-search-wrapper
│   │   │       ├── button.stockist-geolocation-button > .stockist-icon
│   │   │       └── .stockist-search-field
│   │   │           ├── input
│   │   │           ├── .stockist-autocomplete
│   │   │           └── button.stockist-clear-search-button
│   │   └── .stockist-search-submit > button.stockist-search-button
│   └── .stockist-search-filters
│       └── .stockist-filter-scroll > fieldset > .stockist-search-filter-inputs
│           └── label.stockist-search-filter.stockist-search-filter-{id}
├── .stockist-result-panel
│   └── .stockist-results
│       └── li.stockist-result.stockist-list-result   (or .stockist-result-status)
└── .stockist-map.stockist-map-google
    └── .stockist-map-inner
```

**`.stockist-layout` is `display: grid`.** Overriding `grid-template-columns` to `512px 1fr` and
placing the children by `grid-column` / `grid-row` reproduces the reference shell.
Measured in the harness: **`grid-template-columns: 512px 928px`**, map at `x 512, w 928` — an exact
match to the reference at 1440.

### Result-card classes (map 1:1 onto the reference card)
`.stockist-result-name` · `-distance` / `-distance-text` · `-address` · `-addr-locality` ·
`-addr-country` · `.stockist-address-city` / `-state` / `-postal-code` · `-phone` ·
`-directions-link` · `-view-on-map-link` · `-website` · `-image` · `-filters` / `-filter-name` ·
`-custom-fields` / `-custom-field-name` / `-custom-field-text` · `-count` · `-notes` · `-details`

### Autocomplete classes
`.stockist-autocomplete-icon-place` · `.stockist-autocomplete-icon-store` ·
`-group` / `-group-heading` · `-text-primary` / `-text-secondary` · `-matched` · `-selected`

Stockist's autocomplete **already blends places and store names with primary/secondary text** —
the same pattern the reference uses.

---

## 3. Undocumented capabilities found in source

### Custom result template — the big one
```js
let H = window.__stockist_build_result_template;
H && (B = H({ location: E, placement: "list" }));   // also placement: "map" for popups
```
A user-supplied function returning an `HTMLElement` **replaces Stockist's card markup entirely**,
for both the list card and the map popup. The reference card can be reproduced exactly — our own
markup, our own Tailwind classes. `location` carries the full API record (§5).

### Events API
`__stockist_widget_` + `domloaded` · `listchanged` · `location_selected` · `mapchanged` ·
`mapcreated` · `mappopupshown` · `prequery` · `resultsreceived`

`resultsreceived` receives `{ results, query: { source, region, input_iso_code, search_term … } }`.
Enough to drive a mobile List/Map toggle and react to selection.

### Runtime flags (`window.__stockist_*`, ~90 total)
| Flag | Use for |
|---|---|
| `__stockist_desktop_breakpoint` | **set 1024** — avoids the reference's broken 768 |
| `__stockist_show_filter_dropdown` | native chip + dropdown — the reference's filter pattern |
| `__stockist_distance_units` | km ⇄ mi (the reference's "Miles" checkbox) |
| `__stockist_pre_selected_query` / `_filters` | deep links |
| `__stockist_mapbox_key` / `_mapbox_style` | Mapbox with a custom Studio style |
| `__stockist_leaflet_tileconfig` | **Leaflet + arbitrary tiles** — a third map option |
| `__stockist_autocomplete_names_first` / `_result_types` | blended places + stores |
| `__stockist_override_translation` | every UI string |
| `__stockist_no_css` | drop Stockist's stylesheet entirely |
| `__stockist_tags_to_pins` | different pin per filter tag |
| `__stockist_show_all_on_empty_search`, `__stockist_trigger_geolocation`, `__stockist_disable_map` | initial state |

### Account config (`/api/v1/{tag}/widget.js`)
`layout` (`horizontal_list_left` …) · `side_panel_width` · `desktop_breakpoint` · `container.height` ·
`mobile_map_display` · `mobile_list_height` · `units` · `max_results` · `max_distance` ·
**`search.mode: "bounds"`** · `search.radius_options` · `search.name_autocomplete` / `name_full` ·
`geolocation.*` · `overview.behavior: "clusters"` · `filter_operator` · `filter_display` ·
`feature_color` · `custom_css` · `country_lock` · `languages.*` · `map.type` (`google` | `mapbox`)

**`search.mode: "bounds"` is search-as-you-move-the-map** — this closes a gap I previously called
unreachable. The reference's "Move the map to load results" / "View more results" pill is a
bounds-mode search with restyled copy.

---

## 4. Reference → Stockist mapping

### Reachable
| Reference feature | Mechanism |
|---|---|
| `512px + 1fr` full-height grid | override `grid-template-columns` on `.stockist-layout` — **verified** |
| Search bar (grey, icon-left, clear ×) | `.stockist-search-wrapper` + CSS — **near-exact already** |
| Geolocate button in the field | `.stockist-geolocation-button` |
| Blended place + store autocomplete | native; `autocomplete_types`, `name_autocomplete` |
| Filter chip + dropdown panel | `__stockist_show_filter_dropdown` + CSS |
| 5 product filters | Stockist filters — **needs tags applied to every location** |
| km ⇄ mi toggle | `units` / `__stockist_distance_units` |
| Result card (name, badge, subtitle, address) | `__stockist_build_result_template` |
| Active card → phone + Call / More info | template + `location_selected` |
| Search-on-pan pill | `search.mode: "bounds"` + restyled copy |
| Orange SPY pins | custom marker image; `tags_to_pins` for per-category pins |
| All UI strings | `languages` / `__stockist_override_translation` |
| Avoid the broken 768 | `__stockist_desktop_breakpoint: 1024` |
| Mobile List/Map toggle | custom UI + events API |
| "Spy Optic presence" grid | our own theme section |

### Still not reachable
| Gap | Why |
|---|---|
| **MapLibre + the exact vector style** | Google or Mapbox only (Leaflet tiles are a partial third path). Closest match: Mapbox Studio style built to imitate it |
| **Store detail pages** (`/shop/{id}/{slug}`) | no per-location URLs; would have to be built as Shopify pages/metaobjects |
| **Country / state / county / city indexes** | widget is client-rendered; zero server HTML |
| **Locale picker** | belongs to the standalone app; Shopify uses Markets |
| **2,261 locations** | Stockist Premium caps at **2,000** |

---

## 5. Fallback — custom UI on the Stockist API

The search API is **public and unauthenticated** — tag only, no key:

```
GET https://stockist.co/api/v1/{tag}/locations/search
      ?tag={tag}&latitude=&longitude=&filter_operator=and&distance=&sort=name
```

Returns per location:
`id, name, latitude, longitude, address_line_1, address_line_2, city, state, postal_code,
country, full_address, phone, website, email, description, image_url, priority,
filters[{id,name,position}], custom_fields[], distance, distance_units`

So if `css_isolation: false` is refused, we can still keep Stockist as the data store and render
our own MapLibre UI — a true 1:1 shell. Bigger build, but no vendor lock on the design.
(`/locations/overview.js` returns geohash-clustered points for the zoomed-out view.)

---

## 6. Open items before build

1. **`css_isolation: false`** from Stockist support (Route A). Not blocking — Route B (layout v1.1)
   is self-serve — but Route A is materially cleaner and worth the ticket.
2. **Widget tag** for the SPY account (Stockist → Installation) — the `data-stockist-widget-tag`
   value, e.g. `u4084`. Nothing can be embedded or tested without it.
3. **Map key referrer allow-list** — Stockist's Google/Mapbox key is domain-restricted. Add
   `localhost:9292` (and the `*.myshopify.com` preview host) or the map dies with
   `RefererNotAllowedMapError`, exactly as the public demo does on localhost.
4. **Storefront password** for `spydevsylv.myshopify.com` — needed for preview-URL verification;
   `shopify theme dev` covers local work.
5. **Plan tier** — 2,261 > 2,000. Restrict via `country_lock` to US + CA (1,131), or negotiate.
6. **Location data + filter tags** — the 5 product categories must be tagged per location.
7. **Map provider** — Mapbox (custom Studio style) is the closest to the reference.
8. **SEO** — decide whether `stores.spyoptic.com` stays as the canonical locator.

## 7. Harness

`scratchpad/loc/harness/proof.html` — a working page that loads a real Stockist widget, re-templates
the grid to `512px 1fr`, and supplies a reference-shaped card via `__stockist_build_result_template`.
Serve it and load with `?stnoshadow`.

Note: the public demo account's Google Maps key rejects `localhost`
(`RefererNotAllowedMapError`), which blocks geocoding and therefore live results in the harness.
That is a demo-account restriction, not a Stockist limitation — it disappears on the SPY account.

---

## 9. Build log — what shipped, and what it took

Files: `sections/spy-store-locator.liquid` · `assets/spy-store-locator.js` ·
`templates/page.store-locator.json` · skin at the end of `src/tailwind.css` ·
page **Find a Store** (`/pages/store-locator`).
Verified on `shopify theme dev` at 1440 / 768 / 390 with `?stnoshadow`.
Screenshots: `audit/store-locator/build/`.

### Measured against the source spec

| | Source | Built | |
|---|---|---|---|
| Grid columns @1440 | `512px 928px` | `512px 918px` | ✓ (918 = 1430 content width) |
| Search bar | 512 × 53 | 512 × 53 | ✓ |
| Panel flush to map | yes | yes | ✓ |
| Fills viewport, no page scroll | yes | yes | ✓ all three widths |
| Mobile List/Map switcher | 37px, dark active | 37px, dark active | ✓ |
| Result card type | 16/600 · 12/500 badge · 14/300 | identical | ✓ |

### Four things that fought back

1. **Specificity.** Stockist's layout rules are `#stockist-widget .a.b` — (1,2,0). A
   `.spy-locator .stockist-layout` override (0,2,0) never lands. The fix is not
   `!important` everywhere: the widget exposes custom properties
   (`--stockist-side-panel-width`, `--stockist-desktop-height`, `--stockist-feature-color`,
   `--stockist-input-height`, `--stockist-border-radius`, …), and its own
   `horizontal_list_left` grid already *is* the source's shape. Drive the variables and the
   native layout produces the target. Only the variables themselves need `!important`,
   because the widget writes them inline from JS (`f("--stockist-side-panel-width", …)`).

2. **The custom element breaks the height chain.** `<stockist-store-locator>` sits between
   the flex wrapper and `#stockist-widget` and is `display:block`, so it collapses to content
   height and the map never fills. It needs `flex: 1 1 auto; min-height: 0` explicitly.

3. **`1fr` tracks hold space for hidden items.** Sizing both mobile bands flexibly left a gap
   where the hidden pane had been. The row template has to follow the switcher — height to the
   visible band, `0` to the other. Stockist ships a `fill-parent` mode for this, but it is
   written `:host(.stockist-fill-parent)` — shadow-DOM only, so unreachable in the very mode
   we need for styling.

4. **The offset is not the header.** The locator starts at y=93 while the header is 50px —
   announcement bar and main padding make up the rest. Measuring the wrapper's own distance
   from the top of the scroll container is exact and drops all header-selector guessing.

### Copy is theme-owned, not dashboard-owned
`window.__stockist_override_translation(lang, key)` is wired to section settings, so
`search_placeholder`, `initial_message`, `no_results`, `geolocation_button`,
`filter_dropdown_button` and `directions_link` are editable in the theme editor. Verified live:
the field reads "City, zipcode, name…" and the empty state matches the source.

### Blocked on the account, not on code
- **Shadow root** — as-shipped the page renders the widget unstyled; the skin is inert until
  `css_isolation:false`. Verified on tag `map_w3rgrzyq`: 0 reachable classes as shipped, 31 with
  `?stnoshadow`.
- **No map key** — Leaflet fallback plus the trial notice. `search.mode:"bounds"` means no map
  eventually means no results.
- **No locations, no filters** — the filter row does not render at all, so its skin is untested.
- **`geolocation.button:"none"`** — the source has a geolocate button in the field; ours has none
  until that account setting changes.

---

## 10. Pixel comparison against the live page

Both pages measured with one shared probe at 1440 / 768 / 390, ours via `?stnoshadow`.
Raw numbers: `audit/store-locator/compare/measurements.json`. Screenshots alongside it.

### Fixed in this pass

| Gap | Was | Now |
|---|---|---|
| Empty-state title | absent — "Find a Spy Optic dealer" showed before any search | "Search for a location", centred, offset **80px** exactly at all three widths |
| Results heading | always visible | only once results exist (`data-has-results`) |
| Empty block anchoring | vertically centred (offset 332px) | top-anchored, matching the source |
| Stockist's pin icon in empty state | shown | hidden — the source has no icon there |
| Input line-height | 19.6px | **20px** |
| Input height | 52px | **53px** |
| Double divider | 1px on the filter row *and* on top of the list | list border removed, matching the source |

`.stockist-result-status` is a **column** flex container, so `justify-content` is its
vertical axis — that one caught me out and is why the empty block was centred.

### Remaining differences, and why

**Account-gated — no code fix exists:**
- **Filter row** absent (`filters: []`). Costs 67px of the search block, so our grid rows read
  `53px` where the source reads `120px`.
- **Geolocate button** absent (`geolocation.button: "none"`). The source insets the input 48px to
  clear its icon; ours applies that padding only via
  `:has(.stockist-geolocation-button)`, so it appears the moment the setting is turned on rather
  than leaving a blank indent today.
- **Map** is the Leaflet fallback with a trial notice — no map key.
- **Result cards** unverifiable against live — zero locations.

**Deliberate, and I would not change them:**
- **DIN, not Roboto.** The locator subdomain falls back to Roboto because it is a third-party app
  that never loads the brand font. DIN is correct here.
- **Text `#242424`, not pure black** — the brand token, and what spyoptic.com itself uses.
- **Header offset 93px vs 64px.** The source has a stripped app header with a locale picker; ours
  sits under the real SPY header and announcement bar.
- **768 is full-width, not a 241px map.** The source keeps its hard 512px panel at 768 and crushes
  the map — a defect already logged in the page spec. Ours stacks and offers List/Map.
- **A 10px scrollbar.** The source sets `body { overflow: hidden }`, which also makes its own footer
  unreachable. Ours is a real Shopify page with a reachable footer.
- **Field background sits on `.stockist-search-wrapper`, not the input.** The source overlays its
  geolocate button inside the input's padding; Stockist renders it as a flex sibling, so the
  wrapper has to carry the background. Renders identically.

### One flake worth knowing
A single run threw `_stockistConfigCallback_map_w3rgrzyq is not defined` — Stockist's JSONP config
script beating its own bundle. Not reproducible across 4 subsequent loads (widget rendered every
time) and it self-recovers. Stockist-side load-order race, not ours.

---

## 11. Honest visual audit — why the two pages still look different

§10 claimed "pixel-accurate wherever comparable". That was true of the elements measured and
misleading about the page as a whole. Side by side the two still read as different pages. Weighted
by screen area, here is why.

### The map is 918 of 1430px — 64% of the page

| | Source | Ours |
|---|---|---|
| Engine | MapLibre GL + **TomTom** `basic_street-light` | **Leaflet fallback** |
| Palette | muted — pale blue water, cream land | saturated blue water, olive land |
| Overlay | "Move the map to load results" pill, top-centre | none |
| Notice | none | large white "needs a map key" panel |
| Zoom | top-right, two buttons | bottom-right, three |

All of it follows from having no map key. This single item accounts for most of the impression that
the pages differ, and **no amount of CSS closes it** — the tiles, controls and overlay all belong to
whichever map engine Stockist picks, and it only picks Mapbox once a key exists.

I tried the one code-level lever that exists — `window.__stockist_leaflet_tileconfig`, which does
work — pointed at CARTO Voyager, the closest free match to TomTom's style. **CARTO now gates its
basemaps**: every tile came back stamped *"API KEY REQUIRED"*, which is worse than the default. Same
story for Stadia and Stamen. The setting is kept (`Map → Fallback basemap tiles`) and defaults to
blank; the real fix is the Mapbox key.

### The filter row is missing entirely

The source's left panel has a dark `Spy Optic Products ⌄` chip on a 67px band with a divider under
it. Ours has nothing there, because the account defines no filters. That is also why our grid rows
read `53px` where the source reads `120px` — the whole band is absent, so everything below sits 67px
higher.

### Both geolocate affordances are missing

The source has a crossed-pin icon inside the search field (22×22 at x=11) and an outlined
**Geolocate myself** button under the empty state (160×44, 2px border, radius 8). Ours has neither —
`geolocation.button: "none"`. Both are now pre-styled to the measured values, so they appear correctly
the moment the setting is switched on.

### What genuinely does match

Measured identical against live at 1440:

| | Source | Ours |
|---|---|---|
| Panel column | 512px | 512px |
| Search field | 512 × 53, `#eeedf1` | 512 × 53, `#eeedf1` |
| Empty block | x16 · w480 · padding 64 | x16 · w480 · padding 64 |
| Empty title | 16/600, centred, +80px | 16/600, centred, +80px |
| Empty sub | x80 · w352 · h48 · 16/24 · opacity .8 | x80 · w352 · h48 · 16/24 · opacity .8 |

### Scorecard

Of the visible difference: the **map**, the **filter row** and the **geolocate controls** are three
account settings, not code. The panel's typography, spacing, colour and layout are done. Until
`css_isolation:false`, a real visitor sees none of it anyway — the widget renders unstyled in a
closed shadow root.

---

## 12. Main-window pixel pass

Header and footer stay as the theme's own — confirmed. This pass targeted only the locator body.

To reach the parts gated behind account settings, the JSONP config callback was patched **in a test
harness only** (`_stockistConfigCallback_map_w3rgrzyq` intercepted via `addInitScript`) to switch on
`geolocation.button: "inline"` and inject five filters. Nothing shipped — but it rendered the filter
row and geolocate control, and exposed five real layout bugs that were invisible while those
settings were off.

### Bugs the simulation found

| Symptom | Cause |
|---|---|
| Filter row sat **beside** the search field | `.stockist-search-fields-horizontal` is the flex row and the filter block is one of *its* children, not a sibling of it |
| Chip was 51px tall, not 34 | it inherits `--stockist-input-height` (53px) — the *field's* height |
| Chip 25px too narrow | Stockist's dropdown button ships text only; the source's has a chevron |
| Filter row inset 8px, 2px too tall | `--stockist-form-spacing` margin on the row, plus a 1px focus-ring margin on the chip |
| Geolocate icon 37px, input double-inset | Stockist renders the button as a real flex sibling, not an overlay — so the input must *not* also carry the source's 48px left padding |

### Now matching live exactly

| | Source | Ours |
|---|---|---|
| Filter band | `0,y 512×67` | `0,y 512×67` |
| Filter chip | `16,y 160.66×34`, radius 6 | `16,y 159.83×34`, radius 6 |
| Geolocate in field | 48px slot, 22px icon | 48px slot, 22px icon |
| Search input | 464px after the icon slot, 53 tall | identical |
| Empty title | **+80px** into the panel | **+80** |
| Empty sub | **+112**, w352, h48 | **+112**, w352, h48 |
| Geolocate button | **+192**, h44, 2px border, radius 8 | **+192**, h44, 2px border, radius 8 |

Sub-pixel width deltas (159.83 vs 160.66; 153.47 vs 160.58) are DIN vs Roboto glyph widths — a
consequence of using the brand font, not a layout error.

### Built rather than borrowed
- **Chevron on the filter chip** — drawn as a `mask-image` so it takes the chip's colour.
- **Empty-state geolocate button** — Stockist places its own button in the field or beside it, never
  in the empty state. Ours calls `window.__stockist_trigger_geolocation()`, which the widget defines,
  so it is a real control. It hides itself when that function or `navigator.geolocation` is absent.
- Both are pre-styled to the measured source values, so they land correctly the moment the account
  settings are switched on.

### Left over
The **map** — still the Leaflet fallback with its trial notice, and still the single largest visual
difference. Only the Mapbox key closes it. Filters and the geolocate button remain switched off in
the account; the CSS for both is verified and waiting.

### Left-panel sweep

Inventoried every rendered element in the left 512px of both pages and diffed by y-position.

Fixed:
- Empty-state geolocate icon was 18px; the source's is **20.16px**.
- Field geolocate slot was 48px wide with the input keeping its own 16px padding, so text began at
  **64px** — the source starts it at **48**. Slot is now 44px (the source's box) with 4px of input
  padding, landing the caret at 48. This was a regression from switching the button from an overlay
  to a flex sibling.

Found, deliberately not fixed:
- **`.stockist-powered-by-link`** — a 20×34 pin at the bottom centre of the panel linking to
  `stockist.co` ("Powered by Stockist Store Locator"). The source has nothing there. It renders
  because the account is `whitelabel: false`; Stockist removes it on the **Premium** plan, which the
  2,261-location count requires anyway. Not hidden with CSS — that would be circumventing a paid
  feature and Stockist's terms.

### Full-height at short viewports, and the centring question

**Empty state is NOT vertically centred.** Measured on live at three window heights — the block sits
at **offset 80** from the top of the results panel every time:

| viewport | results panel | title offset | centred would be |
|---|---|---|---|
| 1440×900 | 716 tall | **80** | 216 |
| 1440×1300 | 1116 tall | **80** | 416 |
| 1440×620 | 436 tall | **80** | 76 |

Its inner block carries `h-full … justify-center`, but the `ul.grid` ancestors are content-height so
`h-full` never resolves — it reads as centred at a glance and is top-anchored in fact. Ours matches
at 80.

**Map height at minimum size — fixed.** `min-height: 640px` applied in full-height mode too, so a
short window pushed the locator past the fold and started the page scrolling, something the source
never does:

| viewport | source map | ours before | ours after |
|---|---|---|---|
| 900 | 836 | 807 ✓ | 807 |
| 620 | 556 | **640, ending 113px below the fold** | **527 ✓** |
| 500 | 436 | **640, badly overflowing** | **407 ✓** |

The source has no minimum at all — it is always `viewport − header`. The floor now applies only when
`full_height` is off, where it is the setting's whole purpose. Mobile behaves too: the List/Map
switcher stays pinned to the bottom edge down to 480px tall.

**Filter combobox removed** at the client's direction — the `Spy Optic Products` chip styling, its
chevron, the dropdown panel, the `filter_dropdown` setting and the `filter_dropdown_button`
translation are all gone. §12's filter-row findings are retained as a record of what was measured,
not as outstanding work.

---

## 13. Production-state bug — injected elements escaped the panel

The empty-state title and geolocate button are rendered by the section and moved into
`.stockist-result-panel` by script. `syncResultState` un-hid them based only on whether results
existed — never checking whether the move had succeeded.

With `css_isolation: true` (the live account) the panel is inside a closed shadow root, so the move
silently fails and both elements stayed as direct children of `.spy-locator` — a full-width flex
column. Measured: title at `0,93 **1440**x24`, button at `0,141 **1440**x44`, the button stretched
edge to edge. Stockist meanwhile drew its own empty state inside the shadow root, so the page showed
two of everything.

Fixed by recording whether the move landed (`data-placed`) and gating visibility on it, in both the
script and CSS, plus `align-self: center` / `max-width: 100%` on the button so it can never stretch
even if something else goes wrong.

| | before | after |
|---|---|---|
| production (shadow DOM) | title + button at 1440px wide | both **hidden** — Stockist's own empty state shows |
| `?stnoshadow` | correct | still correct: title `182.94,226`, button `176,338 160x44` |

### Custom properties do not cross this shadow boundary either

Custom properties normally inherit through a shadow root, which would have been a way to fix the
panel width and height in production without the flag. Tested by setting
`--stockist-side-panel-width: 512px !important` and `--stockist-desktop-height: 100% !important` on
both `.spy-locator` and the host element: **no effect** — panel stayed 365px, height stayed 600px.
Stockist writes those variables *inline on `#stockist-widget` inside the shadow root*
(`f("--stockist-side-panel-width", …)`), and an inline declaration on the element beats an inherited
value. There is no styling route into the widget until `css_isolation: false`.

### Known cosmetic consequence in the current state
With the skin inert, the widget keeps its account height of 600px inside our 807px full-viewport
wrapper, leaving ~207px of white below it. That is a symptom of the blocker, not a defect — a
one-line `height: auto` on `[data-placed='false']` would collapse it, at the cost of a brief layout
jump once the flag is flipped. Left alone deliberately.
