import type { ToolConfig } from "../types";
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
      "A few conventions worth following: keep the title under 60 characters and the description under 160 so Google shows them without truncation (check both in the SERP snippet preview tool). Use an OG image of 1200 × 630 pixels — that's the size every major platform renders sharply. And set the canonical URL on every page you care about; it tells Google which address is the official one when the same content is reachable at several URLs, protecting you from duplicate-content dilution. Paste the output into the head section of your page, or hand it to whoever maintains your site template.",
    ],
    faq: [
      {
        question: "Where do I paste the generated tags?",
        answer:
          "Inside the <head> section of your HTML page, before the closing </head>. In WordPress and most CMSs, an SEO plugin or a 'custom header scripts' box accepts them; in frameworks like Next.js, translate them into the metadata config.",
      },
      {
        question: "What size should the OG image be?",
        answer:
          "1200 × 630 pixels is the safe standard — it renders sharply on WhatsApp, LinkedIn, X and Facebook. Keep important content away from the edges, and use an absolute https URL.",
      },
      {
        question: "Do meta keywords still matter?",
        answer:
          "No — Google has ignored the meta keywords tag since 2009, which is why this generator doesn't produce one. Spend the effort on the title and description, which directly affect click-through rate.",
      },
      {
        question: "What does the canonical tag do?",
        answer:
          "It names the official URL for a page's content. When the same content is reachable at multiple addresses (with tracking parameters, with and without www), the canonical tells search engines which one to index and credit.",
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
      "When a sale comes in, can you say which campaign earned it — the Instagram post, the newsletter, or the Google ad? Without UTM parameters, analytics lumps most of that traffic into 'direct' or a vague referral, and budget decisions become guesswork. UTM parameters are small tags appended to a URL that tell Google Analytics (and virtually every other analytics tool) exactly where a visitor came from: utm_source names the site or platform, utm_medium the channel type, and utm_campaign the specific push.",
      "This builder assembles the tracked URL correctly every time. It validates that the destination is a real http(s) URL, requires the three core parameters, URL-encodes values so spaces and special characters don't break the link, and appends with ? or & depending on whether the URL already carries a query string — the detail that manual tagging most often gets wrong. The optional utm_term (paid search keyword) and utm_content (which ad or button variant) fields let you split-test creatives within one campaign.",
      "Consistency is what makes UTM data usable. Decide on lowercase naming and stick to it — analytics treats 'Email' and 'email' as different mediums, splitting your reports in two. Use a small fixed vocabulary for mediums (email, cpc, social, referral), name campaigns descriptively (diwali-sale-2026 beats campaign7), and keep a shared spreadsheet of the links you've issued. One more habit: never UTM-tag internal links on your own site — clicking one restarts the visitor's session and erases their true origin. Tag only links that live outside your site: ads, emails, social posts and partner placements.",
    ],
    faq: [
      {
        question: "What's the difference between utm_source and utm_medium?",
        answer:
          "Source is where the link lives (google, facebook, newsletter); medium is the type of channel (cpc, social, email). A Google ad is source=google, medium=cpc; a newsletter link is source=newsletter, medium=email.",
      },
      {
        question: "Do UTM parameters affect SEO?",
        answer:
          "Not when used correctly — on external campaign links they're harmless. Just set a canonical URL on the landing page so the tagged variants aren't indexed as duplicates, and never tag internal links.",
      },
      {
        question: "Where do I see UTM data?",
        answer:
          "In Google Analytics 4 under Reports → Acquisition → Traffic acquisition, and in the session source/medium and campaign dimensions. Most CRMs and ad platforms read the same parameters.",
      },
      {
        question: "Should UTM values be lowercase?",
        answer:
          "Yes — analytics tools are case-sensitive, so 'Email' and 'email' report as separate mediums. Pick lowercase-with-hyphens as your convention and apply it everywhere.",
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
        question: "Hyphens or underscores?",
        answer:
          "Hyphens. Google treats hyphens as word separators, so diwali-marketing-ideas is understood as three words; underscores can cause the words to be read as a single token. Use underscores only when a legacy system requires them.",
      },
      {
        question: "How long should a slug be?",
        answer:
          "Three to six meaningful words is a good target. Drop articles and filler (a, the, and, your) and keep the words someone would actually search for.",
      },
      {
        question: "What happens to Hindi or special characters?",
        answer:
          "This generator strips everything outside a–z and 0–9, replacing runs of other characters with the separator. For non-Latin titles, write a short English slug that captures the topic instead.",
      },
      {
        question: "Can I change a slug after publishing?",
        answer:
          "Only with a 301 redirect from the old URL — otherwise every existing link and bookmark breaks and the page's accumulated ranking signals are lost. Best practice is to finalize the slug before publishing.",
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
        question: "What is a good keyword density?",
        answer:
          "Roughly 0.5–2.5% for a primary keyword. There's no magic number that improves ranking — the range simply marks where content usually reads naturally while staying clearly on topic.",
      },
      {
        question: "Does keyword density affect Google rankings directly?",
        answer:
          "Not as a positive factor — Google evaluates topical relevance far more subtly. But extreme repetition can trigger over-optimization spam signals, so the check protects the downside rather than boosting the upside.",
      },
      {
        question: "How are multi-word phrases counted?",
        answer:
          "The phrase must appear with its words in order (any whitespace between them), matched case-insensitively as whole words. Density then counts every word of each occurrence, so a 2-word phrase appearing 5 times in 500 words is 2%.",
      },
      {
        question: "Should I check variations separately?",
        answer:
          "Yes — run singular and plural forms and close synonyms as separate checks. Modern SEO rewards covering the topic's vocabulary, not repeating one exact string.",
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
    fields: [
      { name: "headline", label: "Headline", type: "text", placeholder: "7 Proven Ways to Grow Your Business on a Small Budget" },
    ],
    compute: analyzeHeadline,
    autoCompute: true,
    about: [
      "Most people read the headline and nothing else — on search results, social feeds and blog listings, the headline decides whether the click happens at all. The good news is that strong headlines share measurable traits, and this analyzer checks yours against the ones with the best evidence behind them: length, word count, the presence of a number, power words that signal concrete value, and positive sentiment.",
      "The score out of 100 is weighted by impact. Length in the 40–70 character band earns the most points, because headlines in that range display fully in search results and email clients while carrying enough substance to persuade; 50–60 characters is the sweet spot. Six to twelve words earns the next tranche — enough to make a specific promise, short enough to scan. A number adds points because digits stop the scrolling eye and promise structured, finishable content ('7 ways…'). Power words like proven, essential, simple or free add persuasive weight, and opening with a digit or asking a question earns the final bonus.",
      "Treat the score as a drafting aid, not a verdict. Write five to ten variants, score them all, and shortlist the top two or three — then pick the one that best matches what the content actually delivers, because a brilliant headline over a disappointing article trains readers to ignore you. The traits measured here are correlations from large studies of high-performing headlines, and your audience is the final judge: when the stakes are high, A/B test the top candidates in the channel where they'll run.",
    ],
    faq: [
      {
        question: "What is the ideal headline length?",
        answer:
          "Around 50–60 characters. Google truncates titles near 60 characters, and 6–12 words gives enough room for a specific promise while staying scannable. The analyzer awards its largest weight to the 40–70 band.",
      },
      {
        question: "What are power words?",
        answer:
          "Words with proven persuasive pull — proven, essential, ultimate, simple, free, boost, secret and similar. They make the value concrete. One or two per headline helps; stacking them reads as clickbait.",
      },
      {
        question: "Do numbers really improve headlines?",
        answer:
          "Consistently, yes — listicle-style numerals stand out in a feed of words and set clear expectations of scope. Digits ('7 ways') outperform spelled-out numbers ('seven ways').",
      },
      {
        question: "Is a 100/100 headline guaranteed to perform?",
        answer:
          "No — the score measures structural traits shared by strong headlines, not your audience's taste. Use it to compare drafts of the same headline, then A/B test the finalists where possible.",
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
        question: "How many hashtags should I use?",
        answer:
          "Fewer, better-targeted tags win: 3–5 on Instagram and LinkedIn, 1–2 on X. Maxing out the limit with loosely related tags reads as spam to both algorithms and humans.",
      },
      {
        question: "Does capitalization change a hashtag's reach?",
        answer:
          "No — hashtag search is case-insensitive, so #SmallBusiness and #smallbusiness are the same tag. Capitalizing each word is still recommended for readability and for screen-reader accessibility.",
      },
      {
        question: "Why did characters disappear from my hashtag?",
        answer:
          "Hashtags allow only letters and numbers — spaces end the tag and punctuation breaks it. The generator strips those characters so the tag stays valid; 'D2C & retail' becomes #D2CRetail.",
      },
      {
        question: "Broad or niche hashtags?",
        answer:
          "Both, weighted toward niche. Broad tags (#marketing) have huge volume but seconds of visibility; niche tags (#delhistartups) have smaller, better-matched audiences where your post stays discoverable for days.",
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
      "Your search listing is an ad you don't pay for — three lines that decide whether the searcher clicks your result or the one below it. Google gives those lines hard limits: titles are cut around 60 characters (technically a pixel width, but 60 characters is the reliable working rule) and descriptions around 160. Write past the limit and your carefully crafted copy ends mid-sentence with an ellipsis, often cutting off exactly the part that was meant to earn the click.",
      "This preview shows the truncation before Google does. Enter the title, description and URL, and you get the snippet as the searcher will see it: the URL rendered breadcrumb-style (domain › path › parts, the way Google now displays addresses), the title clipped at 60 characters and the description at 160, each with an ellipsis where the cut lands. Below the preview, a character report gives each field an explicit verdict — 52/60 OK, or 178/160 TOO LONG — so you know precisely how much to trim.",
      "Writing to fit is a craft worth the ten minutes. Put the distinctive keywords early in the title, where they survive truncation and catch the scanning eye; leave boilerplate like your brand name for the end, where losing it costs little. Make the description a promise the page keeps — include the primary keyword (Google bolds matching terms, drawing the eye), state the concrete benefit, and end with a reason to act. Note that Google sometimes rewrites descriptions when it judges another passage more relevant to a query; a well-written description within limits is your best odds of being shown as intended.",
    ],
    faq: [
      {
        question: "Is the 60-character title limit exact?",
        answer:
          "Google actually truncates by pixel width (around 600px), so wide letters shorten the budget slightly. Sixty characters is the dependable rule of thumb — under it, truncation is rare.",
      },
      {
        question: "Why does Google show a different description than mine?",
        answer:
          "Google rewrites descriptions when it judges a passage from the page more relevant to the specific query. A concise, keyword-relevant description within 160 characters maximizes the chance yours is used verbatim.",
      },
      {
        question: "What is the breadcrumb-style URL?",
        answer:
          "Google displays URLs as domain › section › page rather than a raw path — this preview renders yours the same way. Clean, readable slugs make this line more inviting.",
      },
      {
        question: "Do title and description affect rankings?",
        answer:
          "The title is a genuine (modest) ranking signal; the description is not — but both drive click-through rate, and a listing that wins more clicks at the same position earns more traffic immediately.",
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
        question: "Where do I put the robots.txt file?",
        answer:
          "At the root of the domain, so it's reachable at https://yourdomain.com/robots.txt. Crawlers only look there — a robots.txt in a subdirectory is ignored.",
      },
      {
        question: "Does Disallow remove a page from Google?",
        answer:
          "No — it stops crawling, not indexing. A blocked URL can still be indexed from external links (shown without a description). To remove a page from results, allow crawling and add a noindex meta tag instead.",
      },
      {
        question: "What does Crawl-delay do?",
        answer:
          "It asks bots to wait the given number of seconds between requests, easing load on small servers. Bing and Yandex honour it; Googlebot ignores it — Google's crawl rate is managed in Search Console.",
      },
      {
        question: "Should I list my sitemap in robots.txt?",
        answer:
          "Yes — the Sitemap line is the standard way to point every crawler at your sitemap.xml without registering with each search engine individually. This generator appends it for you.",
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
        question: "What is the ideal subject line length?",
        answer:
          "30–50 characters. Mobile clients truncate around 35–40 characters and desktop around 60, so the range keeps the line intact almost everywhere — and put the key words first regardless.",
      },
      {
        question: "Will one spam trigger word send me to junk?",
        answer:
          "Usually not by itself — modern filters weigh many signals including sender reputation. But triggers stack: 'FREE!!! Act now, limited time' combines three, and human readers have learned the same reflexes filters have.",
      },
      {
        question: "Do emoji help or hurt open rates?",
        answer:
          "One well-chosen emoji can lift visibility in a text-heavy inbox, particularly for consumer audiences. Multiple emoji, or emoji substituting for words, correlate with spam complaints — the tester rewards restraint.",
      },
      {
        question: "Why does personalization score points?",
        answer:
          "Lines containing 'you' or 'your' frame the message around the reader's interest, and consistently outperform sender-centric phrasing in open-rate studies. It's the cheapest personalization there is — no merge tags required.",
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
      "Free CPM and CPC calculator. Enter campaign cost with impressions or clicks to get cost per thousand impressions, cost per click and click-through rate.",
    fields: [
      { name: "cost", label: "Campaign cost", type: "number", unit: "₹", min: 0, placeholder: "20000" },
      { name: "impressions", label: "Impressions", type: "number", min: 0, placeholder: "400000", optional: true },
      { name: "clicks", label: "Clicks", type: "number", min: 0, placeholder: "3200", optional: true },
    ],
    compute: computeCpm,
    autoCompute: true,
    about: [
      "Three little acronyms describe the cost side of every ad campaign. CPM is the cost per thousand impressions (the M is Latin mille) — what you pay for visibility. CPC is the cost per click — what you pay for a visit. CTR, click-through rate, is the bridge between them: the percentage of people who saw the ad and clicked. Enter your campaign cost plus impressions, clicks or both, and this calculator returns whichever metrics your inputs support — CPM from impressions, CPC from clicks, and CTR when you supply both.",
      "Each number answers a different question. CPM tells you whether you're buying attention at a fair price — it varies enormously by platform, audience and season (festival-season auctions in India can double it), so compare your CPM against your own history on the same platform rather than a universal benchmark. CPC tells you what a visitor costs, the number to set against conversion rate and order value when judging viability. CTR tells you whether the creative resonates: a low CTR with a normal CPM means people saw the ad and scrolled past — a message problem, not a bidding problem.",
      "The three interlock — CPC = CPM ÷ (10 × CTR) — which makes diagnosis mechanical. Expensive clicks trace back to either expensive impressions (high CPM: consider broader audiences or different placements) or an unpersuasive ad (low CTR: rework the hook, creative or offer). Run last month's numbers and this month's side by side and you can tell in seconds whether a cost change came from the auction or from your creative — before deciding where to spend the next rupee.",
    ],
    faq: [
      {
        question: "What do CPM, CPC and CTR stand for?",
        answer:
          "CPM = cost per mille (thousand impressions), CPC = cost per click, CTR = click-through rate (clicks ÷ impressions × 100). Together they describe what attention costs, what visits cost, and how well the ad converts one into the other.",
      },
      {
        question: "What is a good CTR?",
        answer:
          "Roughly 1–2% for social feed ads and 3–5% for branded search ads, but ranges vary widely by industry and format. The more useful comparison is your own creative A vs creative B on the same audience.",
      },
      {
        question: "Why is my CPM suddenly higher?",
        answer:
          "CPM is an auction price — it rises with competition for your audience (festive seasons, elections, year-end sales), narrow targeting, and ad fatigue (platforms charge more to force tired creatives on people). Refreshing creative and broadening audiences usually helps.",
      },
      {
        question: "Can I calculate CPC without impressions?",
        answer:
          "Yes — CPC only needs cost and clicks. This calculator returns whichever metrics your inputs allow: impressions give CPM, clicks give CPC, and both together add CTR.",
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
        question: "What counts as an engagement?",
        answer:
          "Any deliberate interaction: likes, comments, shares and saves are the standard four. Some marketers add clicks or video completions — fine, as long as you count the same things every time you compare.",
      },
      {
        question: "What is a good engagement rate?",
        answer:
          "1–3% is average, 3–6% good, above 6% excellent for follower-based measurement. Expectations scale down as accounts grow — small accounts should sit well above these numbers, mega-accounts often below.",
      },
      {
        question: "Should I calculate per post or per month?",
        answer:
          "Both have uses. Per post shows which content works; a monthly average (total engagements and posts for the month) smooths out algorithmic luck and is the number to track over time.",
      },
      {
        question: "Why is my engagement rate falling as I grow?",
        answer:
          "It's structural: new followers are progressively less invested than your early core, and platforms show posts to a fraction of large audiences. Judge the trend against accounts your size, not against your own smaller past.",
      },
    ],
    related: ["hashtag-generator", "roas-calculator", "cpm-calculator", "ai-social-media-post-generator"],
  },
];
