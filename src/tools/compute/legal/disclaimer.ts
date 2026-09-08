import type { GenerateFn } from "@/types/tools";
import { LEGAL_DISCLAIMER, str } from "./shared";

export const generateDisclaimer: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const websiteUrl = str(values.websiteUrl);
  const contactEmail = str(values.contactEmail);
  const niche = str(values.niche) || "general business and educational";
  const includesAffiliate = values.affiliateLinks === true;
  const includesProfessionalAdvice = values.professionalAdviceNotice === true;

  if (companyName === "") return { error: "Enter the company/website name." };
  if (websiteUrl === "") return { error: "Enter the website URL." };
  if (contactEmail === "") return { error: "Enter a contact email address." };

  const text = `DISCLAIMER

Last updated: [Date]

The information provided by ${companyName} ("we", "us" or "our") on ${websiteUrl} (the "Website") is for general ${niche} informational purposes only. All information on the Website is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability or completeness of any information on the Website.

1. No Professional Advice
${
    includesProfessionalAdvice
      ? "The Website may contain information related to financial, legal, medical or other professional topics, but such information is not intended as a substitute for professional advice. Always seek the advice of a qualified professional with any questions you may have regarding your specific situation."
      : "Nothing on this Website constitutes professional advice of any kind. You should not act or refrain from acting on the basis of any content on this Website without seeking appropriate professional advice on the particular facts and circumstances at issue."
  }

2. No Liability
Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the Website or reliance on any information provided on the Website. Your use of the Website and your reliance on any information on the Website is solely at your own risk.

3. External Links Disclaimer
The Website may contain links to other websites or content belonging to or originating from third parties. Such external links are not investigated, monitored or checked for accuracy, adequacy, validity, reliability, availability or completeness by us, and we do not warrant, endorse or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through the Website.

${includesAffiliate ? `4. Affiliate Disclaimer
The Website may contain links to affiliate websites, and we may receive an affiliate commission for any purchases made by you on the affiliate website using such links. This does not affect the price you pay, and we only recommend products or services we believe add value to our readers.

5. Errors and Omissions Disclaimer` : "4. Errors and Omissions Disclaimer"}
While we have made every attempt to ensure that the information on this Website is accurate, we are not responsible for any errors or omissions, or for the results obtained from the use of this information.

${includesAffiliate ? "6" : "5"}. Contact Us
If you have any questions about this Disclaimer, please contact us at ${contactEmail}.

${LEGAL_DISCLAIMER}`;

  return { text, filename: "disclaimer.txt" };
};
