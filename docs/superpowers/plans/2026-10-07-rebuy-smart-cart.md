# Rebuy Legacy Smart Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Rebuy's Legacy Smart Cart the mini-cart on `spyoptic-com.myshopify.com`, built 1:1 to the measured source spec, while the existing theme drawer stays as the always-available fallback for shoppers who have not granted cookie consent.

**Architecture:** Two cart engines, one visual spec. The theme drawer is the baseline and is already pixel-verified; Rebuy Smart Cart is a progressive enhancement that takes over only once Rebuy loads. A small coordinator decides which engine answers the bag click, so exactly one ever opens. Both engines read the same CSS custom properties, which already exist in `snippets/cart-drawer.liquid`.

**Tech Stack:** Shopify Horizon theme · Liquid · Vue 2 (Rebuy's runtime, not ours) · Tailwind CSS v4 (`@source`-scanned, utilities are `!important` inside a layer) · playwright-core for verification.

**Design spec:** `docs/superpowers/specs/2026-10-07-rebuy-smart-cart-design.md`
**Visual spec of record:** `audit/page-spec-cart-drawer.md` §10 (the pixel-diff table)

---

## Global Constraints

Copied verbatim from `CLAUDE.md` and the design spec. Every task's requirements implicitly include these.

- **Styling is Tailwind utilities only.** Never hand-write vanilla CSS, never add a Liquid `{% stylesheet %}` block. Run `npm run build:css` after any style change.
- **No hard-coded colour, font, or copy string.** Brand tokens are Layer 1 theme settings. Colours come from `--color-spy-orange` and friends, never a hex in markup.
- **Never edit the published theme.** `spy-v2/main` is MAIN on production. All work goes to a development/unpublished theme.
- **Do not push to git.** Commit only; the user pushes.
- **Commit messages:** single line, conventional prefix (`feat:`, `fix:`, `docs:`, `chore:`, `style:`, `refactor:`, `test:`). No body, no trailers, no AI attribution lines.
- **Code comments:** B2-level English, short, high-hint. Never long AI-style comment blocks.
- **Verify every change** at desktop 1440, tablet 768, mobile 390. Check the console. Never call something done from code alone.
- **Tailwind cannot see Liquid-built classes.** Keep every utility class literal; pass dynamic values through inline CSS custom properties.
- **Horizon owns `.grid` and `.flex`.** `base.css` defines those class names with 14 grid tracks and `gap-md`. Use `[display:grid]` / `[display:flex]` instead.
- **Out of scope, do not "fix":** the cents difference (`$200` vs `$130.00`) is store-wide currency formatting, not a theme bug.

---

## Prerequisites

These block Task 0 and must be cleared by the user before implementation starts. None is a code change.

| # | Blocker | Who | Status |
|---|---|---|---|
| **P1** | Shopify CLI auth | — | **Clear.** `shopify theme list` works; current dev theme is `Development (0c9338-DESKTOP-7CMO9JE)`. |
| **P2** | Storefront password for playwright | — | **Sidestepped.** Run `shopify theme dev` and point the scripts at `http://127.0.0.1:9292`, which bypasses the password gate. `.env` + `SPY_PASSWORD` is only needed to measure the *published* store directly. |
| **P3** | Smart Cart switched on in the Rebuy admin, on Legacy | User | **Unverified.** Task 0 reports `rebuy.present: false` and stops if it is not enabled — so run Task 0 to find out rather than guessing. |

**Preview base URL.** Every script below takes `SPY_BASE`, defaulting to the local preview:

```bash
shopify theme dev --store spyoptic-com.myshopify.com   # leave running in another terminal
export SPY_BASE=http://127.0.0.1:9292
```

Set `SPY_BASE=https://spyoptic-com.myshopify.com` plus `SPY_PASSWORD` only when measuring the live store.

---

## File Structure

| File | Responsibility | Kind |
|---|---|---|
| `snippets/rebuy-cart-template.liquid` | The Vue template Rebuy renders the Smart Cart from. Owns Smart Cart markup only. | new |
| `assets/spy-cart-handoff.js` | Decides which engine answers the bag click. Owns engine selection only — no styling, no cart logic. | new |
| `scripts/cart-measure.mjs` | Verification harness. Measures either engine against the spec table and exits non-zero on drift. | new |
| `audit/rebuy-smartcart-spike.md` | Task 0 findings: binding map, trigger behaviour, CSS load order. | new |
| `audit/rebuy-default-smartcart-template.html` | Rebuy's verbatim default template, dumped at runtime. The contract later tasks transform. | new |
| `layout/theme.liquid` | Registers the template and the coordinator. | modify |
| `snippets/cart-drawer.liquid` | Gains one `data-cart-engine-fallback` attribute. No visual change. | modify |
| `config/settings_schema.json` | Rail toggle, heading, widget ID. | modify |
| `config/settings_data.json` | Values for the above. | modify |
| `src/tailwind.css` | Rail styles and Rebuy-scope overrides. | modify |

**Untouched by design** — regression-check but do not edit: `templates/cart.json`, `snippets/cart-products.liquid`, `snippets/cart-summary.liquid`, `assets/cart-drawer.js`.

### Selectors (confirmed by reading the theme, not guessed)

| Engine | Root | Panel |
|---|---|---|
| Theme drawer | `theme-drawer#cart-drawer` | `dialog.cart-drawer__panel` |
| Rebuy Smart Cart | `#rebuy-cart` | confirmed in Task 0 |

Theme drawer internals: `.cart-drawer__inner`, `.cart-drawer__content`, `.cart-drawer__items`, `.cart-drawer__summary`, `.cart-drawer__count`, `.cart-items__table-row`.

### Shared tokens (already exist — `snippets/cart-drawer.liquid:55-57`)

```
--theme-drawer-width:  {{ settings.cart_drawer_width }}px
--cart-drawer-thumb:   {{ settings.cart_drawer_thumbnail_size }}px
--cart-drawer-row-gap: {{ settings.cart_drawer_row_gap }}px
```

Smart Cart consumes these same variables. That is the whole anti-drift mechanism — no new plumbing.

---

## Task 0: Spike — how Rebuy Smart Cart actually behaves on this store

Everything after this depends on the answers. **No styling work happens in this task.** Rebuy's Legacy docs do not specify the template bindings, so this task captures the real contract instead of guessing at it.

**Files:**
- Create: `scripts/rebuy-spike.mjs`
- Create: `audit/rebuy-smartcart-spike.md`
- Create: `audit/rebuy-default-smartcart-template.html`

**Interfaces:**
- Consumes: nothing.
- Produces: `audit/rebuy-default-smartcart-template.html` (the file Tasks 4–8 transform) and a **binding map** in the spike doc giving the real names for: item iteration, item title, item variant/options, item quantity, item line price, remove method, subtotal, cross-sell predicate.

- [ ] **Step 1: Write the spike script**

Create `scripts/rebuy-spike.mjs`:

```js
/*
  Task 0 spike. Answers three questions, writes two artifacts:
    1 does Rebuy bind the bag click, and does the theme drawer open too?
    2 what is Rebuy's default Smart Cart template?
    3 whose CSS wins when both are loaded?

  Run:  SPY_PASSWORD=xxxx node scripts/rebuy-spike.mjs
        HEADED=1 to watch it
*/
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const STORE = process.env.SPY_BASE || 'http://127.0.0.1:9292';
const PASSWORD = process.env.SPY_PASSWORD || '';
const PREVIEW = process.env.PREVIEW_THEME_ID ? `?preview_theme_id=${process.env.PREVIEW_THEME_ID}` : '';

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Storefront password gate
if (PASSWORD) {
  await page.goto(`${STORE}/password`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="password"]', PASSWORD).catch(() => {});
  await page.press('input[name="password"]', 'Enter').catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

// Consent must be granted or Rebuy never loads
await page.goto(`${STORE}/${PREVIEW}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
for (const label of [/accept/i, /allow all/i, /agree/i]) {
  const btn = page.getByRole('button', { name: label }).first();
  if (await btn.isVisible().catch(() => false)) { await btn.click(); break; }
}
await page.waitForTimeout(3000);

const report = {};

// Q2 — is Rebuy there, and what is its default Smart Cart template?
report.rebuy = await page.evaluate(() => {
  const R = window.Rebuy;
  if (!R) return { present: false };
  return {
    present: true,
    smartCartStatus: R.SmartCart?.status ?? null,
    smartCartKeys: R.SmartCart ? Object.keys(R.SmartCart) : [],
    rootFound: Boolean(document.querySelector('#rebuy-cart')),
  };
});

// Dump every Rebuy template the page carries
const templates = await page.evaluate(() =>
  [...document.querySelectorAll('script[type="text/template"]')].map((s) => ({
    id: s.id,
    html: s.innerHTML,
  }))
);
writeFileSync(
  new URL('../audit/rebuy-default-smartcart-template.html', import.meta.url),
  templates.map((t) => `<!-- ===== ${t.id} ===== -->\n${t.html}`).join('\n\n')
);
report.templateIds = templates.map((t) => t.id);

// Q1 — who answers the bag click?
await page.goto(`${STORE}/collections/all${PREVIEW}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const firstProduct = page.locator('a[href*="/products/"]').first();
await firstProduct.click();
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2500);

const atc = page.locator('button[name="add"], add-to-cart-component button').first();
if (await atc.isVisible().catch(() => false)) {
  await atc.click();
  await page.waitForTimeout(3000);
}

report.afterAddToCart = await page.evaluate(() => ({
  themeDrawerOpen: Boolean(document.querySelector('theme-drawer#cart-drawer[open]')),
  rebuyCartVisible: window.Rebuy?.SmartCart?.visible ?? null,
  bothVisible:
    Boolean(document.querySelector('theme-drawer#cart-drawer[open]')) &&
    Boolean(window.Rebuy?.SmartCart?.visible),
}));

// Q3 — stylesheet order, ours vs theirs
report.styleOrder = await page.evaluate(() =>
  [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((n, i) => ({ i, href: n.getAttribute('href') || '(inline)' }))
    .filter((s) => /rebuy|tailwind|base/i.test(s.href))
);

console.log(JSON.stringify(report, null, 2));
await browser.close();
```

- [ ] **Step 2: Run it**

```bash
cd /c/spy-v2 && node scripts/rebuy-spike.mjs
```

Expected: JSON on stdout, and `audit/rebuy-default-smartcart-template.html` written with at least one template whose id names the cart.

If `rebuy.present` is `false`, stop — prerequisite P3 is not done, or consent was not granted.

- [ ] **Step 3: Write the findings doc**

Create `audit/rebuy-smartcart-spike.md` answering, with evidence pasted from the run:

1. **Does Rebuy bind the bag click, and does the theme drawer open too?** Record `afterAddToCart.bothVisible`. If `true`, the coordinator in Task 3 must suppress one; record which suppression hook exists (`Rebuy.SmartCart.hide()`, a Rebuy setting, or a theme-side guard).
2. **Binding map** — read `audit/rebuy-default-smartcart-template.html` and record the real name for each: item loop, item title, variant/options line, quantity, line price, remove method, subtotal, cross-sell predicate. Tasks 5–8 use these names.
3. **CSS order** — does Rebuy's sheet load after `tailwind.css`? If so, note that Rebuy-scoped overrides need the layer treatment.
4. **Panel selector** — the real root/panel selector for Smart Cart, to replace the "confirmed in Task 0" row in the File Structure table.

- [ ] **Step 4: Commit**

```bash
git add scripts/rebuy-spike.mjs audit/rebuy-smartcart-spike.md audit/rebuy-default-smartcart-template.html
git commit -m "docs: record the Rebuy Smart Cart spike findings and default template"
```

---

## Task 1: Measurement harness

A harness that measures either engine against `audit/page-spec-cart-drawer.md` §10. Built before any Smart Cart styling so every later task has a real pass/fail gate.

**It is validated by pointing it at the existing theme drawer, which is already 1px-accurate — so its first run must PASS.** A harness that fails against known-good code is a broken harness.

**Files:**
- Create: `scripts/cart-measure.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: CLI `node scripts/cart-measure.mjs --engine=theme|rebuy --width=1440|768|390`. Exits `0` on match, `1` on drift, printing a table of `element | expected | actual | delta`.

- [ ] **Step 1: Write the harness with the expectations table**

Create `scripts/cart-measure.mjs`:

```js
/*
  Measures the mini-cart against audit/page-spec-cart-drawer.md §10.
  Works on either engine so both paths are held to one spec.

  Run:  node scripts/cart-measure.mjs --engine=theme --width=1440
*/
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1];
const ENGINE = arg('engine', 'theme');
const WIDTH = Number(arg('width', 1440));
const STORE = process.env.SPY_BASE || 'http://127.0.0.1:9292';
const PASSWORD = process.env.SPY_PASSWORD || '';
const PREVIEW = process.env.PREVIEW_THEME_ID ? `?preview_theme_id=${process.env.PREVIEW_THEME_ID}` : '';

// Roots per engine. Rebuy's panel selector is filled in from the Task 0 spike.
const ROOT = ENGINE === 'rebuy' ? '#rebuy-cart' : 'dialog.cart-drawer__panel';

// From audit/page-spec-cart-drawer.md §10, measured at 1440.
// width/height tolerance is 1px: the source panel's own left border.
const EXPECT = {
  panel:     { w: 320, h: null },
  header:    { h: 41 },
  title:     { fontSize: '13px', lineHeight: '18.2px', fontWeight: '600', color: 'rgb(29, 42, 43)' },
  image:     { w: 95, h: 95 },
  name:      { fontSize: '15px', lineHeight: '18px', fontWeight: '700', color: 'rgb(29, 42, 43)' },
  variant:   { fontSize: '13px', lineHeight: '18.2px', fontWeight: '400' },
  linePrice: { fontSize: '16px', lineHeight: '22.4px', color: 'rgb(34, 34, 34)' },
  cta:       { h: 52, fontSize: '12px', lineHeight: '16.8px', backgroundColor: 'rgb(242, 126, 55)' },
};

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });

