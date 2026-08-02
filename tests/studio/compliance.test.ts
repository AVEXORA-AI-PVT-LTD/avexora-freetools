import { describe, expect, it } from "vitest";
import {
  type ComplianceInput,
  auditBrand,
  statutoryLines,
  validateStationery,
} from "@/studio/compliance/india";

/**
 * The compliance rule table is the product's differentiator, so these tests
 * assert the *behaviour a customer relies on*: that a missing CIN fails a
 * letterhead loudly and with a citation, and that we do not cry wolf on
 * documents the statute does not cover.
 */

const pvtLtd: ComplianceInput = {
  entityType: "pvt-ltd",
  name: "Northwind Labs",
  legalName: "Northwind Labs Private Limited",
  cin: "U72900KA2020PTC123456",
  gstin: "29AAGCB7383J1Z4",
  registeredAddress: "4th Floor, Mistry Building, Residency Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560025",
  phone: "+91 80 4123 9000",
  email: "hello@northwindlabs.in",
};

const findingIds = (result: ReturnType<typeof validateStationery>) =>
  result.findings.map((f) => f.id);

describe("letterheads for a private limited company", () => {
  it("passes when every statutory particular is present", () => {
    const result = validateStationery(pvtLtd, "letterhead");
    expect(result.status).toBe("pass");
    expect(result.findings).toEqual([]);
  });

  it("fails hard when the CIN is missing, and cites s.12(3)(c)", () => {
    const result = validateStationery({ ...pvtLtd, cin: null }, "letterhead");
    expect(result.status).toBe("fail");

    const cin = result.findings.find((f) => f.id === "cin-missing");
    expect(cin?.severity).toBe("fail");
    expect(cin?.citation).toContain("s.12(3)(c)");
    expect(cin?.penalty).toContain("₹1,000");
    expect(cin?.penalty).toContain("₹1,00,000");
  });

  it("fails when the registered office address is missing", () => {
    const result = validateStationery(
      { ...pvtLtd, registeredAddress: null },
      "letterhead",
    );
    expect(result.status).toBe("fail");
    expect(findingIds(result)).toContain("registered-address-missing");
  });

  it("fails on a malformed CIN even when one is supplied", () => {
    const result = validateStationery({ ...pvtLtd, cin: "NOTACIN" }, "letterhead");
    expect(result.status).toBe("fail");
    expect(findingIds(result)).toContain("cin-invalid");
  });

  it("catches a CIN whose class contradicts the declared entity type", () => {
    // A PLC-class CIN on a company declared as a private limited.
    const result = validateStationery(
      { ...pvtLtd, cin: "L72900KA2020PLC123456" },
      "letterhead",
    );
    expect(findingIds(result)).toContain("cin-entity-mismatch");
  });

  it("warns rather than fails when contact details are absent", () => {
    const result = validateStationery(
      { ...pvtLtd, phone: null, email: null },
      "letterhead",
    );
    expect(result.status).toBe("warn");
    const contact = result.findings.find((f) => f.id === "contact-missing");
    expect(contact?.severity).toBe("warn");
  });

  it("warns on a missing PIN code without failing the document", () => {
    const result = validateStationery({ ...pvtLtd, pincode: null }, "letterhead");
    expect(result.status).toBe("warn");
    expect(findingIds(result)).toContain("pincode-missing");
  });
});

describe("scope of the statute", () => {
  it("treats an envelope as advisory, not statutory", () => {
    const result = validateStationery({ ...pvtLtd, cin: null }, "envelope");
    // Still surfaced, but as a warning — an envelope is not a business letter.
    expect(result.status).toBe("warn");
    const cin = result.findings.find((f) => f.id === "cin-missing");
    expect(cin?.severity).toBe("warn");
    expect(cin?.penalty).toBeUndefined();
  });

  it("does not demand statutory particulars on a visiting card", () => {
    const result = validateStationery({ ...pvtLtd, cin: null }, "business-card");
    expect(result.status).toBe("pass");
    expect(findingIds(result)).toEqual(["not-statutory"]);
  });

  it("does not demand statutory particulars on a social post or ID card", () => {
    for (const doc of ["social-post", "id-card", "ad"] as const) {
      const result = validateStationery({ ...pvtLtd, cin: null }, doc);
      expect(result.status).toBe("pass");
    }
  });

  it("treats an invoice as statutory", () => {
    const result = validateStationery({ ...pvtLtd, cin: null }, "invoice");
    expect(result.status).toBe("fail");
  });
});

