import type { GenerateFn } from "@/tools/types";
import { formatINR, formatNumber, toPositive, toPositiveOr } from "../format";
import { LEGAL_DISCLAIMER, formatDate, str } from "./shared";

export const generateEmploymentContract: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const employeeName = str(values.employeeName);
  const designation = str(values.designation);
  const annualCtc = toPositive(values.annualCtc);
  const startDate = formatDate(values.startDate);
  const workLocation = str(values.workLocation);
  const noticePeriodDays = toPositiveOr(values.noticePeriodDays ?? 30, 30);

  if (companyName === "") return { error: "Enter the company name." };
  if (employeeName === "") return { error: "Enter the employee's name." };
  if (designation === "") return { error: "Enter the designation." };
  if (annualCtc === null) return { error: "Enter the annual CTC." };
  if (startDate === "") return { error: "Select the start date." };
  if (workLocation === "") return { error: "Enter the work location." };
  if (noticePeriodDays === null) return { error: "Enter a valid notice period in days." };

  const text = `EMPLOYMENT CONTRACT

This Employment Contract ("Contract") is entered into on ${startDate} between:

${companyName} ("Company")

and

${employeeName} ("Employee")

1. Position and Duties
The Company hereby employs the Employee in the position of ${designation}, based at ${workLocation}. The Employee shall perform the duties customarily associated with this role and such other duties as may reasonably be assigned by the Company from time to time.

2. Commencement
This Contract shall take effect from ${startDate} ("Effective Date").

3. Compensation
The Employee's total annual cost to company (CTC) shall be ${formatINR(annualCtc)}, payable monthly, subject to applicable statutory deductions including provident fund, professional tax and income tax. A detailed salary break-up shall be provided separately.

4. Probation
The Employee shall be on probation for a period of six (6) months from the Effective Date. The Company may extend the probation period at its discretion. Confirmation of employment shall be communicated in writing.

5. Working Hours
The Employee shall work the Company's standard business hours as communicated from time to time, subject to applicable labour laws.

6. Leave
The Employee shall be entitled to leave in accordance with the Company's leave policy, as amended from time to time and communicated separately.

7. Confidentiality
The Employee agrees to keep confidential all proprietary and non-public information of the Company, its clients and business partners, both during and after the term of employment, and to return all Company property upon separation.

8. Non-Solicitation
During employment and for a period of twelve (12) months thereafter, the Employee shall not solicit or induce any employee or client of the Company to terminate their relationship with the Company.

9. Termination
Either Party may terminate this Contract by giving ${formatNumber(noticePeriodDays)} days' written notice, or payment in lieu of notice at the Company's discretion. The Company may terminate this Contract without notice in cases of serious misconduct.

10. Governing Law
This Contract shall be governed by the laws of India and the applicable Shops & Establishments Act of the state in which the Employee is based, and disputes shall be subject to the jurisdiction of the courts at ${workLocation}.

IN WITNESS WHEREOF, the Parties have executed this Contract as of the date first written above.

For ${companyName}                              ${employeeName}

_______________________                    _______________________
Authorised Signatory                              Employee Signature

${LEGAL_DISCLAIMER}`;

  return { text, filename: "employment-contract.txt" };
};
