import { requireAdminPermission } from "@/lib/auth/session";
import { globalAdminSearch } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSearchPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireAdminPermission("dashboard:view");
  const q = searchParams.q ?? "";
  const result = await globalAdminSearch(q);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Global Search</CardTitle></CardHeader>
        <CardContent>
          <form>
            <input name="q" defaultValue={q} placeholder="Search products, orders, users" className="h-10 w-full rounded-md border border-slate-200 px-3" />
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Products ({result.products.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">{result.products.slice(0, 8).map((p) => <p key={p.id}>{p.name}</p>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Orders ({result.orders.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">{result.orders.slice(0, 8).map((o) => <p key={o.id}>{o.id}</p>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Users ({result.users.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">{result.users.slice(0, 8).map((u) => <p key={u.id}>{u.name}</p>)}</CardContent>
        </Card>
      </div>
    </div>
  );
}
