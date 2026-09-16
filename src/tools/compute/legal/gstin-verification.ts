import type { ComputeFn } from "@/types/tools";
import { validateGstin } from "@/studio/compliance/validators";

/**
 * Reuses the same mod-36 checksum validator that backs the Letterhead
 * Compliance Checker, so the two tools can never disagree on what counts as
 * a valid GSTIN.
 */
export const computeGstinVerification: ComputeFn = (values) => {
  const raw = typeof values.gstin === "string" ? values.gstin.trim() : "";
  if (raw === "") return { error: "Enter a GSTIN to verify." };

  const result = validateGstin(raw);
  if (!result.valid) return { error: result.message ?? "This GSTIN is invalid." };

  const parsed = result.parsed ?? {};
  return {
    results: [
      { label: "Status", value: "Valid — format and checksum match", emphasis: true },
      { label: "State", value: `${parsed.state} (code ${parsed.stateCode})` },
      { label: "PAN embedded in GSTIN", value: parsed.pan ?? "" },
      { label: "Registration number (for this PAN)", value: parsed.entityNumber ?? "" },
    ],
  };
};
