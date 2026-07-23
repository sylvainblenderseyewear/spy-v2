# PDP `product.default` Rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the default eyewear PDP (`templates/product.json`) so it matches the SPY Cyrus Switch source page 1:1 in structure, layout, type and color, using Horizon stock blocks wherever possible and this project's metafield schema.

**Architecture:** Keep Horizon's `product-information` section + `product-information-content` snippet. Re-order the `_product-details` blocks to the source order, mapping each module to a stock block where one exists (`product-title`, `price`, `review`, `product-inventory`, `variant-picker`, `buy-buttons`, `accordion`); keep the five existing custom `spy-*` blocks (breadcrumbs, lens-info, size-chart, spec-table, trust-badges) restyled to tokens; add two tiny custom blocks (`spy-frame-summary`, `spy-rx-button`) and one custom below-fold section (`spy-lifestyle-carousel`) where no stock block can read the required product metafield. All styling is Tailwind (utilities on custom blocks; scoped overrides for stock blocks in `src/tailwind.css`). Fonts wired to DIN Next LT Pro at Layer 1.

**Tech Stack:** Shopify Horizon theme, Liquid, Tailwind CSS v4 (`src/tailwind.css` → `assets/tailwind.css` via `npm run build:css`), Shopify CLI (`shopify theme dev`, `shopify theme check`).

## Global Constraints

- **Stock-first.** Use a Horizon basic block wherever one exists; add a custom `spy-*` block ONLY where no stock block can do the job (documented per task).
- **Data = metafields.** Read `spec.*`, `goggle.*`, `helmet.*`, `pdp.*` (Appendix A). NEVER use blenderseyewear's tag model (`swatch::`, `collection::`).
- **Layout = template.** A new product must fill the PDP with zero template edits.
- **Tailwind-only styling.** No `{% stylesheet %}` in custom blocks. Stock-block overrides go in `src/tailwind.css` (loaded after `base.css`, so plain CSS there wins). Run `npm run build:css` after EVERY style change; it emits `assets/tailwind.css`.
- **Layer 1 tokens — no hardcoded hex/font in Liquid.** Colors and fonts are `@theme` CSS vars / theme settings.
- **Colors:** text `var(--color-spy-text)`=`#242424` · secondary `var(--color-spy-text-2)`=`#393939` · muted `var(--color-spy-muted)`=`#a6a6a6` · border `var(--color-spy-border)`=`#e5e5e5` (source `#E6E6E6`) · accent/ATC `var(--color-spy-orange)`=`#f57f29` (KEEP; source computes `#F27E37` — intentionally not matched). Buttons square + uppercase.
- **Fonts:** `DINNextLTPro` weights 300/400/700 from `reference/fonts2`. Map: headings + bold labels → 700; body / price → 400; light captions → 300.
- **Verify every change** at desktop 1440 / tablet 768 / mobile 390, console clean, via `shopify theme dev` (use `--theme-editor-sync` off; if port 9292's token is expired use `--port 9293`). Tablet/mobile checked with browser DevTools device emulation (the preview window can't reflow narrower than ~1534px). **Never claim a step done from code alone.**
- **Git:** commit locally after each task with a one-line conventional message (`feat:`/`fix:`/`style:`/`refactor:`/`chore:`), no body, no AI attribution. **Do NOT push** — the user pushes to the Staging v2 theme themselves.
- **Comments:** B2 English, short, human, high-hint.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `assets/DINNextLTPro-{Light,Regular,Bold}.woff` | DIN font files | 1 |
| `src/tailwind.css` | `@font-face`, global font-var override, new color tokens, all scoped PDP overrides | 1,2,4,6 |
| `snippets/stylesheets.liquid` | preload the two main DIN weights | 1 |
| `templates/product.json` | PDP block order + section/block settings | 2,3,5,6,7 |
| `blocks/spy-frame-summary.liquid` | FRAME / Ref / Lens summary from `spec.*` (null-hiding) — no stock equivalent | 5 |
| `blocks/spy-rx-button.liquid` | RX link button gated on `spec.available_rx` — no stock equivalent | 5 |
| `blocks/spy-spec-table.liquid` | strip self-`<details>` so it nests inside a stock accordion row | 6 |
| `blocks/spy-trust-badges.liquid` | bordered-box restyle | 4 |
| `blocks/spy-lens-info.liquid` | minor token restyle | 4 |
| `sections/spy-lifestyle-carousel.liquid` | below-fold image carousel from `pdp.feature_carousel` — no stock section reads a product metafield list | 7 |

