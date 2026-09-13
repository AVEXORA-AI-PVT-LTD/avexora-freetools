"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { inputCls, labelCls, primaryBtn, secondaryBtn } from "@/tools/ui/ui-tokens";
import { useAuthDownload, useRestoredDownload } from "@/components/account/use-auth-download";
import { RestoredDownload } from "@/components/account/restored-download";
import {
  BULK_PREVIEW_COUNT,
  MAX_BULK_QTY,
  PRODUCT_NAME_MAX,
  SKU_MAX,
  baseFilename,
  buildLabelSheetHtml,
  buildLabelSpecs,
  buildLabelZip,
  buildProductsCsv,
  code128Validation,
  emptyProductForm,
  normalizeEAN13,
  normalizeUPCA,
  renderBarcodeToSvg,
  sanitizeFilenameSegment,
  svgInnerContent,
  svgViewBoxAttribute,
  validateProductForm,
  type BarcodeFormat,
  type BulkMode,
  type GeneratorMode,
  type LabelSheetCell,
  type LabelSpec,
  type ProductForm,
  type ProductFormErrors,
  type ProductFormNormalized,
} from "@/tools/compute/dev/barcode";

const FORMATS: Array<{
  value: BarcodeFormat;
  label: string;
  inputLabel: string;
  placeholder: string;
  hint: string;
}> = [
  {
    value: "ean13",
    label: "EAN-13",
    inputLabel: "EAN-13 value",
    placeholder: "400638133393  (12 digits, or 13 with check digit)",
    hint: "Enter 12 digits to auto-generate the 13th check digit, or a complete 13-digit value with a valid check digit.",
  },
  {
    value: "upca",
    label: "UPC-A",
    inputLabel: "UPC-A value",
    placeholder: "01234567890  (11 digits, or 12 with check digit)",
    hint: "Enter 11 digits to auto-generate the 12th check digit, or a complete 12-digit value with a valid check digit. Leading zeros are preserved.",
  },
  {
    value: "code128",
    label: "Code 128",
    inputLabel: "Code 128 value",
    placeholder: "PRODUCT-123 (printable letters, digits and symbols)",
    hint: "Code 128 encodes the full printable ASCII set — uppercase, lowercase, digits, common punctuation and spaces.",
  },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function Segment<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-slate-300 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={
            value === option.value
              ? "rounded bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white"
              : "rounded px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600">
      {children}
    </p>
  );
}

function validateFormat(format: BarcodeFormat, input: string): { error: string | null; value: string | null } {
  switch (format) {
    case "ean13": {
      const r = normalizeEAN13(input);
      if ("valid" in r) return { error: r.reason, value: null };
      return { error: null, value: r.value };
    }
    case "upca": {
      const r = normalizeUPCA(input);
      if ("valid" in r) return { error: r.reason, value: null };
      return { error: null, value: r.value };
    }
    case "code128": {
      const check = code128Validation(input);
      if (!check.valid)
        return { error: check.reason ?? "Enter a valid Code 128 value using supported characters.", value: null };
      return { error: null, value: input.trim() };
    }
  }
}

interface Preview {
  svg: string;
  format: BarcodeFormat;
  value: string;
}

type LabelCard = { spec: LabelSpec; svg: string };

