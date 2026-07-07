import type { GenerateFn } from "@/tools/types";
import { formatINR, toPositive } from "../format";
import { LEGAL_DISCLAIMER, formatDate, str } from "./shared";

export const generateRentAgreement: GenerateFn = (values) => {
  const landlordName = str(values.landlordName);
  const tenantName = str(values.tenantName);
  const propertyAddress = str(values.propertyAddress);
  const monthlyRent = toPositive(values.monthlyRent);
  const securityDeposit = toPositive(values.securityDeposit);
  const startDate = formatDate(values.startDate);
  const durationMonths = toPositive(values.durationMonths) ?? 11;

  if (landlordName === "") return { error: "Enter the landlord's name." };
  if (tenantName === "") return { error: "Enter the tenant's name." };
  if (propertyAddress === "") return { error: "Enter the property address." };
  if (monthlyRent === null) return { error: "Enter the monthly rent amount." };
  if (securityDeposit === null) return { error: "Enter the security deposit amount." };
  if (startDate === "") return { error: "Select the tenancy start date." };

  const text = `RENT AGREEMENT (LEAVE AND LICENSE)

This Rent Agreement ("Agreement") is made on ${startDate} between:

${landlordName} ("Landlord/Licensor")

and

${tenantName} ("Tenant/Licensee")

WHEREAS the Landlord is the owner/authorised person in respect of the property situated at ${propertyAddress} ("Premises"), and the Tenant desires to take the Premises on a leave-and-license basis, the Parties agree as follows:

1. Term
This Agreement is for a period of ${durationMonths} months, commencing from ${startDate}. This tenancy may be renewed by mutual written consent of both Parties on terms to be agreed at that time.

2. Rent
The Tenant shall pay a monthly rent of ${formatINR(monthlyRent)}, payable in advance on or before the 5th day of each calendar month, by bank transfer or such other mode as agreed between the Parties.

3. Security Deposit
The Tenant has paid a refundable security deposit of ${formatINR(securityDeposit)} to the Landlord. This deposit shall be refunded to the Tenant within 30 days of vacating the Premises, after deducting any dues, damages beyond normal wear and tear, or unpaid utility charges.

4. Use of Premises
The Tenant shall use the Premises solely for residential purposes and shall not sub-let, assign or part with possession of the Premises, in whole or in part, without the prior written consent of the Landlord.

5. Maintenance
The Tenant shall maintain the Premises in good condition and shall be responsible for minor repairs. Major structural repairs shall be the responsibility of the Landlord. The Tenant shall bear all charges towards electricity, water and other utility consumption during the tenancy.

6. Termination
Either Party may terminate this Agreement by giving one (1) month's written notice to the other Party. In case of any breach of the terms of this Agreement by the Tenant, the Landlord may terminate this Agreement with immediate effect after providing reasonable notice.

7. Inspection
The Landlord or their authorised representative may inspect the Premises at reasonable times with prior notice to the Tenant.

8. Governing Law
This Agreement shall be governed by the applicable rent control and tenancy laws of the state in which the Premises is located.

IN WITNESS WHEREOF, the Parties have set their hands on the date first written above.

${landlordName}                                    ${tenantName}
(Landlord)                                          (Tenant)

_______________________                       _______________________
Signature                                            Signature

Witnesses:
1. _______________________
2. _______________________

${LEGAL_DISCLAIMER} Rent control and tenancy laws vary significantly by state in India — have this agreement reviewed, and registered where required by local law, before relying on it.`;

  return { text, filename: "rent-agreement.txt" };
};