describe("LLPs", () => {
  const llp: ComplianceInput = {
    entityType: "llp",
    name: "Harbour Partners",
    legalName: "Harbour Partners LLP",
    llpin: "AAB-1234",
    registeredAddress: "12 Marine Lines",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400020",
    phone: "+91 22 5555 0000",
  };

  it("passes with a valid LLPIN", () => {
    expect(validateStationery(llp, "letterhead").status).toBe("pass");
  });

  it("fails without an LLPIN and cites the LLP Act", () => {
    const result = validateStationery({ ...llp, llpin: null }, "letterhead");
    expect(result.status).toBe("fail");
    const finding = result.findings.find((f) => f.id === "llpin-missing");
    expect(finding?.citation).toContain("Limited Liability Partnership Act 2008");
  });

  it("never asks an LLP for a CIN", () => {
    const result = validateStationery({ ...llp, llpin: null }, "letterhead");
    expect(findingIds(result)).not.toContain("cin-missing");
  });
});

describe("unincorporated entities", () => {
  const proprietorship: ComplianceInput = {
    entityType: "proprietorship",
    name: "Ramesh Traders",
    registeredAddress: "22 MG Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  };

  it("does not demand a CIN, LLPIN or registered office", () => {
    const result = validateStationery(proprietorship, "letterhead");
    expect(findingIds(result)).not.toContain("cin-missing");
    expect(findingIds(result)).not.toContain("llpin-missing");
    expect(findingIds(result)).not.toContain("registered-address-missing");
  });

  it("flags an invalid GSTIN when one is supplied", () => {
    const result = validateStationery(
      { ...proprietorship, gstin: "29AAGCB7383J1ZZ" },
      "invoice",
    );
    expect(result.status).toBe("fail");
    expect(findingIds(result)).toContain("gstin-invalid");
  });

  it("mentions GST on an invoice without a GSTIN, as information only", () => {
    const result = validateStationery(proprietorship, "invoice");
    const finding = result.findings.find((f) => f.id === "gstin-missing-invoice");
    expect(finding?.severity).toBe("info");
    expect(result.status).toBe("pass");
  });
});

describe("brand-level audit", () => {
  it("reports pass for a fully compliant brand", () => {
    expect(auditBrand(pvtLtd).status).toBe("pass");
  });

  it("rolls the worst document status up to the brand", () => {
    expect(auditBrand({ ...pvtLtd, cin: null }).status).toBe("fail");
    expect(auditBrand({ ...pvtLtd, phone: null, email: null }).status).toBe("warn");
  });

  it("always carries the not-legal-advice disclaimer", () => {
    expect(auditBrand(pvtLtd).disclaimer).toContain("not legal advice");
    expect(validateStationery(pvtLtd, "letterhead").disclaimer).toContain(
      "not legal advice",
    );
  });
});

describe("statutory footer lines", () => {
  it("prints name, registered office, identifiers and contact", () => {
    const lines = statutoryLines(pvtLtd);
    expect(lines[0]).toBe("Northwind Labs Private Limited");
    expect(lines.join(" ")).toContain("Registered office:");
    expect(lines.join(" ")).toContain("CIN: U72900KA2020PTC123456");
    expect(lines.join(" ")).toContain("GSTIN: 29AAGCB7383J1Z4");
    expect(lines.join(" ")).toContain("T: +91 80 4123 9000");
  });

  it("uppercases identifiers and flattens multi-line addresses", () => {
    const lines = statutoryLines({
      ...pvtLtd,
      cin: "u72900ka2020ptc123456",
      registeredAddress: "4th Floor\nResidency Road",
    });
    expect(lines.join(" ")).toContain("CIN: U72900KA2020PTC123456");
    expect(lines.join(" ")).not.toContain("\n");
  });

  it("omits an LLPIN line for a company and a CIN line for an LLP", () => {
    expect(statutoryLines(pvtLtd).join(" ")).not.toContain("LLPIN");
    const llpLines = statutoryLines({
      entityType: "llp",
      name: "Harbour Partners",
      llpin: "AAB-1234",
    });
    expect(llpLines.join(" ")).toContain("LLPIN: AAB-1234");
    expect(llpLines.join(" ")).not.toContain("CIN:");
  });

  it("normalises an unhyphenated LLPIN to the canonical MCA form", () => {
    const lines = statutoryLines({
      entityType: "llp",
      name: "Harbour Partners",
      llpin: "aab1234",
    });
    expect(lines.join(" ")).toContain("LLPIN: AAB-1234");
  });

  it("returns nothing for an empty brand", () => {
    expect(statutoryLines({ entityType: "proprietorship", name: "" })).toEqual([]);
  });
});
