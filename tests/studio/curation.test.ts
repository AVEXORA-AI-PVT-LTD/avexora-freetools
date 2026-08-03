import { describe, expect, it } from "vitest";

import {
  aiEnabled,
  generateDirections,
  heuristicDirections,
  paletteSummary,
  type BrandBrief,
} from "@/studio/ai/brand-brief";
import { resolveTokens } from "@/studio/engine/tokens";
import { composeLogo } from "@/studio/engine/logo";
import { letterheadSpec } from "@/studio/engine/layouts/letterhead";
import { renderSvg } from "@/studio/engine/render/svg";
import { PALETTE_IDS } from "@/studio/engine/palettes";
import { FONT_PAIR_IDS } from "@/studio/engine/fonts";
import { MARK_STYLES } from "@/studio/engine/marks";
import type { ComplianceInput } from "@/studio/compliance/india";

/**
 * Brand curation (spec 22 §5).
 *
 * The heuristic path is not a corner case — with no ANTHROPIC_API_KEY set it is
 * *the* path, and it produces the first three directions every new user sees.
 * It gets the same scrutiny as the AI path.
 *
 * The load-bearing property throughout is that a direction is always
 * **renderable**: whatever curation returns must survive `resolveTokens` and
 * come out the other side as real artwork.
 */

const BRIEF: BrandBrief = {
  name: "Northwind Labs",
  industry: "technology",
  description: "Warehouse automation for mid-sized Indian retailers",
  tone: ["modern", "trustworthy"],
  audience: "Operations heads at retail chains",
};

const BRAND: ComplianceInput = {
  entityType: "pvt-ltd",
  name: "Northwind Labs",
  legalName: "Northwind Labs Private Limited",
  cin: "U72900KA2021PTC145678",
  registeredAddress: "4th Floor, Prestige Tower, MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

/** Curation output → the tokens the engine actually consumes. */
const tokensFor = (d: ReturnType<typeof heuristicDirections>[number]) =>
  resolveTokens({ name: BRIEF.name }, d);

describe("heuristic directions", () => {
  it("always returns three", () => {
    expect(heuristicDirections(BRIEF)).toHaveLength(3);
  });

  it("only ever names ids that exist in the registries", () => {
    for (const d of heuristicDirections(BRIEF)) {
      expect(PALETTE_IDS).toContain(d.paletteId);
      expect(FONT_PAIR_IDS).toContain(d.fontPairId);
      expect(MARK_STYLES).toContain(d.markStyle);
    }
  });

  it("offers a real choice rather than three shades of one idea", () => {
    const directions = heuristicDirections(BRIEF);
    expect(new Set(directions.map((d) => d.paletteId)).size).toBe(3);
    expect(new Set(directions.map((d) => d.markStyle)).size).toBe(3);
  });

  it("renders: every direction produces a logo and a full letterhead", () => {
    for (const d of heuristicDirections(BRIEF)) {
      const tokens = tokensFor(d);

      const logo = composeLogo(tokens, { variant: "full" });
      expect(logo.content.length).toBeGreaterThan(0);
      expect(logo.width).toBeGreaterThan(0);
      expect(logo.height).toBeGreaterThan(0);

      const svg = renderSvg(letterheadSpec(tokens, BRAND, { showBodyPlaceholder: false }));
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).not.toContain("NaN");
      // The statutory footer survives whatever palette and pairing were picked.
      expect(svg).toContain("U72900KA2021PTC145678");
    }
  });

  it("is deterministic — the same brief yields byte-identical directions", () => {
    expect(heuristicDirections(BRIEF)).toEqual(heuristicDirections(BRIEF));
  });

  it("gives different companies different marks", () => {
    const other = heuristicDirections({ ...BRIEF, name: "Coromandel Foods" });
    const mine = heuristicDirections(BRIEF);
    expect(other.map((d) => d.markSeed)).not.toEqual(mine.map((d) => d.markSeed));

    // Different seed must actually change the artwork, not just the number.
    expect(composeLogo(tokensFor(other[1]), { variant: "full" }).content).not.toBe(
      composeLogo(tokensFor(mine[1]), { variant: "full" }).content,
    );
  });

  it("writes taglines that are usable as-is", () => {
    for (const d of heuristicDirections(BRIEF)) {
      expect(d.taglines.length).toBeGreaterThan(0);
      for (const tagline of d.taglines) {
        expect(tagline.trim()).toBe(tagline);
        expect(tagline.length).toBeLessThanOrEqual(80);
        expect(tagline).not.toMatch(/undefined|NaN|\[object/);
      }
      expect(d.rationale.length).toBeGreaterThan(0);
      expect(d.label.length).toBeGreaterThan(0);
    }
  });

  it("survives a brief with nothing but a name", () => {
    const bare = heuristicDirections({ name: "Ess", industry: "", tone: [] });
    expect(bare).toHaveLength(3);
    for (const d of bare) {
      expect(PALETTE_IDS).toContain(d.paletteId);
      expect(d.rationale).not.toContain("undefined");
      expect(composeLogo(tokensFor(d), { variant: "full" }).content.length).toBeGreaterThan(0);
    }
  });

  it("handles a name that yields no usable initials", () => {
    const odd = heuristicDirections({ name: "Pvt Ltd", industry: "retail", tone: [] });
    expect(odd).toHaveLength(3);
    expect(composeLogo(tokensFor(odd[0]), { variant: "full" }).content.length).toBeGreaterThan(0);
  });
});

describe("generateDirections", () => {
  it("uses the heuristic path when no API key is configured", async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(aiEnabled()).toBe(false);
      const result = await generateDirections(BRIEF);
      expect(result.source).toBe("heuristic");
      expect(result.directions).toHaveLength(3);
      expect(result.directions).toEqual(heuristicDirections(BRIEF));
    } finally {
      if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = previous;
    }
  });

  it("degrades to the heuristic path rather than throwing when the API fails", async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    // A syntactically valid but unusable key: the SDK constructs, the call fails.
    process.env.ANTHROPIC_API_KEY = "sk-ant-invalid-key-for-test";
    process.env.ANTHROPIC_BASE_URL = "http://127.0.0.1:1/never-listening";
    try {
      const result = await generateDirections(BRIEF);
      expect(result.source).toBe("heuristic");
      expect(result.directions).toHaveLength(3);
    } finally {
      delete process.env.ANTHROPIC_BASE_URL;
      if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = previous;
    }
  }, 20_000);
});

describe("paletteSummary", () => {
  it("returns three swatches for a known palette", () => {
    const summary = paletteSummary(PALETTE_IDS[0]);
    expect(summary.id).toBe(PALETTE_IDS[0]);
    expect(summary.swatches).toHaveLength(3);
    for (const swatch of summary.swatches) {
      expect(swatch).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("falls back rather than returning undefined for an unknown id", () => {
    const summary = paletteSummary("no-such-palette");
    expect(PALETTE_IDS).toContain(summary.id);
    expect(summary.swatches).toHaveLength(3);
  });
});
