# Legal page bodies (source extract)

Pulled from the saved SFCC pages in `reference/footer-utilites/` — the content region only,
scripts stripped, Word's inline styles kept. Paste into the matching Shopify page body
(Admin → Content → Pages → Edit → `<>` HTML view).

| File | Shopify page | Source | Notes |
|---|---|---|---|
| `legal-notices.html` | `legal-notices` (**does not exist yet**) | `legal.html` | Clean semantic markup: h1 + 7 × h2 + p + one bullet list. No inline styles — the theme supplies the type. |
| `terms-of-use.html` | `terms-of-use` | `Terms and Conditions.html` | Word paste: 70 of 71 paragraphs carry inline `font-family: Times New Roman; font-size: 10pt; line-height: 1.6em`. |
| `privacy-policy.html` | `privacy-policy` | `nam_Privacy_Policy.html` | Word paste with **4 tables + 12 list items the current Shopify page is missing**. Body text inherits Calibri 11pt from Word's `.MsoNormal` rule (in the source `<head>`, not inline) — the theme must supply that base. |

## Admin steps left to do

1. **Create the page**: Content → Pages → Add page, title `Legal Notices`, handle `legal-notices`,
   theme template `legal-notices` (already in the theme).
2. **Paste the bodies**: open each page, switch the body editor to HTML (`<>`), and replace the
   content with the matching file above. Paste in HTML view — the visual editor strips the
   `style` attributes the Word copy depends on.
3. Privacy Policy must be replaced, not appended: the live body is missing its 4 tables and 9 of
   its 12 list items.

The theme side is done: `blocks/page-content.liquid` gives each `template_suffix` its own base
type, and `sections/main-page.liquid` gives each one the source's reading column.

Measured source type (1440, real fonts):

| Page | Font | Size / line-height | Align | Content inset (doc 1425) |
|---|---|---|---|---|
| Legal Notices | DIN Next LT Pro | h1 32/38.4 · h2 28/33.6 · p 16/22.4 (mb 16) | left | 63 → 1362 |
| Terms | Times New Roman | 13.33 / 21.33 (1.6em) | justify | 111 → 1329 |
| Privacy | Calibri (title runs Times 14pt bold+underline) | 14.67 / normal | justify | 15 → 1410 |
