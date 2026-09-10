import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import UPNG from "@pdf-lib/upng";
import {
  PDF_SIGNATURE_MAX_BYTES,
  SIG_DEFAULT_W_FRAC,
  SIG_MAX_FRAC,
  SIG_MIN_FRAC,
  buildSignedPdf,
  centerRotatedPlacement,
  displayFracToPdfRect,
  inspectPdf,
  isPdfMagic,
  normalizeRotationDeg,
  sanitizeSignedFilename,
  signatureImageError,
} from "@/tools/compute/pdf/pdf-signature";
import { PdfSignatureError } from "@/tools/compute/pdf/pdf-signature";

/* ---------------------------------------------------------------------------
 * Fixture helpers. These produce real PDFs (pdf-lib) and real RGBA PNGs
 * (UPNG.js) so the placement math is validated against genuine assets.
 * ------------------------------------------------------------------------- */

interface PageMetaLike {
  readonly vw: number;
  readonly vh: number;
  readonly transform: readonly [number, number, number, number, number, number];
}

async function makePageMeta(
  bytes: Uint8Array,
  pageNumber: number,
): Promise<PageMetaLike> {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const page = await doc.getPage(pageNumber);
  const vp = page.getViewport({ scale: 1, dontFlip: false });
  return {
    vw: vp.width,
    vh: vp.height,
    transform: vp.transform as unknown as readonly [number, number, number, number, number, number],
  };
}

/** 2-page fixture: portrait page 1 (rotation 0), page 2 explicitly set to rotate 90°. */
async function makeTwoPageFixture(): Promise<Uint8Array> {
  const src = await PDFDocument.create();
  const font = await src.embedFont(StandardFonts.Helvetica);
  const p1 = src.addPage([612, 792]);
  p1.drawText("Page one", { x: 40, y: 720, size: 24, font, color: rgb(0.1, 0.2, 0.3) });
  p1.drawRectangle({ x: 50, y: 600, width: 200, height: 100, color: rgb(0.8, 0.2, 0.2) });
  const p2 = src.addPage([612, 792]);
  p2.setRotation(degrees(90));
  p2.drawText("Page two", { x: 40, y: 720, size: 24, font, color: rgb(0.2, 0.4, 0.1) });
  return src.save();
}

/** 3-page fixture, no rotations. */
async function makeThreePageFixture(): Promise<Uint8Array> {
  const src = await PDFDocument.create();
  for (let i = 1; i <= 3; i++) {
    src.addPage([400, 600]);
  }
  return src.save();
}

/** Small real RGBA PNG (6×4) with a semi-transparent alpha channel. */
function makeRgbaPng(): Uint8Array {
  const w = 6;
  const h = 4;
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = 30;
    rgba[i * 4 + 1] = 60;
    rgba[i * 4 + 2] = 120;
    rgba[i * 4 + 3] = 200;
  }
  const mod = UPNG as unknown as {
    encode(data: number[][], w: number, h: number, cnum: number): ArrayBuffer;
    default?: { encode(data: number[][], w: number, h: number, cnum: number): ArrayBuffer };
  };
  const encode = mod.default?.encode ?? mod.encode;
  return new Uint8Array(encode([Array.from(rgba)], w, h, 256));
}

function validPlacementFromMeta(
  meta: PageMetaLike,
  frac: { sx: number; sy: number; wFrac: number; hFrac: number },
  angleDeg: number,
) {
  const rect = displayFracToPdfRect(meta, frac);
  const placed = centerRotatedPlacement(rect, angleDeg);
  return { rect, placed };
}

function spec(meta: PageMetaLike, frac: { sx: number; sy: number; wFrac: number; hFrac: number }, angleDeg: number, pageNumber = 1) {
  const { rect } = validPlacementFromMeta(meta, frac, angleDeg);
  // rotateDeg is the EDITOR angle (clockwise-positive, CSS). buildSignedPdf
  // applies the centered rotation itself, so the raw (unrotated) rect + the
  // editor angle are what the backend consumes.
  return { pageNumber, rect, rotateDeg: normalizeRotationDeg(angleDeg) };
}

/**
 * Reads the current text matrix at the first paintImageXObject op on a page,
 * reproducing the PDF graphics-state transform stack exactly.
 */
