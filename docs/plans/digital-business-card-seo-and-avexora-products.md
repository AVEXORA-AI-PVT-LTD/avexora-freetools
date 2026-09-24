# Plan: Digital Business Card SEO/AEO/GEO + Avexora products page

## Goal

Make the **Digital Business Card Generator** (`/business-legal/digital-business-card-generator`) rank and get cited for the searches people actually make ("digital business card", "digital visiting card maker", "vCard QR code", …). That means fixing what the page currently tells search engines and adding targeted keywords to its copy and structured data. Separately, build a new **Avexora products page** that introduces the six other Avexora sites: avexcrm.com, avexwa.com, ai.avexora.in, avexora.in, va.avexora.in and examos.avexora.in. The same products appear as a **card section** on the tool page. Card copy comes from each product's own live site. Answer engines (ChatGPT, Perplexity, Google AI Overviews) should also be able to see that these sites all belong to one company.

## What inspection found (current state)

| # | Finding | Where | Effect |
|---|---|---|---|
| F1 | The page title is built as `"<name> — Avexora Tools"`, and the root layout's `template: "%s \| Avexora Tools"` then appends the brand again. The result is **"Digital Business Card Generator — Avexora Tools \| Avexora Tools"**. | `src/app/[category]/[slug]/page.tsx` `generateMetadata` (`defaultTitle`) + `src/app/layout.tsx:41` | This affects every tool. The title wastes about 17 characters and reads as spammy. |
| F2 | The meta description falls back to `toolData.description`, which is the **whole About section** joined together. The short `seoDescription` sits unused in `toolData.shortDescription`. | same file, `fallback.description` | Every tool's meta description is hundreds of characters long and gets cut off in search results. |
| F3 | The page's JSON-LD has no **HowTo** node, even though the tool defines `steps`. The unused `toolJsonLd()` in `src/lib/seo.ts` does emit one. | page vs `src/lib/seo.ts` | This affects every tool: no HowTo rich result and weaker AEO. |
| F4 | `tests/seo.test.ts` tests `toolMetadata()` / `toolJsonLd()` from `lib/seo.ts`, which **the page no longer calls**. | tests | F1–F3 went unnoticed because the tests pass while the live page is wrong. |
| F5 | Tool configs have no `keywords` or `seoTitle` fields, so a tool can't set a keyword-first title. | `src/types/tools.ts` | Titles are just the tool name. |
| F6 | The homepage's `Organization` JSON-LD has only `name` and `url`, with no `sameAs` and no `logo`. | `src/app/page.tsx:20` | Answer engines can't tie Avexora's sites together as one company. |
| F7 | `llms.txt` lists only this site's tools and says nothing about the other Avexora products. | `src/app/llms.txt/route.ts` | The GEO signal misses the ecosystem. |
| F8 | On the external sites, avexcrm.com has **no meta description** and its `<title>` reads "Acexora AI CRM" (a typo). avexora.in and examos are client-rendered apps, with almost no text in the server HTML. | the external sites | **Out of this repo's scope.** Report it to the user, since it limits how well those sites rank. |

## Content captured from the product sites (2026-09-24)

This is the copy to base each card on. Each product gets a name, a one-line pitch, three or four feature points and a primary audience, all reworded from the site's own title, meta description, hero text and feature headings (not copied word for word).

| Product | URL | Source copy (title / description / hero) | Features seen on the site |
|---|---|---|---|
| **Avexora AI CRM** | https://avexcrm.com | Hero: "The Platform for Growing Business"; "Our cutting-edge CRM is designed to streamline your operations and boost your bottom line." | CRM, project management, Freelance / Business / Enterprise plans |
| **AvexWA — WhatsApp Business Platform** | https://avexwa.com | "Complete WhatsApp Business API Platform for messaging, automation, and analytics"; "Send broadcasts, deploy AI chatbots, automate workflows, and manage conversations — all from one powerful platform." | WhatsApp Cloud API, Smart Broadcasts, AI chatbots, Flow Automation, Contact CRM, Click-to-WhatsApp Ads; "Go live in 3 minutes" |
| **Avexora AI EBOS** | https://ai.avexora.in | "From Blank Page to Live Funnel in 10 Minutes"; "the world's fastest AI business ecosystem for coaches, consultants, agencies and freelancers. 25+ AI apps, one login, zero technical headaches." | Find your niche → build your strategy → build your funnel → launch and grow |
| **Avexora AI (company)** | https://avexora.in | "Enterprise-grade AI systems that automate operations, optimize growth, and transform complex data into intelligent decision-making engines." | Solutions, industries, marketplace, SBE platform |
| **Avexora AI Voice Agents** | https://va.avexora.in | "Your business phone, powered by AI. Every language. Every hour."; "answers every call in Hindi, English or 10+ Indian languages — records it, summarises it, and follows up on WhatsApp automatically." | Human-sounding AI voice agent, call recording + AI transcription, outbound campaigns, IVR, WhatsApp alerts |
| **Avexora ExamOS** | https://examos.avexora.in | "OMR Exam Management for Schools & Institutes"; "AI-powered OMR scanning, exam management, and result analytics for schools, coaching centres, and institutes." | AI OMR recognition, drag-and-drop OMR designer, automatic evaluation, analytics dashboard |

