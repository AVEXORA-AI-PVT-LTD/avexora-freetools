import { describe, it, expect } from "vitest";
import { GET as getLlmsTxt } from "../src/app/llms.txt/route";
import { allTools } from "../src/tools/registry";
import { categories, SITE_URL } from "../src/tools/categories";

const OLD_DOMAIN = "avextools.avexora.in";

describe("§ GEO acceptance: llms.txt", () => {
  it("llms.txt generates successfully and contains correct brand", async () => {
    const res = await getLlmsTxt();
    expect(res.status).toBe(200);
    const text = await res.text();
    
    // Check Brand entity
    expect(text).toContain("Avexora Tools, by Avexora");
    
    // Check old domain regression
    expect(text).not.toContain(OLD_DOMAIN);
    
    // Check categories exist as section headers
    for (const cat of categories) {
      expect(text).toContain(`## ${cat.name}`);
    }

    // Check tools exist as linked, tagged entries
    for (const tool of allTools) {
      expect(text).toContain(`[${tool.name}](${SITE_URL}/${tool.category}/${tool.slug}): ${tool.tagline}`);
    }
  });
});
