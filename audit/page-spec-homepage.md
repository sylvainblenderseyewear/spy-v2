# Page Spec: Homepage (`index`)

**Representative URL:** https://www.spyoptic.com/  
**Template:** `index`  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390 (⚠️ to be captured before Phase 2 build)

---

## Section Inventory (Top → Bottom)

| # | Section Name | Content | Horizon Block | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | "🔥 CHECK OUT THE SALE SECTION" → `/us/sale/sunglasses/` | Announcement bar section | Text-only; single setting |
| 2 | Navigation Header | Logo, mega-menu (7 categories), Sign In, Find a Store, country selector, search icon | Custom header section | Yes — hamburger ≤ tablet |
| 3 | Hero / Activity Category Tiles | 8 tiles: SNOW, SAFETY, FISHING, LIFESTYLE, CLASSICS, MOTO, TRAIL, BLUE LIGHT. Each has label, link, background image, hover effect (image swap or zoom). | CUSTOM block — "category-tile-grid" | Yes — 2×4 desktop, 2×4 or 1×8 mobile scroll |
| 4 | Feature Banner – Region XL | Full-width promo image. Headline + "SHOP NOW" CTA → `/us/sunglasses/fishing-sunglasses/region-xl-212511.html`. Desktop + mobile image assets. | CUSTOM block — "feature-banner" | Yes — separate desktop/mobile images |
| 5 | New Arrivals Carousel | Headline "NEW ARRIVALS" + "SHOP NEW ARRIVALS" link → `/us/sunglasses/`. Product carousel: Cyrus Switch ($200), Bowery ($180), etc. Color swatches per card. | CUSTOM block — "product-carousel" (reads collection) | Scroll on mobile |
| 6 | Watermen Collection Carousel | Headline + "SHOP NOW". 5 products: Mainline ANSI, Overhaul XL, etc. | CUSTOM block — "product-carousel" | Scroll on mobile |
| 7 | Loyalty CTA | Headline + "LEARN MORE" → `/us/loyalty-program.html`. | Custom block — "loyalty-banner" | ⚠️ MEASURE layout |
| 8 | Happy Boost Feature Banner | Promo banner. "SHOP HAPPY BOOST" → `/us/collections/sunglasses/happy-boost-sun-collection/`. | CUSTOM block — "feature-banner" | Yes — desktop/mobile images |
| 9 | Trust / Service Row | 4 badges: Free Shipping $50 · Returns 30d · Warranty · Contact. Icons + short label + link. | Custom block — "trust-badge-row" | Stack on mobile |
| 10 | Footer | 4 link groups + social icons + payment methods + B Corp badge + copyright | Custom footer section group | Stack on mobile |

---

## Detailed Section Specs

### Announcement Bar
- **Height:** ⚠️ MEASURE (est. 40px)
- **BG color:** dark (slate `#2c393e` or near-black)
- **Text:** white, uppercase, small; fire emoji; linked text is underlined or colored
- **Behavior:** static (not dismissible in observed state)
- **Layer:** Layer 2 (section settings — text, link, bg color from scheme)
- **Responsive:** single line collapses to smaller font on mobile

### Navigation Header
- **Height desktop:** ⚠️ MEASURE (est. 64–80px)
- **Logo:** left-aligned on desktop; centered on mobile
- **Nav items desktop:** inline list — Sunglasses, Goggles, Snow Helmets, Eyeglasses, Gear, Collections, Sale (each opens mega-menu)
- **Secondary icons:** Search, Sign In, Find a Store, Country selector
- **Mega-menu:** dropdown multi-column grid. Sub-items include images/product shots in some columns. Closes on click-away.
- **Mobile:** hamburger icon; drawer menu opens left or full-screen
- **Sticky:** ⚠️ MEASURE scroll behavior
- **Hover/interaction:** underline or color change on hover (⚠️ MEASURE)
- **Layer:** Custom header section; mega-menu content = Layer 2 (linklist + metaobjects)

### Category Tile Grid
- **Grid:** 8 tiles in a row on desktop; 2 columns × 4 rows on tablet/mobile (⚠️ MEASURE exact breakpoint)
- **Each tile:** background image (full-bleed), dark overlay, uppercase category label centered, link
- **Hover:** image zoom or second image swap (⚠️ MEASURE exact effect)
- **Image:** separate mobile + desktop image per tile required — **RESPONSIVE: yes**
- **Label typography:** bold uppercase, white, ⚠️ MEASURE size
- **Layer:** Layer 2 (each tile = block with image-desktop, image-mobile, label, link settings)

### Feature Banner (Region XL / Happy Boost)
- **Layout:** full-width or contained. Headline, subheadline, CTA button overlay on image
- **Images:** separate desktop + mobile — **RESPONSIVE: yes, 2 image slots per banner**
- **CTA:** primary button (orange)
- **Text position:** ⚠️ MEASURE alignment (center, left, or right) + separate mobile text alignment setting
- **Layer:** Layer 2 (image-desktop, image-mobile, headline, subheadline, cta-text, cta-link, text-alignment-desktop, text-alignment-mobile)

### Product Carousels (New Arrivals / Watermen)
- **Layout:** horizontal scroll carousel on mobile; multi-card visible on desktop (3–4 cards)
- **Card elements:** product image, product name, price, color swatches row
- **Quick View:** appears on card hover
- **Navigation:** prev/next arrows on desktop; swipe on mobile
- **Layer:** Layer 2 (carousel section settings: title, cta-link, collection reference)

### Trust / Service Row
- **Layout:** 4 items in a row on desktop; 2×2 grid or single column scroll on mobile
- **Each item:** icon + short title + link
- **Items:** Free Shipping ($50) → /shipping, Returns (30d) → /return-policy, Warranty → /warranty, Contact → /contactus
- **Layer:** Layer 2 (repeating block per badge: icon, label, link)

---

## Interactions / Animations to Replicate
- Category tile hover: image zoom or swap effect (⚠️ measure duration — est. 300ms ease)
- Mega-menu: fade in or slide down (⚠️ measure timing)
- Product carousel: swipe + prev/next button
- ATC hover: color/brightness shift on orange button

---

## TEMPLATE vs. DATA split
- **Template (layout):** section structure, tile grid layout, carousel shell, trust row layout, footer columns
- **Layer 2 (section settings):** announcement text, tile images/labels/links, banner images/copy/CTAs, carousel collection references, trust badge labels/links
- **Layer 1 (theme settings):** all colors, fonts, button styles, spacing

---

## Open Questions (Homepage)
- Exact number of tiles in the category grid — is it always 8?
- Is the Region XL banner hardcoded or a configurable "feature product" block?
- Are the product carousels collection-driven (auto-populated) or manually curated product lists?
- Does the homepage hero section ever show a full-width campaign image (different from the tile grid)?
