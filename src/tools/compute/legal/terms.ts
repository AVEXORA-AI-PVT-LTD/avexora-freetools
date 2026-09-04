import type { GenerateFn } from "@/types/tools";
import { LEGAL_DISCLAIMER, str } from "./shared";

export const generateTerms: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const websiteUrl = str(values.websiteUrl);
  const contactEmail = str(values.contactEmail);
  const businessType = str(values.businessType) || "online services";
  const governingCity = str(values.governingCity) || "[City]";

  if (companyName === "") return { error: "Enter the company/website name." };
  if (websiteUrl === "") return { error: "Enter the website URL." };
  if (contactEmail === "") return { error: "Enter a contact email address." };

  const text = `TERMS AND CONDITIONS

Last updated: [Date]

Welcome to ${websiteUrl} ("Website"), operated by ${companyName} ("we", "us" or "our"), providing ${businessType}. By accessing or using our Website, you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these Terms, please do not use our Website.

1. Use of the Website
You agree to use the Website only for lawful purposes and in accordance with these Terms. You must not use the Website in any way that could damage, disable or impair the Website or interfere with any other party's use of it.

2. Accounts
If you create an account with us, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account.

3. Intellectual Property
The Website and its original content, features and functionality are and will remain the exclusive property of ${companyName} and its licensors. Nothing in these Terms grants you any right to use our trademarks, logos or other proprietary content without our prior written consent.

4. Orders and Payment
If you place an order through the Website, you agree to provide accurate and complete information. All prices are listed in the applicable currency and are subject to change without notice. We reserve the right to refuse or cancel any order at our discretion.

5. Prohibited Uses
You agree not to use the Website:
(a) in any way that violates any applicable law or regulation;
(b) to transmit any advertising or promotional material without our prior written consent;
(c) to impersonate or attempt to impersonate ${companyName}, an employee, another user, or any other person; or
(d) to engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Website.

6. Disclaimer of Warranties
The Website is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the operation of the Website or the information, content or materials included on it.

7. Limitation of Liability
To the fullest extent permitted by law, ${companyName} shall not be liable for any indirect, incidental, special, consequential or punitive damages arising from your use of, or inability to use, the Website or services.

8. Indemnification
You agree to indemnify and hold harmless ${companyName}, its officers, directors, employees and agents from any claims, damages, liabilities and expenses arising out of your use of the Website or violation of these Terms.

9. Termination
We may terminate or suspend your access to the Website immediately, without prior notice, for any breach of these Terms.

10. Governing Law
These Terms shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts at ${governingCity}.

11. Changes to Terms
We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page.

12. Contact Us
If you have any questions about these Terms, please contact us at ${contactEmail}.

${LEGAL_DISCLAIMER}`;

  return { text, filename: "terms-and-conditions.txt" };
};
