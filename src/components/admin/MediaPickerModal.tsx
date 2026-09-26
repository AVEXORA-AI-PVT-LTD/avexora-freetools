"use client";

import { useState, useEffect } from "react";
import { getMediaAssetsAction, uploadMediaAction } from "@/app/admin/(protected)/media/media-actions";
import { X, Search, Upload, Check, Image as ImageIcon, FileText } from "lucide-react";

interface MediaPickerModalProps {
  onSelect: (url: string, asset?: any) => void;
  onClose: () => void;
  assetType?: string;
}

export function MediaPickerModal({ onSelect, onClose, assetType = "all" }: MediaPickerModalProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const data = await getMediaAssetsAction({ search, assetType });
      setAssets(data.items);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, [search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", assetType !== "all" ? assetType : "image");
      const newAsset = await uploadMediaAction(formData);
      onSelect(newAsset.cdnUrl, newAsset);
      onClose();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-900 text-white">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-500" /> Select Media Asset
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search assets..." 
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-orange-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> {isUploading ? "Uploading..." : "Upload New File"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading Media Assets...</div>
          ) : assets.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No assets found in Media Library.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {assets.map(asset => (
                <div 
                  key={asset.id}
                  onClick={() => { onSelect(asset.cdnUrl, asset); onClose(); }}
                  className="group bg-white rounded-xl border border-slate-200 p-2 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all text-center"
                >
                  <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                    {asset.mimeType.startsWith("image/") ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={asset.cdnUrl} alt={asset.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <FileText className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate" title={asset.filename}>{asset.filename}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
