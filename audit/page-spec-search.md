# Page spec — Search (header search bar + suggestions + /search results)

Measured live on www.spyoptic.com on 2026-09-29 with Playwright (1440 / 992 / 991 / 768 / 390).
Screenshots are in `audit/search/`. The source uses stock SFCC SFRA search (`SearchServices-GetSuggestions`)
with SPY styling on top.

## 1. Trigger

| | Desktop ≥992 | Mobile/tablet <992 |
|---|---|---|
| Icon | `fa-search` (FA Regular, `fa-xs`) in the utility icons, first of search · locator · account · cart. Box 23×49 at 1440 | Same icon, left of the cart, box 15×22 (x=302 at 390) |
| Action | `<a href="#">`. Click adds `body.site-search-active`. The page does **not** navigate | same |

- There is no text label and the link has no `aria-label` (an a11y gap, so don't copy it). Our version needs `aria-label="Search"` and `aria-expanded`.

## 2. Search bar (opens under the header)

- `.site-search` is `position:absolute; top:0; width:100%; height:45px`, white. It sits behind the header when closed
  (`z-index:-1; transform:none`). When open it becomes `z-index:1; transform:translateY(<header height>)`:
  52px at 1440, 55px at 768/390.
- **Animation:** `transition: transform .5s cubic-bezier(0.5,0.25,0,1), z-index .5s`, so it slides down from behind the header. No fade and no backdrop. The page stays scrollable (body overflow is not locked).
- `.input-group`: full width (no container), `border:1px solid #e6e6e6`, `padding:4px 8px`, radius 0, no shadow.
- **Input:** DIN Next LT Pro 13px/18.2px, weight 400, color `#1d2a2b`, **`text-align:center`**, padding `0 4px`,
  height 25px, no border, no focus outline (this is an a11y gap, so ours needs a visible focus style).
  Placeholder is `Search...` in `#ababab`. `type=search`, `name=q`, `autocomplete=off`.
- The input is **focused automatically** when the bar opens.
- Right side, in this order: Chrome's native `type=search` clear ✕ (blue, only shows when there is a value), then the magnifier
  (`fa-search`, 16px, `#1d2a2b`, `padding-right:4px`), then the close button (`fal fa-times fa-sm` 12px, button 35×35,
  `padding:8px 12px`).
- The close ✕ slides the bar back up. **It keeps the typed value and the old suggestions HTML**, so they come back when you reopen.
- Enter or the magnifier submits `GET /us/search?q=…&lang=en_US`.
- Breakpoints: the bar looks the same at every width. Only the dropdown changes (see §3).

## 3. Suggestions dropdown (predictive)

**Trigger rules:** needs at least **3 characters** (no request for `c` or `cy`) and is **debounced**. Fast typing of `cyrus`
fired a single request, about 300 ms after the last key. Endpoint `SearchServices-GetSuggestions?q=`. It returns
server-rendered HTML.

**Panel** (`.suggestions`): `position:absolute; top:0` directly under the bar. Full viewport width (no max-width), white,
`border:1px solid #e6e6e6`, `box-shadow: 0 5px 9px 0 rgba(119,119,119,.2)`, `z-index:3`, `overflow-y:auto`.
- ≥992: `padding:0 15px`. Height fits the content (400px for "cyrus"). It has no max-height, so a long list runs past the fold.
- <992: `padding:0 15px 96px`, and the panel is as tall as the viewport (844 at 390, 1024 at 768). It scrolls inside itself.

**Order of the groups** (each one shows only when it has results):
1. **"See All Results" row**: right-aligned link to `/us/search?q=…`, 16px/22.4 400, row `padding:8px`, 38px tall.
   It has a "do you mean" phrase slot on the left, which was empty for every query we tried. A 1px `#e6e6e6` line sits under this row.
2. **CATEGORIES**, e.g. "Goggles in Sale", "Goggles", "Snow Goggles in Goggles", "Motocross Goggles in Goggles". These are links
   to the category PLPs. Rows are spaced about 38px apart (looser than Content).
3. **CONTENT**: CMS content assets. Rows are 22px, with no gap.
4. **PRODUCTS**: up to **4** items.

**Group headers** (`.header`): 14px/19.6 **700 uppercase**, `#ababab`, `margin-bottom:8px`.
Categories and Content are indented with `px-lg-5` (x=64 at ≥992). Products use `px-lg-3` (x=32). All three sit at x=16 below 992.

**Text links:** 16px/22.4, weight 400.
- ≥992: `#1d2a2b`. Hover gives no colour change and no underline.
- <992: Categories, Content and "See All Results" turn **orange `#f27e37`**. Product names stay `#1d2a2b`.

**Product item:**
- ≥992: 2 columns (`col-md-6` = 50%, `padding:0 8px`, `margin-bottom:16px`).
- <992: 1 column (343px wide at 390, 736px at 768).
- Thumbnail: 90×90, `object-fit:fill`, `padding-right:8px`. It shows at every width.
- Name: 16px 400 `#1d2a2b`, **uppercase** (the source data is uppercase), single line with an ellipsis
  (`text-truncate`, e.g. "FOUNDATION NOSE ...").
- Price: 16px **700** `#222`. For a range it shows `Starting from $145`, and the label is bold as well.
- Sale price: `$15` (700) · `<del>$25</del>` (400, `#ababab`, line-through, `margin-right:4px`) · a **40%** chip
  (white on `#f27e37`, `padding:0 10px`, 16px 400, radius 0). The chip shows the % discount.

**Empty state:** a single centred line, `No products found for zzqxv`. The "See All Results" row and the groups do not show.

**Closing behaviour:**
- Clicking outside the panel does **not** close it.
- Escape does not close the bar or the panel. Chrome's native search field may clear its value; we didn't verify this.
- Arrow keys do nothing. There is no listbox or `aria-activedescendant` (an a11y gap).
- Only the close ✕ hides the panel, and it goes up together with the bar.

**Content leakage (don't copy):** the Content group shows internal SFCC content assets such as "Flyout Menu Cyrus April 2023",
"flyout-menu-bogo" and "Fit guide Cyrus". This is a source bug. Our Content/Articles group should list only real pages and articles.

## 4. Results page `/us/search?q=cyrus`

- Title `SPY Optic Storefront Catalog` (a source SEO gap). The URL keeps `lang=en_US`.
- No hero and no breadcrumb. `container-fluid my-4`.
- **Heading:** `Results for "cyrus"`, centred 18px/25.2. The text is 400 and the keyword (with its quotes) is **600**.
- **Tabs** (centred, `px-5`, 1px `#e6e6e6` line under the row): `Products (32)` · `Articles (3)`, 16px 400, `padding:8px 16px`.
  The active tab is `#f27e37` with an **inset 2px orange bottom shadow** (`box-shadow: inset 0 -2px 0 #f27e37`). The inactive tab is `#1d2a2b`.
  Articles loads over AJAX (`Search-Content`) on click, and the URL does not change.
- **Products tab = the PLP grid/toolbar reused:** orange `FILTER` button (12px uppercase, white on `#f27e37`),
  `SORT BY` select (Most Popular / Price Low To High / Price High to Low), a 3-column grid at 1440 (426px tracks,
  `gap:35.2px 16px`), and the same product card as the PLP (NEW badge, colour name, "N colors available", HB/Cat-4 badges, Quick View).
  24 per page, then a **`MORE RESULTS`** button (outline: 1px `#f27e37`, orange text, 12px uppercase, 320×35, `col-sm-3`)
  that loads more with `Search-UpdateGrid?start=24&sz=24`.
- Facets show only the values present in the results: Category, Color, Price (one range), Lens Category (Cat. 3/4).
- **Articles tab:** `h4` links in a centred `col-lg-6` column, `mb-4` between them. Plain titles with no images or excerpts.
- **No results** (`?q=zzqxv`): the line `We are sorry, but no results were found for: "zzqxv"` (same 18px style, keyword 600),
  the tabs at `(0)`, then `...Or check those` (48px/57.6 400, centred, `margin-bottom:48px`) above a recommendations carousel of
  3 product cards (Discord, Cyrus, Helm), then the value-props band and the footer.

## 5. Colours used (map to Layer 1)

| Source | Use | Theme token |
|---|---|---|
| `#1d2a2b` | text, icons | existing text colour |
| `#ababab` | placeholder, group headers, strike price | muted text |
| `#e6e6e6` | bar and panel borders, tab line | border |
| `#222` | price | price colour |
| `#f27e37` | mobile links, active tab, sale chip, filter/more buttons | brand orange. Text uses `spy_orange_accessible` (#b85314) for AA; the chip keeps the bright orange with white text only if the contrast passes |
| `rgba(119,119,119,.2)` | panel shadow | shadow setting |

## 6. Build notes (source → ours)

- Our header (`blocks/spy-utility-nav.liquid`) opens Horizon's `search-modal` (a centred dialog with a backdrop). To match 1:1 it needs to
  become a **slide-down full-width bar under the header**, reusing Horizon's `predictive-search` component (Section Rendering
  API `/search/suggest`) for the data. Shopify predictive search returns products, collections, pages and articles, which
  maps cleanly onto Categories / Content / Products.
- Keep the source's look but fix its a11y gaps: aria-label on the trigger, visible focus, Escape and outside-click to close,
  arrow-key listbox, focus returns to the trigger. This fits the WCAG AA rule and the shared inert-page overlay pattern (`syncPageInert`).
- Match the rules: 3-character minimum, ~300 ms debounce, max 4 products, 2 columns ≥992 / 1 column below, orange links <992.
- The results page = `templates/search.json` using the same PLP grid and cards, Products/Articles tabs, More Results pagination,
  and a "...Or check those" recommendations fallback when there are zero results.
- Breakpoint-specific: only the dropdown (992). No per-breakpoint assets.
