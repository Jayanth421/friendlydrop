import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <main className="space-y-4">
      <Skeleton className="h-10 w-60" />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </main>
  );
}
