import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/30 bg-transparent">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="font-display text-2xl font-semibold">Maison FriendlyDrop</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Luxury-ready fashion commerce with AI styling, curated drops, and a premium customer journey.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Studio</h4>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Private Label Collections</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">Virtual Try-on and AI Concierge</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Support</h4>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">help@friendlydrop.in</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">+91 98765 43210</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            <Link href="/privacy-policy" className="hover:text-black dark:hover:text-white">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-black dark:hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-black dark:hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
