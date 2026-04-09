import { requireAdminPermission } from "@/lib/auth/session";
import { getCatalogCategories } from "@/lib/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryRowActions } from "@/components/admin/category-row-actions";

export default async function AdminCategoriesPage() {
  await requireAdminPermission("catalog:manage");
  const categories = await getCatalogCategories();

  return (
    <div className="space-y-4">
      <CategoryForm />

      <Card>
        <CardHeader>
          <CardTitle>Catalog & Category Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.level}</TableCell>
                  <TableCell>{category.parentId ?? "-"}</TableCell>
                  <TableCell>{category.tags?.join(", ") ?? "-"}</TableCell>
                  <TableCell><CategoryRowActions categoryId={category.id} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
