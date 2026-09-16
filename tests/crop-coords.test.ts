import { describe, expect, it } from "vitest";
import {
  clientToImagePoint,
  computeCropRect,
  cropBoxFromPoints,
  cropOverlayBox,
  imageOffsetInContainer,
} from "@/tools/compute/image/crop-coords";

describe("clientToImagePoint — viewport → displayed image", () => {
  it("maps the spec example: rect left=100 top=200 size=800x600, client (300,350) → (200,150)", () => {
    const rect = { left: 100, top: 200, width: 800, height: 600 };
    expect(clientToImagePoint(300, 350, rect)).toEqual({ x: 200, y: 150 });
  });

  it("maps every interior point to the exact image position regardless of rect offset", () => {
    const rect = { left: 60, top: 40, width: 400, height: 300 };
    // Top-left of the image
    expect(clientToImagePoint(60, 40, rect)).toEqual({ x: 0, y: 0 });
    // Center of the image
    expect(clientToImagePoint(260, 190, rect)).toEqual({ x: 200, y: 150 });
    // Bottom-right of the image
    expect(clientToImagePoint(460, 340, rect)).toEqual({ x: 400, y: 300 });
  });

  it("is scroll-safe because it works purely in client coords vs the current rect", () => {
    // The page scrolled: the whole element moved up the viewport, so left/top changed.
    const rect = { left: 10, top: -500, width: 640, height: 480 };
    expect(clientToImagePoint(330, -260, rect)).toEqual({ x: 320, y: 240 });
  });

  it("clamps to the image bounds for pointer events outside the image", () => {
    const rect = { left: 50, top: 50, width: 200, height: 150 };
    expect(clientToImagePoint(0, 0, rect)).toEqual({ x: 0, y: 0 }); // above-left
    expect(clientToImagePoint(999, 999, rect)).toEqual({ x: 200, y: 150 }); // below-right
    expect(clientToImagePoint(150, 10, rect)).toEqual({ x: 100, y: 0 }); // above, inside x
    expect(clientToImagePoint(10, 150, rect)).toEqual({ x: 0, y: 100 }); // left, inside y
  });

  it("returns 0 when the image has no rendered size", () => {
    const rect = { left: 0, top: 0, width: 0, height: 0 };
    expect(clientToImagePoint(50, 50, rect)).toEqual({ x: 0, y: 0 });
  });
});

describe("cropBoxFromPoints — any drag direction", () => {
  it("normalizes a left→right / top→bottom drag", () => {
    expect(cropBoxFromPoints({ x: 10, y: 20 }, { x: 110, y: 70 })).toEqual({ x: 10, y: 20, w: 100, h: 50 });
  });

  it("normalizes a right→left drag", () => {
    expect(cropBoxFromPoints({ x: 110, y: 20 }, { x: 10, y: 70 })).toEqual({ x: 10, y: 20, w: 100, h: 50 });
  });

  it("normalizes a bottom→top drag", () => {
    expect(cropBoxFromPoints({ x: 10, y: 70 }, { x: 110, y: 20 })).toEqual({ x: 10, y: 20, w: 100, h: 50 });
  });

  it("normalizes a diagonal bottom-right → top-left drag", () => {
    expect(cropBoxFromPoints({ x: 300, y: 240 }, { x: 76, y: 104 })).toEqual({ x: 76, y: 104, w: 224, h: 136 });
  });

  it("yields a zero-size box for a simple click", () => {
    expect(cropBoxFromPoints({ x: 50, y: 50 }, { x: 50, y: 50 })).toEqual({ x: 50, y: 50, w: 0, h: 0 });
  });
});

