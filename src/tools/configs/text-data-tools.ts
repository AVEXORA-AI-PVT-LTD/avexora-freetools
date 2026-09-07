import type { ToolConfig } from "../../types/tools";
import { computeWordCount } from "../compute/text/word-counter";
import { computeCharacterCount } from "../compute/text/character-counter";
import { convertCase } from "../compute/text/case-converter";
import { formatJson } from "../compute/text/json-formatter";
import { csvToJson } from "../compute/text/csv-to-json";
import { jsonToCsv } from "../compute/text/json-to-csv";
import { generateDiff } from "../compute/text/text-diff-checker";
import { generateLoremIpsum } from "../compute/text/lorem-ipsum-generator";
import { generatePassword } from "../compute/text/password-generator";
import { removeDuplicateLines } from "../compute/text/remove-duplicate-lines";
import { sortText } from "../compute/text/text-sorter";
import { findAndReplace } from "../compute/text/find-and-replace";

export const tools: ToolConfig[] = [
  {
    kind: "calculator",
    slug: "word-counter",
    category: "text-data-tools",
    name: "Word Counter",
    tagline:
      "Count words, characters, sentences and reading time as you type.",
    seoDescription:
      "Free online word counter. Instantly count words, characters (with and without spaces), sentences, paragraphs, reading time and speaking time for any text.",
    fields: [
      {
        name: "text",
        label: "Your text",
        type: "textarea",
        placeholder: "Paste or type your text here…",
        rows: 10,
        optional: true,
      },
    ],
    compute: computeWordCount,
    autoCompute: true,
    about: [
      "Whether you're writing a blog post with a target length, a meta description with a character limit, a college essay with a word requirement, or a speech that has to fit a time slot, you need live counts while you write. Paste or type your text above and every metric updates instantly as you edit — words, characters with and without spaces, sentences, paragraphs, reading time and speaking time. Nothing is uploaded or stored; the counting happens entirely in your browser, so it's safe for confidential drafts and works even on a flaky connection.",
      "Word count is based on whitespace-separated words, the same standard used by Google Docs, Microsoft Word and most content platforms, so the number you see here will match what your editor reports. Sentence count looks for terminal punctuation, and paragraph count treats blank lines as separators. Reading time assumes an average silent reading speed of 225 words per minute, and speaking time assumes 130 words per minute — the comfortable pace of a typical presentation, which is useful when you're preparing a talk, a webinar script or a wedding speech.",
      "Some common targets to write against: SEO blog posts usually run 1,000–2,000 words, meta descriptions should stay under 160 characters, tweets cap at 280 characters, LinkedIn posts truncate around 1,300 characters, and a 5-minute talk is roughly 650 spoken words. Keep this page open in a tab and paste as you go.",
    ],
    faq: [
      {
        question: "How is the word count calculated?",
        answer:
          "Text is split on spaces, tabs and line breaks, and each separated token counts as one word — the same method used by Google Docs and most writing tools.",
      },
      {
        question: "Is my text stored anywhere?",
        answer:
          "No. Counting runs entirely in your browser using JavaScript. Your text never leaves your device and is gone when you close the page.",
      },
      {
        question: "How accurate is the reading time estimate?",
        answer:
          "It uses the widely accepted average of 225 words per minute for silent reading. Actual speed varies by reader and content difficulty, so treat it as a good approximation.",
      },
    ],
    related: ["character-counter", "case-converter", "text-diff-checker", "ai-blog-outline-generator"],
  },
  {
    kind: "calculator",
    slug: "character-counter",
    category: "text-data-tools",
    name: "Character Counter",
    tagline: "Count characters with and without spaces, live as you type.",
    seoDescription:
      "Free character counter. Count characters with and without spaces, words and lines instantly — perfect for SMS, tweets, meta descriptions and ad copy limits.",
    fields: [
      { name: "text", label: "Your text", type: "textarea", placeholder: "Paste or type your text here…", rows: 8, optional: true },
    ],
    compute: computeCharacterCount,
    autoCompute: true,
    about: [
      "Half of modern writing happens against a character limit: 160 characters for an SMS, 280 for a post on X, 150–160 for a meta description, 30 for a Google Ads headline, 125 before an Instagram caption truncates. This counter gives you the number that actually matters — characters, counted live as you type or paste, with a separate count that excludes spaces for platforms and forms that measure that way.",
      "Everything runs in your browser: nothing you paste is uploaded, stored or seen by anyone, which makes it safe for confidential text like legal clauses, ad copy under NDA or personal messages. Words and lines are counted alongside characters so you don't need a second tool when a form limits by words instead.",
      "A few limits worth memorising: Google typically displays 50–60 characters of a title tag and around 155–160 of a meta description before cutting off; X allows 280 characters (URLs count as 23); LinkedIn headlines cap at 220; SMS messages beyond 160 characters are split and billed as multiple messages; and WhatsApp Business template bodies allow 1,024. When you're right at the edge, remember that emoji and some symbols count as two or more characters on many platforms — trim a little below the limit for safety.",
    ],
    faq: [
      {
        question: "Do spaces count as characters?",
        answer:
          "Usually yes — SMS, X/Twitter and meta descriptions all count spaces. Some forms measure without spaces, so the counter shows both figures side by side.",
      },
      {
        question: "Why does my emoji count as more than one character?",
        answer:
          "Emoji and many special symbols are stored as multiple code units, and platforms differ in how they count them. If your text contains emoji, stay a few characters under the limit to be safe.",
      },
      {
        question: "Is my text stored anywhere?",
        answer: "No — counting happens entirely in your browser and your text never leaves your device.",
      },
    ],
    related: ["word-counter", "case-converter", "find-and-replace", "meta-tag-generator"],
  },
  {
    kind: "generator",
    slug: "case-converter",
    category: "text-data-tools",
    name: "Case Converter",
    tagline: "Convert text to UPPERCASE, lowercase, Title Case, camelCase, snake_case and more.",
    seoDescription:
      "Free online case converter. Change text to uppercase, lowercase, title case, sentence case, camelCase, PascalCase, snake_case or kebab-case in one click.",
    fields: [
      { name: "text", label: "Your text", type: "textarea", placeholder: "Paste the text to convert…", rows: 6 },
      {
        name: "mode",
        label: "Convert to",
        type: "select",
        defaultValue: "title",
        options: [
          { value: "upper", label: "UPPERCASE" },
          { value: "lower", label: "lowercase" },
          { value: "title", label: "Title Case" },
          { value: "sentence", label: "Sentence case" },
          { value: "camel", label: "camelCase" },
          { value: "pascal", label: "PascalCase" },
          { value: "snake", label: "snake_case" },
          { value: "kebab", label: "kebab-case" },
        ],
      },
    ],
    generate: convertCase,
    submitLabel: "Convert",
    about: [
      "Retyping text because it arrived in the wrong case is a small, constant tax on anyone who writes or codes. This converter fixes it in one click: paste the text, pick the target case, convert, and copy the result. It handles the everyday writing cases — UPPERCASE for headings and legal emphasis, lowercase to calm down text typed with caps lock on, Title Case for headlines, and Sentence case to restore normal prose capitalisation after each full stop.",
      "It's equally at home with the four programmer cases. camelCase (first word lowercase, subsequent words capitalised) is standard for JavaScript and Java variables; PascalCase for class and component names; snake_case for Python variables, database columns and constants; kebab-case for URLs, CSS classes and file names. The converter is smart about word boundaries: it splits on spaces and punctuation and also recognises existing camelCase humps, so pasting a variable name like userEmailAddress and choosing snake_case correctly produces user_email_address rather than one long word.",
      "Typical uses: cleaning up copy pasted from a PDF or an email written in caps, renaming a batch of identifiers when moving code between languages with different conventions, generating a slug-style kebab-case string for a URL, or standardising product names in a spreadsheet before import. Everything runs locally in your browser and nothing is stored.",
    ],
    faq: [
      {
        question: "What's the difference between Title Case and Sentence case?",
        answer:
          "Title Case Capitalises Every Word, as in a headline. Sentence case capitalises only the first word of each sentence, like ordinary prose. This tool applies simple rules and doesn't lowercase minor words (a, of, the) the way some editorial styles do — review headlines before publishing.",
      },
      {
        question: "How does camelCase conversion decide word boundaries?",
        answer:
          "The text is split on spaces and punctuation, and existing camelCase humps are also detected — so both \"user email\" and \"userEmail\" convert cleanly to user_email in snake_case.",
      },
      {
        question: "Can I convert code identifiers in bulk?",
        answer:
          "Yes — paste one identifier per line and convert; the case is applied line by line since line breaks are punctuation boundaries. For project-wide renames, use your IDE's refactoring tools instead.",
      },
    ],
    related: ["word-counter", "find-and-replace", "text-sorter", "slug-generator"],
  },
  {
    kind: "generator",
    slug: "json-formatter",
    category: "text-data-tools",
    name: "JSON Formatter",
    tagline: "Pretty-print, validate or minify JSON instantly in your browser.",
    seoDescription:
      "Free JSON formatter and validator. Pretty-print JSON with 2 or 4-space indentation, minify it for production, and get clear error messages for invalid JSON.",
    fields: [
      { name: "json", label: "JSON input", type: "textarea", placeholder: '{"name":"Avexora","tools":120}', rows: 10 },
      {
        name: "mode",
        label: "Output",
        type: "select",
        defaultValue: "pretty2",
        options: [
          { value: "pretty2", label: "Pretty-print (2 spaces)" },
          { value: "pretty4", label: "Pretty-print (4 spaces)" },
          { value: "minify", label: "Minify" },
        ],
      },
    ],
    generate: formatJson,
    submitLabel: "Format",
    about: [
      "JSON is how systems talk to each other — API responses, configuration files, webhooks, exports — but machines emit it as a single unreadable line. This formatter turns that line into cleanly indented, human-readable structure in one click, or does the reverse: minifying a formatted document back to its most compact form for production payloads.",
      "It's also a validator. The formatter parses your input with the same strict rules every JSON consumer uses, so if there's a problem — a trailing comma, single quotes instead of double, an unquoted key, a stray character — you get the parser's actual error message instead of a silent failure later in your pipeline. Fixing JSON here is much faster than deploying and reading a stack trace.",
      "Formatting runs entirely in your browser: API keys, customer records and internal payloads never leave your machine, which is exactly what you want when debugging production data. Use 2-space indentation (the JavaScript ecosystem default) for reading and code reviews, 4-space when you'll be scanning deeply nested structures, and minify when every byte counts. A practical debugging loop: paste the response from your API client, format to inspect the structure, edit the value you're testing, then minify and send it back. The output downloads as a .json file when it's too large to comfortably copy.",
    ],
    faq: [
      {
        question: "Why is my JSON invalid?",
        answer:
          "The usual culprits: trailing commas after the last item, single quotes instead of double quotes, unquoted property names, comments (JSON doesn't allow them), and smart quotes pasted from documents. The error message points at the position of the first problem.",
      },
      {
        question: "Is my JSON uploaded anywhere?",
        answer:
          "No. Parsing and formatting run entirely in your browser with JavaScript's native JSON engine — safe for payloads containing keys, tokens or customer data.",
      },
      {
        question: "When should I minify JSON?",
        answer:
          "For production traffic and storage: minified JSON strips all whitespace, cutting payload size meaningfully on large documents. Keep the pretty version for humans, ship the minified one to machines.",
      },
    ],
    related: ["csv-to-json", "json-to-csv", "json-to-typescript", "base64-encoder-decoder", "jwt-decoder"],
  },
  {
    kind: "generator",
    slug: "csv-to-json",
    category: "text-data-tools",
    name: "CSV to JSON Converter",
    tagline: "Turn spreadsheet CSV data into a clean JSON array.",
    seoDescription:
      "Free CSV to JSON converter. Paste CSV with comma, semicolon or tab delimiters and get a JSON array — handles quoted fields and header rows correctly.",
    fields: [
      { name: "csv", label: "CSV input", type: "textarea", placeholder: "name,email,city\nAsha,asha@example.com,Pune", rows: 8 },
      {
        name: "delimiter",
        label: "Delimiter",
        type: "select",
        defaultValue: "comma",
        options: [
          { value: "comma", label: "Comma (,)" },
          { value: "semicolon", label: "Semicolon (;)" },
          { value: "tab", label: "Tab" },
        ],
      },
      { name: "header", label: "First row is a header", type: "checkbox", defaultValue: true },
    ],
    generate: csvToJson,
    submitLabel: "Convert",
    about: [
      "CSV is the language of spreadsheets; JSON is the language of APIs and applications. Moving data from one world to the other is a constant chore — importing a customer list into a web app, seeding a database from an Excel export, feeding spreadsheet data to a script. This converter does it properly: paste your CSV, choose the delimiter, and get a JSON array ready to use.",
      "\"Properly\" matters, because naive converters split on every comma and mangle real-world data. This one implements the actual CSV quoting rules: fields wrapped in double quotes can contain commas, line breaks and escaped quotes (\"\") without breaking the structure — so an address like \"12, MG Road, Pune\" stays one field. Excel and Google Sheets both export in this format, and European locales that export with semicolons are covered by the delimiter option, as are tab-separated files.",
      "With the header option on (the default), the first row supplies the JSON keys and each subsequent row becomes an object — the shape almost every API and import script expects. Turn it off and you get an array of arrays instead, useful for positional data. Conversion happens entirely in your browser, so customer lists and financial exports never touch a server. For the reverse direction, the JSON to CSV converter linked below turns API output back into a spreadsheet-friendly file.",
    ],
    faq: [
      {
        question: "My data has commas inside values — will it break?",
        answer:
          "No, as long as those fields are quoted (Excel and Google Sheets quote them automatically on export). The parser follows standard CSV quoting rules, including escaped quotes inside quoted fields.",
      },
      {
        question: "What does the header option do?",
        answer:
          "When on, the first row's values become the JSON keys and each data row becomes an object like {\"name\": \"Asha\"}. When off, every row becomes a plain array of strings.",
      },
      {
        question: "My file uses semicolons — why?",
        answer:
          "Locales that use the comma as a decimal separator (much of Europe) export CSV with semicolons instead. Pick the semicolon delimiter and it converts identically.",
      },
    ],
    related: ["json-to-csv", "json-formatter", "text-sorter", "remove-duplicate-lines"],
  },
  {
    kind: "generator",
    slug: "json-to-csv",
    category: "text-data-tools",
    name: "JSON to CSV Converter",
    tagline: "Flatten a JSON array into spreadsheet-ready CSV.",
    seoDescription:
      "Free JSON to CSV converter. Paste a JSON array of objects and get CSV with a header row — properly quoted for Excel and Google Sheets.",
    fields: [
      { name: "json", label: "JSON array input", type: "textarea", placeholder: '[{"name":"Asha","city":"Pune"},{"name":"Ravi","city":"Delhi"}]', rows: 8 },
    ],
    generate: jsonToCsv,
    submitLabel: "Convert",
    about: [
      "APIs speak JSON, but analysis happens in spreadsheets. When you need to eyeball an API response, share data with a colleague who lives in Excel, or import records into accounting software, converting a JSON array to CSV is the bridge. Paste an array of objects and this tool produces a CSV with a header row assembled from the objects' keys, one line per record, ready to save and open in any spreadsheet application.",
      "The conversion handles the details that trip up hand-rolled scripts. Keys are collected across all objects, not just the first — so records with missing or extra fields still line up in the right columns, with blanks where a value is absent. Values containing commas, quotes or line breaks are wrapped and escaped per the CSV standard, so a note field with an embedded comma won't shift every subsequent column. The output downloads as a .csv file that Excel, Google Sheets and LibreOffice open directly.",
      "One honest limitation: CSV is a flat, two-dimensional format, and deeply nested JSON doesn't flatten unambiguously. This converter expects an array of reasonably flat objects — the shape most list APIs return. If your objects contain nested objects or arrays, those values are serialised as JSON strings in their cell rather than exploded into extra columns, keeping the conversion lossless. Everything runs in your browser; your data is never uploaded.",
    ],
    faq: [
      {
        question: "What JSON shape does the converter expect?",
        answer:
          "An array of objects — the standard shape of API list responses. Each object becomes one CSV row and the union of all keys becomes the header row.",
      },
      {
        question: "What happens to nested objects or arrays?",
        answer:
          "They're kept as JSON strings inside their cell rather than expanded into columns, so no data is lost. Flatten nested structures upstream if you need them as separate columns.",
      },
      {
        question: "Will Excel open the output correctly?",
        answer:
          "Yes — fields containing commas, quotes or line breaks are quoted and escaped per the CSV standard that Excel, Google Sheets and LibreOffice all follow.",
      },
    ],
    related: ["csv-to-json", "json-formatter", "text-diff-checker", "word-counter"],
  },
  {
    kind: "generator",
    slug: "text-diff-checker",
    category: "text-data-tools",
    name: "Text Diff Checker",
    tagline: "Compare two texts line by line and see exactly what changed.",
    seoDescription:
      "Free text diff checker. Paste two versions of any text and see a line-by-line comparison with additions and removals clearly marked — all in your browser.",
    fields: [
      { name: "original", label: "Original text", type: "textarea", placeholder: "Paste the original version…", rows: 8 },
      { name: "changed", label: "Changed text", type: "textarea", placeholder: "Paste the new version…", rows: 8 },
    ],
    generate: generateDiff,
    submitLabel: "Compare",
    about: [
      "\"What exactly did they change?\" — the question behind every contract revision, edited article, updated policy and reworked email. Reading two versions side by side and spotting differences by eye is slow and unreliable; this tool does it mechanically. Paste the original in the first box and the new version in the second, and you get a line-by-line report: unchanged lines plain, removed lines marked with a minus, added lines marked with a plus — the same convention developers have trusted in code diffs for decades.",
      "Under the hood it computes a longest-common-subsequence alignment, the classic diff algorithm, so it finds the minimal set of changes rather than declaring everything after the first difference \"changed\". Insert a paragraph in the middle of a document and the diff shows exactly that one insertion, with everything after it still recognised as unchanged.",
      "Typical uses: checking a supplier's \"minor updates\" to a contract before re-signing, verifying which clauses a landlord edited in a rent agreement, reviewing a colleague's changes to marketing copy, comparing two exports to find the records that differ, or confirming that a template you re-generated matches the old one. Since comparison runs entirely in your browser, it's safe for confidential documents — nothing is transmitted or stored. For prose with heavy rewording inside lines, split it into shorter lines or sentences first for a more granular result.",
    ],
    faq: [
      {
        question: "How do I read the diff output?",
        answer:
          "Lines starting with \"-\" exist only in the original (removed); lines starting with \"+\" exist only in the new version (added); lines with neither marker are identical in both.",
      },
      {
        question: "Does it show changes within a line?",
        answer:
          "The comparison is line-based: a line with any edit shows as the old line removed and the new line added. For finer granularity, break long paragraphs into one sentence per line before comparing.",
      },
      {
        question: "Is it safe for confidential contracts?",
        answer:
          "Yes — the comparison runs entirely in your browser. Neither version of your text is uploaded or stored anywhere.",
      },
    ],
    related: ["word-counter", "remove-duplicate-lines", "find-and-replace", "case-converter"],
  },
  {
    kind: "generator",
    slug: "lorem-ipsum-generator",
    category: "text-data-tools",
    name: "Lorem Ipsum Generator",
    tagline: "Generate placeholder text by paragraphs, sentences or words.",
    seoDescription:
      "Free lorem ipsum generator. Create classic placeholder text by paragraphs, sentences or words for mockups, designs and templates — copy or download instantly.",
    fields: [
      { name: "count", label: "How many", type: "number", defaultValue: 3, min: 1, max: 20 },
      {
        name: "unit",
        label: "Unit",
        type: "select",
        defaultValue: "paragraphs",
        options: [
          { value: "paragraphs", label: "Paragraphs" },
          { value: "sentences", label: "Sentences" },
          { value: "words", label: "Words" },
        ],
      },
    ],
    generate: generateLoremIpsum,
    submitLabel: "Generate",
    about: [
      "Lorem ipsum is the design world's standard placeholder text — scrambled, Latin-looking prose derived from a passage of Cicero, in continuous use since the days of metal typesetting. Its job is to look like real language (realistic word lengths, sentence rhythm and punctuation) while being meaningless, so that anyone reviewing a design judges the layout instead of stopping to read the words.",
      "This generator produces the classic text, starting with the traditional \"Lorem ipsum dolor sit amet\", in whichever quantity your layout needs: whole paragraphs for page mockups and CMS templates, individual sentences for card components and captions, or an exact word count for headlines and buttons with tight space constraints. Copy the output straight into Figma, a WordPress draft, an email template or a component library — or download it as a text file for repeated use.",
      "A practical tip from every designer who's been burned: replace placeholder text before anything ships. It helps to standardise on lorem ipsum precisely because it's instantly recognisable as unfinished — a stray English-looking sentence of dummy copy can slip through review, but \"consectetur adipiscing elit\" on a live page announces itself. Generate a bit more than you think the design needs, too: real content is almost always longer than the neat two lines in the mockup, and testing the layout with generous text now prevents overflow surprises later.",
    ],
    faq: [
      {
        question: "What does lorem ipsum actually mean?",
        answer:
          "Nothing readable — it's deliberately scrambled Latin derived from Cicero's \"De finibus bonorum et malorum\" (45 BC). The corruption is intentional: it mimics natural language without carrying meaning that would distract reviewers.",
      },
      {
        question: "Why not just use real text as placeholder?",
        answer:
          "Real text gets read, and reviewers start editing the words instead of evaluating the design. Meaningless text keeps attention on spacing, hierarchy and layout — and is obviously unfinished, so it rarely ships by accident.",
      },
      {
        question: "How much should I generate?",
        answer:
          "Slightly more than the design comfortably fits. Real content tends to run longer than mockup text, so testing with generous amounts reveals overflow and truncation issues early.",
      },
    ],
    related: ["word-counter", "character-counter", "case-converter", "ai-blog-outline-generator"],
  },
  {
    kind: "generator",
    slug: "password-generator",
    category: "text-data-tools",
    name: "Password Generator",
    tagline: "Create strong random passwords with cryptographically secure randomness.",
    seoDescription:
      "Free strong password generator. Create random passwords from 4 to 128 characters with uppercase, lowercase, numbers and symbols — generated locally, never sent anywhere.",
    fields: [
      { name: "length", label: "Password length", type: "number", defaultValue: 16, min: 4, max: 128 },
      { name: "uppercase", label: "Include uppercase letters (A–Z)", type: "checkbox", defaultValue: true },
      { name: "lowercase", label: "Include lowercase letters (a–z)", type: "checkbox", defaultValue: true },
      { name: "numbers", label: "Include numbers (0–9)", type: "checkbox", defaultValue: true },
      { name: "symbols", label: "Include symbols (!@#$…)", type: "checkbox", defaultValue: true },
    ],
    generate: generatePassword,
    submitLabel: "Generate password",
    about: [
      "The passwords people invent follow patterns — a name, a year, an exclamation mark — and attackers' tools know every one of them. A randomly generated password has no pattern to exploit: cracking it means trying the full space of possibilities, and that space grows astronomically with length and character variety. A 16-character password drawn from all four character sets has more combinations than there are atoms in a human body; at any realistic guessing rate, it is simply out of reach.",
      "This generator uses your browser's cryptographically secure random number generator (the same Web Crypto API that underpins TLS), not the predictable Math.random() many casual tools rely on, and applies rejection sampling so every character is chosen with exactly equal probability. It also guarantees at least one character from each set you tick, since some sites insist on it. Generation happens entirely on your device — the password never travels over the network, is never logged, and disappears when you leave the page.",
      "Two habits make generated passwords practical. First, use a password manager: the whole point of random passwords is that they're unmemorable, and a manager remembers them for you — one strong master password protects the rest. Second, never reuse a password across sites; breaches at one service are replayed against others within hours. Sixteen characters is a sound default; go longer for email and banking, which unlock everything else.",
    ],
    faq: [
      {
        question: "How long should my password be?",
        answer:
          "16 characters with mixed character types is a strong default for most accounts. Use 20+ for high-value targets like your email and password manager. Below 12, modern hardware can brute-force surprisingly quickly.",
      },
      {
        question: "Is this generator really random?",
        answer:
          "Yes — it uses crypto.getRandomValues, the browser's cryptographically secure generator, with rejection sampling to avoid bias. It does not use the predictable Math.random().",
      },
      {
        question: "Is my password sent to a server?",
        answer:
          "No. Generation runs entirely in your browser; the password never leaves your device. Copy it into your password manager and close the page.",
      },
      {
        question: "Why did my password get rejected by a website?",
        answer:
          "Some sites restrict which symbols they accept or cap the length. Regenerate with symbols off or a shorter length to fit their rules — and consider that such restrictions say something about the site's security hygiene.",
      },
    ],
    related: ["hash-generator", "uuid-generator", "base64-encoder-decoder", "word-counter"],
  },
  {
    kind: "generator",
    slug: "remove-duplicate-lines",
    category: "text-data-tools",
    name: "Remove Duplicate Lines",
    tagline: "De-duplicate any list while keeping the original order.",
    seoDescription:
      "Free duplicate line remover. Paste any list and remove duplicate lines instantly, with optional case-insensitive matching and whitespace trimming.",
    fields: [
      { name: "text", label: "Your lines", type: "textarea", placeholder: "Paste one item per line…", rows: 10 },
      { name: "caseInsensitive", label: "Ignore case (treat \"Apple\" and \"apple\" as duplicates)", type: "checkbox" },
      { name: "trim", label: "Trim surrounding whitespace before comparing", type: "checkbox", defaultValue: true },
    ],
    generate: removeDuplicateLines,
    submitLabel: "Remove duplicates",
    about: [
      "Duplicate entries creep into every list that's been merged, exported or copy-pasted more than once: email lists combined from two campaigns, keyword lists from several research sessions, SKU lists from multiple warehouses, log lines, URLs collected across browser sessions. Sending a campaign to duplicated addresses or importing duplicated SKUs causes real problems — bounces, spam complaints, double-counted inventory — so de-duplication is a step worth doing properly.",
      "Paste your list, one item per line, and this tool removes every repeat while preserving the first occurrence and the original order — unlike spreadsheet de-dupe tricks that sort your data as a side effect. Two options handle the common fuzziness in real lists: case-insensitive matching treats \"Apple\" and \"apple\" as the same item (essential for email addresses, where case doesn't matter), and whitespace trimming ignores stray spaces and tabs around entries, which are invisible to the eye but make lines technically different.",
      "The de-duplicated list appears instantly, ready to copy back to wherever it came from or download as a text file. Everything runs in your browser — customer emails and commercial lists are never uploaded. For heavier list surgery, combine this with the neighbouring tools: sort the result alphabetically with the text sorter, compare before-and-after versions with the diff checker, or run find-and-replace to normalise formats before de-duplicating so near-duplicates like \"+91 98200 12345\" and \"9820012345\" can be caught.",
    ],
    faq: [
      {
        question: "Does it keep the original order?",
        answer:
          "Yes — the first occurrence of each line stays where it was and later repeats are removed. Nothing is sorted unless you sort it separately.",
      },
      {
        question: "When should I use case-insensitive matching?",
        answer:
          "For data where case carries no meaning: email addresses, domain names, most codes. Leave it off when case distinguishes real values, like case-sensitive IDs or passwords.",
      },
      {
        question: "Why didn't two lines that look identical get merged?",
        answer:
          "Almost always invisible whitespace — a trailing space or tab on one of them. Enable the trim option and they'll match.",
      },
    ],
    related: ["text-sorter", "text-diff-checker", "find-and-replace", "csv-to-json"],
  },
  {
    kind: "generator",
    slug: "text-sorter",
    category: "text-data-tools",
    name: "Text Sorter",
    tagline: "Sort lines alphabetically, by length, or in natural numeric order.",
    seoDescription:
      "Free text sorter. Sort lines A to Z, Z to A, by length, or in natural numeric order (file2 before file10), with optional case-insensitive sorting.",
    fields: [
      { name: "text", label: "Lines to sort", type: "textarea", placeholder: "Paste one item per line…", rows: 10 },
      {
        name: "mode",
        label: "Sort order",
        type: "select",
        defaultValue: "az",
        options: [
          { value: "az", label: "A → Z" },
          { value: "za", label: "Z → A" },
          { value: "natural", label: "Natural (numbers in order: item2 before item10)" },
          { value: "length-asc", label: "Shortest first" },
          { value: "length-desc", label: "Longest first" },
        ],
      },
      { name: "caseInsensitive", label: "Ignore case while sorting", type: "checkbox", defaultValue: true },
    ],
    generate: sortText,
    submitLabel: "Sort",
    about: [
      "Sorting a list sounds trivial until you actually need it done: names for an invitation list, product codes for a catalogue, keywords for an SEO sheet, package names in a config file that a linter insists must be alphabetical. Spreadsheets can sort, but pasting a list into a column, sorting, and copying it back out is five steps for a one-step job. Paste here, pick an order, done.",
      "Beyond the obvious A-to-Z and Z-to-A, two orders earn their place. Natural sort handles numbers inside text the way humans expect: plain alphabetical sorting puts item10 before item2 (because \"1\" < \"2\" character-wise), while natural sort reads the digits as numbers and orders item2, item10, item100 correctly — indispensable for file names, version numbers and SKU lists. Length sorting, shortest or longest first, is the quiet favourite of copywriters arranging headline options and developers ordering CSS class names or import lines.",
      "Case-insensitive mode (on by default) prevents the classic surprise where all capitalised words sort before every lowercase word — with it on, \"apple\" and \"Banana\" order as a human would file them. The sort is stable: equal lines keep their original relative order. Everything runs locally in your browser, and the result is one click from your clipboard or a downloadable text file. Pair it with the duplicate-line remover before sorting for clean, deduplicated, ordered lists in seconds.",
    ],
    faq: [
      {
        question: "What is natural sort order?",
        answer:
          "An order that treats digit runs as numbers: file2 comes before file10, version 1.9 before 1.10. Plain alphabetical sorting compares character by character and gets these wrong.",
      },
      {
        question: "Why do capitalised words sort first without case-insensitive mode?",
        answer:
          "Character codes for capitals (A–Z) come before lowercase letters (a–z), so a case-sensitive sort puts \"Zebra\" before \"apple\". Case-insensitive mode compares lowercase versions, giving the dictionary-style order people expect.",
      },
      {
        question: "Can I sort numbers?",
        answer:
          "Yes — use natural order so 9 sorts before 82 and 100. Alphabetical order would sort them as strings: 100, 82, 9.",
      },
    ],
    related: ["remove-duplicate-lines", "text-diff-checker", "case-converter", "csv-to-json"],
  },
  {
    kind: "generator",
    slug: "find-and-replace",
    category: "text-data-tools",
    name: "Find and Replace",
    tagline: "Bulk find-and-replace with whole-word, case and regex options.",
    seoDescription:
      "Free online find and replace tool. Replace text in bulk with case-sensitive, whole-word and regular-expression modes — runs entirely in your browser.",
    fields: [
      { name: "text", label: "Your text", type: "textarea", placeholder: "Paste the text to modify…", rows: 10 },
      { name: "find", label: "Find", type: "text", placeholder: "old text" },
      { name: "replace", label: "Replace with", type: "text", placeholder: "new text", optional: true },
      { name: "caseSensitive", label: "Case-sensitive", type: "checkbox" },
      { name: "wholeWord", label: "Whole words only", type: "checkbox" },
      { name: "regexMode", label: "Regular expression mode", type: "checkbox" },
    ],
    generate: findAndReplace,
    submitLabel: "Replace",
    about: [
      "Every editor has find-and-replace, but it's often locked inside a document, limited to one file format, or missing the options that make bulk edits safe. This tool gives you the full version in the browser: paste any text, say what to find and what to put in its place, and take the result away — with three switches that separate a clean edit from a mangled one.",
      "Whole-word matching is the guard rail most built-in tools lack: replacing \"cat\" with \"dog\" naively also turns \"category\" into \"dogegory\", while whole-word mode touches only the standalone word. Case sensitivity lets you decide whether \"Invoice\" and \"invoice\" are the same target — off by default, since they usually are. And regular-expression mode unlocks pattern-based edits for power users: dates, phone numbers, repeated whitespace, anything describable as a pattern, with capture-group references like $1 available in the replacement so you can reorder rather than merely substitute.",
      "Everyday jobs it handles: updating a company or product name across a long document, normalising phone-number or date formats in an exported list, stripping tracking parameters from a page of URLs, fixing a repeated typo in bulk, or converting delimiters in data too irregular for the CSV tools. In plain-text mode the replacement is inserted literally — no surprise interpretation of special characters. Your text never leaves the browser, making it safe for contracts and customer data. Replace, review the output, copy it back.",
    ],
    faq: [
      {
        question: "What does whole-word mode do?",
        answer:
          "It matches your search only when it appears as a standalone word, so replacing \"cat\" won't alter \"category\" or \"concatenate\". Word boundaries are letters/digits vs everything else.",
      },
      {
        question: "Can I use capture groups in the replacement?",
        answer:
          "Yes — in regex mode, groups captured with parentheses are available as $1, $2, … in the replacement. For example, find (\\d{2})-(\\d{2})-(\\d{4}) and replace with $3/$2/$1 to flip a date format.",
      },
      {
        question: "Why did my replacement with a $ sign behave oddly?",
        answer:
          "In regex mode, $ sequences in the replacement are special ($1, $&). Use plain-text mode for literal replacements — there the replacement string is inserted exactly as typed.",
      },
    ],
    related: ["case-converter", "remove-duplicate-lines", "text-sorter", "regex-tester"],
  },
];
