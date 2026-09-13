import type { ToolConfig } from "../../types/tools";
import ImageCompressor from "../ui/image/image-compressor";
import ImageResizer from "../ui/image/image-resizer";
import ImageCropper from "../ui/image/image-cropper";
import { PngToJpg, JpgToPng, WebpConverter } from "../ui/image/format-converter";
import { ImageToBase64, Base64ToImage } from "../ui/image/base64-image";
import { FaviconGenerator } from "../ui/image/favicon-generator";
import { ImageColorPicker } from "../ui/image/image-color-picker";
import { ImageRotatorFlipper } from "../ui/image/image-rotator-flipper";
import ImageBackgroundRemover from "../ui/image/bg-remover";

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
    directAnswer: "An image compressor shrinks the file size of your photos by reducing their quality level (usually imperceptible at 80-90%), making them load faster on websites and fit within email limits.",
    example: "A 5 MB smartphone photo compressed at 80% quality typically drops to under 1 MB, keeping the visual detail intact while saving 80% of the storage space.",
    steps: [
      { title: "Select Image", description: "Choose the image you want to compress from your device." },
      { title: "Adjust Quality", description: "Move the quality slider (80% is a great starting point for photos)." },
      { title: "Compare Size", description: "Check the estimated new size compared to the original." },
      { title: "Download", description: "Save your optimized image instantly." }
    ],
    faq: [
      {
        question: "What's the best quality setting to use for my photos?",
        answer: "80% is a fantastic starting point for most pictures. It gives you a great size reduction without any visible loss in quality. If you're making tiny web thumbnails or need to email a lot of photos, you can safely drop it to 50-60%."
      },
      {
        question: "Will compressing my photo change its file format?",
        answer: "Nope! The tool keeps your original format exactly as it is. A PNG stays a PNG, a JPEG stays a JPEG, and WebP stays WebP. We don't mess with your file types or transparency."
      },
      {
        question: "Is it safe to compress personal or sensitive photos here?",
        answer: "Absolutely. The entire compression process happens right inside your web browser. Your images are never uploaded to any external servers, so your privacy is completely secure."
      },
      {
        question: "Why should I bother compressing my images?",
        answer: "Large images slow down websites, eat up your phone's storage, and can get blocked by email size limits. Compressing them fixes all these problems while keeping the picture looking great."
      },
      {
        question: "Can I compress images on my mobile phone using this tool?",
        answer: "Yes! Our tool is fully responsive and works perfectly on mobile browsers. You can compress photos directly from your phone's camera roll."
      }
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
    directAnswer: "An image resizer changes the physical dimensions (width and height in pixels) of an image, allowing you to scale photos down for websites or fit specific social media requirements.",
    example: "If you have a 4000x3000 photo but only need it for a blog post, you can resize it to 800x600. This dramatically reduces the file size and makes the image fit your layout perfectly.",
    steps: [
      { title: "Upload Photo", description: "Select the image you need to resize." },
      { title: "Set Dimensions", description: "Enter your target width or height (keep the lock on to maintain proportions)." },
      { title: "Preview", description: "Review the new dimensions and scaled image." },
      { title: "Download", description: "Save your perfectly sized image." }
    ],
    faq: [
      {
        question: "What happens if I turn off the aspect ratio lock?",
        answer: "If you unlock the aspect ratio, the width and height become independent. You can set them to anything you want, but your image will likely stretch or squash if the new ratio doesn't match the original."
      },
      {
        question: "Is it a good idea to upscale a small image to a much larger size?",
        answer: "You can do it, but upscaling adds new pixels through guesswork (interpolation). This means very small images will look soft or blurry when enlarged significantly. It's always best to scale down from a larger original if possible."
      },
      {
        question: "What are the best image sizes for social media posts?",
        answer: "Common targets are 1200×630 for link previews on Facebook and LinkedIn, 1080×1080 for Instagram square posts, and 1080×1920 for Stories or Reels. Always check the specific platform for their latest recommendations!"
      },
      {
        question: "Will resizing my image reduce its file size?",
        answer: "Yes, reducing the pixel dimensions of an image is one of the most effective ways to lower its file size, which is perfect for speeding up website load times."
      },
      {
        question: "Are my photos kept private when I resize them?",
        answer: "Absolutely. All the resizing math happens directly in your browser. Your photos are never uploaded to our servers or sent anywhere else."
      }
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
    directAnswer: "An image cropper lets you trim away the outer edges of a picture, helping you focus on the main subject or remove distracting background elements.",
    example: "If you took a wide landscape photo but only want to show the person standing in the center, you can draw a crop box around them to create a focused portrait.",
    steps: [
      { title: "Select Image", description: "Open the photo you want to crop." },
      { title: "Draw Crop Area", description: "Click and drag over the part of the image you want to keep." },
      { title: "Adjust Selection", description: "Redraw the box if needed to get the perfect frame." },
      { title: "Crop & Save", description: "Click crop to trim the edges and download the result." }
    ],
    faq: [
      {
        question: "How accurate is the cropping tool?",
        answer: "It's completely precise. The box you draw on your screen is mapped directly to the actual pixels of your image, ensuring your final crop is exactly what you selected."
      },
      {
        question: "What if I make a mistake with my selection?",
        answer: "No worries! Just click and drag again to draw a new selection box. Each new drag replaces the old one, so you can easily try again until it's perfect."
      },
      {
        question: "What file format will my cropped image be saved in?",
        answer: "We try to match your original file. If you upload a PNG (which supports transparency), your cropped file will also be a PNG. Most other formats will be exported as standard JPEGs."
      },
      {
        question: "Why should I crop images before posting them online?",
        answer: "Cropping helps you remove messy backgrounds, frame your subject better, and ensure your photo fits nicely into the square or circular frames often used by social media platforms."
      },
      {
        question: "Does the cropping process happen on my device or in the cloud?",
        answer: "Everything happens right on your device in your web browser. Your images are never uploaded to any servers, ensuring your privacy."
      }
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
    directAnswer: "A PNG to JPG converter changes your image from the lossless PNG format to the widely-compatible, compressed JPG format, which often significantly reduces the file size.",
    example: "If you have a 3 MB PNG screenshot, converting it to JPG can shrink it down to just 400 KB, making it much easier to email or upload to a website.",
    steps: [
      { title: "Upload PNG", description: "Select the PNG image you want to convert." },
      { title: "Automatic Conversion", description: "The tool instantly flattens any transparency and converts it to JPG." },
      { title: "Download JPG", description: "Save the new, smaller JPG file to your device." }
    ],
    faq: [
      {
        question: "What happens to the transparent parts of my PNG?",
        answer: "Because JPG files don't support transparency, any clear areas in your PNG will be automatically filled with a solid white background during the conversion."
      },
      {
        question: "Will converting to JPG make my file size smaller?",
        answer: "Usually, yes! JPG compression is highly efficient for photos and complex images, so you'll often see a significant drop in file size compared to the original PNG."
      },
      {
        question: "Does changing from PNG to JPG ruin the image quality?",
        answer: "JPG is a 'lossy' format, meaning it discards a tiny bit of data to save space. However, at normal viewing sizes, the quality loss is usually imperceptible. You might only notice it if you zoom in closely on fine text."
      },
      {
        question: "Why would I need to convert a PNG to a JPG?",
        answer: "Many websites, online forms, and older software platforms only accept JPG files. It's also a great way to save storage space if you don't need a perfectly lossless image."
      },
      {
        question: "Are my files uploaded when I convert them?",
        answer: "No, the entire conversion from PNG to JPG happens locally within your web browser, so your images remain completely private."
      }
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
    directAnswer: "A JPG to PNG converter changes a compressed JPG image into the lossless PNG format, which is ideal if you plan to make further edits without losing more quality.",
    example: "If you have a JPG logo and need to edit it in design software without adding more compression artifacts each time you save, converting it to PNG locks in the current quality.",
    steps: [
      { title: "Select JPG", description: "Choose the JPG file you need to convert." },
      { title: "Process", description: "The tool losslessly encodes your JPG pixels into the PNG format." },
      { title: "Download PNG", description: "Save your new PNG file, ready for editing." }
    ],
    faq: [
      {
        question: "Will converting my JPG to a PNG make it look better?",
        answer: "Unfortunately, no. The quality lost when the JPG was originally saved is permanent. Converting to PNG won't restore lost detail, but it will prevent the image from losing any more quality when you edit and save it again in the future."
      },
      {
        question: "Why is the new PNG file so much larger than my original JPG?",
        answer: "This is totally normal. PNG uses lossless compression, which preserves every single pixel perfectly but takes up more storage space. JPG uses lossy compression, which is much smaller but sacrifices some detail."
      },
      {
        question: "Will the new PNG file have a transparent background?",
        answer: "No, because the original JPG didn't have any transparency data. The converted PNG will be fully opaque and look exactly like the original JPG."
      },
      {
        question: "When should I actually use this converter?",
        answer: "It's best used when you have a JPG that you need to edit multiple times in software like Photoshop, or when a specific program strictly requires you to upload a .png file."
      },
      {
        question: "Is this tool safe to use for sensitive documents?",
        answer: "Yes! The conversion happens entirely on your own computer inside your browser. Nothing is ever sent to a server."
      }
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
    directAnswer: "A WebP converter changes traditional images like JPGs and PNGs into the highly efficient WebP format, which provides smaller file sizes and faster loading times for websites.",
    example: "A 1 MB JPEG banner image converted to WebP might drop to just 700 KB while looking identical, significantly speeding up how fast your web page loads.",
    steps: [
      { title: "Select File", description: "Upload a JPG, PNG, or other standard image file." },
      { title: "Convert", description: "The browser's built-in encoder transforms it into WebP." },
      { title: "Download", description: "Save your lightweight WebP image for web use." }
    ],
    faq: [
      {
        question: "Can I use WebP images on any modern web browser?",
        answer: "Yes! All major modern browsers, including Chrome, Firefox, Safari, and Edge, have supported WebP for years. It's a completely safe and standard format to use on your websites today."
      },
      {
        question: "Does WebP handle transparent backgrounds like PNGs do?",
        answer: "It sure does. WebP supports full transparency, giving you the flexibility of a PNG but with much better file size compression. It's truly the best of both worlds."
      },
      {
        question: "How much space will I actually save by converting to WebP?",
        answer: "On average, WebP files are about 25% to 35% smaller than equivalent JPEGs, and often over 50% smaller than PNGs. The exact savings depend on the specific image, but it's usually a noticeable improvement."
      },
      {
        question: "Why should I bother changing all my website images to WebP?",
        answer: "Smaller images mean your website loads faster. A faster website provides a better user experience, keeps visitors from leaving, and can even boost your SEO rankings on Google."
      },
      {
        question: "Do I need to worry about my images being uploaded to a server?",
        answer: "Not at all. The conversion process is handled directly by your web browser, meaning your original images stay safely on your device."
      }
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
    directAnswer: "An image to Base64 converter translates your visual image file into a long string of text (a data URL), allowing you to embed the image directly into HTML, CSS, or JSON without needing a separate file download.",
    example: "If you have a tiny 5 KB icon, converting it to a Base64 string lets you paste the code right into your CSS. This means the browser doesn't have to make an extra network request to fetch the image.",
    steps: [
      { title: "Select Image", description: "Choose the image you want to encode." },
      { title: "Convert", description: "The tool instantly generates the Base64 text string." },
      { title: "Copy Code", description: "Click to copy the full data URL to your clipboard." },
      { title: "Paste", description: "Insert the string into your HTML src attribute or CSS." }
    ],
    faq: [
      {
        question: "When is it actually a good idea to use Base64 images?",
        answer: "They are perfect for very small icons, tiny logos, or images inside HTML email templates where linking to external files can cause issues. For large photos, sticking to regular linked files is much better."
      },
      {
        question: "Why does the Base64 text make my file size larger?",
        answer: "Base64 encoding translates binary data into readable text characters. This process naturally inflates the file size by about 33%, which is why it's only recommended for small images."
      },
      {
        question: "Can I use the generated string directly in my HTML?",
        answer: "Yes, you can! Just copy the entire string (which starts with data:image/...) and paste it right into the src attribute of an <img> tag."
      },
      {
        question: "Is there a limit to how large an image I can encode?",
        answer: "While you theoretically can encode large images, doing so will create a massive wall of text that can seriously slow down your code editor and your website's performance. Stick to small files!"
      },
      {
        question: "Do you save the images I encode?",
        answer: "No, the encoding happens entirely in your web browser. Your images are never sent to our servers."
      }
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
    directAnswer: "A Base64 to Image converter takes a long string of encoded text and translates it back into a viewable, downloadable image file, which is incredibly useful for debugging API responses or extracting embedded assets.",
    example: "If a database export gives you a massive block of text instead of a profile picture, you can paste that text here to see the actual image and save it as a PNG or JPG.",
    steps: [
      { title: "Paste String", description: "Paste your Base64 text or full data URL." },
      { title: "Decode", description: "The tool instantly renders the image on screen." },
      { title: "Verify", description: "Check that the image looks correct and isn't corrupted." },
      { title: "Download", description: "Save the decoded visual as a standard image file." }
    ],
    faq: [
      {
        question: "Do I have to include the 'data:image/...' part at the beginning?",
        answer: "Nope! You can paste the full data URL if you have it, or just the raw Base64 characters. If it's just characters, we'll assume it's a PNG by default."
      },
      {
        question: "Why am I getting an error when I try to decode my string?",
        answer: "Errors usually happen if the string was accidentally cut off when copying, if it contains invalid characters, or if it simply isn't actual image data. Make sure you copied the whole thing!"
      },
      {
        question: "Can this tool handle really large Base64 strings?",
        answer: "Yes, it can handle large strings, though very massive ones might cause your browser to lag for a moment while pasting. The decoding itself is nearly instant."
      },
      {
        question: "What file format will the downloaded image be?",
        answer: "The tool looks at the data to determine the original format. If it was encoded as a JPEG, it will download as a JPEG. If it's raw text, it defaults to PNG."
      },
      {
        question: "Is my Base64 data secure?",
        answer: "Yes! The decoding process is handled entirely by your browser rendering the text as an image source. No data is sent to our servers."
      }
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
    directAnswer: "A Favicon Generator takes your logo and automatically creates the tiny icons seen in browser tabs, bookmarks, and mobile home screens, providing all standard sizes and the HTML code needed to install them.",
    example: "Upload your square logo, and the tool will generate a 16x16 icon for standard tabs, a 180x180 icon for Apple devices, and provide the exact `<link>` tags to paste into your website's `<head>`.",
    steps: [
      { title: "Upload Logo", description: "Select a square, high-contrast image (like a symbol or letter)." },
      { title: "Generate", description: "The tool instantly creates a complete set of resized PNGs." },
      { title: "Download", description: "Save the individual icons you need." },
      { title: "Copy Code", description: "Grab the provided HTML snippets to add to your site." }
    ],
    faq: [
      {
        question: "What type of image makes the best favicon?",
        answer: "A simple, bold, and high-contrast square image works best. Remember, these icons shrink down to just 16x16 pixels, so complex logos with fine text will just look like a blurry smudge."
      },
      {
        question: "Where am I supposed to put these files on my website?",
        answer: "Typically, you should place them in the root directory of your website (the main folder) or in a dedicated 'assets' or 'icons' folder. Just make sure the paths in your HTML snippet match where you saved them!"
      },
      {
        question: "Do I really need to use all six generated sizes?",
        answer: "Not necessarily. The 32x32 size for browsers and the 180x180 size for Apple devices cover the vast majority of needs. The others are great for Android and specific web apps, but are optional."
      },
      {
        question: "Why isn't there an .ico file option?",
        answer: "Modern web browsers haven't needed .ico files for years. Standard PNG files are universally supported, offer better quality, and are much easier to work with."
      },
      {
        question: "Is my logo uploaded to your servers to make these?",
        answer: "No, all the resizing and file generation happens directly in your web browser. Your original logo is never uploaded or saved by us."
      }
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
    directAnswer: "An image color picker lets you click anywhere on a picture to instantly find out the exact Hex and RGB codes of that specific pixel, removing the need to guess colors manually.",
    example: "If a client sends you a mockup and you need to match their exact brand blue, just upload the image, click the blue area, and instantly copy the #1A73E8 Hex code to use in your CSS.",
    steps: [
      { title: "Upload Image", description: "Select the photo, screenshot, or mockup." },
      { title: "Click to Sample", description: "Click anywhere on the image to sample the pixel color." },
      { title: "Review Value", description: "See the exact Hex and RGB values displayed." },
      { title: "Copy", description: "Click to copy the Hex code to your clipboard." }
    ],
    faq: [
      {
        question: "Is the color it picks completely accurate?",
        answer: "Yes, it is perfectly accurate to the image file. The tool reads the exact mathematical pixel value at the coordinates you click. What you see is exactly what is stored in the image."
      },
      {
        question: "Can I use this tool to pick colors from a website screenshot?",
        answer: "Absolutely! Taking a screenshot of a website and using this tool is one of the easiest ways to figure out what colors a site is using if you don't know how to inspect their CSS."
      },
      {
        question: "Why does the color look slightly different when I use it in my design?",
        answer: "Different monitors are calibrated differently and use various color profiles. While the hex code is mathematically exact, your screen might display it slightly differently than the original creator intended."
      },
      {
        question: "What's the best way to pick a color from a tiny detail?",
        answer: "If you need a color from a very small area, use your browser's zoom feature to make the image much larger before clicking. This helps ensure you don't accidentally click a neighboring pixel."
      },
      {
        question: "Do my images get uploaded when I use the color picker?",
        answer: "No, your images are loaded directly into your browser's memory. They are never transmitted over the internet or saved to our servers."
      }
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
    directAnswer: "An image rotator and flipper allows you to instantly correct the orientation of a photo or mirror it horizontally/vertically without needing to open complex photo editing software.",
    example: "If you took a photo with your phone that accidentally saved sideways, you can upload it here, click 'Rotate 90°', and download the perfectly upright version in seconds.",
    steps: [
      { title: "Upload Image", description: "Select the photo that needs fixing." },
      { title: "Rotate or Flip", description: "Choose your rotation angle (90, 180, 270) or flip direction." },
      { title: "Preview", description: "Check that the new orientation looks correct." },
      { title: "Download", description: "Save the corrected image back to your device." }
    ],
    faq: [
      {
        question: "Can I rotate the image and flip it at the same time?",
        answer: "Yes! You can select a rotation angle and toggle the flip options simultaneously. All the changes will be applied at once when you download the final image."
      },
      {
        question: "Does rotating the image change its overall size or dimensions?",
        answer: "If you rotate by 90 or 270 degrees, the width and height will swap places (a wide image becomes tall). If you flip it or rotate by 180 degrees, the dimensions stay exactly the same."
      },
      {
        question: "Will flipping a PNG image ruin its transparent background?",
        answer: "Not at all. If you upload a PNG with transparency, the tool preserves the alpha channel perfectly. Your downloaded image will still be a transparent PNG."
      },
      {
        question: "How do I know if I've rotated it the right way?",
        answer: "The easiest way is to look for text or people in the image. Text should read left-to-right, and gravity should look natural. If you get it wrong, just rotate it another 90 degrees!"
      },
      {
        question: "Is this tool safe for private or personal photos?",
        answer: "Absolutely. All the image processing is done using your browser's built-in canvas capabilities. Your photos never leave your device."
      }
    ],
    related: ["image-cropper", "image-resizer", "rotate-pdf", "image-compressor"],
  },
  {
    kind: "file-tool",
    slug: "image-background-remover",
    category: "image-tools",
    name: "Image Background Remover",
    tagline: "Erase the background from any image with on-device AI — truly transparent output.",
    seoDescription:
      "Free AI background remover. Cut out the subject of any image with a real segmentation model running in your browser and download a genuinely transparent PNG or WebP — no upload, no watermark.",
    component: ImageBackgroundRemover,
    about: [
      "Getting a clean cut-out — a product photo on plain white, a portrait you want to flip onto a different background, a logo on a busy backdrop — usually means either pixel-brushing by hand or paying for an online service that uploads your images to their servers. This tool removes the background properly, using a real AI segmentation model, and runs it entirely on your device.",
      "Unlike a threshold or colour-key tool, the model (ISNet, running through ONNX in your browser) understands image content: it identifies the subject of the photo — a person, product, animal, or object — and separates it from the background by analysing edges and shapes, not just colour. Semi-transparent details like hair and fur are kept genuinely semi-transparent rather than replaced with white or black pixels, and the result is a true alpha channel: no checkerboard or white rectangle is ever baked into the file.",
      "The output is always transparent-PNG or transparent-WebP at your original dimensions, downloaded straight from your browser. JPEG is intentionally not offered because it cannot store transparency, and no SVG is offered either — a transparent PNG or WebP is the honest equivalent for a raster image like a photo. Everything happens client-side: the segmentation model is loaded once from this site (~44 MB, then cached), your image never leaves your device, and nothing is uploaded, stored, or watermarked.",
      "For best results use a clear photo of a single subject with a reasonably distinct background — a clean studio shot or a portrait. Very busy or heavily textured backgrounds, highly reflective subjects, or full-body shots with thin limbs and hair can leave small fringe artifacts at the edges, which is a limit of segmentation technology rather than a bug. Very large images (over roughly 16 megapixels) are automatically scaled down during processing to keep the math fast and stable in the browser.",
    ],
    directAnswer: "An AI background remover automatically detects the main subject of your photo (like a person or product) and erases the background, leaving you with a perfectly transparent image cutout.",
    example: "You can take a photo of a coffee mug sitting on a cluttered desk, and the AI will cut out just the mug, allowing you to place it onto a clean white background for an online store.",
    steps: [
      { title: "Upload Photo", description: "Select an image with a clear subject (people, pets, or products work best)." },
      { title: "AI Processing", description: "Wait a few moments while the on-device AI analyzes and isolates the subject." },
      { title: "Preview Cutout", description: "Review the transparent result to ensure the edges are clean." },
      { title: "Download PNG", description: "Save the image with true alpha transparency." }
    ],
    faq: [
      {
        question: "Does this tool actually use real AI?",
        answer: "Yes, it runs a powerful AI segmentation model (ISNet) right inside your web browser. It doesn't just guess based on colors; it actually understands what the subject of the photo is to make incredibly accurate cutouts."
      },
      {
        question: "Is my photo uploaded to your servers for the AI to process?",
        answer: "No! This is the magic of on-device AI. Your browser downloads the AI model once, and then all the heavy lifting happens locally on your computer. Your photos remain 100% private."
      },
      {
        question: "Why can't I download my cutout as a JPEG?",
        answer: "JPEG files simply do not support transparency. If we offered a JPEG download, your transparent background would just turn into a solid white or black box. We provide PNG and WebP formats so you keep that perfect transparency."
      },
      {
        question: "What types of photos work best with this tool?",
        answer: "Photos with a single, clear subject and a distinct background work wonderfully (like portraits or product shots). Super busy backgrounds or subjects with very fine, wispy hair might leave tiny imperfections at the edges."
      },
      {
        question: "Will removing the background change the size of my image?",
        answer: "The physical dimensions (width and height) will stay the same unless your image is massive (over 16 megapixels), in which case we scale it down slightly so your browser doesn't crash. The file size will change because it's being saved as a new PNG."
      }
    ],
    related: ["png-to-jpg", "webp-converter", "image-compressor", "image-cropper"],
  },
];
