"use client";
import { useState, useTransition } from "react";
import { createRedirect, toggleRedirect, deleteRedirect } from "./actions";
import { useDialog } from "@/components/admin/DialogProvider";
import { Plus, Trash2, Power, ExternalLink } from "lucide-react";

export function RedirectsClient({ initialRedirects }: { initialRedirects: any[] }) {
  const [redirects, setRedirects] = useState(initialRedirects);
  const [isPending, startTransition] = useTransition();
  const { showAlert, showConfirm } = useDialog();

  const [form, setForm] = useState({ source: "", destination: "", statusCode: 301, reason: "" });

  const handleAdd = () => {
    startTransition(async () => {
      try {
        const added = await createRedirect(form);
        setRedirects([added, ...redirects]);
        setForm({ source: "", destination: "", statusCode: 301, reason: "" });
        showAlert("Success", "Redirect created.");
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to create redirect.");
      }
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      try {
        await toggleRedirect(id, active);
        setRedirects(prev => prev.map(r => r.id === id ? { ...r, active } : r));
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to toggle.");
      }
    });
  };

  const handleDelete = (id: string, source: string) => {
    showConfirm("Delete Redirect", `Delete redirect for ${source}?`, async () => {
      try {
        await deleteRedirect(id);
        setRedirects(prev => prev.filter(r => r.id !== id));
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to delete.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Add New Redirect</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Source Path (e.g. /old-tool)</label>
            <input type="text" value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Destination (e.g. /new-tool)</label>
            <input type="text" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
            <select value={form.statusCode} onChange={e => setForm({...form, statusCode: Number(e.target.value)})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500">
              <option value={301}>301 (Perm)</option>
              <option value={302}>302 (Temp)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason (Optional)</label>
            <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-orange-500" />
          </div>
          <button onClick={handleAdd} disabled={isPending || !form.source || !form.destination} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {redirects.map((r) => (
              <tr key={r.id} className={`bg-white hover:bg-slate-50 ${!r.active && 'opacity-60'}`}>
                <td className="px-6 py-4 font-medium text-slate-900 text-sm">{r.source}</td>
                <td className="px-6 py-4 text-slate-600 text-sm flex items-center gap-2">
                  {r.destination}
                  <a href={r.source} target="_blank" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3 h-3" /></a>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{r.statusCode}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleToggle(r.id, !r.active)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${r.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                    <Power className="w-3 h-3" /> {r.active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleDelete(r.id, r.source)} className="inline-flex p-1.5 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {redirects.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No redirects configured.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
