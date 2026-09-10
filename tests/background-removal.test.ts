import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import UPNG from "@pdf-lib/upng";
import {
  BG_REMOVAL_MAX_EDGE,
  BG_REMOVAL_MAX_FILE_BYTES,
  BG_REMOVAL_MAX_PIXELS,
  BG_REMOVAL_SEG_EDGE,
  applyMaskAlpha,
  detectImageFormat,
  encodeTransparentPng,
  existingTransparencyRatio,
  formatDisplayName,
  inputFormatError,
  isPngBytes,
  pngHasAlphaChannel,
  probabilitiesToMask,
  resizeMaskBilinear,
  resizeRgbaBilinear,
  rgbaHwcToBchw,
  safeOutputDims,
  webpHasAlphaChannel,
} from "@/tools/compute/image/background-removal";
import { predictBgMask } from "@/tools/compute/image/bg-removal-engine";

/* ---------------------------------------------------------------------------
 * Helpers: tiny magic-byte headers and a synthetic RGBA "photo" with a solid
 * background and a coloured rectangle subject.
 * ------------------------------------------------------------------------- */

const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 16]);
const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const webpMagic = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);
const gifMagic = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const bmpMagic = new Uint8Array([0x42, 0x4d, 0x36, 0x00, 0x00, 0x00]);
const avifMagic = new Uint8Array([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);
const tiffMagic = new Uint8Array([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00]);
const heicMagic = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);

function makeRgba(
  w: number,
  h: number,
  background: [number, number, number, number],
  subject?: { x0: number; y0: number; x1: number; y1: number; rgb: [number, number, number] },
): Uint8Array {
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const inside =
        subject &&
        x >= subject.x0 &&
        x < subject.x1 &&
        y >= subject.y0 &&
        y < subject.y1;
      if (inside) {
        rgba[i] = subject.rgb[0];
        rgba[i + 1] = subject.rgb[1];
        rgba[i + 2] = subject.rgb[2];
        rgba[i + 3] = 255;
      } else {
        rgba[i] = background[0];
        rgba[i + 1] = background[1];
        rgba[i + 2] = background[2];
        rgba[i + 3] = background[3];
      }
    }
  }
  return rgba;
}

/** Read pixel alpha from a UPNG-decoded PNG. */
function decodePngAlpha(
  bytes: Uint8Array,
  w: number,
  h: number,
): Uint8Array {
  const png = UPNG.decode(bytes as unknown as ArrayBuffer);
  const frame = new Uint8Array((UPNG.toRGBA8(png) as unknown as ArrayBuffer[])[0]);
  expect(frame.length).toBe(w * h * 4);
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = frame[i * 4 + 3];
  return alpha;
}

function riffWebp(chunks: { type: string; payload: Uint8Array }[]): Uint8Array {
  let body = 0;
  for (const c of chunks) body += 8 + c.payload.length + (c.payload.length % 2);
  const out = new Uint8Array(12 + body);
  out[0] = 0x52; out[1] = 0x49; out[2] = 0x46; out[3] = 0x46; // RIFF
  out[8] = 0x57; out[9] = 0x45; out[10] = 0x42; out[11] = 0x50; // WEBP
  const size = body;
  out[4] = size & 0xff; out[5] = (size >> 8) & 0xff; out[6] = (size >> 16) & 0xff; out[7] = (size >> 24) & 0xff;
  let off = 12;
  for (const c of chunks) {
    out[off] = c.type.charCodeAt(0);
    out[off + 1] = c.type.charCodeAt(1);
    out[off + 2] = c.type.charCodeAt(2);
    out[off + 3] = c.type.charCodeAt(3);
    const cl = c.payload.length;
    out[off + 4] = cl & 0xff; out[off + 5] = (cl >> 8) & 0xff; out[off + 6] = (cl >> 16) & 0xff; out[off + 7] = (cl >> 24) & 0xff;
    out.set(c.payload, off + 8);
    off += 8 + cl + (cl % 2);
  }
  return out;
}

describe("background-removal — format detection", () => {
  it("detects the common input formats from magic bytes", () => {
    expect(detectImageFormat(pngMagic)).toBe("png");
    expect(detectImageFormat(jpegMagic)).toBe("jpeg");
    expect(detectImageFormat(webpMagic)).toBe("webp");
    expect(detectImageFormat(gifMagic)).toBe("gif");
    expect(detectImageFormat(bmpMagic)).toBe("bmp");
    expect(detectImageFormat(avifMagic)).toBe("avif");
  });

  it("detects TIFF (unsupported here) and unknown/opaque formats", () => {
    expect(detectImageFormat(tiffMagic)).toBe("tiff");
    expect(detectImageFormat(heicMagic)).toBe("unknown");
    expect(detectImageFormat(new Uint8Array([1, 2, 3, 4, 5, 6]))).toBe("unknown");
  });

  it("maps every detected format to a human label", () => {
    expect(formatDisplayName("png")).toBe("PNG");
    expect(formatDisplayName("tiff")).toBe("TIFF");
    expect(formatDisplayName("unknown")).toBe("this file type");
  });
});

