"use client";

export function VendorFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 px-3 py-4 text-center text-xs text-stone-500 lg:px-6 mt-4">
      <p>
        © {new Date().getFullYear()} FriendlyDrop. Vendor Dashboard v1.0.
        <br className="sm:hidden" />
        <span className="hidden sm:inline"> • </span>
        <a href="#" className="hover:text-stone-700">
          Terms
        </a>
        <span className="hidden sm:inline"> • </span>
        <a href="#" className="hover:text-stone-700">
          Privacy
        </a>
        <span className="hidden sm:inline"> • </span>
        <a href="#" className="hover:text-stone-700">
          Support
        </a>
      </p>
    </footer>
  );
}
