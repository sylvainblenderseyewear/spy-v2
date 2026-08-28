# Page spec — Store Locator (`stores.spyoptic.com/en-gb`)

Measured live 2026-08-28 with playwright-core + system Chrome (headless, `locale: en-GB`).
All numbers are computed styles / `getBoundingClientRect()` from the running page, not the saved copy.
Baseline screenshots: `audit/store-locator/*.png`.

---

## 1. What this actually is

| | |
|---|---|
| Platform | **Leadformance / Bridge** — Next.js (Turbopack) + Tailwind v4 |
| Map | **MapLibre GL**, custom vector style |
| Host | Separate subdomain, not the SFCC storefront |
| Theme wrapper | `div.overrides-module__dlMxja__theme.font-roboto` |
| Shell | `<body class="h-screen w-screen overflow-hidden antialiased">` — full-viewport app, **page never scrolls** |
| Locales | `/en-gb` `/fr-fr` `/de-de` `/es-es` `/it-it` |
| Cookie consent | Axeptio (same as main site) |

It is a **three-surface system**, not one page:

1. `/en-gb` — the search app (this spec)
2. `/en-gb/store-locator/{country}` — server-rendered country → state → county → city index pages
3. `/en-gb/shop/{id}/{slug}` — a landing page per dealer

### Scale
2,261 dealers total. Store sitemap is **> 10 MB**.

| CA | US | FR | IT | DE | ES | FI | AT | IL |
|---|---|---|---|---|---|---|---|---|
| 262 | 869 | 317 | 139 | 111 | 64 | 27 | 20 | 2 |

---

## 2. Design tokens

### Colour (resolved inside the theme wrapper)

| Token | Hex | Used for |
|---|---|---|
| `primary-50` | `#f6f6f9` | active card bg, footer band |
| `primary-100` | `#eeedf1` | search input bg, distance badge bg, "Call us" bg, inactive Map tab |
| `primary-200` | `#d8d7e0` | map placeholder, dropdown border |
| `primary-500` | `#3f3d4f` | — |
| `primary-600` | `#383644` | distance badge text |
| `primary-700` | `#141318` | filter chip bg, "More info" bg, active List tab |
| `primary-800` | `#070609` | hover |
| `primary-900` | `#000000` | body text |
| `secondary-100` | `#feedd6` | — |
| `secondary-500` | **`#f57f29`** | **SPY brand orange** — map markers (`fill-secondary-600`) |
| `secondary-700` | `#be4510` | — |
| `secondary-800` | `#973715` | — |

Note the primary scale is a **neutral near-black**, not SPY slate `#2c393e`. Orange matches the brand token exactly.

### Type
**Roboto**, sans-serif, throughout. Root 16px. No brand font (DIN) anywhere on this subdomain.

| Element | Size | Weight | Line-height |
|---|---|---|---|
| Nav links | 16px | 600 | — (uppercase) |
| Search input | 14px | 400 | — |
| Filter chip | 14px | 400 | — (capitalize) |
| List heading | 16px | 600 | 24px |
| Card store name | 16px | 600 | 24px |
| Card subtitle | 14px | **300** | 20px |
| Card address | 14px | **300** | 20px |
| Distance badge | 12px | 500 | — |
| Action buttons | 14px | 500 | 20px |
| Empty-state h1 | 16px | 600 | 24px |

---

## 3. Desktop 1440 × 900

```
┌──────────────────────────────────────────────────────────┐ header  h 64
│ [SPY 80×40]              SUNGLASSES GOGGLES … 🇬🇧        │ pad 12 16
├───────────────────────┬──────────────────────────────────┤
│ #Search      512×120  │                                  │
│  input       512×53   │   MapLibre  928×836              │
│  filter bar  512×67   │   ┌ View more results ┐          │
├───────────────────────┤                          [+/−]   │
│ #Results     512×716  │        📍  📍                     │
│  (overflow-y auto)    │            📍                     │
└───────────────────────┴──────────────────────────────────┘
                                              MapLibre ↗
```

- `main` at `y 64`, `h 836`
- Grid: `grid-template-columns: 512px 928px` · `grid-template-rows: 120px 716px`
- Map spans `col-start-2 / row-span-2`

### Header
- `h 64`, bg white, `z-index 20`, inner padding `12px 16px`, gap `16px`
- Logo `80 × 40` at `x 16, y 12`; `max-height 48px`, `max-width 128px`, `object-contain`; `src /custom/spyoptic-40ab7fr0/images/logo.svg` → **links out to `www.spyoptic.com/gb/`**
- Nav block `x 918.13, w 461.88, h 24` — SUNGLASSES · GOGGLES · SNOW HELMETS · EYEGLASSES, all linking to `www.spyoptic.com/gb/…`
- Locale button `28 × 20` at `x 1396` — flag only, `aria` "Open locale picker"; dropdown `w 256` (`w-64`), 5 locales with flag SVGs

