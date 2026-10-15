# Mini-cart — new Figma design: research + spec

Date: 2026-10-13 · Status: **built on 14 Oct on an unpublished Rebuy cart (38089), not live.**
Build record, deviations and publish steps: `audit/rebuy-smartcart-settings.md` → "Figma redesign built on a copy".

**Source:** Figma file "SPY + Mini Cart", page **Design**
`https://www.figma.com/design/2JmJZntpEWKt4VPOZQ1ui5/SPY---Mini-Cart?node-id=1-2`

**How the values were read:** signed-in Chrome, view-only access. Every layer on the Design page
(1,179 layers) was selected one by one and its Properties panel was read. So the numbers below are
**Figma Inspect values, not screenshot estimates**. Inspect does not show two things: flex alignment
inside a frame (read off the captures instead) and the colour of a mixed-style text span (sampled
from the 100% captures, marked *sampled*).

**Kept with this spec, in `audit/mini-cart-figma/`:**

- `layers.txt` — the raw layer values for the reference frame, the empty state and every difference
  in the other frames. Check a number there before trusting a table here.
- `two-items-top/bottom.png`, `one-item-*.png`, `goggle-*.png`, `empty-*.png` — the four mobile
  frames at 100% (377px wide, so 1 image px = 1 design px). Visual baseline for the build.
- `desktop-one-item.png` — the desktop frame, scaled down, for placement only.

This design **replaces** the 320px source-clone cart in `audit/page-spec-cart-drawer.md`. It is no
longer a 1:1 copy of the old site; it is a new, conversion-led cart.

---

## 1. What is in the file

| Page | Content |
|---|---|
| Cover | orange cover: SPY+ logo, "JULY 2026", "Mini Cart" |
| **Design** | everything below |
| Discovery | six screenshots: today's SPY cart plus five reference carts |

No comments exist in the file.

**The references on the Discovery page, and what the design takes from each**

| Reference | What shows up in the SPY design |
|---|---|
| LSKD (desktop) | "Shopping Bag (1)" title, "You Might Also Like", "CHECKOUT SECURELY" with a lock, blurred page behind the panel |
| Gymshark (desktop, twice) | "Add a little extra" accessory rows with `+ ADD`, "You're US$72 away from Free Standard Shipping", "CHECKOUT SECURELY" |
| Shady Rays (desktop) | "You Unlocked Free Shipping", small grey model name over the colour name, accessory add-on for the eyewear in the cart |
| Oakley (mobile) | "20% – You saved $31.00" → our "You're saving $60" badge |

Four of the five reference screenshots also show **payment icons**, and three show a **discount code
field**. The SPY design has neither — worth confirming that is on purpose.

Frames on the Design page:

| Node | Frame | Size | Role |
|---|---|---|---|
| `8:399` | Mini Cart - Sunglasses | 375 × 1203 | **Empty cart** |
| `8:958` | Mini Cart - Sunglasses | 375 × 1137 | **1 item**, free shipping not reached |
| `8:388` | Mini Cart - Sunglasses | 375 × 1242 | **2 items**, free shipping unlocked — the reference frame |
| `8:805` | Mini Cart - Goggles | 375 × 1005 | 1 goggle, goggle accessories and goggle recommendations |
| `8:1290` | Desktop - Mini Cart | 1904 × 913 | 2-item panel over the homepage |
| `6:366` | Desktop - Mini Cart | 1904 × 913 | 1-item panel over the homepage |
| `3:505` | image 1 | 1904 × 972 | screenshot of today's site with the old cart open |
| `3:512`, `7:2` | Mini Cart - Alt 4 / Alt 5 | 375 wide | **older alternates**, see §9 |
| `7:173` | Frame 8 | 20 × 20 | stray gradient badge, not part of the cart |

Final design = the four mobile frames + the two desktop frames.

---

## 2. What changes against today's cart

| | Today (live, Rebuy Smart Cart + theme fallback) | New design |
|---|---|---|
| Panel width | 320 at every width | **375**, docked right on desktop |
| Page behind | not dimmed | **dimmed 20% black + blurred** |
| Header | bag icon + `YOUR CART (2)` 13px/600, 41px high | `Shopping Cart (2)` 16px/700, **48px**, soft shadow |
| Free shipping | none | **text line** under the header |
| Line item | 95px image, title 15/700, `Color:` line, static `Quantity : 1`, `×` remove, line price | 121×97 image, grey model + colour name, price, **− 1 + stepper**, **no remove button** |
| Accessories | none | **bordered "Bundle with Accessories. GET 20% OFF" box** |
| Recommendations | list rail (widget 314347) | **"You Might Also Like" 2×2 card grid** on a grey band |
| Total | `Estimated Total` | `Total :` + **"You're saving $60" badge** |
| Button | `GO TO CART` → cart page | **`CHECKOUT SECURELY`** with lock icon → checkout |
| Trust row | none | Lifetime warranty · Pay in installment · Easy return |
| Empty cart | "Your Shopping Cart is Empty" | message + trust row + **category tabs + 11 best sellers with `+ ADD`** |

