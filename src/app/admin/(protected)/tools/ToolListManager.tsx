"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useDialog } from "@/components/admin/DialogProvider";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { bulkUpdateTools } from "./actions";
import type { AdminTool } from "@/server/admin-tools";


interface ToolListManagerProps {
  tools: AdminTool[];
  totalTools: number;
  categories: { slug: string; name: string; }[];
  currentPage: number;
  totalPages: number;
  limit: number;
  userRole: string;
  initialParams: {
    q: string;
    category: string;
    status: string;
    type: string;
    pricing: string;
    featured: string;
    sort: string;
  };
}

export function ToolListManager({
  tools,
  totalTools,
  categories,
  currentPage,
  totalPages,
  limit,
  userRole,
  initialParams,
}: ToolListManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [bulkCategorySlug, setBulkCategorySlug] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { showAlert, showConfirm } = useDialog();

  const hasEditPermission = hasPermission(userRole, "tools.edit");
  const hasStatusPermission = hasPermission(userRole, "tools.toggle");
  const hasDeletePermission = hasPermission(userRole, "tools.delete");

  const buildQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    // Reset page on filter changes
    if (Object.keys(updates).some(k => k !== 'page' && k !== 'limit')) {
      params.set('page', '1');
    }
    return `${pathname}?${params.toString()}`;
  };

  const updateParam = (key: string, value: string) => {
    startTransition(() => {
      router.push(buildQuery({ [key]: value }));
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSlugs(new Set(tools.map(t => t.slug)));
    } else {
      setSelectedSlugs(new Set());
    }
  };

  const handleSelectOne = (slug: string, checked: boolean) => {
    const next = new Set(selectedSlugs);
    if (checked) next.add(slug);
    else next.delete(slug);
    setSelectedSlugs(next);
  };

  const handleBulkAction = async (action: "publish" | "unpublish" | "feature" | "unfeature" | "delete", opts?: { categorySlug?: string }) => {
    if (selectedSlugs.size === 0) return;
    
    const executeAction = async () => {
      setIsBulkLoading(true);
      try {
        const res = await bulkUpdateTools(Array.from(selectedSlugs), action, opts);
        showAlert("Bulk Update Complete", `Success: ${res.success} tools updated. Failed: ${res.failed}.`);
        if (res.success > 0) {
          setSelectedSlugs(new Set());
          setShowBulkCategory(false);
        }
      } catch (e) {
        showAlert("Error", "An error occurred during bulk operation.");
      } finally {
        setIsBulkLoading(false);
      }
    };

    if (action === "delete") {
      showConfirm("Delete Tools", `Are you sure you want to delete ${selectedSlugs.size} selected tools? This action may be permanent.`, executeAction);
      return;
    }
    if (action === "unpublish") {
      showConfirm("Unpublish Tools", `Are you sure you want to deactivate ${selectedSlugs.size} selected tools? They will be hidden from the public.`, executeAction);
      return;
    }

    executeAction();
  };


  const handleExport = () => {
    if (selectedSlugs.size === 0) return;
    const selectedTools = tools.filter(t => selectedSlugs.has(t.slug));
    const csvRows = [];
    // Header
    csvRows.push(['Name', 'Slug', 'Category', 'Type', 'Status', 'Pricing', 'Featured', 'Usage', 'Views', 'Last Updated']);
    // Data
    for (const t of selectedTools) {
      csvRows.push([
        `"${t.name.replace(/"/g, '""')}"`,
        t.slug,
        t.category,
        t.type,
        t.status ? 'Active' : 'Inactive',
        t.pricing,
        t.featured ? 'Yes' : 'No',
        t.usage,
        t.views,
        new Date(t.updatedAt).toISOString()
      ].join(','));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avex-tools-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    updateParam("q", q);
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname); // Clears all search params
    });
  };

  const allSelected = tools.length > 0 && tools.every(t => selectedSlugs.has(t.slug));
  const someSelected = selectedSlugs.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tool Management</h1>
          <p className="text-sm text-slate-500">Showing {tools.length} of {totalTools} tools on this page.</p>
        </div>
        {hasEditPermission && (
          initialParams.category ? (
            <Link
              href={`/admin/tools/reorder?category=${initialParams.category}`}
              className="inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Reorder Tools
            </Link>
          ) : (
            <button
              disabled
              title="Select a category first to reorder its tools"
              className="inline-flex items-center justify-center rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-white shadow-sm cursor-not-allowed opacity-70"
            >
              Reorder Tools
            </button>
          )
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="q"
              placeholder="Search by name, slug, or keywords..."
              defaultValue={initialParams.q}
              className="block w-full rounded-md border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
            />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800" disabled={isPending}>
            Search
          </button>
          
          <select 
            value={initialParams.category} 
            onChange={(e) => updateParam("category", e.target.value)}
            className="rounded-md border-0 pl-3 pr-8 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name || c.slug}</option>
            ))}
          </select>

          <select 
            value={initialParams.status} 
            onChange={(e) => updateParam("status", e.target.value)}
            className="rounded-md border-0 pl-3 pr-8 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select 
            value={initialParams.featured} 
            onChange={(e) => updateParam("featured", e.target.value)}
            className="rounded-md border-0 pl-3 pr-8 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          >
            <option value="">All Featured States</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
          
          <select 
            value={initialParams.sort} 
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-md border-0 pl-3 pr-8 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          >
            <option value="latest">Sort: Latest Updated</option>
            <option value="oldest">Sort: Oldest Updated</option>
            <option value="most-used">Sort: Most Used</option>
            <option value="least-used">Sort: Least Used</option>
            <option value="most-viewed">Sort: Most Viewed</option>
            <option value="name-asc">Sort: Name A-Z</option>
            <option value="name-desc">Sort: Name Z-A</option>
          </select>

          {Object.values(initialParams).some(v => v !== "" && v !== "latest") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-orange-600 hover:text-orange-500"
            >
              Clear Filters
            </button>
          )}
        </form>
      </div>

      {/* Bulk Actions Bar */}
      {selectedSlugs.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 sticky top-24 z-10 shadow-sm">
          <div className="text-sm font-medium text-orange-800">
            {selectedSlugs.size} tool{selectedSlugs.size !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            {showBulkCategory ? (
              <div className="flex items-center gap-2">
                <select 
                  value={bulkCategorySlug} 
                  onChange={(e) => setBulkCategorySlug(e.target.value)}
                  className="rounded-md border-0 pl-3 pr-8 py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name || c.slug}</option>
                  ))}
                </select>
                <button 
                  onClick={() => handleBulkAction("publish", { categorySlug: bulkCategorySlug })}
                  disabled={!bulkCategorySlug || isBulkLoading}
                  className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button 
                  onClick={() => setShowBulkCategory(false)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {hasStatusPermission && (
                  <>
                    <button onClick={() => handleBulkAction("publish")} disabled={isBulkLoading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50">Publish</button>
                    <button onClick={() => handleBulkAction("unpublish")} disabled={isBulkLoading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50">Unpublish</button>
                  </>
                )}
                {hasEditPermission && (
                  <>
                    <button onClick={() => handleBulkAction("feature")} disabled={isBulkLoading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50">Feature</button>
                    <button onClick={() => handleBulkAction("unfeature")} disabled={isBulkLoading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50">Unfeature</button>
                    <button onClick={() => setShowBulkCategory(true)} disabled={isBulkLoading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50">Change Category</button>
                    <button onClick={handleExport} disabled={isBulkLoading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50">Export</button>
                  </>
                )}
                {hasDeletePermission && (
                  <button onClick={() => handleBulkAction("delete")} disabled={isBulkLoading} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-sm rounded-md hover:bg-red-100">Delete</button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    ref={input => { if (input) input.indeterminate = someSelected }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600" 
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tool</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Version</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pricing</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stats</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {tools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                    No tools found matching your criteria.
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.slug} className={selectedSlugs.has(tool.slug) ? "bg-orange-50/50" : ""}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedSlugs.has(tool.slug)}
                        onChange={(e) => handleSelectOne(tool.slug, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                            {tool.name}
                            {tool.featured && <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">★ Featured</span>}
                            {tool.isDynamic && <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">Dynamic</span>}
                          </div>
                          <div className="text-sm text-slate-500">{tool.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {categories.find(c => c.slug === tool.category)?.name || tool.category}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 capitalize">
                      {tool.type}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tool.status ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {tool.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 capitalize">
                      {tool.pricing}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      <div className="flex flex-col gap-1">
                        <span>{tool.usage.toLocaleString()} uses</span>
                        <span>{tool.views.toLocaleString()} views</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium relative">
                      <button 
                        onClick={() => setOpenDropdown(openDropdown === tool.slug ? null : tool.slug)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {openDropdown === tool.slug && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute right-6 mt-1 w-32 bg-white rounded-md shadow-lg border border-slate-200 z-20 py-1 overflow-hidden">
                            <Link 
                              href={`/${tool.category}/${tool.slug}`} 
                              target="_blank" 
                              className="block px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-orange-600"
                              onClick={() => setOpenDropdown(null)}
                            >
                              Preview
                            </Link>
                            {hasEditPermission && (
                              <Link 
                                href={`/admin/tools/${tool.slug}`} 
                                className="block px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-orange-600"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => updateParam("page", String(currentPage - 1))}
                disabled={currentPage <= 1 || isPending}
                className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => updateParam("page", String(currentPage + 1))}
                disabled={currentPage >= totalPages || isPending}
                className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalTools)}</span> of{" "}
                  <span className="font-medium">{totalTools}</span> tools
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => updateParam("page", String(currentPage - 1))}
                    disabled={currentPage <= 1 || isPending}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    &laquo;
                  </button>
                  
                  {/* Simplified Pagination for long lists */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((p, i, arr) => {
                      if (i > 0 && arr[i] - arr[i-1] > 1) {
                        return (
                          <span key={`ellipsis-${p}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
                            ...
                          </span>
                        )
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => updateParam("page", String(p))}
                          disabled={isPending}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                            p === currentPage
                              ? "z-10 bg-orange-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                              : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    
                  <button
                    onClick={() => updateParam("page", String(currentPage + 1))}
                    disabled={currentPage >= totalPages || isPending}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
