import type { ToolConfig } from "../../types/tools";
import { generateUrlEncodeDecode } from "../compute/dev/url-encoder-decoder";
import { generateBase64 } from "../compute/dev/base64";
import { generateUuids } from "../compute/dev/uuid";
import { testRegex } from "../compute/dev/regex-tester";
import { convertColor } from "../compute/dev/color-converter";
import { generateGradient } from "../compute/dev/css-gradient";
import { generateHtmlEntities } from "../compute/dev/html-entities";
import { generateJsonToTypescript } from "../compute/dev/json-to-typescript";
import { decodeJwt } from "../compute/dev/jwt-decoder";
import { generateMarkdownHtml } from "../compute/dev/markdown-to-html";
import { convertTimestamp } from "../compute/dev/timestamp-converter";
import QrCodeGenerator from "../ui/dev/qr-code-generator";
import HashGenerator from "../ui/dev/hash-generator";

export const tools: ToolConfig[] = [
  {
    kind: "generator",
    slug: "qr-code-generator",
    category: "developer-web",
    name: "QR Code Generator",
    tagline: "Create a QR code for any URL or text and download it as a PNG.",
    seoDescription:
      "Free QR code generator. Turn any URL or text into a QR code with selectable size and error correction, and download it as a high-resolution PNG.",
    component: QrCodeGenerator,
    about: [
      "QR codes are the fastest bridge from the physical world to a URL: on a shop counter, a restaurant table, a poster, a business card, a product label or an invoice, one scan replaces typing an address. This generator creates a scannable code for any text or link in a second — choose a size, pick an error-correction level, generate, and download a crisp PNG ready for print or screen.",
      "Two settings matter more than they look. Size: 512 pixels suits most digital uses, while print jobs should use 1024 so the code stays sharp when scaled — a blurry QR code is an unscannable QR code. Error correction: QR codes carry built-in redundancy, and the level sets how much of the code can be dirty, damaged or covered while still scanning. Level M (15%) is the everyday default; choose H (30%) if you plan to overlay a logo in the centre or print somewhere the code may get scuffed. Higher correction means a denser code, so very long URLs pair better with lower levels.",
      "Everything happens in your browser — the content you encode is never uploaded, so it's fine for private links and Wi-Fi passwords. One practical tip: prefer short URLs. A shorter address produces a sparser, easier-to-scan code, and lets you use a forgiving error-correction level even at small print sizes.",
    ],
    faq: [
      {
        question: "What is error correction in a QR code?",
        answer:
          "Built-in redundancy that lets a code scan even when partly obscured or damaged. L tolerates ~7% damage, M 15%, Q 25%, H 30%. Higher levels make the code denser, so they suit shorter content.",
      },
      {
        question: "What size should I use for print?",
        answer:
          "Generate at 1024 pixels and print the code at least 2 × 2 cm for close-range scanning; larger if people will scan from a distance. Never upscale a small PNG — regenerate at the bigger size instead.",
      },
      {
        question: "Do QR codes expire?",
        answer:
          "The code itself never expires — it's just the encoded text. It stops working only if the URL behind it goes dead, so point codes at addresses you control.",
      },
      {
        question: "Is my content uploaded to a server?",
        answer: "No — the code is generated entirely in your browser and only exists on your device until you download it.",
      },
    ],
    related: ["url-encoder-decoder", "slug-generator", "utm-builder", "base64-encoder-decoder"],
  },
  {
    kind: "generator",
    slug: "url-encoder-decoder",
    category: "developer-web",
    name: "URL Encoder / Decoder",
    tagline: "Percent-encode text for URLs, or decode an encoded URL back to plain text.",
    seoDescription:
      "Free URL encoder and decoder. Percent-encode text for query strings or decode %20-style URLs back to readable text — with component and full-URI modes.",
    fields: [
      { name: "text", label: "Text or URL", type: "textarea", placeholder: "name=Ravi Kumar&city=New Delhi", rows: 5 },
      {
        name: "mode",
        label: "Operation",
        type: "select",
        defaultValue: "encode",
        options: [
          { value: "encode", label: "Encode" },
          { value: "decode", label: "Decode" },
        ],
      },
      {
        name: "scope",
        label: "Mode",
        type: "select",
        defaultValue: "component",
        options: [
          { value: "component", label: "Component (encode &, =, / too — for query values)" },
          { value: "uri", label: "Full URI (keep :, /, ?, & intact)" },
        ],
      },
    ],
    generate: generateUrlEncodeDecode,
    submitLabel: "Convert",
    about: [
      "URLs can only carry a limited set of characters. Spaces, ampersands, question marks, non-English characters — anything outside that set must be percent-encoded (a space becomes %20, an ampersand %26) or the URL breaks in transit: query parameters get split in the wrong places, links in emails stop working, APIs reject requests. This tool encodes text safely for use in URLs, and decodes encoded URLs back into something a human can read.",
      "The component/full-URI distinction is the part everyone gets wrong once. Component mode encodes every reserved character including &, = and / — exactly what you want when inserting a value into a query string, so that \"Tom & Jerry\" becomes Tom%20%26%20Jerry instead of accidentally terminating the parameter at the &. Full-URI mode leaves the structural characters (:, /, ?, &) intact — what you want when encoding a complete URL that must keep its shape while fixing spaces and unicode. Encoding a whole URL in component mode mangles it; encoding a query value in URI mode leaves dangerous characters unescaped.",
      "Decoding is just as useful in daily work: unwrapping tracking-laden links from marketing emails to see the real destination, reading the parameters buried in an OAuth redirect, or turning a logged request URL back into legible text. Everything runs locally in your browser, and malformed input (a stray % not followed by two hex digits) produces a clear error instead of silent corruption.",
    ],
    faq: [
      {
        question: "When do I use component vs full-URI mode?",
        answer:
          "Component mode when encoding a single value going into a query string (it encodes &, =, / too). Full-URI mode when encoding a complete URL that must keep its structure. Rule of thumb: values → component, whole URLs → URI.",
      },
      {
        question: "Why does a space sometimes appear as + instead of %20?",
        answer:
          "The + convention comes from the older form-encoding format used in HTML form submissions. Modern percent-encoding uses %20. Most servers accept both in query strings, but %20 is the safe universal choice.",
      },
      {
        question: "Why did decoding fail?",
        answer:
          "The input contains a % that isn't followed by two hexadecimal digits — usually a URL that was already partially decoded or hand-edited. Fix or remove the stray % and decode again.",
      },
    ],
    related: ["base64-encoder-decoder", "html-entity-encoder-decoder", "utm-builder", "slug-generator"],
  },
  {
    kind: "generator",
    slug: "base64-encoder-decoder",
    category: "developer-web",
    name: "Base64 Encoder / Decoder",
    tagline: "Convert text to base64 and back — Unicode-safe, in your browser.",
    seoDescription:
      "Free base64 encoder and decoder. Convert any text to base64 or decode base64 back to text, with full Unicode support — runs entirely in your browser.",
    fields: [
      { name: "text", label: "Input", type: "textarea", placeholder: "Hello, world!  —or—  SGVsbG8sIHdvcmxkIQ==", rows: 6 },
      {
        name: "mode",
        label: "Operation",
        type: "select",
        defaultValue: "encode",
        options: [
          { value: "encode", label: "Encode to base64" },
          { value: "decode", label: "Decode from base64" },
        ],
      },
    ],
    generate: generateBase64,
    submitLabel: "Convert",
    about: [
      "Base64 turns any data into a string made only of letters, digits, + / and = — characters that survive every text-based system unchanged. That's why it shows up everywhere in technical work: HTTP Basic authentication headers, email attachments, data: URLs embedding images in CSS, API payloads carrying binary content, JWT tokens, configuration secrets in Kubernetes and .env files. Sooner or later you need to encode something into base64 or peek inside a base64 blob, and this tool does both instantly.",
      "This implementation is Unicode-safe, which cheap converters aren't. The naive JavaScript btoa() call fails on anything outside Latin-1 — Hindi, Tamil, emoji, the ₹ symbol — with a cryptic character-out-of-range error. Here the text is first encoded as UTF-8 bytes and then base64'd, the standard used by virtually all real systems, so \"नमस्ते\" and \"₹500\" round-trip perfectly. Decoding tolerates surrounding whitespace and reports clearly when the input isn't valid base64 (usually missing = padding or a stray character from a partial copy-paste).",
      "One thing base64 is not: encryption. It's a reversible transport encoding — anyone can decode it, as you're about to prove with this tool. Never treat base64'd credentials as secured; if you can decode it here, so can anyone else. Everything runs locally in your browser, making it safe to decode tokens and secrets without them touching a server.",
    ],
    faq: [
      {
        question: "Is base64 encryption?",
        answer:
          "No — it's an encoding, fully reversible by anyone. It protects data from being mangled in transit, not from being read. Use real encryption for secrets.",
      },
      {
        question: "Why does my text fail in other converters but work here?",
        answer:
          "Plain btoa() only handles Latin-1 characters. This tool encodes text as UTF-8 bytes first — the standard approach — so Unicode text like Hindi, emoji or ₹ works correctly.",
      },
      {
        question: "What are the = signs at the end?",
        answer:
          "Padding. Base64 works in 3-byte groups; when the input isn't a multiple of 3 bytes, one or two = characters pad the final group. Decoders need them (this one restores missing padding automatically).",
      },
    ],
    related: ["url-encoder-decoder", "jwt-decoder", "hash-generator", "html-entity-encoder-decoder"],
  },
  {
    kind: "generator",
    slug: "uuid-generator",
    category: "developer-web",
    name: "UUID Generator",
    tagline: "Generate one or a hundred random v4 UUIDs with one click.",
    seoDescription:
      "Free UUID v4 generator. Create 1 to 100 cryptographically random UUIDs instantly — copy them or download as a text file for IDs, keys and test data.",
    fields: [
      { name: "count", label: "How many UUIDs", type: "number", defaultValue: 5, min: 1, max: 100 },
    ],
    generate: generateUuids,
    submitLabel: "Generate UUIDs",
    about: [
      "A UUID (universally unique identifier) is a 128-bit value written as 36 characters — 8-4-4-4-12 hex digits, like 550e8400-e29b-41d4-a716-446655440000 — designed so that anyone can generate identifiers anywhere, with no central registry, and never collide. They're the default primary key in distributed systems, the correlation ID in logs, the idempotency key in payment APIs, the device or session identifier in analytics — anywhere two systems must mint IDs independently and merge them later without conflict.",
      "This generator produces version 4 UUIDs, the purely random variant, using the browser's cryptographically secure crypto.randomUUID(). The randomness is what delivers the guarantee: a v4 UUID carries 122 random bits, so the chance of two ever colliding is so small that you'd need to generate a billion UUIDs per second for decades to reach even a remote probability of one duplicate. In practice: generate freely, don't check.",
      "Ask for one or up to a hundred at a time — one per line, ready to copy into code, a database seed script, a spreadsheet of test data, or to download as a text file. Generation is local to your browser; nothing is logged, so the IDs you take from here exist nowhere else. If you need deterministic, name-based identifiers (the same input always yielding the same UUID), that's version 5 territory — different tool, different trade-offs; for the everyday \"give me an ID nobody else has\", v4 is the answer.",
    ],
    faq: [
      {
        question: "What's the difference between UUID versions?",
        answer:
          "v4 is random (this tool), v1 embeds a timestamp and MAC address, v5 hashes a name into a deterministic UUID, and v7 combines a timestamp with randomness for sortable IDs. v4 is the safe general-purpose default.",
      },
      {
        question: "Can two v4 UUIDs collide?",
        answer:
          "Theoretically yes, practically never — 122 bits of randomness makes a duplicate so unlikely that no real system guards against it. Generate without checking.",
      },
      {
        question: "Are these UUIDs secure to use as secrets?",
        answer:
          "They're generated with a cryptographically secure RNG, but UUIDs are identifiers, not credentials — they often leak into logs and URLs. Use a dedicated secret/token generator for authentication material.",
      },
    ],
    related: ["password-generator", "hash-generator", "base64-encoder-decoder", "timestamp-converter"],
  },
  {
    kind: "generator",
    slug: "hash-generator",
    category: "developer-web",
    name: "Hash Generator",
    tagline: "Compute SHA-1, SHA-256 and SHA-512 hashes of any text.",
    seoDescription:
      "Free SHA hash generator. Compute SHA-1, SHA-256 and SHA-512 hex digests of any text instantly in your browser — nothing is ever uploaded.",
    component: HashGenerator,
    about: [
      "A cryptographic hash is a fixed-length fingerprint of data: feed in any text and you get a digest — 64 hex characters for SHA-256 — that changes completely if even one character of the input changes, and can't be reversed back into the original. That one-way fingerprint property powers file-integrity checks, cache keys, deduplication, content addressing in git, checksums on download pages, and (with proper salting and stretching) password storage.",
      "This tool computes SHA-1, SHA-256 and SHA-512 using the Web Crypto API built into your browser — the same audited implementation your browser uses for TLS, not a JavaScript re-implementation. Tick the algorithms you want, paste the text, and copy each hex digest with one click. Everything stays on your device: pasting a config file or an API payload here doesn't send it anywhere, which is the whole point when you're comparing checksums of sensitive material.",
      "Choosing an algorithm: SHA-256 is the modern default — fast, universally supported, no known practical attacks. SHA-512 offers a longer digest and is often faster on 64-bit hardware; use it when a system asks for it. SHA-1 is included because legacy systems still reference it (git object IDs, older checksums), but it's cryptographically broken for collision resistance — verify against it when you must, never design with it. MD5 is deliberately absent: it's been thoroughly broken for decades, and offering it invites misuse. And remember hashing alone is not how passwords should be stored — that job needs salts and a slow KDF like bcrypt or Argon2.",
    ],
    faq: [
      {
        question: "Which hash algorithm should I use?",
        answer:
          "SHA-256 for almost everything — it's the modern standard. SHA-512 when a spec demands it or for extra margin. SHA-1 only to interoperate with legacy systems that already use it.",
      },
      {
        question: "Why is MD5 not offered?",
        answer:
          "MD5 has been cryptographically broken since 2004 — collisions can be manufactured cheaply. Offering it invites unsafe use; systems still requiring MD5 should be migrated.",
      },
      {
        question: "Can I hash passwords with this?",
        answer:
          "Not for storage. Plain hashes are crackable at billions of guesses per second. Password storage needs a salted, deliberately slow function like bcrypt, scrypt or Argon2.",
      },
      {
        question: "Is the same input guaranteed to give the same hash?",
        answer:
          "Yes — that's the defining property. The digest depends only on the exact bytes of input, so watch out for invisible differences like trailing newlines or different line endings.",
      },
    ],
    related: ["password-generator", "uuid-generator", "base64-encoder-decoder", "jwt-decoder"],
  },
  {
    kind: "generator",
    slug: "regex-tester",
    category: "developer-web",
    name: "Regex Tester",
    tagline: "Test regular expressions against sample text and inspect every match and group.",
    seoDescription:
      "Free regex tester. Try JavaScript regular expressions against sample text and see every match with its index and capture groups — with clear error messages.",
    fields: [
      { name: "pattern", label: "Pattern", type: "text", placeholder: "\\b\\d{6}\\b" },
      { name: "flags", label: "Flags", type: "text", placeholder: "gi", optional: true, help: "g, i, m, s, u, y" },
      { name: "text", label: "Test text", type: "textarea", placeholder: "Paste the text to match against…", rows: 8 },
    ],
    generate: testRegex,
    submitLabel: "Test pattern",
    about: [
      "Regular expressions are the power tool of text processing — and famously easy to get subtly wrong. The difference between a pattern that works and one that corrupts data in production is usually one escape or one greedy quantifier, which is why experienced developers never ship a regex they haven't tested against realistic samples. This tester runs your pattern against any text and reports every match: what matched, at which character index, and what each capture group contains.",
      "It uses JavaScript's regex engine, so what works here works in Node.js and every browser (and mostly everywhere else — the core syntax is shared across languages). All the standard flags are supported: i for case-insensitive, m to make ^ and $ match line boundaries, s to let the dot cross newlines, u for proper Unicode handling. Matches are always listed globally so you see every occurrence, and capture groups — the parenthesised sub-patterns you'll use to extract or reorder text — are printed per match, which is where extraction bugs actually hide.",
      "A sound testing habit: paste text that includes both strings that should match and near-misses that shouldn't. A pattern for 6-digit Indian PINs should match 110001 but reject 11000 and 1100011 — testing only the happy case is how catastrophic replacements happen. Invalid patterns return the engine's actual error message rather than a shrug, and everything runs locally, so testing against production log excerpts is safe.",
    ],
    faq: [
      {
        question: "Which regex flavour does this use?",
        answer:
          "JavaScript's (ECMAScript). Patterns behave exactly as they will in Node.js and browsers. Core syntax carries over to Python, Java and Go, though advanced features like lookbehind vary by engine.",
      },
      {
        question: "What are capture groups?",
        answer:
          "Parenthesised parts of a pattern that extract sub-matches — in (\\d{2})-(\\d{2}), group 1 and group 2 capture the two number pairs separately. The tester prints each group's content for every match.",
      },
      {
        question: "Why does my pattern match too much?",
        answer:
          "Usually a greedy quantifier: .* grabs as much as possible. Use the lazy form .*? or a more specific character class like [^,]* to stop at the right boundary.",
      },
    ],
    related: ["find-and-replace", "text-diff-checker", "case-converter", "markdown-to-html"],
  },
  {
    kind: "generator",
    slug: "color-converter",
    category: "developer-web",
    name: "Color Converter",
    tagline: "Convert any colour between HEX, RGB and HSL formats.",
    seoDescription:
      "Free color converter. Paste a colour as HEX, RGB or HSL and instantly get all three formats — perfect for CSS, design handoffs and brand palettes.",
    fields: [
      { name: "color", label: "Colour", type: "text", placeholder: "#4f46e5  or  rgb(79, 70, 229)  or  hsl(243, 75%, 59%)" },
    ],
    generate: convertColor,
    submitLabel: "Convert",
    about: [
      "The same colour wears three outfits in web work: HEX (#4f46e5) in design tools and brand guides, RGB (rgb(79, 70, 229)) in JavaScript and image editors, HSL (hsl(243, 75%, 59%)) in modern CSS where its human-readable hue/saturation/lightness makes palette adjustments sane. Handoffs constantly require translating between them — the designer sends HEX, the CSS uses HSL, the canvas API wants RGB numbers. Paste a colour in any of the three formats and this converter returns all three, exactly equivalent.",
      "It accepts the common variants people actually paste: 3-digit shorthand hex (#abc expands to #aabbcc), hex with or without the #, and rgb()/hsl() with or without an alpha slot. Unparseable input gets a clear error showing the accepted formats rather than a silently wrong colour.",
      "A word for HSL, the underused one: because it separates what the colour is (hue, 0–360°) from how vivid (saturation) and how bright (lightness) it is, palette work becomes arithmetic. A hover state is the same HSL with lightness dropped 10 points; a muted background is the brand hue with saturation cut to 20% and lightness raised to 95%; a complementary accent is hue + 180. Try converting your brand colour here and reading its HSL — many developers find they finally understand their own palette. Everything runs locally in your browser.",
    ],
    faq: [
      {
        question: "Which format should I use in CSS?",
        answer:
          "All three work everywhere. HEX is compact and conventional; HSL is easiest to modify programmatically (lightness for hover states, saturation for muted variants). Pick one per project and stay consistent.",
      },
      {
        question: "What about alpha (transparency)?",
        answer:
          "This converter works with the opaque colour. For transparency, append the alpha in your CSS — rgba(79, 70, 229, 0.5), hsl with / 50%, or 8-digit hex — the underlying colour conversion is the same.",
      },
      {
        question: "Why does my HSL round-trip to a slightly different HEX?",
        answer:
          "HSL values are conventionally rounded to whole degrees and percentages, which can shift the RGB result by a point or two — imperceptible in practice.",
      },
    ],
    related: ["css-gradient-generator", "image-color-picker", "favicon-generator", "meta-tag-generator"],
  },
  {
    kind: "generator",
    slug: "css-gradient-generator",
    category: "developer-web",
    name: "CSS Gradient Generator",
    tagline: "Build linear and radial CSS gradients and copy the code.",
    seoDescription:
      "Free CSS gradient generator. Pick two colours, choose linear (with angle) or radial, and copy clean modern CSS gradient code with a solid-colour fallback.",
    fields: [
      { name: "from", label: "Start colour (hex)", type: "text", placeholder: "#4f46e5" },
      { name: "to", label: "End colour (hex)", type: "text", placeholder: "#9333ea" },
      {
        name: "type",
        label: "Gradient type",
        type: "select",
        defaultValue: "linear",
        options: [
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
        ],
      },
      { name: "angle", label: "Angle (linear only)", type: "number", defaultValue: 135, min: 0, max: 360, unit: "°", optional: true },
    ],
    generate: generateGradient,
    submitLabel: "Generate CSS",
    about: [
      "Gradients are back — subtle two-tone backgrounds on hero sections, buttons and cards are one of the defining looks of modern interfaces, and CSS renders them natively with no image files. This generator writes the code for you: choose your two colours, pick linear or radial, set the angle, and copy a clean background declaration ready to paste into any stylesheet.",
      "The linear angle follows CSS convention: 0° points the gradient upward (start colour at the bottom), 90° points right, and the popular 135° runs diagonally from top-left to bottom-right — the default here because it flatters most layouts. Radial gradients bloom from the centre outward, suited to spotlight effects and circular elements. The output also includes a solid-colour fallback line, so ancient browsers that predate gradient support show your start colour rather than nothing.",
      "Two colours make a gradient; taste makes it a good one. Neighbouring hues (indigo to violet, teal to blue) blend smoothly, while opposites can meet in a muddy grey midpoint — if you want a bold two-colour statement, pick colours that share some undertone. Keeping both stops at similar lightness avoids the washed-out band in the middle. For text overlays, check contrast against both ends of the gradient, not just one. If you need a hand relating colours, the colour converter next door shows every colour's hue/saturation/lightness so you can pick companions deliberately.",
    ],
    faq: [
      {
        question: "How do gradient angles work in CSS?",
        answer:
          "The angle is the direction the gradient travels: 0° points up, 90° right, 180° down. 135° — top-left toward bottom-right — is the most common choice for backgrounds.",
      },
      {
        question: "Can I use more than two colours?",
        answer:
          "CSS supports any number of colour stops — take the generated code and add more comma-separated stops with percentages, e.g. linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%).",
      },
      {
        question: "Why does the middle of my gradient look grey?",
        answer:
          "Colours far apart on the colour wheel pass through desaturated territory when interpolated. Choose closer hues, or add a vivid intermediate colour stop at 50%.",
      },
    ],
    related: ["color-converter", "favicon-generator", "meta-tag-generator", "image-color-picker"],
  },
  {
    kind: "generator",
    slug: "html-entity-encoder-decoder",
    category: "developer-web",
    name: "HTML Entity Encoder / Decoder",
    tagline: "Escape text for HTML, or decode &amp;-style entities back to characters.",
    seoDescription:
      "Free HTML entity encoder and decoder. Escape <, >, & and quotes for safe HTML display, or decode named and numeric entities back into readable text.",
    fields: [
      { name: "text", label: "Input", type: "textarea", placeholder: "if (a < b && c > d) …   —or—   if (a &lt; b &amp;&amp; c &gt; d)", rows: 6 },
      {
        name: "mode",
        label: "Operation",
        type: "select",
        defaultValue: "encode",
        options: [
          { value: "encode", label: "Encode (escape for HTML)" },
          { value: "decode", label: "Decode entities to text" },
        ],
      },
    ],
    generate: generateHtmlEntities,
    submitLabel: "Convert",
    about: [
      "HTML gives special meaning to a handful of characters: < opens a tag, & starts an entity, quotes delimit attributes. Put raw user text or code containing those characters into a page and the browser misreads it — content disappears into imaginary tags, layouts break, and in the worst case injected script runs. The fix is entity encoding: < becomes &lt;, & becomes &amp;, and the browser displays the characters instead of interpreting them. This tool encodes text for safe embedding, and decodes entity-riddled text back to readable characters.",
      "Encoding here covers the five structurally dangerous characters (&, <, >, double and single quotes) plus any character outside printable ASCII, which is emitted as a numeric entity — handy when your file might travel through systems that mangle UTF-8. Decoding understands the common named entities (&amp;, &lt;, &gt;, &quot;, &apos;, &nbsp;) as well as decimal (&#8377;) and hex (&#x20B9;) numeric forms, so text copied out of HTML source, RSS feeds or scraped pages turns back into normal prose.",
      "Everyday jobs: embedding a code snippet in a blog post so if (a < b) displays literally; putting a company name like \"R&D Labs\" into an HTML attribute; cleaning up an exported document where every rupee sign arrived as &#8377;. One caution — entity encoding output is for HTML contexts. It is not sufficient escaping for JavaScript strings, URLs or SQL; each context has its own rules (the URL encoder next door handles that case).",
    ],
    faq: [
      {
        question: "Which characters must be escaped in HTML?",
        answer:
          "At minimum & and < in content, plus quotes inside attribute values. This encoder handles all five dangerous characters and non-ASCII text, which is always safe to over-escape.",
      },
      {
        question: "What's the difference between &#8377; and &#x20B9;?",
        answer:
          "The same character (₹) referenced by decimal vs hexadecimal code point. Both are valid; the decoder accepts both plus common named entities.",
      },
      {
        question: "Does encoding protect against XSS?",
        answer:
          "Entity-encoding untrusted text before inserting it into HTML content is a core XSS defence, but the escaping must match the context — attribute, URL and JavaScript contexts each need their own rules. Use a templating engine's auto-escaping where possible.",
      },
    ],
    related: ["url-encoder-decoder", "base64-encoder-decoder", "markdown-to-html", "regex-tester"],
  },
  {
    kind: "generator",
    slug: "jwt-decoder",
    category: "developer-web",
    name: "JWT Decoder",
    tagline: "Decode a JSON Web Token and inspect its header, payload and expiry.",
    seoDescription:
      "Free JWT decoder. Paste a JSON Web Token to see its header and payload as formatted JSON, with issued-at and expiry timestamps translated to readable dates.",
    fields: [
      { name: "token", label: "JWT", type: "textarea", placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.…", rows: 5 },
    ],
    generate: decodeJwt,
    submitLabel: "Decode",
    about: [
      "JSON Web Tokens are the lingua franca of modern authentication: your login session, API credentials and OAuth grants very likely travel as three base64url-encoded segments joined by dots — a header describing the signing algorithm, a payload of claims about you, and a signature. When a login mysteriously fails or an API returns 401, the fastest diagnostic is often simply reading the token. This decoder unpacks the header and payload into formatted JSON and, crucially, translates the timestamp claims into human dates.",
      "Those timestamps answer the most common question — \"is this token expired?\" — directly: iat (issued at), nbf (not before) and exp (expiry) are unix timestamps that no human reads natively; the decoder prints each as an ISO date and flags plainly whether exp has passed. Nine times out of ten, an authentication bug is an expired token or a clock-skewed nbf, visible here in seconds.",
      "Understand what decoding does and doesn't tell you. JWT payloads are encoded, not encrypted — anyone holding the token can read the claims, which is why secrets never belong in them. And this tool does not verify the signature (that requires the signing key, which should never leave the server): decoding proves what the token says, not that it's authentic or untampered. Verification belongs in your backend with a proper JWT library. Since decoding happens entirely in your browser, pasting production tokens here doesn't expose them — but treat live tokens like passwords anyway and prefer expired ones for debugging.",
    ],
    faq: [
      {
        question: "Is it safe to paste a real token here?",
        answer:
          "Decoding runs entirely in your browser — nothing is transmitted. Still, live tokens grant access to whatever they protect, so prefer expired or test tokens when debugging, as you would with any credential.",
      },
      {
        question: "Why doesn't this tool verify the signature?",
        answer:
          "Verification requires the secret or public key the token was signed with. A browser tool can't (and shouldn't) hold your signing secrets — verify server-side with a JWT library.",
      },
      {
        question: "What are iat, exp and nbf?",
        answer:
          "Standard timestamp claims: iat = when the token was issued, exp = when it expires, nbf = the time before which it must be rejected. All are unix timestamps, decoded here into readable dates.",
      },
      {
        question: "Can I put sensitive data in a JWT payload?",
        answer:
          "No — payloads are readable by anyone holding the token (as this tool demonstrates). Keep secrets server-side; use the payload for identifiers and non-sensitive claims only.",
      },
    ],
    related: ["base64-encoder-decoder", "hash-generator", "timestamp-converter", "json-formatter"],
  },
  {
    kind: "generator",
    slug: "markdown-to-html",
    category: "developer-web",
    name: "Markdown to HTML Converter",
    tagline: "Convert markdown into clean HTML you can paste anywhere.",
    seoDescription:
      "Free markdown to HTML converter. Turn headings, lists, links, bold, code blocks and quotes into clean HTML — with raw HTML safely escaped.",
    fields: [
      { name: "markdown", label: "Markdown input", type: "textarea", placeholder: "# Heading\n\nSome **bold** text with a [link](https://example.com).\n\n- item one\n- item two", rows: 10 },
    ],
    generate: generateMarkdownHtml,
    submitLabel: "Convert",
    about: [
      "Markdown is how the internet writes now — READMEs, documentation, notes apps, chat messages — because typing # and ** is faster than reaching for a toolbar. But plenty of destinations still want real HTML: a CMS body field, an email template, a static site, a WYSIWYG editor that accepts source input. This converter bridges the gap, turning markdown into clean, semantic HTML in one click.",
      "It supports the everyday core of the format: all six heading levels, paragraphs, bold and italic, inline code, fenced code blocks, links, unordered and ordered lists, and blockquotes. The output is plain, unstyled, semantic HTML — h2, p, ul, blockquote — that inherits whatever styles the destination page already has, rather than fighting them with inline CSS.",
      "One deliberate safety property: raw HTML inside your markdown is escaped rather than passed through. Markdown technically permits embedded HTML, but passing it through is how script injection sneaks into pages that render user-supplied markdown; here a pasted script tag becomes visible text instead of executable code, and code samples containing HTML display correctly rather than rendering. If you're converting your own trusted content and want embedded HTML honoured, paste those fragments into the output afterwards. Everything runs locally in your browser — drafts and internal docs never leave your machine, and the result is one click from your clipboard or downloadable as an .html file.",
    ],
    faq: [
      {
        question: "Which markdown features are supported?",
        answer:
          "Headings (#–######), bold, italic, inline code, fenced code blocks, links, ordered and unordered lists, blockquotes and paragraphs — the core set used in most documents. Tables and footnotes aren't converted.",
      },
      {
        question: "What happens to HTML inside my markdown?",
        answer:
          "It's escaped to display as text rather than being rendered — a safety default that prevents script injection and makes code samples display correctly. Re-insert trusted HTML fragments after converting if you need them live.",
      },
      {
        question: "Will the output match my site's styling?",
        answer:
          "Yes, by design — the converter emits unstyled semantic tags (h2, p, ul), so the HTML picks up the destination page's existing CSS instead of overriding it.",
      },
    ],
    related: ["html-entity-encoder-decoder", "case-converter", "word-counter", "ai-blog-outline-generator"],
  },
  {
    kind: "generator",
    slug: "json-to-typescript",
    category: "developer-web",
    name: "JSON to TypeScript Interface / Type Generator",
    tagline: "Turn a JSON sample into clean TypeScript interfaces or type aliases.",
    seoDescription:
      "Free JSON to TypeScript converter. Turn any JSON sample into clean TypeScript interfaces or type aliases — nested objects, arrays, union types, null and quoted keys all handled automatically.",
    fields: [
      {
        name: "json",
        label: "JSON input",
        type: "textarea",
        placeholder: '{"name":"Asha","profile":{"city":"Pune","pincode":411001},"active":true}',
        rows: 10,
        required: true,
      },
      {
        name: "rootName",
        label: "Root type name",
        type: "text",
        defaultValue: "User",
        maxLength: 40,
        help: "Type name for the top-level value (used for nested types too).",
      },
      {
        name: "format",
        label: "Generate",
        type: "select",
        defaultValue: "interface",
        options: [
          { value: "interface", label: "Interfaces" },
          { value: "type", label: "Type aliases" },
        ],
      },
    ],
    generate: generateJsonToTypescript,
    submitLabel: "Generate TypeScript",
    about: [
      "APIs deliver JSON and TypeScript wants types, and the gap between the two is where a thousand hand-rolled interfaces get written — guessed from a response, wrong the moment a field is optional, and stale the day the payload changes. This generator closes the gap from your own data: paste one realistic JSON response and get clean TypeScript declarations for the whole shape, so the compile-time types always agree with what the server actually sends. Copy the result into a types.ts, paste it into your API client layer, and let the compiler catch the mismatches for you.",
      "The inference follows the data precisely. Every object becomes its own named interface (or type alias) with a PascalCase name built from its path — a profile object inside a User record becomes UserProfile — and identical shapes encountered in different places collapse into a single shared type instead of duplicating. Primitive values map to string, number and boolean; null appears literally as null; arrays of several element types become a union such as (string | number)[]; an empty array is typed unknown[] and an empty object Record<string, unknown>, both honest about the fact that a sample carries no information. Property keys that aren't valid identifiers — first name, age-in-years, a key starting with a digit — are quoted so the output stays valid TypeScript.",
      "Two honest limits worth knowing. The types describe the JSON you pasted: if a field is genuinely optional in production, the sample had better show an object without it — paste a few representative records to capture the variation you actually see. And the tool generates the shape, not the final design: you'll still want to hand it to your team's TS conventions. Generation runs entirely in your browser — API responses, customer records and internal payloads never leave your machine, which is exactly what you want when deriving types from production data.",
    ],
    faq: [
      {
        question: "Why does a mixed array become a union type?",
        answer:
          "Because a single element type would lie about some elements. An array mixing numbers and strings gets (number | string)[] so each element keeps its own real type. If your data should really be homogeneous, use a representative sample to get the cleaner, narrower type.",
      },
      {
        question: "Interfaces or type aliases — which should I use?",
        answer:
          "For plain data shapes they are interchangeable, and both work in the dropdown. Interfaces are open and show richer editor hints, wonderful for shaping API contracts; type aliases can express unions, arrays and scalar types, so the tool uses them for array-of-object roots. Pick the one your codebase already uses.",
      },
      {
        question: "What about an empty array or empty object?",
        answer:
          "A sample with no elements carries no type information, so the output is honest rather than invented: an empty array becomes unknown[], an empty object Record<string, unknown>. Provide at least one populated example to get precise types.",
      },
      {
        question: "Is my JSON uploaded anywhere?",
        answer:
          "No — conversion runs entirely in your browser. Nothing is sent to a server, which is what makes this safe to use with real API responses and internal data while you build types.",
      },
    ],
    related: ["json-formatter", "csv-to-json", "json-to-csv", "base64-encoder-decoder"],
  },
  {
    kind: "calculator",
    slug: "timestamp-converter",
    category: "developer-web",
    name: "Timestamp Converter",
    tagline: "Convert between unix timestamps and human-readable dates, with IST built in.",
    seoDescription:
      "Free unix timestamp converter. Convert epoch seconds or milliseconds to readable UTC and IST dates — or paste an ISO date to get its unix timestamp.",
    fields: [
      {
        name: "input",
        label: "Timestamp or date",
        type: "text",
        placeholder: "1783247400  ·  1783247400000  ·  2026-07-05T10:30:00Z  ·  now",
        optional: true,
        help: "Leave empty (or type \"now\") for the current time.",
      },
    ],
    compute: convertTimestamp,
    autoCompute: true,
    about: [
      "Computers timestamp everything as seconds (or milliseconds) since 1 January 1970 UTC — the unix epoch. It's a wonderfully unambiguous format for machines and a completely opaque one for humans: nobody reads 1783247400 and thinks \"early July 2026\". Whenever you're staring at a log line, an API response, a database row or a JWT claim, this converter translates in both directions instantly.",
      "Paste a number and it becomes a date, shown simultaneously as an ISO 8601 UTC string, Indian Standard Time in full, the equivalent in both seconds and milliseconds, and a relative description like \"3 days ago\". The seconds-vs-milliseconds trap is handled automatically by length — a 10-digit number is seconds, 13 digits is milliseconds — which matters because confusing them puts your date in 1970 or in the year 57,000. Paste an ISO date string instead and you get its timestamps; type nothing (or \"now\") for the current moment.",
      "The dual UTC/IST display earns its place in Indian engineering work: servers, databases and APIs conventionally run on UTC while your users, logs dashboards and stand-up conversations run on IST, five and a half hours ahead. That half-hour offset (UTC+5:30) breaks the mental arithmetic that works for whole-hour zones, so having both printed side by side prevents the classic off-by-a-timezone bug in cron schedules, report boundaries and expiry checks.",
    ],
    faq: [
      {
        question: "Seconds or milliseconds — how do I tell?",
        answer:
          "Length: current dates are 10 digits in seconds and 13 in milliseconds. Unix/database timestamps are usually seconds; JavaScript's Date.now() gives milliseconds. The converter detects this automatically.",
      },
      {
        question: "What is the unix epoch?",
        answer:
          "Midnight UTC on 1 January 1970 — the zero point from which unix time counts seconds. It's timezone-independent: the same timestamp represents the same instant everywhere on Earth.",
      },
      {
        question: "Why does IST make timestamp math tricky?",
        answer:
          "IST is UTC+5:30 — the half-hour offset defeats quick mental conversion that works for whole-hour zones, which is why UTC-configured servers and IST-thinking humans so often disagree by exactly one boundary.",
      },
    ],
    related: ["uuid-generator", "jwt-decoder", "invoice-due-date-calculator", "word-counter"],
  },
];