async function imageCtm(
  bytes: Uint8Array,
  pageNumber: number,
): Promise<number[]> {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const page = await doc.getPage(pageNumber);
  const ops = await page.getOperatorList();
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === pdfjs.OPS.save) {
      stack.push([...ctm]);
    } else if (fn === pdfjs.OPS.restore) {
      ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
    } else if (fn === pdfjs.OPS.transform) {
      const [a, b, c, d, e, f] = args as number[];
      const m = ctm;
      ctm = [
        m[0] * a + m[2] * b,
        m[1] * a + m[3] * b,
        m[0] * c + m[2] * d,
        m[1] * c + m[3] * d,
        m[0] * e + m[2] * f + m[4],
        m[1] * e + m[3] * f + m[5],
      ];
    } else if (fn === pdfjs.OPS.paintImageXObject) {
      return ctm;
    }
  }
  return ctm;
}

/** Expected pdf-lib drawImage CTM for an editor angle (contentDeg = 360 − angle). */
function expectedImageCtm(
  x: number,
  y: number,
  w: number,
  h: number,
  editorAngle: number,
): [number, number, number, number, number, number] {
  const rad = ((360 - editorAngle) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [cos * w, sin * w, -sin * h, cos * h, x, y];
}

function approx(actual: number[], expected: number[], eps = 0.01): void {
  expect(actual).toHaveLength(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(Math.abs(actual[i] - expected[i])).toBeLessThan(eps);
  }
}

/* ---------------------------------------------------------------------------
 * Pure validation functions
 * ------------------------------------------------------------------------- */

describe("pdf-signature — magic / inspectPdf", () => {
  it("detects the %PDF- magic header", () => {
    expect(isPdfMagic(Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))).toBe(true);
    expect(isPdfMagic(new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it("accepts a genuine PDF regardless of reported MIME type", async () => {
    const bytes = await makeThreePageFixture();
    expect(() => inspectPdf(bytes, "doc.pdf", "application/pdf")).not.toThrow();
    expect(() => inspectPdf(bytes, "doc.pdf", "application/octet-stream")).not.toThrow();
    expect(() => inspectPdf(bytes, "doc.pdf", "")).not.toThrow();
    const asOutput = await buildSignedPdf(bytes, []);
    expect(() => inspectPdf(asOutput, "signed.pdf", "application/pdf")).not.toThrow();
  });

  it("rejects a non-.pdf filename", async () => {
    const bytes = await makeThreePageFixture();
    try {
      inspectPdf(bytes, "photo.png", "image/png");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PdfSignatureError);
      expect((err as Error).message).toContain("valid PDF");
    }
  });

  it("rejects files whose content is not a PDF (PNG bytes renamed .pdf)", async () => {
    const png = makeRgbaPng();
    try {
      inspectPdf(png, "fake.pdf", "application/pdf");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PdfSignatureError);
      expect((err as Error).message).toContain("does not look like a valid PDF");
    }
  });

  it("rejects a clear wrong MIME even when the header happens to match", async () => {
    const bytes = await makeThreePageFixture();
    try {
      inspectPdf(bytes, "doc.pdf", "image/png");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as Error).message).toContain("valid PDF");
    }
  });

  it("rejects truncated/empty files", async () => {
    // Starts with a valid magic header but is far too short to be a real PDF.
    const short = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x78, 0x78]);
    try {
      inspectPdf(short, "tiny.pdf", "application/pdf");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as Error).message).toContain("truncated");
    }
    try {
      inspectPdf(new Uint8Array(16), "empty.pdf", "application/pdf");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as Error).message).toContain("does not look like a valid PDF");
    }
  });

  it("rejects files above the size limit", async () => {
    const bytes = new Uint8Array(PDF_SIGNATURE_MAX_BYTES + 1);
    bytes[0] = 0x25;
    bytes[1] = 0x50;
    bytes[2] = 0x44;
    bytes[3] = 0x46;
    bytes[4] = 0x2d;
    try {
      inspectPdf(bytes, "huge.pdf", "application/pdf");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as Error).message).toContain("50 MB");
    }
  });
});

