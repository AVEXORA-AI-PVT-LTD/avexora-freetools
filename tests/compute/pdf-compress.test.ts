import { describe, it, expect } from "vitest";
import {
  targetSize,
  worthReplacing,
  describeOutcome,
  formatSize,
  type RecompressResult,
} from "@/tools/ui/pdf/pdf-recompress";

const images = (over: Partial<RecompressResult> = {}): RecompressResult => ({
  scanned: 0,
  replaced: 0,
  bytesSaved: 0,
  ...over,
});

describe("targetSize", () => {
  it("leaves an image alone when it is already within the cap", () => {
    expect(targetSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it("never upscales a small image to meet the cap", () => {
    expect(targetSize(100, 50, 1600)).toEqual({ width: 100, height: 50 });
  });

  it("scales the longest edge down to the cap, preserving aspect ratio", () => {
    expect(targetSize(3200, 1600, 1600)).toEqual({ width: 1600, height: 800 });
    expect(targetSize(1600, 3200, 1600)).toEqual({ width: 800, height: 1600 });
  });

  it("treats Infinity as no cap", () => {
    expect(targetSize(5000, 4000, Infinity)).toEqual({ width: 5000, height: 4000 });
  });

  it("never produces a zero dimension on an extreme aspect ratio", () => {
    const { width, height } = targetSize(10000, 3, 100);
    expect(width).toBe(100);
    expect(height).toBeGreaterThanOrEqual(1);
  });
});

describe("worthReplacing", () => {
  it("accepts a real improvement", () => {
    expect(worthReplacing(1000, 500)).toBe(true);
  });

  it("rejects a marginal one — a quality generation is not worth a few bytes", () => {
    expect(worthReplacing(1000, 960)).toBe(false);
  });

  it("rejects a re-encode that grew, which is the common case for small images", () => {
    expect(worthReplacing(1000, 1400)).toBe(false);
  });

  it("rejects degenerate inputs rather than dividing by zero", () => {
    expect(worthReplacing(0, 0)).toBe(false);
    expect(worthReplacing(1000, 0)).toBe(false);
  });
});

describe("describeOutcome", () => {
  it("does not call a saving that rounds to zero a success", () => {
    // The reported bug: 5.58 MB -> 5.56 MB was announced as a compression.
    const text = describeOutcome(5.58 * 1024 * 1024, 5.56 * 1024 * 1024, images({ scanned: 9 }));
    expect(text).toMatch(/No meaningful saving/);
    expect(text).not.toMatch(/0% smaller/);
  });

  it("reports a real saving with the percentage", () => {
    const text = describeOutcome(1000 * 1024, 400 * 1024, images({ scanned: 4, replaced: 4 }));
    expect(text).toMatch(/60% smaller/);
    expect(text).toMatch(/4 of 4 images re-encoded/);
  });

  it("explains that a lossless run has no images to work with", () => {
    expect(describeOutcome(1000, 999, null)).toMatch(/try re-encoding images/i);
  });

  it("distinguishes no JPEGs found from JPEGs already tight", () => {
    expect(describeOutcome(1000, 999, images({ scanned: 0 }))).toMatch(/no JPEG images/i);
    expect(describeOutcome(1000, 999, images({ scanned: 3 }))).toMatch(/already compressed/i);
  });

  it("keeps singular and plural readable", () => {
    expect(describeOutcome(1000, 999, images({ scanned: 1 }))).toMatch(/its 1 image was/i);
    expect(describeOutcome(1000, 999, images({ scanned: 2 }))).toMatch(/its 2 images were/i);
  });
});

describe("formatSize", () => {
  it("uses MB at and above a megabyte, KB below", () => {
    expect(formatSize(5.58 * 1024 * 1024)).toBe("5.58 MB");
    expect(formatSize(1024 * 1024)).toBe("1.00 MB");
    expect(formatSize(500 * 1024)).toBe("500 KB");
  });
});