---

## 3. Exact spec (mobile frame, 375 wide)

Root frame: white `#FFFFFF`, vertical stack, **gap 24** between header and body.
Body: vertical stack, **gap 32** between the top block and the lower block.
Content width is **343** (16px side margins).

Check of the 2-item frame: 48 + 24 + 479 + 32 + (511 + 148) = **1242** — matches the frame height.

### 3.1 Header — 375 × 48

| Part | Value |
|---|---|
| Background | `#FFFFFF`, drop shadow `0 4px 10px rgba(0,0,0,.05)` |
| Title | `Shopping Cart (2)` · DIN Next LT Pro **700 · 16px · line-height 100%** · `#30333D` · top 14, left 16 |
| Close | 24 × 24 hit box at top 12, left 338 (13px from the right edge) · `×` glyph 12.73 × 12.73 · `#000000` |

### 3.2 Top block — 343 wide, vertical, gap 8

**Free-shipping line** (text only, there is no progress bar in the design)

| State | Copy | Type |
|---|---|---|
| Not reached | `You're $25 away from get Free Shipping!` | DIN 400 · 14/100% · `#000`; `$25 away` is **700** |
| Reached | `You unlocked Free Shipping!` | DIN **500** · 14/100% · `#000` |

**Line item** — row, 343 × 97, image left, text right (`space-between`, so a 15px gap)

| Part | Value |
|---|---|
| Divider | 1px `#DEE2E9` under each item **except the last** |
| Image | **121 × 97**, radius 4, cropped to fill |
| Text column | 207 wide, vertical, gap 8 (two groups); 70 high |
| Model | `CYRUS SWITCH` · DIN **500** · 12/100% · uppercase · `#A2A2A2` |
| Colour | `Translucent Gunmetal` · DIN **500** · 14/100% · `#000000` (4px under the model) |
| Price | `$200` · DIN 400 · 14/100% · `#30333D` |
| Stepper | **64 × 30**, radius 2, border **1.2px `#DEE2E9`**, right-aligned on the price row |
| Stepper icons | 16 × 16 boxes, `−` 9.33 × 1.33, `+` 9.33 × 9.33, `#000`, gap 6 |
| Stepper value | `1` · DIN **500** · 14/12 · centred · `#232B38` ("Charcoal") |

There is **no remove (×) control** and no variant / lens line.

**Bundle box** — 343 wide, radius 4, border 1px `#DEE2E9`, padding 16, gap 10, white

| Part | Value |
|---|---|
| Title | `Bundle with Accessories. GET 20% OFF` · DIN 400 · 14/100% · `#000`; `GET 20% OFF` is **700** |
| Row | 311 × 56, three columns, `space-between` |
| Thumbnail | 56 × 56 |
| Name | `Sunglass Case` · DIN **700** · 14/100% · `#000` (156 wide; goggle frame wraps to 2 lines at 14/16) |
| Price | `$8 $12` · DIN 400 · 14/100% · sale price `#000000`; compare price struck through, `#999999` *(sampled)* |
| Button | **62 × 30**, radius 2, border 1px `#DEE2E9`; label `+ ADD` · DIN 700 · 13/12 · uppercase · **`#ED773B`** |

Height: 247 with three rows, 115 with one.

### 3.3 "You Might Also Like" band — full 375 width

| Part | Value |
|---|---|
| Band | background **`#F2F4F7`**, padding **24 20**, gap 14 |
| Title | `You Might Also Like` · DIN 700 · 16/120% · `#000` |
| Grid | 2 columns × 2 rows · card 164 wide → **7px** column gap, **4px** row gap |
| Card | white, padding 10 top / 10 bottom, inner gap 12; 208–218 high |
| Image | about 104 × 70, centred (the four cards use 104×70, 102×69, 119×80 — not one rule) |
| Colour name | `Soft Matte Black` · DIN 400 · 12/100% · centred · `#A2A2A2` |
| Model | `TARMAC` · DIN 700 · 14/100% · centred · `#000` (6px gaps in this text group) |
| Price | `$200` · DIN 400 · 14/100% · centred · `#30333D`; sale shows `$40` in `#000000` + struck `$170` in `#A2A2A2` *(sampled)* |
| Button | full card width minus 10px each side = **144 × 32**, border 1px **`#ED773B`**, no radius, no fill |
| Button label | `+ ADD` · DIN 700 · 12/100% · `#ED773B` |

