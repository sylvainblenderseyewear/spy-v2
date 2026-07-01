# Page Spec: Blog / Journal (`blog` + `article`)

**Representative URLs:**  
- Listing: https://www.spyoptic.com/us/spy-blog/  
- Article: https://www.spyoptic.com/us/spy-blog/what-are-polarized-sunglasses.html  
**Templates:** `blog` (listing), `article` (post)  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## Blog Listing Page (`blog`)

### Section Inventory

| # | Section / Module | Content | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) | — |
| 2 | Navigation | Shared | No (shared) | Yes |
| 3 | Blog Hero | "+JOURNAL+" branded hero banner | CUSTOM blog-hero block | Yes | Yes |
| 4 | Article Grid | Chronological grid of article cards | CUSTOM article-card-grid | Yes | 3-col → 2-col → 1-col |
| 5 | Pagination | Page number indicator (currently shows [1]) | Horizon pagination | Style | — |
| 6 | Footer | Shared | No (shared) | — |

### Article Card Elements
| Element | Notes |
|---|---|
| Publication date | Format: "4/1/26" (M/D/YY) |
| Article title | Linked heading |
| Featured image | Full-bleed card image |
| Excerpt / teaser | 1–2 sentence description |
| Author | Not visible on card (only visible within article) |
| Category / tag | ⚠️ MEASURE — may not be present as visible filter |

### No sidebar, no category filter visible on current listing page.

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
