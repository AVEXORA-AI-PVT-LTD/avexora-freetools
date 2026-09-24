import { requireAdminAuth } from "@/server/admin-auth";
import { getAllCategoriesAdmin, type AdminCategory } from "@/server/category-service";
import { CategoryEditor } from "./CategoryEditor";

export const metadata = { title: "Edit Category | Avex Tools Admin" };

export default async function CategoryEditorPage({ params }: { params: { slug: string } }) {
  await requireAdminAuth("categories.edit");
  
  const allCategories = await getAllCategoriesAdmin();
  const isNew = params.slug === "new";
  
  const emptyCategory = {
    name: "",
    slug: "",
    description: "",
    status: true,
    featured: false,
    seoMetadata: null,
  };
  let initialData: typeof emptyCategory | AdminCategory = emptyCategory;

  if (!isNew) {
    const existing = allCategories.find(c => c.slug === params.slug);
    if (existing) {
      initialData = { ...existing };
    }
  }

  return <CategoryEditor initialData={initialData} isNew={isNew} />;
}
