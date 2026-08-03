import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { resolveTokens } from "@/studio/engine/tokens";
import { MM_TO_PT } from "@/studio/engine/doc-spec";
import { renderPdf } from "@/studio/engine/render/pdf";
import { renderSvg } from "@/studio/engine/render/svg";
import { composeLogo, LOGO_VARIANTS } from "@/studio/engine/logo";
import { letterheadSpec } from "@/studio/engine/layouts/letterhead";
import { envelopeSpec } from "@/studio/engine/layouts/envelope";
import { businessCardSpec } from "@/studio/engine/layouts/business-card";
import { idCardBatch } from "@/studio/engine/layouts/id-card";
import { socialPostSpec } from "@/studio/engine/layouts/social-post";
import type { ComplianceInput } from "@/studio/compliance/india";

/**
 * End-to-end export tests: every asset the product sells, rendered through the
 * real pipeline, asserted against the actual PDF bytes.
 *
 * The other engine tests assert on `DocSpec` — the plan. These assert on the
 * artifact, which is what a customer sends to a press. They catch a whole class
 * of defect the spec-level tests cannot: a page sized in the wrong unit, a
 * statutory line that silently didn't make it into the content stream, or text
 * that stopped being real text.
 */

const BRAND: ComplianceInput = {
  entityType: "pvt-ltd",
  name: "Northwind Labs",
  legalName: "Northwind Labs Private Limited",
  cin: "U72900KA2021PTC145678",
  gstin: "29AAGCB7383J1Z4",
  pan: "AAGCB7383J",
  registeredAddress: "4th Floor, Prestige Tower, MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  phone: "+91 80 4567 8900",
  email: "hello@northwind.in",
};

const TOKENS = resolveTokens(
  { name: BRAND.name, legalName: BRAND.legalName ?? undefined, tagline: "Ship it right" },
  {
    paletteId: "indigo-slate",
    fontPairId: "inter-inter",
    markStyle: "monogram",
    logoLayout: "horizontal",
  },
);

// --- PDF introspection helpers ---------------------------------------------

/**
 * Inflate every Flate-encoded stream in a PDF and concatenate them. pdf-lib
 * compresses content streams, so the drawing operators are only visible after
 * this.
 */
function inflateStreams(bytes: Uint8Array): string {
  const buf = Buffer.from(bytes);
  const out: string[] = [];
  let cursor = 0;

  for (;;) {
    const at = buf.indexOf("stream", cursor, "latin1");
    if (at < 0) break;
    // Skip the tail of an "endstream" keyword.
    if (at >= 3 && buf.subarray(at - 3, at).toString("latin1") === "end") {
      cursor = at + 6;
      continue;
    }
    let start = at + 6;
    if (buf[start] === 0x0d) start += 1;
    if (buf[start] === 0x0a) start += 1;
    const end = buf.indexOf("endstream", start, "latin1");
    if (end < 0) break;
    try {
      out.push(inflateSync(buf.subarray(start, end)).toString("latin1"));
    } catch {
      // Not Flate (embedded font programs, object streams we don't need).
    }
    cursor = end + 9;
  }
  return out.join("\n");
}

/**
 * Pull the strings that PDF text-showing operators draw. pdf-lib writes the
 * standard-14 fonts as hex strings, so both forms have to be handled.
 */
function pdfText(bytes: Uint8Array): string {
  const content = inflateStreams(bytes);
  const shown: string[] = [];
  const re = /(?:\(((?:[^()\\]|\\.)*)\)|<([0-9A-Fa-f\s]*)>)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match[1] !== undefined) {
      shown.push(match[1].replace(/\\([()\\])/g, "$1"));
    } else {
      const hex = match[2].replace(/\s+/g, "");
      shown.push(Buffer.from(hex, "hex").toString("latin1"));
    }
  }
  return shown.join("\n");
}

async function pageSizes(bytes: Uint8Array) {
  // updateMetadata:false — otherwise pdf-lib stamps its own Producer over ours
  // on load, and the metadata assertions would test pdf-lib, not the renderer.
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  return pdf.getPages().map((p) => ({
    w: Math.round(p.getWidth() * 100) / 100,
    h: Math.round(p.getHeight() * 100) / 100,
  }));
}

const pt = (mm: number) => Math.round(mm * MM_TO_PT * 100) / 100;

// --- tests ------------------------------------------------------------------

describe("letterhead export", () => {
  it("renders one A4 page at the exact ISO size", async () => {
    const bytes = await renderPdf([
      letterheadSpec(TOKENS, BRAND, { showBodyPlaceholder: false }),
    ]);
    expect(await pageSizes(bytes)).toEqual([{ w: pt(210), h: pt(297) }]);
  });

  it("puts the statutory particulars into the page as real, selectable text", async () => {
    const bytes = await renderPdf([
      letterheadSpec(TOKENS, BRAND, { showBodyPlaceholder: false }),
    ]);
    const text = pdfText(bytes);

    // s.12(3)(c) requires all three on a business letter.
    expect(text).toContain("Northwind Labs Private Limited");
    expect(text).toContain("U72900KA2021PTC145678");
    expect(text).toContain("Prestige Tower");
    expect(text).toContain("560001");
  });

  it("still produces a valid page when the CIN is missing", async () => {
    // The compliance panel is what fails here — the renderer must not.
    const bytes = await renderPdf([
      letterheadSpec(TOKENS, { ...BRAND, cin: null }, { showBodyPlaceholder: false }),
    ]);
    const text = pdfText(bytes);
    expect(await pageSizes(bytes)).toHaveLength(1);
    expect(text).toContain("Northwind Labs Private Limited");
    expect(text).not.toContain("U72900KA2021PTC145678");
  });

  it("renders every variant without dropping the footer", async () => {
    for (const variant of ["classic", "band", "sidebar"] as const) {
      const bytes = await renderPdf([
        letterheadSpec(TOKENS, BRAND, { variant, showBodyPlaceholder: false }),
      ]);
      expect(pdfText(bytes), variant).toContain("U72900KA2021PTC145678");
    }
  });
});