## Keyword targets (Digital Business Card Generator)

These are based on search intent; this session has no search-volume data. The primary term goes in the title, H1 and first sentence. The secondary terms go into the description, About, FAQ and HowTo wording where they read naturally, with no keyword stuffing.

- **Primary:** digital business card generator, free digital business card
- **India variants (a major audience):** digital visiting card maker, online visiting card, digital visiting card free
- **Features:** vCard QR code, QR code business card, business card with WhatsApp button, save contact button, .vcf file generator, animated business card, shareable business card link
- **Synonyms:** virtual business card, electronic business card, e-business card, contactless business card
- **Question phrasings for AEO (FAQ answers written to answer these directly):** "how to make a digital business card", "how to share a digital business card on WhatsApp", "what is a vCard", "is a digital business card free"

Avoid promising features the tool doesn't have, such as NFC cards or an app download.

## Assumptions (flag to the user)

1. **Route for the separate page:** `/products`, titled "Avexora Products: CRM, WhatsApp, AI Voice Agents, ExamOS & more". Another slug (for example `/avexora-products`) is a one-line change.
2. **Card content is static,** written into a config file from the captured copy above. It isn't fetched live: fetching at request time would be slow, fragile and a security risk. The config records the capture date, so it's clear when to refresh it.
3. **Outbound links** to the other Avexora sites are normal followed links, since they share an owner. They carry UTM parameters (`utm_source=tools.avexora.in&utm_medium=referral&utm_campaign=<placement>`), open in a new tab, and use `rel="noopener"`, without `noreferrer`, so the other sites' analytics still see where the visit came from.
4. **The card section goes on the Digital Business Card tool page** as requested. It's built as a reusable component, so other tools or the footer can use it later, but **no other tool gets it in this change**.
5. **F1–F3 are fixed site-wide.** They live in the shared tool page template and hurt this page directly; a fix limited to one tool would be a hack. This changes the title, description and JSON-LD of **every tool page**, for the better.
6. **Google ignores the `keywords` meta tag.** It's still emitted, since Bing and some answer engines read it, but the ranking work is in the title, description, headings, copy and structured data.

## Milestones

**M1. Fix tool page metadata for all tools (F1–F4)**
- `generateMetadata` passes the plain title (the `seoTitle` override, or the name) so the layout template adds the brand exactly once.
- The description defaults to the tool's `seoDescription`; admin `metaDescription` overrides still win.
- The page's JSON-LD adds a HowTo node from `steps` (reusing the `toolJsonLd` logic in `lib/seo.ts` rather than duplicating it). Pages whose data came from the database with no steps get no HowTo node.
- The tests move from the unused helpers to the page's real metadata and JSON-LD builders, so the live output is what gets tested.

**M2. Keyword-first SEO for the Digital Business Card Generator**
- Add optional `seoTitle?: string` and `keywords?: string[]` to `ToolBase` (`src/types/tools.ts`), and use them in `getToolFormData` and the metadata. Keep `seoTitle` to 60 characters or fewer.
- In `business-legal.ts`, set:
  - `seoTitle`, e.g. "Free Digital Business Card Generator: Animated vCard & QR" (60 characters or fewer, primary keyword first).
  - `keywords`, from the list above.
  - A rewritten `seoDescription` of 150–160 characters, with the primary keyword and the "free / WhatsApp / QR / vCard" hooks.
  - A tightened `directAnswer`, used as the AEO answer.
  - New FAQs for "how to make a digital business card", "what is a vCard", and "digital business card vs paper visiting card". Existing FAQs stay.
  - About copy using the synonyms and the India variants.
- The OG image stays the generated per-tool image.

**M3. Avexora products data and components**
- Create `src/config/avexora-products.ts`, typed `AvexoraProduct[]`, with `id, name, url, tagline, description, features[], audience, category` and a `capturedAt` date. The six entries are built from the captured copy above.
- A `utmUrl(product, placement)` helper.
- An `<AvexoraProductCards placement="…" />` server component in the site's card style (the "Related tools" grid, orange accent), each card linking out. Accessibility: a heading, a list, and descriptive link text such as "Visit AvexWA", not "Learn more".

