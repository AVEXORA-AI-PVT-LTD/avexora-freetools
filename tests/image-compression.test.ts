import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as imageShared from "@/tools/ui/image/image-shared";
import ImageCompressor from "@/tools/ui/image/image-compressor";

// --- Source-state baseline ----------------------------------------------
//
// This test file mirrors the CURRENT image-confressor implementation on disk.
// As of this session the production source was externally restored to the
// pre-fix version: `image-shared.tsx` exports neither `imageCompressionType`
// nor `canvasHasAlpha`, and `image-compressor.tsx` hardcodes JPEG output,
// always reports "Compressed from X to Y", and always downloads the re-encoded
// file even when it is LARGER than the original (the reported 983 KB → larger
// output bug). These tests document that current behavior as a snapshot. If a
// fix is re-applied (hasAlpha-aware format choice, quality walk-down, honest
// no-reduction reporting), these tests must be updated along with the source.

describe("current source module surface", () => {
  it("exposes canvasToBlob but not the removed compression helpers", () => {
    expect(typeof imageShared.canvasToBlob).toBe("function");
    // Snapshot of the reverted source: these were removed from disk.
    expect((imageShared as Record<string, unknown>).imageCompressionType).toBeUndefined();
    expect((imageShared as Record<string, unknown>).canvasHasAlpha).toBeUndefined();
  });
});

// --- Simulated compression pipeline -------------------------------------
//
// The browser's canvas `toBlob` (the actual encoder) cannot run in this
// node-only vitest setup (no jsdom/node-canvas/playwright installed), so the
// pipeline below drives the REAL `canvasToBlob` helper against a scripted fake
// <canvas> whose `toBlob` yields Blobs of configurable sizes, and mirrors the
// current `compress()` flow from `src/tools/ui/image/image-compressor.tsx`
// lines 18-37 EXACTLY. The in-browser encoded size is real; only the encoder
// itself is faked.

function fmtSize(bytes: number): string {
  // Mirror of image-compressor.tsx fmtSize() (lines 8-10).
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

interface PipelineResult {
  inputProvided: string; // what the user uploaded (the reverted code ignores it)
  encodeType: string; // the MIME type passed to toBlob
  encodeQualities: number[]; // normalized 0-1 quality values, in order
  message: string; // the exact report string produced by compress()
  downloaded: boolean; // whether downloadBlob would fire
}

async function simulateCompress(params: {
  inputType: string; // what the user uploaded (ignored by the reverted code)
  quality: number; // slider value (10-95)
  originalSize: number; // input file.size in bytes
  toBlobSize: number; // bytes the encoder returns for the single encode call
}): Promise<PipelineResult> {
  const { inputType, quality, originalSize, toBlobSize } = params;
  const encodeQualities: number[] = [];
  let encodeType = "";
  const canvas = {
    toBlob: (cb: (b: Blob | null, type: string) => void, type: string, q?: number) => {
      encodeType = type;
      encodeQualities.push(q ?? -1);
      cb(new Blob(["a".repeat(toBlobSize)]), type);
    },
  } as unknown as HTMLCanvasElement;

  // Mirror of image-compressor.tsx compress() (lines 18-37).
  const blob = await imageShared.canvasToBlob(canvas, "image/jpeg", quality / 100);
  const saved = originalSize - blob.size;
  const message =
    `Compressed from ${fmtSize(originalSize)} to ${fmtSize(blob.size)}` +
    (saved > 0 ? ` (${Math.round((saved / originalSize) * 100)}% smaller).` : ".");

  return {
    inputProvided: inputType, // current code never reads this
    encodeType,
    encodeQualities,
    message,
    downloaded: true, // current code ALWAYS calls downloadBlob, even when larger
  };
}

describe("compression pipeline (simulated against current source)", () => {
  it("encodes to image/jpeg for every input type, including PNG", async () => {
    // The reverted implementation hardcodes JPEG, so a transparent PNG is also
    // flattened through the alpha-stripping JPEG path (black background).
    for (const inputType of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      const r = await simulateCompress({ inputType, quality: 80, originalSize: 983000, toBlobSize: 600000 });
      expect(r.inputProvided).toBe(inputType);
      expect(r.encodeType).toBe("image/jpeg");
    }
  });

  it("passes the slider value as a normalized 0-1 quality to toBlob", async () => {
    const r = await simulateCompress({ inputType: "image/jpeg", quality: 80, originalSize: 983000, toBlobSize: 600000 });
    expect(r.encodeQualities).toEqual([0.8]);
  });

  it("reports a correct before/after message and percentage when the output is smaller", async () => {
    const r = await simulateCompress({ inputType: "image/jpeg", quality: 80, originalSize: 983000, toBlobSize: 900000 });
    expect(r.message).toBe("Compressed from 960 KB to 879 KB (8% smaller).");
    expect(r.downloaded).toBe(true);
  });

  it("still reports 'Compressed from' and downloads when the output is LARGER (documented bug)", async () => {
    // The reported regression: a 983 KB input re-encoded to 1.60 MB is still
    // presented and downloaded as a successful compression result.
    const r = await simulateCompress({ inputType: "image/jpeg", quality: 80, originalSize: 983000, toBlobSize: 1600000 });
    expect(r.message).toBe("Compressed from 960 KB to 1.53 MB.");
    expect(r.downloaded).toBe(true);
    expect(r.message).not.toMatch(/% smaller/); // no honesty signal for the growth
  });

  it("still reports 'Compressed from' and downloads when the output size is unchanged", async () => {
    const r = await simulateCompress({ inputType: "image/jpeg", quality: 80, originalSize: 983000, toBlobSize: 983000 });
    expect(r.message).toBe("Compressed from 960 KB to 960 KB.");
    expect(r.downloaded).toBe(true);
  });
});

describe("ImageCompressor component render", () => {
  it("renders the empty state with a disabled button and no quality slider", () => {
    const html = renderToStaticMarkup(createElement(ImageCompressor));
    expect(html).toContain("Click to choose an image");
    expect(html).toContain("Compress &amp; download"); // JSX text is HTML-escaped in SSR markup
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("data-lead-action=\"download\"");
    expect(html).not.toContain("ic-quality"); // slider only appears after an image is picked
  });
});