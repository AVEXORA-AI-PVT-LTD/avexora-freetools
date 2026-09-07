import type { ToolConfig } from "../../types/tools";
import { JOB_EXPERIENCE_LEVELS, JOB_FIELD_LIMITS } from "../ai-constants";

export const tools: ToolConfig[] = [
  {
    kind: "ai-writer",
    slug: "ai-blog-outline-generator",
    category: "ai-writers",
    name: "AI Blog Outline Generator",
    tagline:
      "Turn a topic into a complete, SEO-ready blog post outline in seconds.",
    seoDescription:
      "Free AI blog outline generator. Enter your topic and audience and get a structured outline with headings, subheadings and key points — powered by AI, no sign-up.",
    fields: [
      {
        name: "topic",
        label: "Blog topic",
        type: "text",
        placeholder: "e.g. How small businesses can automate GST filing",
      },
      {
        name: "audience",
        label: "Target audience",
        type: "text",
        placeholder: "e.g. Indian small business owners",
        optional: true,
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        defaultValue: "professional",
        options: [
          { value: "professional", label: "Professional" },
          { value: "conversational", label: "Conversational" },
          { value: "authoritative", label: "Authoritative" },
        ],
      },
    ],
    submitLabel: "Generate outline",
    about: [
      "Staring at a blank page is the slowest part of writing. This generator gives you a working skeleton in seconds: enter your topic (and optionally who you're writing for), and the AI produces a structured outline with an H1, logical H2 sections, supporting H3 points, and suggestions for the introduction and conclusion.",
      "A good outline is the difference between a rambling post and one that ranks. Search engines reward content that covers a topic thoroughly and is organised under clear headings — exactly what an outline enforces. Readers benefit too: most people scan a post's headings before deciding whether to read it, so a logical heading structure keeps them on the page. Use the generated structure as-is or rearrange sections to fit your angle, then write section by section — filling in a skeleton is far faster than composing from nothing, and it keeps every section focused on answering one question.",
      "A practical workflow: generate the outline, delete any section you don't have something original to say about, add one section from your own experience that the AI couldn't know, and then draft. That combination — solid structure plus first-hand insight — is what separates content that ranks from content that reads like everyone else's.",
      "The tool is free and requires no account. For end-to-end content workflows — briefs, AI drafting, scheduling and performance tracking — the EBOS Marketing module includes a full AI writing assistant.",
    ],
    faq: [
      {
        question: "Is the generated outline unique?",
        answer:
          "Yes. Each outline is generated fresh by AI from your specific topic, audience and tone — it isn't pulled from a template library.",
      },
      {
        question: "Can I use the outline for commercial content?",
        answer:
          "Yes, the output is yours to use freely for blog posts, client work or any other content.",
      },
      {
        question: "What makes a good blog outline?",
        answer:
          "A clear H1 with the primary keyword, 4–8 H2 sections that each answer one reader question, H3 subpoints for detail, and a conclusion with a call to action. The generator follows this structure automatically.",
      },
    ],
    related: ["ai-blog-intro-generator", "ai-seo-title-generator", "ai-faq-generator", "word-counter"],
  },
  {
    kind: "ai-writer",
    slug: "ai-blog-intro-generator",
    category: "ai-writers",
    name: "AI Blog Intro Generator",
    tagline: "Get three hook-first opening paragraphs for any blog post title.",
    seoDescription:
      "Free AI blog intro generator. Enter your post title and audience to get three alternative opening paragraphs that hook readers — powered by AI, no sign-up.",
    fields: [
      { name: "title", label: "Blog post title", type: "text", placeholder: "e.g. 10 GST Mistakes Small Businesses Keep Making" },
      { name: "audience", label: "Target audience", type: "text", placeholder: "e.g. first-time business owners", optional: true },
      {
        name: "angle",
        label: "Opening angle",
        type: "select",
        defaultValue: "problem",
        options: [
          { value: "problem", label: "Relatable problem" },
          { value: "statistic", label: "Surprising fact or statistic" },
          { value: "story", label: "Short story / scenario" },
          { value: "question", label: "Provocative question" },
        ],
      },
    ],
    submitLabel: "Generate intros",
    about: [
      "Readers decide whether to stay within the first three sentences, which makes the introduction the highest-stakes paragraph you'll write — and, for most writers, the slowest. It's common to spend twenty minutes staring at a blank first line for a post whose body you could write in an hour. This generator removes that bottleneck: give it your title, your audience, and the kind of opening you want, and it returns three different ready-to-edit introductions.",
      "You get three because intros are a matter of fit, not correctness. One might open on the pain point, another on a vivid scenario, a third on a question — seeing them side by side makes it obvious which voice suits your post, and you'll often splice the best sentence from one into another. Each intro is built on the structure that keeps readers scrolling: a first line that earns attention, a middle that names the problem the reader recognises, and a final sentence that promises exactly what the post will deliver.",
      "Treat the output as a strong first draft. Swap in a detail only you know — a number from your business, a customer's actual words — and the intro stops sounding generated and starts sounding like you. Pair it with the blog outline generator to go from blank page to full draft skeleton in a couple of minutes.",
    ],
    faq: [
      {
        question: "Why does it generate three intros instead of one?",
        answer:
          "Because openings are about fit. Three different angles side by side make it easy to pick the one that matches your post's tone — or combine the best lines from each.",
      },
      {
        question: "What makes a good blog introduction?",
        answer:
          "A first sentence that earns attention, a clear statement of the problem the reader recognises, and a promise of what they'll get by reading on — all within about 100 words.",
      },
      {
        question: "Can I use the output as-is?",
        answer:
          "Yes, but it improves noticeably if you personalise one detail — a real number, a real example. That's usually a 30-second edit.",
      },
    ],
    related: ["ai-blog-outline-generator", "ai-seo-title-generator", "headline-analyzer", "word-counter"],
  },
  {
    kind: "ai-writer",
    slug: "ai-product-description-generator",
    category: "ai-writers",
    name: "AI Product Description Generator",
    tagline: "Turn features into buyer-focused product copy for your store or catalogue.",
    seoDescription:
      "Free AI product description generator. Enter your product and features to get persuasive, benefit-led copy plus a bullet list — ideal for e-commerce listings.",
    fields: [
      { name: "product", label: "Product name & type", type: "text", placeholder: "e.g. Aarna handloom cotton bedsheet, king size" },
      { name: "features", label: "Key features / details", type: "textarea", rows: 3, placeholder: "e.g. 400 TC, natural dyes, machine washable, made in Bhagalpur", optional: true },
      { name: "audience", label: "Target buyer", type: "text", placeholder: "e.g. urban homemakers who value natural fabrics", optional: true },
      {
        name: "length",
        label: "Length",
        type: "select",
        defaultValue: "standard",
        options: [
          { value: "standard", label: "Standard (120–180 words)" },
          { value: "short", label: "Short (60–90 words)" },
        ],
      },
    ],
    submitLabel: "Generate description",
    about: [
      "The difference between a product that sells and one that sits is often just the words next to the photo. Most listings read like spec sheets — \"400 TC, 100% cotton, king size\" — and spec sheets don't create desire. Good product copy translates each feature into the outcome the buyer actually wants: not \"400 thread count\" but the feeling of hotel-crisp sheets on a Sunday morning. This generator does that translation for you.",
      "Describe the product, list its features in any rough form, say who buys it, and you get a description that leads with the strongest benefit, folds the features into real-life outcomes, and closes with a gentle push toward purchase — plus a clean five-point bullet list for marketplaces that display one. The short length fits Amazon-style listings and catalogue cards; the standard length suits your own store's product pages, where fuller copy supports both conversion and SEO.",
      "Two habits multiply the results. Generate separately for different audiences — the same bedsheet sells differently to a gifting buyer than to a hotel purchaser, and thirty seconds of regeneration beats one-size-fits-none copy. And always keep claims honest: the generator works from the features you give it, so feed it facts, not wishes. Consistent, benefit-led descriptions across a whole catalogue is exactly the kind of content work that used to take an agency retainer.",
    ],
    faq: [
      {
        question: "What's the difference between features and benefits?",
        answer:
          "A feature is what the product has (400 TC cotton); a benefit is what the buyer gets (soft, durable sheets that survive years of washing). Copy that sells leads with benefits and uses features as proof.",
      },
      {
        question: "Will the description work for Amazon/Flipkart listings?",
        answer:
          "Yes — use the short length for marketplace descriptions and the bullet list for the key-features section. Check each marketplace's length limits and prohibited claims before pasting.",
      },
      {
        question: "Is the copy unique enough for SEO?",
        answer:
          "Each generation is written fresh from your specific inputs, not from a template bank. For best SEO results, include the product's search keyword in the product-name field so it appears naturally in the copy.",
      },
    ],
    related: ["ai-ad-copy-generator", "ai-seo-title-generator", "ai-faq-generator", "margin-calculator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-ad-copy-generator",
    category: "ai-writers",
    name: "AI Ad Copy Generator",
    tagline: "Three tested ad angles for Google or Meta, sized to the platform's limits.",
    seoDescription:
      "Free AI ad copy generator for Google and Facebook/Instagram ads. Get three ad variants — benefit-led, offer-led and social-proof — sized to character limits.",
    fields: [
      { name: "product", label: "Product / service", type: "text", placeholder: "e.g. cloud accounting software for Indian SMEs" },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        defaultValue: "google",
        options: [
          { value: "google", label: "Google Ads (search)" },
          { value: "facebook", label: "Facebook / Instagram" },
        ],
      },
      { name: "offer", label: "Offer / promotion", type: "text", placeholder: "e.g. 30-day free trial", optional: true },
      { name: "audience", label: "Target audience", type: "text", placeholder: "e.g. CAs and small business owners", optional: true },
    ],
    submitLabel: "Generate ad copy",
    about: [
      "Ad platforms are unforgiving copy environments: Google search ads give you 30-character headlines and 90-character descriptions; Meta gives you one line above the fold before \"see more\" swallows the rest. Writing inside those boxes — while still being persuasive — is a genuine skill, and the first version you write is rarely the one that performs. Every profitable ad account runs on variants.",
      "That's why this generator produces three deliberately different angles per run: one leading with the core benefit, one leading with your offer and urgency, and one leading with social proof. These aren't cosmetic rewrites — they're the three classic persuasion routes, and testing them against each other is the fastest way to learn what your audience responds to. Google variants come with character counts printed against each headline and description so you can see they fit before you paste; Meta variants get a hook-first primary text sized for the feed.",
      "Use it at two moments: when launching a campaign and you need a credible starting set, and when an ad fatigues and click-through drops — regenerate with the same inputs and refresh the creative in minutes. As always with ads, the copy makes the click but the offer makes the sale: pair strong variants with a landing page that keeps the ad's promise, and check your ROAS with the calculator linked below to know which angle actually pays.",
    ],
    faq: [
      {
        question: "Why three variants?",
        answer:
          "Ad performance is discovered, not predicted. Running benefit-led, offer-led and proof-led angles against each other tells you within days which persuasion route your audience buys — then you double down.",
      },
      {
        question: "Will the copy fit Google's character limits?",
        answer:
          "Google variants are generated to the 30-character headline / 90-character description limits with counts shown per line. Verify in the Ads editor, which counts some characters differently (like ampersands in certain scripts).",
      },
      {
        question: "What makes Facebook ad copy different from Google?",
        answer:
          "Google search copy answers an active query — be specific and match the keyword. Facebook interrupts a feed — the first line must stop the scroll before anything else matters. The generator formats each accordingly.",
      },
    ],
    related: ["ai-social-media-post-generator", "roas-calculator", "cpm-calculator", "ai-tagline-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-cold-email-writer",
    category: "ai-writers",
    name: "AI Cold Email Writer",
    tagline: "Short, personalised cold emails that respect the reader's time — plus the follow-up.",
    seoDescription:
      "Free AI cold email writer. Get a sub-120-word cold outreach email with subject line and follow-up — personalised, direct and free of tired sales clichés.",
    fields: [
      { name: "pitch", label: "What you're pitching", type: "text", placeholder: "e.g. our payroll automation service for factories" },
      { name: "recipient", label: "Who you're writing to", type: "text", placeholder: "e.g. HR heads at mid-size manufacturers", optional: true },
      { name: "painPoint", label: "Their likely pain point", type: "text", placeholder: "e.g. monthly payroll takes their team 3 days", optional: true },
      {
        name: "goal",
        label: "Goal of the email",
        type: "select",
        defaultValue: "call",
        options: [
          { value: "call", label: "Book a short call" },
          { value: "reply", label: "Get a reply / start a conversation" },
          { value: "demo", label: "Offer a demo or trial" },
          { value: "meeting", label: "Request a meeting" },
        ],
      },
    ],
    submitLabel: "Write cold email",
    about: [
      "Cold email still works — it remains the cheapest way for a small business to reach exactly the person who can say yes — but only the version that respects the reader. The emails that get replies are short, specific about why this recipient, clear about the one thing being asked, and free of the padding (\"I hope this email finds you well\") that signals mass mail before the first comma.",
      "This writer is built around those rules. It produces an email under 120 words with a personalisation placeholder in [brackets] where you drop in the one detail you know about the recipient, a single value proposition framed around their pain point rather than your product, and one low-friction call to action matched to your goal. You also get a subject line under 50 characters — the length that survives mobile inboxes — and a two-sentence follow-up for three days later, because a large share of replies come from the polite nudge, not the first send.",
      "The placeholder is not optional decoration: filling it with something real (\"saw you're hiring three payroll executives\") is the difference between outreach and spam, in both results and reputation. Send individually or through a proper outreach tool, keep volumes modest, and honour opt-outs — India's spam norms and your domain's deliverability both depend on it.",
    ],
    faq: [
      {
        question: "How long should a cold email be?",
        answer:
          "Under 120 words. Busy people triage on their phone; a screen-length email that makes one clear point outperforms a pitch essay every time.",
      },
      {
        question: "Do follow-ups really matter?",
        answer:
          "Enormously — a short, polite follow-up 2-4 days later often doubles total reply rates. One or two follow-ups is persistence; five is pestering.",
      },
      {
        question: "How do I personalise at scale?",
        answer:
          "Keep the body templated and spend your time on the [bracketed] opening line — one specific, verifiable detail per recipient. Ten well-personalised emails beat a hundred generic ones.",
      },
    ],
    related: ["ai-email-reply-generator", "ai-linkedin-post-generator", "payment-reminder-generator", "ai-ad-copy-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-social-media-post-generator",
    category: "ai-writers",
    name: "AI Social Media Post Generator",
    tagline: "Three platform-sized post variants with hooks and hashtags.",
    seoDescription:
      "Free AI social media post generator for Instagram, Facebook and X. Enter a topic and get three post variants with strong hooks and relevant hashtags.",
    fields: [
      { name: "topic", label: "What's the post about?", type: "text", placeholder: "e.g. we just delivered our 1,000th order" },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        defaultValue: "instagram",
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "facebook", label: "Facebook" },
          { value: "x", label: "X (Twitter)" },
        ],
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        defaultValue: "engaging",
        options: [
          { value: "engaging", label: "Engaging / friendly" },
          { value: "professional", label: "Professional" },
          { value: "playful", label: "Playful" },
          { value: "inspirational", label: "Inspirational" },
        ],
      },
      { name: "cta", label: "Call to action", type: "text", placeholder: "e.g. DM us to order", optional: true },
    ],
    submitLabel: "Generate posts",
    about: [
      "Posting consistently is the whole game on social media — the algorithm rewards accounts that show up — yet for most business owners the caption is the daily blocker. The product photo is taken, the moment is worth sharing, and then fifteen minutes evaporate deciding how to say it. This generator turns a one-line description of the moment into three ready-to-post captions in seconds.",
      "Each variant is built for how feeds actually work: a first line that stops the scroll (on Instagram only the opening words show before \"more\"; on X the whole post is the hook), short paragraphs with breathing room rather than a wall of text, your call to action woven in naturally, and a set of 5-8 hashtags that mix broad reach with niche relevance. Three variants matter because tone is a choice — the same milestone can be told as a thank-you, a behind-the-scenes story, or a punchy announcement, and seeing all three makes the right one obvious.",
      "A sustainable workflow for a small team: once a week, batch-generate posts for the moments you know are coming — product highlights, customer stories, tips from your expertise, festival greetings — edit each lightly to add a specific detail, and schedule them. Fifteen minutes of batching replaces a daily struggle, and the consistency compounds into reach.",
    ],
    faq: [
      {
        question: "How many hashtags should I actually use?",
        answer:
          "5-8 relevant ones on Instagram (mixing broad and niche), 1-2 on X, and few or none on Facebook. Relevance beats volume — 30 scattergun hashtags now reads as spam on every platform.",
      },
      {
        question: "What makes a first line a good hook?",
        answer:
          "Specificity and tension: a number, a bold claim, a question the audience feels. \"1,000 orders. Zero paid ads.\" outperforms \"We are pleased to announce a milestone.\"",
      },
      {
        question: "Should I post the same caption on every platform?",
        answer:
          "Adapt it — lengths, hashtag norms and tone differ. Generate per platform (it's seconds) rather than cross-posting one caption everywhere.",
      },
    ],
    related: ["ai-linkedin-post-generator", "hashtag-generator", "engagement-rate-calculator", "ai-ad-copy-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-business-name-generator",
    category: "ai-writers",
    name: "AI Business Name Generator",
    tagline: "Fifteen name ideas across descriptive, brandable and evocative styles.",
    seoDescription:
      "Free AI business name generator. Describe your business and get 15 name ideas — descriptive, brandable and evocative — each with a one-line rationale.",
    fields: [
      { name: "description", label: "What does the business do?", type: "textarea", rows: 3, placeholder: "e.g. organic cold-pressed oils sold D2C across India" },
      { name: "keywords", label: "Words or themes to consider", type: "text", placeholder: "e.g. purity, tradition, harvest", optional: true },
      {
        name: "style",
        label: "Naming style",
        type: "select",
        defaultValue: "mixed",
        options: [
          { value: "mixed", label: "Mix of styles" },
          { value: "modern", label: "Modern / startup" },
          { value: "classic", label: "Classic / trustworthy" },
          { value: "playful", label: "Playful" },
        ],
      },
    ],
    submitLabel: "Generate names",
    about: [
      "Naming a business is a strange task: it matters enormously, it's nearly impossible to do on demand, and every candidate sounds wrong after you've stared at it for an hour. The way out is volume and structure — seeing many names across distinct naming strategies, rather than circling the same three words on a notepad. That's what this generator provides: fifteen ideas per run, organised into the three families professional namers actually use.",
      "Descriptive names (what you do, said plainly) buy instant comprehension and help search, at the cost of distinctiveness. Invented, brandable names (think coined words with good mouthfeel) are ownable and trademark-friendly but need marketing to acquire meaning. Evocative names borrow an image or feeling adjacent to your category — they're memorable and flexible as you grow. Each suggestion comes with a one-line rationale so you're choosing between strategies, not just sounds, and the generator favours short, hyphen-free names that stand a realistic chance of an available .com or .in domain.",
      "Shortlist three to five, then do the unglamorous checks before falling in love: domain availability, the MCA company-name search if you'll incorporate, a trademark search on ipindia.gov.in, social handle availability, and — often forgotten — how it sounds spoken aloud on a phone call. Run the generator a few times with different keyword nudges; the second and third batches are frequently where the winner appears.",
    ],
    faq: [
      {
        question: "Descriptive or brandable — which is better?",
        answer:
          "Descriptive names communicate instantly but blend in; brandable names stand out but need marketing to explain. Early-stage businesses that rely on search often start descriptive; brands built on distinctiveness go invented or evocative.",
      },
      {
        question: "What should I check before committing to a name?",
        answer:
          "Domain and social handle availability, MCA name search (for incorporation), a trademark search on ipindia.gov.in, and the say-it-aloud test. Do all four before printing anything.",
      },
      {
        question: "The names don't feel right — what now?",
        answer:
          "Regenerate with different keyword nudges and a tighter description. Naming is a volume game; most founders pick from batch three, not batch one.",
      },
    ],
    related: ["ai-tagline-generator", "slug-generator", "ai-seo-title-generator", "meta-tag-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-tagline-generator",
    category: "ai-writers",
    name: "AI Tagline Generator",
    tagline: "Twelve slogan options in three lengths — minus the clichés.",
    seoDescription:
      "Free AI tagline and slogan generator. Describe your business and value proposition to get 12 tagline options across ultra-short, medium and wordplay styles.",
    fields: [
      { name: "business", label: "Business / product", type: "text", placeholder: "e.g. Postbox — a courier aggregator for D2C brands" },
      { name: "value", label: "Core value proposition", type: "text", placeholder: "e.g. cheapest shipping rates with one integration", optional: true },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        defaultValue: "confident",
        options: [
          { value: "confident", label: "Confident" },
          { value: "warm", label: "Warm / friendly" },
          { value: "witty", label: "Witty" },
          { value: "premium", label: "Premium / understated" },
        ],
      },
    ],
    submitLabel: "Generate taglines",
    about: [
      "A tagline is your brand's shortest piece of writing and its hardest: a handful of words that must say what you do, how you're different, or how you make people feel — ideally two of the three. The classics feel inevitable in hindsight (\"Just Do It\", \"Utterly Butterly Delicious\"), but they were picked from long lists of candidates, not conjured in one stroke. Volume, then selection, is how taglines actually get written.",
      "This generator gives you that volume with structure: twelve options per run, deliberately spread across three formats. Ultra-short lines (2-4 words) fit logos, packaging and app store subtitles. Medium lines (5-8 words) suit website heroes and ad copy where you can afford a full thought. And wordplay lines — rhythm, alliteration, a twist on a familiar phrase — trade explicitness for memorability. The prompt explicitly bans the exhausted startup vocabulary (\"unlock\", \"unleash\", \"elevate\", \"empower\"), which removes half of what generic tools produce.",
      "Shortlist by saying candidates aloud and imagining them under your logo, on your packaging, at the end of an ad. Check that nobody prominent in your category already uses something close — a quick search plus a look at the trademark registry for anything you'll print at scale. And prefer the line that's true over the line that's clever: a tagline your business can't live up to is a complaint generator.",
    ],
    faq: [
      {
        question: "What makes a good tagline?",
        answer:
          "Short enough to remember, specific enough to mean something, and true enough to keep. Aim for two of: what you do, how you differ, how it feels. Test by saying it aloud next to your brand name.",
      },
      {
        question: "Tagline vs slogan — is there a difference?",
        answer:
          "A tagline is the durable line attached to the brand itself; a slogan often belongs to one campaign. The generator's output works for both — pick the timeless ones for a tagline.",
      },
      {
        question: "Can I trademark a tagline?",
        answer:
          "Yes, if it's distinctive and used in trade — many taglines are registered marks in India. Search ipindia.gov.in before investing in one, especially for packaging.",
      },
    ],
    related: ["ai-business-name-generator", "headline-analyzer", "ai-ad-copy-generator", "meta-tag-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-email-reply-generator",
    category: "ai-writers",
    name: "AI Email Reply Generator",
    tagline: "Paste an email, say what you want to convey, get a polished reply.",
    seoDescription:
      "Free AI email reply generator. Paste the email you received, choose your intent and tone, and get a clear, professional reply that answers every point.",
    fields: [
      { name: "email", label: "The email you received", type: "textarea", rows: 6, placeholder: "Paste the email you need to reply to…" },
      { name: "intent", label: "What should the reply say?", type: "text", placeholder: "e.g. agree to the meeting but move it to Thursday" },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        defaultValue: "professional",
        options: [
          { value: "professional", label: "Professional" },
          { value: "friendly", label: "Friendly" },
          { value: "firm", label: "Firm but polite" },
          { value: "apologetic", label: "Apologetic" },
        ],
      },
    ],
    submitLabel: "Write reply",
    about: [
      "Some emails take longer to answer than the work they're about: the awkward decline, the payment reminder to a good client, the apology that mustn't over-apologise, the firm no that mustn't burn the bridge. You know what you want to convey; the labour is finding words that carry the message at the right temperature. This tool does exactly that translation — paste the email you received, state your intent in plain words, pick a tone, and get a reply ready to send.",
      "The generator reads the original email, so the reply actually engages with it: every question asked gets answered, names and specifics are acknowledged, and the response addresses what was said rather than being a generic template with the blanks filled. Replies come out under 150 words — the length busy people read — structured as considerate professionals write: acknowledge, respond, state next step, sign off.",
      "The four tones cover the situations that generate real hesitation. \"Firm but polite\" holds a boundary — a scope-creep pushback, a rate negotiation — without aggression. \"Apologetic\" owns a mistake credibly without grovelling. Before sending, do the thirty-second pass every generated draft deserves: check names, verify any dates or amounts, and add one human touch only you could know. Your text is processed only to produce the reply and never stored, but as with any tool, trim truly sensitive details you don't need to include.",
    ],
    faq: [
      {
        question: "Will the reply address the specific points in the original email?",
        answer:
          "Yes — the original is part of the prompt, so questions asked in it are answered and its specifics acknowledged. Always verify names, dates and amounts before sending.",
      },
      {
        question: "Is the email I paste stored anywhere?",
        answer:
          "It's sent to the AI service only to generate your reply and is not stored by this site. Remove anything highly sensitive that the reply doesn't need.",
      },
      {
        question: "When should I use the firm tone?",
        answer:
          "Boundary situations: chasing overdue payments, declining scope creep, pushing back on unreasonable terms. Firm keeps the relationship; the generator avoids apology-padding that undermines the message.",
      },
    ],
    related: ["ai-cold-email-writer", "payment-reminder-generator", "email-subject-line-tester", "word-counter"],
  },
  {
    kind: "ai-writer",
    slug: "ai-linkedin-post-generator",
    category: "ai-writers",
    name: "AI LinkedIn Post Generator",
    tagline: "Turn an insight or milestone into a post built for the LinkedIn feed.",
    seoDescription:
      "Free AI LinkedIn post generator. Enter your topic and angle to get a feed-ready post with a strong hook, short paragraphs and a comment-inviting close.",
    fields: [
      { name: "topic", label: "What's the post about?", type: "text", placeholder: "e.g. what we learned firing our biggest client" },
      {
        name: "angle",
        label: "Angle",
        type: "select",
        defaultValue: "lesson",
        options: [
          { value: "lesson", label: "Lesson learned" },
          { value: "story", label: "Story / behind the scenes" },
          { value: "contrarian", label: "Contrarian take" },
          { value: "howto", label: "Practical how-to" },
          { value: "milestone", label: "Milestone / announcement" },
        ],
      },
      { name: "audience", label: "Audience", type: "text", placeholder: "e.g. founders and sales leaders", optional: true },
    ],
    submitLabel: "Generate post",
    about: [
      "LinkedIn is where business reputations compound quietly: a good post seen by two thousand relevant people does more for a consultant, founder or job-seeker than most paid campaigns. But LinkedIn writing is its own genre, with conventions that feel unnatural until learned — and this generator has learned them so you can start from a working draft instead of a blank box.",
      "The format it follows is the one that performs: a one-line hook, because only the first line or two shows before \"…see more\" and the click on that link is the whole battle; then short one-to-two-sentence paragraphs with real line breaks, since dense text dies on mobile; a concrete story or specific insight in the middle, because abstractions get scrolled past; a clear takeaway; and a closing question, because comments are what the algorithm feeds on. A restrained 3-5 hashtags sit at the very end, and emoji stay in single digits.",
      "The angles map to LinkedIn's evergreen genres — lessons learned, behind-the-scenes stories, contrarian takes, practical how-tos, milestones. The same topic works through several: one experience can yield a lesson post this week and a how-to next month. Edit the draft to add the numbers and names only you know (specificity is credibility on LinkedIn), post consistently rather than perfectly, and reply to early comments — the first hour's engagement decides the post's reach.",
    ],
    faq: [
      {
        question: "Why does the first line matter so much?",
        answer:
          "The feed truncates posts after roughly two lines — readers click \"see more\" only if the hook earns it. A specific number, tension or bold claim outperforms a polite preamble every time.",
      },
      {
        question: "How often should I post on LinkedIn?",
        answer:
          "Two to three times a week, sustained for months, beats a daily sprint that burns out in three weeks. Batch-generate drafts and refine one each morning.",
      },
      {
        question: "Do hashtags still matter on LinkedIn?",
        answer:
          "Modestly — 3-5 relevant ones help categorisation without looking spammy. Your first-hour engagement (comments especially) matters far more for reach.",
      },
    ],
    related: ["ai-social-media-post-generator", "ai-blog-outline-generator", "engagement-rate-calculator", "hashtag-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-seo-title-generator",
    category: "ai-writers",
    name: "AI SEO Title Generator",
    tagline: "Ten click-worthy title tags, all within Google's 60-character window.",
    seoDescription:
      "Free AI SEO title generator. Enter your topic and keyword to get 10 title-tag options, each within 60 characters, across proven formats — with a top pick.",
    fields: [
      { name: "topic", label: "What's the page about?", type: "text", placeholder: "e.g. a guide to GST registration for freelancers" },
      { name: "keyword", label: "Primary keyword", type: "text", placeholder: "e.g. GST registration for freelancers", optional: true },
      {
        name: "intent",
        label: "Search intent",
        type: "select",
        defaultValue: "informational",
        options: [
          { value: "informational", label: "Informational (guides, how-tos)" },
          { value: "commercial", label: "Commercial (comparisons, best-of)" },
          { value: "transactional", label: "Transactional (buy, sign up)" },
        ],
      },
    ],
    submitLabel: "Generate titles",
    about: [
      "The title tag does two jobs at once: it tells Google what the page is about, and it persuades a human scanning a results page to pick your link over nine others. Ranking without clicks is a moral victory — the title is where rankings turn into traffic, and small wording changes routinely move click-through rates by whole percentage points.",
      "This generator produces ten options engineered for both jobs. Each stays within the roughly 60-character window Google displays before truncating (the count is printed after every title so you can verify at a glance), places your primary keyword naturally and early where relevance signals count most, and matches the search intent you select — a how-to phrasing for informational queries, comparison framing for commercial ones. The ten deliberately span the formats that dominate result pages: how-to, listicle, question, comparison, and plain descriptive, because different queries reward different shapes. A marked top pick with reasoning saves you the tie-break.",
      "Two practices squeeze the most from it. First, write the title for the searcher, not the algorithm — keyword-stuffed titles get rewritten by Google anyway, and honest specificity (\"for freelancers\", \"in 2026\", \"with fees\") wins clicks from exactly the visitors you want. Second, revisit titles on pages that rank well but convert poorly on the results page; a title refresh is the cheapest CTR experiment in SEO. Preview how any candidate renders with the SERP snippet tool linked below.",
    ],
    faq: [
      {
        question: "How long should a title tag be?",
        answer:
          "Aim for 50-60 characters. Google truncates around 600 pixels (~60 characters), and cut-off titles lose clicks. Every generated option shows its count so you can check instantly.",
      },
      {
        question: "Does the keyword have to be at the start?",
        answer:
          "Not strictly, but early placement helps both relevance signals and scanning humans. The generator front-loads it where it reads naturally — never at the cost of sounding robotic.",
      },
      {
        question: "Why does Google sometimes rewrite my title?",
        answer:
          "When it judges the title unrepresentative — too stuffed, too vague or duplicated across pages. Honest, specific, unique titles get rewritten least.",
      },
    ],
    related: ["serp-snippet-preview", "meta-tag-generator", "headline-analyzer", "ai-blog-outline-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-faq-generator",
    category: "ai-writers",
    name: "AI FAQ Generator",
    tagline: "Generate the questions your customers actually ask — answered.",
    seoDescription:
      "Free AI FAQ generator. Describe your product or service and get customer-phrased questions with clear answers — ready for your website's FAQ section.",
    fields: [
      { name: "subject", label: "Product / service / topic", type: "text", placeholder: "e.g. our wedding photography packages in Jaipur" },
      { name: "details", label: "Key details to draw from", type: "textarea", rows: 4, placeholder: "e.g. packages from ₹75,000, 2 photographers, delivery in 3 weeks, travel extra", optional: true },
      {
        name: "count",
        label: "Number of questions",
        type: "select",
        defaultValue: "8",
        options: [
          { value: "6", label: "6" },
          { value: "8", label: "8" },
          { value: "10", label: "10" },
          { value: "12", label: "12" },
        ],
      },
    ],
    submitLabel: "Generate FAQ",
    about: [
      "A good FAQ section quietly does four jobs: it answers the pre-sales doubts that stop people buying, it deflects the repetitive emails and calls that eat your day, it reassures hesitant visitors that you've thought about their situation, and it feeds search engines exactly the question-shaped queries people type. Yet most businesses never write one, because generating the questions — seeing your own offering through a stranger's eyes — is genuinely hard from the inside.",
      "That outside view is what this generator supplies. Describe what you offer, paste whatever key details you have (prices, timelines, policies — rough notes are fine), and it produces customer-phrased questions with clear, honest answers drawn from those details. It deliberately includes the two questions every buyer has and every business hesitates to answer — the cost question and the \"how do you compare to the alternative\" question — because answering them on your terms beats letting a competitor's page do it.",
      "Review the output for factual accuracy (it writes from what you gave it, so wrong inputs make wrong answers), adjust anything policy-sensitive, and publish. For an SEO bonus, mark the section up with FAQPage structured data so eligible questions can appear directly in search results — and revisit quarterly: the emails you still receive are the questions your FAQ is missing.",
    ],
    faq: [
      {
        question: "How many FAQs should a page have?",
        answer:
          "Six to ten well-chosen questions beat twenty filler ones. Cover price, process, timing, the main objection, and the comparison question — then stop.",
      },
      {
        question: "Should I really answer the price question?",
        answer:
          "Yes, at least with a starting range. Visitors who can't find pricing assume the worst and leave; \"packages from ₹75,000\" filters and reassures simultaneously.",
      },
      {
        question: "Do FAQs help SEO?",
        answer:
          "Meaningfully — they match the natural-language questions people search, and with FAQPage structured data they can surface directly on results pages. This site's own tool pages use exactly that pattern.",
      },
    ],
    related: ["ai-product-description-generator", "meta-tag-generator", "ai-seo-title-generator", "serp-snippet-preview"],
  },
  {
    kind: "ai-writer",
    slug: "job-description-generator",
    category: "ai-writers",
    name: "AI Job Description Generator",
    tagline:
      "Turn a role, experience level and required skills into a professional, ready-to-post job description.",
    seoDescription:
      "Free AI job description generator. Enter a role, experience level and required skills to get a professional, recruitment-ready job description — powered by AI, no sign-up.",
    fields: [
      {
        name: "role",
        label: "Job role / title",
        type: "text",
        required: true,
        maxLength: JOB_FIELD_LIMITS.role,
        placeholder: "e.g. Senior React Developer",
      },
      {
        name: "experience",
        label: "Experience level",
        type: "select",
        required: true,
        defaultValue: "",
        options: [
          { value: "", label: "Select experience level" },
          ...JOB_EXPERIENCE_LEVELS.map((level) => ({ value: level, label: level })),
        ],
      },
      {
        name: "skills",
        label: "Required skills",
        type: "textarea",
        required: true,
        rows: 3,
        maxLength: JOB_FIELD_LIMITS.skills,
        placeholder: "e.g. React, TypeScript, Node.js",
        help: "Separate multiple skills with commas — technical names like C++, C# and .NET work fine.",
      },
      {
        name: "industry",
        label: "Industry / field",
        type: "text",
        optional: true,
        maxLength: JOB_FIELD_LIMITS.industry,
        placeholder: "e.g. SaaS, e-commerce, fintech, manufacturing",
      },
      {
        name: "company",
        label: "Company information",
        type: "textarea",
        optional: true,
        rows: 3,
        maxLength: JOB_FIELD_LIMITS.company,
        placeholder: "e.g. a 15-person SaaS startup building billing software for Indian SMEs, remote-first",
        help: "Name and describe the company. The generator uses only what you provide — it never invents company details.",
      },
      {
        name: "responsibilities",
        label: "Additional responsibilities / requirements",
        type: "textarea",
        optional: true,
        rows: 4,
        maxLength: JOB_FIELD_LIMITS.responsibilities,
        placeholder: "e.g. lead a team of 4, own the release process, mentor juniors, on-call rotation",
        help: "Extra duties or must-haves the description should cover.",
      },
    ],
    submitLabel: "Generate job description",
    about: [
      "Most job descriptions are either copied from a competitor or dashed off in ten minutes — and both show up in your applications. A vague description attracts under-qualified candidates, while a padded one sets expectations nobody can meet. This generator fixes the starting point: you supply three facts you already know — the role, the experience level, the skills you need — and it produces a professional, structured description in under a minute.",
      "A job description works as two things at once: an advertisement that sells the role to good candidates, and a filter that discourages the wrong ones. That's why structure matters. Ten sections cover the ground a candidate actually checks — a summary of what the job is and why it matters, an overview of the day-to-day, five to eight specific responsibilities scaled to the experience level, the skills grouped sensibly, and honest qualifications. Setting expectations early pays off: candidates who self-select out at the application stage cost you nothing; discovering the mismatch after an interview costs you days.",
      "The generator writes from your inputs only. If you don't provide company information, industry or benefits, it says nothing about them rather than inventing them — the How to Apply section ends with a placeholder where you add your real contact details. That anti-fabrication rule is deliberate: a job description that invents a benefit or a salary strand someone to withdraw, or worse, to a claim they didn't make. Add the facts in your own words after generating, and tailor the responsibilities to the actual scope of the role before posting.",
      "The tool is free and requires no account. For the rest of the hiring workflow — offer letters, appointment letters and experience letters — the EBOS HR module covers the full employee lifecycle from the same foundation.",
    ],
    faq: [
      {
        question: "What do I need to provide?",
        answer:
          "Just three things: the job role or title, the experience level, and the required skills. Industry, company information and extra responsibilities are optional add-ons that make the output more specific.",
      },
      {
        question: "Will it invent salary, benefits or contact details?",
        answer:
          "No. The generator is instructed to write only from what you provide and never to fabricate salary, benefits, location, company details or a contact address. The How to Apply section ends with a placeholder where you add your real application instructions.",
      },
      {
        question: "Can I post the output directly?",
        answer:
          "Largely, yes — after filling any placeholders and checking the responsibilities against the real scope of the role. Before posting in India, also review the description for any wording that could be seen as discriminatory on grounds like age, gender or marital status, which hiring norms prohibit.",
      },
      {
        question: "Are the responsibilities realistic?",
        answer:
          "They're generated to match the experience level you select and are based only on your inputs. For a lead or manager level, expect ownership and mentoring duties; for entry level, expect learning and support duties. Adjust any line that doesn't reflect the actual day-to-day.",
      },
    ],
    related: ["offer-letter-generator", "experience-letter-generator", "ai-linkedin-post-generator", "salary-calculator"],
  },
];
