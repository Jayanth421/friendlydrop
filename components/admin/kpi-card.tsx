import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card className="border-stone-200 bg-white/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold text-ink">{value}</p>
        {helper ? <p className="mt-1 text-xs text-stone-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
