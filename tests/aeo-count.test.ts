import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { allTools } from "@/tools/registry";

it("count", () => {
  writeFileSync("/tmp/aeo-count.txt", `total=${allTools.length}\n` + allTools.map((t) => `${t.category}/${t.slug}`).join("\n"));
});