describe("imageOffsetInContainer / cropOverlayBox — overlay tracks the rendered image", () => {
  it("reports the image's offset inside a padded container", () => {
    const imageRect = { left: 24, top: 16, width: 400, height: 300 };
    const containerRect = { left: 0, top: 0, width: 448, height: 348 };
    expect(imageOffsetInContainer(imageRect, containerRect)).toEqual({ x: 24, y: 16 });
  });

  it("places the overlay at box.x + image offset so it aligns with the pointer", () => {
    const imageRect = { left: 24, top: 16, width: 400, height: 300 };
    const containerRect = { left: 0, top: 0, width: 448, height: 348 };
    const box = { x: 76, y: 104, w: 200, h: 120 };
    const overlay = cropOverlayBox(box, imageRect, containerRect);
    expect(overlay).toEqual({ left: 100, top: 120, width: 200, height: 120 });
  });

  it("handles an image that does not fill its container (letterbox/gap)", () => {
    // Container is wider/taller than the rendered image by 40px on X and 50px on Y.
    const imageRect = { left: 120, top: 300, width: 600, height: 400 };
    const containerRect = { left: 0, top: 0, width: 800, height: 600 };
    const box = { x: 30, y: 40, w: 100, h: 80 };
    expect(cropOverlayBox(box, imageRect, containerRect)).toEqual({ left: 150, top: 340, width: 100, height: 80 });
  });

  it("degenerates to the box itself when image and container share an origin", () => {
    const imageRect = { left: 0, top: 0, width: 500, height: 500 };
    const containerRect = { left: 0, top: 0, width: 500, height: 500 };
    const box = { x: 10, y: 20, w: 30, h: 40 };
    expect(cropOverlayBox(box, imageRect, containerRect)).toEqual({ left: 10, top: 20, width: 30, height: 40 });
  });
});

describe("computeCropRect — displayed → natural pixels", () => {
  it("uses independent X and Y scale factors when the display ratio differs from natural", () => {
    // Natural 1000x2500 drawn into a 500x500 display rect → scaleX=2, scaleY=5.
    const rect = { left: 0, top: 0, width: 500, height: 500 };
    expect(computeCropRect({ x: 0, y: 0, w: 500, h: 500 }, rect, 1000, 2500)).toEqual({
      sx: 0,
      sy: 0,
      outW: 1000,
      outH: 2500,
    });
    expect(computeCropRect({ x: 250, y: 250, w: 250, h: 250 }, rect, 1000, 2500)).toEqual({
      sx: 500,
      sy: 1250,
      outW: 500,
      outH: 1250,
    });
  });

  it("scales a typical displayed crop back to the natural grid", () => {
    const rect = { left: 50, top: 60, width: 400, height: 300 };
    expect(computeCropRect({ x: 100, y: 75, w: 200, h: 150 }, rect, 800, 600)).toEqual({
      sx: 200,
      sy: 150,
      outW: 400,
      outH: 300,
    });
  });

  it("never exceeds the natural bounds at any displayed scale", () => {
    for (const scale of [0.5, 1, 1.5, 3.2]) {
      const rect = { left: 0, top: 0, width: 800 / scale, height: 600 / scale };
      const r = computeCropRect({ x: 0, y: 0, w: rect.width, h: rect.height }, rect, 800, 600);
      expect(r).toEqual({ sx: 0, sy: 0, outW: 800, outH: 600 });
    }
  });

  it("returns null for non-positive dimensions instead of a blank crop", () => {
    const rect = { left: 0, top: 0, width: 100, height: 100 };
    expect(computeCropRect({ x: 0, y: 0, w: 0, h: 0 }, rect, 100, 100)).toBeNull();
    expect(computeCropRect({ x: 0, y: 0, w: 0, h: 10 }, rect, 100, 100)).toBeNull();
    expect(computeCropRect({ x: 0, y: 0, w: 10, h: 0 }, rect, 100, 100)).toBeNull();
    expect(
      computeCropRect({ x: 10, y: 10, w: 10, h: 10 }, { width: 0, height: 0 }, 100, 100),
    ).toBeNull();
  });
});

