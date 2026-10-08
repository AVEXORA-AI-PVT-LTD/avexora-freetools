import { describe, expect, it } from "vitest";
import {
  decodeCin,
  decodeLlpin,
  validateDinNumber,
  analyzeCompanyName,
  computeMcaSearch,
  searchCompaniesByName,
  lookupCompanyByCin,
  ROC_OFFICES,
} from "@/tools/compute/legal/mca-company-search";

describe("MCA Company Search & CIN Decoder", () => {
  it("decodes a standard Private Limited CIN correctly", () => {
    const result = decodeCin("U72900KA2020PTC123456");
    expect(result.isValid).toBe(true);
    expect(result.listingStatus).toBe("Unlisted Corporate Entity");
    expect(result.industryCode).toBe("72900");
    expect(result.stateCode).toBe("KA");
    expect(result.stateName).toBe("Karnataka");
    expect(result.rocOffice).toBe("RoC Bangalore");
    expect(result.yearOfIncorporation).toBe("2020");
    expect(result.classCode).toBe("PTC");
    expect(result.companyClass).toBe("Private Limited Company");
    expect(result.registrationNumber).toBe("123456");
    expect(result.complianceDueDates?.length).toBeGreaterThan(0);
  });

  it("decodes a Listed Public Limited CIN correctly", () => {
    const result = decodeCin("L17110MH1973PLC019786");
    expect(result.isValid).toBe(true);
    expect(result.listingStatus).toBe("Listed on Stock Exchange");
    expect(result.stateCode).toBe("MH");
    expect(result.stateName).toBe("Maharashtra");
    expect(result.rocOffice).toBe("RoC Mumbai / Pune");
    expect(result.classCode).toBe("PLC");
    expect(result.companyClass).toBe("Public Limited Company");
    expect(result.yearOfIncorporation).toBe("1973");
  });

  it("fails gracefully on malformed or invalid CINs", () => {
    const tooShort = decodeCin("U72900KA2020");
    expect(tooShort.isValid).toBe(false);
    expect(tooShort.message).toContain("21 alphanumeric characters");

    const invalidState = decodeCin("U72900ZZ2020PTC123456");
    expect(invalidState.isValid).toBe(false);

    const invalidClass = decodeCin("U72900KA2020XYZ123456");
    expect(invalidClass.isValid).toBe(false);
  });

  it("decodes an LLP Identification Number (LLPIN)", () => {
    const result = decodeLlpin("AAB-1234");
    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe("AAB-1234");
    expect(result.complianceDueDates).toBeDefined();

    const unhyphenated = decodeLlpin("AAB1234");
    expect(unhyphenated.isValid).toBe(true);
    expect(unhyphenated.formatted).toBe("AAB-1234");

    const invalid = decodeLlpin("12345");
    expect(invalid.isValid).toBe(false);
  });

  it("validates 8-digit Director Identification Numbers (DIN)", () => {
    const valid = validateDinNumber("01234567");
    expect(valid.isValid).toBe(true);
    expect(valid.din).toBe("01234567");

    const invalid = validateDinNumber("123");
    expect(invalid.isValid).toBe(false);
  });

  it("evaluates company names under MCA Rule 8 guidelines", () => {
    const withoutSuffix = analyzeCompanyName("Avexora Tech", "pvt-ltd");
    const warning = withoutSuffix.findings.find((f) => f.type === "warning");
    expect(warning?.message).toContain("Private Limited");

    const withSuffix = analyzeCompanyName("Avexora Technologies Private Limited", "pvt-ltd");
    expect(withSuffix.isValid).toBe(true);

    const restricted = analyzeCompanyName("National Bank Technologies Private Limited", "pvt-ltd");
    expect(restricted.isValid).toBe(false);
    const errors = restricted.findings.filter((f) => f.type === "error");
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it("executes computeMcaSearch correctly for generic calculator runners", () => {
    const cinCompute = computeMcaSearch({ query: "U72900KA2020PTC123456" });
    expect("results" in cinCompute).toBe(true);
    if ("results" in cinCompute) {
      expect(cinCompute.results[0].label).toBe("CIN");
    }

    const llpinCompute = computeMcaSearch({ query: "AAB-1234" });
    expect("results" in llpinCompute).toBe(true);
    if ("results" in llpinCompute) {
      expect(llpinCompute.results[0].label).toBe("LLPIN");
    }

    const dinCompute = computeMcaSearch({ query: "01234567" });
    expect("results" in dinCompute).toBe(true);
    if ("results" in dinCompute) {
      expect(dinCompute.results[0].label).toBe("DIN");
    }

    const empty = computeMcaSearch({ query: "" });
    expect("error" in empty).toBe(true);

    const nameCompute = computeMcaSearch({ query: "Americana Restaurants" });
    expect("results" in nameCompute).toBe(true);
    if ("results" in nameCompute) {
      expect(nameCompute.results.length).toBeGreaterThan(0);
    }
  });

  it("decodes Americana Restaurants (India) Private Limited CIN dynamically", () => {
    const americana = decodeCin("U74999HR2022FTC101547");
    expect(americana.isValid).toBe(true);
    expect(americana.stateCode).toBe("HR");
    expect(americana.stateName).toBe("Haryana");
    expect(americana.rocOffice).toBe("RoC Delhi & Haryana");
    expect(americana.yearOfIncorporation).toBe("2022");
    expect(americana.classCode).toBe("FTC");
    expect(americana.companyClass).toBe("Subsidiary of a Foreign Company");
    expect(americana.registrationNumber).toBe("101547");
  });
});
