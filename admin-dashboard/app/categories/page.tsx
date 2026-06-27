import { requireAdminPermission } from "@/lib/auth/session";
import { getCatalogCategories } from "@/lib/enterprise";
import { CategoryManager } from "./category-manager";

export default async function AdminCategoriesPage() {
  await requireAdminPermission("catalog:manage");
  const categories = await getCatalogCategories();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Categories Management</h1>
        <p className="mt-1 text-sm text-stone-500">Organize your store catalog into nested hierarchies with custom slugs, banners, and tags.</p>
      </div>

      {/* Main Categories Manager component */}
      <CategoryManager categories={categories} />
    </div>
  );
}
