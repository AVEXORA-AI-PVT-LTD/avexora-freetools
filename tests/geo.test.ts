import { describe, it, expect } from "vitest";
import { GET as getLlmsTxt } from "../src/app/llms.txt/route";
import { allTools, toolsByCategory } from "../src/tools/registry";
import { categories, SITE_NAME, SITE_URL } from "../src/tools/categories";

const OLD_DOMAIN = "avextools.avexora.in";

describe("§ GEO acceptance: llms.txt", () => {
  it("llms.txt generates successfully and contains correct brand", async () => {
    const res = await getLlmsTxt();
    expect(res.status).toBe(200);
    const text = await res.text();

    // Check Brand entity
    expect(text).toContain(`# ${SITE_NAME}`);

    // Check the canonical origin is declared
    expect(text).toContain(`Site: ${SITE_URL}`);

    // Check old domain regression
    expect(text).not.toContain(OLD_DOMAIN);

    // Check category headings exist (only non-empty categories are emitted)
    for (const cat of categories) {
      if ((toolsByCategory[cat.slug] ?? []).length === 0) continue;
      expect(text).toContain(`## ${cat.name}`);
    }

    // Check tools exist (standard llms.txt list syntax: - [Name](URL): tagline)
    for (const tool of allTools) {
      expect(text).toContain(`- [${tool.name}](${SITE_URL}/${tool.category}/${tool.slug}): ${tool.tagline}`);
    }
  });
});