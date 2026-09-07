import { describe, expect, it } from "vitest";
import { strToU8, unzipSync } from "fflate";
import { buildZip } from "@/tools/ui/image/image-shared";

describe("buildZip — favicon package", () => {
  it("packages all generated favicon files with their exact names", () => {
    const files: Record<string, Uint8Array> = {
      "favicon-16x16.png": new Uint8Array([1, 2, 3]),
      "favicon-32x32.png": new Uint8Array([4, 5, 6]),
      "favicon-48x48.png": new Uint8Array([7, 8, 9]),
      "favicon-180x180.png": new Uint8Array([10, 11, 12]),
      "favicon-192x192.png": new Uint8Array([13, 14, 15]),
      "favicon-512x512.png": new Uint8Array([16, 17, 18]),
    };
    const zip = buildZip(files);
    const out = unzipSync(zip);
    expect(Object.keys(out).sort()).toEqual([
      "favicon-16x16.png",
      "favicon-180x180.png",
      "favicon-192x192.png",
      "favicon-32x32.png",
      "favicon-48x48.png",
      "favicon-512x512.png",
    ]);
  });

  it("preserves binary image bytes exactly (no corruption)", () => {
    const png = new Uint8Array(Array.from({ length: 256 }, (_, i) => i));
    const out = unzipSync(buildZip({ "favicon-32x32.png": png }))["favicon-32x32.png"];
    expect(Array.from(out)).toEqual(Array.from(png));
  });

  it("preserves valid UTF-8 text content (e.g. a web manifest) without corruption", () => {
    const manifest = JSON.stringify({ name: "site", icons: [{ src: "/favicon-192x192.png", sizes: "192x192" }] });
    const out = unzipSync(
      buildZip({ "site.webmanifest": strToU8(manifest), "favicon-16x16.png": new Uint8Array([0]) }),
    );
    expect(new TextDecoder().decode(out["site.webmanifest"])).toBe(manifest);
  });

  it("round-trips a mixed set of entries without empty/duplicate files", () => {
    const out = unzipSync(
      buildZip({
        "a.png": new Uint8Array([1]),
        "b.png": new Uint8Array([2]),
      }),
    );
    expect(Object.keys(out)).toHaveLength(2);
    expect(Array.from(out["a.png"])).toEqual([1]);
    expect(Array.from(out["b.png"])).toEqual([2]);
  });
});