describe("visiting card export", () => {
  it("renders front and back at 89 × 54 mm plus 3 mm bleed on every edge", async () => {
    const holder = {
      name: "Ananya Rao",
      designation: "Head of Operations",
      phone: "+91 98450 12345",
      email: "ananya@northwind.in",
    };
    const bytes = await renderPdf([
      businessCardSpec(TOKENS, BRAND, { holder, side: "front" }),
      businessCardSpec(TOKENS, BRAND, { holder, side: "back" }),
    ]);

    const expected = { w: pt(89 + 6), h: pt(54 + 6) };
    expect(await pageSizes(bytes)).toEqual([expected, expected]);
    expect(pdfText(bytes)).toContain("Ananya Rao");
  });
});

describe("envelope export", () => {
  it.each([
    ["dl", 220, 110],
    ["c5", 229, 162],
    ["c4", 324, 229],
  ] as const)("renders %s at %d × %d mm plus bleed", async (size, w, h) => {
    const bytes = await renderPdf([envelopeSpec(TOKENS, BRAND, { size })]);
    expect(await pageSizes(bytes)).toEqual([{ w: pt(w + 6), h: pt(h + 6) }]);
  });
});

describe("employee ID card export", () => {
  const employees = [
    { name: "Ananya Rao", designation: "Head of Operations", empCode: "NWL-004", bloodGroup: "O+" },
    { name: "Rahul Menon", designation: "Backend Engineer", empCode: "NWL-011", bloodGroup: "B+" },
  ];

  it("emits a front and a back per employee at CR80", async () => {
    const specs = idCardBatch(TOKENS, BRAND, employees, { orientation: "portrait" });
    const bytes = await renderPdf(specs);
    const sizes = await pageSizes(bytes);

    expect(sizes).toHaveLength(employees.length * 2);
    // Portrait CR80 is the ID-1 card turned on its end.
    for (const size of sizes) {
      expect(size).toEqual({ w: pt(54 + 6), h: pt(85.6 + 6) });
    }

    const text = pdfText(bytes);
    for (const employee of employees) {
      expect(text).toContain(employee.name);
      expect(text).toContain(employee.empCode);
    }
    // The reverse carries the return-to-office block.
    expect(text).toContain("Authorised signatory");
  });

  it("skips the reverse when the caller asks for fronts only", async () => {
    const specs = idCardBatch(TOKENS, BRAND, employees, { includeBack: false });
    expect(await pageSizes(await renderPdf(specs))).toHaveLength(employees.length);
  });
});

describe("logo pack export", () => {
  it("renders one page per variant and keeps the mark vector", async () => {
    const specs = LOGO_VARIANTS.map((variant) => {
      const logo = composeLogo(TOKENS, { variant });
      const width = 160;
      const height = (logo.height / logo.width) * width;
      return {
        size: { w: width, h: height + 20, unit: "mm" as const },
        elements: [
          {
            kind: "svg" as const,
            x: 10,
            y: 10,
            w: width - 20,
            h: height,
            viewBox: logo.viewBox,
            content: logo.content,
          },
        ],
      };
    });

    const bytes = await renderPdf(specs);
    expect(await pageSizes(bytes)).toHaveLength(LOGO_VARIANTS.length);

    // Vector, not raster: path/shape operators present, no image XObject draw.
    const content = inflateStreams(bytes);
    expect(content).toMatch(/\b(re|c|l)\b/);
    expect(content).not.toContain("/Image");
  });
});

describe("screen assets", () => {
  it("exports a 1080² social post at 1080 pt (1 px = 1 pt)", async () => {
    const bytes = await renderPdf([
      socialPostSpec(TOKENS, BRAND, {
        headline: "Compliant stationery in minutes",
        cta: "Start free",
        format: "square",
      }),
    ]);
    expect(await pageSizes(bytes)).toEqual([{ w: 1080, h: 1080 }]);
  });

  it("renders the SVG preview for the same spec", () => {
    const svg = renderSvg(
      socialPostSpec(TOKENS, BRAND, {
        headline: "Compliant stationery in minutes",
        format: "og",
      }),
    );
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="1200"');
    expect(svg).toContain("Compliant stationery in minutes");
  });
});

describe("document metadata", () => {
  it("stamps title and author so the file is identifiable on a print desk", async () => {
    const bytes = await renderPdf(
      [letterheadSpec(TOKENS, BRAND, { showBodyPlaceholder: false })],
      { title: "Northwind Labs — letterhead", author: "Northwind Labs Private Limited" },
    );
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(pdf.getTitle()).toBe("Northwind Labs — letterhead");
    expect(pdf.getAuthor()).toBe("Northwind Labs Private Limited");
    expect(pdf.getProducer()).toBe("Avexora Brand Studio");
  });
});
