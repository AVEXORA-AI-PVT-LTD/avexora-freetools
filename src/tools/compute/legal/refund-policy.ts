import type { GenerateFn } from "@/tools/types";
import { LEGAL_DISCLAIMER, str } from "./shared";
import { toPositiveOr } from "../format";

export const generateRefundPolicy: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const contactEmail = str(values.contactEmail);
  const returnWindowDays = toPositiveOr(values.returnWindowDays ?? 7, 7);
  const productType = str(values.productType) || "physical products";
  const isDigital = values.digitalGoods === true;

  if (companyName === "") return { error: "Enter the company name." };
  if (contactEmail === "") return { error: "Enter a contact email address." };
  if (returnWindowDays === null) return { error: "Enter a valid return/refund window in days." };

  const digitalClause = isDigital
    ? `Because our products are digital and delivered instantly, refunds for digital goods are only available if the product is materially defective, was not delivered due to a technical error on our part, or as otherwise required by applicable consumer protection law.`
    : `To be eligible for a return, the item must be unused, in its original packaging, and in the same condition in which you received it.`;

  const text = `REFUND AND RETURN POLICY

Last updated: [Date]

Thank you for choosing ${companyName}. This Refund and Return Policy explains our policy on returns and refunds for ${productType}.

1. Return Window
You have ${returnWindowDays} days from the date of delivery (or purchase, for digital goods) to request a return or refund. After this period, we are unable to offer a refund or exchange.

2. Eligibility for Returns
${digitalClause}

3. How to Request a Refund
To request a refund, contact us at ${contactEmail} with your order number and the reason for your request. We will review your request and respond within 2-3 business days with instructions, if applicable.

4. Refund Process
Once your return is received and inspected (where applicable), we will notify you of the approval or rejection of your refund. If approved, your refund will be processed to your original payment method within 7-10 business days.

5. Non-Refundable Items
The following items are not eligible for refund, except where required by law:
- Items marked as final sale or non-returnable at the time of purchase
- Gift cards
- Products that have been used, damaged, or altered after delivery (for physical products)

6. Shipping Costs (for physical products)
Unless the return is due to our error (e.g. defective or incorrect item), you will be responsible for paying your own shipping costs for returning your item.

7. Late or Missing Refunds
If you haven't received a refund within the timeframe above, first check your bank account again, then contact your card issuer or bank, as processing times vary. If you've done this and still have not received your refund, contact us at ${contactEmail}.

8. Contact Us
For any questions about this Refund and Return Policy, please contact us at ${contactEmail}.

${LEGAL_DISCLAIMER}`;

  return { text, filename: "refund-policy.txt" };
};
