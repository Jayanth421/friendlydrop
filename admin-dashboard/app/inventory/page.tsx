import { requireAdminPermission } from "@/lib/auth/session";
import { getProducts } from "@/lib/firebase/firestore";
import { InventoryTable } from "./inventory-table";

export default async function AdminInventoryPage() {
  await requireAdminPermission("inventory:manage");
  const products = await getProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Inventory Management</h1>
        <p className="mt-1 text-sm text-stone-500">Monitor stock levels, set low-stock thresholds, and perform inline or bulk quantity updates.</p>
      </div>

      {/* Main Inventory Manager table component */}
      <InventoryTable products={products} />
    </div>
  );
}
