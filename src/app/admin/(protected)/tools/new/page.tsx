import { requireAdminAuth } from "@/server/admin-auth";
import { getEffectiveCategories } from "@/server/categories";
import { getAdminToolsData } from "@/server/admin-tools";
import { ToolEditor } from "../ToolEditor";
import { INITIAL_TOOL_FORM_DATA } from "@/types/admin-tool-form";

export const metadata = {
  title: "Add New Tool | Avex Tools Admin",
};

export default async function AddToolPage() {
  await requireAdminAuth("tools.create");
  const categories = await getEffectiveCategories();
  const tools = await getAdminToolsData();
  return <ToolEditor initialData={INITIAL_TOOL_FORM_DATA} isNew={true} categories={categories} allSlugs={tools.map(t => ({ slug: t.slug, name: t.name }))} />;
}
