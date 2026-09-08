# 22 — Avexora Brand Studio: Build Specification

**Surface:** `freetools.avexora.in/studio` — the paid subscription tier of the existing free-tools property.
**Strategy & rationale:** see `21_Brand_Studio_Research_and_GTM.md`.
**Positioning:** *Compliance-ready business stationery for Indian startups — logo to employee ID cards, in minutes.*

> This is the working spec. It is authoritative for the build; the implementation is config- and rule-table-driven, so corrections belong here first.

---

## 1. Architecture principles

1. **One intermediate representation.** Every visual asset compiles to a **`DocSpec`** — a declarative, unit-aware page description. Three renderers consume it (SVG, PDF, raster). New asset types are a new *layout function*, never a new renderer.
2. **Deterministic design engine.** Logos and layouts are composed programmatically from curated palettes, font pairings and parametric marks. No diffusion models. Same input + same seed ⇒ byte-identical SVG. This makes output reproducible, re-editable, license-clean and unit-testable.
3. **AI curates, it never draws.** Claude selects *by ID* from the curated registries (palette, font pair, mark style) and writes copy. Its output is zod-validated and always renderable. Absent `ANTHROPIC_API_KEY`, deterministic heuristic scoring takes over — the same degradation pattern as the existing `/api/ai` route.
4. **Compliance is a rule table, not hardcoded logic.** Jurisdiction rules live in data so a non-India pack can be added without touching the engine.
5. **Entitlements are enforced server-side, always.** `assertEntitlement()` guards every export and AI route. Client-side gating is presentation only.
6. **Additive to the free-tools engine.** The existing 120 static tool pages, `Lead` model and SEO engine are untouched. New free tools are added as ordinary `ToolConfig` entries.

### Next.js 16 conventions (verified against `node_modules/next/dist/docs/`)
- **`middleware.ts` does not exist.** Next 16 renames it to **`proxy.ts`** at project root (or `src/`), exporting `proxy` (named or default) plus an optional `config.matcher`.
- `params` / `searchParams` are **Promises** and must be awaited — matches the existing `src/app/[category]/[slug]/page.tsx`.
- Route Handlers live in `route.ts`, are uncached by default, and cannot sit at the same segment level as a `page.tsx`.
- Proxy is for optimistic redirects only — **not** the authorization boundary. Real authorization happens in server components and route handlers.

### Routing
`/studio/**` is a static segment, so it takes precedence over the root `[category]` dynamic segment. The free-tools routes and their 138 static pages are unaffected. Studio pages render dynamically.

---

## 2. Data model (`prisma/schema.prisma`, MongoDB)

`Lead` is unchanged. Added:

| Model | Purpose | Key fields |
|---|---|---|
| `User`, `Account`, `Session`, `VerificationToken` | Auth.js v5 Mongo shapes | standard adapter fields |
| `Brand` | A company's identity + statutory particulars | `legalName`, `entityType`, `cin`, `llpin`, `gstin`, `pan`, `registeredAddress`, `contact`, `industry` |
| `BrandKit` | The generated design system | `palette`, `typography`, `logoSpec`, `version` |
| `Asset` | A generated artifact | `brandId`, `type`, `spec` (JSON), `createdAt` |
| `Employee` | ID-card source data | `name`, `designation`, `empCode`, `bloodGroup`, `photoUrl` |
| `Subscription` | Razorpay state | `plan`, `status`, `razorpaySubscriptionId`, `currentPeriodEnd` |
| `UsageCounter` | Plan quota metering | `userId`, `period`, `metric`, `count` |

Mongo + Prisma uses `npx prisma db push`, not SQL migrations (per `BUILD_LOG.md` session 3).

---

## 3. The design engine — `src/studio/engine/`

### 3.1 `DocSpec`
```
DocSpec {
  size: { w, h, unit: 'mm' | 'px' }
  bleed?: mm            // print assets only
  background?: Paint
  elements: Element[]   // text | rect | line | svg | image | qr
}
```
All print geometry is authored in **mm** and converted once (`mm→pt = ×72/25.4`) inside the PDF renderer. Screen assets are authored in px.

