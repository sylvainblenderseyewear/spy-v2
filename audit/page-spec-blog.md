# Page Spec: Blog / Journal (`blog` + `article`)

**Representative URLs:**  
- Listing: https://www.spyoptic.com/us/spy-blog/  
- Article: https://www.spyoptic.com/us/spy-blog/what-are-polarized-sunglasses.html  
**Templates:** `blog` (listing), `article` (post)  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## Blog Listing Page (`blog`)

**Measured** 2026-08-13 off the live page (computed styles at 1440 / 1200 / 992 / 768 / 390).
Built as `sections/spy-blog-hero.liquid` + `sections/spy-blog-list.liquid`, wired in
`templates/blog.spy_blog.json`.

### Section Inventory

| # | Section / Module | Content | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) | — |
| 2 | Navigation | Shared | No (shared) | Yes |
| 3 | Blog Hero | Full-bleed campaign banner, no text overlay | CUSTOM `spy-blog-hero` | Yes — separate desktop/mobile art |
| 4 | Keyword search | "Search by keyword" field on a grey panel | CUSTOM `spy-blog-list` | No |
| 5 | Article Grid | Chronological grid of article cards | CUSTOM `spy-blog-list` | 4-col → 3-col → 1-col |
| 6 | Pagination | Page number indicator (currently shows [1]) | CUSTOM `spy-blog-list` | — |
| 7 | Value props + Footer | Shared (footer group) | No (shared) | — |

### Measurements

**Hero** — full-bleed `<img>`, natural height, art swapped by `<picture>` at **992px**:
desktop 1920x600 (3.2:1), mobile 800x1200 (2:3). No height rule of its own.

**Container** — 15px side gutters; 540px max-width under 992px, fluid above it.

**Search panel** — `#f8f8f8`, 16px padding, `width: fit-content` centred, **48px** under the hero.
Field 172x36.1, white, 1px `#1d2a2b` border, radius 0, 13/18.2 regular,
padding `8px 4px 8px 32px`, placeholder "Search by keyword"; 15px magnifier 8px in from the left.

**Grid** — Bootstrap row: -15px pull, 15px padding per column (30px gutter), **24px** row gap,
**80px** above. Columns: **1** under 992px · **3** from 992px · **4** from 1200px.

**Card** — square (1:1) thumbnail on `#f8f8f8`, `object-fit: cover`; text block 16px below it,
left aligned. All text `#333e47`:

| Element | Value |
|---|---|
| Date | 16 / 22.4, weight 200, 8px padding-bottom. Format "4/1/26" (M/D/YY) |
| Title | 20 / 24, weight 700, no case transform, 4px margin-bottom |
| Excerpt | 16 / 22.4, weight 400, no clamp — cards in a row size to the tallest |
| Author | Not on the card (article page only) |
| Category / tag | Not shown, and no category filter on the listing |

Posts with no image keep the square as an empty `#f8f8f8` box.

**Pagination** — 24px above, centred. Link 8px/12px padding, 12/16.8 uppercase, radius 0,
1px border. Active fills brand orange with `#1d2a2b` text.

### Notes
- Card image = the post's featured image; when a post has none, the first image in its body
  stands in (that is the hero at the top of the post).
- Search is client-side over the rendered page (source runs the same search over one AJAX page
  of 24). Pagination hides while a keyword is active; `?q=` is kept in the URL.
- No sidebar and no category filter on the listing.

---

## Blog Article Page (`article`)

### Section Inventory

| # | Section / Module | Content | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) | — |
| 2 | Navigation | Shared | No (shared) | Yes |
| 3 | Article Header | Title ("What are Polarized Sunglasses?"), Date ("7/31/2024"), Author ("Spy Optic") | CUSTOM article-header block | Yes | — |
| 4 | Hero Image | Full-width featured image (model wearing Rebar SE) | Horizon image block or custom | Style | Yes |
| 5 | Social Share | Instagram, Facebook, Twitter, YouTube share buttons | CUSTOM social-share block | Yes | — |
| 6 | Article Body | Rich text content: headings, paragraphs, diagrams | Horizon article content | Style | — |
| 7 | Related Articles | ⚠️ NOT present on current site — but may be added in Shopify rebuild | Optional CUSTOM block | — | — |
| 8 | Footer | Shared | No (shared) | — |

### Article Elements
- **Title:** H1, large, uppercase or mixed case (⚠️ MEASURE)
- **Date:** published date, small text
- **Author:** "Spy Optic" — brand author, not individual byline
- **Social share:** icons above body content (Instagram, Facebook, Twitter, YouTube)
- **Body content:** mixed headings + body text + diagrams/illustrations
- **No breadcrumb:** not present on current site (add for Shopify usability)

---

## Responsive Behavior

| Element | Desktop 1440 | Mobile 390 |
|---|---|---|
| Article grid | 3 columns | 1 column |
| Article body width | ⚠️ MEASURE max-width | Full width - padding |
| Hero image | Full-width | Full-width (tall) |

---

## URL Migration

Old SFCC pattern: `/us/spy-blog/{slug}.html`  
New Shopify pattern: `/blogs/journal/{slug}` (default Shopify blog URL)

301 redirects required for all article URLs.
