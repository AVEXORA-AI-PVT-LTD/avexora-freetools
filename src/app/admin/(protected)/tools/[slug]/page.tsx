import { requireAdminAuth } from "@/server/admin-auth";
import { getToolFormData } from "@/server/admin-tools";
import { getEffectiveCategories } from "@/server/categories";
import { getAdminToolsData } from "@/server/admin-tools";
import { ToolEditor } from "../ToolEditor";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Tool | Avex Tools Admin",
};

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminAuth("tools.edit");
  const { slug } = await params;
  
  const categories = await getEffectiveCategories();
  const tools = await getAdminToolsData();
  const initialData = await getToolFormData(slug);
  if (!initialData) {
    notFound();
  }

  return <ToolEditor initialData={initialData} isNew={false} categories={categories} allSlugs={tools.map(t => ({ slug: t.slug, name: t.name }))} />;
}
