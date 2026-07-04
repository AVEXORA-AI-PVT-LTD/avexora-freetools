# BUILD LOG — freetools.avexora.in

Read this first at the start of every session. Spec: `20_Free_Tools_Growth_Engine_Spec.md`.

## Session 1 — 2026-07-04

### Deviations / decisions
- **Spec file was missing** from the repo at build start. Derived and committed `20_Free_Tools_Growth_Engine_Spec.md` from the project brief (10 categories, 120 tools, tie-in map). If the owner's original spec differs, edit the spec file — the build is config-driven.
- Stack: Next.js 16 (App Router) + TS + Tailwind 4; leads in SQLite via Prisma; PDF/image tools client-side; AI writers via Claude API behind `ANTHROPIC_API_KEY`.
- **PENDING from owner:** `ANTHROPIC_API_KEY` for AI writer tools (pages will render disabled without it); production `DATABASE_URL` if Postgres is wanted; confirmation of EBOS module URLs (`NEXT_PUBLIC_EBOS_URL`, default `https://ebos.avexora.in`).

### Built
- Milestone 1: scaffold (Next 16, Tailwind 4, Prisma, vitest, zod, pdf-lib, qrcode) + derived spec + this log.

### Pending
- Milestone 2: Tool Engine core + pilot tools (gst-calculator, word-counter, invoice-generator)
- Milestone 3: Lead Capture Engine
- Milestone 4: SEO Engine
- Milestone 5: 120-tool build-out (0/120 done)
