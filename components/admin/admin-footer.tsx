export function AdminFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-stone-200/80 px-1 py-4 text-xs text-stone-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} FriendlyDrop Admin. Built for operations, catalog, and commerce teams.</p>
        <div className="flex flex-wrap gap-4 uppercase tracking-[0.08em]">
          <span>Dashboard</span>
          <span>Support</span>
          <span>Settings</span>
        </div>
      </div>
    </footer>
  );
}
