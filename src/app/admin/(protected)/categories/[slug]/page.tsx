import { requireAdminAuth } from "@/server/admin-auth";
import { getAllCategoriesAdmin } from "@/server/category-service";
import { CategoryEditor } from "./CategoryEditor";

export const metadata = { title: "Edit Category | Avex Tools Admin" };

export default async function CategoryEditorPage({ params }: { params: { slug: string } }) {
  await requireAdminAuth("categories.edit");
  
  const allCategories = await getAllCategoriesAdmin();
  const isNew = params.slug === "new";
  
  let initialData = {
    name: "",
    slug: "",
    description: "",
    status: true,
    featured: false,
    seoMetadata: null,
  };

  if (!isNew) {
    const existing = allCategories.find(c => c.slug === params.slug);
    if (existing) {
      initialData = { ...existing } as any;
    }
  }

  return <CategoryEditor initialData={initialData} isNew={isNew} />;
}
