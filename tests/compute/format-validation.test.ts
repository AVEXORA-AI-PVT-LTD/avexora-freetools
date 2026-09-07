import { describe, expect, it } from "vitest";
import {
  toNumber,
  toPositive,
  toNonNegative,
  toPositiveOr,
  toNonNegativeOr,
} from "@/tools/compute/format";

/**
 * Direct unit tests for the shared numeric form-field validation utilities
 * (`src/tools/compute/format.ts`). These encode the core rule behind the
 * "optional numeric fields silently become 0/default" bug: a genuinely empty
 * optional field may fall back to its intended default, but present-but-invalid
 * input (non-numeric text, NaN, negatives where disallowed) must return `null`
 * so callers surface a validation error instead of silently coercing to zero.
 */

describe("toNumber", () => {
  it("accepts a numeric string", () => {
    expect(toNumber("123")).toBe(123);
    expect(toNumber(" 42 ")).toBe(42); // whitespace trimmed
    expect(toNumber("3.5")).toBe(3.5);
  });
  it("accepts the legitimate value zero", () => {
    expect(toNumber("0")).toBe(0);
  });
  it("returns null for non-numeric / NaN text", () => {
    expect(toNumber("abc")).toBeNull();
    expect(toNumber("12..5")).toBeNull();
    expect(toNumber("1,000")).toBeNull(); // commas are not valid numeric input
    expect(toNumber("e")).toBeNull();
    expect(toNumber("Infinity")).toBeNull();
  });
  it("returns null for empty / whitespace-only strings", () => {
    expect(toNumber("")).toBeNull();
    expect(toNumber("   ")).toBeNull();
  });
  it("returns null for non-string garbage", () => {
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber({})).toBeNull();
  });
});

describe("toPositive", () => {
  it("accepts values greater than zero", () => {
    expect(toPositive("1")).toBe(1);
    expect(toPositive("0.01")).toBe(0.01);
  });
  it("rejects zero", () => {
    expect(toPositive("0")).toBeNull();
  });
  it("rejects negatives", () => {
    expect(toPositive("-5")).toBeNull();
  });
  it("rejects invalid / empty input", () => {
    expect(toPositive("abc")).toBeNull();
    expect(toPositive("")).toBeNull();
  });
});

describe("toNonNegative", () => {
  it("accepts zero", () => {
    expect(toNonNegative("0")).toBe(0);
  });
  it("accepts positives", () => {
    expect(toNonNegative("7")).toBe(7);
  });
  it("rejects negatives", () => {
    expect(toNonNegative("-3")).toBeNull();
  });
  it("rejects invalid / empty input", () => {
    expect(toNonNegative("abc")).toBeNull();
    expect(toNonNegative("")).toBeNull();
  });
});

describe("toPositiveOr / toNonNegativeOr (optional fields)", () => {
  it("uses the fallback for a genuinely empty optional field", () => {
    expect(toNonNegativeOr(undefined, 0)).toBe(0);
    expect(toNonNegativeOr(null, 5)).toBe(5);
    expect(toNonNegativeOr("", 0)).toBe(0);
    expect(toNonNegativeOr("   ", 0)).toBe(0);
  });
  it("returns null for present-but-invalid input (never falls back silently)", () => {
    expect(toNonNegativeOr("abc", 0)).toBeNull();
    expect(toNonNegativeOr("12..5", 0)).toBeNull();
    expect(toPositiveOr("abc", 1)).toBeNull();
  });
  it("rejects present-but-negative values where disallowed", () => {
    expect(toNonNegativeOr("-2", 0)).toBeNull();
    expect(toPositiveOr("-2", 1)).toBeNull();
  });
  it("accepts the legitimate value zero where allowed", () => {
    expect(toNonNegativeOr("0", 0)).toBe(0);
  });
});
