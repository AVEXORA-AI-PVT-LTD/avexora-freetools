import type { ToolConfig } from "../types";
import MergePdf from "../ui/pdf/merge-pdf";

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
];
