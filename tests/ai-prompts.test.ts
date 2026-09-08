import { describe, expect, it } from "vitest";
import { aiPrompts } from "@/app/api/ai/prompts";
import { tools as aiWriterTools } from "@/tools/configs/ai-writers";
import { JOB_EXPERIENCE_LEVELS, JOB_FIELD_LIMITS } from "@/tools/ai-constants";

const jd = aiPrompts["job-description-generator"];

describe("AI prompt registry", () => {
  it("Test 1 — every ai-writer tool config has a registered prompt and vice versa", () => {
    const configured = aiWriterTools.filter((t) => t.kind === "ai-writer").map((t) => t.slug);
    expect(configured.length).toBeGreaterThan(0);
    for (const slug of configured) {
      expect(aiPrompts[slug], `missing prompt for ${slug}`).toBeDefined();
    }
    for (const slug of Object.keys(aiPrompts)) {
      expect(configured, `orphan prompt for ${slug}`).toContain(slug);
    }
  });

  it("Test 2 — only the job tool carries server-side validation", () => {
    for (const [slug, template] of Object.entries(aiPrompts)) {
      if (slug === "job-description-generator") {
        expect(typeof template.validate).toBe("function");
      } else {
        expect(template.validate).toBeUndefined();
      }
    }
  });
});

describe("job-description-generator prompt", () => {
  it("Test 3 — has a maxTokens budget", () => {
    expect(jd.maxTokens).toBeGreaterThan(0);
  });

  it("Test 4 — validate rejects a missing job role", () => {
    expect(jd.validate?.({ role: "", experience: "Senior", skills: "React" })).toContain("job role");
    expect(jd.validate?.({ role: "   ", experience: "Senior", skills: "React" })).toContain("job role");
  });

  it("Test 5 — validate rejects a missing or invalid experience level", () => {
    expect(jd.validate?.({ role: "Engineer", experience: "", skills: "React" })).toContain("experience");
    expect(jd.validate?.({ role: "Engineer", experience: "Expert Wizard", skills: "React" })).toContain(
      "experience",
    );
  });

  it("Test 6 — validate rejects empty or whitespace-only skills", () => {
    const err = jd.validate?.({ role: "Engineer", experience: "Senior", skills: "" });
    expect(err).toContain("skill");
    expect(jd.validate?.({ role: "Engineer", experience: "Senior", skills: "   \n  " })).toContain("skill");
  });

  it("Test 7 — validate rejects overlong fields", () => {
    const longRole = "x".repeat(JOB_FIELD_LIMITS.role + 1);
    const longSkills = "y".repeat(JOB_FIELD_LIMITS.skills + 1);
    const longCompany = "z".repeat(JOB_FIELD_LIMITS.company + 1);
    expect(jd.validate?.({ role: longRole, experience: "Senior", skills: "React" })).toContain("too long");
    expect(
      jd.validate?.({ role: "Engineer", experience: "Senior", skills: longSkills }),
    ).toContain("too long");
    expect(
      jd.validate?.({
        role: "Engineer",
        experience: "Senior",
        skills: "React",
        industry: "x".repeat(JOB_FIELD_LIMITS.industry + 1),
      }),
    ).toContain("too long");
    expect(
      jd.validate?.({
        role: "Engineer",
        experience: "Senior",
        skills: "React",
        company: longCompany,
      }),
    ).toContain("too long");
    expect(
      jd.validate?.({
        role: "Engineer",
        experience: "Senior",
        skills: "React",
        responsibilities: "z".repeat(JOB_FIELD_LIMITS.responsibilities + 1),
      }),
    ).toContain("too long");
  });

  it("Test 8 — validate accepts a complete valid submission", () => {
    expect(
      jd.validate?.({
        role: "Senior React Developer",
        experience: "Senior",
        skills: "React, TypeScript, Node.js",
        industry: "SaaS",
        company: "A 15-person startup",
        responsibilities: "Lead a team of 4",
      }),
    ).toBeNull();
  });

  it("Test 9 — validate accepts technical skill tokens verbatim", () => {
    expect(
      jd.validate?.({
        role: "Software Developer",
        experience: "Mid-Level",
        skills: "C++, C#, .NET, Node.js, UI/UX, AWS, PHP",
      }),
    ).toBeNull();
    const built = jd.build({
      role: "Software Developer",
      experience: "Mid-Level",
      skills: "C++, C#, .NET, Node.js, UI/UX, AWS, PHP",
    });
    expect(built).toContain("C++, C#, .NET, Node.js, UI/UX, AWS, PHP");
  });

  it("Test 10 — build embeds the required inputs and omits absent optionals", () => {
    const built = jd.build({ role: "Product Manager", experience: "Lead", skills: "SQL, Figma" });
    expect(built).toContain('"Product Manager"');
    expect(built).toContain("Experience level: Lead.");
    expect(built).toContain("Required skills: SQL, Figma.");
    expect(built).not.toContain("Industry:");
    expect(built).not.toContain("Company context:");
    expect(built).not.toContain("Additional responsibilities");
  });

  it("Test 11 — build includes provided optionals and the required structure", () => {
    const built = jd.build({
      role: "HR Manager",
      experience: "Manager",
      skills: "Payroll, Compliance",
      industry: "Manufacturing",
      company: "A 200-employee factory in Pune",
      responsibilities: "Handle statutory compliance",
    });
    expect(built).toContain("Industry: Manufacturing.");
    expect(built).toContain("Company context: A 200-employee factory in Pune.");
    expect(built).toContain("Additional responsibilities or requirements to cover: Handle statutory compliance.");
    for (const heading of ["## Key Responsibilities", "## Required Skills", "## How to Apply"]) {
      expect(built).toContain(heading);
    }
  });

  it("Test 12 — build forbids fabrication in clear terms", () => {
    const built = jd.build({ role: "Engineer", experience: "Senior", skills: "Go" });
    expect(built).toMatch(/Never fabricate/);
    expect(built).toMatch(/do not invent a company/);
  });

  it("Test 13 — experience options cover all eight levels, the config matches the shared list", () => {
    const tool = aiWriterTools.find((t) => t.slug === "job-description-generator");
    expect(tool).toBeDefined();
    if (tool?.kind === "ai-writer") {
      const select = tool.fields.find((f) => f.name === "experience");
      const labels = select?.options?.map((o) => o.label) ?? [];
      expect(labels).toEqual(["Select experience level", ...JOB_EXPERIENCE_LEVELS]);
    }
  });
});