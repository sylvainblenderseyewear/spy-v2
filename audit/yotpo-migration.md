# Yotpo reviews: move them to the store's account

29 Oct 2026. Why most product pages show no stars, and the file Yotpo needs to fix it.

## The problem

SPY has two Yotpo accounts (one login, switcher bottom left in the Yotpo admin):

| Account | App key | Finds a product by | Reviews |
|---|---|---|---|
| **spyoptic.com** (old site) | `QvaApx…` | old site ids: SFCC product ids and UPC-style SKUs | 13.3K product reviews, 2,746 site reviews |
| **Spyoptic-Staging** (loaded by the Shopify store) | `HnS18C…` | Shopify product id | 3.1K, but on very few products |

The store loads **Spyoptic-Staging** (`staticw2.yotpo.com/HnS18C…/widget.js?shop=spyoptic-com.myshopify.com`), and
every product page asks it for the Shopify product id. Of the **1,044 active products**:

- **848** have reviews on the old account (example: Bowery, 4.9★ from 48 reviews on key `267071`)
- **29** have reviews on Spyoptic-Staging (mostly Discord, 4.3★ from 59)

So the stars stay empty on almost every product until the old reviews are in Spyoptic-Staging. No theme change is
needed after that: the theme already sends the Shopify product id.

## The file: `yotpo-migration-map.csv`

One row per live product (all 1,185, drafts included).

| Column | Meaning |
|---|---|
| `shopify_product_id` | the id Spyoptic-Staging should file the reviews under |
| `handle`, `title`, `status` | the live product |
| `model` | the product's `collection::MODEL` tag: colourways of one model should share their reviews (one Yotpo product group per model, like the old account) |
| `match` | how the old key was found: `handle` (the 3 Sep map), `model` (another colourway of the model), `sku` (the variant SKU is itself an old key), `model-sku` (a sibling colourway's SKU), `none` |
| `legacy_keys_s1` | the old account's product key(s), `;`-separated |
| `s1_reviews`, `s1_avg` | reviews on the old account (the largest of its keys) |
| `s2_reviews_now`, `s2_avg_now` | reviews already on Spyoptic-Staging |

Counts: 370 by handle, 219 by model, 302 by SKU, 100 by a sibling's SKU, 194 with no old key (45 active models, mostly
hats, tees, a few optical sizes and new goggles such as Megalith and Marshall 2.0, which likely have no reviews).
28 products already have reviews on both accounts (mostly Discord), so the import must skip duplicates.

Built read-only from the Admin API and Yotpo's public bottomline API
(`https://api-cdn.yotpo.com/products/<app_key>/<key>/bottomline`); nothing was written to Shopify or Yotpo.

## What to ask Yotpo support

Draft (not sent):

> Hello, we moved spyoptic.com from Salesforce Commerce Cloud to Shopify (spyoptic-com.myshopify.com).
> Our Shopify store is connected to the account **Spyoptic-Staging** (app key starting `HnS18C`), but almost all
> of our product reviews are in the account **spyoptic.com** (app key starting `QvaApx`), keyed by the old SFCC
> product ids and SKUs. Please copy the product reviews (with their star ratings, photos and dates) and the site
> reviews from spyoptic.com into Spyoptic-Staging, re-keyed to our Shopify product ids. The attached
> `yotpo-migration-map.csv` maps every Shopify product id to its old key(s) (`legacy_keys_s1`). Please group
> products by the `model` column so all colourways of a model share their reviews, as they do today, and skip
> reviews that already exist in Spyoptic-Staging. Can you confirm the timing, and whether review request emails
> are affected?

## The other way

Connect the Shopify app to the **spyoptic.com** account instead, and store each product's old key in a
`yotpo.product_id` metafield (storefront read access). The star and review blocks already read it
(`product.metafields.yotpo.product_id.value | default: product.id`). That shows the old reviews at once, but new
reviews and review emails would then go to the old account.