export default function BarcodeGenerator() {
  const [format, setFormat] = useState<BarcodeFormat>("ean13");
  const [input, setInput] = useState("");
  const [barWidth, setBarWidth] = useState("2");
  const [barHeight, setBarHeight] = useState("80");
  const [displayValue, setDisplayValue] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"png" | "svg">("png");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [mode, setMode] = useState<GeneratorMode>("normal");
  const [product, setProduct] = useState<ProductForm>(() => emptyProductForm());
  const [productErrors, setProductErrors] = useState<ProductFormErrors>({});
  const [lastNorm, setLastNorm] = useState<ProductFormNormalized | null>(null);
  const [resultSpecs, setResultSpecs] = useState<LabelSpec[] | null>(null);
  const [resultPreview, setResultPreview] = useState<LabelCard[] | null>(null);
  const [bulkState, setBulkState] = useState<"idle" | "generating" | "ready">("idle");
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const generatedIdsRef = useRef<Set<string>>(new Set());
  const { download: gateDownload, downloadOne: gateDownloadOne, requireAuth } = useAuthDownload();
  const { restored } = useRestoredDownload();

  const meta = FORMATS.find((f) => f.value === format)!;
  const newIsEanUpc = product.format === "ean13" || product.format === "upca";

  // Validation is derived during render: it updates instantly on every input
  // and format change (errors from a previous format never linger).
  const derived = useMemo(() => validateFormat(format, input), [format, input]);
  const validationError = derived.error;

  // Live preview: regenerate whenever input/config changes. State is only
  // written inside promise callbacks so previews stay in sync with the current
  // value and a stale result can never be shown after a change.
  useEffect(() => {
    const norm = validateFormat(format, input);
    if (norm.error || !norm.value) return;
    const value = norm.value;
    let active = true;
    const barcodeOpts = {
      width: clamp(Number(barWidth), 1, 5),
      height: clamp(Number(barHeight), 40, 300),
      displayValue,
      margin: 10,
    };
    Promise.resolve()
      .then(() => renderBarcodeToSvg(format, value, barcodeOpts))
      .then((svg) => {
        if (!active) return;
        setGenerationError(null);
        setPreview({ svg, format, value });
      })
      .catch(() => {
        if (!active) return;
        setGenerationError("This value cannot be encoded as a valid barcode. Check the input and try again.");
        setPreview(null);
      });
    return () => {
      active = false;
    };
  }, [format, input, displayValue, barWidth, barHeight, outputFormat]);

  // The preview is only "current" when it matches the validated value/format —
  // a stale output from a previous input or format is never shown or downloaded.
  const previewReady =
    !!preview && !validationError && !generationError && preview.format === format && preview.value === derived.value;

  const displayedError = validationError ?? generationError;

  const handleFormatChange = (value: string) => {
    setFormat(value as BarcodeFormat);
    setGenerationError(null);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setGenerationError(null);
  };

  const download = () => {
    if (!preview || !previewReady) return;
    const base = baseFilename(format, preview.value);
    if (outputFormat === "svg") {
      const blob = new Blob([preview.svg], { type: "image/svg+xml" });
      gateDownloadOne(blob, `${base}.svg`);
      return;
    }
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, preview.value, {
        format: format === "ean13" ? "EAN13" : format === "upca" ? "UPC" : "CODE128",
        width: clamp(Number(barWidth), 1, 5),
        height: clamp(Number(barHeight), 40, 300),
        displayValue,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          setGenerationError("This value cannot be rendered as a downloadable PNG. Check the input and try again.");
          return;
        }
        gateDownloadOne(blob, `${base}.png`);
      }, "image/png");
    } catch {
      setGenerationError("This value cannot be rendered as a downloadable PNG. Check the input and try again.");
    }
  };

  const reset = () => {
    setFormat("ean13");
    setInput("");
    setBarWidth("2");
    setBarHeight("80");
    setDisplayValue(true);
    setOutputFormat("png");
    setGenerationError(null);
    setPreview(null);
  };

  // --- "Generate New" workflow ------------------------------------------

  const setProductField = (field: keyof ProductForm, value: string) =>
    setProduct((prev) => ({ ...prev, [field]: value }));

  const setBulkMode = (value: BulkMode) => setProduct((prev) => ({ ...prev, bulkMode: value }));

  const renderLabelSvg = (spec: LabelSpec) =>
    Promise.resolve(
      renderBarcodeToSvg(spec.format, spec.content, {
        width: clamp(Number(barWidth), 1, 5),
        height: clamp(Number(barHeight), 40, 300),
        displayValue: false,
        margin: 10,
      }),
    );

  const renderLabelFile = async (spec: LabelSpec, ext: "png" | "svg"): Promise<Blob> => {
    if (ext === "svg") {
      return new Blob([await renderLabelSvg(spec)], { type: "image/svg+xml" });
    }
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, spec.content, {
      format: spec.format === "ean13" ? "EAN13" : spec.format === "upca" ? "UPC" : "CODE128",
      width: clamp(Number(barWidth), 1, 5),
      height: clamp(Number(barHeight), 40, 300),
      displayValue: false,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
    });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("PNG export failed");
    return blob;
  };

  const generate = async () => {
    if (bulkState === "generating") return;
    const check = validateProductForm(product);
    if (!check.normalized) {
      setProductErrors(check.errors);
      setBulkStatus(null);
      return;
    }
    const normalized = check.normalized;
    const specs = buildLabelSpecs(normalized);
    if (normalized.format !== "ean13" && normalized.format !== "upca") {
      const duplicate = specs.find((spec) => generatedIdsRef.current.has(spec.identifier));
      if (duplicate) {
        setProductErrors({
          general: `"${duplicate.identifier}" was already generated in this session. Change the SKU (or the product name) to create a new identifier.`,
        });
        setBulkStatus(null);
        return;
      }
      specs.forEach((spec) => generatedIdsRef.current.add(spec.identifier));
    }
    setProductErrors({});
    setLastNorm(normalized);
    setResultSpecs(specs);
    setResultPreview(null);
    setBulkState("generating");
    setBulkStatus(null);
    try {
      const previews = await Promise.all(
        specs.slice(0, BULK_PREVIEW_COUNT).map(async (spec) => ({ spec, svg: await renderLabelSvg(spec) })),
      );
      setResultPreview(previews);
      setBulkState("ready");
      setBulkStatus(`Generated ${specs.length} barcode${specs.length === 1 ? "" : "s"}.`);
    } catch {
      setBulkState("idle");
      setBulkStatus("Generation failed — check the values and try again.");
    }
  };

  const buildZipFiles = async (specs: LabelSpec[], ext: "png" | "svg"): Promise<Record<string, string | Uint8Array>> => {
    const files: Record<string, string | Uint8Array> = {};
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const blob = await renderLabelFile(spec, ext);
      files[`${spec.filenameBody}.${ext}`] = new Uint8Array(await blob.arrayBuffer());
      if ((i + 1) % 50 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return files;
  };

  const downloadBulkZip = async () => {
    if (!lastNorm || !resultSpecs || bulkState === "generating") return;
    setBulkState("generating");
    setBulkStatus("Building ZIP…");
    try {
      const files = await buildZipFiles(resultSpecs, outputFormat);
      files["products.csv"] = buildProductsCsv(lastNorm, resultSpecs, outputFormat);
      const zipped = buildLabelZip(files);
      const copy = new Uint8Array(zipped.byteLength);
      copy.set(zipped);
      gateDownload([
        {
          blob: new Blob([copy], { type: "application/zip" }),
          filename: `${sanitizeFilenameSegment(lastNorm.identifier)}-barcodes.zip`,
        },
      ]);
      setBulkState("ready");
      setBulkStatus(
        resultSpecs.length === 1
          ? "ZIP downloaded."
          : `ZIP downloaded — ${resultSpecs.length} label files + products.csv.`,
      );
    } catch {
      setBulkState("ready");
      setBulkStatus("The ZIP could not be created — try SVG output or a smaller quantity.");
    }
  };

  const downloadCsv = () => {
    if (!lastNorm || !resultSpecs) return;
    gateDownload([
      {
        blob: new Blob([buildProductsCsv(lastNorm, resultSpecs, outputFormat)], { type: "text/csv" }),
        filename: `${sanitizeFilenameSegment(lastNorm.identifier)}-products.csv`,
      },
    ]);
  };

  const openPrintSheet = () => {
    requireAuth(() => {
      void (async () => {
        if (!resultSpecs || bulkState === "generating") return;
        setBulkState("generating");
        setBulkStatus("Preparing printable sheet…");
        try {
          const cells: LabelSheetCell[] = [];
          for (let i = 0; i < resultSpecs.length; i++) {
            const spec = resultSpecs[i];
            const svg = await renderLabelSvg(spec);
            const lines: string[] = [];
            if (lastNorm) {
              if (lastNorm.brand) lines.push(lastNorm.brand);
              if (lastNorm.variant) lines.push(lastNorm.variant);
              if (lastNorm.mrp) lines.push(`MRP ${lastNorm.mrp}`);
              if (lastNorm.price) lines.push(`Price ${lastNorm.price}`);
              if (lastNorm.batchNo) lines.push(`Batch ${lastNorm.batchNo}`);
              if (lastNorm.expiry) lines.push(`Expiry ${lastNorm.expiry}`);
            }
            cells.push({ name: lastNorm?.name ?? spec.identifier, lines, svg, identifier: spec.identifier });
            if ((i + 1) % 50 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
          }
          const html = buildLabelSheetHtml(cells);
          const windowRef = window.open("", "_blank");
          if (!windowRef) {
            setBulkState("ready");
            setBulkStatus("The browser blocked the printable sheet — allow pop-ups and try again.");
            return;
          }
          windowRef.document.write(html);
          windowRef.document.close();
          windowRef.focus();
          windowRef.print();
          setBulkState("ready");
          setBulkStatus("Printable label sheet opened in a new tab.");
        } catch {
          setBulkState("ready");
          setBulkStatus("The printable sheet could not be prepared.");
        }
      })();
    });
  };

  const downloadOne = async (spec: LabelSpec) => {
    if (bulkState === "generating") return;
    try {
      const blob = await renderLabelFile(spec, outputFormat);
      gateDownloadOne(blob, `${spec.filenameBody}.${outputFormat}`);
    } catch {
      setBulkStatus("That label could not be downloaded — try again.");
    }
  };

  const resetGenerateNew = () => {
    setProduct(emptyProductForm());
    setProductErrors({});
    setLastNorm(null);
    setResultSpecs(null);
    setResultPreview(null);
    setBulkState("idle");
    setBulkStatus(null);
  };

  const previewMarkup = (svg: string, card: "banner" | "label") => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={svgViewBoxAttribute(svg)}
      preserveAspectRatio="xMidYMid meet"
      className={
        card === "banner" ? "h-auto max-h-64 w-full max-w-full" : "h-auto max-h-24 w-full"
      }
      dangerouslySetInnerHTML={{ __html: svgInnerContent(svg) }}
    />
  );

  return (
    <div className="space-y-4">
      <RestoredDownload restored={restored} />
      <div>
        <span className={labelCls}>Workflow</span>
        <Segment
          label="Workflow"
          value={mode}
          options={[
            { value: "normal", label: "Normal" },
            { value: "new", label: "Generate New" },
          ]}
          onChange={setMode}
        />
      </div>

      {mode === "normal" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="bqg-format" className={labelCls}>
              Format
            </label>
            <select
              id="bqg-format"
              className={inputCls}
              value={format}
              onChange={(e) => handleFormatChange(e.target.value)}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bqg-input" className={labelCls}>
              {meta.inputLabel}
            </label>
            <input
              id="bqg-input"
              type="text"
              className={inputCls}
              placeholder={meta.placeholder}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              aria-invalid={displayedError ? true : undefined}
              aria-describedby={displayedError ? "bqg-error" : undefined}
            />
            <p className="mt-1 text-xs text-slate-500">{meta.hint}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="bqg-width" className={labelCls}>
                  Bar width (px ×2 scale)
                </label>
                <input
                  id="bqg-width"
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  className={inputCls}
                  value={barWidth}
                  onChange={(e) => setBarWidth(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bqg-height" className={labelCls}>
                  Height (px)
                </label>
                <input
                  id="bqg-height"
                  type="number"
                  min={40}
                  max={300}
                  step={10}
                  className={inputCls}
                  value={barHeight}
                  onChange={(e) => setBarHeight(e.target.value)}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={displayValue}
                    onChange={(e) => setDisplayValue(e.target.checked)}
                  />
                  Show value below
                </label>
              </div>
            </div>

          <div>
            <span className={labelCls}>Download as</span>
            <div className="inline-flex rounded-md border border-slate-300 p-0.5">
              {(["png", "svg"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setOutputFormat(f)}
                  aria-pressed={outputFormat === f}
                  className={
                    outputFormat === f
                      ? "rounded bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white"
                      : "rounded px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  }
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`rounded-lg border p-4 ${
              previewReady ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"
            }`}
          >
            {previewReady && preview ? (
              <div className="overflow-x-auto">
                <div
                  role="img"
                  aria-label={`${meta.label} preview of ${preview.value}`}
                  className="mx-auto flex justify-center"
                >
                  {previewMarkup(preview.svg, "banner")}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-400">
                {displayedError ? "Preview unavailable until the input is valid." : "Enter a valid value to preview."}
              </p>
            )}
          </div>

          {displayedError && (
            <p id="bqg-error" role="alert" className="text-sm text-red-600">
              {displayedError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={download}
              disabled={!previewReady}
              className={primaryBtn}
              data-lead-action="download"
            >
              Download {outputFormat === "png" ? "PNG" : "SVG"}
            </button>
            <button type="button" onClick={reset} className={secondaryBtn}>
              Reset
            </button>
          </div>

          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 print:hidden">
            For packaging, print at a sensible physical size, keep the quiet zones beside the bars clear,
            and avoid stretching the barcode. Generating a barcode does not assign or register an official
            product identifier — use a properly assigned product number for commercial packaging.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 print:hidden">
            Build a product record and generate its barcode labels in one pass. A barcode encodes an{" "}
            <strong>identifier</strong> — your inventory or POS system must hold the matching product record for it
            to scan as that product. Generating a code here does <strong>not</strong> register an official GS1 product
            number and does not write to any database or cloud — everything is generated locally in your browser.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bqg-new-name" className={labelCls}>
                Product name <span className="text-red-600">*</span>
              </label>
              <input
                id="bqg-new-name"
                type="text"
                className={inputCls}
                placeholder="Homemade Papad"
                value={product.name}
                maxLength={PRODUCT_NAME_MAX}
                onChange={(e) => setProductField("name", e.target.value)}
                aria-invalid={productErrors.name ? true : undefined}
                aria-describedby={productErrors.name ? "bqg-new-name-error" : undefined}
              />
              <FieldError id="bqg-new-name-error">{productErrors.name}</FieldError>
            </div>
            <div>
              <label htmlFor="bqg-new-sku" className={labelCls}>
                SKU / code
              </label>
              <input
                id="bqg-new-sku"
                type="text"
                className={inputCls}
                placeholder="PAPAD-001"
                value={product.sku}
                maxLength={SKU_MAX}
                onChange={(e) => setProductField("sku", e.target.value)}
                aria-invalid={productErrors.sku ? true : undefined}
                aria-describedby={productErrors.sku ? "bqg-new-sku-error" : undefined}
              />
              <p className="mt-1 text-xs text-slate-500">Leave blank to auto-derive from the product name.</p>
              <FieldError id="bqg-new-sku-error">{productErrors.sku}</FieldError>
            </div>
          </div>

          <div>
            <label htmlFor="bqg-new-format" className={labelCls}>
              Barcode type
            </label>
            <select
              id="bqg-new-format"
              className={inputCls}
              value={product.format}
              onChange={(e) => setProductField("format", e.target.value)}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {newIsEanUpc ? (
            <>
              <div>
                <label htmlFor="bqg-new-assigned" className={labelCls}>
                  Assigned product number{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="bqg-new-assigned"
                  type="text"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder={
                    product.format === "ean13"
                      ? "Enter the 12-digit assigned base for EAN-13"
                      : "Enter the 11-digit assigned base for UPC-A"
                  }
                  value={product.assignedNumber}
                  maxLength={product.format === "ean13" ? 13 : 12}
                  onChange={(e) => setProductField("assignedNumber", e.target.value.trim())}
                  aria-invalid={productErrors.assignedNumber ? true : undefined}
                  aria-describedby={productErrors.assignedNumber ? "bqg-new-assigned-error" : undefined}
                />
                {productErrors.assignedNumber ? (
                  <FieldError id="bqg-new-assigned-error">{productErrors.assignedNumber}</FieldError>
                ) : (
                  <p className="mt-1 text-xs text-amber-600">
                    Enter the number <strong>you were issued</strong>. The check digit is calculated automatically. A
                    checksum-valid number is not an official GS1 identifier — for retail packaging use a number
                    assigned through an authorised GS1 provider. No official number yet? Use{" "}
                    <strong>Code 128</strong> for internal tracking.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 print:hidden">
              Code 128 encodes your own internal identifier (SKU) — ideal for inventory tracking. No
              registration required; scanners only resolve it where your system holds the matching record.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="bqg-new-brand" className={labelCls}>
                Brand / business
              </label>
              <input
                id="bqg-new-brand"
                type="text"
                className={inputCls}
                value={product.brand}
                maxLength={80}
                onChange={(e) => setProductField("brand", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bqg-new-category" className={labelCls}>
                Category
              </label>
              <input
                id="bqg-new-category"
                type="text"
                className={inputCls}
                value={product.category}
                maxLength={80}
                onChange={(e) => setProductField("category", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bqg-new-variant" className={labelCls}>
                Variant
              </label>
              <input
                id="bqg-new-variant"
                type="text"
                className={inputCls}
                placeholder="500 g, Red, …"
                value={product.variant}
                maxLength={80}
                onChange={(e) => setProductField("variant", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="bqg-new-mrp" className={labelCls}>
                MRP
              </label>
              <input
                id="bqg-new-mrp"
                type="text"
                inputMode="decimal"
                className={inputCls}
                placeholder="120"
                value={product.mrp}
                maxLength={12}
                onChange={(e) => setProductField("mrp", e.target.value)}
                aria-invalid={productErrors.mrp ? true : undefined}
                aria-describedby={productErrors.mrp ? "bqg-new-mrp-error" : undefined}
              />
              <FieldError id="bqg-new-mrp-error">{productErrors.mrp}</FieldError>
            </div>
            <div>
              <label htmlFor="bqg-new-price" className={labelCls}>
                Selling price
              </label>
              <input
                id="bqg-new-price"
                type="text"
                inputMode="decimal"
                className={inputCls}
                placeholder="99.50"
                value={product.price}
                maxLength={12}
                onChange={(e) => setProductField("price", e.target.value)}
                aria-invalid={productErrors.price ? true : undefined}
                aria-describedby={productErrors.price ? "bqg-new-price-error" : undefined}
              />
              <FieldError id="bqg-new-price-error">{productErrors.price}</FieldError>
            </div>
            <div>
              <label htmlFor="bqg-new-unit" className={labelCls}>
                Unit / net qty
              </label>
              <input
                id="bqg-new-unit"
                type="text"
                className={inputCls}
                placeholder="500 g, 12 pcs, 1 L"
                value={product.unit}
                maxLength={40}
                onChange={(e) => setProductField("unit", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bqg-new-batch" className={labelCls}>
                Batch / lot no.
              </label>
              <input
                id="bqg-new-batch"
                type="text"
                className={inputCls}
                placeholder="L2204"
                value={product.batchNo}
                maxLength={40}
                onChange={(e) => setProductField("batchNo", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bqg-new-expiry" className={labelCls}>
                Expiry (YYYY-MM)
              </label>
              <input
                id="bqg-new-expiry"
                type="text"
                inputMode="numeric"
                className={inputCls}
                placeholder="2027-06"
                value={product.expiry}
                maxLength={7}
                onChange={(e) => setProductField("expiry", e.target.value)}
                aria-invalid={productErrors.expiry ? true : undefined}
                aria-describedby={productErrors.expiry ? "bqg-new-expiry-error" : undefined}
              />
              <FieldError id="bqg-new-expiry-error">{productErrors.expiry}</FieldError>
            </div>
          </div>

          <div>
            <label htmlFor="bqg-new-manufacturer" className={labelCls}>
              Manufacturer / business
            </label>
            <input
              id="bqg-new-manufacturer"
              type="text"
              className={inputCls}
              value={product.manufacturer}
              maxLength={120}
              onChange={(e) => setProductField("manufacturer", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="bqg-new-description" className={labelCls}>
              Description
            </label>
            <textarea
              id="bqg-new-description"
              className={inputCls}
              rows={3}
              maxLength={500}
              placeholder="Short label line (appears on the printable sheet)"
              value={product.description}
              onChange={(e) => setProductField("description", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bqg-new-qty" className={labelCls}>
                Quantity (labels)
              </label>
              <input
                id="bqg-new-qty"
                type="number"
                min={1}
                max={MAX_BULK_QTY}
                step={1}
                className={inputCls}
                value={product.quantity}
                onChange={(e) => setProductField("quantity", e.target.value)}
                aria-invalid={productErrors.quantity ? true : undefined}
                aria-describedby={productErrors.quantity ? "bqg-new-qty-error" : undefined}
              />
              <FieldError id="bqg-new-qty-error">{productErrors.quantity}</FieldError>
              {!productErrors.quantity && (
                <p className="mt-1 text-xs text-slate-500">Up to {MAX_BULK_QTY} labels per batch.</p>
              )}
            </div>
            <div>
              <span className={labelCls}>Codes</span>
              <Segment
                label="Codes"
                value={product.bulkMode}
                options={[
                  { value: "same", label: "Same product barcode" },
                  { value: "unique", label: "Unique codes per label" },
                ]}
                onChange={(value) => setBulkMode(value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                {product.bulkMode === "same"
                  ? "Every package of the same product shares one barcode — use this for identical retail units."
                  : newIsEanUpc
                    ? "EAN-13 / UPC-A can't be unique — switch to Code 128."
                    : "Adds a serial to each code (e.g. PAPAD-001, PAPAD-002) for case-trackable labels."}
              </p>
            </div>
          </div>

          {productErrors.general && (
            <p id="bqg-new-general-error" role="alert" className="text-sm text-red-600">
              {productErrors.general}
            </p>
          )}

          <p role="status" aria-live="polite" className="text-sm text-slate-600">
            {bulkStatus}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={bulkState === "generating"}
              className={primaryBtn}
              data-lead-action="generate-new"
            >
              {bulkState === "generating" ? "Generating…" : "Generate barcodes"}
            </button>
            <button type="button" onClick={resetGenerateNew} className={secondaryBtn}>
              Reset
            </button>
          </div>

          {resultSpecs && (
            <section
              aria-label={`${resultSpecs.length} generated barcodes`}
              className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-800">
                  {resultSpecs.length} label{resultSpecs.length === 1 ? "" : "s"} generated
                </h3>
                {lastNorm && (
                  <p className="text-xs text-slate-500">
                    {[lastNorm.identifier, lastNorm.brand, lastNorm.variant, lastNorm.category]
                      .filter(Boolean)
                      .join(" · ")}
                    {lastNorm.mrp ? ` · MRP ${lastNorm.mrp}` : ""}
                    {lastNorm.price ? ` · Price ${lastNorm.price}` : ""}
                    {lastNorm.batchNo ? ` · Batch ${lastNorm.batchNo}` : ""}
                    {lastNorm.expiry ? ` · Expiry ${lastNorm.expiry}` : ""}
                  </p>
                )}
              </div>

              {resultPreview && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {resultPreview.map(({ spec, svg }) => (
                    <div key={spec.filenameBody} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {lastNorm?.name ?? spec.identifier}
                        </p>
                        <p className="shrink-0 text-xs text-slate-400">#{spec.index + 1}</p>
                      </div>
                      <div className="mt-2 flex justify-center bg-white">{previewMarkup(svg, "label")}</div>
                      <p className="mt-2 text-center text-xs font-medium text-slate-600">{spec.identifier}</p>
                      <p className="mt-1 break-all text-center text-[11px] text-slate-400">{spec.content}</p>
                      <button
                        type="button"
                        onClick={() => downloadOne(spec)}
                        disabled={bulkState === "generating"}
                        className={`${secondaryBtn} mt-2 w-full text-center`}
                      >
                        Download {outputFormat.toUpperCase()}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-500">
                {resultSpecs.length > BULK_PREVIEW_COUNT
                  ? `Showing the first ${BULK_PREVIEW_COUNT} of ${resultSpecs.length} labels.`
                  : `All ${resultSpecs.length} label${resultSpecs.length === 1 ? "" : "s"} shown above.`}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadBulkZip}
                  disabled={bulkState === "generating"}
                  className={primaryBtn}
                  data-lead-action="download-zip"
                >
                  Download ZIP (labels + CSV)
                </button>
                <button
                  type="button"
                  onClick={downloadCsv}
                  disabled={bulkState === "generating"}
                  className={secondaryBtn}
                  data-lead-action="download-csv"
                >
                  Download products.csv
                </button>
                <button
                  type="button"
                  onClick={openPrintSheet}
                  disabled={bulkState === "generating"}
                  className={secondaryBtn}
                  data-lead-action="print-labels"
                >
                  Printable label sheet
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}