import { describe, expect, it } from "vitest";
import { PALETTES, auditPalette, rankPalettes } from "@/studio/engine/palettes";
import { FONT_PAIRS, rankFontPairs } from "@/studio/engine/fonts";
import { MARK_STYLES, generateMark, initialsFor, seedFrom } from "@/studio/engine/marks";
import { resolveTokens } from "@/studio/engine/tokens";
import { LOGO_LAYOUTS, LOGO_VARIANTS, composeLogo } from "@/studio/engine/logo";
import { bleedBox, mmToPt } from "@/studio/engine/doc-spec";
import { renderSvg } from "@/studio/engine/render/svg";
import { renderPdf } from "@/studio/engine/render/pdf";
import { parseSvgSubset } from "@/studio/engine/render/svg-subset";
import { wrapText } from "@/studio/engine/render/text-layout";
import { qrSvg, vCard } from "@/studio/engine/qr";
import { letterheadSpec } from "@/studio/engine/layouts/letterhead";
import { envelopeSpec } from "@/studio/engine/layouts/envelope";
import { businessCardSpec } from "@/studio/engine/layouts/business-card";
import { idCardBatch, idCardSpec } from "@/studio/engine/layouts/id-card";
import { socialPostSpec } from "@/studio/engine/layouts/social-post";
import { emailSignatureHtml } from "@/studio/engine/layouts/email-signature";
import { contrastRatio } from "@/studio/engine/color";
import type { ComplianceInput } from "@/studio/compliance/india";

const brand: ComplianceInput = {
  entityType: "pvt-ltd",
  name: "Northwind Labs",
  legalName: "Northwind Labs Private Limited",
  cin: "U72900KA2020PTC123456",
  gstin: "29AAGCB7383J1Z4",
  registeredAddress: "4th Floor, Mistry Building, Residency Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560025",
  phone: "+91 80 4123 9000",
  email: "hello@northwindlabs.in",
};

const tokens = resolveTokens(
  { name: brand.name, legalName: brand.legalName!, tagline: "Systems that scale" },
  { paletteId: "indigo-slate", fontPairId: "space-inter", markStyle: "monogram", markSeed: 42 },
);

