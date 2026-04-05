"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const showDebug = process.env.NODE_ENV !== "production";

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-600">Please retry. If this keeps happening, check your env setup.</p>
        {showDebug ? (
          <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-left text-xs text-slate-700">
            {error.message || "Unknown error"}
          </p>
        ) : null}
        <Button className="mt-4" onClick={reset}>
          Try Again
        </Button>
      </div>
    </main>
  );
}
