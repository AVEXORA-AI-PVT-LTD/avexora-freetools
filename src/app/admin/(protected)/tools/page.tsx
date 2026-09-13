import { requireAdminAuth } from "@/server/admin-auth";
import { getAllToolsWithConfig } from "@/server/tools";
import { getAllCategoriesWithConfig } from "@/server/categories";
import { ToolActions } from "@/components/admin/ToolActions";
import { ToolToggle } from "@/components/admin/ToolToggle";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tool Management | Admin",
};

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdminAuth("tools.view");

  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q : "";
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : "";
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : "";
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;

  const tools = await getAllToolsWithConfig();
  const categories = await getAllCategoriesWithConfig();

  const filtered = tools.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (category && t.category !== category) return false;
    if (status === "enabled" && !(t as any).status) return false;
    if (status === "disabled" && (t as any).status) return false;
    return true;
  });

  const pageSize = 20;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const validPage = Math.max(1, Math.min(page, totalPages));
  
  const paginated = filtered.slice((validPage - 1) * pageSize, validPage * pageSize);

  const buildQuery = (updates: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (status) p.set("status", status);
    if (validPage > 1) p.set("page", validPage.toString());
    
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    
    return `?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Tools</h1>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/tools/reorder"
            className="rounded-md bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Reorder Tools
          </Link>
          <Link 
            href="/admin/tools/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm"
          >
            Add New Tool
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="flex flex-wrap items-end gap-4" action="/admin/tools">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              type="text"
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Search tools..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="w-48">
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category || ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status || ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filter
          </button>
          {(q || category || status) && (
            <Link
              href="/admin/tools"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tool
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Toggle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    No tools found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((tool) => (
                  <tr key={tool.slug}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{tool.name}</div>
                      <div className="text-sm text-slate-500">{tool.slug}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {categories.find(c => c.slug === tool.category)?.name || tool.category}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {(tool as any).priority}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <ToolToggle slug={tool.slug} initialStatus={(tool as any).status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${(tool as any).status ? "bg-green-500" : "bg-slate-300"}`}></span>
                        <span className="text-sm font-medium text-slate-700">{(tool as any).status ? "Enabled" : "Disabled"}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <ToolActions slug={tool.slug} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={buildQuery({ page: (validPage - 1).toString() })}
                className={`relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${validPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                Previous
              </Link>
              <Link
                href={buildQuery({ page: (validPage + 1).toString() })}
                className={`relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${validPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{(validPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(validPage * pageSize, filtered.length)}</span> of{" "}
                  <span className="font-medium">{filtered.length}</span> tools
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Link
                    href={buildQuery({ page: (validPage - 1).toString() })}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 ${validPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={buildQuery({ page: p.toString() })}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                        p === validPage
                          ? "z-10 bg-orange-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                          : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                  <Link
                    href={buildQuery({ page: (validPage + 1).toString() })}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 ${validPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
