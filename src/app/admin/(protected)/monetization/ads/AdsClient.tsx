"use client";

import { useState, useEffect } from "react";
import { getAdsAction, toggleAdActiveAction, duplicateAdAction, deleteAdAction, bulkUpdateAdsAction } from "./ad-actions";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Edit3, Copy, Trash2, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import AdPreviewModal from "./AdPreviewModal";

export default function AdsClient() {
  const [ads, setAds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewAd, setPreviewAd] = useState<any | null>(null);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const data = await getAdsAction({
        page,
        search,
        placement: placementFilter,
        device: deviceFilter,
        adProvider: providerFilter,
        active: activeFilter
      });
      setAds(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchAds(), 300);
    return () => clearTimeout(timer);
  }, [page, search, placementFilter, deviceFilter, providerFilter, activeFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(ads.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAdActiveAction(id, !currentStatus);
      fetchAds();
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateAdAction(id);
      fetchAds();
    } catch (err) {
      alert("Failed to duplicate ad");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad slot?")) return;
    try {
      await deleteAdAction(id);
      fetchAds();
    } catch (err) {
      alert("Failed to delete ad");
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Are you sure you want to delete ${selectedIds.length} ad slots?`)) return;

    try {
      await bulkUpdateAdsAction(selectedIds, action);
      setSelectedIds([]);
      fetchAds();
    } catch (err) {
      alert("Failed to execute bulk action");
    }
  };

  const getAdStatusBadge = (ad: any) => {
    const now = new Date();
    if (!ad.active) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Inactive</span>;
    }
    if (ad.startDate && new Date(ad.startDate) > now) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>;
    }
    if (ad.endDate && new Date(ad.endDate) < now) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Expired</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      
      {/* Search & Filters Header */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search ad name or unit ID..." 
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select 
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            value={placementFilter}
            onChange={(e) => { setPlacementFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Placements</option>
            <option value="header">Header</option>
            <option value="homepage">Homepage</option>
            <option value="tool_page">Tool Page</option>
            <option value="sidebar">Sidebar</option>
            <option value="footer">Footer</option>
          </select>

          <select 
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            value={deviceFilter}
            onChange={(e) => { setDeviceFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Devices</option>
            <option value="desktop">Desktop Only</option>
            <option value="mobile">Mobile Only</option>
            <option value="tablet">Tablet Only</option>
          </select>

          <select 
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Providers</option>
            <option value="adsense">Google AdSense</option>
            <option value="admanager">Google Ad Manager</option>
            <option value="internal">Internal Promo</option>
            <option value="custom">Custom HTML</option>
          </select>

          <select 
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
            <span className="text-xs font-semibold text-orange-800">{selectedIds.length} Selected</span>
            <button onClick={() => handleBulkAction("activate")} className="px-2 py-1 bg-white hover:bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-200">Activate</button>
            <button onClick={() => handleBulkAction("deactivate")} className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300">Deactivate</button>
            <button onClick={() => handleBulkAction("delete")} className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold rounded border border-red-200">Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={ads.length > 0 && selectedIds.length === ads.length} 
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500" 
                />
              </th>
              <th className="px-4 py-3 font-medium">Ad Name</th>
              <th className="px-4 py-3 font-medium">Placement</th>
              <th className="px-4 py-3 font-medium">Device</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Schedule</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">Loading Ad Slots...</td></tr>
            ) : ads.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">No ad slots found matching your filters.</td></tr>
            ) : ads.map(ad => (
              <tr key={ad.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(ad.id)} 
                    onChange={(e) => handleSelectOne(ad.id, e.target.checked)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500" 
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-900">{ad.name}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[200px]">{ad.adReference || ad.description || "No reference"}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="capitalize px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono">
                    {ad.placement}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs capitalize text-slate-600">
                  {ad.device}
                </td>
                <td className="px-4 py-4">
                  <span className="capitalize font-mono text-xs">{ad.adProvider}</span>
                </td>
                <td className="px-4 py-4 font-semibold text-slate-700 text-center">
                  #{ad.priority}
                </td>
                <td className="px-4 py-4">
                  {getAdStatusBadge(ad)}
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  {ad.startDate ? format(new Date(ad.startDate), "MMM d, yyyy") : "Anytime"}
                  {" → "}
                  {ad.endDate ? format(new Date(ad.endDate), "MMM d, yyyy") : "Forever"}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => setPreviewAd(ad)} 
                      className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                      title="Preview Ad"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleActive(ad.id, ad.active)} 
                      className={`p-1.5 rounded ${ad.active ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"}`}
                      title={ad.active ? "Deactivate" : "Activate"}
                    >
                      {ad.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <Link 
                      href={`/admin/monetization/ads/${ad.id}`} 
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Ad"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDuplicate(ad.id)} 
                      className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ad.id)} 
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Showing {ads.length} of {total} ad slots (Page {page} of {pages})
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-slate-50"
          >
            Prev
          </button>
          <button 
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Isolated Preview Modal */}
      {previewAd && (
        <AdPreviewModal ad={previewAd} onClose={() => setPreviewAd(null)} />
      )}
    </div>
  );
}