### Search block (`#Search`, `z-30`)
- Input `512 × 53`, bg `#eeedf1`, 14px, padding `16px 16px 16px 48px`, `border-bottom 1px`, radius 0
- Placeholder **"City, zipcode, name…"**
- Leading icon slot `absolute inset-y-0 start-0`, geolocate button `p-3` with spinner states
- Hidden fields: `lat`, `lng`, `approximative`
- **Filled state**: pin icon + full label ("San Diego, California, United States") + `×` clear button
- **Autocomplete blends two result types**:
  - places — `San Diego · California, United States`
  - store names — `Optom Eyes Vision Care San Diego · San Diego, United States`

### Filter bar (separate `<form>`)
- `512 × 67` at `y 117`, padding `16px`, gap `16px`, `border-bottom 1px #eeedf1`
- Chip `#cl[produit]-button` — `160.66 × 34`, bg `#141318`, white, padding `6px 10px`, radius `6px`, 14px/400, `capitalize`, trailing chevron that rotates
- Dropdown panel `w 240` (`w-60`), white, `1px #d8d7e0`, radius `6px`, `shadow-lg`, `z-10`, `ul.space-y-2.p-3`
- **5 checkbox values** on `name="cl[produit]"`:
  `sunglasses` · `snowgoogles` · `sportsprotective` · `ophthalmic` · `snowhelmets`
- **"Miles" checkbox** `57.69 × 20` beside the chip — km ⇄ mi unit toggle (en-gb defaults to km)

### Results (`#Results`)
- `512 × 716` at `y 184`, padding `16px`, `overflow-y auto`
- Heading **"Find a Spy Optic dealer"**
- **10 results per query**, `scrollHeight 1416` vs `clientHeight 716`. No pagination inside the panel — more results come from panning the map.

#### Card — collapsed (`480 × 104`, 16px gap between cards)
```
Department Of The Navy              ┌ 📍 4 km ┐   ← 56×22 badge
Spy Optic San Diego                              ← 14px/300, truncate
92155-5589 San Diego                             ← <address class="not-italic">
```
- Name `16px/600`; subtitle & address `14px/300`, `text-ellipsis whitespace-nowrap`
- Distance badge: bg `#eeedf1`, text `#383644`, `12px/500`, padding `2px 6px`, radius `4px`, `border 1px #8d8aa6`
- Actions container is `hidden` when collapsed

#### Card — active (`480 × 212`, bg `#f6f6f9`)
Reveals street address, phone with icon, then `grid grid-cols-2 gap-3 mt-4`:

| Button | bg | color | padding | radius | href |
|---|---|---|---|---|---|
| Call us | `#eeedf1` | `#141318` | `8px 16px` | `4px` | `tel:+17184317900` |
| More info | `#141318` | `#fff` | `8px 16px` | `4px` | `/en-gb/shop/93/department-of-the-navy` |

Selection is driven by `data-[active="true"]:bg-primary-50` on the card's `<button>`. **Clicking a pin highlights the list card — there is no map popup.**

### Empty state
- h1 **"Search for a location"** — 16px/600, centred, `p-16`
- Sub "Enter search criteria or locate yourself to see nearby locations." at `opacity 80`
- "Geolocate myself" button `160.58 × 44`, transparent bg, radius `8px`, `14px/500`, padding `10px`

### Map
- MapLibre GL canvas `928 × 836`; placeholder bg `#d8d7e0` before tiles load
- Markers: orange teardrop with the SPY cross, `fill-secondary-600`, `28.8 × 54` (`h-12`), `transition-all`
- Zoom `+/−` control top-right, `40 × 70` at `x 1400, y 64`
- Attribution bottom-right `66 × 24` — "MapLibre"
- **Overlay pill**, top-centre (`lg:left-1/2 -translate-x-1/2`), white, `px-3 py-1.5`, radius `2px`, `shadow-md`, 14px:
  - initial → "Move the map to load results"
  - after pan → "View more results" / "Search this area"

### Footer (below the fold, `y 900`, `h 148`)
- bg `#f6f6f9`, padding `16px`, `grid-cols-12 gap-4`, centred
- h2 "Spy Optic presence" → `/en-gb/store-locator`
- 9 country links → `/en-gb/store-locator/{canada|united-states|spain|israel|italy|finland|germany|france|austria}`
- Social: Facebook · Instagram · LinkedIn
- `WebSite` JSON-LD

---

