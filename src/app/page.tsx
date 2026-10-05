import { SITE_NAME, SITE_URL } from "@/tools/categories";
import { AVEXORA_ORGANIZATION } from "@/config/avexora-products";
import { Design3Page } from "@/components/design3/Design3Page";

const homepageJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Free calculators, generators, PDF & image utilities and AI writing tools for your business.",
  },
  { "@context": "https://schema.org", ...AVEXORA_ORGANIZATION },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      <Design3Page />
    </>
  );
}
