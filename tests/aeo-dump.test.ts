import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { allTools } from "@/tools/registry";

it("dump full", () => {
  const out = allTools.map((t) => ({
    slug: t.slug,
    category: t.category,
    kind: t.kind,
    name: t.name,
    tagline: t.tagline,
    seoDescription: t.seoDescription,
    about: t.about,
    faq: t.faq,
    related: t.related,
    ...("fields" in t ? { fields: t.fields?.map((f) => ({ name: f.name, label: f.label, type: f.type, unit: f.unit })) } : {}),
    ...("submitLabel" in t && t.submitLabel ? { submitLabel: t.submitLabel } : {}),
  }));
  writeFileSync("/tmp/aeo-tools.json", JSON.stringify(out, null, 1));
});