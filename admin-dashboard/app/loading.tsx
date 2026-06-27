import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="w-full max-w-none pb-0">
      <div className="min-h-screen bg-stone-50 grain-texture text-stone-900">
        <div className="flex min-h-screen">
          <aside className="hidden w-[290px] border-r border-stone-200 bg-white/95 lg:block">
            <div className="border-b border-stone-200 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col px-3 py-3 lg:px-6 lg:py-6">
            <Skeleton className="mb-4 h-24 w-full rounded-2xl" />
            <Skeleton className="mb-4 h-[420px] w-full rounded-2xl" />
            <div className="grid gap-4 xl:grid-cols-2">
              <Skeleton className="h-72 w-full rounded-2xl" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
