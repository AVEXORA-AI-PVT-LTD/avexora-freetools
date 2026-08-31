import { describe, expect, it } from "vitest";
import { rotateFlipGeometry, type RotateFlipGeometry } from "@/tools/ui/image/image-shared";

/**
 * Model of the browser canvas transformation used by the component:
 *   translate(cx, cy)  rotate(rad)  scale(flipH, flipV)  drawImage(image, -srcW/2, -srcH/2)
 * Maps an image-space pixel (u, v) to output-canvas pixel (x, y).
 */
function mapPoint(geo: RotateFlipGeometry, u: number, v: number): { x: number; y: number } {
  const sx = (u - geo.srcW / 2) * geo.flipH;
  const sy = (v - geo.srcH / 2) * geo.flipV;
  return {
    x: geo.cx + sx * geo.cos - sy * geo.sin,
    y: geo.cy + sx * geo.sin + sy * geo.cos,
  };
}

const EPS = 1e-9;

const SIZES = [
  { srcW: 800, srcH: 500 },
  { srcW: 500, srcH: 800 },
  { srcW: 512, srcH: 512 },
];

const COMBOS: Array<[number, boolean, boolean]> = [
  [0, false, false],
  [90, false, false],
  [180, false, false],
  [270, false, false],
  [0, true, false],
  [90, true, false],
  [180, true, false],
  [270, true, false],
  [0, false, true],
  [90, false, true],
  [180, false, true],
  [270, false, true],
  [0, true, true],
  [90, true, true],
  [180, true, true],
  [270, true, true],
];

describe("rotateFlipGeometry — output dimensions", () => {
  it.each(SIZES)("swaps width/height for 90°/270°, keeps them for 0°/180° ($srcW×$srcH)", ({ srcW, srcH }) => {
    expect(rotateFlipGeometry(srcW, srcH, 0, false, false)).toMatchObject({ outW: srcW, outH: srcH });
    expect(rotateFlipGeometry(srcW, srcH, 90, false, false)).toMatchObject({ outW: srcH, outH: srcW });
    expect(rotateFlipGeometry(srcW, srcH, 180, false, false)).toMatchObject({ outW: srcW, outH: srcH });
    expect(rotateFlipGeometry(srcW, srcH, 270, false, false)).toMatchObject({ outW: srcH, outH: srcW });
  });

  it("reports expected dimensions for the reported non-square example (800×500)", () => {
    expect(rotateFlipGeometry(800, 500, 90, false, false).outW).toBe(500);
    expect(rotateFlipGeometry(800, 500, 90, false, false).outH).toBe(800);
    expect(rotateFlipGeometry(800, 500, 180, false, false).outW).toBe(800);
    expect(rotateFlipGeometry(800, 500, 180, false, false).outH).toBe(500);
    expect(rotateFlipGeometry(800, 500, 270, false, false).outW).toBe(500);
    expect(rotateFlipGeometry(800, 500, 270, false, false).outH).toBe(800);
  });

  it("reports expected dimensions for a portrait image (500×800)", () => {
    expect(rotateFlipGeometry(500, 800, 90, false, false).outW).toBe(800);
    expect(rotateFlipGeometry(500, 800, 90, false, false).outH).toBe(500);
    expect(rotateFlipGeometry(500, 800, 270, false, false).outW).toBe(800);
    expect(rotateFlipGeometry(500, 800, 270, false, false).outH).toBe(500);
  });
});