describe("pdf-signature — signatureImageError / filename", () => {
  it("accepts PNG/JPG/WebP with matching extensions and MIME types", () => {
    expect(signatureImageError("sig.png", "image/png", 1024)).toBeNull();
    expect(signatureImageError("sig.jpeg", "image/jpeg", 1024)).toBeNull();
    expect(signatureImageError("sig.webp", "image/webp", 1024)).toBeNull();
  });

  it("rejects wrong extensions and MIME types", () => {
    expect(signatureImageError("sig.gif", "image/gif", 1024)).toContain("PNG, JPG or WebP");
    expect(signatureImageError("sig.png", "text/plain", 1024)).toContain("PNG, JPG or WebP");
    expect(signatureImageError("sig.tiff", "image/tiff", 1024)).toContain("PNG, JPG or WebP");
  });

  it("rejects oversized images", () => {
    expect(signatureImageError("sig.png", "image/png", 10 * 1024 * 1024 + 1)).toContain("10 MB");
  });

  it("produces a signed-<base>.pdf filename", () => {
    expect(sanitizeSignedFilename("invoice.pdf")).toBe("signed-invoice.pdf");
    expect(sanitizeSignedFilename("My Report.FINAL.pdf")).toBe("signed-My-Report.FINAL.pdf");
    expect(sanitizeSignedFilename("a/b\\c.pdf")).toBe("signed-abc.pdf");
    expect(sanitizeSignedFilename(".pdf")).toBe("signed-document.pdf");
  });
});

describe("pdf-signature — normalizeRotationDeg", () => {
  it("normalises angles into [0, 360)", () => {
    expect(normalizeRotationDeg(0)).toBe(0);
    expect(normalizeRotationDeg(30)).toBe(30);
    expect(normalizeRotationDeg(-30)).toBe(330);
    expect(normalizeRotationDeg(390)).toBe(30);
    expect(normalizeRotationDeg(720)).toBe(0);
  });
});

/* ---------------------------------------------------------------------------
 * Coordinate mapping against real pdfjs viewport transforms
 * ------------------------------------------------------------------------- */

describe("pdf-signature — displayFracToPdfRect vs real pdfjs viewports", () => {
  it("maps display fractions to PDF coordinates on a rotation-0 page", async () => {
    const fixture = await makeThreePageFixture(); // 400×600
    const meta = await makePageMeta(fixture, 1);
    expect(meta.vw).toBeCloseTo(400);
    expect(meta.vh).toBeCloseTo(600);
    // Default viewport (dontFlip:false): [1,0,0,-1,0,600]
    expect(meta.transform[0]).toBe(1);
    expect(meta.transform[3]).toBe(-1);

    const frac = { sx: 0.2, sy: 0.1, wFrac: 0.4, hFrac: 0.2 };
    const rect = displayFracToPdfRect(meta, frac);
    // Display: top edge at 0.1*600=60 → PDF y = 600-60 = 540; height 0.2*600=120.
    expect(rect.x).toBeCloseTo(80);
    expect(rect.y).toBeCloseTo(420, 0); // bottom edge of the box in PDF space
    expect(rect.width).toBeCloseTo(160);
    expect(rect.height).toBeCloseTo(120);
  });

  it("maps display fractions correctly on a rotation-90 page (axes swap)", async () => {
    const fixture = await makeTwoPageFixture();
    const meta = await makePageMeta(fixture, 2);
    // Page 2 is 612×792 but rotated 90° → display 792×612, viewport [0,1,1,0,0,0].
    expect(meta.vw).toBeCloseTo(792);
    expect(meta.vh).toBeCloseTo(612);
    expect(meta.transform[0]).toBeCloseTo(0);
    expect(meta.transform[1]).toBeCloseTo(1);
    expect(meta.transform[2]).toBeCloseTo(1);
    expect(meta.transform[3]).toBeCloseTo(0);

    const frac = { sx: 0.5, sy: 0.25, wFrac: 0.25, hFrac: 0.1 };
    const rect = displayFracToPdfRect(meta, frac);
    // The viewport [0,1,1,0,0,0] maps display (px,py) → PDF (py,px): a pure
    // axis swap. A display box [396..594]×[153..214.2] becomes a PDF slab of
    // width 61.2 (= hFrac×vh) and height 198 (= wFrac×vw).
    expect(rect.x).toBeCloseTo(frac.sy * meta.vh, 1); // 153
    expect(rect.y).toBeCloseTo(frac.sx * meta.vw, 1); // 396
    expect(rect.width).toBeCloseTo(frac.hFrac * meta.vh, 1); // 61.2
    expect(rect.height).toBeCloseTo(frac.wFrac * meta.vw, 1); // 198
  });
});

