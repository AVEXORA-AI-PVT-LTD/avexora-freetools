import type { GenerateFn } from "@/tools/types";
import { LEGAL_DISCLAIMER, formatDate, str } from "./shared";

export const generateNda: GenerateFn = (values) => {
  const partyA = str(values.partyA);
  const partyB = str(values.partyB);
  const effectiveDate = formatDate(values.effectiveDate);
  const purpose = str(values.purpose);
  const termYears = str(values.termYears) || "2";
  const mutual = values.mutual !== false;

  if (partyA === "") return { error: "Enter the first party's name." };
  if (partyB === "") return { error: "Enter the second party's name." };
  if (effectiveDate === "") return { error: "Select the effective date." };
  if (purpose === "") return { error: "Describe the purpose of the disclosure." };

  const disclosingClause = mutual
    ? `Both ${partyA} and ${partyB} may disclose confidential information to each other under this Agreement, and both parties agree to the obligations below regarding information they receive.`
    : `${partyA} (the "Disclosing Party") may disclose confidential information to ${partyB} (the "Receiving Party"), who agrees to the obligations below regarding information received.`;

  const text = `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on ${effectiveDate} between:

${partyA} ("Party A")

and

${partyB} ("Party B")

(each a "Party" and together the "Parties")

1. Purpose
The Parties wish to explore, discuss or engage in the following: ${purpose}. In connection with this purpose, one or both Parties may disclose confidential and proprietary information to the other.

2. Confidential Information
${disclosingClause} "Confidential Information" means any non-public information disclosed by one Party to the other, whether oral, written or in any other form, including but not limited to business plans, financial information, technical data, trade secrets, customer lists and product designs, that is designated as confidential or that would reasonably be understood to be confidential given the nature of the information and circumstances of disclosure.

3. Obligations of the Receiving Party
The Receiving Party agrees to:
(a) hold the Confidential Information in strict confidence;
(b) not disclose the Confidential Information to any third party without the prior written consent of the Disclosing Party;
(c) use the Confidential Information solely for the purpose described above; and
(d) protect the Confidential Information using at least the same degree of care it uses to protect its own confidential information, and in no event less than reasonable care.

4. Exclusions
This Agreement imposes no obligation with respect to information that: (a) was already known to the Receiving Party without an obligation of confidentiality; (b) is or becomes publicly available through no fault of the Receiving Party; (c) is independently developed by the Receiving Party without use of the Confidential Information; or (d) is required to be disclosed by law or court order, provided the Receiving Party gives prompt notice to allow the Disclosing Party to seek a protective order.

5. Term
This Agreement shall remain in effect for ${termYears} year(s) from the date of this Agreement. The obligations of confidentiality shall survive termination of this Agreement for the duration stated above.

6. No License or Obligation
Nothing in this Agreement shall be construed as granting any rights, by license or otherwise, to any Confidential Information disclosed, nor does this Agreement obligate either Party to proceed with any transaction or relationship.

7. Governing Law
This Agreement shall be governed by and construed in accordance with the laws of India, and the courts at the location of the Disclosing Party shall have exclusive jurisdiction over any disputes arising under this Agreement.

8. Entire Agreement
This Agreement constitutes the entire understanding between the Parties with respect to its subject matter and supersedes all prior discussions and agreements, whether written or oral.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

${partyA}                                    ${partyB}

_______________________              _______________________
Signature                                     Signature

_______________________              _______________________
Name & Date                                   Name & Date

${LEGAL_DISCLAIMER}`;

  return { text, filename: "nda.txt" };
};
