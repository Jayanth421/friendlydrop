export default function Loading() {
  return (
    <main>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    </main>
  );
}
