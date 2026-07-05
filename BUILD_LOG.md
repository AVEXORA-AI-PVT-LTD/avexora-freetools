# BUILD LOG — freetools.avexora.in

Read this first at the start of every session. Spec: `20_Free_Tools_Growth_Engine_Spec.md`.

## Session 1 — 2026-07-04

### Deviations / decisions
- **Spec file was missing** from the repo at build start. Derived and committed `20_Free_Tools_Growth_Engine_Spec.md` from the project brief (10 categories, 120 tools, tie-in map). If the owner's original spec differs, edit the spec file — the build is config-driven.
- Stack: Next.js 16 (App Router) + TS + Tailwind 4; leads in SQLite via Prisma; PDF/image tools client-side; AI writers via Claude API behind `ANTHROPIC_API_KEY`.
- **PENDING from owner:** `ANTHROPIC_API_KEY` for AI writer tools (pages will render disabled without it); production `DATABASE_URL` if Postgres is wanted; confirmation of EBOS module URLs (`NEXT_PUBLIC_EBOS_URL`, default `https://ebos.avexora.in`).

### Built
- Milestone 1: scaffold (Next 16, Tailwind 4, Prisma 6, vitest, zod, pdf-lib, qrcode) + derived spec + this log.
- Milestone 2 (Tool Engine core): `src/tools/types.ts` (4 shapes), per-category configs + server registry + per-category client dynamic loaders, shape renderers in `src/components/tool-shapes/`, homepage w/ search, category hubs, tool page route. Proven with 5 pilot tools covering all 4 shapes: gst-calculator, word-counter (calculator), invoice-generator (generator + custom component + email gate), merge-pdf (file-tool, client-side pdf-lib), ai-blog-outline-generator (ai-writer).
- Milestone 3 (Lead Capture Engine): Prisma `Lead` model (SQLite, migration `20260705063106_init`), `POST /api/leads` (zod + honeypot + in-memory rate limit), email-gate modal (localStorage one-time unlock, GateProvider context for custom components), newsletter block, EBOS CTA block with UTM attribution + cta_click logging. **Verified via curl against prod server: email_gate + cta_click rows landed in SQLite, honeypot silently dropped, missing email 400s.**
- Milestone 4 (SEO Engine): per-tool generateMetadata (title/description/canonical/OG/Twitter), JSON-LD (SoftwareApplication + FAQPage + BreadcrumbList), sitemap.ts (16 URLs), robots.ts, breadcrumbs, related-tools + category-chip internal linking. **Verified via curl: title, canonical, JSON-LD, CTA UTM params all present in rendered HTML.**
- AI route: `/api/ai` streams via @anthropic-ai/sdk (`client.messages.stream`), server-side prompt registry (`src/server/ai-prompts.ts`), per-IP rate limit, 503 + disabled UI state when ANTHROPIC_API_KEY is absent. Default model `claude-opus-4-8`, override with `AI_MODEL` env var (owner may prefer a cheaper model for free public tools — decide before launch).
- Evidence this session: `npm test` 11/11 green; `npm run build` statically generated all 5 tool pages + 10 category hubs + home + sitemap + robots.

### Deviations (technical)
- Prisma pinned to v6 (v7 moved connection URLs out of schema files to a new adapter config; v6 is the stable documented path for SQLite).

### Pending
- Milestone 5: tool build-out via parallel subagents (5/120 done — the pilots). Next: Finance calculators (14 remaining), then Text & Data (10 remaining), then the rest by category.
- Owner inputs still needed: ANTHROPIC_API_KEY (AI writers render disabled without it), production DATABASE_URL if not SQLite, confirmation of EBOS module URLs.