describe("background-removal — input validation", () => {
  it("accepts every browser-decodable input format", () => {
    expect(inputFormatError("a.png", "image/png", 100, pngMagic)).toBeNull();
    expect(inputFormatError("a.jpg", "image/jpeg", 100, jpegMagic)).toBeNull();
    expect(inputFormatError("a.webp", "image/webp", 100, webpMagic)).toBeNull();
    expect(inputFormatError("a.gif", "image/gif", 100, gifMagic)).toBeNull();
    expect(inputFormatError("a.bmp", "image/bmp", 100, bmpMagic)).toBeNull();
    expect(inputFormatError("a.avif", "image/avif", 100, avifMagic)).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(inputFormatError("a.png", "image/png", 0, pngMagic)).toMatch(/empty/);
  });

  it("rejects oversized files", () => {
    expect(
      inputFormatError("a.png", "image/png", BG_REMOVAL_MAX_FILE_BYTES + 1, pngMagic),
    ).toMatch(/30 MB/);
  });

  it("rejects TIFF with a clear, actionable message", () => {
    const msg = inputFormatError("a.tiff", "image/tiff", 100, tiffMagic);
    expect(msg).toMatch(/TIFF/);
    expect(msg).toMatch(/convert/i);
  });

  it("rejects unknown formats without crashing", () => {
    const msg = inputFormatError("archive.zip", "application/zip", 100, heicMagic);
    expect(msg).toMatch(/Unsupported file format/i);
    const msg2 = inputFormatError("x.raw", "", 5, new Uint8Array([9, 9, 9]));
    expect(msg2).toMatch(/Unsupported file format/i);
  });

  it("rejects a missing file", () => {
    expect(inputFormatError("", "", 0, new Uint8Array(0))).toMatch(/No file/);
  });
});

describe("background-removal — dimension guard", () => {
  it("keeps safe dimensions untouched", () => {
    expect(safeOutputDims(1200, 800)).toEqual({ width: 1200, height: 800, scaled: false });
  });

  it("scales down only when the image is unsafe to process", () => {
    const huge = safeOutputDims(20000, 20000);
    expect(huge.scaled).toBe(true);
    expect(huge.width * huge.height).toBeLessThanOrEqual(BG_REMOVAL_MAX_PIXELS);
    expect(huge.width).toBeLessThanOrEqual(BG_REMOVAL_MAX_EDGE);
    expect(huge.height).toBeLessThanOrEqual(BG_REMOVAL_MAX_EDGE);

    const wide = safeOutputDims(30000, 100);
    expect(wide.scaled).toBe(true);
    expect(wide.width).toBeLessThanOrEqual(BG_REMOVAL_MAX_EDGE);
  });
});

describe("background-removal — tensor preprocessing", () => {
  it("normalises RGB with mean 128 / std 256 into NCHW layout", () => {
    const rgba = new Uint8Array([
      255, 0, 128, 255, // one pixel
    ]);
    const t = rgbaHwcToBchw(rgba, 1, 1);
    expect(t.length).toBe(3);
    expect(t[0]).toBeCloseTo((255 - 128) / 256);
    expect(t[1]).toBeCloseTo((0 - 128) / 256);
    expect(t[2]).toBeCloseTo((128 - 128) / 256);
  });

  it("lays 2×1 pixels out channel-major (r,g,b,r,g,b)", () => {
    const rgba = new Uint8Array([
      10, 20, 30, 255,
      40, 50, 60, 255,
    ]);
    const t = rgbaHwcToBchw(rgba, 2, 1);
    expect(t[0]).toBeCloseTo((10 - 128) / 256); // r0
    expect(t[1]).toBeCloseTo((40 - 128) / 256); // r1
    expect(t[2]).toBeCloseTo((20 - 128) / 256); // g0
    expect(t[3]).toBeCloseTo((50 - 128) / 256); // g1
    expect(t[4]).toBeCloseTo((30 - 128) / 256); // b0
    expect(t[5]).toBeCloseTo((60 - 128) / 256); // b1
  });

  it("bilinear-resizes RGBA without changing the per-pixel count", () => {
    const src = makeRgba(4, 4, [255, 255, 255, 255]);
    const out = resizeRgbaBilinear(src, 4, 4, 2, 2);
    expect(out.length).toBe(2 * 2 * 4);
  });

  it("keeps the buffer intact when target size matches source", () => {
    const src = makeRgba(3, 3, [10, 20, 30, 255]);
    const out = resizeRgbaBilinear(src, 3, 3, 3, 3);
    expect(out).toBe(src);
  });

  it("clamps invalid probabilities into a valid mask", () => {
    const mask = probabilitiesToMask(
      new Float32Array([1.2, 0.5, -0.1, Number.NaN, 0, 1]),
      6,
    );
    expect(Array.from(mask)).toEqual([255, 128, 0, 0, 0, 255]);
  });

  it("bilinear-upscales a single-channel mask", () => {
    const mask = new Uint8Array([255, 0, 255, 0]);
    const up = resizeMaskBilinear(mask, 2, 2, 4, 4);
    expect(up.length).toBe(16);
    expect(up[0]).toBe(255);
    expect(up[15]).toBe(0);
  });
});

