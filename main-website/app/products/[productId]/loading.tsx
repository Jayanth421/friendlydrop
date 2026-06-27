import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailsLoading() {
  return (
    <main className="space-y-6 px-4 pb-20 pt-6 md:px-10">
      <div className="grid gap-6 lg:grid-cols-[1.75fr_1fr]">
        <Skeleton className="aspect-[4/5] w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
    </main>
  );
}