---

### Task 1: Wire DIN Next LT Pro fonts (Layer 1, global)

**Files:**
- Create: `assets/DINNextLTPro-Light.woff`, `assets/DINNextLTPro-Regular.woff`, `assets/DINNextLTPro-Bold.woff` (copied from `reference/fonts2/`)
- Modify: `src/tailwind.css` (top, after `@theme` block)
- Modify: `snippets/stylesheets.liquid` (add preload links)

**Interfaces:**
- Produces: family `"DINNextLTPro"` at weights 300/400/700; CSS vars `--font-heading--family`, `--font-body--family`, `--font-primary--family` all pointing at the DIN stack (consumed by every later task's typography).

- [ ] **Step 1: Copy the three font files into assets**

Run:
```bash
cp "reference/fonts2/DINNextLTPro-Light.woff"   assets/DINNextLTPro-Light.woff
cp "reference/fonts2/DINNextLTPro-Regular.woff" assets/DINNextLTPro-Regular.woff
cp "reference/fonts2/DINNextLTPro-Bold.woff"    assets/DINNextLTPro-Bold.woff
ls assets/DINNextLTPro-*.woff
```
Expected: three files listed.

- [ ] **Step 2: Add `@font-face` + font-var override to `src/tailwind.css`**

Insert immediately AFTER the closing `}` of the `@theme { … }` block (around line 30) and BEFORE the `@source` lines:

```css
/* ── DIN Next LT Pro (Layer 1 brand font) ─────────────────────────── */
@font-face {
  font-family: "DINNextLTPro";
  src: url("DINNextLTPro-Light.woff") format("woff");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "DINNextLTPro";
  src: url("DINNextLTPro-Regular.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "DINNextLTPro";
  src: url("DINNextLTPro-Bold.woff") format("woff");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Point Horizon's font vars at DIN globally (overrides Barlow; wins because
   this file loads after base.css). New products need no edits. */
:root {
  --font-heading--family: "DINNextLTPro", sans-serif;
  --font-body--family: "DINNextLTPro", sans-serif;
  --font-primary--family: "DINNextLTPro", sans-serif;
}
```
(`url()` is relative — `assets/tailwind.css` and the `.woff` files share the `assets/` CDN folder, so it resolves.)

- [ ] **Step 3: Add font preload to `snippets/stylesheets.liquid`**

Open `snippets/stylesheets.liquid`, and near the top (before the main CSS `<link>`s) add:
```liquid
<link rel="preload" as="font" type="font/woff" href="{{ 'DINNextLTPro-Regular.woff' | asset_url }}" crossorigin>
<link rel="preload" as="font" type="font/woff" href="{{ 'DINNextLTPro-Bold.woff' | asset_url }}" crossorigin>
```

- [ ] **Step 4: Build CSS**

Run: `npm run build:css`
Expected: completes with no error; `assets/tailwind.css` updated (contains `@font-face` with `DINNextLTPro`).

- [ ] **Step 5: Verify in preview**

Run: `shopify theme dev` (or `shopify theme dev --port 9293` if the 9292 token is expired). Open any product page.
Check in DevTools:
- Network → filter "font": `DINNextLTPro-Regular.woff` + `-Bold.woff` load (200).
- Computed style of the `<h1>` / body → `font-family` resolves to `DINNextLTPro`.
- Console: no errors.

- [ ] **Step 6: Commit**

```bash
git add assets/DINNextLTPro-*.woff src/tailwind.css assets/tailwind.css snippets/stylesheets.liquid
git commit -m "feat: wire DIN Next LT Pro as Layer 1 brand font"
```

---

### Task 2: Layout shell — 7/5 grid @769px + sticky gallery + square stage

**Files:**
- Modify: `templates/product.json` — `main` section settings + `_product-details` (`media-gallery`, `product-details`) settings
- Modify: `src/tailwind.css` — scoped grid/sticky overrides

**Interfaces:**
- Consumes: font vars from Task 1.
- Produces: PDP two-column split 58/42 from 769px with the media column pinned; info column no longer sticky.

- [ ] **Step 1: Turn off sticky details + set gap in `templates/product.json`**

In the `product-details` block `settings` (the `_product-details` static block), set:
```json
"sticky_details_desktop": false,
```
In the `main` section `settings`, set:
```json
"gap": 24,
```
(Leave `desktop_media_position: "left"`, `equal_columns: false`.)

- [ ] **Step 2: Add scoped grid + sticky overrides to `src/tailwind.css`**

Add at the end of `src/tailwind.css`:
```css
/* ── PDP layout: 58/42 columns from 769px, pinned gallery ─────────── */
@media (min-width: 769px) {
  [data-testid="product-information"] .product-information__grid.product-information--media-left {
    grid-template-columns: 7fr 5fr;
  }
  /* Pin the shorter gallery; let the info column scroll (source behavior) */
  [data-testid="product-information"] .product-information__media {
    position: sticky;
    top: var(--header-height, 1rem);
    align-self: start;
    height: fit-content;
  }
}
/* Beat Horizon's ≥1200 `2fr 1fr` rule */
@media (min-width: 1200px) {
  [data-testid="product-information"] .product-information__grid.product-information--media-left {
    grid-template-columns: 7fr 5fr;
  }
}
/* Square white stage tint to match source gallery */
[data-testid="product-information"] .product-information__media img {
  background: #fff;
}
```

- [ ] **Step 3: Build CSS**

Run: `npm run build:css`
Expected: no error.

- [ ] **Step 4: Verify layout**

`shopify theme dev`; open the Cyrus/eyewear product.
- At ≥769px width: gallery ≈58%, info ≈42%; measure in DevTools (`.product-information__media` vs `.product-details` widths ~7:5).
- Scroll: the gallery column pins while the info column keeps scrolling; releases at the bottom.
- At <769px: columns stack (gallery above info).
- Console clean.

- [ ] **Step 5: Commit**

```bash
git add templates/product.json src/tailwind.css assets/tailwind.css
git commit -m "style: set PDP 58/42 grid and pin the gallery column"
```

---

### Task 3: Re-order the info column to the source, using stock blocks

**Files:**
- Modify: `templates/product.json` — `product-details` block set + `block_order`

**Interfaces:**
- Consumes: existing custom blocks `spy-breadcrumbs`, `spy-size-chart`, `spy-lens-info`, `spy-trust-badges`, `spy-spec-table`; stock blocks `product-title`(via text h1), `price`, `review`, `product-inventory`, `variant-picker`, `buy-buttons`, `accordion`.
- Produces: the info-column DOM order that Tasks 4–6 style. Custom blocks `spy_frame_summary`, `spy_rx_button` and the `accordion` are added in Tasks 5–6 — this task wires everything that already exists and leaves placeholders in `block_order` only for blocks defined in later tasks (added when those tasks run).

- [ ] **Step 1: Add a `review` (rating) block and `product-inventory` block**

Inside the `product-details` block's `blocks` object, add:
```json
"review_rating": {
  "type": "review",
  "settings": {
    "stars_style": "shaded",
    "width": "fit",
    "show_number": true,
    "rating_color": "golden",
    "type_preset": "paragraph",
    "alignment": "left"
  },
  "blocks": {}
},
"product_inventory_pdp": {
  "type": "product-inventory",
  "settings": {
    "inventory_threshold": 0,
    "show_inventory_quantity": false,
    "padding-block-start": 16,
    "padding-block-end": 8
  },
  "blocks": {}
}
```

- [ ] **Step 2: Remove the two `_divider` blocks and the old flat description/spec/yotpo placement**

Delete blocks `divider_VJhene` and `divider_after_lens` from `blocks`. Leave `text_aEtTtq` (description) and `spy_spec_table_A1` and `spy_yotpo_reviews_A1` defined for now — they get folded into the accordion in Task 6 and the rating moves up here.

- [ ] **Step 3: Set the new `block_order`**

Replace the `product-details` `block_order` array with (blocks added in later tasks are inserted then; this order is the target):
```json
"block_order": [
  "breadcrumbs_pdp",
  "group_icgrde",
  "review_rating",
  "product_inventory_pdp",
  "variant_picker_R3rGDr",
  "spy_size_chart_A1",
  "spy_lens_info_A1",
  "buy_buttons_eYQEYi",
  "spy_trust_badges_A1"
]
```
(`spy_frame_summary` goes after `variant_picker_R3rGDr`, `spy_rx_button` after `buy_buttons_eYQEYi`, and the Description+Tech `accordion` at the end — all inserted in Tasks 5–6.)

- [ ] **Step 4: Validate template JSON**

Run: `shopify theme check templates/product.json`
Expected: no JSON/schema errors (warnings about unknown blocks are OK if any).

- [ ] **Step 5: Verify order in preview**

`shopify theme dev`; confirm the info column renders: breadcrumb → title+price → ★rating → In Stock → swatches → size chart → lens info → ATC → trust box. Console clean.

- [ ] **Step 6: Commit**

```bash
git add templates/product.json
git commit -m "refactor: reorder PDP info column to source layout with stock blocks"
```

---

### Task 4: Restyle stock blocks + custom blocks to the source tokens

**Files:**
- Modify: `src/tailwind.css` — color tokens + swatch/button/title/price overrides
- Modify: `blocks/spy-trust-badges.liquid` — bordered-box layout
- Modify: `blocks/spy-lens-info.liquid` — token colors

**Interfaces:**
- Consumes: DOM from Task 3.
- Produces: swatches 56px w/ `#242424` selected border; square uppercase orange ATC; title/price/inventory in DIN tokens; bordered trust box.

- [ ] **Step 1: Add brand text tokens to `@theme` in `src/tailwind.css`**

Inside the `@theme { … }` block, under `/* Brand colors */`, add:
```css
  --color-spy-text:  #242424;
  --color-spy-text-2:#393939;
  --color-spy-muted: #a6a6a6;
```

- [ ] **Step 2: Add stock-block overrides to `src/tailwind.css`**

Append:
```css
/* ── PDP swatches: 56px photo swatch, dark selected border ────────── */
[data-testid="product-information"] .variant-option--swatches .variant-option__swatch-value {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 2px;
  border: 1px solid var(--color-spy-border);
  background-size: 90%;
  background-position: center;
  background-repeat: no-repeat;
}
[data-testid="product-information"] .variant-option--swatches input:checked + .variant-option__button-label .variant-option__swatch-value,
[data-testid="product-information"] .variant-option--swatches .variant-option__button-label[aria-checked="true"] .variant-option__swatch-value {
  border-width: 2px;
  border-color: var(--color-spy-text);
}

/* ── PDP buttons: square + uppercase ──────────────────────────────── */
[data-testid="product-information"] .button,
[data-testid="product-information"] .add-to-cart-button,
.sticky-add-to-cart__button {
  border-radius: 0;
  text-transform: uppercase;
}

/* ── PDP title / price / inventory in DIN tokens ──────────────────── */
[data-testid="product-information"] .product-title,
[data-testid="product-information"] h1 {
  color: var(--color-spy-text);
  text-transform: uppercase;
  letter-spacing: 0.005em;
}
[data-testid="product-information"] .product-inventory__status {
  color: var(--color-spy-text-2);
}
```

- [ ] **Step 3: Restyle the trust box in `blocks/spy-trust-badges.liquid`**

Change the wrapper (line 12) from:
```liquid
<div class="border border-spy-border rounded-[4px]" {{ block.shopify_attributes }}>
```
to:
```liquid
<div class="border border-spy-border p-3 mt-8 text-[color:var(--color-spy-text-2)]" {{ block.shopify_attributes }}>
```
Change each row (line 21) from:
```liquid
<div class="flex items-center gap-3 px-3.5 py-[11px] border-b border-spy-border last:border-b-0">
```
to:
```liquid
<div class="flex items-center gap-3 py-2 border-b border-spy-border last:border-b-0">
```

- [ ] **Step 4: Token colors in `blocks/spy-lens-info.liquid`**

Replace the two hardcoded `#c0c0c0` inactive-scale colors (lines ~79, 94) with `var(--color-spy-muted)` (`text-[color:var(--color-spy-muted)]`), and leave `bg-spy-orange`/foreground vars as-is.

- [ ] **Step 5: Build CSS**

Run: `npm run build:css`
Expected: no error.

- [ ] **Step 6: Verify**

`shopify theme dev`:
- ATC: orange, square corners, uppercase label.
- Swatches (if a product has `variant.swatch` images): 56px, 1px light border, selected has 2px dark border. (Staging data may be empty — then confirm no layout break.)
- Title uppercase in DIN; trust box is a single bordered box with hr-style row dividers.
- Console clean.

- [ ] **Step 7: Commit**

```bash
git add src/tailwind.css assets/tailwind.css blocks/spy-trust-badges.liquid blocks/spy-lens-info.liquid
git commit -m "style: match PDP swatches, buttons, title and trust box to source"
```

---

### Task 5: Frame/Ref/Lens summary + RX button (justified custom blocks)

**Files:**
- Create: `blocks/spy-frame-summary.liquid`
- Create: `blocks/spy-rx-button.liquid`
- Modify: `templates/product.json` — add both blocks + slot into `block_order`

**Interfaces:**
- Consumes: `closest.product.metafields.spec.frame_color/reference/lens_name/available_rx`.
- Produces: blocks `spy_frame_summary` (after swatches) and `spy_rx_button` (after ATC).

- [ ] **Step 1: Create `blocks/spy-frame-summary.liquid`**

```liquid
{%- liquid
  assign p = closest.product
  assign frame = p.metafields.spec.frame_color.value
  assign ref   = p.metafields.spec.reference.value
  assign lens  = p.metafields.spec.lens_name.value
  assign has_any = false
  if frame != blank or ref != blank or lens != blank
    assign has_any = true
  endif
-%}
{%- if has_any -%}
<div class="pt-3 pb-1 text-[13px] leading-[1.5]" {{ block.shopify_attributes }}>
  {%- if frame != blank -%}
    <div><span class="font-bold uppercase tracking-[0.06em] text-[color:var(--color-spy-text)]">Frame:</span> <span class="text-[color:var(--color-spy-text-2)]">{{ frame }}</span></div>
  {%- endif -%}
  {%- if lens != blank -%}
    <div><span class="font-bold uppercase tracking-[0.06em] text-[color:var(--color-spy-text)]">Lens:</span> <span class="text-[color:var(--color-spy-text-2)]">{{ lens }}</span></div>
  {%- endif -%}
  {%- if ref != blank -%}
    <div class="text-[color:var(--color-spy-muted)] mt-1">Ref {{ ref }}</div>
  {%- endif -%}
</div>
{%- endif -%}

{% schema %}
{
  "name": "Frame Summary",
  "tag": null,
  "settings": [],
  "presets": [{ "name": "Frame Summary", "category": "SPY" }]
}
{% endschema %}
```

- [ ] **Step 2: Create `blocks/spy-rx-button.liquid`**

```liquid
{%- liquid
  assign p = closest.product
  assign rx = p.metafields.spec.available_rx.value
-%}
{%- if rx -%}
<a
  href="{{ block.settings.rx_url | default: 'https://www.sportrx.com' }}"
  class="flex items-center justify-center w-full py-3 mt-2 border border-spy-orange text-spy-orange uppercase font-bold text-[0.8125rem] tracking-[0.06em] no-underline hover:bg-spy-orange hover:text-white transition-colors"
  {% if block.settings.open_new_tab %}target="_blank" rel="noopener"{% endif %}
  {{ block.shopify_attributes }}
>
  {{ block.settings.label | default: 'Buy in Prescription' }}
</a>
{%- endif -%}

{% schema %}
{
  "name": "RX Button",
  "tag": null,
  "settings": [
    { "type": "text", "id": "label", "label": "Label", "default": "Buy in Prescription" },
    { "type": "url", "id": "rx_url", "label": "RX partner URL" },
    { "type": "checkbox", "id": "open_new_tab", "label": "Open in new tab", "default": true }
  ],
  "presets": [{ "name": "RX Button", "category": "SPY" }]
}
{% endschema %}
```

- [ ] **Step 3: Register both blocks in `templates/product.json`**

Add to the `product-details` `blocks` object:
```json
"spy_frame_summary": { "type": "spy-frame-summary", "settings": {} },
"spy_rx_button": { "type": "spy-rx-button", "settings": { "label": "Buy in Prescription", "open_new_tab": true } }
```
Update `block_order` to insert them:
```json
"block_order": [
  "breadcrumbs_pdp",
  "group_icgrde",
  "review_rating",
  "product_inventory_pdp",
  "variant_picker_R3rGDr",
  "spy_frame_summary",
  "spy_size_chart_A1",
  "spy_lens_info_A1",
  "buy_buttons_eYQEYi",
  "spy_rx_button",
  "spy_trust_badges_A1"
]
```

- [ ] **Step 4: Validate + build**

Run: `shopify theme check blocks/spy-frame-summary.liquid blocks/spy-rx-button.liquid templates/product.json`
Then: `npm run build:css`
Expected: no errors.

- [ ] **Step 5: Verify**

`shopify theme dev`:
- Frame/Lens/Ref summary shows under the swatches for a product with those `spec.*` values; hides cleanly when blank.
- RX button appears only when `spec.available_rx = true`; hidden otherwise; links out.
- Console clean.

- [ ] **Step 6: Commit**

```bash
git add blocks/spy-frame-summary.liquid blocks/spy-rx-button.liquid templates/product.json
git commit -m "feat: add PDP frame/ref/lens summary and RX link button"
```

---

### Task 6: Description + Technical Information accordions

**Files:**
- Modify: `blocks/spy-spec-table.liquid` — drop the self `<details>`/`<summary>`, render just the table
- Modify: `templates/product.json` — one stock `accordion` with two `_accordion-row`s (Description + Technical Information); remove the old flat `text_aEtTtq`, standalone `spy_spec_table_A1`, and move `spy_yotpo_reviews_A1` below the accordion
- Modify: `src/tailwind.css` — accordion header restyle (label-l uppercase)

**Interfaces:**
- Consumes: `spy-spec-table` block; stock `accordion` + `_accordion-row` (accepts `@theme` children — verified).
- Produces: two uniform accordion panels with caret rotation.

- [ ] **Step 1: Strip the self-accordion from `blocks/spy-spec-table.liquid`**

Replace the opening wrapper (lines ~18–24):
```liquid
<details class="group border-t …" {{ block.shopify_attributes }}>
  <summary class="…">{{ block.settings.heading }}<span …>+/−</span></summary>
  <table class="w-full border-collapse text-[13px] pb-4 …">
    <tbody>
```
with:
```liquid
<div {{ block.shopify_attributes }}>
  <table class="w-full border-collapse text-[13px] py-1 [&_tr]:border-t [&_tr]:border-solid [&_tr]:border-t-[color:var(--color-spy-border)] [&_th]:text-left [&_th]:py-2 [&_th]:pr-3 [&_th]:pl-0 [&_th]:font-semibold [&_th]:w-[45%] [&_th]:align-top [&_th]:text-[color:var(--color-spy-text-2)] [&_td]:py-2 [&_td]:align-top [&_td]:text-[color:var(--color-spy-text)]">
    <tbody>
```
Replace the closing (lines ~160–161):
```liquid
    </tbody>
  </table>
</details>
```
with:
```liquid
    </tbody>
  </table>
</div>
```
(Keep the whole metafield-row body unchanged. The `heading` setting is now unused — harmless.)

- [ ] **Step 2: Build the accordion in `templates/product.json`**

Add to the `product-details` `blocks` object:
```json
"accordion_pdp": {
  "type": "accordion",
  "settings": {
    "icon": "caret",
    "dividers": true,
    "type_preset": "h6",
    "divider_color": "{{ settings.color_palette.color2 }}"
  },
  "blocks": {
    "acc_row_description": {
      "type": "_accordion-row",
      "settings": { "heading": "Description", "open_by_default": true, "icon": "none" },
      "blocks": {
        "desc_text": {
          "type": "text",
          "settings": {
            "text": "{{ closest.product.metafields.pdp.long_description.value | default: closest.product.description }}",
            "type_preset": "rte",
            "width": "100%",
            "alignment": "left"
          }
        }
      },
      "block_order": ["desc_text"]
    },
    "acc_row_tech": {
      "type": "_accordion-row",
      "settings": { "heading": "Technical Information", "open_by_default": false, "icon": "none" },
      "blocks": {
        "tech_spec": { "type": "spy-spec-table", "settings": { "heading": "Technical Information" } }
      },
      "block_order": ["tech_spec"]
    }
  },
  "block_order": ["acc_row_description", "acc_row_tech"]
}
```
Remove `text_aEtTtq` and `spy_spec_table_A1` from `blocks`. Update the `product-details` `block_order` to end with the accordion:
```json
"block_order": [
  "breadcrumbs_pdp",
  "group_icgrde",
  "review_rating",
  "product_inventory_pdp",
  "variant_picker_R3rGDr",
  "spy_frame_summary",
  "spy_size_chart_A1",
  "spy_lens_info_A1",
  "buy_buttons_eYQEYi",
  "spy_rx_button",
  "spy_trust_badges_A1",
  "accordion_pdp"
]
```
Move `spy_yotpo_reviews_A1` out of `product-details` into the section-level order below `main` (full-width reviews), or delete if the reserved rating in Task 3 is enough. Keep it below `main` for the full widget:
```json
"order": ["main", "spy_yotpo_reviews_full", "spy_feature_banner_A1", "product_recommendations_qggXJq"]
```
and add a section `"spy_yotpo_reviews_full": { "type": "...reviews section..." }` only if a reviews SECTION exists; otherwise leave the reserved block in `product-details` at the very bottom after `accordion_pdp`.

- [ ] **Step 3: Accordion header restyle in `src/tailwind.css`**

Append:
```css
/* ── PDP accordion headers: label-l (bold uppercase) ──────────────── */
[data-testid="product-information"] .accordion .details__header {
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding-block: 1.25rem;
  color: var(--color-spy-text);
}
```

- [ ] **Step 4: Validate + build**

Run: `shopify theme check templates/product.json blocks/spy-spec-table.liquid`
Then: `npm run build:css`
Expected: no errors.

- [ ] **Step 5: Verify**

`shopify theme dev`:
- Two accordion panels at the bottom of the info column: "Description" (open) and "Technical Information" (closed), identical bold-uppercase headers with a caret that rotates on toggle.
- Technical Information shows only populated `spec.*` rows; empty rows hidden; no `goggle.*`/`helmet.*` rows on this template.
- Console clean.

- [ ] **Step 6: Commit**

```bash
git add blocks/spy-spec-table.liquid templates/product.json src/tailwind.css assets/tailwind.css
git commit -m "feat: fold PDP description and tech info into stock accordions"
```

---

### Task 7: Below-fold lifestyle image carousel

**Files:**
- Create: `sections/spy-lifestyle-carousel.liquid` (reads `pdp.feature_carousel`; CSS scroll-snap, no JS library)
- Modify: `templates/product.json` — add the section above `spy_feature_banner_A1`

**Interfaces:**
- Consumes: `closest.product`? No — sections use `product` global on a product template. Reads `product.metafields.pdp.feature_carousel.value` (list of files).
- Produces: section `spy_lifestyle_carousel`. (Custom because no stock section reads a product metafield list — required by "new product fills PDP with zero edits".)

- [ ] **Step 1: Create `sections/spy-lifestyle-carousel.liquid`**

```liquid
{%- liquid
  assign imgs = product.metafields.pdp.feature_carousel.value
-%}
{%- if imgs != blank and imgs.size > 0 -%}
<div class="my-8" data-spy-lifestyle {{ section.shopify_attributes }}>
  <div class="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {%- for img in imgs -%}
      <div class="snap-start shrink-0 basis-[80%] md:basis-1/3 xl:basis-1/4">
        <img
          src="{{ img | image_url: width: 900 }}"
          alt="{{ img.alt | default: product.title | escape }}"
          width="900" height="900" loading="lazy"
          class="w-full h-auto aspect-square object-cover bg-white"
        >
      </div>
    {%- endfor -%}
  </div>
</div>
{%- endif -%}

{% schema %}
{
  "name": "SPY Lifestyle Carousel",
  "settings": [],
  "presets": [{ "name": "SPY Lifestyle Carousel" }]
}
{% endschema %}
```

- [ ] **Step 2: Add the section to `templates/product.json`**

Add to `sections`:
```json
"spy_lifestyle_carousel": { "type": "spy-lifestyle-carousel", "settings": {} }
```
Update `order` so it sits above the feature banner:
```json
"order": ["main", "spy_lifestyle_carousel", "spy_feature_banner_A1", "product_recommendations_qggXJq"]
```

- [ ] **Step 3: Validate + build**

Run: `shopify theme check sections/spy-lifestyle-carousel.liquid templates/product.json`
Then: `npm run build:css`
Expected: no errors.

- [ ] **Step 4: Verify**

`shopify theme dev`:
- If the product has `pdp.feature_carousel` images: a horizontal scroll-snap strip shows ~1.2 images on mobile, 3 at ≥768, 4 at ≥1200, square, white bg.
- If empty: section renders nothing (no gap).
- Console clean.

- [ ] **Step 5: Commit**

```bash
git add sections/spy-lifestyle-carousel.liquid templates/product.json
git commit -m "feat: add metafield-driven PDP lifestyle carousel section"
```

---

### Task 8: Full verification pass (Definition of Done)

**Files:** none (verification + fixes only).

- [ ] **Step 1: Rebuild + theme-check the whole theme**

Run: `npm run build:css && shopify theme check`
Expected: no new errors.

- [ ] **Step 2: Desktop 1440 side-by-side**

`shopify theme dev`; open the eyewear product at 1440.
Compare to `reference/design-PDP-sample` screenshots: module order, 58/42 split, title/price/rating/stock, swatch size, ATC, trust box, accordions, feature banner, recommendations. Note any pixel gaps; fix in the owning block/CSS.

- [ ] **Step 3: Tablet 768 + mobile 390 (DevTools device emulation)**

Confirm: columns stack below 769; ATC sticky bar appears on scroll; accordions usable; carousel scrolls; no horizontal overflow. Fix issues.

- [ ] **Step 4: Console + a11y**

Console clean on load and on variant change. Check headings order, alt text, focus states on swatches/accordion/ATC (WCAG 2.1 AA).

- [ ] **Step 5: Metafield null-hiding sanity**

On a sparse staging product, confirm the PDP still renders correctly (no empty labels, no broken layout).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "style: final PDP fidelity fixes across breakpoints"
```
(Then hand off to the user to push to Staging v2.)

---

## Self-Review

**Spec coverage:** layout/grid/sticky → T2; info-column order + stock blocks → T3; typography (DIN) → T1; colors/swatches/buttons/trust → T4; frame summary + RX → T5; description + tech accordions → T6; lifestyle carousel + feature banner + recommendations → T7 (banner/recs already in template); full 1440/768/390 verification + DoD → T8. All §-covered.

**Deviation flagged:** the below-fold lifestyle carousel is a small CUSTOM section (T7), not the "stock slideshow" named at approval — a stock slideshow cannot read the `pdp.feature_carousel` product metafield, and rule 3 requires per-product data to be metafield-driven. Kept minimal (CSS scroll-snap, no JS library). **Confirm at handoff.**

**Placeholder scan:** none — every step has concrete code/config/commands.

**Type/name consistency:** block/section types (`spy-frame-summary`, `spy-rx-button`, `spy-lifestyle-carousel`), block ids (`review_rating`, `product_inventory_pdp`, `spy_frame_summary`, `spy_rx_button`, `accordion_pdp`, `acc_row_description`, `acc_row_tech`) and `block_order` arrays are consistent across T3/T5/T6/T7. Selectors (`.variant-option--swatches .variant-option__swatch-value`, `.accordion .details__header`, `.product-information__grid.product-information--media-left`) match the read source files.

**Open verification risk:** the swatch selected-state selector (`input:checked + .variant-option__button-label …` vs `[aria-checked]`) — both candidates included in T4; confirm the live one during T4 Step 6 and drop the unused one.
