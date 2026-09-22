export interface ResumeExperience {
  company: string;
  title: string;
  duration: string;
  /** Raw textarea value, one achievement per line. */
  highlights: string;
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeInput {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  /** Raw comma or newline-separated skills. */
  skills: string;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
}

function str(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Turn a comma-separated or newline-separated list into a clean array. */
function items(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function bulletLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Returns a validation error message, or null when the input is ready to render. */
export function validateResume(input: ResumeInput): string | null {
  if (str(input.fullName) === "") return "Enter your full name.";
  if (str(input.email) === "") return "Enter your email address.";
  if (str(input.phone) === "") return "Enter your phone number.";
  if (str(input.summary) === "") return "Enter a short professional summary.";
  if (items(input.skills).length === 0) return "Enter at least one skill.";

  const firstExperience = input.experiences[0];
  if (!firstExperience || str(firstExperience.company) === "" || str(firstExperience.title) === "" || str(firstExperience.duration) === "") {
    return "Enter at least one work experience (company, title and duration).";
  }

  const firstEducation = input.education[0];
  if (!firstEducation || str(firstEducation.degree) === "" || str(firstEducation.institution) === "") {
    return "Enter your education (degree and institution).";
  }

  return null;
}

function experienceBlock(exp: ResumeExperience): string {
  const company = str(exp.company);
  if (company === "") return "";
  const title = str(exp.title);
  const duration = str(exp.duration);
  const header = `${title} — ${company}${duration ? ` (${duration})` : ""}`;
  const bullets = bulletLines(exp.highlights).map((h) => `  • ${h}`).join("\n");
  return bullets ? `${header}\n${bullets}` : header;
}

function educationLine(edu: ResumeEducation): string {
  const degree = str(edu.degree);
  if (degree === "") return "";
  const institution = str(edu.institution);
  const year = str(edu.year);
  return `${degree} — ${institution}${year ? ` (${year})` : ""}`;
}

/** Builds the plain-text resume. Call validateResume() first and only render on a null result. */
export function buildResumeText(input: ResumeInput): string {
  const fullName = str(input.fullName);
  const targetRole = str(input.targetRole);
  const contactLine = [str(input.phone), str(input.email), str(input.location), str(input.linkedin)]
    .filter(Boolean)
    .join("  |  ");

  const experienceSections = input.experiences.map(experienceBlock).filter(Boolean);
  const educationLines = input.education.map(educationLine).filter(Boolean);

  return `${fullName.toUpperCase()}${targetRole ? `\n${targetRole}` : ""}
${contactLine}

SUMMARY
${str(input.summary)}

SKILLS
${items(input.skills).join(" · ")}

EXPERIENCE
${experienceSections.join("\n\n")}

EDUCATION
${educationLines.join("\n")}`;
}

export function resumeFilename(fullName: string): string {
  const slug = str(fullName).replace(/\s+/g, "-").toLowerCase();
  return `${slug || "resume"}-resume.txt`;
}
