# SPY Optic — Site Map (Phase 0 Recon)

> Source: crawled nav/mega-menu + footer + category pages. `sitemap.xml` returned 404 (SFCC-hosted). URLs marked `(TBC)` need verification during build.

## Site Tree

```
spyoptic.com/
│
├── [HOMEPAGE] /
│
├── [SUNGLASSES] /us/sunglasses/                    → collection.default
│   ├── Men's Sunglasses  /us/mens-sunglasses/
│   ├── Women's Sunglasses  /us/sunglasses/womens-sunglasses/
│   ├── Safety Sunglasses  /us/sunglasses/safety-sunglasses/
│   ├── Fishing Sunglasses  /us/sunglasses/fishing-sunglasses/
│   ├── Sale /us/sale/sunglasses/
│   └── PDPs: /us/sunglasses/{name}-{PID}.html      → product.default
│
├── [GOGGLES] /us/goggles/                          → collection.default
│   ├── Snow Goggles  /us/goggles/snow-goggles/     → collection.default
│   │   ├── PDPs: /us/goggles/snow-goggles/{name}-{PID}.html   → product.snow-goggle
│   │   └── Replacement Lenses:
│   │       └── /us/goggles/snow-goggles/replacement-lenses/{name}-{PID}.html → product.lens
│   └── Motocross Goggles  /us/goggles/motocross-goggles/  → collection.default
│       └── PDPs: /us/goggles/motocross-goggles/{name}-{PID}.html  → product.moto-goggle
│
├── [SNOW HELMETS] /us/snow-helmets/                → collection.default
│   └── PDPs: /us/snow-helmets/{name}-{PID}.html   → product.helmet
│
├── [EYEGLASSES] /us/eyeglasses/                   → collection.default
│   ├── Men's Eyeglasses  /us/eyeglasses/mens-eyeglasses/
│   ├── Women's Eyeglasses  /us/eyeglasses/womens-eyeglasses/
│   ├── Blue Light Glasses  /us/eyeglasses/blue-light-glasses/
│   └── PDPs: /us/eyeglasses/{name}-{PID}.html     → product.default
│
├── [GEAR] /us/gear/                                → collection.default
│   ├── Apparel — Shirts, Hats/Beanies
│   ├── Accessories  /us/gear/accessories/
│   └── PDPs: /us/gear/apparel/{sub}/{name}-{PID}.html  → product.apparel
│
├── [COLLECTIONS] — Curated editorial
│   ├── Happy Boost Sun  /us/collections/sunglasses/happy-boost-sun-collection/   → collection.story
│   ├── Discord Series  /us/collections/sunglasses/discord-series/                → collection.story
│   ├── Helm Series  /us/collections/sunglasses/helm-series/                      → collection.story
│   ├── Trail  /us/collections/sunglasses/trail-collection/                       → collection.story
│   ├── Classics  /us/collections/sunglasses/classics-collection/                 → collection.story
│   ├── Lifestyle  /us/collections/sunglasses/lifestyle-collection/               → collection.story
│   ├── Flag Collection  /us/collections/sunglasses/flag-collection/              → collection.story
│   ├── Happy Boost Snow  /us/collections/goggles-ski-snowboard/happy-boost-snow-collection/ → collection.story
│   └── Spy+ Merch (Crypto)  /us/collections/spy-merch/                          → collection.story
│
├── [SALE] /us/sale/                                → collection.default
│   ├── Sunglasses  /us/sale/sunglasses/
│   ├── Snow Goggles  /us/sale/goggles/snow-goggles/
│   ├── Motocross Goggles  /us/sale/goggles/motocross-goggles/
│   └── Eyeglasses  /us/sale/eyeglasses/
│
├── [TECH GUIDES] — page.tech-guide (metaobject-driven)
│   ├── Snow Tech  /us/SnowTech.html
│   ├── Snow Helmet Tech  /us/SnowHelmetTech.html
│   ├── Happy Lens  /us/HappyLens.html (TBC)
│   └── Happy Boost  /us/HappyBoost.html (TBC)
│
├── [JOURNAL / BLOG]
│   ├── Listing  /us/spy-blog/                      → blog
│   └── Articles  /us/spy-blog/{slug}.html          → article
│
├── [EDITORIAL / BRAND] — page.editorial
│   ├── About Us  /us/about-us.html
│   ├── Team / Athletes  (TBC)
│   ├── Loyalty Program  /us/loyalty-program.html
│   └── ESG Program  (TBC)
│
├── [POLICY / SUPPORT] — page.default
│   ├── Warranty  /us/warranty.html
│   ├── Return Policy  /us/spy_optic_return_policy.html
│   ├── Shipping  /us/shipping/shipping.html
│   ├── Contact Us  /us/contactus
│   ├── FAQ  (TBC)
│   ├── Privacy Policy  (TBC)
│   ├── Terms of Use  (TBC)
│   ├── MAP Policy  (TBC)
│   ├── Accessibility Statement  (TBC)
│   ├── Military & First Responders  (TBC)
│   └── Retail Sales Agreement  (TBC)
│
├── [ACCOUNT] — Horizon customer accounts
│   ├── Login / Register  /us/login
│   ├── My Account  /us/account
│   └── My Orders  (TBC)
│
├── [CART]  /us/cart
│
├── [SEARCH]  /us/search
│
└── [EXTERNAL — LINK OUT ONLY, DO NOT REBUILD]
    ├── Store Locator  stores.spyoptic.com
    ├── Dealer Portal  b2b-bollebrands.com
    ├── Prescription  sportrx.com
    ├── Military/GovX  govx.com
    └── Affiliate  avantlink.com
```

## Page-Type Summary

| Template | Count (approx.) | Notes |
|---|---|---|
| `product.default` | ~200+ | Sunglasses + eyeglasses PDPs |
| `product.snow-goggle` | ~15 | Snow goggle PDPs |
| `product.moto-goggle` | ~10 | Moto goggle PDPs |
| `product.helmet` | ~20 | Snow helmet PDPs |
| `product.lens` | ~10 | Replacement lens PDPs |
| `product.apparel` | ~10 | Gear/apparel PDPs |
| `collection.default` | ~15 | Standard category PLPs |
| `collection.story` | ~9 | Curated editorial collections |
| `index` | 1 | Homepage |
| `page.tech-guide` | 4 | SnowTech, SnowHelmetTech, HappyLens, HappyBoost |
| `page.editorial` | ~5 | About, Team, Loyalty, ESG |
| `page.default` | ~10 | Policy/support pages |
| `blog` | 1 | Journal listing |
| `article` | ~20+ | Journal articles |
| Account/Cart/Search | 4 | Horizon defaults |
| External (link out) | 5 | Not rebuilt |

## Redirect Workstream

Old SFCC pattern → New Shopify pattern:
- `/us/{cat}/{name}-{PID}.html` → `/products/{handle}`
- `/us/{cat}/{sub}/{name}-{PID}.html` → `/products/{handle}`
- `/us/{cat}/` → `/collections/{handle}`

See `/audit/redirect-urls.csv` (to be built incrementally).
