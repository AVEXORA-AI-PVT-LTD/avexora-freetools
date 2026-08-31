import type { GenerateFn } from "@/tools/types";
import { formatINR, formatPercent, toNonNegative, toPositive } from "../format";
import { LEGAL_DISCLAIMER, formatDate, str } from "./shared";

export const generateLoanAgreement: GenerateFn = (values) => {
  const lenderName = str(values.lenderName);
  const borrowerName = str(values.borrowerName);
  const principal = toPositive(values.principal);
  const interestRate = toNonNegative(values.interestRate);
  const repaymentMonths = toPositive(values.repaymentMonths);
  const loanDate = formatDate(values.loanDate);

  if (lenderName === "") return { error: "Enter the lender's name." };
  if (borrowerName === "") return { error: "Enter the borrower's name." };
  if (principal === null) return { error: "Enter the loan amount." };
  if (interestRate === null) return { error: "Enter a valid interest rate (0 or more)." };
  if (repaymentMonths === null) return { error: "Enter the repayment period in months." };
  if (loanDate === "") return { error: "Select the loan date." };

  const monthlyRate = interestRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? principal / repaymentMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths)) /
        (Math.pow(1 + monthlyRate, repaymentMonths) - 1);

  const text = `LOAN AGREEMENT

This Loan Agreement ("Agreement") is made on ${loanDate} between:

${lenderName} ("Lender")

and

${borrowerName} ("Borrower")

1. Loan Amount
The Lender agrees to lend, and the Borrower agrees to borrow, a sum of ${formatINR(principal)} ("Loan Amount"), to be disbursed on or around ${loanDate}.

2. Interest
The Loan Amount shall carry interest at the rate of ${formatPercent(interestRate)} per annum, calculated on the outstanding principal balance.

3. Repayment
The Borrower shall repay the Loan Amount together with interest in ${repaymentMonths} equal monthly instalments of approximately ${formatINR(emi)} each, commencing one month from the date of disbursement, until the Loan Amount and all accrued interest are repaid in full.

4. Prepayment
The Borrower may prepay the outstanding Loan Amount, in whole or in part, at any time without penalty, unless otherwise agreed in writing between the Parties.

5. Default
If the Borrower fails to make any payment when due and such failure continues for 15 days after written notice from the Lender, the Lender may declare the entire outstanding balance, together with accrued interest, immediately due and payable.

6. Security
[Describe any collateral or security for this loan here, or state "This is an unsecured loan" if none.]

7. Governing Law
This Agreement shall be governed by the laws of India, and any disputes arising under this Agreement shall be subject to the jurisdiction of the courts at the Lender's place of residence/business.

8. Entire Agreement
This Agreement constitutes the entire understanding between the Parties regarding the loan described above and supersedes all prior discussions, whether written or oral.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

${lenderName}                                    ${borrowerName}
(Lender)                                          (Borrower)

_______________________                    _______________________
Signature                                          Signature

Witnesses:
1. _______________________
2. _______________________

${LEGAL_DISCLAIMER} Loan agreements above certain amounts may require stamp duty and registration under state law — verify local requirements before relying on this document.`;

  return { text, filename: "loan-agreement.txt" };
};
