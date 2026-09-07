import type { ToolConfig } from "../../types/tools";
import MergePdf from "../ui/pdf/merge-pdf";
import SplitPdf from "../ui/pdf/split-pdf";
import CompressPdf from "../ui/pdf/compress-pdf";
import { JpgToPdf, PngToPdf } from "../ui/pdf/images-to-pdf";
import { PdfPageRemover, ExtractPdfPages, ReorderPdfPages } from "../ui/pdf/page-tools";
import { RotatePdf } from "../ui/pdf/rotate-pdf";
import WatermarkPdf from "../ui/pdf/watermark-pdf";
import PageNumbersPdf from "../ui/pdf/page-numbers-pdf";
import PdfMetadataEditor from "../ui/pdf/pdf-metadata-editor";

export const tools: ToolConfig[] = [
  {
    kind: "file-tool",
    slug: "merge-pdf",
    category: "pdf-tools",
    name: "Merge PDF",
    tagline:
      "Combine multiple PDFs into one file — right in your browser, files never uploaded.",
    seoDescription:
      "Free online PDF merger. Combine two or more PDF files into a single document in seconds. 100% private: merging happens in your browser and files are never uploaded.",
    component: MergePdf,
    about: [
      "Need to send several PDFs as one document — a proposal with its annexures, scanned pages from your phone, monthly bank statements, or a set of invoices for your accountant? Choose your files, arrange them in the right order with the up and down arrows, and click merge. The combined PDF downloads instantly with every page intact, in exactly the order you set.",
      "Unlike most online PDF tools, this one never uploads your files anywhere. The merging runs entirely in your browser using JavaScript, which means your contracts, financial documents and personal papers stay on your device from start to finish. That matters more than most people realise: a typical online merger sends your files to a remote server, processes them there, and keeps them for some retention period you have no control over. Here there is no server round-trip at all — which also makes merging fast even on a slow connection, because nothing needs to be uploaded or downloaded except your final file.",
      "There's no file-count limit, no size cap beyond your device's memory, no watermark on the output, and no sign-up. The page order follows the file list, so arrange before merging. Password-protected PDFs can't be merged — remove the password in your PDF reader first, then merge. If you need to combine images into a PDF instead, use the JPG to PDF tool from the related tools below once you're done here.",
    ],
    faq: [
      {
        question: "Are my PDF files uploaded to a server?",
        answer:
          "No. This tool runs entirely in your browser using the pdf-lib library. Your files never leave your device, which makes it safe for confidential documents.",
      },
      {
        question: "Can I change the order of the merged PDFs?",
        answer:
          "Yes — use the up/down arrows next to each file to arrange them before merging. Pages keep the order of the file list.",
      },
      {
        question: "Is there a limit on file size or number of files?",
        answer:
          "There is no hard limit. Because processing happens on your device, very large files are limited only by your browser's memory — typically hundreds of megabytes.",
      },
    ],
    related: ["split-pdf", "extract-pdf-pages", "reorder-pdf-pages", "jpg-to-pdf"],
  },
  {
    kind: "file-tool",
    slug: "split-pdf",
    category: "pdf-tools",
    name: "Split PDF",
    tagline: "Split one PDF into two parts at any page — entirely in your browser.",
    seoDescription:
      "Free online PDF splitter. Split a PDF into two files at any page number, right in your browser. No upload, no watermark, no sign-up.",
    component: SplitPdf,
    about: [
      "Sometimes a single PDF is really two documents stuck together — a contract and its annexures, a report and its appendix, a scanned bundle that should have been two separate files. This tool splits any PDF into two parts at whichever page you choose: everything up to and including that page becomes part one, everything after becomes part two, both downloaded automatically.",
      "Choose your file, see the total page count, and enter the page where the split should happen — page 5 of a 12-page document, for instance, produces a 5-page part one and a 7-page part two. There's no limit on how large the source file can be beyond what your browser's memory allows, and because splitting happens entirely client-side, confidential documents never leave your device.",
      "This is the simplest of the page-management tools here; for more control — pulling out a specific non-contiguous set of pages, or removing particular pages rather than splitting at one point — use the extract or remove-pages tools instead. All three share the same private, in-browser processing.",
      "Splitting is often the first step before two documents go their separate ways — one half to accounting, the other to legal, or one part filed and the other emailed on. Because both output files are generated locally and downloaded straight to your device, there's no server copy of either half sitting around afterward, and no waiting on an upload before you can download anything back.",
    ],
    faq: [
      {
        question: "Can I split a PDF into more than two parts?",
        answer:
          "This tool splits into exactly two parts at one chosen page. For extracting several non-contiguous ranges, use the Extract PDF Pages tool, which supports comma-separated ranges like \"1-3, 7, 10-12\".",
      },
      {
        question: "Is my file uploaded anywhere?",
        answer:
          "No — splitting runs entirely in your browser using pdf-lib. The file never leaves your device.",
      },
      {
        question: "What happens to bookmarks and links after splitting?",
        answer:
          "Page content and formatting are preserved exactly; internal links or bookmarks that point across the split point may no longer resolve correctly, since the target page ends up in the other file.",
      },
    ],
    related: ["merge-pdf", "extract-pdf-pages", "pdf-page-remover", "reorder-pdf-pages"],
  },
  {
    kind: "file-tool",
    slug: "compress-pdf",
    category: "pdf-tools",
    name: "Compress PDF",
    tagline: "Shrink a PDF's file size with a lossless structural pass, in your browser.",
    seoDescription:
      "Free PDF compressor. Reduce PDF file size with a lossless structural pass — strips redundant metadata and repacks the file — entirely in your browser.",
    component: CompressPdf,
    about: [
      "PDF files often carry more bytes than their content needs — verbose internal structure, duplicated objects, and metadata fields (author, application version, edit history) that serve no purpose once the document is final. This tool re-saves your PDF with a leaner internal structure and strips that metadata, shrinking the file without touching a single pixel of the visible content.",
      "Be clear-eyed about what this does and doesn't do. It's a lossless, structural compression: text stays crisp, vector graphics stay sharp, and nothing is re-rendered or degraded. What it can't do is recompress embedded images — the biggest source of bloat in scan-heavy or photo-heavy PDFs — because that requires decoding, re-encoding and potentially quality loss, which a lossless browser tool won't do without your explicit consent to a lossy trade-off. For a PDF that's mostly text and light graphics, expect a meaningful reduction; for a PDF built from high-resolution photos, expect the report to tell you the structural pass alone won't move the needle much.",
      "The tool shows you the before-and-after size so you know exactly what you gained. Processing happens entirely in your browser, so uploading a confidential contract or financial report to compress it is not something this tool ever does.",
    ],
    faq: [
      {
        question: "How much smaller will my PDF get?",
        answer:
          "It depends on the source. Text-heavy PDFs with accumulated metadata and redundant structure often shrink noticeably. Image-heavy PDFs (scans, photo-based documents) see little change from this lossless pass, since the images themselves aren't re-encoded.",
      },
      {
        question: "Does compression reduce quality?",
        answer:
          "No — this is a lossless structural compression. Text, vector graphics and embedded images are preserved exactly as they were; only redundant structure and metadata are removed.",
      },
      {
        question: "Is my file uploaded to compress it?",
        answer:
          "No — compression runs entirely in your browser. Your PDF never leaves your device.",
      },
    ],
    related: ["merge-pdf", "split-pdf", "image-compressor", "pdf-metadata-editor"],
  },
  {
    kind: "file-tool",
    slug: "jpg-to-pdf",
    category: "pdf-tools",
    name: "JPG to PDF",
    tagline: "Turn one or more JPG images into a single PDF, in your browser.",
    seoDescription:
      "Free JPG to PDF converter. Combine one or more JPG images into a single PDF document — arrange the order, convert, and download. No upload required.",
    component: JpgToPdf,
    about: [
      "Scanned receipts, photographed documents, ID cards, whiteboard photos — a lot of paperwork enters your phone as a JPG and needs to leave as a PDF, the format banks, government portals and most businesses actually accept. This tool takes one or more JPG images and combines them into a single PDF, one image per page, in whatever order you arrange them.",
      "Add images, reorder with the up/down arrows so the pages come out in the right sequence, and convert — each image becomes a full page sized to match its own dimensions, so nothing is stretched or cropped. This is the quickest path from \"I have five photos of receipts\" to \"I have one PDF to email my accountant,\" without opening a scanner app or a desktop editor.",
      "Everything happens locally: your images are never uploaded, which matters when the photos are of ID documents, medical records, or anything else you'd rather not send to a stranger's server. For PNG images (screenshots, graphics with transparency), use the PNG to PDF tool instead — JPG and PNG need slightly different embedding, handled correctly by each dedicated tool.",
      "There's no limit on how many images you can combine, no compression applied to the photos beyond what your camera already did, and no watermark added to the result. If you later need to combine the resulting PDF with other documents, or trim it down to just a few pages, the Merge PDF and Extract PDF Pages tools in this same suite pick up right where this one leaves off.",
    ],
    faq: [
      {
        question: "Can I combine multiple photos into one PDF?",
        answer:
          "Yes — add as many JPGs as you need, arrange their order with the up/down arrows, and each becomes one page of a single output PDF in that sequence.",
      },
      {
        question: "Will my images be resized or cropped?",
        answer:
          "No — each PDF page is sized to match its source image's exact dimensions, so nothing is stretched, cropped or distorted.",
      },
      {
        question: "What about PNG images?",
        answer:
          "Use the dedicated PNG to PDF tool — PNGs (which may include transparency) are embedded differently than JPGs, and using the matching tool avoids conversion artifacts.",
      },
    ],
    related: ["png-to-pdf", "merge-pdf", "image-compressor", "png-to-jpg"],
  },
  {
    kind: "file-tool",
    slug: "png-to-pdf",
    category: "pdf-tools",
    name: "PNG to PDF",
    tagline: "Turn one or more PNG images into a single PDF, in your browser.",
    seoDescription:
      "Free PNG to PDF converter. Combine one or more PNG images into a single PDF document — arrange the order, convert, and download. No upload required.",
    component: PngToPdf,
    about: [
      "Screenshots, exported graphics, transparent logos, and diagrams saved as PNG often need to become part of a PDF report or submission. This tool combines one or more PNG images into a single PDF, one image per page, sized exactly to each image's own dimensions.",
      "PNG's defining feature — lossless compression with optional transparency — is preserved through the conversion in the sense that image quality never degrades; transparent areas are rendered against a white PDF page background, since PDF pages don't support transparent backgrounds themselves. Add your images, arrange them with the up/down controls so the final PDF reads in the right order, and convert.",
      "As with every tool in this PDF suite, processing is entirely local to your browser — your screenshots and graphics are never uploaded anywhere. If your source images are JPGs instead (common for photos and scans), use the JPG to PDF tool, which embeds that format correctly.",
      "This is a common step when assembling a report or submission from a mix of exported charts, UI screenshots and diagrams that started life as separate PNG files. Once combined, the same suite offers page reordering, watermarking and page numbering if the assembled document needs further polish before it goes out.",
    ],
    faq: [
      {
        question: "What happens to transparent areas in my PNG?",
        answer:
          "They render as white in the output PDF, since PDF pages have an opaque background. If you need the transparency preserved, keep the image as a PNG rather than converting to PDF.",
      },
      {
        question: "Does converting to PDF reduce image quality?",
        answer:
          "No — the PNG is embedded as-is at its original resolution and quality; nothing is recompressed or degraded.",
      },
      {
        question: "Can I mix PNG and JPG images in one PDF?",
        answer:
          "Not with a single tool run — each tool handles one image format for correct embedding. Convert your JPGs and PNGs separately, then use Merge PDF to combine the resulting files into one.",
      },
    ],
    related: ["jpg-to-pdf", "merge-pdf", "favicon-generator", "image-compressor"],
  },
  {
    kind: "file-tool",
    slug: "pdf-page-remover",
    category: "pdf-tools",
    name: "PDF Page Remover",
    tagline: "Delete specific pages from a PDF, in your browser.",
    seoDescription:
      "Free PDF page remover. Delete one or more pages from a PDF by page number or range — entirely in your browser, no upload required.",
    component: PdfPageRemover,
    about: [
      "Sometimes a PDF has a page or two you need gone — a blank scanned page, a cover sheet that doesn't belong in the final version, an outdated appendix, or duplicate pages from a rushed scan. This tool removes exactly the pages you specify, leaving everything else untouched and correctly renumbered in the output.",
      "Enter the pages to remove as a comma-separated list of numbers and ranges — \"3\" removes just page 3, \"3, 7-9\" removes page 3 and pages 7 through 9. The tool shows your document's total page count so you know your numbering is right before running it, and it refuses to remove every single page (you'd be left with nothing), catching that mistake before it happens.",
      "This is the mirror image of Extract PDF Pages: removal keeps everything except what you list, while extraction keeps only what you list. Pick whichever framing is more natural for your task — removing 2 pages from a 50-page document is easier to specify than extracting the other 48. Processing is entirely local to your browser, so sensitive documents never leave your device.",
      "The remaining pages keep their original content and quality exactly as they were — nothing is re-rendered or recompressed in the process, only removed. Once you're happy with the trimmed result, it can be fed straight into the merge, reorder or watermark tools in this same suite if the document needs further assembly before it's final.",
    ],
    faq: [
      {
        question: "How do I specify which pages to remove?",
        answer:
          "Use a comma-separated list of page numbers and ranges, like \"2, 5-7, 10\" — that removes page 2, pages 5 through 7, and page 10, leaving all other pages intact and renumbered in the output.",
      },
      {
        question: "Can I remove every page?",
        answer:
          "No — the tool requires at least one page to remain in the output and will show an error if your selection covers every page.",
      },
      {
        question: "Remove pages or extract pages — which should I use?",
        answer:
          "Use whichever is fewer to type. Removing 2 pages from a 50-page file is simpler than extracting the other 48 — use Extract PDF Pages when you only need a small subset to keep.",
      },
    ],
    related: ["extract-pdf-pages", "split-pdf", "reorder-pdf-pages", "merge-pdf"],
  },
  {
    kind: "file-tool",
    slug: "extract-pdf-pages",
    category: "pdf-tools",
    name: "Extract PDF Pages",
    tagline: "Pull out specific pages from a PDF into a new file, in your browser.",
    seoDescription:
      "Free PDF page extractor. Extract specific pages or ranges from a PDF into a new document — entirely in your browser, no upload required.",
    component: ExtractPdfPages,
    about: [
      "Often you don't need a whole PDF — just the three pages of a contract that matter, the chapter you're referencing, or the single invoice buried in a long statement. This tool extracts exactly the pages you specify into a new, standalone PDF, leaving the source file untouched.",
      "Enter the pages you want as a comma-separated list of numbers and ranges — \"2, 5-7\" pulls out page 2 plus pages 5 through 7 into the new document, in that order. This is the inverse of the page remover: here you list what to keep, there you list what to discard. Choose whichever framing needs less typing for your case.",
      "A common use: extracting a signature page or a specific clause from a long contract to send separately, pulling one chapter out of a large report, or isolating a single invoice from a multi-page statement PDF. As with every tool here, extraction happens entirely in your browser — nothing is uploaded.",
      "Because the source file is never modified — only read to build the new, smaller document — you can extract the same pages more than once with different selections without worrying about losing anything from the original. Combine the result with Merge PDF afterward if the pages you pulled out need to sit alongside content from another file.",
    ],
    faq: [
      {
        question: "How do I specify which pages to extract?",
        answer:
          "Use a comma-separated list of page numbers and ranges, like \"2, 5-7\" — the output PDF contains exactly those pages, in the order listed.",
      },
      {
        question: "Does the order I type the ranges matter?",
        answer:
          "Pages are output in ascending numerical order regardless of how you type the ranges, to keep the result predictable. Use Reorder PDF Pages afterward if you need a different sequence.",
      },
      {
        question: "Is this different from splitting a PDF?",
        answer:
          "Split PDF divides a document into two parts at one point. Extract Pages pulls out an arbitrary, possibly non-contiguous, set of pages into one new file — more flexible when you need pages 2, 5 and 9 but not the ones in between.",
      },
    ],
    related: ["pdf-page-remover", "split-pdf", "reorder-pdf-pages", "merge-pdf"],
  },
  {
    kind: "file-tool",
    slug: "reorder-pdf-pages",
    category: "pdf-tools",
    name: "Reorder PDF Pages",
    tagline: "Rearrange the pages of a PDF into any order, in your browser.",
    seoDescription:
      "Free PDF page reorder tool. Rearrange the pages of a PDF into any order using simple up/down controls — entirely in your browser, no upload required.",
    component: ReorderPdfPages,
    about: [
      "Pages sometimes end up in the wrong order — a scanner that fed sheets out of sequence, a report where a section should come before another, a contract where the signature page needs to move to the end. This tool lets you rearrange every page of a PDF into whatever order you need, without retyping or rescanning anything.",
      "Once you choose your file, every page appears as a numbered slot you can move up or down; the underlying page content never changes, only its position in the final document. Rearrange until the sequence is right, then apply — the output PDF has your exact new order, with page content, formatting and quality fully preserved.",
      "This pairs naturally with the other page tools here: extract the pages you need, reorder them into the right sequence, then merge with other documents if the final assembly needs more than one source file. Everything runs locally in your browser, so reordering a confidential document never means uploading it anywhere.",
      "There's no limit to how many times you can rearrange before applying the change, so it's easy to try a sequence, step back, and try again until the flow reads correctly. The output preserves every page's original quality and formatting — only the order changes, nothing about the content itself.",
    ],
    faq: [
      {
        question: "Does reordering change the page content?",
        answer:
          "No — pages keep their exact content and formatting; only their position in the document changes. Reordering is purely about sequence.",
      },
      {
        question: "Can I reorder a very long document easily?",
        answer:
          "The up/down controls work for any length, though for documents with many pages you may find it faster to extract the specific pages you need into a smaller file first, then reorder those.",
      },
      {
        question: "Is my file uploaded to reorder it?",
        answer:
          "No — reordering runs entirely in your browser using pdf-lib. Your file never leaves your device.",
      },
    ],
    related: ["extract-pdf-pages", "pdf-page-remover", "merge-pdf", "rotate-pdf"],
  },
  {
    kind: "file-tool",
    slug: "rotate-pdf",
    category: "pdf-tools",
    name: "Rotate PDF",
    tagline: "Rotate all or specific pages of a PDF, in your browser.",
    seoDescription:
      "Free PDF rotation tool. Rotate all pages or specific pages of a PDF by 90, 180 or 270 degrees — entirely in your browser, no upload required.",
    component: RotatePdf,
    about: [
      "Scanned documents come out sideways or upside-down more often than anyone would like — a phone held the wrong way, a scanner fed a page in landscape when the document is portrait. This tool rotates a PDF's pages by 90°, 180° or 270°, fixing the orientation without needing to rescan anything.",
      "Every page is shown as a live thumbnail. Use the \"Rotate all\" buttons to spin the whole document, or click individual pages (or select several at once) and rotate just those. Each preview updates immediately to show exactly what will be saved, and rotation stacks on top of whatever orientation a page already has — so you can nudge a sideways page further if one pass isn't enough.",
      "The rotation is a page-level property recognised by every PDF viewer, not a re-render of the content, so text stays sharp and selectable, and file size is essentially unaffected. As always, this runs entirely in your browser — scanned IDs, contracts and reports never leave your device to get straightened out.",
      "This is a quick fix for a problem that otherwise sends people back to a scanner or a phone camera: a handful of sideways pages in an otherwise fine document. Fix the orientation here, then move straight into merging, reordering or numbering if the corrected file needs further assembly.",
    ],
    faq: [
      {
        question: "Can I rotate just some pages, not the whole document?",
        answer:
          "Yes — click the pages you want (a ring highlights each selected page) and use the \"Rotate selected\" buttons, or use a single page's own ⟲ / 180° / ⟳ controls. Pages you leave untouched stay exactly as they are.",
      },
      {
        question: "Does rotating reduce quality or make text unselectable?",
        answer:
          "No — rotation is a metadata-level change to how the page is displayed, not a re-render of its content. Text stays sharp, selectable and searchable exactly as before.",
      },
      {
        question: "What if a page is rotated the wrong way after I apply this?",
        answer:
          "Run the tool again on that page with a different angle — 90° now plus another 90° gives 180° total, so you can nudge orientation in steps until it's correct.",
      },
    ],
    related: ["reorder-pdf-pages", "extract-pdf-pages", "merge-pdf", "split-pdf"],
  },
  {
    kind: "file-tool",
    slug: "add-watermark-to-pdf",
    category: "pdf-tools",
    name: "Add Watermark to PDF",
    tagline: "Stamp a diagonal text watermark across every page, in your browser.",
    seoDescription:
      "Free PDF watermark tool. Add a custom diagonal text watermark like CONFIDENTIAL or DRAFT across every page of a PDF — entirely in your browser.",
    component: WatermarkPdf,
    about: [
      "A watermark communicates a document's status at a glance — DRAFT before it's final, CONFIDENTIAL before it's shared widely, SAMPLE on a preview you're not ready to hand over as the finished product. This tool stamps your chosen text diagonally across every page of a PDF, sized and angled the way professional watermarks conventionally are.",
      "Type your text (CONFIDENTIAL, DRAFT, and your own company name are all common choices), set the opacity, and apply — the watermark appears in light grey at 45 degrees across the centre of every page, visible enough to communicate status without making the underlying content unreadable. Lower opacity for a subtle mark, higher for one that's impossible to miss.",
      "This is a deterrent and a status marker, not a security measure — a determined recipient can remove a text watermark from a PDF with the right tools, so don't rely on it to protect genuinely sensitive content; use it to communicate intent (this is a draft, this isn't for redistribution) to a good-faith reader. Everything runs locally in your browser, so the document you're watermarking is never uploaded.",
      "Watermarking pairs naturally with page numbering when a document is circulating for review — CONFIDENTIAL across the page and a page number in the corner give reviewers both the status and a way to reference a specific spot in comments. Both tools apply cleanly to a file you've already merged, reordered or trimmed with the other tools in this suite.",
    ],
    faq: [
      {
        question: "Can the watermark be removed by someone else?",
        answer:
          "With the right tools, yes — a text watermark like this is a visible marker of status, not a security or DRM measure. Use it to communicate intent to good-faith readers, not to prevent determined misuse.",
      },
      {
        question: "Can I control how visible the watermark is?",
        answer:
          "Yes — the opacity setting ranges from subtle (5-20%, visible but unobtrusive) to bold (70-100%, hard to miss). Most business documents use 20-40%.",
      },
      {
        question: "Does the watermark appear on every page?",
        answer:
          "Yes, it's applied uniformly across every page of the document at the same size, position and angle.",
      },
    ],
    related: ["add-page-numbers-to-pdf", "pdf-metadata-editor", "merge-pdf", "nda-generator"],
  },
  {
    kind: "file-tool",
    slug: "add-page-numbers-to-pdf",
    category: "pdf-tools",
    name: "Add Page Numbers to PDF",
    tagline: "Number every page of a PDF, with your choice of position and starting number.",
    seoDescription:
      "Free PDF page numbering tool. Add page numbers to every page of a PDF with your choice of position (bottom-centre, bottom-right, top-right) and start number.",
    component: PageNumbersPdf,
    about: [
      "A multi-page report, contract or manual without page numbers is harder to navigate, harder to reference in a meeting (\"see page 12\" only works if pages are numbered), and looks unfinished. This tool adds numbers to every page of a PDF in one pass, with the position and starting number you choose.",
      "Pick bottom-centre (the most common convention for formal documents), bottom-right, or top-right, and set the starting number if the first page shouldn't be \"1\" — useful when a cover page or table of contents precedes the numbered content and you want numbering to begin at the first real page, or when this PDF is a continuation of another document.",
      "Numbers are added as new text on each page without altering any existing content underneath, so nothing already on the page is affected. As with the rest of this toolset, the whole operation happens in your browser — the document is never uploaded to add something as simple as page numbers.",
      "This is usually one of the last steps before a document ships — after pages are merged, reordered and trimmed to their final sequence, numbering makes the result easy to navigate and reference. Run it right before you send the file, since renumbering after adding or removing pages later would shift everything that follows.",
    ],
    faq: [
      {
        question: "Can I start numbering from something other than 1?",
        answer:
          "Yes — set the starting number field to whatever the first page should display. This is useful when a cover page precedes the content you want numbered, or the file continues from another document.",
      },
      {
        question: "Will page numbers overlap with my existing content?",
        answer:
          "The default positions (bottom-centre, bottom-right, top-right) sit in the page margins where most documents have blank space. Check the output if your layout uses unusually large margins content, and choose a different position if needed.",
      },
      {
        question: "Can I remove page numbers I've already added?",
        answer:
          "This tool only adds numbers; to remove ones added incorrectly, use your original (un-numbered) file and start over, or edit the PDF in a full editor to delete the specific text elements.",
      },
    ],
    related: ["add-watermark-to-pdf", "merge-pdf", "reorder-pdf-pages", "pdf-metadata-editor"],
  },
  {
    kind: "file-tool",
    slug: "pdf-metadata-editor",
    category: "pdf-tools",
    name: "PDF Metadata Editor",
    tagline: "View and edit a PDF's title, author, subject and keywords.",
    seoDescription:
      "Free PDF metadata editor. View and edit a PDF's title, author, subject and keywords — the properties shown in file browsers and PDF readers — in your browser.",
    component: PdfMetadataEditor,
    about: [
      "Every PDF carries a small set of metadata fields — title, author, subject, keywords — that don't appear on the page itself but show up in file browsers, PDF reader \"document properties\" panels, and search indexes. Left unedited, these often default to whatever a scanner or export tool auto-filled: a generic \"Untitled,\" the wrong author name, or nothing at all.",
      "This tool loads your PDF's current metadata, lets you view and edit each field, and saves an updated copy. Correct metadata matters more than it seems: a properly titled and authored PDF is easier to find later in a folder of similarly-named scans, search engines can index it more usefully if it's ever published online, and a professional document with the right author name looks more polished when a recipient checks its properties.",
      "It's also useful defensively — removing metadata that leaked from an internal template (an old company name, a previous author who's since left) before sending a document externally. As with every tool in this suite, your file is read and edited entirely in your browser; the metadata you're viewing is never transmitted anywhere.",
      "A quick pass with this tool before publishing or sharing a PDF externally takes seconds and closes off a small but real source of accidental information leakage. Pair it with Compress PDF, which also strips redundant metadata as part of its structural cleanup, if file size is a concern too.",
    ],
    faq: [
      {
        question: "Where do these metadata fields actually show up?",
        answer:
          "In your operating system's file properties dialog, in your PDF reader's \"Document Properties\" panel, and in search engine indexing if the file is published online. They're invisible on the printed or displayed page itself.",
      },
      {
        question: "Can I remove metadata entirely rather than edit it?",
        answer:
          "Yes — clear a field and save; an empty value is written in its place. This is useful for stripping an old author name or internal project code before sharing a document externally.",
      },
      {
        question: "Does editing metadata change the document's visible content?",
        answer:
          "No — metadata is separate from the page content. Editing title, author, subject or keywords has no effect on what's displayed when the PDF is opened or printed.",
      },
    ],
    related: ["compress-pdf", "add-watermark-to-pdf", "merge-pdf", "privacy-policy-generator"],
  },
];
