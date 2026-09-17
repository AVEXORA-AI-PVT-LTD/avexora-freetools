import { requireAdminAuth } from "@/server/admin-auth";
import { getEffectiveCategories } from "@/server/categories";
import { getAdminToolsData } from "@/server/admin-tools";
import { ToolListManager } from "./ToolListManager";

export const metadata = {
  title: "Tool Management | Avex Tools Admin",
};

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAdminAuth();
  const resolvedSearchParams = await searchParams;

  // We fetch ALL data here. If it was 10000+, we would do DB-level query, 
  // but since we are merging Static + DB configs, we have to fetch all configs anyway 
  // and do the merge in memory. This is required because of the "Static Registry" architecture.
  const allTools = await getAdminToolsData();
  const categories = await getEffectiveCategories();

  // Server-side filtering
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.toLowerCase() : "";
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "";
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "";
  const type = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "";
  const pricing = typeof resolvedSearchParams.pricing === "string" ? resolvedSearchParams.pricing : "";
  const featured = typeof resolvedSearchParams.featured === "string" ? resolvedSearchParams.featured : "";
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : "latest";
  
  let filtered = allTools;

  if (q) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.seoDescription && t.seoDescription.toLowerCase().includes(q))
    );
  }
  if (category) {
    filtered = filtered.filter((t) => t.category === category);
  }
  if (status) {
    const isActive = status === "active";
    filtered = filtered.filter((t) => t.status === isActive);
  }
  if (type) {
    filtered = filtered.filter((t) => t.type === type);
  }
  if (pricing) {
    filtered = filtered.filter((t) => t.pricing.toLowerCase() === pricing.toLowerCase());
  }
  if (featured) {
    const isFeatured = featured === "true";
    filtered = filtered.filter((t) => t.featured === isFeatured);
  }

  // Server-side sorting
  filtered.sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.updatedAt.getTime() - b.updatedAt.getTime();
      case "latest":
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case "most-used":
        return b.usage - a.usage;
      case "least-used":
        return a.usage - b.usage;
      case "most-viewed":
        return b.views - a.views;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        // default priority sort
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  // Server-side pagination
  const pageStr = typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1";
  const limitStr = typeof resolvedSearchParams.limit === "string" ? resolvedSearchParams.limit : "25";
  let page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) page = 1;
  let limit = parseInt(limitStr, 10);
  if (isNaN(limit) || limit < 1) limit = 25;

  const totalTools = filtered.length;
  const totalPages = Math.ceil(totalTools / limit);
  if (page > totalPages && totalPages > 0) page = totalPages;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTools = filtered.slice(startIndex, endIndex);

  return (
    <ToolListManager
      tools={paginatedTools}
      totalTools={totalTools}
      categories={categories}
      currentPage={page}
      totalPages={totalPages}
      limit={limit}
      userRole={user.role || ""}
      initialParams={{
        q,
        category,
        status,
        type,
        pricing,
        featured,
        sort,
      }}
    />
  );
}