### 3.4 Footer — 375 × 148, **sticky at the bottom**

The Alt frames mark it `Scroll position: Fixed`, and both desktop frames carry it as a separate layer
pinned to the bottom of the panel. So: header and footer stay, the middle scrolls.

| Part | Value |
|---|---|
| Box | white, top border 1px `#EDEFF3` at 60%, padding **19 16 16 16**, gap 12 |
| Total row | 343 × 24, `space-between` |
| Label | `Total :` · DIN 400 · 14/14 · `#000` |
| Savings badge | **118 × 24**, background `#F2F4F7`, 12px tag icon at left 10, text at left 26 |
| Savings text | `You're saving $60` · DIN 400 · 11/14 · `#000` |
| Total | `$400` · DIN **500** · 16/16 · right-aligned · `#000` (8px after the badge) |
| Button | **343 × 48**, fill **`#ED773B`**, no radius, icon + label centred with gap 12 |
| Button icon | lock, 16 × 16 box, white |
| Button label | `CHECKOUT SECURELY` · DIN 700 · 14/14 · **letter-spacing 4%** · uppercase · `#FFFFFF` |
| Trust row | 339 × 20, three items, gap 12; each = 17 × 16 icon + 2px + label |
| Trust label | DIN **500** · 12/18 · `#000` at **80% opacity** |

Footer content adds up to 151px but the frame is fixed at 148 — treat 151 (hug) as the truth.

### 3.5 Empty cart — `8:399`

Header as above with `Shopping Cart (0)`. **No footer, no checkout button.**

| Part | Value |
|---|---|
| Heading | `Your bag is currently empty.` · DIN 700 · 16/100% · centred · `#000` |
| Sub-line | `Start shop our best sellers` · DIN **300** · 14/120% · centred · `#000` (4px under) |
| Trust row | same row as the footer, 10px under the text, but weight **400** |
| Tabs | 4 tabs, each **80 × 32**, gap 8, 16px under the trust row |
| Active tab | fill `#ED773B`, label DIN 700 · 12/14 · uppercase · `#FFF` (`MEN`) |
| Idle tab | border 1px `#DEE2E9`, label DIN 700 · 12/100% · uppercase · `#000` (`WOMEN`, `GOGGLE`, `EYEGLASSES`) |
| List | 8px under the tabs, 11 rows, 1px gap |
| Row | **343 × 88**, padding 0 10, gap 20, 1px `#DEE2E9` under each row except the last |
| Row image | 81 × 64 |
| Row text | colour `Matte Black` DIN 500 · 12 · `#A2A2A2` → model `CYRUS` DIN 700 · 14 · uppercase · `#000` → price `$ 200` DIN 400 · 14 · `#30333D` |
| Row button | same 62 × 30 `+ ADD` button as the bundle box |

Rows: Cyrus, Rebar SE ANSI, Rebar ANSI, Monolith, Discord, Overhaul, Helm Tech, Dirty Mo 2, Montana,
Region XL, Cooper.

### 3.6 Desktop — `8:1290`, `6:366` (1904 × 913 viewport)

| Part | Value |
|---|---|
| Panel | the same 375px cart, **left 1529 → flush right**, full viewport height |
| Overlay | covers the 1529px left of the panel · `#000000` at **20%** · **background blur 44** |
| Footer | pinned to the panel bottom; the body scrolls under it |

Nothing in the panel is re-laid-out for desktop: it is the mobile frame, docked. No tablet frame exists.

---

## 4. Tokens the design uses

**Colour**

| Figma | Used for | Note for our theme |
|---|---|---|
| `#ED773B` "Main Orange" | checkout button, `+ ADD` text and borders, active tab | **not our orange.** The theme's one orange control is palette color3 (`#f27e37`). Wire to that setting, do not add a second orange |
| `#30333D` | title, prices | theme text is `#2c393e` / `#1d2a2b` |
| `#000000` | most text | |
| `#232B38` "Charcoal" | stepper value | |
| `#A2A2A2` | model / colour secondary text | `#929292` in the goggle frame — pick one |
| `#999999` / `#A2A2A2` | struck compare price (bundle row / card), *sampled* | two greys for the same job — pick one |
| `#6F7176` at 70% | struck compare price in the empty-state rows (clipped, never visible) | |
| `#DEE2E9` | every hairline and control border | |
| `#EDEFF3` at 60% | footer top border | |
| `#F2F4F7` | recommendation band, savings badge | |

