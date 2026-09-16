"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createNavigationLink,
  updateNavigationLink,
  deleteNavigationLink,
  toggleNavigationLink,
  reorderNavigationLinks
} from "./actions";

type NavLink = {
  id: string;
  label: string;
  href: string;
  location: string;
  displayOrder: number;
  status: boolean;
  type: string;
  openInNewTab: boolean;
};

export default function NavigationManager({ initialLinks }: { initialLinks: NavLink[] }) {
  const [links, setLinks] = useState(initialLinks);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    location: "HEADER",
    type: "INTERNAL",
    openInNewTab: false,
  });
  
  const router = useRouter();

  const handleOpenNew = () => {
    setEditingLink(null);
    setFormData({ label: "", href: "", location: "HEADER", type: "INTERNAL", openInNewTab: false });
    setModalOpen(true);
  };

  const handleOpenEdit = (link: NavLink) => {
    setEditingLink(link);
    setFormData({
      label: link.label,
      href: link.href,
      location: link.location,
      type: link.type,
      openInNewTab: link.openInNewTab,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (editingLink) {
          await updateNavigationLink(editingLink.id, formData as any);
        } else {
          await createNavigationLink(formData as any);
        }
        setModalOpen(false);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Failed to save link");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to remove this link?")) return;
    startTransition(async () => {
      await deleteNavigationLink(id);
      router.refresh();
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleNavigationLink(id, !currentStatus);
      router.refresh();
    });
  };

  const move = async (index: number, direction: -1 | 1, locationLinks: NavLink[]) => {
    if (index + direction < 0 || index + direction >= locationLinks.length) return;
    
    const newLinks = [...locationLinks];
    const temp = newLinks[index];
    newLinks[index] = newLinks[index + direction];
    newLinks[index + direction] = temp;
    
    // Optimistic update locally
    setLinks(links.map(l => newLinks.find(nl => nl.id === l.id) || l));

    startTransition(async () => {
      await reorderNavigationLinks(newLinks.map(l => l.id), locationLinks[0].location);
      router.refresh();
    });
  };

  const renderList = (location: string) => {
    const locationLinks = links.filter(l => l.location === location).sort((a, b) => a.displayOrder - b.displayOrder);
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{location === "HEADER" ? "Header Navigation" : "Footer Navigation"}</h3>
        {locationLinks.length === 0 ? (
          <p className="text-sm text-slate-500 mb-4">No configurable links found for {location}.</p>
        ) : (
          <div className="border rounded-md divide-y mb-4">
            {locationLinks.map((link, index) => (
              <div key={link.id} className="flex items-center justify-between p-4 bg-white">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{link.label}</span>
                  <span className="text-sm text-slate-500">{link.href} ({link.type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${link.status ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}`}>
                    {link.status ? "Enabled" : "Disabled"}
                  </span>
                  <button 
                    onClick={() => move(index, -1, locationLinks)} 
                    disabled={index === 0 || isPending}
                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => move(index, 1, locationLinks)} 
                    disabled={index === locationLinks.length - 1 || isPending}
                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button onClick={() => handleToggle(link.id, link.status)} disabled={isPending} className="px-3 py-1 text-sm border rounded hover:bg-slate-50">
                    Toggle
                  </button>
                  <button onClick={() => handleOpenEdit(link)} disabled={isPending} className="px-3 py-1 text-sm border rounded hover:bg-slate-50">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(link.id)} disabled={isPending} className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Navigation Management</h2>
        <button onClick={handleOpenNew} className="bg-orange-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-orange-700">
          Add Link
        </button>
      </div>

      {renderList("HEADER")}
      {renderList("FOOTER")}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingLink ? "Edit Link" : "Add Navigation Link"}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input 
                  type="text" 
                  value={formData.label}
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Summer Offer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                <input 
                  type="text" 
                  value={formData.href}
                  onChange={e => setFormData({...formData, href: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. /special-offer or https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <select 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="HEADER">Header</option>
                  <option value="FOOTER">Footer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="newTab"
                  checked={formData.openInNewTab}
                  onChange={e => setFormData({...formData, openInNewTab: e.target.checked})}
                />
                <label htmlFor="newTab" className="text-sm font-medium text-slate-700">Open in new tab (for external links)</label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