describe("rotateFlipGeometry — positional regression", () => {
  it("keeps the complete image within the canvas (no clipping, no shifting) for every rotation+flip combination", () => {
    for (const size of SIZES) {
      for (const [angle, flipH, flipV] of COMBOS) {
        const geo = rotateFlipGeometry(size.srcW, size.srcH, angle, flipH, flipV);
        const corners: Array<[number, number]> = [
          [0, 0],
          [size.srcW, 0],
          [0, size.srcH],
          [size.srcW, size.srcH],
        ];
        for (const [u, v] of corners) {
          const p = mapPoint(geo, u, v);
          expect(p.x, `angle=${angle} flipH=${flipH} flipV=${flipV} size=${size.srcW}x${size.srcH} corner=${u},${v}`)
            .toBeGreaterThanOrEqual(-EPS);
          expect(p.x).toBeLessThanOrEqual(geo.outW + EPS);
          expect(p.y).toBeGreaterThanOrEqual(-EPS);
          expect(p.y).toBeLessThanOrEqual(geo.outH + EPS);
        }
      }
    }
  });

  it("centers the image on the canvas (image center maps to canvas center)", () => {
    for (const size of SIZES) {
      for (const [angle, flipH, flipV] of COMBOS) {
        const geo = rotateFlipGeometry(size.srcW, size.srcH, angle, flipH, flipV);
        const c = mapPoint(geo, size.srcW / 2, size.srcH / 2);
        expect(c.x, `angle=${angle} flipH=${flipH} flipV=${flipV}`).toBeCloseTo(geo.outW / 2, 5);
        expect(c.y).toBeCloseTo(geo.outH / 2, 5);
      }
    }
  });
});

describe("rotateFlipMapPoint — orientation", () => {
  const geo = (angle: number, flipH: boolean, flipV: boolean) =>
    rotateFlipGeometry(800, 500, angle, flipH, flipV);

  it("horizontal flip mirrors left/right around the vertical center axis", () => {
    const g = geo(0, true, false);
    // A point on the left half must land on the mirrored right half.
    const L = mapPoint(g, 100, 250);
    const R = mapPoint(g, 700, 250);
    expect(L.x).toBeGreaterThan(g.outW / 2);
    expect(R.x).toBeLessThan(g.outW / 2);
    // Vertical position is unchanged.
    expect(L.y).toBeCloseTo(250, 5);
  });

  it("vertical flip mirrors top/bottom around the horizontal center axis", () => {
    const g = geo(0, false, true);
    const T = mapPoint(g, 400, 100);
    const B = mapPoint(g, 400, 400);
    expect(T.y).toBeGreaterThan(g.outH / 2);
    expect(B.y).toBeLessThan(g.outH / 2);
    expect(T.x).toBeCloseTo(400, 5);
  });

  it("both flips mirror both axes (equivalent to 180° rotation for axis-aligned content)", () => {
    const g = geo(0, true, true);
    const p = mapPoint(g, 100, 100);
    const r = mapPoint(g, 180, 180);
    expect(p.x).toBeCloseTo(g.outW - 100, 5);
    expect(p.y).toBeCloseTo(g.outH - 100, 5);
    // Points on the top-left quadrants move to the mirrored bottom-right quadrant.
    expect(p.x).toBeGreaterThan(g.outW / 2);
    expect(p.y).toBeGreaterThan(g.outH / 2);
    expect(r.x).toBeGreaterThan(g.outW / 2);
    expect(r.y).toBeGreaterThan(g.outH / 2);
  });

  it("90° rotation maps top-left content to the top-right after clockwise rotation", () => {
    const g = geo(90, false, false);
    // After 90° clockwise, the source top edge becomes the output right edge.
    const sourceTL = mapPoint(g, 0, 0);
    const sourceBR = mapPoint(g, 800, 500);
    expect(sourceTL.x).toBeCloseTo(g.outW, 5);
    expect(sourceTL.y).toBeCloseTo(0, 5);
    expect(sourceBR.x).toBeCloseTo(0, 5);
    expect(sourceBR.y).toBeCloseTo(g.outH, 5);
  });

  it("combined 90° rotation + horizontal flip yields correct geometry (no clipping)", () => {
    const g = geo(90, true, false);
    for (const [u, v] of [
      [0, 0],
      [800, 0],
      [0, 500],
      [800, 500],
    ] as Array<[number, number]>) {
      const p = mapPoint(g, u, v);
      expect(p.x).toBeGreaterThanOrEqual(-EPS);
      expect(p.x).toBeLessThanOrEqual(g.outW + EPS);
      expect(p.y).toBeGreaterThanOrEqual(-EPS);
      expect(p.y).toBeLessThanOrEqual(g.outH + EPS);
    }
  });
});
