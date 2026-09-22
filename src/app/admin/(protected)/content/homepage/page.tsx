import { requireAdminAuth } from "@/server/admin-auth";
import { getHomepageSections } from "@/server/homepage-service";
import { HomepageCMSClient } from "./HomepageCMSClient";
import { getAllCategoriesAdmin } from "@/server/category-service";

export const metadata = { title: "Homepage CMS | Avex Tools Admin" };

export default async function HomepageCMSPage() {
  await requireAdminAuth("homepage.view");
  const sections = await getHomepageSections();
  
  // also fetch tools and categories for the selectors
  const categories = await getAllCategoriesAdmin();
  
  // We need to fetch all tools for tool selectors
  // But wait, fetching all tools here is fine, there's only ~130 tools right now.
  const { prisma } = await import("@/server/db");
  const tools = await prisma.toolConfig.findMany({
    select: { toolSlug: true, categorySlug: true, status: true },
    where: { status: true } // only allow selecting active tools
  });
  
  // Also we need static tools that might not be in DB yet
  const { toolsByCategory } = await import("@/tools/registry");
  const allStaticTools = Object.entries(toolsByCategory).flatMap(([catSlug, catTools]) => 
    catTools.map(t => ({ slug: t.slug, name: t.name, categorySlug: catSlug, status: true }))
  );
  
  const toolMap = new Map();
  allStaticTools.forEach(t => toolMap.set(t.slug, t));
  tools.forEach(t => toolMap.set(t.toolSlug, { ...t, slug: t.toolSlug })); // DB overrides
  
  const allTools = Array.from(toolMap.values());

  return <HomepageCMSClient initialSections={sections} allCategories={categories} allTools={allTools} />;
}