describe("background-removal — alpha compositing & transparency", () => {
  it("multiplies source alpha by the mask, never re-adding alpha", () => {
    const rgba = makeRgba(2, 2, [255, 255, 255, 200]);
    const mask = new Uint8Array([255, 128, 0, 255]);
    const out = applyMaskAlpha(rgba, mask, 2, 2, 2, 2);
    // opaque source × 255 → 255; ×128 → 128; ×0 → 0
    expect(out[3]).toBe(200); // hmm: source alpha 200 × 255/255 = 200
    expect(out[7]).toBe(Math.round((200 * 128) / 255));
    expect(out[11]).toBe(0);
    expect(out[15]).toBe(200);
  });

  it("preserves an already-transparent PNG's transparency", () => {
    const rgba = makeRgba(2, 2, [10, 20, 30, 0]);
    const mask = new Uint8Array([255, 255, 255, 255]); // model says everything foreground
    const out = applyMaskAlpha(rgba, mask, 2, 2, 2, 2);
    for (let i = 0; i < 4; i++) expect(out[i * 4 + 3]).toBe(0);
    // RGB content of every pixel is untouched
    for (let i = 0; i < 8; i++) expect(out[i]).toBe(rgba[i]);
  });

  it("measures the existing transparency ratio", () => {
    const halfClear = makeRgba(2, 2, [0, 0, 0, 0], {
      x0: 0, y0: 0, x1: 1, y1: 1, rgb: [255, 255, 255],
    });
    expect(existingTransparencyRatio(halfClear, 2, 2)).toBeCloseTo(0.75);
    expect(existingTransparencyRatio(makeRgba(2, 2, [0, 0, 0, 255]), 2, 2)).toBe(0);
  });
});

describe("background-removal — PNG export integrity", () => {
  it("produces a genuine PNG with a real alpha channel after a removal", () => {
    // Post-removal image: transparent magenta background, opaque subject.
    const rgba = makeRgba(6, 4, [255, 0, 255, 0], {
      x0: 1, y0: 1, x1: 4, y1: 3, rgb: [200, 100, 50],
    });
    const png = encodeTransparentPng(rgba, 6, 4);
    expect(isPngBytes(png)).toBe(true);
    expect(pngHasAlphaChannel(png)).toBe(true);
  });

  it("optimises a fully-opaque image (no alpha channel needed)", () => {
    const rgba = makeRgba(6, 4, [1, 2, 3, 255], {
      x0: 1, y0: 1, x1: 4, y1: 3, rgb: [200, 100, 50],
    });
    const png = encodeTransparentPng(rgba, 6, 4);
    expect(pngHasAlphaChannel(png)).toBe(false);
    expect(png[25] === 2 || png[25] === 6).toBe(true); // RGB or RGBA true colour
  });

  it("round-trips pixels: transparent stays transparent, subject stays opaque", () => {
    const w = 8, h = 6;
    const rgba = makeRgba(w, h, [255, 255, 255, 0], {
      x0: 2, y0: 1, x1: 6, y1: 5, rgb: [12, 34, 56],
    });
    const png = encodeTransparentPng(rgba, w, h);
    const alpha = decodePngAlpha(png, w, h);
    // background pixel fully transparent
    expect(alpha[0]).toBe(0);
    // subject pixel fully opaque
    expect(alpha[1 * w + 3]).toBe(255);
  });

  it("marks a plain (non-alpha) PNG header as not transparent", () => {
    const opaque = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, // 8-bit colour type 2 (RGB)
      0x90, 0x77, 0x53, 0xde, 0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44,
    ]);
    expect(pngHasAlphaChannel(opaque)).toBe(false);
  });

  it("does not include checkerboard pixels in the output", () => {
    const rgba = makeRgba(4, 4, [255, 0, 255, 0]); // magenta background
    const png = encodeTransparentPng(rgba, 4, 4);
    const alpha = decodePngAlpha(png, 4, 4);
    for (const a of alpha) expect(a).toBe(0);
  });
});

