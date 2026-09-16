import { describe, expect, it } from "vitest";
import { allTools, DISPLAYED_TOOL_COUNT, displayedToolCount, MARKETING_TOOL_COUNT_FLOOR, TOTAL_ACTIVE_TOOLS } from "@/tools/registry";

describe("tool-count marketing display", () => {
  it.each([
    [0, 130],
    [9, 130],
    [125, 130],
    [129, 130],
    [130, 130],
    [131, 130],
    [132, 130],
    [139, 130],
    [140, 140],
    [141, 140],
    [149, 140],
    [150, 150],
    [180, 180],
    [200, 200],
  ])("(%i actual tools) displays %i+", (actual, expected) => {
    expect(displayedToolCount(actual)).toBe(expected);
  });

  it("never drops below the 130+ marketing floor", () => {
    for (let n = 0; n <= 400; n++) {
      expect(displayedToolCount(n)).toBeGreaterThanOrEqual(MARKETING_TOOL_COUNT_FLOOR);
    }
  });

  it("displays the floor-bucketed count of the real registry", () => {
    expect(TOTAL_ACTIVE_TOOLS).toBe(allTools.length);
    expect(DISPLAYED_TOOL_COUNT).toBe(displayedToolCount(TOTAL_ACTIVE_TOOLS));
  });

  it("homepage never shows the exact unbucketed count when a bucket would hide it", () => {
    expect(displayedToolCount(TOTAL_ACTIVE_TOOLS)).toBe(DISPLAYED_TOOL_COUNT);
    expect(`${DISPLAYED_TOOL_COUNT}+`).not.toContain(`${TOTAL_ACTIVE_TOOLS}+`);
  });
});