import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-slate-600">The page you were looking for does not exist.</p>
        <Link href="/" className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2 font-semibold text-white">
          Back Home
        </Link>
      </div>
    </main>
  );
}
