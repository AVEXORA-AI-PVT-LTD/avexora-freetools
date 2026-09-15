import type { GenerateFn } from "@/types/tools";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Turn a comma-separated or newline-separated list into a clean array. */
function items(value: unknown): string[] {
  return str(value)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function bulletLines(value: unknown): string[] {
  return str(value)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const generateResume: GenerateFn = (values) => {
  const fullName = str(values.fullName);
  const targetRole = str(values.targetRole);
  const email = str(values.email);
  const phone = str(values.phone);
  const location = str(values.location);
  const linkedin = str(values.linkedin);
  const summary = str(values.summary);
  const skills = items(values.skills);

  const exp1Company = str(values.exp1Company);
  const exp1Title = str(values.exp1Title);
  const exp1Duration = str(values.exp1Duration);
  const exp1Highlights = bulletLines(values.exp1Highlights);

  const exp2Company = str(values.exp2Company);
  const exp2Title = str(values.exp2Title);
  const exp2Duration = str(values.exp2Duration);
  const exp2Highlights = bulletLines(values.exp2Highlights);

  const eduDegree = str(values.eduDegree);
  const eduInstitution = str(values.eduInstitution);
  const eduYear = str(values.eduYear);

  if (fullName === "") return { error: "Enter your full name." };
  if (email === "") return { error: "Enter your email address." };
  if (phone === "") return { error: "Enter your phone number." };
  if (summary === "") return { error: "Enter a short professional summary." };
  if (skills.length === 0) return { error: "Enter at least one skill." };
  if (exp1Company === "" || exp1Title === "" || exp1Duration === "") {
    return { error: "Enter at least one work experience (company, title and duration)." };
  }
  if (eduDegree === "" || eduInstitution === "") {
    return { error: "Enter your education (degree and institution)." };
  }

  const contactLine = [phone, email, location, linkedin].filter(Boolean).join("  |  ");

  const experienceBlock = (
    company: string,
    title: string,
    duration: string,
    highlights: string[],
  ): string => {
    if (company === "") return "";
    const header = `${title} — ${company}${duration ? ` (${duration})` : ""}`;
    const bullets = highlights.map((h) => `  • ${h}`).join("\n");
    return bullets ? `${header}\n${bullets}` : header;
  };

  const experienceSections = [
    experienceBlock(exp1Company, exp1Title, exp1Duration, exp1Highlights),
    experienceBlock(exp2Company, exp2Title, exp2Duration, exp2Highlights),
  ].filter(Boolean);

  const text = `${fullName.toUpperCase()}${targetRole ? `\n${targetRole}` : ""}
${contactLine}

SUMMARY
${summary}

SKILLS
${skills.join(" · ")}

EXPERIENCE
${experienceSections.join("\n\n")}

EDUCATION
${eduDegree} — ${eduInstitution}${eduYear ? ` (${eduYear})` : ""}`;

  return { text, filename: `${fullName.replace(/\s+/g, "-").toLowerCase()}-resume.txt` };
};