describe("palettes", () => {
  it.each(PALETTES.map((p) => [p.id, p] as const))(
    "%s meets the contrast contract",
    (_id, palette) => {
      expect(auditPalette(palette)).toEqual([]);
    },
  );

  it("keeps body text readable on the page surface", () => {
    for (const p of PALETTES) {
      expect(contrastRatio(p.ink, p.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("has unique ids", () => {
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(PALETTES.length);
  });

  it("ranks by industry then mood, deterministically", () => {
    const a = rankPalettes("finance", ["trustworthy"]).map((p) => p.id);
    const b = rankPalettes("finance", ["trustworthy"]).map((p) => p.id);
    expect(a).toEqual(b);
    expect(a.length).toBe(PALETTES.length);
  });
});

describe("fonts", () => {
  it("has unique ids and a full ranking", () => {
    expect(new Set(FONT_PAIRS.map((f) => f.id)).size).toBe(FONT_PAIRS.length);
    expect(rankFontPairs(["modern"]).length).toBe(FONT_PAIRS.length);
  });
});

describe("marks", () => {
  it("derives initials, ignoring entity suffixes", () => {
    expect(initialsFor("Northwind Labs Private Limited")).toBe("NL");
    expect(initialsFor("Zeta")).toBe("ZE");
    expect(initialsFor("Acme Pvt Ltd")).toBe("AC");
    expect(initialsFor("")).toBe("A");
  });

  it.each(MARK_STYLES)("generates %s deterministically", (style) => {
    const input = {
      style,
      seed: 7,
      initials: "NL",
      palette: PALETTES[0],
    };
    const first = generateMark(input);
    const second = generateMark(input);
    expect(first.content).toBe(second.content);
    expect(first.content.length).toBeGreaterThan(0);
    expect(first.viewBox).toBe("0 0 100 100");
  });

  it("produces different marks for different seeds", () => {
    const base = { style: "geometric" as const, initials: "NL", palette: PALETTES[0] };
    const a = generateMark({ ...base, seed: 1 });
    const b = generateMark({ ...base, seed: 999 });
    expect(a.content).not.toBe(b.content);
  });

  it("derives a stable seed from a name", () => {
    expect(seedFrom("Northwind Labs")).toBe(seedFrom("Northwind Labs"));
    expect(seedFrom("Northwind Labs")).not.toBe(seedFrom("Southwind Labs"));
  });

  it("escapes XML-significant characters in initials", () => {
    const mark = generateMark({
      style: "monogram",
      seed: 1,
      initials: "<&",
      palette: PALETTES[0],
    });
    expect(mark.content).not.toContain("<&");
    expect(mark.content).toContain("&lt;&amp;");
  });
});

describe("logo", () => {
  it("is byte-identical for identical inputs", () => {
    expect(composeLogo(tokens).svg).toBe(composeLogo(tokens).svg);
  });

  it.each(LOGO_LAYOUTS)("renders the %s layout with a positive viewBox", (layout) => {
    const logo = composeLogo(tokens, { layout });
    expect(logo.width).toBeGreaterThan(0);
    expect(logo.height).toBeGreaterThan(0);
    expect(logo.svg.startsWith("<svg")).toBe(true);
  });

  it.each(LOGO_VARIANTS)("renders the %s variant", (variant) => {
    const logo = composeLogo(tokens, { variant });
    expect(logo.svg).toContain("<svg");
  });

  it("paints a background only on the reversed variant", () => {
    expect(composeLogo(tokens, { variant: "reversed" }).content).toContain(
      tokens.palette.primary,
    );
    expect(composeLogo(tokens, { variant: "mono-dark" }).content).not.toContain(
      "<rect x=\"0\" y=\"0\"",
    );
  });

  it("omits the tagline when the brand has none", () => {
    const bare = resolveTokens(
      { name: "Northwind Labs" },
      { paletteId: "indigo-slate", fontPairId: "space-inter", markStyle: "monogram", markSeed: 42 },
    );
    expect(composeLogo(bare).content).not.toContain("SYSTEMS THAT SCALE");
    expect(composeLogo(tokens).content).toContain("SYSTEMS THAT SCALE");
  });
});

describe("DocSpec geometry", () => {
  it("converts mm to points at 72/25.4", () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 6);
    expect(mmToPt(210)).toBeCloseTo(595.276, 3);
  });

  it("expands the bleed box on all four edges", () => {
    const spec = businessCardSpec(tokens, brand, { holder: { name: "A" } });
    expect(spec.size).toEqual({ w: 89, h: 54, unit: "mm" });
    expect(spec.bleed).toBe(3);
    expect(bleedBox(spec)).toEqual({ w: 95, h: 60, unit: "mm" });
  });

  it("uses CR80 for ID cards in both orientations", () => {
    const landscape = idCardSpec(tokens, brand, {
      employee: { name: "R Iyer" },
      orientation: "landscape",
    });
    const portrait = idCardSpec(tokens, brand, {
      employee: { name: "R Iyer" },
      orientation: "portrait",
    });
    expect([landscape.size.w, landscape.size.h]).toEqual([85.6, 54]);
    expect([portrait.size.w, portrait.size.h]).toEqual([54, 85.6]);
  });
});

describe("text wrapping", () => {
  const style = { fontFamily: "Inter", fontSize: 10, color: "#000", wrap: true };

  it("honours hard newlines", () => {
    expect(wrapText("one\ntwo", style, 1000)).toEqual(["one", "two"]);
  });

  it("wraps to the given width", () => {
    const lines = wrapText("the quick brown fox jumps over the lazy dog", style, 60);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("breaks a single word that cannot fit rather than overflowing", () => {
    const lines = wrapText("supercalifragilisticexpialidocious", style, 30);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("uppercases when the style asks for it", () => {
    expect(wrapText("abc", { ...style, transform: "uppercase" }, 1000)).toEqual(["ABC"]);
  });
});

describe("letterhead", () => {
  it("prints the statutory particulars when they exist", () => {
    const svg = renderSvg(letterheadSpec(tokens, brand, { showBodyPlaceholder: false }));
    expect(svg).toContain("U72900KA2020PTC123456");
    expect(svg).toContain("Northwind Labs Private Limited");
    expect(svg).toContain("Registered office");
  });

  it("omits the CIN line entirely when the brand has no CIN", () => {
    const noCin = { ...brand, cin: undefined };
    const svg = renderSvg(letterheadSpec(tokens, noCin, { showBodyPlaceholder: false }));
    expect(svg).not.toContain("CIN:");
  });

  it("is A4", () => {
    const spec = letterheadSpec(tokens, brand);
    expect(spec.size).toEqual({ w: 210, h: 297, unit: "mm" });
  });

  it("escapes brand names containing markup", () => {
    const evil = { ...brand, legalName: 'Evil <script>alert("x")</script> Ltd' };
    const svg = renderSvg(letterheadSpec(tokens, evil, { showBodyPlaceholder: false }));
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });
});

describe("envelope", () => {
  it.each([
    ["dl", 220, 110],
    ["c5", 229, 162],
    ["c4", 324, 229],
  ] as const)("sizes %s at %i × %i mm", (size, w, h) => {
    const spec = envelopeSpec(tokens, brand, { size });
    expect(spec.size.w).toBe(w);
    expect(spec.size.h).toBe(h);
    expect(spec.cropMarks).toBe(true);
  });
});

describe("social posts", () => {
  it("uses the requested pixel format", () => {
    const spec = socialPostSpec(tokens, brand, {
      headline: "We're hiring",
      format: "story",
    });
    expect(spec.size).toEqual({ w: 1080, h: 1920, unit: "px" });
    expect(spec.bleed).toBeUndefined();
  });

  it("shrinks a long headline to fit rather than overflowing", () => {
    const LONG =
      "An extremely long headline that would never fit at the default type size and therefore has to be reduced substantially by the fitting loop";
    const SHORT = "Hi";

    /** Font size of the text element carrying exactly `headline`. */
    const headlineSize = (headline: string) => {
      const spec = socialPostSpec(tokens, brand, {
        headline,
        format: "displayMedRect",
      });
      const el = spec.elements.find(
        (e) => e.kind === "text" && e.text === headline,
      );
      expect(el).toBeDefined();
      return el!.kind === "text" ? el!.style.fontSize : 0;
    };

    expect(headlineSize(LONG)).toBeLessThan(headlineSize(SHORT));
  });

  it("renders every declared format", () => {
    for (const format of [
      "square",
      "portrait",
      "story",
      "og",
      "metaFeed",
      "displayMedRect",
      "displayLeaderboard",
      "displaySkyscraper",
    ] as const) {
      const svg = renderSvg(
        socialPostSpec(tokens, brand, { headline: "Launch day", cta: "Get started", format }),
      );
      expect(svg.startsWith("<svg")).toBe(true);
    }
  });
});

describe("QR codes", () => {
  it("produces a square vector QR with a quiet zone", () => {
    const qr = qrSvg("https://avexora.in", { margin: 4 });
    const [, , w, h] = qr.viewBox.split(" ").map(Number);
    expect(w).toBe(h);
    expect(w).toBe(qr.modules);
    expect(qr.content).toContain("<path");
  });

  it("is deterministic", () => {
    expect(qrSvg("abc").content).toBe(qrSvg("abc").content);
  });

  it("builds a vCard payload", () => {
    const card = vCard({ name: "R Iyer", organisation: "Northwind Labs", email: "r@nw.in" });
    expect(card).toContain("BEGIN:VCARD");
    expect(card).toContain("FN:R Iyer");
    expect(card).toContain("END:VCARD");
  });
});

describe("SVG subset parser", () => {
  it("flattens nested group transforms", () => {
    const nodes = parseSvgSubset(
      '<g transform="translate(10, 20) scale(2)"><rect x="1" y="1" width="4" height="4" fill="#000"/></g>',
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0].transform).toEqual({ tx: 10, ty: 20, sx: 2, sy: 2 });
  });

  it("converts polygons to paths", () => {
    const nodes = parseSvgSubset('<polygon points="0,0 10,0 5,10" fill="#f00"/>');
    expect(nodes[0].kind).toBe("path");
    expect(nodes[0].kind === "path" && nodes[0].d).toBe("M 0 0 L 10 0 L 5 10 Z");
  });

  it("reads text content, baseline and anchor", () => {
    const nodes = parseSvgSubset(
      '<text x="5" y="6" font-size="20" text-anchor="middle" dominant-baseline="central" fill="#fff">AB</text>',
    );
    expect(nodes[0]).toMatchObject({
      kind: "text",
      text: "AB",
      fontSize: 20,
      anchor: "middle",
      baseline: "central",
    });
  });

  it("unescapes XML entities in text", () => {
    const nodes = parseSvgSubset('<text x="0" y="0">A&amp;B</text>');
    expect(nodes[0].kind === "text" && nodes[0].text).toBe("A&B");
  });

  it("skips elements it does not understand rather than guessing", () => {
    expect(parseSvgSubset('<foreignObject x="0"/>')).toEqual([]);
  });

  it("parses every mark style the generator emits", () => {
    for (const style of MARK_STYLES) {
      const mark = generateMark({ style, seed: 3, initials: "NL", palette: PALETTES[0] });
      expect(parseSvgSubset(mark.content).length).toBeGreaterThan(0);
    }
  });
});

describe("PDF rendering", () => {
  const isPdf = (bytes: Uint8Array) =>
    new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";

  it("renders a letterhead to a valid PDF", async () => {
    const bytes = await renderPdf(letterheadSpec(tokens, brand));
    expect(isPdf(bytes)).toBe(true);
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("renders a business card at the bleed size in points", async () => {
    const spec = businessCardSpec(tokens, brand, {
      holder: { name: "R Iyer", designation: "Head of Ops", phone: "+91 98860 00000" },
    });
    const bytes = await renderPdf(spec);
    expect(isPdf(bytes)).toBe(true);
  });

  it("renders an ID card batch as one page per side", async () => {
    const specs = idCardBatch(tokens, brand, [
      { name: "R Iyer", designation: "Head of Ops", empCode: "NW-001", bloodGroup: "O+" },
      { name: "S Kulkarni", designation: "Engineer", empCode: "NW-002" },
    ]);
    expect(specs).toHaveLength(4);
    const bytes = await renderPdf(specs);
    expect(isPdf(bytes)).toBe(true);
  });

  it("renders a pixel-authored social post", async () => {
    const bytes = await renderPdf(
      socialPostSpec(tokens, brand, { headline: "We're hiring", cta: "Apply now" }),
    );
    expect(isPdf(bytes)).toBe(true);
  });

  it("renders every envelope size", async () => {
    for (const size of ["dl", "c5", "c4"] as const) {
      const bytes = await renderPdf(envelopeSpec(tokens, brand, { size }));
      expect(isPdf(bytes)).toBe(true);
    }
  });
});

describe("email signature", () => {
  it("includes the holder, an embedded logo and the statutory block", () => {
    const html = emailSignatureHtml(tokens, brand, {
      name: "R Iyer",
      designation: "Head of Ops",
      email: "r@northwindlabs.in",
    });
    expect(html).toContain("R Iyer");
    expect(html).toContain("data:image/svg+xml");
    expect(html).toContain("U72900KA2020PTC123456");
    expect(html).toContain("mailto:r@northwindlabs.in");
  });

  it("can omit the statutory block", () => {
    const html = emailSignatureHtml(
      tokens,
      brand,
      { name: "R Iyer" },
      { includeStatutory: false },
    );
    expect(html).not.toContain("U72900KA2020PTC123456");
  });
});
