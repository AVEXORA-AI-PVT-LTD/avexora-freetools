"use client";
import { useState, useMemo, useTransition } from "react";
import { createRedirect, updateRedirect, toggleRedirect, deleteRedirect, bulkToggleRedirects, bulkDeleteRedirects } from "./actions";
import { useDialog } from "@/components/admin/DialogProvider";
import { Plus, Trash2, Power, ExternalLink, Search, Filter, Edit, Play, Save } from "lucide-react";
import Link from "next/link";
import type { Redirect } from "@prisma/client";

export function RedirectsClient({ initialRedirects }: { initialRedirects: Redirect[] }) {
  const [redirects, setRedirects] = useState(initialRedirects);
  const [isPending, startTransition] = useTransition();
  const { showAlert, showConfirm } = useDialog();

  const [form, setForm] = useState({ id: "", source: "", destination: "", statusCode: 301, reason: "", active: true });
  const [isEditing, setIsEditing] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Derived state
  const filtered = useMemo(() => {
    const result = redirects.filter(r => {
      if (search && !r.source.toLowerCase().includes(search.toLowerCase()) && !r.destination.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "ACTIVE" && !r.active) return false;
      if (filter === "INACTIVE" && r.active) return false;
      if (filter === "301" && r.statusCode !== 301) return false;
      if (filter === "302" && r.statusCode !== 302) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sort === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "HITS_DESC") return (b.hitCount || 0) - (a.hitCount || 0);
      if (sort === "HITS_ASC") return (a.hitCount || 0) - (b.hitCount || 0);
      return 0;
    });

    return result;
  }, [redirects, search, filter, sort]);

  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(r => r.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const resetForm = () => {
    setForm({ id: "", source: "", destination: "", statusCode: 301, reason: "", active: true });
    setIsEditing(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (isEditing) {
          const res = await updateRedirect(form.id, form);
          if (res.warning) showAlert("Warning", res.warning);
          else showAlert("Success", "Redirect updated.");
          setRedirects(prev => prev.map(r => r.id === form.id ? res.updated : r));
        } else {
          const res = await createRedirect(form);
          if (res.warning) showAlert("Warning", res.warning);
          else showAlert("Success", "Redirect created.");
          setRedirects([res.created, ...redirects]);
        }
        resetForm();
      } catch (e) {
        showAlert("Error", (e instanceof Error ? e.message : String(e)) || "Failed to save redirect.");
      }
    });
  };

  const handleEdit = (r: Redirect) => {
    setForm({ id: r.id, source: r.source, destination: r.destination, statusCode: r.statusCode, reason: r.reason || "", active: r.active });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTest = (r: Redirect) => {
    showAlert("Test Redirect", `Request to ${r.source} will return ${r.statusCode} to ${r.destination}. To test in reality, visit the source URL in a new tab.`);
  };

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      try {
        await toggleRedirect(id, active);
        setRedirects(prev => prev.map(r => r.id === id ? { ...r, active } : r));
      } catch (e) {
        showAlert("Error", (e instanceof Error ? e.message : String(e)) || "Failed to toggle.");
      }
    });
  };

  const handleDelete = (id: string, source: string) => {
    showConfirm("Delete Redirect", `Delete redirect for ${source}?`, async () => {
      try {
        await deleteRedirect(id);
        setRedirects(prev => prev.filter(r => r.id !== id));
        selectedIds.delete(id);
        setSelectedIds(new Set(selectedIds));
      } catch (e) {
        showAlert("Error", (e instanceof Error ? e.message : String(e)) || "Failed to delete.");
      }
    });
  };

  const handleBulkAction = (action: "ACTIVATE" | "DEACTIVATE" | "DELETE") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    showConfirm("Bulk Action", `Are you sure you want to ${action.toLowerCase()} ${ids.length} redirects?`, async () => {
      try {
        if (action === "DELETE") {
          await bulkDeleteRedirects(ids);
          setRedirects(prev => prev.filter(r => !ids.includes(r.id)));
        } else {
          const active = action === "ACTIVATE";
          await bulkToggleRedirects(ids, active);
          setRedirects(prev => prev.map(r => ids.includes(r.id) ? { ...r, active } : r));
        }
        setSelectedIds(new Set());
        showAlert("Success", "Bulk action completed.");
      } catch (e) {
        showAlert("Error", (e instanceof Error ? e.message : String(e)) || "Failed to execute bulk action.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 flex justify-between items-center">
          {isEditing ? "Edit Redirect" : "Add New Redirect"}
          {isEditing && <button onClick={resetForm} className="text-xs text-blue-600 hover:underline font-normal">Cancel Edit</button>}
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Source Path (e.g. /old-tool)</label>
            <input type="text" value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Destination (e.g. /new-tool)</label>
            <input type="text" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
            <select value={form.statusCode} onChange={e => setForm({...form, statusCode: Number(e.target.value)})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500">
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason (Optional)</label>
            <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" />
          </div>
          <button onClick={handleSave} disabled={isPending || !form.source || !form.destination} className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 disabled:opacity-50">
            {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isEditing ? "Update" : "Add"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Search redirects..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 border-slate-300 rounded-md py-1.5 focus:ring-orange-500 text-sm" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-orange-500 bg-white">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
            <option value="301">301 Permanent</option>
            <option value="302">302 Temporary</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-orange-500 bg-white">
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="HITS_DESC">Most Hits</option>
            <option value="HITS_ASC">Least Hits</option>
          </select>
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <span className="text-xs font-medium text-slate-600 mr-2">{selectedIds.size} selected</span>
            <button onClick={() => handleBulkAction("ACTIVATE")} className="text-xs text-green-700 hover:underline">Activate</button>
            <button onClick={() => handleBulkAction("DEACTIVATE")} className="text-xs text-slate-600 hover:underline">Deactivate</button>
            <button onClick={() => handleBulkAction("DELETE")} className="text-xs text-red-600 hover:underline">Delete</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="rounded text-orange-600 focus:ring-orange-500" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Destination</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginated.map((r) => (
              <tr key={r.id} className={`bg-white hover:bg-slate-50 ${!r.active && 'opacity-60'}`}>
                <td className="px-4 py-4">
                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded text-orange-600 focus:ring-orange-500" />
                </td>
                <td className="px-4 py-4 font-medium text-slate-900 text-sm">{r.source}</td>
                <td className="px-4 py-4 text-slate-600 text-sm flex items-center gap-2">
                  {r.statusCode === 301 ? <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">301</span> : <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold">302</span>}
                  {r.destination}
                </td>
                <td className="px-4 py-4 text-sm text-slate-500">{r.hitCount || 0}</td>
                <td className="px-4 py-4">
                  <button onClick={() => handleToggle(r.id, !r.active)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${r.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                    <Power className="w-3 h-3" /> {r.active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-4 text-right space-x-2">
                  <button onClick={() => handleTest(r)} className="inline-flex p-1.5 text-slate-400 hover:text-green-600" title="Test"><Play className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(r)} className="inline-flex p-1.5 text-slate-400 hover:text-blue-600" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r.id, r.source)} className="inline-flex p-1.5 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No redirects found.</td></tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-500">Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} results</div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-slate-300 bg-white text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