describe("full pipeline — pointer → box → overlay → output share one coordinate system", () => {
  const imageRect = { left: 24, top: 16, width: 400, height: 300 }; // image inset by padding
  const containerRect = { left: 0, top: 0, width: 448, height: 348 };
  const NATURAL = { w: 800, h: 600 };

  it("no offset: selection start equals the pointer position, forward drag", () => {
    const p1 = clientToImagePoint(100, 120, imageRect); // (76, 104)
    const p2 = clientToImagePoint(300, 224, imageRect); // (276, 208)
    expect(p1).toEqual({ x: 76, y: 104 });
    expect(p2).toEqual({ x: 276, y: 208 });

    const box = cropBoxFromPoints(p1, p2);
    expect(box).toEqual({ x: 76, y: 104, w: 200, h: 104 });

    const overlay = cropOverlayBox(box, imageRect, containerRect);
    // Overlay rendered inside the container lands exactly under the starting pointer.
    expect(overlay.left).toBe(100);
    expect(overlay.top).toBe(120);
    // And the dragged-to pointer is exactly at the box's far corner.
    expect(overlay.left + overlay.width).toBe(300);
    expect(overlay.top + overlay.height).toBe(224);

    const r = computeCropRect(box, imageRect, NATURAL.w, NATURAL.h);
    expect(r).toEqual({ sx: 152, sy: 208, outW: 400, outH: 208 });
    // The output matches the visible selection scaled by naturalWidth/displayWidth.
    expect(r!.sx / 2).toBeCloseTo(box.x, 5);
    expect(r!.sy / 2).toBeCloseTo(box.y, 5);
  });

  it("no offset: reverse diagonal drag produces the identical box and output", () => {
    const a1 = clientToImagePoint(100, 120, imageRect); // (76, 104)
    const a2 = clientToImagePoint(300, 240, imageRect); // (276, 224)
    const reverse = cropBoxFromPoints(a2, a1);
    const forward = cropBoxFromPoints(a1, a2);
    expect(reverse).toEqual(forward);
    expect(cropOverlayBox(reverse, imageRect, containerRect)).toEqual({ left: 100, top: 120, width: 200, height: 120 });
  });

  it("clamps a drag that exits the image without breaking the overlay or output", () => {
    const p1 = clientToImagePoint(24, 16, imageRect); // image top-left
    const p2 = clientToImagePoint(9999, 9999, imageRect); // clamped to image bottom-right
    expect(p1).toEqual({ x: 0, y: 0 });
    expect(p2).toEqual({ x: 400, y: 300 });

    const box = cropBoxFromPoints(p1, p2);
    expect(box).toEqual({ x: 0, y: 0, w: 400, h: 300 });

    const overlay = cropOverlayBox(box, imageRect, containerRect);
    expect(overlay).toEqual({ left: 24, top: 16, width: 400, height: 300 });
    expect(overlay.left + overlay.width).toBeLessThanOrEqual(containerRect.width);
    expect(overlay.top + overlay.height).toBeLessThanOrEqual(containerRect.height);

    const r = computeCropRect(box, imageRect, NATURAL.w, NATURAL.h);
    expect(r).toEqual({ sx: 0, sy: 0, outW: 800, outH: 600 });
  });

  it("a box dragged partially off the right/bottom edges is clamped to the image", () => {
    const p1 = { x: 300, y: 200 };
    const p2 = clientToImagePoint(500, 400, imageRect); // beyond image right/bottom → clamped
    expect(p2).toEqual({ x: 400, y: 300 });
    const box = cropBoxFromPoints(p1, p2);
    expect(box).toEqual({ x: 300, y: 200, w: 100, h: 100 });

    const r = computeCropRect(box, imageRect, NATURAL.w, NATURAL.h);
    expect(r!.sx).toBe(600);
    expect(r!.sy).toBe(400);
    expect(r!.sx + r!.outW).toBe(800);
    expect(r!.sy + r!.outH).toBe(600);
  });

  it("full-image crop from a diagonal drag hits the exact boundary (no blank edges)", () => {
    const box = { x: 0, y: 0, w: imageRect.width, h: imageRect.height };
    const r = computeCropRect(box, imageRect, NATURAL.w, NATURAL.h);
    expect(r).toEqual({ sx: 0, sy: 0, outW: 800, outH: 600 });
  });
});