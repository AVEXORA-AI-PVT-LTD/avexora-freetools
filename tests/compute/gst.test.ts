import { describe, expect, it } from "vitest";
import { computeGst } from "@/tools/compute/finance/gst";

function resultMap(values: Record<string, string | number | boolean>) {
  const outcome = computeGst(values);
  if ("error" in outcome) throw new Error(outcome.error);
  return new Map(outcome.results.map((r) => [r.label, r.value]));
}

describe("computeGst", () => {
  it("adds 18% GST to an exclusive amount", () => {
    const r = resultMap({ amount: "1000", rate: "18", mode: "exclusive" });
    expect(r.get("Base amount (pre-GST)")).toBe("₹1,000.00");
    expect(r.get("Total GST (18%)")).toBe("₹180.00");
    expect(r.get("CGST")).toBe("₹90.00");
    expect(r.get("SGST")).toBe("₹90.00");
    expect(r.get("IGST (inter-state)")).toBe("₹180.00");
    expect(r.get("Total amount (incl. GST)")).toBe("₹1,180.00");
  });

  it("removes 18% GST from an inclusive amount", () => {
    const r = resultMap({ amount: "1180", rate: "18", mode: "inclusive" });
    expect(r.get("Base amount (pre-GST)")).toBe("₹1,000.00");
    expect(r.get("Total GST (18%)")).toBe("₹180.00");
    expect(r.get("Total amount (incl. GST)")).toBe("₹1,180.00");
  });

  it("handles the 0.25% slab", () => {
    const r = resultMap({ amount: "100000", rate: "0.25", mode: "exclusive" });
    expect(r.get("Total GST (0.25%)")).toBe("₹250.00");
  });

  it("uses Indian digit grouping", () => {
    const r = resultMap({ amount: "1000000", rate: "18", mode: "exclusive" });
    expect(r.get("Total amount (incl. GST)")).toBe("₹11,80,000.00");
  });

  it("rejects a missing amount", () => {
    expect(computeGst({ amount: "", rate: "18", mode: "exclusive" })).toEqual({
      error: "Enter an amount greater than zero.",
    });
  });

  it("rejects a negative amount", () => {
    expect(computeGst({ amount: "-5", rate: "18", mode: "exclusive" })).toHaveProperty(
      "error",
    );
  });
});
