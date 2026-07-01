# Page Spec: Policy / Support (`page.default`)

**Representative URL:** https://www.spyoptic.com/us/warranty.html  
**Template:** `page.default`  
**Covers:** Warranty, Return Policy, Shipping, Contact Us, FAQ, Privacy Policy, Terms of Use, Accessibility, MAP Policy, Military Discount, Retail Sales Agreement  
**Screenshots needed:** desktop 1440 / mobile 390

---

## Section Inventory

| # | Section / Module | Content | Custom? |
|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) |
| 2 | Navigation | Shared | No (shared) |
| 3 | Page Title | "Warranty" (h1) | CUSTOM page-title block |
| 4 | Trust/Promo Strip | Mini trust badges: Shipping · Returns · Warranty | CUSTOM trust-strip |
| 5 | Page Content | Rich text: warranty statement, exclusions table, customer service contacts | Horizon rich-text block (styled) |
| 6 | Data Table (Warranty) | Product categories × warranty periods × exclusions | CUSTOM table or rich text |
| 7 | Contact CTA | Phone, email, contact form links | CUSTOM contact-block |
| 8 | Footer | Shared | No (shared) |

---

## Key Characteristics

- **Simple content template** — mostly rich text with some structured components
- **No breadcrumb** on current site (add in Shopify build for navigation)
- **Data table** in warranty page — formatted HTML table for product/warranty matrix
- **Contact info cards** — phone/email/form links with icon treatment
- **Consistent layout** across all policy pages (title + content + footer)

---

## Content Sources

- All policy page content = **Layer 2 section settings** (rich_text content field per page)
- No metafields needed — standard Shopify page content (`.content` property)
- Exception: Warranty page may link to online claim form (external or Shopify form app)

---

## Responsive

Content is single-column — standard stack on all breakpoints. No special responsive behavior beyond text reflow and table scroll.

---

## Pages Using This Template

| Page | URL (SFCC) | Notes |
|---|---|---|
| Warranty | /us/warranty.html | Has data table + contact section |
| Return Policy | /us/spy_optic_return_policy.html | Rich text + steps |
| Shipping | /us/shipping/shipping.html | Rich text + shipping table |
| Contact Us | /us/contactus | Form + contact info |
| FAQ | (TBC) | Accordion component preferred |
| Privacy Policy | (TBC) | Long-form legal text |
| Terms of Use | (TBC) | Long-form legal text |
| Accessibility | (TBC) | — |
| MAP Policy | (TBC) | — |
| Military Discount | (TBC) | — |

> FAQ page may benefit from an accordion component — flag as a `page.faq` variant if needed.