describe("pdf-signature — centerRotatedPlacement", () => {
  it("keeps the rotation-0 case unchanged", () => {
    const out = centerRotatedPlacement({ x: 10, y: 20, width: 100, height: 50 }, 0);
    expect(out).toEqual({ x: 10, y: 20, width: 100, height: 50, rotateDeg: 0 });
  });

  it("keeps the centre fixed for any rotation angle", () => {
    const rect = { x: 10, y: 20, width: 100, height: 50 };
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    for (const angle of [30, 45, 90, 135, 180, 270, 330]) {
      const placed = centerRotatedPlacement(rect, angle);
      // Content rotation is 360 − editor angle; the anchored rotate-then-anchor
      // bbox centre must equal the original rect's centre (cx, cy).
      const contentDeg = 360 - angle;
      const rad = (contentDeg * Math.PI) / 180;
      const boxCx =
        placed.x + (placed.width * Math.cos(rad) - placed.height * Math.sin(rad)) / 2;
      const boxCy =
        placed.y + (placed.width * Math.sin(rad) + placed.height * Math.cos(rad)) / 2;
      expect(boxCx).toBeCloseTo(cx, 5);
      expect(boxCy).toBeCloseTo(cy, 5);
      expect(placed.width).toBe(rect.width);
      expect(placed.height).toBe(rect.height);
    }
  });

  it("computes the anchor that compensates pdf-lib's corner rotation", () => {
    // pdf-lib rotates about the anchor point; for angle=90 (contentDeg=270) the
    // anchor must shift so the rotated bbox centre stays put.
    const rect = { x: 0, y: 0, width: 100, height: 40 };
    const placed = centerRotatedPlacement(rect, 90);
    // contentDeg=270 → cos=0, sin=-1: x = 50 − (0·50 − (−1)·20) = 50 − 20 = 30...
    // y = 20 − (50·(−1) + 0·20) = 20 − (−50) = 70.
    expect(placed.x).toBeCloseTo(30);
    expect(placed.y).toBeCloseTo(70);
    expect(placed.rotateDeg).toBeCloseTo(270);
  });
});

/* ---------------------------------------------------------------------------
 * buildSignedPdf: real pdf-lib output, read back via pdfjs operator lists
 * ------------------------------------------------------------------------- */

