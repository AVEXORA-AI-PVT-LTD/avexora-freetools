/**
 * Single source of truth for the AI Job Description Generator's selectable
 * experience levels and per-field length limits. Shared by the tool config
 * (`ai-writers.ts`), the client form, and the server-side prompt validation in
 * `src/app/api/ai/prompts.ts` so the bounds can never drift apart.
 */
export const JOB_EXPERIENCE_LEVELS = [
  "Entry Level",
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "Executive",
] as const;

export const JOB_FIELD_LIMITS = {
  role: 80,
  skills: 400,
  industry: 120,
  company: 1000,
  responsibilities: 1000,
} as const;