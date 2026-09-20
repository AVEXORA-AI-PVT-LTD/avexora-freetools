import { requireAdminAuth } from "@/server/admin-auth";
import { getAllCategoriesAdmin } from "@/server/category-service";
import { CategoryListClient } from "./CategoryListClient";

export const metadata = { title: "Categories | Avex Tools Admin" };

export default async function CategoriesAdminPage() {
  await requireAdminAuth("categories.view");
  const categories = await getAllCategoriesAdmin();
  return <CategoryListClient initialCategories={categories} />;
}
