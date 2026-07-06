"use client";

import { useRef, useState } from "react";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState("512");
  const [level, setLevel] = useState("M");
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = async () => {
    if (text.trim() === "") {
      setError("Enter the text or URL to encode.");
      return;
    }
    setError(null);
    try {
      const QRCode = (await import("qrcode")).default;
      await QRCode.toCanvas(canvasRef.current!, text, {
        width: Number(size),
        errorCorrectionLevel: level as "L" | "M" | "Q" | "H",
        margin: 2,
      });
      setRendered(true);
    } catch {
      setError("That content is too long for a QR code at this error-correction level — shorten it or lower the level.");
    }
  };

  const download = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.png";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="qr-text" className="mb-1 block text-sm font-medium text-slate-700">
          Text or URL
        </label>
        <textarea
          id="qr-text"
          className={inputCls}
          rows={3}
          placeholder="https://example.com or any text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="qr-size" className="mb-1 block text-sm font-medium text-slate-700">
            Size (pixels)
          </label>
          <select id="qr-size" className={inputCls} value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="256">256 × 256</option>
            <option value="512">512 × 512</option>
            <option value="1024">1024 × 1024</option>
          </select>
        </div>
        <div>
          <label htmlFor="qr-level" className="mb-1 block text-sm font-medium text-slate-700">
            Error correction
          </label>
          <select id="qr-level" className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="L">L — low (7%), most capacity</option>
            <option value="M">M — medium (15%), recommended</option>
            <option value="Q">Q — quartile (25%)</option>
            <option value="H">H — high (30%), survives logos/damage</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={generate}
        className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Generate QR code
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={rendered ? "space-y-3" : "hidden"}>
        <canvas ref={canvasRef} className="max-w-full rounded-lg border border-slate-200" />
        <button
          type="button"
          onClick={download}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          data-lead-action="download"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