**M4. Separate `/products` page**
- `src/app/products/page.tsx`: an H1 and intro, one section per product with a short paragraph, features and a CTA, and a link back to the free tools.
- Metadata: a title and description built around "Avexora products" plus the product-category keywords (AI CRM, WhatsApp Business API, AI voice agent, OMR exam software), with a canonical URL.
- JSON-LD: an `ItemList` of `SoftwareApplication` entries (name, url, applicationCategory, description) and a `BreadcrumbList`.
- Add the page to the sitemap, and to the static route allow-list in `tests/seo.test.ts`.
- Add a "Products" link to the site footer, and to the header only if the header has room; that's a design call.

**M5. Card section on the tool page**
- Render `<AvexoraProductCards placement="digital-business-card" />` on the Digital Business Card tool page only, between FAQ and Related tools, headed e.g. "More from Avexora", with a "See all products →" link to `/products`.
- Use a small per-tool flag (`showAvexoraProducts?: boolean` in the tool config) rather than hard-coding the slug in the page.

**M6. Entity and GEO signals**
- Homepage `Organization` JSON-LD: `name: "Avexora"`, `url: https://avexora.in`, `logo`, and `sameAs` with all six sites.
- The tool page's SoftwareApplication node gets `publisher` pointing to that Organization.
- `llms.txt` gets an "## Avexora products" section: one line per product with its URL and pitch, plus a link to `/products`.

## Dependencies

- M1 comes before M2, because M2's new fields flow through M1's fixed metadata path.
- M3 comes before M4 and M5, which both render the product data and component.
- M6 depends on M3 for the product list, which also feeds `sameAs` and `llms.txt`.
- **ui-ux-designer** should look at the M3 card component and the M4 page layout before coding: card density and placement on the tool page, and whether the header gets a Products link. M1, M2 and M6 are not visual.

## Acceptance criteria (tester checklist)

1. The `<title>` of `/business-legal/digital-business-card-generator` is exactly `"<seoTitle> | Avexora Tools"`, with the brand appearing once. On every other tool page it's `"<Tool name> | Avexora Tools"`, with no "— Avexora Tools |" doubling.
2. The meta description of every static tool page equals its `seoDescription` unless an admin override exists, and it's 170 characters or fewer for the Digital Business Card tool.
3. The Digital Business Card page's JSON-LD includes SoftwareApplication, FAQPage (including the new FAQs), BreadcrumbList and **HowTo**, with one step per config step. All of it is valid JSON and covered by a test.
4. `seo.test.ts` asserts on the page's real metadata and JSON-LD builders, not only on the `lib/seo.ts` helpers, and would have failed on F1–F3.
5. The tool page shows a "More from Avexora" section with six cards. Each card links to the correct domain with the UTM parameters, `target="_blank"` and `rel="noopener"`. The section also links to `/products`.
6. `/products` returns 200. It has one H1, six product sections with names and descriptions that match the config, a canonical URL, `ItemList` JSON-LD with six items, and it's listed in `/sitemap.xml`.
7. The homepage `Organization` JSON-LD contains `sameAs` with all six URLs.
8. `/llms.txt` contains an "Avexora products" section listing all six products and `/products`.
9. `seo.test.ts`'s route allow-list includes `/products`, and the existing SEO tests still pass: unique titles and descriptions, About links resolve, related slugs exist.
10. `tsc`, `lint` (0 errors), `test` and `build` all pass with no `DATABASE_URL`, and Lighthouse SEO on the tool page is 100 in a local run, or any shortfall is listed.

## Out of scope

- Editing the external sites. F8, the avexcrm.com title typo and missing descriptions, gets reported but not fixed.
- Live fetching or syncing of the product sites' content.
- Keyword or rank tracking, and Search Console setup.
- Adding the product cards to tools other than the Digital Business Card Generator.
- Rewriting SEO copy for other tools. They only get the template fixes from M1.
- Backlinks, hreflang, and translating into other languages.

## Risks and complexity

- **M1 changes every tool page's title and description.** The change is an improvement, but snapshot-like tests and any admin SEO overrides need checking. Admin `seoTitle` and `metaDescription` values must still win.
- **Duplicate-content risk:** the product copy on `/products` must not duplicate the product sites word for word. Reword it, as noted above.
- **Outbound links on a tool page** send visitors elsewhere. Placing the section below the FAQ, rather than above the tool, keeps attention on the tool.
- **The captured copy goes stale.** The `capturedAt` field plus a note in the config says when to refresh it.
- **The external SPAs (avexora.in, examos)** have little crawlable text. Linking to them helps them less than it would help server-rendered sites; that's F8 again, for the user.
