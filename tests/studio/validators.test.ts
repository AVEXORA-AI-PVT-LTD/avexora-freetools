import { describe, expect, it } from "vitest";
import {
  gstinCheckDigit,
  validateCin,
  validateGstin,
  validateLlpin,
  validatePan,
  validatePincode,
} from "@/studio/compliance/validators";

/**
 * These validators are the product's core claim — if they are wrong, we are
 * telling founders their compliant stationery is broken (or worse, the
 * reverse). Fixtures are real-format identifiers, not invented strings.
 */

describe("PAN", () => {
  it("accepts a well-formed company PAN", () => {
    const result = validatePan("AABCU9603R");
    expect(result.valid).toBe(true);
    expect(result.parsed?.holderType).toBe("Company");
  });

  it("reads the holder type from the 4th character", () => {
    expect(validatePan("AAAPZ1234C").parsed?.holderType).toBe("Individual");
    expect(validatePan("AAAFZ1234C").parsed?.holderType).toBe("Firm / LLP");
    expect(validatePan("AAATZ1234C").parsed?.holderType).toBe("Trust");
  });

  it("rejects an unknown holder-type character", () => {
    const result = validatePan("AAAXZ1234C");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("holder-type");
  });

  it("rejects wrong length and wrong shape", () => {
    expect(validatePan("AABCU9603").valid).toBe(false);
    expect(validatePan("1ABCU9603R").valid).toBe(false);
  });

  it("normalises case and spacing", () => {
    expect(validatePan(" aabcu9603r ").valid).toBe(true);
  });
});

describe("GSTIN", () => {
  /**
   * Real, publicly published GSTINs. These pin the checksum implementation to
   * external ground truth — a self-consistent fixture would pass even if the
   * algorithm were wrong, so the check digits here come from the wild.
   */
  const REAL_GSTINS = ["27AAPFU0939F1ZV", "29AAGCB7383J1Z4"];

  it.each(REAL_GSTINS)("reproduces the published check digit of %s", (gstin) => {
    expect(gstinCheckDigit(gstin.slice(0, 14))).toBe(gstin[14]);
  });

  const valid = REAL_GSTINS[1];

  it("accepts a real GSTIN and parses its parts", () => {
    const result = validateGstin(valid);
    expect(result.valid).toBe(true);
    expect(result.parsed?.state).toBe("Karnataka");
    expect(result.parsed?.pan).toBe("AAGCB7383J");
  });

  it("parses the state from the leading code", () => {
    expect(validateGstin(REAL_GSTINS[0]).parsed?.state).toBe("Maharashtra");
  });

  it("rejects a single-character typo via the checksum", () => {
    const wrongDigit = valid[14] === "0" ? "1" : "0";
    const tampered = valid.slice(0, 14) + wrongDigit;
    const result = validateGstin(tampered);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("Check digit");
  });

  it("rejects an invalid state code", () => {
    const result = validateGstin("00AABCU9603R1Z5");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("state code");
  });

  it("rejects a malformed embedded PAN", () => {
    // 4th PAN character 'X' is not a valid holder type.
    const bad = "29AAAXU9603R1Z5";
    const result = validateGstin(bad);
    expect(result.valid).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(validateGstin("29AABCU9603R1Z").valid).toBe(false);
    expect(validateGstin(`${valid}9`).valid).toBe(false);
  });
});

describe("CIN", () => {
  const valid = "U72900KA2020PTC123456";

  it("accepts a well-formed private company CIN and parses it", () => {
    const result = validateCin(valid);
    expect(result.valid).toBe(true);
    expect(result.parsed).toMatchObject({
      listing: "Unlisted",
      industryCode: "72900",
      state: "KA",
      year: "2020",
      ownershipCode: "PTC",
      ownership: "Private Limited Company",
      registrationNumber: "123456",
    });
  });

  it("recognises listed companies", () => {
    expect(validateCin("L72900MH1995PLC123456").parsed?.listing).toBe("Listed");
  });

  it("rejects a bad length", () => {
    const result = validateCin("U72900KA2020PTC12345");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("21 characters");
  });

  it("rejects an unknown state code", () => {
    const result = validateCin("U72900ZZ2020PTC123456");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("state code");
  });

  it("rejects an unknown company class", () => {
    const result = validateCin("U72900KA2020XXX123456");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("company class");
  });

  it("rejects an implausible incorporation year", () => {
    const future = String(new Date().getFullYear() + 3);
    const result = validateCin(`U72900KA${future}PTC123456`);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("incorporation year");
  });

  it("tolerates spaces and lowercase", () => {
    expect(validateCin(" u72900ka2020ptc123456 ").valid).toBe(true);
  });
});

describe("LLPIN", () => {
  it("accepts both hyphenated and plain forms", () => {
    expect(validateLlpin("AAB-1234").valid).toBe(true);
    expect(validateLlpin("AAB1234").valid).toBe(true);
    expect(validateLlpin("AAB-1234").parsed?.formatted).toBe("AAB-1234");
  });

  it("rejects the wrong shape", () => {
    expect(validateLlpin("AB-1234").valid).toBe(false);
    expect(validateLlpin("AABC-123").valid).toBe(false);
  });
});

describe("PIN code", () => {
  it("accepts a 6-digit code not starting with zero", () => {
    expect(validatePincode("560001").valid).toBe(true);
  });

  it("rejects a leading zero and wrong lengths", () => {
    expect(validatePincode("060001").valid).toBe(false);
    expect(validatePincode("56001").valid).toBe(false);
  });
});