### 3.2 Renderers (`engine/render/`)
| Renderer | Output | Implementation |
|---|---|---|
| `svg.ts` | SVG string | Direct serialisation. Powers browser preview and SVG download. |
| `pdf.ts` | Print PDF | `pdf-lib` + `@pdf-lib/fontkit`. True vector, embedded subset fonts, bleed + crop marks. |
| `raster.ts` | PNG / JPG | Canvas, **client-side only** — matches the repo's existing "no file leaves the browser" file-tool convention. |

### 3.3 Design primitives
- `tokens.ts` — `BrandTokens`: palette, typography, spacing scale, logo spec.
- `palettes.ts` — curated palettes, **WCAG contrast-validated**, tagged by industry and mood.
- `fonts.ts` — curated Google Font pairings with license metadata.
- `marks/` — **parametric SVG marks drawn programmatically** (monogram, geometric, lettermark) from primitives and a seed. No stock icon library ⇒ no licensing exposure, and reproducible.
- `logo.ts` — `composeLogo(tokens, spec)` → SVG. Layouts: horizontal · stacked · icon-only · wordmark. Variants: full colour · mono-dark · mono-light · reversed.

### 3.4 Asset layouts (`engine/layouts/`) — each a pure function → `DocSpec`

| Module | Spec |
|---|---|
| `letterhead.ts` | A4 210×297mm + statutory footer block |
| `envelope.ts` | DL 220×110, C5 229×162, C4 324×229 |
| `business-card.ts` | 89×54mm (India standard) + 3mm bleed |
| `id-card.ts` | CR80 85.6×54mm, portrait & landscape, QR via existing `qrcode` dep |
| `social-post.ts` | 1080², 1080×1350, 1080×1920 story, 1200×630 OG |
| `ad.ts` | 1200×628, 300×250, 728×90, 160×600 |
| `email-signature.ts` | HTML + inline-styled table |

Pure functions ⇒ same unit-test pattern as the 191 existing `tests/compute/*.test.ts`.

---

## 4. Compliance engine — `src/studio/compliance/`

### 4.1 Rule table (India)

| Entity type | Mandatory on business letters / billheads / letterheads / notices | Authority |
|---|---|---|
| Private Limited, Public Limited, OPC | Name · registered office address · **CIN** · contact details if any | Companies Act 2013 **§12(3)(c)** — penalty **₹1,000/day, max ₹1,00,000** |
| LLP | Name · registered office address · **LLPIN** | LLP Act 2008 §21 |
| Partnership / Proprietorship | Name · place of business; **GSTIN** where registered | GST display rules |

### 4.2 Validators
`cin` (21-char structure: listing status · 5-digit industry · 2-char state · 4-digit year · 3-char ownership · 6-digit reg. no) · `gstin` (15-char with **mod-36 checksum**) · `pan` · `llpin`.

### 4.3 API
`validateStationery(brand, docType)` → `{ status: 'pass' | 'warn' | 'fail', findings: Finding[] }`, each `Finding` carrying its statutory citation and penalty exposure. Surfaced as a live compliance panel in the letterhead and envelope editors.

**Every report and every generated document carries an "informational, not legal advice" disclaimer**, consistent with the existing legal-generator convention (`src/tools/compute/legal/shared.ts`).

---

## 5. AI layer — `src/studio/ai/`

| Module | Contract |
|---|---|
| `brand-brief.ts` | name + industry + tone + audience → **3 brand directions**, each = `{ paletteId, fontPairId, markStyle, markSeed, taglines[], rationale }`. Zod-validated; IDs must exist in the registries. |
| `copy.ts` | Social captions, ad headlines, taglines — reuses the server-side prompt-registry pattern of `src/server/ai-prompts.ts`. |

Rate-limited via the existing `src/server/rate-limit.ts`, plus per-plan quotas metered in `UsageCounter`.

---

## 6. Plans & entitlements — `src/studio/plans.ts`

Single source of truth. Every gated action checks it server-side.