describe("background-removal — WebP container alpha detection", () => {
  it("recognises lossless VP8L as alpha-capable", () => {
    const lossless = riffWebp([
      { type: "VP8L", payload: new Uint8Array([0x2f, 0x00, 0x01, 0x00]) },
    ]);
    expect(webpHasAlphaChannel(lossless)).toBe(true);
  });

  it("recognises the VP8X alpha flag", () => {
    const extAlpha = riffWebp([
      { type: "VP8X", payload: new Uint8Array([0x10, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
    ]);
    expect(webpHasAlphaChannel(extAlpha)).toBe(true);
    const extNoAlpha = riffWebp([
      { type: "VP8X", payload: new Uint8Array([0x00, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
    ]);
    expect(webpHasAlphaChannel(extNoAlpha)).toBe(false);
  });

  it("rejects a plain lossy VP8 frame (no alpha) and junk", () => {
    const lossy = riffWebp([
      { type: "VP8 ", payload: new Uint8Array([0, 0, 0, 0]) },
    ]);
    expect(webpHasAlphaChannel(lossy)).toBe(false);
    expect(webpHasAlphaChannel(new Uint8Array(16))).toBe(false);
    expect(webpHasAlphaChannel(new Uint8Array(0))).toBe(false);
  });
});

/* ---------------------------------------------------------------------------
 * End-to-end model integration test. Runs real ONNX inference via
 * onnxruntime-web in Node against the vendored ISNet model. Skipped automatically
 * when the model file is not present (e.g. trimmed deployments).
 * ------------------------------------------------------------------------- */
const SEP = (() => {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const repoRoot = resolve(here, "..");
  return repoRoot;
})();
const MODEL_PATH = resolve(SEP, "public", "models", "isnet-general-use.onnx");
const modelAvailable = existsSync(MODEL_PATH);
const modelBytesU8 = modelAvailable ? readFileSync(MODEL_PATH) : null;
const modelBuffer = modelBytesU8
  ? (modelBytesU8.buffer.slice(
      modelBytesU8.byteOffset,
      modelBytesU8.byteOffset + modelBytesU8.byteLength,
    ) as ArrayBuffer)
  : undefined;

describe.skipIf(!modelAvailable)("background-removal — real model inference (Node)", () => {
  it("returns a 1024×1024 foreground mask in [0,255] for an opaque image", async () => {
    const rgba = makeRgba(320, 240, [120, 180, 90, 255], {
      x0: 40, y0: 40, x1: 260, y1: 200, rgb: [220, 30, 40],
    });
    const mask = await predictBgMask(rgba, 320, 240, modelBuffer);
    expect(mask.length).toBe(BG_REMOVAL_SEG_EDGE * BG_REMOVAL_SEG_EDGE);
    for (const v of mask) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    }
    let maxV = 0;
    for (const v of mask) if (v > maxV) maxV = v;
    expect(maxV).toBeGreaterThan(0); // the model actually produced signal
    // Completing the pipeline yields a valid transparent PNG.
    const composited = applyMaskAlpha(rgba, mask, BG_REMOVAL_SEG_EDGE, BG_REMOVAL_SEG_EDGE, 320, 240);
    const png = encodeTransparentPng(composited, 320, 240);
    expect(pngHasAlphaChannel(png)).toBe(true);
    const alpha = decodePngAlpha(png, 320, 240);
    const opaqueCount = [...alpha].filter((a) => a > 200).length;
    const clearCount = [...alpha].filter((a) => a < 30).length;
    expect(opaqueCount).toBeGreaterThan(0);
    expect(clearCount).toBeGreaterThan(0);
  }, 120_000);

  it("keeps an already-transparent image transparent after segmentation", async () => {
    const rgba = makeRgba(256, 256, [0, 0, 0, 0], {
      x0: 48, y0: 48, x1: 208, y1: 208, rgb: [200, 60, 90],
    });
    const mask = await predictBgMask(rgba, 256, 256, modelBuffer);
    const composited = applyMaskAlpha(rgba, mask, BG_REMOVAL_SEG_EDGE, BG_REMOVAL_SEG_EDGE, 256, 256);
    // Corners (originally transparent) must stay fully transparent.
    expect(composited[3]).toBe(0);
    expect(composited[((0 * 256 + 255) * 4) + 3]).toBe(0);
  }, 120_000);
});

describe("background-removal — model file vendored for the browser", () => {
  it("ships the model and wasm assets in public/", () => {
    expect(modelAvailable).toBe(true);
    expect(existsSync(resolve(SEP, "public", "onnx", "ort-wasm-simd-threaded.wasm"))).toBe(true);
  });

  it("the vendored model is the expected size class (int8)", () => {
    if (!modelAvailable) return;
    const size = readFileSync(MODEL_PATH).byteLength;
    expect(size).toBeGreaterThan(30 * 1024 * 1024);
    expect(size).toBeLessThan(60 * 1024 * 1024);
  });
});