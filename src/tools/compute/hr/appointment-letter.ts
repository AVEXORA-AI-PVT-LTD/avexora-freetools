import type { GenerateFn } from "@/tools/types";
import { formatINR, formatNumber, toPositive } from "../format";

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

export const generateAppointmentLetter: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const employeeName = str(values.employeeName);
  const designation = str(values.designation);
  const joiningDate = formatDate(values.joiningDate);
  const annualCtc = toPositive(values.annualCtc);
  const workLocation = str(values.workLocation);
  const noticePeriodDays = toPositive(values.noticePeriodDays);

  if (companyName === "") return { error: "Enter the company name." };
  if (employeeName === "") return { error: "Enter the employee name." };
  if (designation === "") return { error: "Enter the designation." };
  if (joiningDate === "") return { error: "Select the joining date." };
  if (annualCtc === null) return { error: "Enter an annual CTC greater than zero." };
  if (workLocation === "") return { error: "Enter the work location." };
  if (noticePeriodDays === null) return { error: "Enter the notice period in days (greater than zero)." };

  const text = `${companyName}

LETTER OF APPOINTMENT

Dear ${employeeName},

With reference to your application and subsequent discussions, we are pleased to appoint you as ${designation} with ${companyName} on the following terms and conditions.

1. Position and place of work
You are appointed as ${designation}, based at our ${workLocation} office. The company reserves the right to transfer you to any of its departments, offices or client locations, in India or abroad, on the same or equivalent terms.

2. Date of appointment
Your appointment takes effect from ${joiningDate}, your date of joining.

3. Remuneration
Your total annual cost to company (CTC) will be ${formatINR(annualCtc)}, payable as per the compensation structure annexed to this letter. Salary is paid monthly in arrears, subject to deductions towards provident fund, professional tax, income tax and any other statutory levies as applicable from time to time.

4. Probation and confirmation
You will be on probation for a period of six (6) months from your date of joining. The company may, at its discretion, extend the probation period. Your services will be deemed confirmed only upon written communication of confirmation.

5. Notice period
After confirmation, either party may terminate this employment by giving ${formatNumber(noticePeriodDays)} days' written notice or salary in lieu thereof, at the company's discretion. The company may waive or adjust the notice period in accordance with its policies.

6. Leave
You will be entitled to leave in accordance with the company's leave policy as applicable to your grade, details of which are set out in the employee handbook and may be revised from time to time.

7. Confidentiality and company property
You shall maintain strict confidentiality of all information relating to the business, clients, processes and affairs of ${companyName}, both during and after your employment, and shall return all company property and materials upon separation.

8. General
Your employment is governed by this letter read together with the company's policies, procedures and code of conduct, as amended from time to time. Any dispute shall be subject to the jurisdiction of the courts at ${workLocation}.

Please sign and return the duplicate copy of this letter as a token of your acceptance of the above terms.

We welcome you to ${companyName} and wish you a long and successful association with us.

Yours sincerely,

For ${companyName}

_______________________
Authorised Signatory

I accept the terms and conditions of this appointment.

Signature: _______________________    Date: _______________
(${employeeName})`;

  return { text, filename: "appointment-letter.txt" };
};
