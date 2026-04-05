import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="font-display text-xl font-bold text-ink">FriendlyDrop</h3>
          <p className="mt-2 text-sm text-slate-600">Premium custom prints, stickers, and personalized gifts delivered across India.</p>
        </div>
       
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink">Support</h4>
          <p className="mt-3 text-sm text-slate-600">help@friendlydrop.in</p>
          <p className="text-sm text-slate-600">+91 98765 43210</p>
        </div>
      </div>
    </footer>
  );
}
