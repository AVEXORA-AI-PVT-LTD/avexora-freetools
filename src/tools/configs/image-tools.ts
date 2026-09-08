import type { ToolConfig } from "../../types/tools";
import ImageCompressor from "../ui/image/image-compressor";
import ImageResizer from "../ui/image/image-resizer";
import ImageCropper from "../ui/image/image-cropper";
import { PngToJpg, JpgToPng, WebpConverter } from "../ui/image/format-converter";
import { ImageToBase64, Base64ToImage } from "../ui/image/base64-image";
import { FaviconGenerator } from "../ui/image/favicon-generator";
import { ImageColorPicker } from "../ui/image/image-color-picker";
import { ImageRotatorFlipper } from "../ui/image/image-rotator-flipper";

export const tools: ToolConfig[] = [
  {
    kind: "file-tool",
    slug: "image-compressor",
    category: "image-tools",
    name: "Image Compressor",
    tagline: "Shrink an image's file size with an adjustable quality slider, in your browser.",
    seoDescription:
      "Free image compressor. Reduce photo file size with an adjustable quality slider — see the before/after size — entirely in your browser, no upload required.",
    component: ImageCompressor,
    about: [
      "A photo straight off a phone camera can easily run 3-5 MB — far more than any website, email attachment or WhatsApp share actually needs, and often the reason a page loads slowly or an email bounces for being too large. This tool re-encodes your image at an adjustable quality level, cutting file size while keeping the picture visually indistinguishable at any reasonable quality setting.",
      "Drag the quality slider and compress — higher settings (80-95%) preserve near-original detail with modest savings, useful for photography you'll print or zoom into; lower settings (40-70%) shrink file size dramatically with a barely noticeable quality trade-off, ideal for web images and email attachments. The tool reports the before-and-after size so you can see exactly what you gained before committing to the download.",
      "Compression happens entirely in your browser using the canvas API — your photos are never uploaded to a server, which matters for anything personal or sensitive. For website images specifically, pairing a compressed JPEG with the right dimensions (via the image resizer) typically cuts page weight far more than compression alone, since an oversized image wastes bytes regardless of compression level.",
      "A quick way to judge the right setting: compress at 80%, look closely at fine detail like text or hair strands, and only drop further if the size still isn't small enough for your purpose. Photos with lots of flat colour (product shots on white, screenshots) compress far more forgivingly than busy, high-detail photography, so don't assume one quality number suits every image in a batch.",
    ],
    faq: [
      {
        question: "What quality setting should I use?",
        answer:
          "80% is a good default for most photos — a meaningful size reduction with no visible quality loss. Drop to 50-60% for web thumbnails or email attachments where file size matters more than fine detail.",
      },
      {
        question: "Does compression convert my image to JPEG?",
        answer:
          "Photos and other opaque images are compressed to JPEG — the format that gives the biggest size reductions, and which the quality slider adjusts. Transparent PNGs are kept as PNG so their alpha channel is never lost; opaque PNGs (like a photo saved as PNG) have no transparency to preserve, so they are converted to JPEG automatically.",
      },
      {
        question: "Is my photo uploaded anywhere?",
        answer:
          "No — compression runs entirely in your browser using the canvas API. Your image never leaves your device.",
      },
    ],
    related: ["image-resizer", "webp-converter", "compress-pdf", "png-to-jpg"],
  },
  {
    kind: "file-tool",
    slug: "image-resizer",
    category: "image-tools",
    name: "Image Resizer",
    tagline: "Resize any image to exact pixel dimensions, with optional aspect-ratio lock.",
    seoDescription:
      "Free image resizer. Resize any image to exact width and height in pixels, with aspect-ratio lock — entirely in your browser, no upload required.",
    component: ImageResizer,
    about: [
      "Every platform has its own required dimensions — a 1200×630 social share image, a 500×500 product thumbnail, a 1920×1080 banner — and a source photo rarely arrives in exactly the size needed. This tool resizes any image to precise pixel dimensions, with an aspect-ratio lock so you don't accidentally stretch or squash the picture while adjusting one dimension.",
      "Enter a width and the height updates automatically to preserve proportions (or uncheck the lock to set both independently, useful for deliberately cropping-by-stretching in rare cases). The resize uses the browser's canvas scaling, which handles both upscaling and downscaling smoothly for typical photo content.",
      "Resizing before uploading is one of the single biggest performance wins for a website — a 4000-pixel-wide photo displayed at 800 pixels wastes most of its data on detail the browser throws away anyway. Resize to the actual display size first, then compress if you need to shrink further. Everything runs locally in your browser, so your images are never uploaded to resize them.",
      "A practical habit worth building: check the exact pixel dimensions your layout actually displays an image at (browser dev tools show this in a click) before uploading anything, rather than uploading camera-resolution originals and letting the browser scale them down on every visitor's device. That single step often halves a page's total image weight with zero visible quality change.",
    ],
    faq: [
      {
        question: "What happens if I uncheck the aspect ratio lock?",
        answer:
          "Width and height become independent — you can set any combination, but the image will stretch or squash if the new ratio doesn't match the original. Keep the lock on unless you specifically want that effect.",
      },
      {
        question: "Can I upscale a small image to a larger size?",
        answer:
          "Yes, though upscaling adds pixels through interpolation rather than genuine detail, so very small source images will look softer when enlarged significantly. Resizing works best when scaling down or making modest increases.",
      },
      {
        question: "What size should I use for social media images?",
        answer:
          "Common targets: 1200×630 for link previews (Facebook, LinkedIn, Twitter), 1080×1080 for Instagram square posts, 1080×1920 for Stories/Reels. Check the specific platform's current recommendation before publishing.",
      },
    ],
    related: ["image-compressor", "image-cropper", "favicon-generator", "meta-tag-generator"],
  },
  {
    kind: "file-tool",
    slug: "image-cropper",
    category: "image-tools",
    name: "Image Cropper",
    tagline: "Crop any image to exactly the area you need, in your browser.",
    seoDescription:
      "Free image cropper. Drag to select the area you want and crop any image precisely — entirely in your browser, no upload required.",
    component: ImageCropper,
    about: [
      "Sometimes the problem with a photo isn't its size but its content — a great subject surrounded by clutter, an ID photo with too much background, a screenshot that includes browser chrome you don't want in the final image. This tool lets you drag a selection box directly on your image and crop to exactly that area.",
      "Click and drag anywhere on the preview to draw your crop selection; the highlighted box shows exactly what will be kept. Release, then crop — the tool maps your on-screen selection back to the image's real pixel dimensions, so the output is precise regardless of how large or small the preview appears in your browser window.",
      "This is often the fastest fix for a photo that's almost right — cropping out a distracting edge, isolating a product from its background context, or trimming a screenshot down to just the relevant part. Everything happens locally in your browser; the image you're cropping is never uploaded anywhere.",
      "A framing tip: crop a little tighter than feels natural for social media thumbnails and profile pictures, since platforms often apply their own circular or square mask on top of your crop, and content near the edges gets clipped unpredictably. For product photos, leave slightly more breathing room so the subject doesn't feel cramped against the frame once it's placed into a page layout.",
    ],
    faq: [
      {
        question: "How precise is the crop?",
        answer:
          "Your on-screen drag selection is mapped proportionally to the image's actual pixel dimensions, so the crop is accurate regardless of how the preview is scaled in your browser window.",
      },
      {
        question: "Can I adjust the selection before cropping?",
        answer:
          "Draw a new selection by dragging again — each drag replaces the previous selection box. There's currently no drag-to-resize on an existing box; redraw it instead.",
      },
      {
        question: "What format is the cropped output?",
        answer:
          "Matches your source file where practical — PNG stays PNG (preserving transparency), everything else exports as JPEG.",
      },
    ],
    related: ["image-resizer", "image-compressor", "image-rotator-flipper", "favicon-generator"],
  },
  {
    kind: "file-tool",
    slug: "png-to-jpg",
    category: "image-tools",
    name: "PNG to JPG Converter",
    tagline: "Convert PNG images to JPG, with transparency flattened to white.",
    seoDescription:
      "Free PNG to JPG converter. Convert PNG images to JPG format instantly, with transparent areas flattened to white — entirely in your browser.",
    component: PngToJpg,
    about: [
      "PNG and JPG solve different problems — PNG for lossless quality and transparency, JPG for smaller file sizes on photographic content — and converting between them is a routine need whenever a form, upload widget, or print service insists on one format over the other. This tool converts your PNG to JPG in one click.",
      "Because JPG has no concept of transparency, any transparent areas in your PNG are flattened onto a white background before conversion — the standard, expected behaviour for this conversion. If your PNG has no transparency (most photos and flattened graphics don't), the conversion changes nothing but the file format and typically shrinks the file noticeably, since JPG's compression is usually far more efficient than PNG's for photographic content.",
      "Common reasons to convert: a website or ad platform that only accepts JPG uploads, an email attachment size limit that a losslessly-compressed PNG blows past, or simply wanting a smaller file for a photo where perfect pixel fidelity doesn't matter. Conversion runs entirely in your browser — your image is never uploaded.",
      "One thing to check before converting: if your PNG has meaningful transparent regions (a logo meant to sit over a coloured background, an icon with rounded corners), converting to JPG will bake in a solid white background permanently — there's no getting the transparency back afterward. Keep the original PNG safely stored if you might need the transparent version again later.",
    ],
    faq: [
      {
        question: "What happens to transparent areas?",
        answer:
          "They're filled with white, since JPG doesn't support transparency. If you need to preserve transparency, keep the file as PNG or use a format like WebP that supports both.",
      },
      {
        question: "Will the file get smaller?",
        answer:
          "Usually yes, often significantly — JPG's lossy compression is typically far more space-efficient than PNG's lossless compression for photographic content, though PNG can be smaller for simple graphics with large flat colour areas.",
      },
      {
        question: "Does converting lose image quality?",
        answer:
          "JPG uses lossy compression, so there is some quality loss compared to the lossless PNG source — usually imperceptible at normal viewing sizes, more visible if you zoom in closely or the image has fine text/line detail.",
      },
    ],
    related: ["jpg-to-png", "webp-converter", "image-compressor", "jpg-to-pdf"],
  },
  {
    kind: "file-tool",
    slug: "jpg-to-png",
    category: "image-tools",
    name: "JPG to PNG Converter",
    tagline: "Convert JPG images to lossless PNG format, in your browser.",
    seoDescription:
      "Free JPG to PNG converter. Convert JPG images to lossless PNG format instantly, ready for further editing — entirely in your browser, no upload required.",
    component: JpgToPng,
    about: [
      "PNG's lossless compression and support for transparency make it the format of choice for logos, icons, screenshots and any graphic that needs to be edited further without accumulating compression artifacts. This tool converts a JPG to PNG in one click — useful when a design tool, upload form, or workflow specifically requires PNG.",
      "The conversion itself is straightforward: your JPG's pixels are preserved exactly and re-encoded losslessly as PNG. Because the source JPG was already lossy-compressed, converting to PNG doesn't recover any detail that compression already discarded — it locks in the current quality without further loss going forward, which matters if you plan to edit the image multiple times (each JPG re-save degrades quality further, while PNG re-saves don't).",
      "Expect the resulting PNG file to be larger than the source JPG, sometimes considerably — this is normal and expected, since PNG's lossless approach trades file size for perfect fidelity. If file size matters more than lossless quality for your use case, you likely want to stay with JPG. Conversion runs entirely in your browser; nothing is uploaded.",
      "This conversion is commonly used before importing a photo into design software that expects a lossless format, before applying repeated edits and re-saves in an image editor (to stop each save from compounding JPG artifacts), or simply when a specific tool or workflow flatly requires a .png file extension regardless of the original format's suitability.",
    ],
    faq: [
      {
        question: "Will converting to PNG improve my JPG's quality?",
        answer:
          "No — any quality loss from the original JPG compression is already baked into the pixels and can't be recovered. Converting to PNG prevents further loss on future saves, but doesn't undo existing compression artifacts.",
      },
      {
        question: "Why is the PNG file so much bigger than the JPG?",
        answer:
          "PNG uses lossless compression, which generally produces larger files than JPG's lossy compression for photographic content. This is expected and is the trade-off for perfect pixel fidelity.",
      },
      {
        question: "Does the converted PNG have transparency?",
        answer:
          "No — JPG never has transparency information to begin with, so the converted PNG is fully opaque, identical in appearance to the source JPG.",
      },
    ],
    related: ["png-to-jpg", "webp-converter", "favicon-generator", "png-to-pdf"],
  },
  {
    kind: "file-tool",
    slug: "webp-converter",
    category: "image-tools",
    name: "WebP Converter",
    tagline: "Convert any image to the modern, smaller WebP format.",
    seoDescription:
      "Free WebP converter. Convert JPG, PNG or other images to the modern WebP format for smaller file sizes and faster websites — entirely in your browser.",
    component: WebpConverter,
    about: [
      "WebP is a modern image format built specifically for the web: it typically produces 25-35% smaller files than JPEG at equivalent visual quality, and unlike JPEG it also supports transparency — giving PNG-like flexibility with JPEG-like compression efficiency. Every major browser has supported it for years, making it a safe default for web images today.",
      "This tool converts any image you upload — JPG, PNG, or others your browser can decode — into WebP format using the browser's own encoder, the same one used when you save an image as WebP from any web app. The result is typically noticeably smaller than your source file while looking essentially identical at normal viewing sizes.",
      "The main reason to convert: page speed. Image weight is usually the largest contributor to a slow-loading page, and switching a site's images to WebP is one of the highest-leverage, lowest-effort performance improvements available — search engines also factor page speed into ranking, so smaller images can indirectly help SEO too. Conversion happens entirely in your browser, so your source images are never uploaded.",
      "A sensible rollout approach for an existing website: convert your largest, most-viewed images first (hero banners, product photography) since those deliver the biggest page-weight savings for the least effort, then work through the rest of your image library as time allows rather than trying to convert everything in one sitting.",
    ],
    faq: [
      {
        question: "Is WebP supported everywhere?",
        answer:
          "Yes — all major modern browsers (Chrome, Firefox, Safari, Edge) have supported WebP for years. It's safe to use as your primary web image format today.",
      },
      {
        question: "Does WebP support transparency like PNG?",
        answer:
          "Yes — WebP supports full alpha transparency, combining PNG's flexibility with much better compression efficiency, which is part of why it's replacing PNG for many web use cases.",
      },
      {
        question: "How much smaller will my WebP file be?",
        answer:
          "Typically 25-35% smaller than an equivalent-quality JPEG, and often 50%+ smaller than an equivalent PNG — though exact savings depend heavily on the specific image content.",
      },
    ],
    related: ["image-compressor", "png-to-jpg", "jpg-to-png", "image-resizer"],
  },
  {
    kind: "file-tool",
    slug: "image-to-base64",
    category: "image-tools",
    name: "Image to Base64 Converter",
    tagline: "Convert an image into a base64 data URL you can embed directly in code.",
    seoDescription:
      "Free image to base64 converter. Turn any image into a base64 data URL for embedding directly in HTML, CSS or JSON — entirely in your browser.",
    component: ImageToBase64,
    about: [
      "Embedding a small image directly in your HTML or CSS as a base64-encoded data URL avoids an extra network request — useful for tiny icons, inline SVG-style graphics, or email templates where linking to external images is unreliable (many email clients block remote image loading by default). This tool converts any image file into that data URL format, ready to paste directly into your code.",
      "Choose your image and the tool immediately produces the full data:image/…;base64,… string, copy-ready with one click. Paste it directly as an `<img src=\"...\">` value, a CSS `background-image: url(...)`, or a JSON field — anywhere a string is expected instead of a file reference.",
      "Use this sparingly for genuinely small images: base64 encoding inflates the data by roughly 33% compared to the raw file, and large embedded images bloat your HTML/CSS in ways that hurt caching (the browser can't cache an inline image separately from the page it's embedded in). For anything beyond small icons or logos, a regular linked image file, ideally in WebP, usually performs better. Conversion runs entirely in your browser.",
      "Developers also reach for this when building a component library or design system that needs to ship a handful of tiny icons with zero extra HTTP requests, or when embedding a small logo inside a generated PDF or email template where linking to an externally-hosted file risks being blocked or broken.",
    ],
    faq: [
      {
        question: "When should I use base64-embedded images instead of linked files?",
        answer:
          "For small icons, tiny logos, or email templates where remote image loading is unreliable. For anything larger, a linked file usually performs better — the browser can cache it independently of the page.",
      },
      {
        question: "Why is the base64 string so much longer than the original file size?",
        answer:
          "Base64 encoding represents binary data as text, which inflates the size by roughly 33%. A 10 KB image becomes about 13-14 KB of base64 text.",
      },
      {
        question: "Can I use this data URL directly in an HTML img tag?",
        answer:
          'Yes — paste the full string as the src attribute: <img src="data:image/png;base64,…" />. It works identically to a linked image file.',
      },
    ],
    related: ["base64-to-image", "base64-encoder-decoder", "css-gradient-generator", "meta-tag-generator"],
  },
  {
    kind: "file-tool",
    slug: "base64-to-image",
    category: "image-tools",
    name: "Base64 to Image Converter",
    tagline: "Decode a base64 string back into a viewable, downloadable image.",
    seoDescription:
      "Free base64 to image converter. Paste a base64 string or data URL to preview and download the decoded image — entirely in your browser.",
    component: Base64ToImage,
    about: [
      "The reverse of embedding: sometimes you have a base64 string — pulled from an API response, a database export, or someone else's code — and need to actually see what image it represents, or save it as a real file. This tool decodes any base64 image data, whether it's a full data URL (data:image/png;base64,…) or just the raw base64 characters, and shows you the resulting image with a download button.",
      "Paste the string and decode: if it's a valid image, you'll see it rendered immediately, along with a button to save it as a proper image file (with the correct extension inferred from the format). If the data isn't valid image content, you'll get a clear error rather than a blank result.",
      "This is a common debugging step when working with APIs that return images as base64 (common in some backend responses, PDF-embedded images, or webhook payloads) — decoding here lets you quickly verify the image is what you expect before writing code to handle it. Decoding happens entirely in your browser; the string you paste is never sent anywhere.",
      "It's also useful for recovering an image buried inside a JSON export, a saved chat log, or a config file where someone stored an icon as an inline string instead of a separate asset — paste the relevant field's value here rather than writing a one-off script just to look at a single picture.",
    ],
    faq: [
      {
        question: "Do I need the full data:image/… prefix?",
        answer:
          "No — paste either the full data URL or just the raw base64 characters. If you paste raw base64 without a prefix, the tool assumes PNG; add the correct data:image/jpeg;base64, prefix if your data is actually a JPEG.",
      },
      {
        question: "What if the decode fails?",
        answer:
          "You'll see an error message — usually because the string isn't valid base64, is truncated, or doesn't represent actual image data. Double-check you copied the complete string.",
      },
      {
        question: "Is my base64 data sent anywhere?",
        answer:
          "No — decoding happens entirely in your browser by assigning the string as an image source. Nothing is transmitted to a server.",
      },
    ],
    related: ["image-to-base64", "base64-encoder-decoder", "json-formatter", "hash-generator"],
  },
  {
    kind: "file-tool",
    slug: "favicon-generator",
    category: "image-tools",
    name: "Favicon Generator",
    tagline: "Generate a full set of favicon PNGs plus the HTML to reference them.",
    seoDescription:
      "Free favicon generator. Upload a logo image and get a complete set of favicon PNGs at every standard size, plus the HTML snippet to add them to your site.",
    component: FaviconGenerator,
    about: [
      "A favicon is the small icon that appears in browser tabs, bookmarks, and mobile home-screen shortcuts — a detail easy to overlook but one that makes a site look unfinished when missing or blurry. Different contexts want different sizes: browser tabs use tiny 16×16 and 32×32 icons, Apple's home-screen shortcuts want a crisper 180×180, and Android/PWA manifests often request 192×192 or 512×512. This tool generates the full set from a single source image.",
      "Upload a square logo or icon — ideally already close to square, since the generator resizes to each target dimension without cropping — and it produces PNG files at every standard size: 16, 32, 48, 180, 192 and 512 pixels. Each downloads individually, ready to drop into your site's root or assets folder, along with the HTML `<link>` tags needed to reference them correctly in your page's `<head>`.",
      "For best results, start with a simple, high-contrast source image — intricate detail disappears at 16×16, so a bold letterform or simple icon reads far better than a busy logo at favicon scale. Processing happens entirely in your browser; your logo is never uploaded to generate these variants.",
      "Once generated, test the result across a few contexts before considering the job done — open the site in a browser tab, add it to a phone's home screen, and check a bookmark bar. It only takes a minute, and it's the easiest way to catch a favicon that looked fine on a large canvas but turns into an unrecognisable blur at 16×16.",
    ],
    faq: [
      {
        question: "What source image works best for a favicon?",
        answer:
          "A simple, high-contrast square image — a bold letterform, a simple icon, or a logomark rather than a full logo with text. Fine detail becomes illegible at 16×16 pixels, the smallest size generated.",
      },
      {
        question: "Where do I put the generated files?",
        answer:
          "Typically in your site's root directory or a dedicated assets/icons folder, matching the paths in the provided HTML snippet — adjust the href paths if your files live somewhere else.",
      },
      {
        question: "Do I need all six sizes?",
        answer:
          "The 32×32 and 180×180 (Apple touch icon) sizes cover most real-world display contexts. The others improve fidelity on specific platforms (Android home screens, PWA manifests) but are optional if you want a minimal set.",
      },
    ],
    related: ["image-resizer", "png-to-jpg", "image-cropper", "meta-tag-generator"],
  },
  {
    kind: "file-tool",
    slug: "image-color-picker",
    category: "image-tools",
    name: "Image Color Picker",
    tagline: "Click anywhere on an image to get its exact hex and RGB colour.",
    seoDescription:
      "Free image color picker. Click any point on an image to instantly get its hex and RGB colour value — entirely in your browser, no upload required.",
    component: ImageColorPicker,
    about: [
      "Matching a specific colour from a photo, screenshot or design mockup — a brand's exact blue, the background colour behind a logo, a shade you liked in someone else's design — usually means eyeballing it and guessing, which never quite matches. This tool removes the guesswork: click anywhere on your uploaded image and get the exact hex and RGB value at that pixel.",
      "Upload your image, click the point whose colour you need, and the tool reads the actual pixel data at that position — not an approximation, the real value the browser sees. Both hex (for CSS, design tools) and RGB (for canvas code, some design software) formats are shown, with a one-click copy for the hex value.",
      "Practical uses: extracting a brand colour from a logo image someone sent you, matching a background colour from a screenshot, or building a colour palette by sampling several points across a photo or mockup. Once you have a hex value, the color converter tool can translate it to HSL for further palette work. Everything runs locally in your browser — the image never leaves your device.",
      "For the cleanest sample, zoom your browser in first if the area you're targeting is small — clicking on a tiny detail in a shrunk-down preview risks landing a pixel or two off from the colour you actually meant, especially near an edge where two colours blend together.",
    ],
    faq: [
      {
        question: "How accurate is the picked colour?",
        answer:
          "Exact — the tool reads the actual pixel value at the point you click, not an interpolated approximation. What you see is precisely what's stored in the image at that coordinate.",
      },
      {
        question: "Can I pick colours from a screenshot?",
        answer:
          "Yes — any image file works, including screenshots. This is a common way to extract a colour from a website or app you don't have direct access to the CSS for.",
      },
      {
        question: "Why might my picked colour look different when I paste it elsewhere?",
        answer:
          "Colour rendering can vary slightly between different monitors' calibration and colour profiles, though the hex/RGB values themselves are read exactly. For critical brand colour matching, always verify against an official brand guideline if one exists.",
      },
    ],
    related: ["color-converter", "css-gradient-generator", "favicon-generator", "image-cropper"],
  },
  {
    kind: "file-tool",
    slug: "image-rotator-flipper",
    category: "image-tools",
    name: "Image Rotator & Flipper",
    tagline: "Rotate or mirror any image in your browser.",
    seoDescription:
      "Free image rotator and flipper. Rotate any image by 90, 180 or 270 degrees, or flip it horizontally/vertically — entirely in your browser, no upload required.",
    component: ImageRotatorFlipper,
    about: [
      "Photos taken sideways, screenshots captured upside-down, or a graphic that needs to be mirrored for a specific layout — these small orientation fixes shouldn't require opening a full editor. This tool rotates any image by 90°, 180° or 270°, and independently flips it horizontally or vertically, all combinable in one pass.",
      "Choose your rotation angle and toggle the flip options you need — both can be applied together, so you can rotate 90° and flip horizontally in a single operation rather than doing it in two separate steps. The output preserves your image's original quality and format (PNG stays PNG with transparency intact, everything else exports as JPEG).",
      "Common uses: fixing a phone photo that came out sideways due to how the phone was held, mirroring a logo for a design that needs it facing the other direction, or correcting a scanned document's orientation. Processing happens entirely via your browser's canvas API — the image is never uploaded to a server.",
      "A quick tip if you're not sure which way is \"correct\": rotate 90° and check the preview mentally against how the subject should sit before downloading — text is the easiest guide, since it should read left-to-right and upright once the orientation is fixed. If one rotation overshoots, running the tool again on the output nudges it a further 90° until it's right.",
    ],
    faq: [
      {
        question: "Can I rotate and flip at the same time?",
        answer:
          "Yes — select your rotation angle and toggle either or both flip options; all transformations apply together in a single operation.",
      },
      {
        question: "Does rotating change the image dimensions?",
        answer:
          "For 90° and 270° rotations, yes — width and height swap, since the image is turned on its side. 180° rotation and flips keep the original dimensions unchanged.",
      },
      {
        question: "Will this preserve PNG transparency?",
        answer:
          "Yes — if your source is a PNG, the output stays PNG with transparency intact. Other formats export as JPEG with an opaque background.",
      },
    ],
    related: ["image-cropper", "image-resizer", "rotate-pdf", "image-compressor"],
  },
];
