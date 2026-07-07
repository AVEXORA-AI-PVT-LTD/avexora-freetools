import type { GenerateFn } from "@/tools/types";
import { formatINR, formatPercent, toPositive } from "../format";
import { LEGAL_DISCLAIMER, formatDate, str } from "./shared";

export const generatePartnershipDeed: GenerateFn = (values) => {
  const firmName = str(values.firmName);
  const partner1Name = str(values.partner1Name);
  const partner1Share = toPositive(values.partner1Share);
  const partner2Name = str(values.partner2Name);
  const partner2Share = toPositive(values.partner2Share);
  const businessAddress = str(values.businessAddress);
  const capitalContribution = toPositive(values.capitalContribution);
  const startDate = formatDate(values.startDate);

  if (firmName === "") return { error: "Enter the firm name." };
  if (partner1Name === "") return { error: "Enter the first partner's name." };
  if (partner1Share === null) return { error: "Enter the first partner's profit-sharing percentage." };
  if (partner2Name === "") return { error: "Enter the second partner's name." };
  if (partner2Share === null) return { error: "Enter the second partner's profit-sharing percentage." };
  if (businessAddress === "") return { error: "Enter the business address." };
  if (capitalContribution === null) return { error: "Enter the total initial capital contribution." };
  if (startDate === "") return { error: "Select the commencement date." };

  if (Math.abs(partner1Share + partner2Share - 100) > 0.01) {
    return { error: "The two partners' profit-sharing percentages must add up to 100%." };
  }

  const text = `PARTNERSHIP DEED

This Deed of Partnership is made on ${startDate} between:

${partner1Name} ("First Partner")

and

${partner2Name} ("Second Partner")

(collectively the "Partners")

WHEREAS the Partners have agreed to carry on business in partnership on the terms and conditions set out below.

1. Name and Place of Business
The partnership business shall be carried on under the name and style of "${firmName}" at ${businessAddress}, or such other place(s) as the Partners may mutually decide.

2. Commencement
The partnership shall be deemed to have commenced business from ${startDate}.

3. Capital
The total initial capital of the partnership shall be ${formatINR(capitalContribution)}, contributed by the Partners in proportion to their profit-sharing ratio, unless otherwise agreed in writing.

4. Profit and Loss Sharing
The net profits and losses of the partnership business shall be shared between the Partners as follows:
- ${partner1Name}: ${formatPercent(partner1Share)}
- ${partner2Name}: ${formatPercent(partner2Share)}

5. Duties of Partners
Each Partner shall devote their time and attention to the business of the partnership and act in good faith for the benefit of the partnership. Major business decisions shall be taken with the mutual consent of both Partners.

6. Bank Account
The partnership shall maintain a bank account in the name of the firm, to be operated by the Partners jointly or as they may mutually decide and communicate to the bank in writing.

7. Books of Account
Proper books of account shall be maintained at the principal place of business and shall be open to inspection by either Partner at any reasonable time.

8. Retirement and Admission of Partners
No Partner shall retire from, and no new partner shall be admitted to, the partnership without the written consent of all existing Partners.

9. Dissolution
The partnership may be dissolved by mutual consent of the Partners, or as otherwise provided under the Indian Partnership Act, 1932. Upon dissolution, the assets of the partnership shall be applied first towards partnership debts, and the surplus, if any, distributed among the Partners in their profit-sharing ratio.

10. Dispute Resolution
Any disputes arising between the Partners in connection with this Deed shall first be attempted to be resolved through mutual discussion, failing which the matter may be referred to arbitration under the Arbitration and Conciliation Act, 1996.

11. Governing Law
This Deed shall be governed by the Indian Partnership Act, 1932 and other applicable laws of India.

IN WITNESS WHEREOF, the Partners have executed this Deed as of the date first written above.

${partner1Name}                                    ${partner2Name}
(First Partner)                                     (Second Partner)

_______________________                       _______________________
Signature                                            Signature

Witnesses:
1. _______________________
2. _______________________

${LEGAL_DISCLAIMER} Consider registering this partnership deed with the Registrar of Firms in your state for enhanced legal standing.`;

  return { text, filename: "partnership-deed.txt" };
};
