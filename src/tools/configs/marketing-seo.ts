import type { ToolConfig } from "../../types/tools";
import { generateMetaTags } from "../compute/marketing/meta-tags";
import { buildUtmUrl } from "../compute/marketing/utm-builder";
import { generateSlugs } from "../compute/marketing/slug";
import { generateHashtags } from "../compute/marketing/hashtags";
import { generateSerpSnippet } from "../compute/marketing/serp-snippet";
import { generateRobotsTxt } from "../compute/marketing/robots-txt";
import { computeKeywordDensity } from "../compute/marketing/keyword-density";
import { analyzeHeadline } from "../compute/marketing/headline";
import { testSubjectLine } from "../compute/marketing/subject-line";
import { computeRoas } from "../compute/marketing/roas";
import { computeCpm } from "../compute/marketing/cpm";
import { computeEngagementRate } from "../compute/marketing/engagement-rate";

export const tools: ToolConfig[] = [
  {
    kind: "generator",
    slug: "meta-tag-generator",
    category: "marketing-seo",
    name: "Meta Tag Generator",
    tagline: "Generate a complete HTML head block — title, description, Open Graph and Twitter tags.",
    seoDescription:
      "Free meta tag generator. Create a complete HTML head block with title, meta description, canonical, Open Graph and Twitter Card tags in seconds.",
    seoTitle: "Free Meta Tag Generator: Open Graph & Twitter Card Tags",
    keywords: [
      "meta tag generator",
      "meta tags generator",
      "Open Graph tag generator",
      "Twitter Card generator",
      "OG tag generator",
      "HTML meta tags",
      "meta description generator",
      "SEO meta tags",
      "canonical tag generator",
    ],
    directAnswer:
      "A meta tag generator that produces a complete, ready-to-paste HTML head block — title, meta description, canonical, full Open Graph set and matching Twitter Card tags with correct character escaping.",
    example:
      "Example: Enter 'Handmade Leather Wallets' as title and an image URL, and instantly get <title>, <meta name=\"description\">, <link rel=\"canonical\">, <meta property=\"og:title\"> and <meta name=\"twitter:card\"> tags formatted perfectly.",
    steps: [
      "Enter the page title and the meta description (keep them under ~60 and ~160 characters respectively).",
      "Optionally add a canonical URL, an OG image URL (1200 × 630 px recommended) and a site name.",
      "Pick the Twitter card type: summary_large_image or summary.",
      "Click Generate meta tags to build the complete head block.",
      "Copy the output into the <head> section of your page.",
    ],
    fields: [
      { name: "title", label: "Page title", type: "text", placeholder: "Handmade Leather Wallets | Arjun Crafts" },
      {
        name: "description",
        label: "Meta description",
        type: "textarea",
        rows: 3,
        placeholder: "Shop handmade full-grain leather wallets, crafted in Jaipur. Free shipping across India.",
      },
      { name: "canonical", label: "Canonical URL", type: "text", placeholder: "https://example.com/wallets", optional: true },
      { name: "ogImage", label: "OG image URL", type: "text", placeholder: "https://example.com/og/wallets.jpg", optional: true },
      { name: "siteName", label: "Site name", type: "text", placeholder: "Arjun Crafts", optional: true },
      {
        name: "twitterCard",
        label: "Twitter card type",
        type: "select",
        defaultValue: "summary_large_image",
        options: [
          { value: "summary_large_image", label: "Summary with large image" },
          { value: "summary", label: "Summary" },
        ],
      },
    ],
    generate: generateMetaTags,
    submitLabel: "Generate meta tags",
    about: [
      "Meta tags are the first thing search engines and social networks read about a page — and the part most sites get wrong or leave incomplete. The title tag becomes your clickable headline in Google results; the meta description becomes the two-line pitch underneath it; the Open Graph and Twitter Card tags decide what the link looks like when someone shares it on WhatsApp, LinkedIn, X or Slack. Miss the OG tags and a shared link shows up as a bare URL with no image — links like that get dramatically fewer clicks.",
      "This generator produces the whole head block in one pass. Enter the page title and description, optionally add a canonical URL, an OG image and a site name, pick a Twitter card style, and copy a ready-to-paste block: title and description tags, a canonical link, the full og: set (type, title, description, url, image, site name) and the matching twitter: tags. Special characters are escaped correctly, so an ampersand in your brand name won't produce invalid HTML.",
      "A few conventions worth following: keep the title under 60 characters and the description under 160 so Google shows them without truncation (check both in the [SERP snippet preview tool](/marketing-seo/serp-snippet-preview)). Use an OG image of 1200 × 630 pixels — that's the size every major platform renders sharply. And set the canonical URL on every page you care about; it tells Google which address is the official one when the same content is reachable at several URLs, protecting you from duplicate-content dilution. Paste the output into the head section of your page, or hand it to whoever maintains your site template.",
    ],
    faq: [
      {
        question: "Where exactly do I paste these generated tags on my website?",
        answer:
          "Paste them directly inside the <head> section of your HTML page, right before the closing </head> tag. If you're using WordPress, an SEO plugin like Yoast or RankMath will let you input these values, and for modern frameworks like Next.js, you'll translate them into the framework's metadata configuration.",
      },
      {
        question: "What's the best image size for Open Graph (OG) tags?",
        answer:
          "The safest standard is 1200 × 630 pixels. This aspect ratio renders perfectly and sharply across major platforms like WhatsApp, LinkedIn, X (Twitter), and Facebook. Always use an absolute HTTPS URL for the image path.",
      },
      {
        question: "Are meta keywords still relevant for SEO today?",
        answer:
          "Not at all. Google officially stopped using the meta keywords tag for ranking web pages back in 2009. That's why this generator skips it completely — your time is much better spent writing compelling titles and descriptions that boost your click-through rate.",
      },
      {
        question: "Why should I use a canonical URL tag?",
        answer:
          "It tells search engines which version of a URL is the 'official' one. This is crucial when the exact same content can be reached through different URLs (like with tracking parameters attached), preventing search engines from penalizing you for duplicate content.",
      },
      {
        question: "How long should my title and meta description really be?",
        answer:
          "Aim to keep your title tag under 60 characters and your meta description under 160 characters. If you go beyond these limits, Google will likely truncate your text with an ellipsis (...) in the search results, which can hide your most persuasive copy.",
      },
    ],
    related: ["serp-snippet-preview", "robots-txt-generator", "slug-generator", "ai-seo-title-generator"],
  },
  {
    kind: "generator",
    slug: "utm-builder",
    category: "marketing-seo",
    name: "UTM Link Builder",
    tagline: "Build campaign URLs with utm_source, utm_medium and utm_campaign parameters.",
    seoDescription:
      "Free UTM link builder. Add utm_source, utm_medium, utm_campaign, term and content parameters to any URL with correct encoding for campaign tracking.",
    seoTitle: "Free UTM Link Builder: Create Campaign Tracking URLs",
    keywords: [
      "UTM link builder",
      "UTM builder",
      "UTM generator",
      "campaign URL builder",
      "UTM parameters",
      "UTM tracking link",
      "utm_source utm_medium utm_campaign",
      "Google Analytics campaign URL",
      "how to create UTM links",
    ],
    directAnswer:
      "A UTM link builder that attaches correctly-encoded campaign parameters — utm_source, utm_medium, utm_campaign and the optional utm_term and utm_content — to any URL for accurate traffic tracking in analytics.",
    example:
      "Example: Enter 'https://yoursite.com' as destination, 'google' as source, 'cpc' as medium, and 'diwali-sale' as campaign. You get: https://yoursite.com/?utm_source=google&utm_medium=cpc&utm_campaign=diwali-sale",
    steps: [
      "Enter the destination URL (it must be a valid http/https link).",
      "Enter the three required parameters: campaign source, medium and campaign name.",
      "Optionally add the campaign term (paid keyword) and content (ad or button variant).",
      "Click Build tracked URL to get the correctly encoded link.",
      "Use the tagged link only for ads, emails, social posts and partner placements — never internal links.",
    ],
    fields: [
      { name: "url", label: "Destination URL", type: "text", placeholder: "https://example.com/offer" },
      { name: "source", label: "Campaign source (utm_source)", type: "text", placeholder: "google, newsletter, instagram" },
      { name: "medium", label: "Campaign medium (utm_medium)", type: "text", placeholder: "cpc, email, social" },
      { name: "campaign", label: "Campaign name (utm_campaign)", type: "text", placeholder: "diwali-sale" },
      { name: "term", label: "Campaign term (utm_term)", type: "text", placeholder: "leather wallets", optional: true },
      { name: "content", label: "Campaign content (utm_content)", type: "text", placeholder: "banner-a", optional: true },
    ],
    generate: buildUtmUrl,
    submitLabel: "Build tracked URL",
    about: [
      "UTM parameters are small tags appended to a URL that tell Google Analytics (and virtually every other analytics tool) exactly where a visitor came from: utm_source names the site or platform, utm_medium the channel type, and utm_campaign the specific push. Without them, a sale's traffic gets lumped into 'direct' or a vague referral — leaving you unable to say whether the Instagram post, the newsletter or the Google ad actually earned it, and budget decisions become guesswork.",
      "This builder assembles the tracked URL correctly every time. It validates that the destination is a real http(s) URL, requires the three core parameters, URL-encodes values so spaces and special characters don't break the link, and appends with ? or & depending on whether the URL already carries a query string — the detail that manual tagging most often gets wrong. The optional utm_term (paid search keyword) and utm_content (which ad or button variant) fields let you split-test creatives within one campaign.",
      "Consistency is what makes UTM data usable. Decide on lowercase naming and stick to it — analytics treats 'Email' and 'email' as different mediums, splitting your reports in two. Use a small fixed vocabulary for mediums (email, cpc, social, referral), name campaigns descriptively (diwali-sale-2026 beats campaign7), and keep a shared spreadsheet of the links you've issued. One more habit: never UTM-tag internal links on your own site — clicking one restarts the visitor's session and erases their true origin. Tag only links that live outside your site: ads, emails, social posts and partner placements.",
    ],
    faq: [
      {
        question: "What's the actual difference between utm_source and utm_medium?",
        answer:
          "Think of 'source' as the specific place the link lives (like google, facebook, or your weekly-newsletter), and 'medium' as the broader type of channel (like cpc, social, or email). For instance, a Facebook ad is source=facebook, medium=cpc.",
      },
      {
        question: "Will adding UTM parameters hurt my website's SEO?",
        answer:
          "Not when used correctly on external campaign links. However, it's a good idea to set a canonical URL on your landing pages so search engines know the original URL and don't mistakenly index the tagged variations as duplicate content.",
      },
      {
        question: "Where can I see all this UTM data once I start using it?",
        answer:
          "In Google Analytics 4, head over to Reports → Acquisition → Traffic acquisition. You can view the data using the 'session source/medium' and 'campaign' dimensions. Almost all major CRMs and ad platforms also automatically read and report on these parameters.",
      },
      {
        question: "Does it matter if I use uppercase or lowercase letters for UTM values?",
        answer:
          "Yes, it absolutely matters! Analytics tools are strictly case-sensitive. This means 'Email' and 'email' will show up as completely separate marketing mediums in your reports. The best practice is to choose lowercase-with-hyphens as your standard convention and never deviate.",
      },
      {
        question: "Should I use UTM links for the navigation links on my own website?",
        answer:
          "No, never. If you tag internal links on your own site, whenever a visitor clicks one, it will instantly restart their analytics session and completely erase the original source they actually came from. Only use UTM tags for external links pointing *to* your site.",
      },
    ],
    related: ["qr-code-generator", "slug-generator", "roas-calculator", "url-encoder-decoder"],
  },
  {
    kind: "generator",
    slug: "slug-generator",
    category: "marketing-seo",
    name: "URL Slug Generator",
    tagline: "Turn titles into clean, lowercase, SEO-friendly URL slugs — one per line.",
    seoDescription:
      "Free URL slug generator. Convert page titles into clean lowercase slugs with hyphens or underscores — paste multiple titles and get one slug per line.",
    seoTitle: "Free URL Slug Generator: SEO-Friendly Slugs in Bulk",
    keywords: [
      "URL slug generator",
      "slug generator",
      "SEO-friendly URL",
      "URL slug maker",
      "title to slug converter",
      "bulk slug generator",
      "permalink generator",
      "slugify text online",
    ],
    directAnswer:
      "A URL slug generator that converts page titles into clean, lowercase, SEO-friendly slugs — collapsing spaces, punctuation and special characters into hyphens or underscores, one slug per line for bulk conversion.",
    example:
      "Example: Enter '10 Diwali Marketing Ideas for Small Businesses!' and it instantly converts into '10-diwali-marketing-ideas-for-small-businesses'.",
    steps: [
      "Paste your page titles, one per line, into the text area.",
      "Choose the separator: hyphen (recommended for SEO) or underscore.",
      "Click Generate slugs to get one clean lowercase slug per line.",
      "Copy the output and use each slug as the URL for the matching page.",
      "Finalize slugs before publishing — changing a published slug needs a 301 redirect.",
    ],
    fields: [
      {
        name: "text",
        label: "Titles (one per line)",
        type: "textarea",
        rows: 5,
        placeholder: "10 Diwali Marketing Ideas for Small Businesses\nHow to File GST Returns Online",
      },
      {
        name: "separator",
        label: "Separator",
        type: "select",
        defaultValue: "hyphen",
        options: [
          { value: "hyphen", label: "Hyphen (recommended for SEO)" },
          { value: "underscore", label: "Underscore" },
        ],
      },
    ],
    generate: generateSlugs,
    submitLabel: "Generate slugs",
    about: [
      "The slug is the last part of a URL — the /10-diwali-marketing-ideas in your blog post's address. A clean slug helps three audiences at once: search engines get keyword context, humans see a readable link they're more willing to click in search results and chat messages, and you get URLs that survive being read aloud, printed or typed. Compare /10-diwali-marketing-ideas with /index.php?p=4823 — same page, very different first impression.",
      "This generator applies the rules good CMSs use: everything lowercased (URLs are case-sensitive on most servers, and mixed case creates accidental duplicates), every run of spaces, punctuation and special characters collapsed into a single separator, and leading or trailing separators trimmed away. Paste one title or fifty — each line becomes one slug, so you can batch-convert an entire editorial calendar or product catalogue in one go. Choose hyphens unless a system forces underscores on you: Google has stated plainly that it treats hyphens as word separators, while underscores can cause words to be read as one token.",
      "Two habits keep slugs working for years. First, keep them short and meaningful — trim filler words so the keywords carry the weight; /gst-return-filing-guide beats /a-complete-and-detailed-guide-to-filing-your-gst-returns. Second, treat a published slug as permanent: changing it breaks every existing link, share and bookmark unless you set up a 301 redirect from the old address. If you must rename, redirect. Generate the slug before you publish, not after.",
    ],
    faq: [
      {
        question: "Should I use hyphens or underscores to separate words?",
        answer:
          "You should definitely use hyphens. Google and other search engines treat hyphens as natural word separators, so 'diwali-marketing-ideas' is cleanly understood as three distinct words. Underscores can sometimes cause words to get mashed into a single unreadable token.",
      },
      {
        question: "How long is too long for a URL slug?",
        answer:
          "A sweet spot is around three to six meaningful words. It's often best practice to drop short filler words (like 'a', 'the', 'and', 'for') and focus solely on the core keywords that someone would actually type into a search engine.",
      },
      {
        question: "What happens if my title includes Hindi characters or special symbols?",
        answer:
          "This tool will automatically strip out everything that isn't a standard a–z letter or 0–9 number, replacing any runs of other characters with your chosen separator. For non-Latin titles, it's best to write a short, descriptive English slug instead.",
      },
      {
        question: "Can I just change a slug whenever I want after publishing?",
        answer:
          "It's highly discouraged unless you also set up a 301 redirect from the old URL to the new one. If you just change it, every existing link, bookmark, and social share will break, and you'll lose all the SEO authority that page has built up.",
      },
      {
        question: "Why does the tool convert everything to lowercase?",
        answer:
          "Because URLs are case-sensitive on many web servers! If you have mixed cases, someone linking to your page with all lowercase could create an accidental 404 error or a duplicate content issue. All-lowercase keeps everything uniform and foolproof.",
      },
    ],
    related: ["meta-tag-generator", "serp-snippet-preview", "utm-builder", "case-converter"],
  },
  {
    kind: "calculator",
    slug: "keyword-density-checker",
    category: "marketing-seo",
    name: "Keyword Density Checker",
    tagline: "Count how often a keyword appears in your content and check the density percentage.",
    seoDescription:
      "Free keyword density checker. Paste your content and a keyword to get total words, whole-word occurrences, density percentage and a stuffing verdict.",
    seoTitle: "Free Keyword Density Checker: Keyword Count & Percentage",
    keywords: [
      "keyword density checker",
      "keyword density",
      "keyword density calculator",
      "keyword counter",
      "keyword frequency checker",
      "keyword stuffing checker",
      "ideal keyword density for SEO",
      "how to calculate keyword density",
    ],
    directAnswer:
      "A keyword density checker that counts whole-word, case-insensitive occurrences of a keyword in your content and reports the density percentage — under 0.5% low, 0.5–2.5% natural, above 2.5% a stuffing risk.",
    formula:
      "Density % = (occurrences × words in phrase) ÷ total words × 100. Verdict: below 0.5% low, 0.5–2.5% good, above 2.5% stuffing territory.",
    example:
      "Example: a 500-word article containing a 2-word keyword 5 times → density (5 × 2) ÷ 500 × 100 = 2% — just inside the natural range.",
    steps: [
      "Paste your text (article, page copy, or product description) into the Content field.",
      "Enter the specific keyword or keyphrase you want to analyze.",
      "The tool instantly calculates total words, keyword occurrences, and your density percentage.",
      "Check the verdict to see if your density is too low, natural, or risking keyword stuffing.",
    ],
    fields: [
      {
        name: "content",
        label: "Content",
        type: "textarea",
        rows: 10,
        placeholder: "Paste your article, page copy or product description here…",
      },
      { name: "keyword", label: "Keyword or phrase", type: "text", placeholder: "gst return filing" },
    ],
    compute: computeKeywordDensity,
    autoCompute: true,
    about: [
      "Keyword density is the share of your content occupied by a target keyword — occurrences multiplied by the words in the phrase, divided by total words. It stopped being a ranking lever years ago (modern search engines read topics and synonyms, not raw counts), but it remains a useful sanity check in both directions: a density near zero suggests the page never clearly commits to its topic, while a high one reads as spam to humans and can trip over-optimization filters.",
      "This checker counts whole-word, case-insensitive matches — searching for 'car' won't inflate the count with 'carpet' or 'scared' — and handles multi-word phrases with any spacing between the words. You get the total word count, the number of occurrences, the density to two decimals, and a plain verdict: under 0.5% reads as low, 0.5–2.5% is the comfortable range most SEO practitioners aim for, and beyond 2.5% you're flirting with keyword stuffing. Everything recalculates live as you edit, so you can tune a draft in place.",
      "Use the number as a smoke alarm, not a target. If density is low, the fix is rarely to sprinkle the exact phrase mechanically — it's to check that the keyword appears where it structurally matters: the title, the first paragraph, at least one heading, and the meta description. If density is high, replace repetitions with natural variants and pronouns; if a sentence sounds robotic when read aloud, a search engine's spam classifier tends to agree. Write for the reader first, then verify the numbers here.",
    ],
    faq: [
      {
        question: "What exactly is considered a 'good' keyword density?",
        answer:
          "Generally, aiming for roughly 0.5% to 2.5% for your primary keyword is considered safe and natural. There's no magical number that guarantees higher rankings — this range simply indicates that your content stays on topic without sounding robotic or spammy.",
      },
      {
        question: "Does keyword density actually boost my Google rankings?",
        answer:
          "Not directly as a positive ranking factor anymore. Google is smart enough to understand topics, synonyms, and context. However, checking your density is still crucial as a defensive measure to ensure you don't trigger over-optimization penalties for 'keyword stuffing'.",
      },
      {
        question: "How does the tool count multi-word phrases?",
        answer:
          "The tool looks for the exact phrase in order (ignoring case and extra spaces) as whole words. When it calculates density, it counts every word in that phrase. For example, if a 2-word phrase appears 5 times in a 500-word article, the density is calculated as (5 occurrences * 2 words) / 500 total words, which equals 2%.",
      },
      {
        question: "Should I check variations of my keyword separately?",
        answer:
          "Yes, absolutely. You should check singular forms, plural forms, and close synonyms individually. Modern SEO is all about naturally covering the broader vocabulary of a topic rather than awkwardly repeating one exact phrase over and over.",
      },
      {
        question: "What should I do if my density is too high?",
        answer:
          "If your density is over 2.5%, read your content aloud. If it sounds repetitive, replace some instances of your exact keyword with pronouns (it, they) or natural synonyms. Write for human readers first, and the search engines will follow.",
      },
    ],
    related: ["word-counter", "serp-snippet-preview", "headline-analyzer", "ai-seo-title-generator"],
  },
  {
    kind: "calculator",
    slug: "headline-analyzer",
    category: "marketing-seo",
    name: "Headline Analyzer",
    tagline: "Score your headline on length, word balance, numbers and power words.",
    seoDescription:
      "Free headline analyzer. Score any headline out of 100 on length, word count, numbers, power words and sentiment — with instant feedback as you type.",
    seoTitle: "Free Headline Analyzer: Score Your Headline Out of 100",
    keywords: [
      "headline analyzer",
      "headline analyser",
      "headline checker",
      "blog title analyzer",
      "headline score",
      "power words headline",
      "title analyzer for SEO",
      "how to write a good headline",
    ],
    directAnswer:
      "A headline analyzer that scores any headline out of 100 on the traits strong headlines share — length (40–70 characters best), word count, the presence of a number, power words and positive sentiment.",
    example:
      "Example: \"7 Proven Ways to Grow Your Business on a Small Budget\" — a 9-word, ~54-character headline with a leading digit and the power word \"proven\", scoring in the strong band.",
    steps: [
      "Type or paste your headline into the text field.",
      "The tool instantly scores your headline out of 100 as you type.",
      "Review the feedback on length, word count, numbers, and power words.",
      "Tweak your headline to improve the score and increase its click-through potential.",
    ],
    fields: [
      { name: "headline", label: "Headline", type: "text", placeholder: "7 Proven Ways to Grow Your Business on a Small Budget" },
    ],
    compute: analyzeHeadline,
    autoCompute: true,
    about: [
      "This analyzer scores a headline against the measurable traits shared by strong headlines: length, word count, the presence of a number, power words that signal concrete value, and positive sentiment. It matters because most people read only the headline — on search results, social feeds and blog listings, the headline alone decides whether the click happens at all.",
      "The score out of 100 is weighted by impact. Length in the 40–70 character band earns the most points, because headlines in that range display fully in search results and email clients while carrying enough substance to persuade; 50–60 characters is the sweet spot. Six to twelve words earns the next tranche — enough to make a specific promise, short enough to scan. A number adds points because digits stop the scrolling eye and promise structured, finishable content ('7 ways…'). Power words like proven, essential, simple or free add persuasive weight, and opening with a digit or asking a question earns the final bonus.",
      "Treat the score as a drafting aid, not a verdict. Write five to ten variants, score them all, and shortlist the top two or three — then pick the one that best matches what the content actually delivers, because a brilliant headline over a disappointing article trains readers to ignore you. The traits measured here are correlations from large studies of high-performing headlines, and your audience is the final judge: when the stakes are high, A/B test the top candidates in the channel where they'll run.",
    ],
    faq: [
      {
        question: "What is the perfect length for a headline?",
        answer:
          "Aim for around 50–60 characters. Google typically truncates titles near the 60-character mark in search results. A length of 6–12 words provides enough room to make a compelling promise while remaining easy to scan. The analyzer rewards headlines falling in the 40–70 character band.",
      },
      {
        question: "What exactly are 'power words'?",
        answer:
          "Power words are highly persuasive terms like 'proven', 'essential', 'ultimate', 'simple', 'free', 'boost', or 'secret'. They make the value of your content feel concrete and actionable. Using one or two is great, but don't overdo it or your headline will sound like cheap clickbait.",
      },
      {
        question: "Do numbers really make that much of a difference?",
        answer:
          "Consistently, yes! Listicle-style numerals instantly stand out in a crowded feed of text and set clear expectations about the format of the content. Always use digits (like '7 ways') rather than spelled-out words ('seven ways') for maximum impact.",
      },
      {
        question: "If I get a 100/100 score, will my headline go viral?",
        answer:
          "Not necessarily. The score measures structural traits shared by historically strong headlines, but it can't predict your specific audience's taste or intent. Use the score to compare different drafts, and then A/B test your best options when possible.",
      },
      {
        question: "Should I always aim for positive sentiment?",
        answer:
          "While positive sentiment generally performs well, negative sentiment (like 'mistakes to avoid') can also be highly effective for certain topics. The key is to evoke an emotional response rather than remaining completely neutral.",
      },
    ],
    related: ["email-subject-line-tester", "serp-snippet-preview", "character-counter", "ai-blog-outline-generator"],
  },
  {
    kind: "generator",
    slug: "hashtag-generator",
    category: "marketing-seo",
    name: "Hashtag Generator",
    tagline: "Turn keywords into clean, deduplicated hashtags in your preferred style.",
    seoDescription:
      "Free hashtag generator. Convert keywords into clean hashtags in camelCase, lowercase or capitalized style — deduplicated and ready to copy into any post.",
    seoTitle: "Free Hashtag Generator for Instagram, LinkedIn & X",
    keywords: [
      "hashtag generator",
      "hashtag maker",
      "Instagram hashtag generator",
      "LinkedIn hashtags",
      "keywords to hashtags",
      "hashtag formatter",
      "camelCase hashtags",
      "how many hashtags to use",
    ],
    directAnswer:
      "A hashtag generator that converts a plain list of keywords into clean, valid, deduplicated hashtags in capitalized, camelCase or lowercase style, with a ready-to-paste single line for any platform.",
    example:
      "Example: Enter 'digital marketing, SEO tips' and it instantly converts into '#DigitalMarketing #SeoTips' ready to paste into your social post.",
    steps: [
      "Enter your keywords, separated by commas or new lines.",
      "Pick a style: capitalized (#SmallBusiness), camelCase or lowercase.",
      "Click Generate hashtags to strip spaces and punctuation, deduplicate, and list the valid tags.",
      "Copy the space-separated output line to paste under your post.",
      "Mix a few broad tags with several niche ones and rotate sets between posts.",
    ],
    fields: [
      {
        name: "keywords",
        label: "Keywords (comma or newline separated)",
        type: "textarea",
        rows: 4,
        placeholder: "small business, digital marketing, made in india",
      },
      {
        name: "style",
        label: "Style",
        type: "select",
        defaultValue: "capitalized",
        options: [
          { value: "capitalized", label: "Capitalized (#SmallBusiness)" },
          { value: "camelCase", label: "camelCase (#smallBusiness)" },
          { value: "lowercase", label: "lowercase (#smallbusiness)" },
        ],
      },
    ],
    generate: generateHashtags,
    submitLabel: "Generate hashtags",
    about: [
      "Hashtags are how content gets discovered by people who don't follow you yet — they file your post under topics that Instagram, LinkedIn, X and YouTube let users browse and search. But hand-typing them invites small errors with real costs: a stray space breaks the tag at that point, punctuation ends it early, and duplicated tags waste the limited slots platforms allow. This generator takes a plain list of keywords, separated by commas or new lines, and returns clean, valid, deduplicated hashtags.",
      "Each keyword's spaces and punctuation are stripped and the words joined in the style you choose. Capitalized (#SmallBusiness) — often called PascalCase — is the recommended default: screen readers pronounce multi-word tags correctly when each word is capitalized, and human eyes parse them faster too. camelCase starts lowercase (#smallBusiness), and lowercase runs everything together (#smallbusiness), the minimalist look common on X. Whatever the style, hashtags are case-insensitive for search — #SmallBusiness and #smallbusiness reach the same feed — so the choice is purely about readability and accessibility.",
      "The output gives you each tag on its own line for review, plus a single space-separated line ready to paste under a post. On strategy: mix a few broad tags with several niche ones — #marketing puts you in a torrent of content that scrolls past in seconds, while #jaipurfoodblogger puts you in a small room full of exactly the right people. Rotate tag sets between posts rather than pasting one identical block everywhere, and keep them relevant: platforms increasingly downrank tag spam, and 5–10 well-chosen tags routinely outperform the maximum 30.",
    ],
    faq: [
      {
        question: "How many hashtags should I realistically use per post?",
        answer:
          "Fewer, better-targeted tags are winning these days. Aim for 3–5 tags on Instagram and LinkedIn, and just 1–2 on X (Twitter). Maxing out the 30-tag limit with loosely related words actually looks like spam to both human readers and the algorithms.",
      },
      {
        question: "Does capitalizing words in my hashtag change my reach?",
        answer:
          "Nope! Hashtag searches on social platforms are completely case-insensitive. #SmallBusiness and #smallbusiness will both show up in the exact same feed. However, capitalizing the first letter of each word (PascalCase) is highly recommended because it makes the tags easier to read and ensures screen readers for visually impaired users pronounce the words correctly.",
      },
      {
        question: "Why did some characters disappear from my generated hashtags?",
        answer:
          "Hashtags technically only allow letters and numbers. If you include a space, it ends the tag right there. If you use punctuation (like commas, ampersands, or apostrophes), it breaks the tag. This tool automatically strips those out to ensure your tags actually work ('small business & growth' cleanly becomes #SmallBusinessGrowth).",
      },
      {
        question: "Should I stick to broad hashtags or use super niche ones?",
        answer:
          "You want a healthy mix, but heavily weighted toward niche ones. Broad tags like #Marketing have a huge audience, but your post will disappear from the top of the feed in seconds. Niche tags like #DelhiStartups have a smaller audience, but your post can stay discoverable there for days or weeks.",
      },
      {
        question: "Is it bad to use the exact same hashtags on every post?",
        answer:
          "Yes, it can be. Social media algorithms may flag your account as spam if you mindlessly copy and paste the exact same block of 30 hashtags onto every single post. It's much better to rotate through different sets of tags that are highly relevant to the specific content of each post.",
      },
    ],
    related: ["ai-social-media-post-generator", "engagement-rate-calculator", "headline-analyzer", "slug-generator"],
  },
  {
    kind: "generator",
    slug: "serp-snippet-preview",
    category: "marketing-seo",
    name: "Google SERP Snippet Preview",
    tagline: "See how your title and description will look — and truncate — in Google results.",
    seoDescription:
      "Free SERP snippet preview. See how Google truncates your page title and meta description, with character counts and clear OK or too-long verdicts.",
    seoTitle: "Free SERP Snippet Preview: Google Title & Description Check",
    keywords: [
      "SERP snippet preview",
      "SERP preview tool",
      "Google snippet preview",
      "SERP simulator",
      "meta title length checker",
      "meta description length checker",
      "title tag preview",
      "Google search result preview",
    ],
    directAnswer:
      "A Google SERP snippet preview that shows exactly how your title and description will look — and truncate — in search results, with a breadcrumb-style URL and explicit OK or TOO LONG verdicts per field.",
    example:
      "Example: Enter a long 80-character title, and the tool will show exactly where Google will cut it off with an ellipsis (...), warning you that it's too long.",
    steps: [
      "Enter the page title, meta description and page URL.",
      "Click Preview snippet to see the result as the searcher will see it.",
      "Check the character report — titles are clipped around 60 characters, descriptions around 160.",
      "Rewrite the offending field to fit within the limit and re-preview.",
      "Put the distinctive keywords early in the title and the key benefit in the description.",
    ],
    fields: [
      { name: "title", label: "Page title", type: "text", placeholder: "GST Return Filing Guide for Small Businesses (2026)" },
      {
        name: "description",
        label: "Meta description",
        type: "textarea",
        rows: 3,
        placeholder: "Step-by-step guide to filing GSTR-1 and GSTR-3B online — due dates, late fees and common mistakes to avoid.",
      },
      { name: "url", label: "Page URL", type: "text", placeholder: "https://example.com/blog/gst-return-filing" },
    ],
    generate: generateSerpSnippet,
    submitLabel: "Preview snippet",
    about: [
      "Google gives search listings hard limits: titles are cut around 60 characters (technically a pixel width, but 60 characters is the reliable working rule) and descriptions around 160. Your search listing is otherwise an ad you don't pay for — three lines that decide whether the searcher clicks your result or the one below it. Write past the limit and your carefully crafted copy ends mid-sentence with an ellipsis, often cutting off exactly the part that was meant to earn the click.",
      "This preview shows the truncation before Google does. Enter the title, description and URL, and you get the snippet as the searcher will see it: the URL rendered breadcrumb-style (domain › path › parts, the way Google now displays addresses), the title clipped at 60 characters and the description at 160, each with an ellipsis where the cut lands. Below the preview, a character report gives each field an explicit verdict — 52/60 OK, or 178/160 TOO LONG — so you know precisely how much to trim.",
      "Writing to fit is a craft worth the ten minutes. Put the distinctive keywords early in the title, where they survive truncation and catch the scanning eye; leave boilerplate like your brand name for the end, where losing it costs little. Make the description a promise the page keeps — include the primary keyword (Google bolds matching terms, drawing the eye), state the concrete benefit, and end with a reason to act. Note that Google sometimes rewrites descriptions when it judges another passage more relevant to a query; a well-written description within limits is your best odds of being shown as intended.",
    ],
    faq: [
      {
        question: "Is the 60-character limit for titles a strict rule?",
        answer:
          "Google actually cuts off titles based on pixel width (roughly 600 pixels), which means wider letters take up more space than skinny ones. However, 60 characters is a highly dependable rule of thumb — stick to that, and your title will almost never get chopped off.",
      },
      {
        question: "Why is Google showing a totally different description for my page?",
        answer:
          "Google reserves the right to rewrite your description if it thinks a different piece of text from your page better answers a user's specific search query. However, writing a concise, keyword-rich description that fits within 160 characters maximizes the chance they'll use your hand-crafted copy verbatim.",
      },
      {
        question: "What exactly is a 'breadcrumb-style' URL?",
        answer:
          "Instead of showing a raw, messy web address (like example.com/category/post-name), Google often formats URLs cleanly with arrows (example.com › category › post-name). This tool previews your URL using that exact same modern, readable style.",
      },
      {
        question: "Do my title and description actually boost my SEO rankings?",
        answer:
          "The title tag is a direct, albeit modest, ranking factor. The meta description, on the other hand, doesn't directly influence your rank. BUT, both heavily influence your click-through rate (CTR), and getting more clicks from the same ranking position brings you more traffic immediately.",
      },
      {
        question: "Where should I put my most important keywords?",
        answer:
          "Always put your most crucial keywords at the very beginning of the title! This ensures they survive any unexpected truncation, and since human eyes scan from left to right, it's the fastest way to grab a searcher's attention.",
      },
    ],
    related: ["meta-tag-generator", "headline-analyzer", "keyword-density-checker", "ai-seo-title-generator"],
  },
  {
    kind: "generator",
    slug: "robots-txt-generator",
    category: "marketing-seo",
    name: "Robots.txt Generator",
    tagline: "Create a valid robots.txt — allow all, block all, or custom disallow rules.",
    seoDescription:
      "Free robots.txt generator. Create a valid robots.txt file — allow or block all crawlers, add custom disallow paths, crawl-delay and a sitemap URL.",
    seoTitle: "Free Robots.txt Generator: Allow, Block & Sitemap Rules",
    keywords: [
      "robots.txt generator",
      "robots txt generator",
      "create robots.txt",
      "robots.txt file",
      "disallow robots.txt",
      "robots.txt sitemap",
      "crawl-delay robots.txt",
      "robots.txt for WordPress",
      "how to block crawlers",
    ],
    directAnswer:
      "A robots.txt generator that produces a valid robots.txt for the three common situations — allow all crawlers, block all crawlers, or block specific paths — with an optional crawl-delay and sitemap URL.",
    example:
      "Example: Choose 'Custom', enter '/admin' and '/cart' to block them, and add your sitemap URL to generate a perfectly formatted, error-free robots.txt file.",
    steps: [
      "Choose the crawler policy: allow all, block all, or custom (block specific paths).",
      "In custom mode, enter the paths to block — one per line (e.g. /admin, /cart, /search).",
      "Optionally add a sitemap URL and a crawl-delay in seconds.",
      "Click Generate robots.txt to build the file.",
      "Upload it to the root of the domain so it's reachable at yourdomain.com/robots.txt.",
    ],
    fields: [
      {
        name: "mode",
        label: "Crawler policy",
        type: "select",
        defaultValue: "allow",
        options: [
          { value: "allow", label: "Allow all crawlers" },
          { value: "block", label: "Block all crawlers" },
          { value: "custom", label: "Custom — block specific paths" },
        ],
      },
      {
        name: "disallow",
        label: "Disallow paths (one per line, custom mode)",
        type: "textarea",
        rows: 4,
        placeholder: "/admin\n/cart\n/search",
        optional: true,
      },
      { name: "sitemap", label: "Sitemap URL", type: "text", placeholder: "https://example.com/sitemap.xml", optional: true },
      { name: "crawlDelay", label: "Crawl-delay (seconds)", type: "number", min: 1, optional: true },
    ],
    generate: generateRobotsTxt,
    submitLabel: "Generate robots.txt",
    about: [
      "robots.txt is a plain-text file at the root of your domain — example.com/robots.txt — that tells search engine crawlers which parts of the site they may fetch. It's the first thing Googlebot requests when it visits, and because a single misplaced character can deindex an entire site, it deserves to be generated carefully rather than hand-typed from memory. This generator produces a valid file for the three situations that cover almost every site.",
      "Allow all is the right choice for most public sites: it emits an empty Disallow directive, the standard way to say 'crawl everything'. Block all (Disallow: /) shuts crawlers out entirely — correct for staging servers, pre-launch sites and internal tools, and catastrophic if it ever ships to production, which is exactly the accident this generator helps you avoid by making the two modes explicit. Custom mode blocks only the paths you list, one per line — admin panels, cart and checkout pages, internal search results and other pages that waste crawl budget without deserving to rank. Paths are normalized to start with a slash. You can also add a Crawl-delay for aggressive bots and a Sitemap line pointing crawlers at your sitemap.xml — the one line every robots.txt should carry.",
      "One misconception is worth clearing up: robots.txt controls crawling, not privacy. A disallowed URL can still appear in Google's index if other sites link to it, and the file itself is public — listing /secret-admin-panel in it advertises the path to anyone curious. Use noindex tags to keep pages out of results, and real authentication to keep people out of pages.",
    ],
    faq: [
      {
        question: "Where exactly should I upload this robots.txt file?",
        answer:
          "It must live at the very root of your domain, so it can be accessed directly at https://yourdomain.com/robots.txt. If you place it in a subfolder, search engine crawlers will completely ignore it.",
      },
      {
        question: "If I 'Disallow' a page, will that remove it from Google search?",
        answer:
          "No, it won't! Disallow stops crawling, but not indexing. If another website links to your blocked page, Google can still index the URL (though it will show up without a description). If you want to hide a page from search results, you need to use a 'noindex' meta tag instead.",
      },
      {
        question: "What does the Crawl-delay setting actually do?",
        answer:
          "It politely asks bots to wait a certain number of seconds between each request, which can prevent aggressive crawlers from crashing small servers. Keep in mind that while Bing and Yandex respect this, Googlebot ignores it entirely (Google prefers you manage their crawl rate via Google Search Console).",
      },
      {
        question: "Is it really necessary to include my Sitemap URL?",
        answer:
          "Yes, it's highly recommended! Adding the Sitemap line is the universally accepted way to point every single search engine crawler directly to your sitemap, saving you from having to manually submit it to each search engine individually.",
      },
      {
        question: "Can I use robots.txt to hide sensitive pages like my admin panel?",
        answer:
          "Never use robots.txt for security. The file is completely public, which means anyone can read it to see exactly which 'secret' paths you're trying to hide! Always use actual password authentication to protect sensitive areas of your site.",
      },
    ],
    related: ["meta-tag-generator", "serp-snippet-preview", "slug-generator"],
  },
  {
    kind: "calculator",
    slug: "email-subject-line-tester",
    category: "marketing-seo",
    name: "Email Subject Line Tester",
    tagline: "Score a subject line on length, spam triggers, caps, personalization and emoji.",
    seoDescription:
      "Free email subject line tester. Score subject lines out of 100 on length, spam trigger words, all-caps, personalization and emoji use before you send.",
    seoTitle: "Free Email Subject Line Tester: Spam Words & Score",
    keywords: [
      "email subject line tester",
      "subject line tester",
      "email subject line checker",
      "subject line analyzer",
      "email spam word checker",
      "email subject line score",
      "best email subject line length",
      "subject line spam trigger words",
    ],
    directAnswer:
      "An email subject line tester that scores a subject line out of 100 on length (30–50 characters best), spam trigger words, all-caps, personalization and emoji use, recomputed live as you type.",
    example:
      "Example: \"Your Diwali order is ready — 3 things to check\" — a personalized, no-trigger-word line of moderate length scores in the strong band, with the personalization and digit bonus.",
    steps: [
      "Type or paste your email subject line into the text field.",
      "The tool instantly scores your subject line out of 100.",
      "Review the feedback on length, spam trigger words, and personalization.",
      "Adjust your phrasing to improve the score before hitting send.",
    ],
    fields: [
      { name: "subject", label: "Subject line", type: "text", placeholder: "Your Diwali order is ready — 3 things to check" },
    ],
    compute: testSubjectLine,
    autoCompute: true,
    about: [
      "The subject line does two jobs before your email earns a single read: it must get past spam filters, and it must win the open in a crowded inbox. This tester scores both dimensions at once, checking the measurable traits that correlate with strong open rates and flagging the ones that correlate with the junk folder — all recalculated live as you type, so you can iterate on drafts in seconds.",
      "The checks, and why they matter: length of 30–50 characters earns the largest share of the score, because that range displays fully on both desktop and mobile clients (phones often cut at 35–40, so front-load the hook). Three to nine words keeps the promise scannable. Spam trigger phrases — 'act now', 'buy now', 'click here', 'limited time', 'winner', 'guarantee', '100%' and their kin — are counted because filters and, worse, trained human reflexes treat them as noise. ALL-CAPS words read as shouting and are a classic filter signal. Personalization — a simple 'you' or 'your' — reliably lifts opens by making the line about the reader rather than the sender. And emoji are counted with a light touch: one can add warmth and stand out in a text-only inbox; a row of them looks like spam.",
      "The score compares drafts, not destinies — deliverability also rides on your sender reputation, list hygiene and email content. Use the tester to shortlist two or three strong candidates, then let an A/B test on a slice of your real list pick the winner. Over a year of campaigns, that habit compounds into meaningfully more reach from the same list.",
    ],
    faq: [
      {
        question: "What is the absolute best length for an email subject line?",
        answer:
          "You should aim for 30–50 characters. Because mobile phones usually chop off subject lines around 35–40 characters (and desktops around 60), staying in this sweet spot ensures your message doesn't get awkwardly cut off. Always put your most important words first!",
      },
      {
        question: "Will one 'spam trigger' word immediately send my email to junk?",
        answer:
          "Usually not on its own — modern spam filters look at a combination of things, including your overall sender reputation. However, these triggers stack up quickly. Using 'FREE', 'Act now', and 'limited time' all at once is a huge red flag for both automated filters and human readers.",
      },
      {
        question: "Should I use emojis in my subject lines, or do they look unprofessional?",
        answer:
          "One carefully chosen emoji can actually boost your visibility and add a nice touch of warmth to a crowded, text-heavy inbox! However, using multiple emojis in a row, or using them to replace actual words, looks spammy and can trigger complaints. Moderation is key.",
      },
      {
        question: "Why does the tool give me extra points for personalization?",
        answer:
          "Simply including the words 'you' or 'your' instantly shifts the focus from you (the sender) to the reader. Extensive studies show that reader-focused phrasing consistently outperforms generic phrasing. It's the easiest, cheapest personalization trick in the book!",
      },
      {
        question: "If I get a perfect score, does that mean my open rate will skyrocket?",
        answer:
          "A high score means your subject line is structurally sound and avoids common pitfalls, but it's not a magical guarantee. Your open rate still depends heavily on your audience's relationship with you, list hygiene, and the actual offer. Use this tool to refine your best ideas before testing them.",
      },
    ],
    related: ["headline-analyzer", "ai-cold-email-writer", "character-counter", "payment-reminder-generator"],
  },
  {
    kind: "calculator",
    slug: "roas-calculator",
    category: "marketing-seo",
    name: "ROAS Calculator",
    tagline: "Calculate return on ad spend — the revenue every rupee of advertising brings back.",
    seoDescription:
      "Free ROAS calculator. Enter ad spend and revenue to get your return on ad spend as a ratio and percentage, plus net revenue and a benchmark verdict.",
    seoTitle: "Free ROAS Calculator: Return on Ad Spend in ₹",
    keywords: [
      "ROAS calculator",
      "return on ad spend calculator",
      "ROAS formula",
      "how to calculate ROAS",
      "good ROAS",
      "break-even ROAS",
      "ad spend calculator",
      "ROAS vs ROI",
    ],
    directAnswer:
      "A ROAS (return on ad spend) calculator that divides revenue attributable to advertising by ad spend, reporting the ratio, the equivalent percentage, the net revenue after the ad bill and a benchmark verdict.",
    formula:
      "ROAS = revenue ÷ ad spend (as a ratio and × 100 as a percentage). Net revenue after ad spend = revenue − spend. Verdict compares the ratio against the 3x common-health benchmark.",
    example:
      "Example: ₹50,000 ad spend producing ₹2,25,000 revenue → ROAS 4.5x (450%), net revenue after the ad bill ₹1,75,000.",
    fields: [
      { name: "spend", label: "Ad spend", type: "number", unit: "₹", min: 0, placeholder: "50000" },
      { name: "revenue", label: "Revenue from ads", type: "number", unit: "₹", min: 0, placeholder: "225000" },
    ],
    compute: computeRoas,
    autoCompute: true,
    about: [
      "ROAS — return on ad spend — is the first number to check on any paid campaign: revenue attributable to the ads divided by what the ads cost. A ROAS of 4.5x means every rupee spent on advertising brought back ₹4.50 in revenue. Enter your spend and revenue and this calculator returns the ratio, the equivalent percentage, and the net revenue left after the ad bill, with a verdict against common benchmarks.",
      "Reading the number takes one crucial caveat: ROAS measures revenue, not profit. Your true break-even ROAS depends on your margins — a business with 50% gross margin breaks even at 2x (half of every revenue rupee is product cost), while a 25%-margin business needs 4x just to stand still. That's why a 3x campaign can be excellent for a software product and a loss-maker for low-margin electronics. Compute your own threshold as 1 divided by gross margin, and judge campaigns against that rather than against generic benchmarks. Below 1x is unambiguous in any business: the ads return less than they cost.",
      "Two habits make ROAS numbers honest. Measure at the campaign level, not just the account level — a strong average often hides one stellar campaign subsidising several losers, and reallocating budget between them is the fastest optimization available. And be consistent about attribution: platforms tend to claim generous credit for conversions, so comparing platform-reported ROAS against revenue in your own analytics keeps the number grounded. Track ROAS weekly alongside CPM and CPC (the cost-side metrics in the CPM calculator next door) and you have the core dashboard of paid marketing.",
    ],
    faq: [
      {
        question: "What is a good ROAS?",
        answer:
          "It depends on gross margin. Break-even ROAS = 1 ÷ margin: a 50%-margin business breaks even at 2x, a 25%-margin one at 4x. As a broad benchmark, 3x is commonly treated as the floor for a healthy e-commerce campaign, and 4x+ as good.",
      },
      {
        question: "How is ROAS different from ROI?",
        answer:
          "ROAS divides revenue by ad spend and ignores all other costs; ROI divides profit by total investment. A campaign can show a shiny 5x ROAS and still lose money once product costs, shipping and fees are counted — check both.",
      },
      {
        question: "Is a ROAS below 1x always bad?",
        answer:
          "As an immediate result, yes — you spent more than you earned. It can still be rational when customers repeat-purchase: if lifetime value far exceeds first-order value, a sub-1x first-purchase ROAS may be a sound acquisition investment.",
      },
      {
        question: "Should I use platform-reported revenue?",
        answer:
          "Cross-check it. Ad platforms attribute conversions generously (view-through, long windows, overlapping claims across platforms). Comparing platform ROAS with revenue in your own analytics or order system keeps decisions honest.",
      },
    ],
    related: ["cpm-calculator", "roi-calculator", "engagement-rate-calculator", "margin-calculator"],
  },
  {
    kind: "calculator",
    slug: "cpm-calculator",
    category: "marketing-seo",
    name: "CPM / CPC Calculator",
    tagline: "Calculate CPM, CPC and CTR from campaign cost, impressions and clicks.",
    seoDescription:
      "Free CPM calculator and CPC calculator. Enter campaign cost with impressions or clicks to get cost per thousand impressions, cost per click and CTR.",
    seoTitle: "Free CPM Calculator: CPM, CPC & CTR from Ad Cost",
    keywords: [
      "CPM calculator",
      "CPC calculator",
      "CTR calculator",
      "cost per thousand impressions",
      "cost per click calculator",
      "CPM formula",
      "ad cost calculator",
      "how to calculate CPM",
    ],
    directAnswer:
      "A CPM/CPC calculator that turns campaign cost and impressions or clicks into cost per thousand impressions, cost per click and click-through rate — whichever metrics your inputs support.",
    formula:
      "CPM = cost ÷ impressions × 1000. CPC = cost ÷ clicks. CTR % = clicks ÷ impressions × 100. Linking identity: CPC = CPM ÷ (10 × CTR).",
    example:
      "Example: ₹20,000 for 4,00,000 impressions and 3,200 clicks → CPM ₹50, CPC ₹6.25, CTR 0.80%.",
    steps: [
      "Enter your total campaign cost.",
      "Enter the total impressions or total clicks your campaign received.",
      "The tool automatically calculates your CPM (cost per 1,000 impressions) and CPC (cost per click).",
      "If you provide both impressions and clicks, it also calculates your CTR (click-through rate).",
    ],
    fields: [
      { name: "cost", label: "Campaign cost", type: "number", unit: "₹", min: 0, placeholder: "20000" },
      { name: "impressions", label: "Impressions", type: "number", min: 0, placeholder: "400000", optional: true },
      { name: "clicks", label: "Clicks", type: "number", min: 0, placeholder: "3200", optional: true },
    ],
    compute: computeCpm,
    autoCompute: true,
    about: [
      "CPM is the cost per thousand impressions (the M is Latin mille) — what you pay for visibility. CPC is the cost per click — what you pay for a visit. CTR, click-through rate, is the bridge between them: the percentage of people who saw the ad and clicked. Enter your campaign cost plus impressions, clicks or both, and this calculator returns whichever metrics your inputs support — CPM from impressions, CPC from clicks, and CTR when you supply both.",
      "Each number answers a different question. CPM tells you whether you're buying attention at a fair price — it varies enormously by platform, audience and season (festival-season auctions in India can double it), so compare your CPM against your own history on the same platform rather than a universal benchmark. CPC tells you what a visitor costs, the number to set against conversion rate and order value when judging viability. CTR tells you whether the creative resonates: a low CTR with a normal CPM means people saw the ad and scrolled past — a message problem, not a bidding problem.",
      "The three interlock — CPC = CPM ÷ (10 × CTR) — which makes diagnosis mechanical. Expensive clicks trace back to either expensive impressions (high CPM: consider broader audiences or different placements) or an unpersuasive ad (low CTR: rework the hook, creative or offer). Run last month's numbers and this month's side by side and you can tell in seconds whether a cost change came from the auction or from your creative — before deciding where to spend the next rupee.",
    ],
    faq: [
      {
        question: "What exactly do CPM, CPC, and CTR stand for?",
        answer:
          "CPM stands for 'Cost Per Mille' (which means cost per thousand impressions). CPC is 'Cost Per Click', and CTR is 'Click-Through Rate' (clicks divided by impressions). Together, they show you what attention costs, what actual website visits cost, and how effective your ad is at getting people to click.",
      },
      {
        question: "What is considered a 'good' Click-Through Rate (CTR)?",
        answer:
          "It varies wildly by industry, but typically 1–2% is standard for social media feed ads, while 3–5% is expected for branded search ads. However, the best benchmark is always your own past performance — compare your new creative against your old creative on the same audience.",
      },
      {
        question: "Why did my CPM suddenly become so expensive?",
        answer:
          "CPM is essentially an auction price. It shoots up when there's heavy competition for your target audience (like during Diwali, Black Friday, or elections), when your audience targeting is too narrow, or when 'ad fatigue' sets in and platforms charge you more to show the same tired ad to the same people.",
      },
      {
        question: "Do I need to know my impressions to calculate CPC?",
        answer:
          "No! To calculate CPC, you only need your total cost and total clicks. Our tool is flexible: enter impressions to get CPM, enter clicks to get CPC, or enter both to unlock your CTR as well.",
      },
      {
        question: "How can I lower my CPC if it's too high?",
        answer:
          "High CPC comes from either a high CPM (expensive ads) or a low CTR (nobody clicking). You can lower it by either broadening your audience targeting to get cheaper impressions, or by improving your ad creative (better hook, stronger offer) to get more people to click.",
      },
    ],
    related: ["roas-calculator", "engagement-rate-calculator", "roi-calculator", "utm-builder"],
  },
  {
    kind: "calculator",
    slug: "engagement-rate-calculator",
    category: "marketing-seo",
    name: "Engagement Rate Calculator",
    tagline: "Work out your engagement rate per post and see how it benchmarks.",
    seoDescription:
      "Free engagement rate calculator. Enter engagements, followers and post count to get your per-post engagement rate with an instant benchmark verdict.",
    seoTitle: "Free Engagement Rate Calculator for Instagram & Social Posts",
    keywords: [
      "engagement rate calculator",
      "Instagram engagement rate calculator",
      "engagement rate formula",
      "social media engagement rate",
      "engagement rate per post",
      "influencer engagement rate",
      "good engagement rate on Instagram",
      "how to calculate engagement rate",
    ],
    directAnswer:
      "An engagement rate calculator that measures how much of your audience actually reacts to your posts — total engagements per post divided by followers — with a benchmark verdict from low to excellent.",
    formula:
      "Engagement rate per post % = (total engagements ÷ post count) ÷ followers × 100. Verdict: under 1% low, 1–3% typical, 3–6% good, above 6% excellent.",
    example:
      "Example: 1,450 engagements, 12,000 followers, 1 post → engagement rate 12.08% per post — excellent, above the 6% top-tier threshold.",
    steps: [
      "Enter the total number of engagements (likes, comments, shares, saves) across your posts.",
      "Enter your total follower count.",
      "Specify the number of posts you're measuring (leave as 1 for a single post).",
      "The tool calculates your engagement rate percentage and provides an instant benchmark verdict.",
    ],
    fields: [
      { name: "engagements", label: "Total engagements (likes + comments + shares + saves)", type: "number", min: 0, placeholder: "1450" },
      { name: "followers", label: "Followers", type: "number", min: 1, placeholder: "12000" },
      { name: "posts", label: "Number of posts", type: "number", min: 1, defaultValue: 1 },
    ],
    compute: computeEngagementRate,
    autoCompute: true,
    about: [
      "Follower count is a vanity metric; engagement rate is the health metric. It measures how much of your audience actually reacts to what you post — likes, comments, shares and saves per post, divided by followers, expressed as a percentage. An account with 5,000 followers and 4% engagement has a more valuable audience than one with 50,000 followers and 0.4%: more real reach per post, more trust, and better results from any campaign or collaboration.",
      "This calculator uses the by-followers method, the industry standard for comparing accounts: add up the engagements across the posts you're measuring, enter your follower count and the number of posts, and you get the average engagement rate per post. Measuring a single post? Leave posts at 1. Measuring a month? Enter the month's totals and post count for a steadier read than any single post can give — individual posts swing wildly with the algorithm's mood.",
      "Benchmarks to read your number against: under 1% is low, 1–3% is the typical range for established accounts, 3–6% is genuinely good, and above 6% is excellent. Two caveats make the comparison fair. Engagement rate falls naturally as accounts grow — a 100k-follower account at 1.5% may be performing brilliantly for its size, while a 800-follower account should comfortably clear 5%. And platforms differ: Instagram and TikTok run structurally higher than X or Facebook, so benchmark within a platform, not across. The most useful comparison of all is you against you — track the rate monthly, note which content formats move it, and make more of what your audience demonstrably wants. Brands vetting influencer partners use exactly this arithmetic to spot bought followings: huge audience, tiny engagement.",
    ],
    faq: [
      {
        question: "What exactly counts as an 'engagement'?",
        answer:
          "An engagement is any deliberate interaction a user has with your content. The standard four are likes, comments, shares, and saves. Some marketers also include profile clicks or video completions — that's totally fine, as long as you're consistent about what you count each time you measure.",
      },
      {
        question: "What is considered a 'good' engagement rate?",
        answer:
          "For follower-based measurement, 1–3% is average, 3–6% is good, and anything above 6% is generally considered excellent. However, keep in mind that smaller accounts should aim higher, while mega-accounts (100k+ followers) will naturally sit closer to the 1–2% range.",
      },
      {
        question: "Is it better to calculate this per single post or per month?",
        answer:
          "Both methods are useful! Checking per-post helps you figure out exactly which types of content your audience loves most. Calculating a monthly average (using total engagements and total posts for the month) smooths out algorithmic hiccups and gives you a much better picture of your long-term health.",
      },
      {
        question: "Why is my engagement rate falling as my account grows?",
        answer:
          "Don't panic, this is structurally normal! Newer followers are typically less invested in you than your early core audience, and platforms naturally restrict the reach of larger accounts. Always judge your current rate against other accounts of a similar size, not against what you had when you were smaller.",
      },
      {
        question: "Why do brands care so much about this number?",
        answer:
          "Brands use engagement rate to quickly spot 'bought' or fake followings. If an influencer has a massive audience but a tiny engagement rate (like 0.2%), it means their followers are either bots or simply don't care about the content. Brands want to pay for real attention, not vanity metrics.",
      },
    ],
    related: ["hashtag-generator", "roas-calculator", "cpm-calculator", "ai-social-media-post-generator"],
  },
];