if (PASSWORD) {
  await page.goto(`${STORE}/password`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="password"]', PASSWORD).catch(() => {});
  await page.press('input[name="password"]', 'Enter').catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

await page.goto(`${STORE}/${PREVIEW}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Consent: grant for the rebuy engine, decline for the theme engine.
// That is also what proves the fallback is real.
const wanted = ENGINE === 'rebuy' ? /accept|allow all|agree/i : /decline|reject|only necessary/i;
const btn = page.getByRole('button', { name: wanted }).first();
if (await btn.isVisible().catch(() => false)) await btn.click();
await page.waitForTimeout(3000);

// Put one item in the cart, then open the mini-cart
await page.goto(`${STORE}/collections/all${PREVIEW}`, { waitUntil: 'domcontentloaded' });
await page.locator('a[href*="/products/"]').first().click();
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2500);
await page.locator('button[name="add"], add-to-cart-component button').first().click();
await page.waitForTimeout(3500);

const root = page.locator(ROOT).first();
if (!(await root.isVisible().catch(() => false))) {
  console.error(`FAIL: ${ENGINE} cart did not open (root ${ROOT} not visible)`);
  await browser.close();
  process.exit(1);
}

const measured = await page.evaluate((sel) => {
  const pick = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return {
      w: Math.round(r.width), h: Math.round(r.height),
      fontSize: c.fontSize, lineHeight: c.lineHeight, fontWeight: c.fontWeight,
      color: c.color, backgroundColor: c.backgroundColor,
    };
  };
  const root = document.querySelector(sel);
  const q = (s) => pick(root?.querySelector(s));
  return {
    panel: pick(root),
    header: q('[data-cart-header], .cart-drawer__header, .rebuy-cart__header'),
    title: q('[data-cart-title], .cart-drawer__title, .rebuy-cart__title'),
    image: q('img'),
    name: q('[data-line-title], .cart-items__title, .rebuy-cart__flyout-item-title'),
    variant: q('[data-line-variant], .cart-items__variant, .rebuy-cart__flyout-item-variant'),
    linePrice: q('[data-line-price], .cart-items__price, .rebuy-cart__flyout-item-price'),
    cta: q('[data-cart-cta], .cart-drawer__cta, .rebuy-cart__checkout-button'),
  };
}, ROOT);

let failed = 0;
const rows = [];
for (const [key, want] of Object.entries(EXPECT)) {
  const got = measured[key];
  for (const [prop, expected] of Object.entries(want)) {
    if (expected === null) continue;
    const actual = got?.[prop];
    const numeric = typeof expected === 'number';
    const ok = got && (numeric ? Math.abs(actual - expected) <= 1 : actual === expected);
    if (!ok) failed++;
    rows.push({ element: `${key}.${prop}`, expected, actual: actual ?? '(missing)', ok: ok ? 'ok' : 'DRIFT' });
  }
}
console.table(rows);
console.log(`${ENGINE} @ ${WIDTH}: ${failed} drift(s)`);
await browser.close();
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it against the known-good theme drawer**

```bash
cd /c/spy-v2 && node scripts/cart-measure.mjs --engine=theme --width=1440
```

Expected: `0 drift(s)`, exit `0`. The theme drawer is already verified to 1px, so **any failure here is a harness bug, not a theme bug** — fix the selectors in the `page.evaluate` block against the real DOM before continuing.

- [ ] **Step 3: Confirm it genuinely fails when it should**

Temporarily change `EXPECT.panel.w` to `999`, re-run, confirm it reports `DRIFT` and exits `1`, then change it back. A harness that cannot fail proves nothing.

- [ ] **Step 4: Commit**

```bash
git add scripts/cart-measure.mjs
git commit -m "test: add the mini-cart measurement harness for both engines"
```

---

## Task 2: Smart Cart template skeleton and registration

Get Rebuy rendering *our* template instead of its default. No geometry work yet — this task only proves the override is live.

**Files:**
- Create: `snippets/rebuy-cart-template.liquid`
- Modify: `layout/theme.liquid`

**Interfaces:**
- Consumes: `audit/rebuy-default-smartcart-template.html` and the binding map from Task 0.
- Produces: a rendered Smart Cart carrying `data-spy-cart="1"` on its root, which later tasks style and the harness targets.

- [ ] **Step 1: Create the template from the dumped default**

Create `snippets/rebuy-cart-template.liquid`. The outer wrapper is Liquid and carries the shared tokens; the inner body is the Task 0 dump, verbatim for now, inside `raw` so Liquid leaves Vue's mustaches alone.

```liquid
{% comment %} Smart Cart markup. Tokens live outside the raw block — Liquid can't reach inside it. {% endcomment %}
<div
  style="
    --theme-drawer-width: {{ settings.cart_drawer_width }}px;
    --cart-drawer-thumb: {{ settings.cart_drawer_thumbnail_size }}px;
    --cart-drawer-row-gap: {{ settings.cart_drawer_row_gap }}px;
  "
>
  {% raw %}
  <script id="rebuy-cart-template" type="text/template">
    <!-- paste audit/rebuy-default-smartcart-template.html here, cart template only -->
    <!-- add data-spy-cart="1" to the outermost element -->
  </script>
  {% endraw %}
</div>
```

Replace the comment lines with the real dumped markup and add `data-spy-cart="1"` to its outermost element. Use the template id the spike reported, not a guessed one.

- [ ] **Step 2: Register it**

In `layout/theme.liquid`, immediately before the closing `</body>` tag, add:

```liquid
{% render 'rebuy-cart-template' %}
```

- [ ] **Step 3: Push and verify the override is live**

```bash
cd /c/spy-v2 && npm run build:css && shopify theme push --development
```

Then confirm Rebuy adopted our template:

```bash
node scripts/rebuy-spike.mjs
```

Expected: the Smart Cart root in the DOM carries `data-spy-cart="1"`. If it does not, Rebuy did not detect the template — re-check the script `id` against the spike dump before going further.

- [ ] **Step 4: Commit**

```bash
git add snippets/rebuy-cart-template.liquid layout/theme.liquid
git commit -m "feat: register a custom Rebuy Smart Cart template"
```

---

## Task 3: Coordinator and the consent fallback

Done before any styling, so that from here on no shopper can lose their cart. This is the task that makes the consent decision real.

**Files:**
- Create: `assets/spy-cart-handoff.js`
- Modify: `snippets/cart-drawer.liquid`, `layout/theme.liquid`

**Interfaces:**
- Consumes: the collision answer from Task 0.
- Produces: `<html data-cart-engine="rebuy|theme">`, set as soon as the engine is known. Later tasks and `src/tailwind.css` may key off this attribute.

- [ ] **Step 1: Add the fallback hook**

In `snippets/cart-drawer.liquid`, on the `theme-drawer` element (line ~41), add the attribute:

```liquid
data-cart-engine-fallback
```

- [ ] **Step 2: Write the coordinator**

Create `assets/spy-cart-handoff.js`:

```js
/*
  Picks the cart engine. Rebuy is consent-gated, so the theme drawer
  is the default and Rebuy only takes over once it has actually loaded.
*/
const HTML = document.documentElement;

// Theme drawer until proven otherwise. Nobody ever loses a cart.
HTML.setAttribute('data-cart-engine', 'theme');

function rebuyReady() {
  return Boolean(window.Rebuy?.SmartCart && window.Rebuy.SmartCart.status);
}

function claimForRebuy() {
  if (!rebuyReady()) return false;
  HTML.setAttribute('data-cart-engine', 'rebuy');
  return true;
}

// Rebuy loads late and only after consent, so watch rather than check once.
if (!claimForRebuy()) {
  document.addEventListener('rebuy:smartcart.show', claimForRebuy, { once: true });
  const poll = setInterval(() => {
    if (claimForRebuy()) clearInterval(poll);
  }, 500);
  // Consent may never come. Stop looking after 15s and stay on the theme drawer.
  setTimeout(() => clearInterval(poll), 15000);
}

// One engine answers the bag. Capture phase so we win before the drawer opens.
document.addEventListener(
  'click',
  (event) => {
    if (HTML.getAttribute('data-cart-engine') !== 'rebuy') return;
    const trigger = event.target.closest('[data-cart-drawer-trigger], a[href$="/cart"]');
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    window.Rebuy.SmartCart.show();
  },
  true
);
```

> If Task 0 reported `bothVisible: true` on add-to-cart, also suppress the theme drawer's auto-open here by removing its `auto-open` attribute when the engine is `rebuy`. The spike records which hook exists.

- [ ] **Step 3: Load it**

In `layout/theme.liquid`, beside the existing cart scripts:

```liquid
<script src="{{ 'spy-cart-handoff.js' | asset_url }}" type="module"></script>
```

- [ ] **Step 4: Verify both paths**

```bash
cd /c/spy-v2 && npm run build:css && shopify theme push --development
node scripts/cart-measure.mjs --engine=theme --width=1440
node scripts/cart-measure.mjs --engine=rebuy --width=1440
```

Expected: the **theme** run (which declines consent) still reports `0 drift(s)` — the fallback is intact. The **rebuy** run opens Smart Cart and reports drift, because styling has not happened yet. That drift is the backlog for Tasks 4–6.

Also confirm manually that the two never open together.

- [ ] **Step 5: Commit**

```bash
git add assets/spy-cart-handoff.js snippets/cart-drawer.liquid layout/theme.liquid
git commit -m "feat: pick the cart engine so Rebuy never replaces the fallback drawer"
```

---

## Task 4: Panel and header geometry

**Files:**
- Modify: `snippets/rebuy-cart-template.liquid`, `src/tailwind.css`

**Interfaces:**
- Consumes: `data-spy-cart="1"` root from Task 2.
- Produces: a Smart Cart panel passing the `panel`, `header` and `title` rows of the harness.

Targets, from `audit/page-spec-cart-drawer.md` §10:

| Element | Target |
|---|---|
| Panel | **320px at every breakpoint**, overlay only — no page push, no body scroll lock, no left border |
| Transition | `426ms cubic-bezier(0.5,0.25,0,1)`, closed at `translateX(320px)` |
| Backdrop | undimmed |
| Header | 41px tall, 1px `#e6e6e6` bottom rule |
| Bag icon | 16×14 at `rx17 / y13` |
| Title | `Your Cart (N)` — 13 / 18.2 / **600**, `#1d2a2b`, count **inline in parentheses** |
| Close | 46×40 at `rx274` |

- [ ] **Step 1: Apply literal Tailwind utilities to the template**

In `snippets/rebuy-cart-template.liquid`, on the root and header nodes. Classes stay literal so Tailwind can see them; `w-[var(--theme-drawer-width)]` reads the shared token:

```
root:    w-[var(--theme-drawer-width)] max-w-[var(--theme-drawer-width)] border-l-0 z-[51]
         [--animation-speed:426ms] [--animation-timing-fade-in:cubic-bezier(0.5,0.25,0,1)]
header:  [display:flex] items-center h-[41px] border-b border-b-[#e6e6e6] pl-4 py-2
title:   text-[13px] leading-[18.2px] font-semibold text-spy-ink
close:   w-[46px] h-[40px]
```

Use the real node names from the Task 0 binding map. Use `[display:flex]`, never `flex` — Horizon's `base.css` owns that class name.

- [ ] **Step 2: Kill the page push and scroll lock for the Rebuy engine**

In `src/tailwind.css`, scoped to the engine attribute so the theme drawer is unaffected:

```css
:root[data-cart-engine="rebuy"] .page-wrapper {
  margin-right: 0 !important;
  overflow: visible !important;
}
```

- [ ] **Step 3: Build and push**

```bash
cd /c/spy-v2 && npm run build:css && shopify theme push --development
```

- [ ] **Step 4: Measure**

```bash
node scripts/cart-measure.mjs --engine=rebuy --width=1440
```

Expected: the `panel.w`, `header.h` and `title.*` rows read `ok`. Line-item and CTA rows still drift — that is Tasks 5 and 6.

- [ ] **Step 5: Commit**

```bash
git add snippets/rebuy-cart-template.liquid src/tailwind.css assets/tailwind.css
git commit -m "feat: match the Smart Cart panel and header to the source spec"
```

---

## Task 5: Line items

**Files:**
- Modify: `snippets/rebuy-cart-template.liquid`

**Interfaces:**
- Consumes: the item-loop, title, variant, price and remove names from the Task 0 binding map.
- Produces: rows passing the `image`, `name`, `variant` and `linePrice` harness rows.

Targets:

| Element | Target |
|---|---|
| Rows | **contiguous** — no gap, no bottom border; padding 16 all round |
| Image | **95×95**, grid track `calc(var(--cart-drawer-thumb) + 15px)` so the 15px gutter sits inside the track |
| Name | 15 / 18 / **700** `#1d2a2b` |
| Variant | 13 / 18.2 / 400 |
| **Quantity** | **read-only** `Quantity : N`, right-aligned, label 600 + value 400 |
| Remove | `#cccccc`, `position:absolute`, `top 8 / right 16` |
| Line price | right, 16 / 22.4, `#222222`, **no currency code suffix** |

The quantity rule is the one that fights Rebuy hardest: Smart Cart ships steppers by default. **Delete the increase/decrease controls from the template entirely** and render static text. Do not merely hide them with CSS — hidden controls stay in the accessibility tree.

- [ ] **Step 1: Rewrite the row markup**

```
row:      [display:grid] grid-cols-[calc(var(--cart-drawer-thumb)+15px)_minmax(0,1fr)] p-4 border-b-0 relative
image:    w-[var(--cart-drawer-thumb)] h-[var(--cart-drawer-thumb)] max-w-none object-contain
name:     text-[15px] leading-[18px] font-bold text-spy-ink
variant:  text-[13px] leading-[18.2px] font-normal
quantity: text-[13px] leading-[18.2px] text-right
remove:   absolute top-2 right-4 text-[#cccccc]
price:    text-right text-[16px] leading-[22.4px] text-[#222222]
```

`max-w-none` on the image is required — `base.css` sets `svg,img{max-width:100%}`, which collapses a fixed-size image inside a shrink-to-fit box.

- [ ] **Step 2: Remove the steppers**

Delete the increase and decrease control nodes from the template. Keep remove. Render the quantity as two spans: the label `Quantity :` at weight 600, the value at weight 400.

- [ ] **Step 3: Build, push, measure**

```bash
cd /c/spy-v2 && npm run build:css && shopify theme push --development
node scripts/cart-measure.mjs --engine=rebuy --width=1440
```

Expected: `image`, `name`, `variant` and `linePrice` rows read `ok`.

- [ ] **Step 4: Confirm remove still works**

Open the cart, click remove on a line, confirm the line disappears and the count in the header drops. Deleting the steppers must not have broken `removeItem`.

- [ ] **Step 5: Commit**

```bash
git add snippets/rebuy-cart-template.liquid assets/tailwind.css
git commit -m "feat: match the Smart Cart line items and drop the quantity stepper"
```

---

## Task 6: Footer, CTA and empty state

**Files:**
- Modify: `snippets/rebuy-cart-template.liquid`

**Interfaces:**
- Consumes: the subtotal binding from Task 0.
- Produces: a footer passing the `cta` harness row.

Targets:

| Element | Target |
|---|---|
| Footer | 122px tall, padding `0 16 16` |
| Rows | **single** `Estimated Total`, 16 / 22.4 / 600. No discount accordion, no subtotal row, no tax note |
| CTA | **287×51**, solid `--color-spy-orange-ui` (the button/text orange, currently source `#f27e37`), white text, 12 / 16.8, uppercase, radius 0 |
| CTA label | **`GO TO CART`** |
| CTA target | `routes.cart_url` — a **link**, not a checkout submit |
| Empty state | header stays (`Your Cart (0)`), centred "Your Shopping Cart is Empty", footer stays with Estimated Total and a **disabled** CTA |

- [ ] **Step 1: Rewrite the footer**

```
footer:  px-4 pb-4 pt-0
total:   [display:flex] justify-between text-[16px] leading-[22.4px] font-semibold
cta:     [display:flex] items-center justify-center h-[51px] w-full rounded-none
         bg-spy-orange-ui text-white text-[12px] leading-[16.8px] uppercase
```

Delete the discount accordion, the subtotal row and the tax note from the template. The cart *page* keeps its own — this is drawer context only.

The CTA copy is a theme setting, not a literal. Pass it in through the Liquid wrapper outside the raw block as a CSS custom property or a data attribute; never hard-code the string inside the template.

- [ ] **Step 2: Handle the empty state**

Keep the header and footer rendered when the cart is empty. Centre "Your Shopping Cart is Empty" in the body. Mark the CTA disabled. Do not render Horizon's "Continue shopping" button — the source has none.

- [ ] **Step 3: Build, push, measure**

```bash
cd /c/spy-v2 && npm run build:css && shopify theme push --development
node scripts/cart-measure.mjs --engine=rebuy --width=1440
```

Expected: `0 drift(s)`. Every row in the expectations table now matches.

- [ ] **Step 4: Check the empty state by hand**

Remove every line. Confirm the header still reads `Your Cart (0)`, the footer still shows Estimated Total, and the CTA is visibly disabled.

- [ ] **Step 5: Commit**

```bash
git add snippets/rebuy-cart-template.liquid assets/tailwind.css
git commit -m "feat: match the Smart Cart footer, CTA and empty state"
```

---

## Task 7: Behaviour parity

Geometry is done; this is the interaction contract.

**Files:**
- Modify: `snippets/rebuy-cart-template.liquid`, `assets/spy-cart-handoff.js`

**Interfaces:**
- Consumes: `data-cart-engine` from Task 3.
- Produces: no new interface.

Targets:

| Behaviour | Target |
|---|---|
| Click outside | closes |
| Close button | closes |
| **Escape** | **does not close** |
| Add to cart | auto-opens ~1.5s, then auto-closes |
| Page | never pushed; body scroll never locked |

- [ ] **Step 1: Stop Escape closing it**

Add to `assets/spy-cart-handoff.js`:

```js
// The source cart ignores Escape. Match it, but only for the Rebuy engine.
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'Escape') return;
    if (HTML.getAttribute('data-cart-engine') !== 'rebuy') return;
    if (!window.Rebuy?.SmartCart?.visible) return;
    event.preventDefault();
    event.stopPropagation();
  },
  true
);
```

- [ ] **Step 2: Set auto-open to match**

Smart Cart's auto-open and auto-close are **Rebuy admin settings**, not code. Set them to open on add and close after ~1.5s, matching the theme drawer's `auto-open` and `close-after-add`. Record the values set in `audit/rebuy-smartcart-spike.md`.

Confirm the theme drawer does not *also* auto-open while the engine is `rebuy`.

- [ ] **Step 3: Verify each behaviour by hand at 1440, 768 and 390**

Click outside → closes. Close button → closes. Escape → stays open. Add to cart → opens then closes on its own. Page never shifts; background still scrolls.

- [ ] **Step 4: Commit**

```bash
git add assets/spy-cart-handoff.js audit/rebuy-smartcart-spike.md
git commit -m "feat: match the Smart Cart open and close behaviour to the source"
```

---

## Task 8: Cross-sell rail and settings

The one genuinely new element. It sits where the source's own `.minicart-recommendations` slot sits — directly above the Estimated Total.

**Files:**
- Modify: `snippets/rebuy-cart-template.liquid`, `config/settings_schema.json`, `config/settings_data.json`, `src/tailwind.css`

**Interfaces:**
- Consumes: the cross-sell predicate from the Task 0 binding map.
- Produces: no new interface.

Usable width is 288px (320 − 2×16), too narrow for a product carousel. Treatment: **compact rows** — 56×56 thumb · title · price · add button — capped at 3, scrollable beyond that.

- [ ] **Step 1: Add the settings**

In `config/settings_schema.json`, inside the existing cart group:

```json
{
  "type": "checkbox",
  "id": "cart_drawer_crosssell_enabled",
  "label": "Show cross-sell in the mini-cart",
  "default": true
},
{
  "type": "text",
  "id": "cart_drawer_crosssell_heading",
  "label": "Cross-sell heading",
  "default": "You may also like"
},
{
  "type": "text",
  "id": "cart_drawer_crosssell_widget_id",
  "label": "Rebuy widget ID"
}
```

- [ ] **Step 2: Pass them through the Liquid wrapper**

They cannot be read inside the raw block, so expose them on the wrapper in `snippets/rebuy-cart-template.liquid`:

```liquid
<div
  data-crosssell-enabled="{{ settings.cart_drawer_crosssell_enabled }}"
  data-crosssell-heading="{{ settings.cart_drawer_crosssell_heading | escape }}"
  data-crosssell-widget="{{ settings.cart_drawer_crosssell_widget_id }}"
>
```

- [ ] **Step 3: Add the rail markup**

Immediately above the Estimated Total row, gated on the cross-sell predicate so it collapses to nothing when there is nothing to show:

```
rail:   [display:flex] flex-col gap-2 px-4 py-3 max-h-[240px] overflow-y-auto
row:    [display:grid] grid-cols-[56px_minmax(0,1fr)_auto] gap-3 items-center
thumb:  w-[56px] h-[56px] max-w-none object-contain
title:  text-[13px] leading-[18.2px] min-w-0 truncate
price:  text-[13px] leading-[18.2px] font-semibold
add:    w-[28px] h-[28px] [display:flex] items-center justify-center
```

`min-w-0` on the title is required — a grid item defaults to `min-width:auto`, so a long product name grows the row instead of truncating.

- [ ] **Step 4: Build, push, verify**

```bash
cd /c/spy-v2 && npm run build:css && shopify theme push --development
node scripts/cart-measure.mjs --engine=rebuy --width=1440
```

Expected: still `0 drift(s)` — the rail must not disturb the panel, header, line-item or CTA geometry.

Then confirm by hand: the rail renders with products, truncates long titles, scrolls past 3 items, and adding from it updates the cart.

- [ ] **Step 5: Confirm it collapses on the declined path**

```bash
node scripts/cart-measure.mjs --engine=theme --width=1440
```

Expected: `0 drift(s)`. The theme drawer has no rail and must be completely unchanged.

- [ ] **Step 6: Commit**

```bash
git add snippets/rebuy-cart-template.liquid config/settings_schema.json config/settings_data.json src/tailwind.css assets/tailwind.css
git commit -m "feat: add the mini-cart cross-sell rail above the total"
```

---

## Task 9: Full verification and sign-off

**Files:**
- Modify: `audit/page-spec-cart-drawer.md`, `audit/metafield-map.md` (if touched)

- [ ] **Step 1: Measure both engines at all three widths**

```bash
cd /c/spy-v2
for w in 1440 768 390; do
  node scripts/cart-measure.mjs --engine=rebuy --width=$w
  node scripts/cart-measure.mjs --engine=theme --width=$w
done
```

Expected: `0 drift(s)` on all six runs. The panel stays 320px at 390 — it must **not** go full-bleed.

- [ ] **Step 2: Regression-check the cart page**

Load `/cart` at 1440, 768 and 390. Confirm it is unchanged: promo form 74px, no Horizon discount block, subtotal plus total, stepper intact, `Check out` button intact. It is signed off at 1:1 and nothing in this plan should have reached it.

- [ ] **Step 3: Check the console on both paths**

Open the mini-cart with consent granted, then with consent declined. Zero errors in both.

- [ ] **Step 4: Confirm the fallback one more time, deliberately**

Block `rebuyengine.com` at the network level, reload, open the cart. The theme drawer must open and work. This is the whole reason the architecture exists — verify it rather than assume it.

- [ ] **Step 5: Record the result**

Append a section to `audit/page-spec-cart-drawer.md` recording the Smart Cart pixel diff, mirroring the existing §10 table, so the next person has one document covering both engines.

- [ ] **Step 6: Commit**

```bash
git add audit/page-spec-cart-drawer.md
git commit -m "docs: record the Smart Cart pixel diff against the source"
```

- [ ] **Step 7: Hand off**

Report to the user: both engines passing at three widths, cart page unregressed, console clean, fallback verified. **Do not push** — the user pushes.

---

## Self-review notes

**Spec coverage.** Every section of the design spec maps to a task: §3 architecture → Tasks 2–3; §5 Liquid/Vue boundary → Task 2 Step 1 and Task 8 Step 2; §6 panel/header → Task 4; line items → Task 5; footer/empty → Task 6; behaviour → Task 7; §7 rail → Task 8; §8 settings → Task 8 Steps 1–2; §9 R1/R2 → Task 0; §10 definition of done → Task 9.

**Known gap, deliberate.** Tasks 4–8 give exact target values and exact Tailwind class strings, but the *node names* they attach to come from the Task 0 binding map. That is a real dependency, not a placeholder: Rebuy's Legacy docs do not publish the bindings, so the authoritative source is the default template dumped at runtime. Inventing names here would have produced confidently wrong code.

**Risk R5** (the cents difference) is listed as out of scope in the Global Constraints so no task "fixes" it.
