import type { GenerateFn } from "@/tools/types";
import { formatINR, toPositive } from "../format";
import { LEGAL_DISCLAIMER, formatDate, str } from "./shared";

export const generateFreelanceContract: GenerateFn = (values) => {
  const clientName = str(values.clientName);
  const freelancerName = str(values.freelancerName);
  const projectDescription = str(values.projectDescription);
  const fee = toPositive(values.fee);
  const paymentTerms = str(values.paymentTerms) || "50% upfront, 50% on completion";
  const startDate = formatDate(values.startDate);
  const deliveryDate = formatDate(values.deliveryDate);

  if (clientName === "") return { error: "Enter the client's name." };
  if (freelancerName === "") return { error: "Enter the freelancer's name." };
  if (projectDescription === "") return { error: "Describe the project scope." };
  if (fee === null) return { error: "Enter the total project fee." };
  if (startDate === "") return { error: "Select the start date." };
  if (deliveryDate === "") return { error: "Select the expected delivery date." };

  const text = `FREELANCE SERVICES AGREEMENT

This Freelance Services Agreement ("Agreement") is entered into on ${startDate} between:

${clientName} ("Client")

and

${freelancerName} ("Freelancer")

1. Scope of Work
The Freelancer agrees to provide the following services to the Client: ${projectDescription}. Any changes to the scope of work must be agreed in writing by both Parties and may result in an adjustment to the fee and/or timeline.

2. Timeline
Work shall commence on ${startDate} and shall be delivered on or before ${deliveryDate}, subject to timely provision of any inputs, feedback or materials required from the Client.

3. Fee and Payment
The total fee for the services described above is ${formatINR(fee)}. Payment terms: ${paymentTerms}. Invoices are payable within 7 days of receipt unless otherwise agreed. Late payments may accrue interest at 1.5% per month.

4. Independent Contractor Relationship
The Freelancer is an independent contractor and not an employee of the Client. Nothing in this Agreement shall be construed to create an employer-employee, partnership or joint venture relationship between the Parties. The Freelancer is responsible for their own taxes, insurance and statutory compliance.

5. Intellectual Property
Upon full payment of all fees due under this Agreement, all intellectual property rights in the deliverables created specifically for this project shall transfer to the Client. The Freelancer retains the right to use general skills, know-how and pre-existing tools/frameworks used in the course of the work, and may showcase the completed work in their portfolio unless the Client requests confidentiality in writing.

6. Confidentiality
Each Party agrees to keep confidential any proprietary or non-public information disclosed by the other Party during the course of this engagement, and not to disclose such information to any third party without prior written consent.

7. Revisions
The fee quoted includes up to two (2) rounds of revisions to the deliverables. Additional revisions beyond this may be billed separately at a rate to be mutually agreed.

8. Termination
Either Party may terminate this Agreement with 7 days' written notice. In the event of termination, the Client shall pay the Freelancer for all work completed up to the date of termination, on a pro-rata basis.

9. Limitation of Liability
The Freelancer's total liability under this Agreement shall not exceed the total fees paid by the Client under this Agreement.

10. Governing Law
This Agreement shall be governed by the laws of India, and disputes shall be subject to the jurisdiction of the courts at the Freelancer's place of business.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

${clientName}                                    ${freelancerName}
(Client)                                          (Freelancer)

_______________________                    _______________________
Signature & Date                                  Signature & Date

${LEGAL_DISCLAIMER}`;

  return { text, filename: "freelance-contract.txt" };
};
