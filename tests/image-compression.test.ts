import { describe, expect, it } from "vitest";
import { imageCompressionType } from "@/tools/ui/image/image-shared";

describe("imageCompressionType", () => {
  it("keeps PNG output for PNG sources so transparency/alpha is preserved", () => {
    expect(imageCompressionType("image/png")).toBe("image/png");
  });

  it("never routes a PNG source through the alpha-stripping JPEG path", () => {
    // Regression: encoding a transparent PNG to JPEG would flatten the alpha
    // channel onto an opaque black background. Output for PNG sources must stay
    // PNG.
    expect(imageCompressionType("image/png")).not.toBe("image/jpeg");
  });

  it("keeps the existing JPEG path for opaque/non-PNG sources", () => {
    expect(imageCompressionType("image/jpeg")).toBe("image/jpeg");
    expect(imageCompressionType("image/webp")).toBe("image/jpeg");
  });
});
