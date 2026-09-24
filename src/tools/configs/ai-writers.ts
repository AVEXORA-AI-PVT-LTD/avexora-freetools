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
      "Free AI blog outline generator. Enter a topic and audience to get an SEO outline with an H1, H2 sections, H3 points and intro and CTA ideas. No sign-up.",
    seoTitle: "Free AI Blog Outline Generator: SEO H2 & H3 Structure",
    keywords: [
      "ai blog outline generator",
      "blog outline generator",
      "free blog outline generator",
      "blog post outline maker",
      "seo blog outline",
      "blog structure generator",
      "h2 and h3 outline for a blog",
      "article outline generator",
      "content outline generator",
      "how to outline a blog post",
    ],
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
    directAnswer: "The AI Blog Outline Generator is a free tool that instantly creates a structured, SEO-optimised skeleton for your blog post based on your topic and audience.",
    example: "Input: 'How small businesses can automate GST filing' → Output: A hierarchical outline with H1 title, logical H2 sections like 'Why automation matters', H3 subpoints, and intro/conclusion prompts.",
    steps: [
      "Enter your core blog topic or working title.",
      "Optionally specify your target audience to tailor the sections.",
      "Select the desired tone (e.g., professional or conversational).",
      "Click 'Generate outline' to receive a complete, working skeleton."
    ],
    about: [
      "This generator turns your topic into a working blog outline in seconds: enter your topic (and optionally who you're writing for), and the AI produces a structured outline with an H1, logical H2 sections, supporting H3 points, and suggestions for the introduction and conclusion. Staring at a blank page is otherwise the slowest part of writing.",
      "A good outline is the difference between a rambling post and one that ranks. Search engines reward content that covers a topic thoroughly and is organised under clear headings — exactly what an outline enforces. Readers benefit too: most people scan a post's headings before deciding whether to read it, so a logical heading structure keeps them on the page. Use the generated structure as-is or rearrange sections to fit your angle, then write section by section — filling in a skeleton is far faster than composing from nothing, and it keeps every section focused on answering one question.",
      "A practical workflow: generate the outline, delete any section you don't have something original to say about, add one section from your own experience that the AI couldn't know, and then draft. That combination — solid structure plus first-hand insight — is what separates content that ranks from content that reads like everyone else's.",
      "The tool is free and requires no account. For end-to-end content workflows — briefs, AI drafting, scheduling and performance tracking — the EBOS Marketing module includes a full AI writing assistant.",
    ],
    faq: [
      {
        question: "Is the generated blog outline unique?",
        answer:
          "Yes. Each outline is generated fresh by AI from your specific topic, audience, and tone — it isn't pulled from a static template library, ensuring unique structure every time.",
      },
      {
        question: "Can I use the outline directly for commercial content or client work?",
        answer:
          "Absolutely, the generated output is entirely yours to use freely for personal blog posts, client work, agency deliverables, or any other commercial content.",
      },
      {
        question: "What exactly makes a good blog outline for SEO?",
        answer:
          "A solid SEO outline features a clear H1 with the primary keyword, 4–8 H2 sections that each answer one specific reader question, H3 subpoints for deep detail, and a conclusion with a call to action. The generator naturally follows this best-practice structure.",
      },
      {
        question: "How long does it take to generate an outline?",
        answer:
          "It takes just a few seconds. Once you hit 'Generate outline', the AI processes your topic and instantly returns a fully structured, ready-to-write content skeleton.",
      },
      {
        question: "Do I need an account to use this generator?",
        answer:
          "No, the AI blog outline generator is completely free and requires no sign-up or account creation to use.",
      }
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
    seoTitle: "Free AI Blog Intro Generator: 3 Hook-First Openings",
    keywords: [
      "ai blog intro generator",
      "blog introduction generator",
      "blog intro writer",
      "free blog intro generator",
      "opening paragraph generator",
      "blog hook generator",
      "article intro generator",
      "how to write a blog introduction",
    ],
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
    directAnswer: "The AI Blog Intro Generator is a free tool that instantly writes three distinct, hook-driven opening paragraphs for your blog post based on your title and audience.",
    example: "Input: '10 GST Mistakes' & Angle 'Problem' → Output: Three varied introductory paragraphs that immediately address the reader's pain point and promise a solution.",
    steps: [
      "Enter your blog post title.",
      "Optionally specify your target audience.",
      "Choose the opening angle (problem, statistic, story, or question).",
      "Click 'Generate intros' to receive three unique hook options."
    ],
    about: [
      "This generator removes the biggest bottleneck in writing an intro: give it your title, your audience, and the kind of opening you want, and it returns three different ready-to-edit introductions. Readers decide whether to stay within a post's first three sentences, which makes the introduction the highest-stakes paragraph you'll write — and, for most writers, the slowest, with twenty minutes often lost staring at a blank first line for a post whose body takes an hour.",
      "You get three because intros are a matter of fit, not correctness. One might open on the pain point, another on a vivid scenario, a third on a question — seeing them side by side makes it obvious which voice suits your post, and you'll often splice the best sentence from one into another. Each intro is built on the structure that keeps readers scrolling: a first line that earns attention, a middle that names the problem the reader recognises, and a final sentence that promises exactly what the post will deliver.",
      "Treat the output as a strong first draft. Swap in a detail only you know — a number from your business, a customer's actual words — and the intro stops sounding generated and starts sounding like you. Pair it with the blog outline generator to go from blank page to full draft skeleton in a couple of minutes.",
    ],
    faq: [
      {
        question: "Why does the tool generate three intros instead of just one?",
        answer:
          "Because openings are highly subjective and about finding the right fit for your brand's voice. Three different angles side by side make it easy to pick the one that matches your post's tone — or you can combine the best lines from each.",
      },
      {
        question: "What actually makes a good blog introduction?",
        answer:
          "A great introduction needs a first sentence that earns attention (the hook), a clear statement of the problem the reader recognises, and a final promise of what they'll get by reading on — all kept concise, usually within about 100 words.",
      },
      {
        question: "Can I use the generated intro text exactly as-is?",
        answer:
          "Yes, you can use the output directly. However, it improves noticeably if you personalise one detail — like adding a real number, a personal anecdote, or a real example. That's usually a 30-second edit that adds authenticity.",
      },
      {
        question: "How do I choose the right opening angle?",
        answer:
          "It depends on your topic. A 'Problem' angle works best for how-to guides, a 'Statistic' grabs attention for thought leadership, 'Story' is great for case studies, and a 'Question' works well for opinion pieces.",
      },
      {
        question: "Does this intro generator work for any industry?",
        answer:
          "Yes, the AI adapts to any industry. Just make sure to enter a specific target audience (e.g., 'B2B SaaS founders' instead of just 'business owners') so the AI can use the right vocabulary and tone.",
      }
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
    seoTitle: "Free AI Product Description Generator for E-commerce",
    keywords: [
      "ai product description generator",
      "product description generator",
      "free product description writer",
      "e-commerce product description",
      "product listing description generator",
      "product copy generator",
      "product bullet points generator",
      "how to write a product description",
    ],
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
    directAnswer: "The AI Product Description Generator is a free tool that turns raw product features into persuasive, buyer-focused descriptions for e-commerce stores.",
    example: "Input: 'King size cotton bedsheet' with features '400 TC, natural dyes' → Output: A 150-word description highlighting the luxurious feel and durability, plus a 5-point bullet list.",
    steps: [
      "Enter your product's name and type.",
      "List the key features or specifications (e.g., materials, dimensions).",
      "Describe your target buyer so the copy matches their desires.",
      "Select your preferred length and click 'Generate description'."
    ],
    about: [
      "This generator translates a product's features into the outcome the buyer actually wants — not \"400 thread count\" but the feeling of hotel-crisp sheets on a Sunday morning. Most listings read like spec sheets (\"400 TC, 100% cotton, king size\") instead, and spec sheets don't create desire: the difference between a product that sells and one that sits is often just the words next to the photo.",
      "Describe the product, list its features in any rough form, say who buys it, and you get a description that leads with the strongest benefit, folds the features into real-life outcomes, and closes with a gentle push toward purchase — plus a clean five-point bullet list for marketplaces that display one. The short length fits Amazon-style listings and catalogue cards; the standard length suits your own store's product pages, where fuller copy supports both conversion and SEO.",
      "Two habits multiply the results. Generate separately for different audiences — the same bedsheet sells differently to a gifting buyer than to a hotel purchaser, and thirty seconds of regeneration beats one-size-fits-none copy. And always keep claims honest: the generator works from the features you give it, so feed it facts, not wishes. Consistent, benefit-led descriptions across a whole catalogue is exactly the kind of content work that used to take an agency retainer.",
    ],
    faq: [
      {
        question: "What's the difference between product features and benefits?",
        answer:
          "A feature is what the product physically has (like '400 TC cotton'); a benefit is what the buyer actually gets out of it (like 'soft, durable sheets that survive years of washing'). Copy that sells always leads with benefits and uses features as proof.",
      },
      {
        question: "Will the generated description work for Amazon or Flipkart listings?",
        answer:
          "Yes — use the 'short' length option for marketplace descriptions and the included bullet list for the key-features section. Always check each specific marketplace's length limits and prohibited claims before pasting.",
      },
      {
        question: "Is the copy unique enough for my own website's SEO?",
        answer:
          "Absolutely. Each generation is written fresh from your specific inputs, not from a generic template bank. For best SEO results, include your target keyword in the product-name field so it appears naturally.",
      },
      {
        question: "Should I mention the price in the features field?",
        answer:
          "Usually, no. Product pages display the price separately. Focus the generated description purely on value, features, and benefits rather than specific pricing, which might change.",
      },
      {
        question: "Can it generate descriptions in different tones?",
        answer:
          "While there isn't a direct tone dropdown, the AI infers the tone from the 'Target buyer' field. Entering 'corporate professionals' will yield a much different tone than 'parents of toddlers'.",
      }
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
      "Free AI ad copy generator for Google and Facebook/Instagram ads. Get benefit, offer and social-proof variants sized to each platform's character limits.",
    seoTitle: "Free AI Ad Copy Generator for Google & Facebook Ads",
    keywords: [
      "ai ad copy generator",
      "ad copy generator",
      "google ads copy generator",
      "facebook ad copy generator",
      "instagram ad copy",
      "ad headline generator",
      "ppc ad copy writer",
      "free ad copy generator",
      "how to write ad copy",
    ],
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
    directAnswer: "The AI Ad Copy Generator is a free tool that creates platform-optimised advertising copy for Google Ads or Meta (Facebook/Instagram), sized to each platform's limits, with character counts for Google ads.",
    example: "Input: 'Cloud accounting software' + '30-day trial' → Output: Three distinct ad variants (benefit-led, offer-led, proof-led) sized perfectly for Google's character limits.",
    steps: [
      "Enter the product or service you are advertising.",
      "Select the platform (Google Ads or Meta).",
      "Include a specific offer or promotion, and define your audience.",
      "Click 'Generate ad copy' to receive three distinct variants."
    ],
    about: [
      "Ad platforms are unforgiving copy environments: Google search ads give you 30-character headlines and 90-character descriptions; Meta gives you one line above the fold before \"see more\" swallows the rest. Writing inside those boxes — while still being persuasive — is a genuine skill, and the first version you write is rarely the one that performs. Every profitable ad account runs on variants.",
      "That's why this generator produces three deliberately different angles per run: one leading with the core benefit, one leading with your offer and urgency, and one leading with social proof. These aren't cosmetic rewrites — they're the three classic persuasion routes, and testing them against each other is the fastest way to learn what your audience responds to. Google variants come with character counts printed against each headline and description so you can see they fit before you paste; Meta variants get a hook-first primary text sized for the feed.",
      "Use it at two moments: when launching a campaign and you need a credible starting set, and when an ad fatigues and click-through drops — regenerate with the same inputs and refresh the creative in minutes. As always with ads, the copy makes the click but the offer makes the sale: pair strong variants with a landing page that keeps the ad's promise, and check your ROAS with the calculator linked below to know which angle actually pays.",
    ],
    faq: [
      {
        question: "Why does the tool generate three variants instead of one?",
        answer:
          "Ad performance is discovered, not predicted. Running benefit-led, offer-led and proof-led angles against each other tells you within days which persuasion route your audience buys — then you can double down on the winner.",
      },
      {
        question: "Will the copy actually fit Google's strict character limits?",
        answer:
          "Yes. Google variants are generated specifically to the 30-character headline and 90-character description limits, with counts shown per line. Always verify in the Ads editor, as it counts some special characters differently.",
      },
      {
        question: "What makes Facebook ad copy different from Google?",
        answer:
          "Google search copy answers an active query, so it must be specific and match the keyword. Facebook interrupts a feed, so the first line must stop the scroll before anything else matters. The generator formats each accordingly.",
      },
      {
        question: "Should I use emojis in my ad copy?",
        answer:
          "For Meta (Facebook/Instagram), tasteful emoji use can increase click-through rates by drawing the eye. For Google Search Ads, emojis are generally prohibited and will cause your ad to be disapproved.",
      },
      {
        question: "How often should I refresh my ad copy?",
        answer:
          "Whenever your click-through rate (CTR) starts to noticeably drop, known as 'ad fatigue'. Regenerating fresh copy for the same offer every few weeks is a standard practice to keep campaigns profitable.",
      }
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
    seoTitle: "Free AI Cold Email Writer: Subject Line & Follow-Up",
    keywords: [
      "ai cold email writer",
      "cold email generator",
      "cold email template",
      "b2b cold email writer",
      "sales email generator",
      "outreach email writer",
      "follow-up email generator",
      "cold email subject line",
      "how to write a cold email",
    ],
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
    directAnswer: "The AI Cold Email Writer is a free tool that crafts concise, personalised B2B outreach emails, with a subject line and a short follow-up email, designed to get replies, not spam complaints.",
    example: "Input: Pitching 'payroll automation' to 'HR heads' → Output: A 100-word email focusing on their 3-day payroll headache, a clear call-to-action, and a 2-sentence follow-up.",
    steps: [
      "State exactly what you are pitching.",
      "Describe the recipient and their likely pain point.",
      "Select your primary goal (e.g., book a call or get a reply).",
      "Click 'Write cold email' to get your subject line, email body, and follow-up sequence."
    ],
    about: [
      "Cold email still works — it remains the cheapest way for a small business to reach exactly the person who can say yes — but only the version that respects the reader. The emails that get replies are short, specific about why this recipient, clear about the one thing being asked, and free of the padding (\"I hope this email finds you well\") that signals mass mail before the first comma.",
      "This writer is built around those rules. It produces an email under 120 words with a personalisation placeholder in [brackets] where you drop in the one detail you know about the recipient, a single value proposition framed around their pain point rather than your product, and one low-friction call to action matched to your goal. You also get a subject line under 50 characters — the length that survives mobile inboxes — and a two-sentence follow-up for three days later, because a large share of replies come from the polite nudge, not the first send.",
      "The placeholder is not optional decoration: filling it with something real (\"saw you're hiring three payroll executives\") is the difference between outreach and spam, in both results and reputation. Send individually or through a proper outreach tool, keep volumes modest, and honour opt-outs — India's spam norms and your domain's deliverability both depend on it.",
    ],
    faq: [
      {
        question: "How long should a cold email ideally be?",
        answer:
          "Under 120 words. Busy people triage emails on their phone; a screen-length email that makes one clear point outperforms a pitch essay every single time.",
      },
      {
        question: "Do follow-up emails really matter?",
        answer:
          "Enormously — a short, polite follow-up 2-4 days later often doubles total reply rates. One or two follow-ups shows persistence; five follow-ups crosses into pestering.",
      },
      {
        question: "How do I personalise cold emails at scale?",
        answer:
          "Keep the body templated and spend your time on the [bracketed] opening line — include one specific, verifiable detail per recipient. Ten well-personalised emails will beat a hundred generic ones.",
      },
      {
        question: "What makes a good cold email subject line?",
        answer:
          "Keep it short (under 50 characters), casual, and highly relevant. It should read like an internal email from a colleague rather than a marketing newsletter.",
      },
      {
        question: "Should I include links or attachments in my first email?",
        answer:
          "Avoid them if possible. Links and attachments in cold emails trigger spam filters. Your only goal in the first email is to get a reply; you can send links once they respond.",
      }
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
    seoTitle: "Free AI Social Media Post Generator with Hashtags",
    keywords: [
      "ai social media post generator",
      "social media post generator",
      "instagram caption generator",
      "facebook post generator",
      "tweet generator",
      "social media caption writer",
      "post ideas with hashtags",
      "free social media content generator",
    ],
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
    directAnswer: "The AI Social Media Post Generator is a free tool that creates three distinct, platform-optimised posts with hooks and hashtags for Instagram, Facebook, and X (Twitter).",
    example: "Input: 'Delivered our 1,000th order' for 'Instagram' (Playful tone) → Output: Three tailored captions with scroll-stopping hooks and 5-8 relevant hashtags.",
    steps: [
      "Describe the topic or milestone you want to post about.",
      "Select the social media platform (Instagram, Facebook, or X).",
      "Choose a tone and optionally add a call to action.",
      "Click 'Generate posts' to get three different caption variants."
    ],
    about: [
      "This generator turns a one-line description of a moment into three ready-to-post captions in seconds — the product photo is taken, the moment is worth sharing, and this replaces the fifteen minutes that usually evaporate deciding how to say it. Posting consistently is the whole game on social media, since the algorithm rewards accounts that show up, yet for most business owners the caption is the daily blocker.",
      "Each variant is built for how feeds actually work: a first line that stops the scroll (on Instagram only the opening words show before \"more\"; on X the whole post is the hook), short paragraphs with breathing room rather than a wall of text, your call to action woven in naturally, and a set of 5-8 hashtags that mix broad reach with niche relevance. Three variants matter because tone is a choice — the same milestone can be told as a thank-you, a behind-the-scenes story, or a punchy announcement, and seeing all three makes the right one obvious.",
      "A sustainable workflow for a small team: once a week, batch-generate posts for the moments you know are coming — product highlights, customer stories, tips from your expertise, festival greetings — edit each lightly to add a specific detail, and schedule them. Fifteen minutes of batching replaces a daily struggle, and the consistency compounds into reach.",
    ],
    faq: [
      {
        question: "How many hashtags should I actually use per post?",
        answer:
          "For Instagram, aim for 5-8 relevant ones mixing broad and niche tags. For X (Twitter), stick to 1-2. For Facebook, use few or none. Relevance always beats volume — 30 scattergun hashtags reads as spam.",
      },
      {
        question: "What exactly makes the first line a good hook?",
        answer:
          "Specificity and tension: a number, a bold claim, or a question the audience genuinely feels. '1,000 orders. Zero paid ads.' dramatically outperforms 'We are pleased to announce a milestone.'",
      },
      {
        question: "Should I post the exact same caption on every platform?",
        answer:
          "No, you should adapt it. Lengths, hashtag norms, and overall tone differ across platforms. It's better to generate per platform rather than cross-posting one generic caption everywhere.",
      },
      {
        question: "Will the AI include emojis in the captions?",
        answer:
          "Yes, the generator will include a restrained amount of contextually relevant emojis to break up the text and add visual interest, matching the tone you select.",
      },
      {
        question: "What should I put in the 'Call to action' field?",
        answer:
          "Keep it simple and direct. Good examples include 'Link in bio to shop', 'Drop a comment below', 'DM us for details', or 'Save this post for later'.",
      }
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
    seoTitle: "Free AI Business Name Generator: 15 Brandable Ideas",
    keywords: [
      "ai business name generator",
      "business name generator",
      "company name generator",
      "brand name ideas",
      "startup name generator",
      "shop name ideas",
      "brandable name generator",
      "free business name generator",
      "how to name a business",
    ],
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
    directAnswer: "The AI Business Name Generator is a free tool that brainstorms 15 distinct business name ideas across descriptive, brandable, and evocative styles.",
    example: "Input: 'Organic cold-pressed oils' → Output: 15 names like 'PurePress' (brandable) or 'Harvest & Root' (evocative), each with a one-line rationale.",
    steps: [
      "Describe exactly what your business does.",
      "Add any specific keywords or themes you want included.",
      "Choose a naming style (modern, classic, playful, or mixed).",
      "Click 'Generate names' to receive 15 structured ideas."
    ],
    about: [
      "This generator provides fifteen business name ideas per run, organised into the three families professional namers actually use. Naming a business is a strange task — it matters enormously, it's nearly impossible to do on demand, and every candidate sounds wrong after you've stared at it for an hour — and the way out is volume and structure: seeing many names across distinct strategies rather than circling the same three words on a notepad.",
      "Descriptive names (what you do, said plainly) buy instant comprehension and help search, at the cost of distinctiveness. Invented, brandable names (think coined words with good mouthfeel) are ownable and trademark-friendly but need marketing to acquire meaning. Evocative names borrow an image or feeling adjacent to your category — they're memorable and flexible as you grow. Each suggestion comes with a one-line rationale so you're choosing between strategies, not just sounds, and the generator favours short, hyphen-free names that stand a realistic chance of an available .com or .in domain.",
      "Shortlist three to five, then do the unglamorous checks before falling in love: domain availability, the MCA company-name search if you'll incorporate, a trademark search on ipindia.gov.in, social handle availability, and — often forgotten — how it sounds spoken aloud on a phone call. Run the generator a few times with different keyword nudges; the second and third batches are frequently where the winner appears.",
    ],
    faq: [
      {
        question: "Descriptive or brandable names — which is better?",
        answer:
          "Descriptive names communicate instantly but blend in; brandable names stand out but need marketing to explain. Early-stage businesses that rely on search often start descriptive, while brands built on distinctiveness go invented or evocative.",
      },
      {
        question: "What should I check before committing to a name?",
        answer:
          "Check domain and social handle availability, do an MCA name search (for incorporation), run a trademark search (e.g., on ipindia.gov.in), and perform the say-it-aloud test. Do all four before printing anything.",
      },
      {
        question: "The generated names don't feel right — what now?",
        answer:
          "Regenerate with different keyword nudges and a tighter description. Naming is a volume game; most founders pick their final name from batch three or four, not the very first batch.",
      },
      {
        question: "Does the generator check if the domains are available?",
        answer:
          "No, the AI generates the ideas but does not perform live domain availability checks. Once you shortlist your top 3-5 names, you should check domain registrars directly.",
      },
      {
        question: "Can I use multiple keywords?",
        answer:
          "Yes, you can enter multiple keywords separated by commas (e.g., 'trust, speed, local'). The AI will attempt to weave those themes into the generated names.",
      }
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
      "Free AI tagline generator. Describe your business and value proposition to get 12 slogan options in ultra-short, medium and wordplay styles.",
    seoTitle: "Free AI Tagline Generator: Slogan Ideas for Your Brand",
    keywords: [
      "ai tagline generator",
      "tagline generator",
      "slogan generator",
      "business slogan maker",
      "brand tagline ideas",
      "catchy slogan generator",
      "company tagline generator",
      "free slogan generator",
    ],
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
    directAnswer: "The AI Tagline Generator is a free tool that creates 12 distinct tagline and slogan options across different lengths and styles for your brand.",
    example: "Input: 'Postbox courier aggregator' → Output: 12 options ranging from ultra-short (e.g., 'Ship simpler') to medium and wordplay formats.",
    steps: [
      "Enter your business or product name.",
      "Briefly state your core value proposition or what makes you unique.",
      "Select a tone that matches your brand identity.",
      "Click 'Generate taglines' to receive 12 varied options."
    ],
    about: [
      "A tagline is your brand's shortest piece of writing and its hardest: a handful of words that must say what you do, how you're different, or how you make people feel — ideally two of the three. The classics feel inevitable in hindsight (\"Just Do It\", \"Utterly Butterly Delicious\"), but they were picked from long lists of candidates, not conjured in one stroke. Volume, then selection, is how taglines actually get written.",
      "This generator gives you that volume with structure: twelve options per run, deliberately spread across three formats. Ultra-short lines (2-4 words) fit logos, packaging and app store subtitles. Medium lines (5-8 words) suit website heroes and ad copy where you can afford a full thought. And wordplay lines — rhythm, alliteration, a twist on a familiar phrase — trade explicitness for memorability. The prompt explicitly bans the exhausted startup vocabulary (\"unlock\", \"unleash\", \"elevate\", \"empower\"), which removes half of what generic tools produce.",
      "Shortlist by saying candidates aloud and imagining them under your logo, on your packaging, at the end of an ad. Check that nobody prominent in your category already uses something close — a quick search plus a look at the trademark registry for anything you'll print at scale. And prefer the line that's true over the line that's clever: a tagline your business can't live up to is a complaint generator.",
    ],
    faq: [
      {
        question: "What actually makes a good tagline?",
        answer:
          "It should be short enough to remember, specific enough to mean something, and true enough to keep. Aim to cover two of these three: what you do, how you differ, and how it feels. Always test by saying it aloud next to your brand name.",
      },
      {
        question: "Tagline vs slogan — is there a difference?",
        answer:
          "Yes. A tagline is the durable, long-term line attached to the brand itself, while a slogan often belongs to just one specific marketing campaign. The generator's output works for both.",
      },
      {
        question: "Can I legally trademark a generated tagline?",
        answer:
          "Yes, if it's distinctive and used in trade — many taglines are registered marks. You should always search the trademark registry (like ipindia.gov.in) before investing heavily in printing one.",
      },
      {
        question: "Why does the tool generate options in different lengths?",
        answer:
          "Different placements require different lengths. A 2-word tagline fits well under a logo or on a tiny app icon, whereas an 8-word tagline works perfectly as a hero heading on your website.",
      },
      {
        question: "What if the generated taglines sound too generic?",
        answer:
          "If they sound generic, it usually means the 'value proposition' field was too broad. Try entering a very specific detail, like 'we deliver in 10 minutes' instead of 'fast delivery'.",
      }
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
    seoTitle: "Free AI Email Reply Generator: Professional Replies",
    keywords: [
      "ai email reply generator",
      "email reply generator",
      "email response generator",
      "reply to email with ai",
      "professional email reply",
      "customer email reply writer",
      "free email reply writer",
      "how to reply to an email professionally",
    ],
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
    directAnswer: "The AI Email Reply Generator is a free tool that reads an incoming email and crafts a polite, professional response based on your chosen intent and tone.",
    example: "Input: An angry client email + Intent 'apologise but hold the boundary' → Output: A 100-word calm response that acknowledges the issue without over-promising.",
    steps: [
      "Paste the exact email you received.",
      "Write a short sentence about what you want your reply to convey.",
      "Select the tone (e.g., professional, friendly, firm, or apologetic).",
      "Click 'Write reply' to get a ready-to-send draft."
    ],
    about: [
      "This tool turns an email you need to answer into a ready-to-send reply: paste the email you received, state your intent in plain words, pick a tone, and get a polished draft. Some emails take longer to answer than the work they're about — the awkward decline, the payment reminder to a good client, the apology that mustn't over-apologise, the firm no that mustn't burn the bridge — because the labour is finding words that carry the message at the right temperature, not deciding what to say.",
      "The generator reads the original email, so the reply actually engages with it: every question asked gets answered, names and specifics are acknowledged, and the response addresses what was said rather than being a generic template with the blanks filled. Replies come out under 150 words — the length busy people read — structured as considerate professionals write: acknowledge, respond, state next step, sign off.",
      "The four tones cover the situations that generate real hesitation. \"Firm but polite\" holds a boundary — a scope-creep pushback, a rate negotiation — without aggression. \"Apologetic\" owns a mistake credibly without grovelling. Before sending, do the thirty-second pass every generated draft deserves: check names, verify any dates or amounts, and add one human touch only you could know. Your text is processed only to produce the reply and never stored, but as with any tool, trim truly sensitive details you don't need to include.",
    ],
    faq: [
      {
        question: "Will the reply address the specific points in the original email?",
        answer:
          "Yes — the original email is part of the prompt, so questions asked in it are explicitly answered and its specifics are acknowledged. However, always verify names, dates, and amounts before sending.",
      },
      {
        question: "Is the email text I paste stored anywhere?",
        answer:
          "No. The text is sent securely to the AI service solely to generate your reply and is not stored by this site. Still, it's good practice to remove highly sensitive data before pasting.",
      },
      {
        question: "When should I use the 'firm' tone?",
        answer:
          "Use 'firm' for boundary situations: chasing overdue payments, declining scope creep, or pushing back on unreasonable terms. It keeps the relationship professional but avoids apology-padding.",
      },
      {
        question: "Can it handle long, multi-question emails?",
        answer:
          "Yes, the AI will extract the key questions from long emails and ensure they are all addressed in a structured, easy-to-read reply.",
      },
      {
        question: "Does it write the subject line too?",
        answer:
          "Typically, you will just hit 'Reply' in your email client so the subject line stays the same, so the generator focuses entirely on writing the perfect body copy.",
      }
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
    seoTitle: "Free AI LinkedIn Post Generator: Hooks & Hashtags",
    keywords: [
      "ai linkedin post generator",
      "linkedin post generator",
      "linkedin post writer",
      "linkedin content generator",
      "linkedin hook generator",
      "linkedin post ideas",
      "free linkedin post generator",
      "how to write a linkedin post",
    ],
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
    directAnswer: "The AI LinkedIn Post Generator is a free tool that turns a business insight or milestone into a formatted, professional post optimised specifically for the LinkedIn feed.",
    example: "Input: 'Learned firing our biggest client' (Angle: Lesson) → Output: A post starting with a strong hook, broken into readable short paragraphs, closing with a question to drive comments.",
    steps: [
      "State the core topic or event you want to post about.",
      "Select an angle (e.g., lesson learned, story, contrarian take).",
      "Optionally specify your target audience.",
      "Click 'Generate post' to get a feed-ready draft with hashtags."
    ],
    about: [
      "LinkedIn is where business reputations compound quietly: a good post seen by two thousand relevant people does more for a consultant, founder or job-seeker than most paid campaigns. But LinkedIn writing is its own genre, with conventions that feel unnatural until learned — and this generator has learned them so you can start from a working draft instead of a blank box.",
      "The format it follows is the one that performs: a one-line hook, because only the first line or two shows before \"…see more\" and the click on that link is the whole battle; then short one-to-two-sentence paragraphs with real line breaks, since dense text dies on mobile; a concrete story or specific insight in the middle, because abstractions get scrolled past; a clear takeaway; and a closing question, because comments are what the algorithm feeds on. A restrained 3-5 hashtags sit at the very end, and emoji stay in single digits.",
      "The angles map to LinkedIn's evergreen genres — lessons learned, behind-the-scenes stories, contrarian takes, practical how-tos, milestones. The same topic works through several: one experience can yield a lesson post this week and a how-to next month. Edit the draft to add the numbers and names only you know (specificity is credibility on LinkedIn), post consistently rather than perfectly, and reply to early comments — the first hour's engagement decides the post's reach.",
    ],
    faq: [
      {
        question: "Why does the first line of a LinkedIn post matter so much?",
        answer:
          "The LinkedIn feed truncates posts after roughly two lines. Readers will only click 'see more' if the hook earns it. A specific number, tension, or bold claim dramatically outperforms a polite preamble.",
      },
      {
        question: "How often should I post on LinkedIn for best results?",
        answer:
          "Two to three times a week, sustained for months, beats a daily sprint that burns you out in three weeks. Batch-generate your drafts and refine one each morning.",
      },
      {
        question: "Do hashtags still matter on LinkedIn right now?",
        answer:
          "Yes, but modestly. Using 3-5 relevant hashtags helps categorisation without looking spammy. However, your first-hour engagement (especially comments) matters far more for algorithmic reach.",
      },
      {
        question: "Why does the generator use so many line breaks?",
        answer:
          "Because dense walls of text die on mobile screens, and most LinkedIn users browse on their phones. Short, one-to-two-sentence paragraphs with white space are proven to keep readers scrolling.",
      },
      {
        question: "Can I use the same post on Twitter or Facebook?",
        answer:
          "You can, but it's not ideal. LinkedIn has a very specific professional tone and formatting style. Use the Social Media Post Generator if you want variants tailored for other platforms.",
      }
    ],
    related: ["ai-social-media-post-generator", "ai-blog-outline-generator", "engagement-rate-calculator", "hashtag-generator"],
  },
  {
    kind: "ai-writer",
    slug: "ai-seo-title-generator",
    category: "ai-writers",
    name: "AI SEO Title Generator",
    tagline: "Ten click-worthy title tags, written for Google's 60-character window.",
    seoDescription:
      "Free AI SEO title generator. Enter your topic and keyword to get 10 title-tag options, each within 60 characters, across proven formats — with a top pick.",
    seoTitle: "Free AI SEO Title Generator: 10 Title Tags Under 60 Chars",
    keywords: [
      "ai seo title generator",
      "seo title generator",
      "meta title generator",
      "title tag generator",
      "blog title generator",
      "seo headline generator",
      "title tag under 60 characters",
      "free seo title generator",
    ],
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
    directAnswer: "The AI SEO Title Generator is a free tool that creates 10 highly clickable, search-optimised meta title tags written to fit Google's roughly 60-character limit, with each title's character count shown.",
    example: "Input: 'GST registration for freelancers' → Output: 10 options like 'GST Registration for Freelancers: 2026 Guide' (55 chars), categorized by search intent.",
    steps: [
      "Enter the core topic of your webpage or article.",
      "Enter the primary SEO keyword you want to rank for.",
      "Select the search intent (informational, commercial, or transactional).",
      "Click 'Generate titles' to get 10 precise options with character counts."
    ],
    about: [
      "The title tag does two jobs at once: it tells Google what the page is about, and it persuades a human scanning a results page to pick your link over nine others. Ranking without clicks is a moral victory — the title is where rankings turn into traffic, and small wording changes routinely move click-through rates by whole percentage points.",
      "This generator produces ten options engineered for both jobs. Each stays within the roughly 60-character window Google displays before truncating (the count is printed after every title so you can verify at a glance), places your primary keyword naturally and early where relevance signals count most, and matches the search intent you select — a how-to phrasing for informational queries, comparison framing for commercial ones. The ten deliberately span the formats that dominate result pages: how-to, listicle, question, comparison, and plain descriptive, because different queries reward different shapes. A marked top pick with reasoning saves you the tie-break.",
      "Two practices squeeze the most from it. First, write the title for the searcher, not the algorithm — keyword-stuffed titles get rewritten by Google anyway, and honest specificity (\"for freelancers\", \"in 2026\", \"with fees\") wins clicks from exactly the visitors you want. Second, revisit titles on pages that rank well but convert poorly on the results page; a title refresh is the cheapest CTR experiment in SEO. Preview how any candidate renders with the SERP snippet tool linked below.",
    ],
    faq: [
      {
        question: "How long should an SEO title tag be?",
        answer:
          "Aim for 50-60 characters. Google truncates titles around 600 pixels (roughly 60 characters), and cut-off titles lose clicks. Every generated option shows its character count so you can check instantly.",
      },
      {
        question: "Does the exact keyword have to be at the very start of the title?",
        answer:
          "Not strictly, but early placement helps both relevance signals for Google and scanning humans. The generator front-loads it where it reads naturally, never at the cost of sounding robotic.",
      },
      {
        question: "Why does Google sometimes rewrite my title in search results?",
        answer:
          "Google rewrites titles when it judges them unrepresentative — too keyword-stuffed, too vague, or duplicated across pages. Honest, specific, and unique titles get rewritten the least.",
      },
      {
        question: "What is search intent and why does it matter here?",
        answer:
          "Search intent is what the user actually wants. If they want a tutorial (informational intent), a 'How to' title wins. If they want to buy (transactional intent), 'Buy X' wins. The AI matches the title format to the intent.",
      },
      {
        question: "Should I include my brand name in the title?",
        answer:
          "Yes, usually at the end (e.g., '... | BrandName'). If your CMS automatically appends your brand name to titles, make sure the generated title plus your brand name stays under 60 characters.",
      }
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
    seoTitle: "Free AI FAQ Generator: Questions & Answers for Your Site",
    keywords: [
      "ai faq generator",
      "faq generator",
      "faq section generator",
      "frequently asked questions generator",
      "faq writer for website",
      "product faq generator",
      "questions and answers generator",
      "free faq generator",
    ],
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
    directAnswer: "The AI FAQ Generator is a free tool that automatically writes a list of customer-phrased Frequently Asked Questions and clear answers based on your product details.",
    example: "Input: 'Wedding photography in Jaipur' + 'packages from ₹75,000' → Output: 'What is the starting price for wedding packages?' with a detailed answer.",
    steps: [
      "Enter the product, service, or core topic.",
      "Paste any raw key details, pricing, or policies to draw from.",
      "Select how many questions you want to generate.",
      "Click 'Generate FAQ' for a ready-to-publish FAQ section."
    ],
    about: [
      "A good FAQ section quietly does four jobs: it answers the pre-sales doubts that stop people buying, it deflects the repetitive emails and calls that eat your day, it reassures hesitant visitors that you've thought about their situation, and it feeds search engines exactly the question-shaped queries people type. Yet most businesses never write one, because generating the questions — seeing your own offering through a stranger's eyes — is genuinely hard from the inside.",
      "That outside view is what this generator supplies. Describe what you offer, paste whatever key details you have (prices, timelines, policies — rough notes are fine), and it produces customer-phrased questions with clear, honest answers drawn from those details. It deliberately includes the two questions every buyer has and every business hesitates to answer — the cost question and the \"how do you compare to the alternative\" question — because answering them on your terms beats letting a competitor's page do it.",
      "Review the output for factual accuracy (it writes from what you gave it, so wrong inputs make wrong answers), adjust anything policy-sensitive, and publish. For an SEO bonus, mark the section up with FAQPage structured data so eligible questions can appear directly in search results — and revisit quarterly: the emails you still receive are the questions your FAQ is missing.",
    ],
    faq: [
      {
        question: "How many FAQs should a page ideally have?",
        answer:
          "Six to ten well-chosen questions beat twenty filler ones. Make sure to cover price, process, timing, the main customer objection, and the comparison question — then stop.",
      },
      {
        question: "Should I really answer the price question in an FAQ?",
        answer:
          "Yes, at least with a starting range. Visitors who can't find pricing assume the worst and leave. Saying 'packages start from ₹75,000' filters out bad leads and reassures good ones simultaneously.",
      },
      {
        question: "Do FAQs actually help with SEO?",
        answer:
          "Yes, meaningfully. They match the natural-language questions people type into Google. Furthermore, using FAQPage structured data on your site can surface your answers directly on Google search results pages.",
      },
      {
        question: "Will the AI make up answers if I don't provide details?",
        answer:
          "The AI will try to give general best-practice answers if you don't provide specifics, but for the best results, you should paste your actual policies, prices, and timelines into the 'Key details' field.",
      },
      {
        question: "How do I know what questions my customers are asking?",
        answer:
          "The AI is trained on common consumer behaviour, so it will predict standard objections. However, the best source is always your own inbox — whatever customers email you about should be an FAQ.",
      }
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
      "Free AI job description generator. Enter a role, experience level and skills to get a structured, recruitment-ready JD in seconds. No sign-up needed.",
    seoTitle: "Free AI Job Description Generator: JD Maker",
    keywords: [
      "ai job description generator",
      "job description generator",
      "jd generator",
      "job description template",
      "job posting generator",
      "job ad generator",
      "hiring job description writer",
      "free jd maker",
      "how to write a job description",
    ],
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
    directAnswer: "The AI Job Description Generator is a free tool that creates professional, structured, and recruitment-ready job postings from just a role title and required skills.",
    example: "Input: 'Senior React Developer' + '5 years experience' + 'React, Node' → Output: A complete JD with summary, responsibilities scaled to seniority, and qualifications.",
    steps: [
      "Enter the job role or title.",
      "Select the required experience level.",
      "List the mandatory technical and soft skills.",
      "Optionally add company info and extra duties, then click 'Generate job description'."
    ],
    about: [
      "This generator turns three facts you already know — the role, the experience level, the skills you need — into a professional, structured job description in under a minute. Most job descriptions are otherwise either copied from a competitor or dashed off in ten minutes, and both show up in your applications: a vague description attracts under-qualified candidates, while a padded one sets expectations nobody can meet.",
      "A job description works as two things at once: an advertisement that sells the role to good candidates, and a filter that discourages the wrong ones. That's why structure matters. Ten sections cover the ground a candidate actually checks — a summary of what the job is and why it matters, an overview of the day-to-day, five to eight specific responsibilities scaled to the experience level, the skills grouped sensibly, and honest qualifications. Setting expectations early pays off: candidates who self-select out at the application stage cost you nothing; discovering the mismatch after an interview costs you days.",
      "The generator writes from your inputs only. If you don't provide company information, industry or benefits, it says nothing about them rather than inventing them — the How to Apply section ends with a placeholder where you add your real contact details. That anti-fabrication rule is deliberate: a job description that invents a benefit or a salary strand someone to withdraw, or worse, to a claim they didn't make. Add the facts in your own words after generating, and tailor the responsibilities to the actual scope of the role before posting.",
      "The tool is free and requires no account. For the rest of the hiring workflow — offer letters, appointment letters and experience letters — the EBOS HR module covers the full employee lifecycle from the same foundation.",
    ],
    faq: [
      {
        question: "What exactly do I need to provide to generate a JD?",
        answer:
          "Just three mandatory things: the job role or title, the experience level, and the required skills. Industry, company information, and extra responsibilities are optional but make the output more tailored.",
      },
      {
        question: "Will the AI invent salary, benefits, or contact details?",
        answer:
          "No. The generator is strictly instructed to write only from what you provide and never to fabricate salary, benefits, or contact addresses. It leaves placeholders for you to fill in those details.",
      },
      {
        question: "Can I post the output directly to job boards like LinkedIn or Indeed?",
        answer:
          "Largely, yes. However, you should always fill the placeholders, check that the responsibilities match the real scope of the role, and review it for compliance with local hiring laws before posting.",
      },
      {
        question: "Are the generated responsibilities realistic for the role?",
        answer:
          "Yes, they are scaled to match the experience level you selected. A manager role will feature leadership duties, while an entry-level role will focus on learning and execution. Always adjust lines that don't fit perfectly.",
      },
      {
        question: "Is this job description generator completely free?",
        answer:
          "Yes, the tool is completely free and requires no account or sign-up. It's designed to help founders and HR teams save hours of drafting time.",
      }
    ],
    related: ["offer-letter-generator", "experience-letter-generator", "ai-linkedin-post-generator", "salary-calculator"],
  },
];
