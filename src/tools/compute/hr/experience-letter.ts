import type { GenerateFn } from "@/tools/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Format an ISO date (yyyy-mm-dd) as "1 August 2026"; pass anything else through. */
function formatDate(value: unknown): string {
  const s = str(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const monthName = MONTHS[Number(m[2]) - 1];
  if (!monthName) return s;
  return `${Number(m[3])} ${monthName} ${m[1]}`;
}

const CONDUCT_PHRASES: Record<string, string> = {
  excellent:
    "During this period, we found their performance to be excellent and their conduct exemplary. They consistently demonstrated professionalism, dedication and a strong sense of ownership in every assignment.",
  good:
    "During this period, we found their performance to be good and their conduct professional. They carried out their responsibilities sincerely and worked well with colleagues across teams.",
  satisfactory:
    "During this period, their performance and conduct were satisfactory, and they discharged the duties assigned to them.",
};

export const generateExperienceLetter: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const employeeName = str(values.employeeName);
  const designation = str(values.designation);
  const joiningDate = formatDate(values.joiningDate);
  const leavingDate = formatDate(values.leavingDate);
  const conduct = str(values.conduct);

  if (companyName === "") return { error: "Enter the company name." };
  if (employeeName === "") return { error: "Enter the employee name." };
  if (designation === "") return { error: "Enter the designation." };
  if (joiningDate === "") return { error: "Select the date of joining." };
  if (leavingDate === "") return { error: "Select the last working date." };
  const conductPhrase = CONDUCT_PHRASES[conduct];
  if (!conductPhrase) return { error: "Select a conduct remark." };

  const text = `${companyName}

TO WHOMSOEVER IT MAY CONCERN

EXPERIENCE CERTIFICATE

This is to certify that ${employeeName} was employed with ${companyName} as ${designation} from ${joiningDate} to ${leavingDate}.

${conductPhrase}

${employeeName} has been relieved of their duties after completing all exit formalities, and there are no dues outstanding against them.

We thank ${employeeName} for their contribution to ${companyName} and wish them continued success in their future endeavours.

For ${companyName}

_______________________
Authorised Signatory
(Human Resources)`;

  return { text, filename: "experience-letter.txt" };
};