describe("pdf-signature — buildSignedPdf output correctness", () => {
  it("produces a valid PDF preserving page count, dims and rotation", async () => {
    const fixture = await makeTwoPageFixture();
    const sig = makeRgbaPng();
    const meta1 = await makePageMeta(fixture, 1);
    const meta2 = await makePageMeta(fixture, 2);
    const out = await buildSignedPdf(fixture, [
      { sigBytes: sig, ...spec(meta1, { sx: 0.1, sy: 0.7, wFrac: 0.5, hFrac: 0.1 }, 0) },
      { sigBytes: sig, ...spec(meta2, { sx: 0.3, sy: 0.4, wFrac: 0.4, hFrac: 0.12 }, 25, 2) },
    ]);

    const doc = await pdfjs.getDocument({ data: out }).promise;
    expect(doc.numPages).toBe(2);
    const p1 = await doc.getPage(1);
    const p2 = await doc.getPage(2);
    expect(p1.rotate).toBe(0);
    expect(p2.rotate).toBe(90);
    expect((await p1.getViewport({ scale: 1 })).width).toBeCloseTo(612);
    expect((await p2.getViewport({ scale: 1 })).width).toBeCloseTo(792);
  });

  it("places an unrotated signature with a CTM that exactly matches the preview rect", async () => {
    const fixture = await makeThreePageFixture(); // 400×600
    const sig = makeRgbaPng();
    const meta = await makePageMeta(fixture, 1);
    const frac = { sx: 0.1, sy: 0.2, wFrac: 0.5, hFrac: 0.1 };
    const { rect, placed } = validPlacementFromMeta(meta, frac, 0);
    const out = await buildSignedPdf(fixture, [{ sigBytes: sig, ...spec(meta, frac, 0) }]);

    const ctm = await imageCtm(out, 1);
    approx(ctm, expectedImageCtm(placed.x, placed.y, placed.width, placed.height, 0));
    // Unrotated: the CTM is exactly the axis-aligned box from displayFracToPdfRect.
    approx(ctm, [placed.width, 0, 0, placed.height, placed.x, placed.y]);
    expect(rect.x).toBeCloseTo(placed.x);
    expect(rect.y).toBeCloseTo(placed.y);
    expect(rect.width).toBeCloseTo(placed.width);
    expect(rect.height).toBeCloseTo(placed.height);
  });

  it("rotates a signature about its centre on an unrotated page", async () => {
    const fixture = await makeThreePageFixture();
    const sig = makeRgbaPng();
    const meta = await makePageMeta(fixture, 1);
    const frac = { sx: 0.2, sy: 0.5, wFrac: 0.3, hFrac: 0.08, };
    const { placed } = validPlacementFromMeta(meta, frac, 30);
    const out = await buildSignedPdf(fixture, [{ sigBytes: sig, ...spec(meta, frac, 30) }]);

    const ctm = await imageCtm(out, 1);
    approx(ctm, expectedImageCtm(placed.x, placed.y, placed.width, placed.height, 30));
    // The bbox centre (in PDF space) must sit at the centre of the display rect.
    const rad = (placed.rotateDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const w = placed.width;
    const h = placed.height;
    const boxCx = placed.x + (w * cos - h * sin) / 2;
    const boxCy = placed.y + (w * sin + h * cos) / 2;
    const rectCentre = displayFracToPdfRect(meta, frac);
    expect(boxCx).toBeCloseTo(rectCentre.x + rectCentre.width / 2, 5);
    expect(boxCy).toBeCloseTo(rectCentre.y + rectCentre.height / 2, 5);
  });

  it("places signatures correctly on a rotation-90 page", async () => {
    const fixture = await makeTwoPageFixture();
    const sig = makeRgbaPng();
    const meta = await makePageMeta(fixture, 2);
    const { placed } = validPlacementFromMeta(
      meta,
      { sx: 0.25, sy: 0.3, wFrac: 0.4, hFrac: 0.12 },
      0,
    );
    const out = await buildSignedPdf(fixture, [
      { sigBytes: sig, ...spec(meta, { sx: 0.25, sy: 0.3, wFrac: 0.4, hFrac: 0.12 }, 0, 2) },
    ]);

    const ctm = await imageCtm(out, 2);
    approx(ctm, expectedImageCtm(placed.x, placed.y, placed.width, placed.height, 0));
  });

  it("leaves unsigned pages untouched (3-page PDF, signatures on 1 and 3)", async () => {
    const fixture = await makeThreePageFixture();
    const sig = makeRgbaPng();
    const meta1 = await makePageMeta(fixture, 1);
    const meta3 = await makePageMeta(fixture, 3);
    const out = await buildSignedPdf(fixture, [
      { sigBytes: sig, ...spec(meta1, { sx: 0.1, sy: 0.1, wFrac: 0.3, hFrac: 0.1 }, 0) },
      { sigBytes: sig, ...spec(meta3, { sx: 0.5, sy: 0.5, wFrac: 0.2, hFrac: 0.1 }, 45, 3) },
    ]);

    const page2Ctm = await imageCtm(out, 2);
    // No drawImage on page 2 → the raw CTM is the identity (no transform ops recorded).
    approx(page2Ctm, [1, 0, 0, 1, 0, 0]);
  });

  it("rejects a placement that references a non-existent page", async () => {
    const fixture = await makeThreePageFixture();
    const sig = makeRgbaPng();
    const meta = await makePageMeta(fixture, 1);
    await expect(
      buildSignedPdf(fixture, [{ sigBytes: sig, ...spec(meta, { sx: 0.1, sy: 0.1, wFrac: 0.3, hFrac: 0.1 }, 0, 99) }]),
    ).rejects.toThrow(/page that does not exist/);
  });

  it("keeps transparency: an RGBA PNG lands in the output with an /SMask", async () => {
    const fixture = await makeThreePageFixture();
    const sig = makeRgbaPng();
    const meta = await makePageMeta(fixture, 1);
    const out = await buildSignedPdf(fixture, [
      { sigBytes: sig, ...spec(meta, { sx: 0.1, sy: 0.1, wFrac: 0.5, hFrac: 0.2 }, 0) },
    ]);

    const text = new TextDecoder("latin1").decode(out);
    expect(text).toContain("/SMask");
    // And pdfjs can still parse + render the result.
    const doc = await pdfjs.getDocument({ data: out }).promise;
    expect(doc.numPages).toBe(3);
  });
});

describe("pdf-signature — exposed size limits", () => {
  it("exposes sane defaults for the editor and backend", () => {
    expect(SIG_MIN_FRAC).toBeLessThan(SIG_DEFAULT_W_FRAC);
    expect(SIG_DEFAULT_W_FRAC).toBeLessThan(SIG_MAX_FRAC);
    expect(SIG_MAX_FRAC).toBeLessThanOrEqual(0.9);
    expect(PDF_SIGNATURE_MAX_BYTES).toBe(50 * 1024 * 1024);
  });
});