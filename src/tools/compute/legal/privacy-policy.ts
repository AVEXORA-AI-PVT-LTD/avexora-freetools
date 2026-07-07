import type { GenerateFn } from "@/tools/types";
import { LEGAL_DISCLAIMER, str } from "./shared";

export const generatePrivacyPolicy: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const websiteUrl = str(values.websiteUrl);
  const contactEmail = str(values.contactEmail);
  const collectsPayments = values.collectsPayments === true;
  const usesCookies = values.usesCookies !== false;
  const usesAnalytics = values.usesAnalytics !== false;

  if (companyName === "") return { error: "Enter the company/website name." };
  if (websiteUrl === "") return { error: "Enter the website URL." };
  if (contactEmail === "") return { error: "Enter a contact email address." };

  const dataCollected = [
    "Name, email address and phone number when you contact us or create an account",
    "Billing and shipping details when you place an order",
    collectsPayments && "Payment information, processed securely by our payment gateway partner (we do not store full card details)",
    usesAnalytics && "Usage data such as pages visited, time spent, and device/browser information via analytics tools",
    usesCookies && "Cookies and similar tracking technologies, as described in the Cookies section below",
  ].filter((x): x is string => Boolean(x));

  const text = `PRIVACY POLICY

Last updated: [Date]

${companyName} ("we", "us" or "our") operates ${websiteUrl} (the "Website"). This Privacy Policy explains how we collect, use, disclose and safeguard your information when you visit our Website or use our services.

1. Information We Collect
We may collect the following types of information:
${dataCollected.map((d) => `- ${d}`).join("\n")}

2. How We Use Your Information
We use the information we collect to:
- Provide, operate and maintain our services
- Process transactions and send related information, including confirmations
- Respond to your comments, questions and requests, and provide customer support
- Send administrative information, such as updates to our terms and policies
- Improve our Website and services based on usage patterns
${usesAnalytics ? "- Analyse how visitors use our Website to improve user experience" : ""}

3. Sharing of Information
We do not sell your personal information to third parties. We may share information with:
- Service providers who perform services on our behalf (e.g. payment processing, hosting, analytics)
- Law enforcement or regulators, where required by applicable law
- A successor entity, in the event of a merger, acquisition or sale of assets

${usesCookies ? `4. Cookies
We use cookies and similar tracking technologies to track activity on our Website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent, though some parts of our Website may not function properly without cookies.

5. Data Security` : "4. Data Security"}
We implement reasonable technical and organisational measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.

${usesCookies ? "6" : "5"}. Your Rights
Depending on your location, you may have rights regarding your personal information, including the right to access, correct, or request deletion of your data. To exercise these rights, contact us at ${contactEmail}.

${usesCookies ? "7" : "6"}. Children's Privacy
Our Website is not directed at children under 18, and we do not knowingly collect personal information from children.

${usesCookies ? "8" : "7"}. Changes to This Policy
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated "Last updated" date.

${usesCookies ? "9" : "8"}. Contact Us
If you have questions about this Privacy Policy, please contact us at ${contactEmail}.

${LEGAL_DISCLAIMER}`;

  return { text, filename: "privacy-policy.txt" };
};
