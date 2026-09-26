"use client";

import { useState, useEffect, useRef } from "react";
import { 
  getMediaAssetsAction, 
  uploadMediaAction, 
  updateMediaMetadataAction, 
  replaceMediaAssetAction, 
  deleteMediaAssetAction, 
  checkMediaUsageAction, 
  getMediaFoldersAction, 
  createMediaFolderAction, 
  bulkMediaAction 
} from "./media-actions";
import { format } from "date-fns";
import { 
  LayoutGrid, List, Upload, FolderPlus, Folder, Search, Filter, 
  Copy, Check, Trash2, Edit3, RefreshCw, X, FileText, Image as ImageIcon,
  AlertTriangle, Tag
} from "lucide-react";

export default function MediaLibraryClient() {
  const [assets, setAssets] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState<any>("newest");
  const [isLoading, setIsLoading] = useState(true);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Asset Drawer
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ inUse: boolean; usageCount: number; references: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metaForm, setMetaForm] = useState({ filename: "", altText: "", title: "", description: "", tags: "", assetType: "image" });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Folder Creation Modal
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const data = await getMediaAssetsAction({
        page,
        search,
        assetType: assetTypeFilter,
        folderId: selectedFolderId,
        sort: sortOption
      });
      setAssets(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const fetchFolders = async () => {
    try {
      const fList = await getMediaFoldersAction();
      setFolders(fList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchAssets(), 300);
    return () => clearTimeout(timer);
  }, [page, search, selectedFolderId, assetTypeFilter, sortOption]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(20);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        if (selectedFolderId && selectedFolderId !== "all" && selectedFolderId !== "root") {
          formData.append("folderId", selectedFolderId);
        }
        await uploadMediaAction(formData);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      fetchAssets();
      fetchFolders();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleSelectAsset = async (asset: any) => {
    setSelectedAsset(asset);
    setMetaForm({
      filename: asset.filename,
      altText: asset.altText || "",
      title: asset.title || "",
      description: asset.description || "",
      tags: asset.tags ? asset.tags.join(", ") : "",
      assetType: asset.assetType || "image"
    });
    setCopied(false);
    setIsEditingMetadata(false);

    // Check usage references
    const usage = await checkMediaUsageAction(asset.cdnUrl);
    setUsageInfo(usage);
  };

  const handleSaveMetadata = async () => {
    if (!selectedAsset) return;
    try {
      const tagsArr = metaForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      const updated = await updateMediaMetadataAction(selectedAsset.id, {
        filename: metaForm.filename,
        altText: metaForm.altText,
        title: metaForm.title,
        description: metaForm.description,
        tags: tagsArr,
        assetType: metaForm.assetType
      });
      setSelectedAsset(updated);
      setIsEditingMetadata(false);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || "Failed to update metadata");
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAsset || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const updated = await replaceMediaAssetAction(selectedAsset.id, formData);
      setSelectedAsset(updated);
      fetchAssets();
      alert("Asset replaced successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to replace asset file");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (usageInfo?.inUse) {
      if (!confirm(`Warning: This asset is currently used in ${usageInfo.usageCount} place(s):\n\n${usageInfo.references.join("\n")}\n\nDeleting it may break existing pages. Continue anyway?`)) {
        return;
      }
    } else {
      if (!confirm("Are you sure you want to delete this asset?")) return;
    }

    try {
      await deleteMediaAssetAction(id);
      setSelectedAsset(null);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || "Failed to delete asset");
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createMediaFolderAction(newFolderName);
      setNewFolderName("");
      setShowFolderModal(false);
      fetchFolders();
    } catch (err: any) {
      alert(err.message || "Failed to create folder");
    }
  };

  const handleBulkAction = async (action: "move" | "delete") => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Are you sure you want to delete ${selectedIds.length} media assets?`)) return;

    try {
      await bulkMediaAction(selectedIds, action, { folderId: selectedFolderId });
      setSelectedIds([]);
      fetchAssets();
    } catch (err) {
      alert("Failed to execute bulk action");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      
      {/* FOLDERS SIDEBAR */}
      <div className="w-full lg:w-64 bg-white rounded-xl border border-slate-200 p-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Folder className="w-4 h-4 text-orange-600" /> Folders
          </h3>
          <button 
            onClick={() => setShowFolderModal(true)}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-orange-600"
            title="Create Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-1 text-xs">
          <button 
            onClick={() => setSelectedFolderId("all")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium flex justify-between items-center ${selectedFolderId === "all" ? "bg-orange-50 text-orange-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <span>All Assets</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{total}</span>
          </button>

          <button 
            onClick={() => setSelectedFolderId("root")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium ${selectedFolderId === "root" ? "bg-orange-50 text-orange-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Root (Unfiled)
          </button>

          {folders.map(f => (
            <button 
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium flex justify-between items-center ${selectedFolderId === f.id ? "bg-orange-50 text-orange-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span className="truncate">{f.name}</span>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{f._count?.assets || 0}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 w-full space-y-4">
        
        {/* DRAG & DROP UPLOAD BAR */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
          className="bg-white border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-6 text-center transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => handleFileUpload(e.target.files)} 
          />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Drag & drop files here, or <span className="text-orange-600 underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP, SVG, PDF, DOCX (Max 25MB)</p>

          {isUploading && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-orange-600 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="search" 
                placeholder="Search filenames, tags, title..." 
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <select 
              className="px-3 py-2 border rounded-lg text-sm bg-white"
              value={assetTypeFilter}
              onChange={(e) => { setAssetTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="icon">Tool Icons</option>
              <option value="thumbnail">Thumbnails</option>
              <option value="brand">Brand Assets</option>
            </select>

            <select 
              className="px-3 py-2 border rounded-lg text-sm bg-white"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="largest">Largest Size</option>
              <option value="smallest">Smallest Size</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-orange-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-orange-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ASSET GRID / LIST */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Loading Media Library...</div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">No media assets found.</div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {assets.map(asset => (
              <div 
                key={asset.id}
                onClick={() => handleSelectAsset(asset)}
                className={`group bg-white rounded-xl border p-2 relative cursor-pointer hover:shadow-md transition-all ${selectedAsset?.id === asset.id ? "border-orange-600 ring-2 ring-orange-200" : "border-slate-200"}`}
              >
                <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center relative mb-2">
                  {asset.mimeType.startsWith("image/") ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={asset.cdnUrl} alt={asset.altText || asset.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <FileText className="w-10 h-10 text-slate-400" />
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono uppercase">
                    {asset.extension}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 truncate" title={asset.filename}>{asset.filename}</p>
                <p className="text-[10px] text-slate-400">{formatSize(asset.size)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="p-4 w-10">
                    <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? assets.map(a => a.id) : [])} />
                  </th>
                  <th className="px-4 py-3 font-medium">Filename</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Folder</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleSelectAsset(asset)}>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(asset.id)} 
                        onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, asset.id] : selectedIds.filter(i => i !== asset.id))} 
                      />
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3 font-semibold text-slate-800">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border">
                        {asset.mimeType.startsWith("image/") ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={asset.cdnUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className="truncate max-w-xs" title={asset.filename}>{asset.filename}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase">{asset.extension}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatSize(asset.size)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{asset.folder?.name || "Root"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{format(new Date(asset.createdAt), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleSelectAsset(asset)} className="text-blue-600 hover:underline text-xs font-semibold">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-sm">
          <span className="text-slate-500">Showing page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border rounded disabled:opacity-50">Prev</button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>

      </div>

      {/* ASSET DETAILS DRAWER */}
      {selectedAsset && (
        <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 shrink-0 relative">
          <button onClick={() => setSelectedAsset(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-bold text-slate-800 text-base">Asset Details</h3>

          {/* Preview Box */}
          <div className="bg-slate-50 rounded-lg p-4 border flex items-center justify-center min-h-[160px] max-h-[220px] overflow-hidden">
            {selectedAsset.mimeType.startsWith("image/") ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={selectedAsset.cdnUrl} alt={selectedAsset.altText || ""} className="max-w-full max-h-[180px] object-contain rounded" />
            ) : (
              <FileText className="w-16 h-16 text-slate-400" />
            )}
          </div>

          {/* Usage Alert */}
          {usageInfo?.inUse && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Used in {usageInfo.usageCount} location(s)
              </div>
              <ul className="list-disc pl-4 text-[11px]">
                {usageInfo.references.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Copy URL */}
          <button 
            onClick={() => handleCopyUrl(selectedAsset.cdnUrl)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "URL Copied!" : "Copy CDN URL"}
          </button>

          {/* Metadata Form / Readonly */}
          {isEditingMetadata ? (
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Display Filename</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-xs" 
                  value={metaForm.filename} 
                  onChange={(e) => setMetaForm({ ...metaForm, filename: e.target.value })} 
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alt Text</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-xs" 
                  value={metaForm.altText} 
                  onChange={(e) => setMetaForm({ ...metaForm, altText: e.target.value })} 
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-xs" 
                  value={metaForm.title} 
                  onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} 
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tags (comma separated)</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-xs" 
                  value={metaForm.tags} 
                  onChange={(e) => setMetaForm({ ...metaForm, tags: e.target.value })} 
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveMetadata} className="flex-1 py-1.5 bg-orange-600 text-white rounded font-medium">Save</button>
                <button onClick={() => setIsEditingMetadata(false)} className="py-1.5 px-3 border rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs border-t pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Original Name:</span>
                <span className="font-mono text-slate-800 truncate max-w-[150px]">{selectedAsset.originalFilename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">File Size:</span>
                <span className="font-semibold">{formatSize(selectedAsset.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Extension:</span>
                <span className="uppercase font-mono">{selectedAsset.extension}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MIME Type:</span>
                <span className="font-mono">{selectedAsset.mimeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uploaded:</span>
                <span>{format(new Date(selectedAsset.createdAt), "PP")}</span>
              </div>

              <button onClick={() => setIsEditingMetadata(true)} className="w-full mt-2 py-1.5 border border-slate-300 text-slate-700 rounded font-medium hover:bg-slate-50 flex items-center justify-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Edit Metadata
              </button>
            </div>
          )}

          {/* Replace File & Delete */}
          <div className="pt-3 border-t flex flex-col gap-2">
            <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Replace File Binary
              <input type="file" className="hidden" onChange={handleReplaceFile} />
            </label>

            <button 
              onClick={() => handleDeleteAsset(selectedAsset.id)} 
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Asset
            </button>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Create New Folder</h3>
            <input 
              type="text" 
              placeholder="Folder Name..." 
              className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 border text-sm rounded-lg">Cancel</button>
              <button onClick={handleCreateFolder} className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
