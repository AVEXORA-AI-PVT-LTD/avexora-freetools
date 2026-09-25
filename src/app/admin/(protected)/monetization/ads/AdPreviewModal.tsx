"use client";

import { useState } from "react";
import { X, Smartphone, Monitor } from "lucide-react";

interface AdPreviewModalProps {
  ad: {
    name: string;
    placement: string;
    device: string;
    adProvider: string;
    adReference?: string | null;
    customHtml?: string | null;
    destinationUrl?: string | null;
    imageUrl?: string | null;
  };
  onClose: () => void;
}

export default function AdPreviewModal({ ad, onClose }: AdPreviewModalProps) {
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base">{ad.name}</span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 capitalize font-mono">
              {ad.placement} · {ad.adProvider}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Viewport switcher */}
            <div className="flex bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors ${previewDevice === "desktop" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button 
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors ${previewDevice === "mobile" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>

            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Canvas */}
        <div className="p-8 bg-slate-100 min-h-[400px] flex items-center justify-center">
          <div className={`bg-white rounded-xl shadow-md border border-slate-200 p-6 transition-all duration-300 ${previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-3xl"}`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center border-b pb-2">
              Preview: {ad.placement} Slot ({previewDevice})
            </div>

            {/* Render preview based on provider */}
            {ad.adProvider === "internal" || ad.adProvider === "custom" ? (
              ad.imageUrl ? (
                <a 
                  href={ad.destinationUrl || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-slate-200 hover:opacity-95 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.imageUrl} alt={ad.name} className="w-full h-auto object-cover max-h-[250px]" />
                </a>
              ) : ad.customHtml ? (
                <div 
                  className="p-4 bg-slate-50 border rounded-lg text-slate-800 text-sm"
                  dangerouslySetInnerHTML={{ __html: ad.customHtml }}
                />
              ) : (
                <div className="p-6 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-center font-medium">
                  Internal Promotional Banner ({ad.name})
                </div>
              )
            ) : (
              <div className="p-8 bg-slate-900 text-white rounded-lg text-center space-y-2">
                <div className="font-bold text-sm tracking-wide text-orange-400">{ad.adProvider.toUpperCase()} AD SLOT</div>
                <div className="font-mono text-xs text-slate-400">Unit Ref: {ad.adReference || "Default Slot"}</div>
                <p className="text-xs text-slate-500 pt-2">
                  (In production, Google AdSense script renders dynamically inside this container).
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t text-xs text-slate-500 flex justify-between items-center">
          <span>Isolated Admin Preview Mode · Production layout is unaffected.</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-medium">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
