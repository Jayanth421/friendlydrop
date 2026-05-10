export default function ContactPage() {
  return (
    <main className="space-y-4">
      <section className="glass-panel rounded-3xl p-6 md:p-10">
        <h1 className="font-display text-5xl font-semibold">Contact Maison FriendlyDrop</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Reach our concierge for partnership, stylist support, or order assistance.
        </p>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Email</p>
          <p className="mt-1 text-sm font-semibold">help@friendlydrop.in</p>
        </article>
        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Phone</p>
          <p className="mt-1 text-sm font-semibold">+91 98765 43210</p>
        </article>
        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Response SLA</p>
          <p className="mt-1 text-sm font-semibold">Under 2 business hours</p>
        </article>
      </section>
    </main>
  );
}