| Plan | ₹/mo | ₹/yr | Brands | Print PDF | ID cards | Exports/mo | AI curations/mo | Watermark |
|---|---|---|---|---|---|---|---|---|
| Free | 0 | — | 1 | ✗ | ✗ | 10 | 3 | Yes |
| Launch | 499 | 4,788 | 1 | ✓ | ✗ | 50 | 30 | No |
| Growth | 1,499 | 14,388 | 3 | ✓ | 50 | ∞ | 150 | No |
| Agency | 3,999 | 38,388 | 25 | ✓ | ∞ | ∞ | 600 | No |

---

## 7. Billing — Razorpay

- `src/server/billing/razorpay.ts` — plan + subscription creation, Razorpay Checkout on the client.
- Webhook `src/app/api/studio/webhooks/razorpay/route.ts` — verifies `X-Razorpay-Signature` (HMAC-SHA256 over the raw body against `RAZORPAY_WEBHOOK_SECRET`), handles `subscription.activated | charged | halted | cancelled`. **Raw body must be read before parsing** or the signature check fails.
- **Env-gated**: without `RAZORPAY_KEY_ID`, Studio runs in dev mode — upgrade UI renders, checkout returns 503. Same pattern as the AI key.
- Billing promise from §5 of the GTM doc is a product requirement, not marketing copy: monthly default, renewal reminder 7 days ahead, one-click cancel, no retention dark patterns.

---

## 8. Auth

Auth.js v5 (`next-auth@5`) + `@auth/prisma-adapter` on the existing Mongo database. Email magic link (Resend) + Google OAuth. `proxy.ts` performs optimistic redirects for unauthenticated `/studio/app/**` requests; **authorization is re-checked in every server component and route handler.** On signup, existing `Lead` rows are matched by email for free-tool → paid attribution.

---

## 9. Funnel integration

- Two new free tools added as ordinary `ToolConfig` entries — no new page templates:
  - `letterhead-compliance-checker` (`business-legal`) — the SEO wedge.
  - `brand-color-palette-generator` (`marketing-seo`).
- A Studio CTA variant alongside the existing EBOS CTA in `src/components/lead/cta-block.tsx` for branding-relevant categories.

---

## 10. Definition of done

| Area | Requirement |
|---|---|
| Engine | Every asset type is a pure layout fn → `DocSpec`; no renderer knows about asset types |
| Compliance | Rule table data-driven; validators unit-tested against known-good and known-bad fixtures |
| Entitlements | Every export/AI route calls `assertEntitlement()` server-side |
| Billing | Webhook signature verified; tampered and missing signatures rejected |
| Testing | Pure functions unit-tested in `tests/studio/`; `tsc --noEmit` clean; existing 138 static pages still build |
| Legal | Every compliance output disclaims legal advice |

---

## 11. Verification protocol

1. `npx prisma db push` against a real `DATABASE_URL`; `npm run dev`.
2. Magic-link sign-in → onboarding (Pvt Ltd + CIN) → 3 brand directions → select one.
3. Export: logo SVG/PNG · letterhead PDF · envelope PDF · business card PDF · 5 employee ID cards · one 1080² social post.
4. Open the letterhead PDF; confirm the statutory block renders. Re-run onboarding **without** a CIN; confirm the compliance panel returns `fail` citing §12(3)(c).
5. Confirm free-plan exports are watermarked and PDF export is blocked by `assertEntitlement`.
6. Razorpay test-mode checkout → replay webhook → confirm `Subscription` row and unlocked entitlements.
7. `npx tsc --noEmit` · `npx vitest run` · `npm run build` (existing 138 static pages + new tool wedges must still emit).

---

## 12. Environment variables

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | MongoDB replica set (existing) |
| `AUTH_SECRET` | yes | Auth.js session encryption |
| `AUTH_URL` | prod | Canonical app URL |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Google OAuth; hidden if unset |
| `AUTH_RESEND_KEY` / `EMAIL_FROM` | optional | Magic-link email; sign-in disabled if unset |
| `ANTHROPIC_API_KEY` | optional | AI curation; deterministic fallback if unset |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | optional | Subscriptions; dev mode if unset |
| `NEXT_PUBLIC_EBOS_URL` | existing | EBOS CTA target |