## 4. Breakpoints

`md = 768px` turns the grid on. `lg = 1024px` restores the desktop nav.

### 768 × 1024 — ⚠️ the source is BROKEN here
```
grid-template-columns: 512px 256px
```
The panel keeps its hard `512px` and the map is crushed to **256px**. Header drops to `h 56`, `#mobile-menu` is `display:none`, replaced by flag + hamburger.

**Do not reproduce this.** Same class of defect already logged for the main site's 992–1240 range. Our build should either keep a fluid panel or stack below ~1024.

### 390 × 844
- Grid falls back to `display: flex` (column)
- Map is `display:none` (`0 × 0`); results take the full `390` width, `h 631`
- `#Switcher` pinned at `y 807`, `h 37`, `border-top 1px #d8d7e0`, two 36px buttons:
  - **List** active — bg `#141318`, white
  - **Map** inactive — bg `#eeedf1`, dark
- Tapping Map hides the list and shows the map full-height, keeping the search bar, filter bar, overlay pill and zoom controls

---

## 5. Store detail page — `/en-gb/shop/{id}/{slug}`

This is the SEO engine, and it is substantial.

- `<title>` — "Department Of The Navy - Official Spy Optic Retailer"
- `h1` — "DEPARTMENT OF THE NAVY - SPY OPTIC STORE" (uppercase)
- Sticky search bar under the header + "All our dealers" link
- **Hero**: greyscale vector-map background, white rounded card overlaying it
  - left: image carousel with prev/next arrows (generic SPY lifestyle shots, not store photos)
  - right: storefront icon, h1, "Spy + Products in San Diego", address, phone, then **Visit us** (directions) and **Locate us on map**
- Body: three generated SEO paragraphs naming the store + city + Happy Lens Technology
- `h2 OUR FEATURED PRODUCTS` → `h3 Spy Optic sunglasses` + copy
- `h2 FIND SPY OPTIC PRODUCTS NEARBY / NEAR <NAME>` → 3 nearby dealer cards
- Breadcrumb: Search → Our network → United States → California → San Diego → San Diego
- **JSON-LD**: `BreadcrumbList` + `LocalBusiness` (name, `PostalAddress`, `telephone`, `image[]`)

## 6. Country index page — `/en-gb/store-locator/{country}`

- `h1` "Spy Optic retailers in United States (1024)"
- 35 listings per page, **29 pages** of pagination
- State links with counts — California (410), Colorado (66), Arizona (50), Nevada (48), New Mexico (23)…
- ~200+ county links nested under states, then city links

---

## 7. Implications for the Shopify rebuild

### Reachable with the Stockist widget + custom CSS
Search, autocomplete, geolocate, the 5 product filters (as Stockist filters — needs tags on every location), km/mi toggle, orange pins, SPY colours and type, distance badges, Call/Directions actions.

### Needs custom code on top of the widget
The `512px + 1fr` grid, the filter chip-and-dropdown pattern, the mobile List/Map switcher, the "Spy Optic presence" country grid.

### Not reachable with Stockist at all
| Gap | Why |
|---|---|
| MapLibre + custom vector style | Stockist gives Google Maps or Mapbox only |
| Pin click → highlight list card | Stockist docs: popups "always open directly on the pin"; map↔sidebar behaviour is fixed |
| "Search this area" on pan | Stockist's map-move behaviour is its own |
| Store detail pages | No per-location URLs — only pre-filled search deep links |
| Country/state/county/city indexes | No server-rendered output at all; the widget is client-side JS |
| Locale picker | Belongs to the standalone app; Shopify handles this via Markets |
| 2,261 locations | Stockist Premium caps at **2,000** |

### The two decisions this forces
1. **Plan ceiling** — 2,261 > 2,000. Either restrict to US + Canada (1,131) or negotiate a custom tier with Stockist.
2. **SEO** — the current locator is thousands of indexable pages carrying `LocalBusiness` schema. A Stockist widget renders nothing into the HTML source. Replacing the subdomain forfeits that surface; keeping it and linking to an in-theme Stockist page does not.

---

## 8. Method

```
node_modules/playwright-core + C:/Program Files/Google/Chrome/Application/chrome.exe
headless, locale en-GB, viewports 1440×900 / 768×1024 / 390×844
```
`stores.spyoptic.com` does **not** bot-block a fresh profile (unlike `www.spyoptic.com`) — WebFetch and a cold Chrome both get through.
Axeptio must be dismissed (`button:has-text("OK!")`) then the mount removed before screenshots.
Scripts kept in the session scratchpad: `probe.mjs`, `flow.mjs`, `detail.mjs`, `shots.mjs`, `pal.mjs`.