**Type** — one family, DIN Next LT Pro: 11, 12, 13, 14, 16px; weights **300, 400, 500, 700**.

> **Weight 500 (Medium) is not loaded on the site.** `snippets/spy-fonts.liquid` ships Light 300,
> Regular 400 and Bold 700 only. The design uses 500 for the model name, colour name, stepper value,
> total and trust labels. Either add the Medium file (licence + one more font request) or agree a
> fallback (400 or 700) with the designer.

**Contrast (WCAG AA needs 4.5:1 for this text size)**

| Pair | Ratio | Result |
|---|---|---|
| `#ED773B` text on white (`+ ADD`) / white on `#ED773B` (button) | 2.9 : 1 | fails |
| `#A2A2A2` 12px on white (model, colour name) | 2.6 : 1 | fails |
| `#929292` 12px on white | 3.1 : 1 | fails |
| `#30333D`, `#000` on white | 12+ : 1 | passes |

The orange failure is the same accepted brand choice as elsewhere on the site. The grey secondary text
is new and worth raising.

---

## 5. Copy, exactly as drawn

| Where | Copy | Issue |
|---|---|---|
| Header | `Shopping Cart (n)` | |
| Free shipping | `You're $25 away from get Free Shipping!` | grammar: "from getting" / "away from Free Shipping" |
| Free shipping | `You unlocked Free Shipping!` | |
| Bundle | `Bundle with Accessories. GET 20% OFF` | |
| Recommendations | `You Might Also Like` | |
| Footer | `Total :` | space before the colon |
| Footer | `You're saving $60` | |
| Button | `CheckOut Securely` (shown uppercase) | |
| Trust | `Lifetime warranty` · `Pay in installment` · `Easy return` | "installments", "returns" |
| Empty | `Your bag is currently empty.` / `Start shop our best sellers` | "Start shopping…" / "Shop our best sellers" |
| Tabs | `Men` · `Women` · `Goggle` · `eyeglasses` | "Goggles" |
| Buttons | `+ ADD` | |

Product names contain typos too (`MARUDER`, `REgion XL`, `Rebar AnsI`) — placeholder data.

---

## 6. States drawn, and states missing

Drawn: empty · 1 item below the free-shipping threshold · 2 items above it · goggle cart · desktop.

**Not drawn — needs an answer before build:**

