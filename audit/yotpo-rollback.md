# Yotpo product-ID mapping — rollback

Baseline captured 2026-09-03, before any write.

## Store state before this work
- Product metafield definitions in namespace `yotpo`: **none**
- Shop metafields in namespace `yotpo`: **none**
- Nothing else is touched: no titles, SKUs, variants, tags, or other metafield namespaces.

## Undo everything (store)
Deleting the definition removes every value with it:

```graphql
mutation {
  metafieldDefinitionDelete(
    id: "<definition id>"
    deleteAllAssociatedMetafields: true
  ) { deletedDefinitionId userErrors { field message } }
}
```

That returns the store to exactly the baseline above.

## Undo everything (theme)
All theme edits are tracked in git — `git checkout -- <files>`. Nothing is pushed automatically.

## Yotpo
**No writes are ever made to Yotpo.** Every call is a public read
(`api.yotpo.com/.../reviews.json`, `/bottomline`). No product, review, or group is
created, changed, or deleted, so there is nothing to roll back on that side.

## Source of the values
`audit/yotpo-product-map.csv` — regenerate any time; the mapping is derived, not hand-entered.

## Definition created
`gid://shopify/MetafieldDefinition/261876482288` — `yotpo.product_id` (PRODUCT, single_line_text_field, pinned), created 2026-09-03.

## Applied 2026-09-03
- `yotpo.product_id` written on **360** products (tiers A-direct / E-pid / C-group). Verified by bulk export: 0 missing, 0 wrong.
- Storefront access set to `PUBLIC_READ` (Liquid cannot read the value at `NONE`).
- 55 products intentionally left blank: 45 unmatched + 10 awaiting review.
- Theme: `legacy_id_metafield: "yotpo.product_id"` added to the star-rating block in all six `templates/product*.json`;
  `blocks/spy-app-embed.liquid` schema now exposes those settings to the per-product reviews carousel too.
