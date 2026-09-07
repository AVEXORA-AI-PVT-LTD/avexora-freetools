import { describe, expect, it } from "vitest";
import { computeCropRect, type CropBox } from "@/tools/ui/image/image-shared";

// Build a display rect that preserves the source image's aspect ratio, scaled
// down by `factor` (1 < factor = the image is displayed smaller than natural).
function displayRect(naturalW: number, naturalH: number, factor: number) {
  return { width: naturalW / factor, height: naturalH / factor };
}

const SIZES = [
  { w: 800, h: 500 },
  { w: 500, h: 800 },
  { w: 512, h: 512 },
  { w: 100, h: 100 },
  { w: 2048, h: 1536 },
];

describe("computeCropRect — boundary regression", () => {
  it("full-image crop returns the complete source dimensions (not blank, not zero)", () => {
    for (const size of SIZES) {
      const rect = displayRect(size.w, size.h, 2);
      const box: CropBox = { x: 0, y: 0, w: rect.width, h: rect.height };
      const r = computeCropRect(box, rect, size.w, size.h);
      expect(r).toEqual({ sx: 0, sy: 0, outW: size.w, outH: size.h });
    }
  });

  it("never produces negative, zero, or out-of-bounds crop rects for boundary and corner crops", () => {
    for (const size of SIZES) {
      const rect = displayRect(size.w, size.h, 2);
      const boxes: CropBox[] = [
        // Full image
        { x: 0, y: 0, w: rect.width, h: rect.height },
        // Top-left corner
        { x: 0, y: 0, w: rect.width * 0.5, h: rect.height * 0.5 },
        // Top-right corner
        { x: rect.width * 0.5, y: 0, w: rect.width * 0.5, h: rect.height * 0.5 },
        // Bottom-left corner
        { x: 0, y: rect.height * 0.5, w: rect.width * 0.5, h: rect.height * 0.5 },
        // Bottom-right corner
        { x: rect.width * 0.5, y: rect.height * 0.5, w: rect.width * 0.5, h: rect.height * 0.5 },
        // Touching each full edge
        { x: 0, y: rect.height * 0.25, w: rect.width, h: rect.height * 0.5 },
        { x: rect.width * 0.25, y: 0, w: rect.width * 0.5, h: rect.height },
      ];
      for (const box of boxes) {
        const r = computeCropRect(box, rect, size.w, size.h);
        expect(r, `size=${size.w}x${size.h} box=${JSON.stringify(box)}`).not.toBeNull();
        expect(r!.sx).toBeGreaterThanOrEqual(0);
        expect(r!.sy).toBeGreaterThanOrEqual(0);
        expect(r!.outW).toBeGreaterThanOrEqual(1);
        expect(r!.outH).toBeGreaterThanOrEqual(1);
        expect(r!.sx + r!.outW).toBeLessThanOrEqual(size.w);
        expect(r!.sy + r!.outH).toBeLessThanOrEqual(size.h);
      }
    }
  });

  it("right-boundary crop includes the rightmost pixels without going out of bounds", () => {
    const rect = displayRect(800, 500, 2); // natural 800x500, display 400x250
    // Crop the right half of the image.
    const r = computeCropRect({ x: 200, y: 0, w: 200, h: 250 }, rect, 800, 500);
    expect(r).toEqual({ sx: 400, sy: 0, outW: 400, outH: 500 });
    expect(r!.sx + r!.outW).toBe(800);
  });

  it("bottom-boundary crop includes the bottommost pixels without going out of bounds", () => {
    const rect = displayRect(800, 500, 2);
    const r = computeCropRect({ x: 0, y: 125, w: 400, h: 125 }, rect, 800, 500);
    // bottom half: sy = 250, outH = 250 → sy+outH = 500
    expect(r).toEqual({ sx: 0, sy: 250, outW: 800, outH: 250 });
    expect(r!.sy + r!.outH).toBe(500);
  });

  it("bottom-right corner crop lands exactly on the boundary and includes corner pixels", () => {
    const rect = displayRect(800, 500, 2);
    const r = computeCropRect({ x: 350, y: 200, w: 50, h: 50 }, rect, 800, 500);
    expect(r).toEqual({ sx: 700, sy: 400, outW: 100, outH: 100 });
    expect(r!.sx + r!.outW).toBe(800);
    expect(r!.sy + r!.outH).toBe(500);
  });

  it("near-boundary crop (few pixels from edge) stays in bounds and keeps content", () => {
    const rect = displayRect(800, 500, 2);
    // Crop a few display px from the right/bottom edges.
    const r = computeCropRect({ x: 390, y: 240, w: 9, h: 9 }, rect, 800, 500);
    expect(r!.sx).toBeGreaterThanOrEqual(0);
    expect(r!.sx + r!.outW).toBeLessThanOrEqual(800);
    expect(r!.sy + r!.outH).toBeLessThanOrEqual(500);
    expect(r!.outW).toBeGreaterThan(0);
    expect(r!.outH).toBeGreaterThan(0);
  });

  it("handles a non-integer display scale without overshooting the boundary", () => {
    const rect = displayRect(800, 500, 1.6); // non-integer scale
    // Full right+bottom crop: box spans the whole display rect.
    const r = computeCropRect({ x: 0, y: 0, w: rect.width, h: rect.height }, rect, 800, 500);
    expect(r!.sx).toBe(0);
    expect(r!.sy).toBe(0);
    expect(r!.sx + r!.outW).toBeLessThanOrEqual(800);
    expect(r!.sy + r!.outH).toBeLessThanOrEqual(500);
    expect(r!.outW).toBeGreaterThanOrEqual(1);
    expect(r!.outH).toBeGreaterThanOrEqual(1);
  });

  it("clamps floating-point overshoot instead of producing an out-of-bounds source rect", () => {
    const rect = displayRect(800, 500, 2);
    // A hair of floating-point overshoot at the right boundary from a drag.
    const r = computeCropRect({ x: 200.0000001, y: 0, w: 199.9999999, h: 250 }, rect, 800, 500);
    expect(r).not.toBeNull();
    expect(r!.sx).toBeGreaterThanOrEqual(0);
    expect(r!.sx + r!.outW).toBeLessThanOrEqual(800);
    expect(r!.outW).toBeGreaterThanOrEqual(1);
  });

  it("returns null (not a blank crop) when width/height would be non-positive", () => {
    const rect = displayRect(800, 500, 2);
    expect(computeCropRect({ x: 0, y: 0, w: 0, h: 0 }, rect, 800, 500)).toBeNull();
    expect(computeCropRect({ x: 0, y: 0, w: 0, h: 100 }, rect, 800, 500)).toBeNull();
    expect(computeCropRect({ x: 0, y: 0, w: 100, h: 0 }, rect, 800, 500)).toBeNull();
  });

  it("is consistent after repeated repositioning (center → edge → corner → center)", () => {
    const naturalW = 800;
    const naturalH = 500;
    const rect = displayRect(naturalW, naturalH, 2);
    const boxes: CropBox[] = [
      { x: 150, y: 100, w: 100, h: 100 }, // center
      { x: 390, y: 100, w: 10, h: 200 }, // right edge
      { x: 395, y: 245, w: 5, h: 5 }, // bottom-right corner
      { x: 150, y: 100, w: 100, h: 100 }, // center again
      { x: 0, y: 200, w: 300, h: 50 }, // left edge
    ];
    for (const box of boxes) {
      const r = computeCropRect(box, rect, naturalW, naturalH);
      expect(r, `box=${JSON.stringify(box)}`).not.toBeNull();
      expect(r!.sx).toBeGreaterThanOrEqual(0);
      expect(r!.sy).toBeGreaterThanOrEqual(0);
      expect(r!.sx + r!.outW).toBeLessThanOrEqual(naturalW);
      expect(r!.sy + r!.outH).toBeLessThanOrEqual(naturalH);
      expect(r!.outW).toBeGreaterThanOrEqual(1);
      expect(r!.outH).toBeGreaterThanOrEqual(1);
    }
  });
});
