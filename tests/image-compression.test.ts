import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import UPNG from "@pdf-lib/upng";
import {
  canvasToBlob,
  compressionCandidates,
  encodePngCandidates,
  imageCompressionType,
} from "@/tools/ui/image/image-shared";
import ImageCompressor, { outputName } from "@/tools/ui/image/image-compressor";

// The tool renders its download button through the shared auth-gated hooks,
// which require Router/Session providers. It's mocked so the pure component
// (button layout / disabled states) can be rendered without Next context.
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated", update: async () => null }),
  SessionProvider: ({ children }: { children?: import("react").ReactNode }) => children,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, back: () => {}, prefetch: () => {} }),
  usePathname: () => "/tools/image-compressor",
}));

// ---------------------------------------------------------------------------
// imageCompressionType — original format is the source of truth
// ---------------------------------------------------------------------------

describe("imageCompressionType", () => {
  it("maps PNG → image/png", () => {
    expect(imageCompressionType("image/png")).toBe("image/png");
  });

  it("maps JPEG (and image/jpg) → image/jpeg", () => {
    expect(imageCompressionType("image/jpeg")).toBe("image/jpeg");
    expect(imageCompressionType("image/jpg")).toBe("image/jpeg");
  });

  it("maps WebP → image/webp", () => {
    expect(imageCompressionType("image/webp")).toBe("image/webp");
  });

  it("returns null for unsupported formats (GIF, BMP, AVIF, TIFF) — never silently converts", () => {
    expect(imageCompressionType("image/gif")).toBeNull();
    expect(imageCompressionType("image/bmp")).toBeNull();
    expect(imageCompressionType("image/avif")).toBeNull();
    expect(imageCompressionType("image/tiff")).toBeNull();
    expect(imageCompressionType("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// compressionCandidates — STRICTLY format-preserving, bounded
// ---------------------------------------------------------------------------

describe("compressionCandidates (format-preserving)", () => {
  it("JPEG at 80: only JPEG candidates (80,65,50,35) — NEVER WebP", () => {
    expect(compressionCandidates("image/jpeg", 80)).toEqual([
      { type: "image/jpeg", quality: 80 },
      { type: "image/jpeg", quality: 65 },
      { type: "image/jpeg", quality: 50 },
      { type: "image/jpeg", quality: 35 },
    ]);
  });

  it("PNG at 80: only a PNG marker candidate — NEVER WebP/JPEG", () => {
    expect(compressionCandidates("image/png", 80)).toEqual([{ type: "image/png", quality: 80 }]);
  });

  it("WebP at 80: only WebP candidates (80,65,50,35) — NEVER JPEG", () => {
    expect(compressionCandidates("image/webp", 80)).toEqual([
      { type: "image/webp", quality: 80 },
      { type: "image/webp", quality: 65 },
      { type: "image/webp", quality: 50 },
      { type: "image/webp", quality: 35 },
    ]);
  });

  it("unsupported sources (GIF/BMP) produce no candidates", () => {
    expect(compressionCandidates("image/gif", 80)).toEqual([]);
    expect(compressionCandidates("image/bmp", 80)).toEqual([]);
  });

  it("clamps the requested quality to [10, 95]", () => {
    expect(compressionCandidates("image/jpeg", 1)[0]).toEqual({ type: "image/jpeg", quality: 10 });
    expect(compressionCandidates("image/jpeg", 999)[0]).toEqual({ type: "image/jpeg", quality: 95 });
  });

  it("NEGATIVE: no candidate ever switches format", () => {
    for (const [ft] of [
      ["image/jpeg", "image/jpeg"],
      ["image/png", "image/png"],
      ["image/webp", "image/webp"],
    ] as const) {
      const types = compressionCandidates(ft, 80).map((c) => c.type);
      expect(types.every((t) => t === ft)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// outputName — downloaded filename must match the output format
// ---------------------------------------------------------------------------

describe("outputName (filename generation)", () => {
  it("PNG stays PNG (photo.png → photo-compressed.png)", () => {
    expect(outputName("photo.png", "image/png")).toBe("photo-compressed.png");
  });

  it("JPG stays JPG (photo.jpg → photo-compressed.jpg)", () => {
    expect(outputName("photo.jpg", "image/jpeg")).toBe("photo-compressed.jpg");
  });

  it("JPEG extension is preserved (photo.jpeg → photo-compressed.jpeg)", () => {
    expect(outputName("photo.jpeg", "image/jpeg")).toBe("photo-compressed.jpeg");
  });

  it("WebP stays WebP (image.webp → image-compressed.webp)", () => {
    expect(outputName("image.webp", "image/webp")).toBe("image-compressed.webp");
  });

  it("never appends a second extension (design.png never becomes design.png.webp)", () => {
    const n = outputName("design.png", "image/png");
    expect(n).not.toContain(".png.webp");
    expect(n).toBe("design-compressed.png");
  });

  it("falls back to the MIME-correct extension when the input extension is odd", () => {
    expect(outputName("photo.old", "image/jpeg")).toBe("photo-compressed.jpg");
  });
});

// ---------------------------------------------------------------------------
// encodePngCandidates — REAL UPNG encoding, PNG-only, alpha preserved
// ---------------------------------------------------------------------------

function fakeCanvas(rgba: Uint8Array, width: number, height: number): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: () => ({ getImageData: () => ({ data: new Uint8ClampedArray(rgba) }) }),
  } as unknown as HTMLCanvasElement;
}

describe("encodePngCandidates (real UPNG encoder)", () => {
  it("returns image/png Blobs only, all candidates are real PNG files", () => {
    const rgba = new Uint8Array(8 * 8 * 4).fill(255);
    const candidates = encodePngCandidates(fakeCanvas(rgba, 8, 8));
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      expect(c.blob.type).toBe("image/png");
      expect(c.blob.size).toBeGreaterThan(0);
    }
    // First candidate is the lossless encode (quality 0).
    expect(candidates[0].quality).toBe(0);
  });

  it("returns [] for a null 2d context", () => {
    const noCtx = { width: 8, height: 8, getContext: () => null } as unknown as HTMLCanvasElement;
    expect(encodePngCandidates(noCtx)).toEqual([]);
  });

  it("returns [] for a 0x0 canvas", () => {
    const zero = fakeCanvas(new Uint8Array(0), 0, 0);
    expect(encodePngCandidates(zero)).toEqual([]);
  });

  it("does not resize: encoded PNG dimensions equal the canvas dimensions", async () => {
    const w = 1254;
    const h = 1254;
    const rgba = new Uint8Array(w * h * 4).fill(255);
    const candidates = encodePngCandidates(fakeCanvas(rgba, w, h));
    const encoded = await candidates[0].blob.arrayBuffer();
    const decoded = UPNG.decode(encoded as unknown as ArrayBuffer);
    expect(decoded.width).toBe(w);
    expect(decoded.height).toBe(h);
  });

  it("PRESERVES TRANSPARENCY: decoded alpha channel matches the source RGBA", async () => {
    // 4x4: opaque pixels + one column of fully transparent pixels.
    const w = 4;
    const h = 4;
    const rgba = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = 200;
      rgba[i * 4 + 1] = 30;
      rgba[i * 4 + 2] = 30;
      rgba[i * 4 + 3] = 255; // opaque
    }
    // Set pixel (3, any row) fully transparent.
    for (let y = 0; y < h; y++) {
      const i = y * w + 3;
      rgba[i * 4 + 3] = 0;
    }
    const candidates = encodePngCandidates(fakeCanvas(rgba, w, h));
    const encoded = await candidates[0].blob.arrayBuffer();
    const decoded = UPNG.decode(encoded as unknown as ArrayBuffer);
    const frame = new Uint8Array((UPNG.toRGBA8(decoded) as unknown as ArrayBuffer[])[0]);
    // Verify the transparent pixel stayed transparent (alpha 0) in all output.
    for (let y = 0; y < h; y++) {
      const i = y * w + 3;
      expect(frame[i * 4 + 3]).toBe(0); // alpha preserved, NOT opaque/background
    }
    // And an opaque pixel stayed opaque (pixel (0,0) is not in the transparent column).
    expect(frame[0 * 4 + 3]).toBe(255);
  });

  it("PRESERVES SEMI-TRANSPARENT (shadow) pixels", async () => {
    const w = 2;
    const h = 2;
    const rgba = new Uint8Array(w * h * 4);
    rgba[0 + 3] = 128; // semi-transparent pixel
    rgba[4 + 3] = 255; // opaque pixel
    const candidates = encodePngCandidates(fakeCanvas(rgba, w, h));
    const encoded = await candidates[0].blob.arrayBuffer();
    const decoded = UPNG.decode(encoded as unknown as ArrayBuffer);
    const frame = new Uint8Array((UPNG.toRGBA8(decoded) as unknown as ArrayBuffer[])[0]);
    expect(frame[3]).toBeGreaterThan(0);
    expect(frame[3]).toBeLessThan(255);
    expect(frame[4 + 3]).toBe(255);
  });
});

// ---------------------------------------------------------------------------
// Simulated compression pipeline (mirrors image-compressor.tsx compress())
// ---------------------------------------------------------------------------

interface PipelineResult {
  type: string | null; // null = unsupported format
  download: { type: string | null; blobSize: number } | null;
  report: string | null;
  reportKind: "success" | "notice";
  encodes: Array<{ type: string; quality: number }>;
}

function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

async function simulateCompress(params: {
  name: string;
  fileType: string;
  quality: number;
  originalSize: number;
  toBlobSizes?: Record<string, number[]>;
  png?: { rgba: Uint8Array; width: number; height: number };
}): Promise<PipelineResult> {
  const { fileType, quality, originalSize } = params;
  const type = imageCompressionType(fileType);
  let download: PipelineResult["download"] = null;
  let report: string | null = null;
  let reportKind: PipelineResult["reportKind"] = "success";
  const encodes: Array<{ type: string; quality: number }> = [];

  if (!type) {
    reportKind = "notice";
    report = "";
    return { type: null, download: null, report: null, reportKind, encodes };
  }

  const requested = Math.min(95, Math.max(10, Math.round(quality)));
  let bestBlob: Blob | null = null;

  if (type === "image/png" && params.png) {
    // PNG path: real UPNG encodePngCandidates over supplied RGBA.
    const canvas = fakeCanvas(params.png.rgba, params.png.width, params.png.height);
    for (const candidate of encodePngCandidates(canvas)) {
      encodes.push({ type: "image/png", quality: candidate.quality });
      if (candidate.blob.size < originalSize && (!bestBlob || candidate.blob.size < bestBlob.size)) {
        bestBlob = candidate.blob;
      }
    }
  } else {
    // JPEG/WebP path: format-preserving quality walkdown via scripted sizes.
    const counters: Record<string, number> = {};
    const canvas = {
      width: 1,
      height: 1,
      toBlob: (cb: (b: Blob | null, type: string) => void, t: string, q?: number) => {
        encodes.push({ type: t, quality: q != null ? Math.round(q * 100) : -1 });
        const sizes = params.toBlobSizes?.[t] ?? [originalSize + 1];
        const idx = counters[t] ?? 0;
        counters[t] = idx + 1;
        cb(new Blob(["a".repeat(sizes[Math.min(idx, sizes.length - 1)])]), t);
      },
    } as unknown as HTMLCanvasElement;
    for (const c of compressionCandidates(fileType, requested)) {
      const blob = await canvasToBlob(canvas, c.type, c.quality / 100);
      if (blob.size < originalSize && (!bestBlob || blob.size < bestBlob.size)) {
        bestBlob = blob;
      }
    }
  }

  if (bestBlob) {
    const saved = originalSize - bestBlob.size;
    download = { type, blobSize: bestBlob.size };
    report = `Compressed from ${fmtSize(originalSize)} to ${fmtSize(bestBlob.size)} (${Math.round((saved / originalSize) * 100)}% smaller).`;
  } else {
    reportKind = "notice";
    report = "This image could not be reduced further while preserving its original format.";
  }

  return { type, download, report, reportKind, encodes };
}

describe("compression pipeline (simulated)", () => {
  it("JPEG that is already smaller → downloads the JPEG result, never changes format", async () => {
    const r = await simulateCompress({
      name: "photo.jpg",
      fileType: "image/jpeg",
      quality: 80,
      originalSize: 983000,
      toBlobSizes: { "image/jpeg": [500000] },
    });
    expect(r.type).toBe("image/jpeg");
    expect(r.download).toEqual({ type: "image/jpeg", blobSize: 500000 });
    // Only same-format JPEG candidates are ever tried.
    expect(r.encodes.every((e) => e.type === "image/jpeg")).toBe(true);
    expect(r.report).toContain("49% smaller");
  });

  it("PNG regression (983 KB → 1.60 MB re-encode) is handled WITHOUT changing format", async () => {
    // A real 1254×1254 solid-colour canvas: UPNG lossless output is far smaller
    // than 983 KB, so the tool returns a PNG smaller than the original.
    const w = 1254;
    const h = 1254;
    const rgba = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = 220;
      rgba[i * 4 + 1] = 180;
      rgba[i * 4 + 2] = 150;
      rgba[i * 4 + 3] = 255;
    }
    const r = await simulateCompress({
      name: "e7990dc7-2290-4fab-a1e4-14a9f7d625c1.png",
      fileType: "image/png",
      quality: 80,
      originalSize: 983000, // 983 KB
      png: { rgba, width: w, height: h },
    });
    expect(r.type).toBe("image/png"); // STILL PNG — never WebP/JPEG
    expect(r.download).toBeTruthy();
    expect(r.download!.type).toBe("image/png");
    expect(r.download!.blobSize).toBeLessThan(983000); // genuinely smaller
    expect(r.encodes.every((e) => e.type === "image/png")).toBe(true);
  });

  it("an incompressible PNG after ALL candidates → graceful format-preserving message", async () => {
    // Solid-color image encodes to an UPNG PNG far smaller than the absurd
    // original size, so use a tiny original that no PNG could beat.
    const w = 4;
    const h = 4;
    const rgba = new Uint8Array(w * h * 4).fill(255);
    const r = await simulateCompress({
      name: "tiny.png",
      fileType: "image/png",
      quality: 80,
      originalSize: 1, // 1 byte — nothing can be smaller
      png: { rgba, width: w, height: h },
    });
    expect(r.type).toBe("image/png");
    expect(r.download).toBeNull();
    expect(r.reportKind).toBe("notice");
    expect(r.report).toBe(
      "This image could not be reduced further while preserving its original format.",
    );
  });

  it("JPEG walk-down: 1.60 MB @80 → smaller JPEG found at lower quality (still JPEG)", async () => {
    const r = await simulateCompress({
      name: "photo.jpg",
      fileType: "image/jpeg",
      quality: 80,
      originalSize: 983000,
      toBlobSizes: { "image/jpeg": [1600000, 1500000, 900000, 800000] },
    });
    expect(r.download).toBeTruthy();
    expect(r.download!.type).toBe("image/jpeg");
    expect(r.download!.blobSize).toBe(800000);
    expect(r.encodes).toEqual([
      { type: "image/jpeg", quality: 80 },
      { type: "image/jpeg", quality: 65 },
      { type: "image/jpeg", quality: 50 },
      { type: "image/jpeg", quality: 35 },
    ]);
  });

  it("WebP walk-down stays WebP (never JPEG)", async () => {
    const r = await simulateCompress({
      name: "image.webp",
      fileType: "image/webp",
      quality: 80,
      originalSize: 983000,
      toBlobSizes: { "image/webp": [1600000, 900000, 800000, 990000] },
    });
    expect(r.type).toBe("image/webp");
    expect(r.download).toEqual({ type: "image/webp", blobSize: 800000 });
    expect(r.encodes.every((e) => e.type === "image/webp")).toBe(true);
  });

  it("unsupported format (GIF) → graceful unsupported result, no conversion", async () => {
    const r = await simulateCompress({
      name: "anim.gif",
      fileType: "image/gif",
      quality: 80,
      originalSize: 50000,
    });
    expect(r.type).toBeNull();
    expect(r.download).toBeNull();
    expect(r.encodes).toHaveLength(0);
  });

  it("clamps the slider: 999 → 95, 1 → 10", async () => {
    const hi = await simulateCompress({
      name: "p.jpg", fileType: "image/jpeg", quality: 999, originalSize: 983000,
      toBlobSizes: { "image/jpeg": [500000] },
    });
    expect(hi.encodes[0].quality).toBe(95);
    const lo = await simulateCompress({
      name: "p.jpg", fileType: "image/jpeg", quality: 1, originalSize: 983000,
      toBlobSizes: { "image/jpeg": [500000] },
    });
    expect(lo.encodes[0].quality).toBe(10);
  });

  it("reports percentage from ACTUAL sizes (never the slider)", async () => {
    const r = await simulateCompress({
      name: "p.jpg", fileType: "image/jpeg", quality: 80, originalSize: 50000,
      toBlobSizes: { "image/jpeg": [30000] },
    });
    expect(r.report).toBe("Compressed from 49 KB to 29 KB (40% smaller).");
  });
});

describe("ImageCompressor component render", () => {
  it("renders the empty state with a disabled button and no quality slider", () => {
    const html = renderToStaticMarkup(createElement(ImageCompressor));
    expect(html).toContain("Click or drag an image here");
    expect(html).toContain("Compress Image");
    expect(html).toContain("disabled=\"\"");
    expect(html).not.toContain("ic-quality");
  });
});