- Removing an item (no `×`; is `−` at 1 the only way?)
- Hover, focus, pressed and disabled states for every button, the stepper and the tabs
- Loading state while a line or an add is in flight; error state (out of stock, max quantity)
- A line with a sale price, a discount, or a long name that wraps
- A line-level promo message (the old cart shows one: "Blue Light styles now just $49 — no code needed")
- Payment icons and a discount code field (most of the reference carts have them, §1)
- What the bundle row looks like **after** it is added (does it leave the box? show "Added"?)
- Bundle box when the cart has no matching accessory; recommendations when there are fewer than 4
- A product with several variants behind `+ ADD` (which variant is added? is there a picker?)
- Cart with many lines (the footer is sticky; the middle scrolls — assumed)
- Tablet width; phone wider than 375 (assumed full width on phones)
- Open / close motion (assumed: keep today's 426ms slide)

---

## 7. How it maps onto what we run today

Today: Rebuy Smart Cart **v2** (cart 37798, live) when the visitor has accepted cookies, and the theme
drawer for everyone else. Theme CSS scoped to `#rebuy-cart` does all the styling; the line-item
template lives in the Rebuy admin (`audit/rebuy-smartcart-settings.md`).

| Design module | Likely mechanism | Where the work is | Risk |
|---|---|---|---|
| 375 panel, dim + blur | CSS on `#rebuy-cart` and its background | `src/tailwind.css` | low |
| Header | Cart Title component (count already customised) | Rebuy admin + CSS | low |
| Free-shipping line | Rebuy **Tiered Progress Bar** (now off) with one tier; hide the bar if text only | Rebuy admin + CSS | low — needs the threshold |
| Line item | **Cart Items custom template**: bring the stepper back, new model / colour layout | Rebuy admin + CSS | medium — template is outside git |
| Bundle box | a second Rebuy cross-sell widget fed by accessory rules, with a discount | Rebuy admin + discount setup + CSS | **high — the 20% logic is undefined** |
| You Might Also Like | existing widget 314347, re-laid as a 2×2 grid | CSS (+ widget template) | medium |
| Total + savings badge | Cart Subtotal component + a computed "saving" value | Rebuy admin template / JS | medium — define "saving" |
| Checkout button | Checkout Button on, View Cart off; lock icon | Rebuy admin + CSS | low — **reverses the "GO TO CART" decision** |
| Trust row | static markup in the footer | global custom template or CSS | low |
| Empty state | custom: tabs + best-seller lists | custom template + JS + 4 data sources | **high — most custom part** |

*The Rebuy rows are "to confirm in the admin": I have not opened the editor for this design yet.*

**Two things that are bigger than styling**

1. **The fallback drawer.** Rebuy does not load until the visitor answers the cookie banner, never
   loads for visitors who decline, and boots 6–15s after page load for those who accept. Everyone else
   gets the theme drawer, which still looks like the old 320px cart. Either the fallback gets the new
   look too (shell, header, items, footer — without bundle and recommendations), or a large share of
   visitors never sees the new design.
2. **Cart page.** The design's only button goes to checkout, so the signed-off cart page is no longer
   in the main path. Keep it reachable (and where is the link?) or retire it.

**Option worth pricing:** build this cart natively in the theme (Horizon drawer + Shopify
recommendations + automatic discounts) instead of inside Rebuy. It would work for every visitor at
once, live in git, and be easier to make pixel-exact. It gives up Rebuy's merchandising rules and
reporting. That is a business call, not mine.

---

## 8. Open questions for the designer / PM

1. **Is this the final direction, and are Alt 4 / Alt 5 dead?**
2. **Free shipping:** what is the threshold (the site says $50; the drawing says "$25 away" with a $200
   item)? Text only, or a progress bar?
3. **Bundle "GET 20% OFF":** which accessories for which products? Is the 20% a real Shopify discount,
   and is it applied only when bought with eyewear? The drawn prices are not 20% off ($8/$12, $5/$8,
   $50/$60).
4. **"You're saving $60":** compare-at savings, discounts, or both? Hidden when zero?
5. **Checkout or cart page?** And what happens to the cart page.
6. **Remove item:** no `×` in the design — intended?
7. **`+ ADD` on products with variants:** add the default variant, or open a picker?
8. **Empty-state tabs:** which collections feed Men / Women / Goggles / Eyeglasses? Is "best sellers"
   real sales data or hand-picked?
9. **Trust claims:** is "Lifetime warranty" true for every product? What does "Pay in installments"
   mean here (Shop Pay, PayPal Pay in 4)? Needs a legal check before it sits next to a pay button.
10. **Orange:** `#ED773B` in Figma vs `#f27e37` on the site — which one?
11. **Font weight 500:** add DIN Medium, or fall back?
12. **Dim + blur behind the cart** on desktop — confirmed? Today the page is not dimmed at all.
13. **Phone and tablet widths:** full width on phones? 375 on tablet?
14. **Does the fallback cart (no cookies accepted) get this design too?**
15. **Title count:** number of lines or total quantity?

---

## 9. Things in the file that look like mistakes

- Goggle frame: header says `(2)` with one line; total is `$400` for one `$200` item.
- 1-item frame: also `$400` and "saving $60" — placeholder numbers.
- `Sunglass Case` is weight 500, the other accessory names are 700.
- Secondary grey is `#A2A2A2` in one frame and `#929292` in another.
- Trust labels are weight 500 in the cart and 400 in the empty state.
- The stepper's 20px side padding cannot fit in its 64px width; the content simply sits centred.
- Recommendation images have three different sizes; the grid gaps are 7px across and 4px down.
- Empty-state rows hold a second, struck price (`$ 30`) that is clipped out of view, and the price is
  written `$ 200` with −5% letter-spacing, unlike `$200` everywhere else.
- Trust icons are upscaled PNGs, not vectors — we need SVGs.
- **Alt 4 / Alt 5** hold leftovers from another design kit (AktivGrotesk fonts, a "Pacific Case" card,
  a pink "favourite" badge, a blue toggle) parked off-canvas. Ignore them. The useful differences:
  Alt 4 shows recommendations as a bordered **list**, Alt 5 boxes each line item and gives the bundle
  `+ ADD` an orange border.

---

## 10. Suggested order if this is approved

1. Answers to §8 items 2, 3, 5, 6, 14 — they change the build, not just the look.
2. Shell, header, line item, footer (the parts every cart state shares) in Rebuy **and** the fallback.
3. Free-shipping line.
4. You Might Also Like grid.
5. Bundle box, once the discount rule exists.
6. Empty state with tabs — last, it is the most custom piece.

Verify each at 1440 / 768 / 390 against the Figma frames, plus keyboard and screen-reader checks
(the cart is a dialog: focus trap, Esc, focus return are already in place and must survive).
