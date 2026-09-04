import type { GenerateFn } from "@/types/tools";
import { formatINR, toPositive } from "../format";

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

export const generateOfferLetter: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const candidateName = str(values.candidateName);
  const designation = str(values.designation);
  const annualCtc = toPositive(values.annualCtc);
  const joiningDate = formatDate(values.joiningDate);
  const workLocation = str(values.workLocation);
  const reportingManager = str(values.reportingManager);

  if (companyName === "") return { error: "Enter the company name." };
  if (candidateName === "") return { error: "Enter the candidate name." };
  if (designation === "") return { error: "Enter the designation." };
  if (annualCtc === null) return { error: "Enter an annual CTC greater than zero." };
  if (joiningDate === "") return { error: "Select the proposed joining date." };
  if (workLocation === "") return { error: "Enter the work location." };

  const reportingLine =
    reportingManager !== ""
      ? ` You will report to ${reportingManager}, and your reporting line may be revised as the organisation requires.`
      : "";

  const text = `${companyName}

OFFER OF EMPLOYMENT

Dear ${candidateName},

Further to our recent discussions, we are pleased to offer you the position of ${designation} with ${companyName}. We were impressed with your background and believe you will be a valuable addition to our team. The terms of this offer are set out below.

1. Position and location
You will be engaged as ${designation}, based at our ${workLocation} office. The company may require you to work at any of its other offices or client locations as business needs dictate.${reportingLine}

2. Compensation
Your total annual cost to company (CTC) will be ${formatINR(annualCtc)}, structured across salary components, statutory contributions and applicable benefits. A detailed compensation break-up will be shared along with your appointment letter. Salary is payable monthly, subject to statutory deductions such as provident fund, professional tax and income tax as applicable.

3. Date of joining
Your employment is expected to commence on ${joiningDate}. Please report to the ${workLocation} office on that date along with your educational certificates, proof of identity and address, PAN card, and relieving letter from your previous employer, where applicable.

4. Probation
You will be on probation for a period of six (6) months from your date of joining. On successful completion of probation, your employment will be confirmed in writing. During probation, either party may terminate the engagement in accordance with company policy.

5. Confidentiality
During and after your employment, you shall keep confidential all business, technical and commercial information of ${companyName} and its clients, and shall not use or disclose it except in the proper performance of your duties.

6. General
This offer is contingent upon satisfactory verification of your documents, references and background. Detailed terms of employment will be set out in your appointment letter, which together with company policies will govern your employment.

We look forward to welcoming you to ${companyName}. Kindly sign and return a copy of this letter as a token of your acceptance within seven (7) days.

Yours sincerely,

For ${companyName}

_______________________
Authorised Signatory

ACCEPTANCE

I, ${candidateName}, accept the above offer on the terms stated.

Signature: _______________________    Date: _______________`;

  return { text, filename: "offer-letter.txt" };
};
