"use client";

import { useState, useMemo } from "react";
import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusPill } from "@/components/admin/status-pill";
import { UpiProofActions } from "@/components/admin/upi-proof-actions";

/* ─── tiny icon set (inline SVG) ─────────────────────────────────────────── */
function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block ${className}`}
    >
      <path d={d} />
    </svg>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

const STATUS_COLORS: Record<string, string> = {
  success: "#22c55e",
  failed: "#ef4444",
  initiated: "#a78bfa",
  refunded: "#f59e0b",
};

const STATUS_BG: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  initiated: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  refunded: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

/* ─── Donut chart (pure CSS/SVG) ─────────────────────────────────────────── */
function DonutChart({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No data
      </div>
    );
  }

  const R = 50;
  const cx = 60;
  const cy = 60;
  let offset = -Math.PI / 2;

  const paths = slices.map((slice) => {
    const frac = slice.value / total;
    const angle = frac * 2 * Math.PI;
    const x1 = cx + R * Math.cos(offset);
    const y1 = cy + R * Math.sin(offset);
    offset += angle;
    const x2 = cx + R * Math.cos(offset);
    const y2 = cy + R * Math.sin(offset);
    const large = angle > Math.PI ? 1 : 0;
    return {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`,
      color: slice.color,
      label: slice.label,
      value: slice.value,
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} opacity={0.9} />
        ))}
        <circle cx={cx} cy={cy} r={28} fill="#0f172a" />
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="12"
          fontWeight="bold"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="8"
        >
          total
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-slate-300">{s.label}</span>
            <span className="ml-auto font-semibold text-slate-100">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sparkline bar chart ─────────────────────────────────────────────────── */
function SparkBars({
  points,
  color = "#7c3aed",
}: {
  points: number[];
  color?: string;
}) {
  const max = Math.max(...points, 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {points.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-300"
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.8 }}
        />
      ))}
    </div>
  );
}

/* ─── Main dashboard ──────────────────────────────────────────────────────── */
export function PaymentsDashboard({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMsg, setRefundMsg] = useState<string | null>(null);

  /* ── aggregate KPIs ── */
  const kpis = useMemo(() => {
    const total = transactions.reduce((s, t) => s + t.amount, 0);
    const success = transactions.filter((t) => t.status === "success");
    const failed = transactions.filter((t) => t.status === "failed");
    const pending = transactions.filter((t) => t.status === "initiated");
    const refunded = transactions.filter((t) => t.status === "refunded");
    return {
      totalRevenue: success.reduce((s, t) => s + t.amount, 0),
      totalTransactions: transactions.length,
      successCount: success.length,
      failedCount: failed.length,
      pendingCount: pending.length,
      refundedCount: refunded.length,
      refundedAmount: refunded.reduce((s, t) => s + t.amount, 0),
      successRate: pct(success.length, transactions.length),
      avgOrderValue:
        success.length > 0
          ? success.reduce((s, t) => s + t.amount, 0) / success.length
          : 0,
    };
  }, [transactions]);

  /* ── last-7-day revenue sparkline ── */
  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return transactions
        .filter((t) => {
          const ts = new Date(t.createdAt).getTime();
          return ts >= day.getTime() && ts < nextDay.getTime() && t.status === "success";
        })
        .reduce((s, t) => s + t.amount, 0);
    });
  }, [transactions]);

  /* ── status donut ── */
  const donutSlices = [
    { label: "Success", value: kpis.successCount, color: STATUS_COLORS.success },
    { label: "Failed", value: kpis.failedCount, color: STATUS_COLORS.failed },
    { label: "Pending", value: kpis.pendingCount, color: STATUS_COLORS.initiated },
    { label: "Refunded", value: kpis.refundedCount, color: STATUS_COLORS.refunded },
  ].filter((s) => s.value > 0);

  /* ── provider breakdown ── */
  const providerMap = useMemo(() => {
    const m = new Map<string, { count: number; revenue: number }>();
    for (const t of transactions) {
      const key = t.provider;
      const cur = m.get(key) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      if (t.status === "success") cur.revenue += t.amount;
      m.set(key, cur);
    }
    return Array.from(m.entries()).map(([name, v]) => ({ name, ...v }));
  }, [transactions]);

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    const now = Date.now();
    return transactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (providerFilter !== "all" && t.provider !== providerFilter) return false;
      if (dateFilter !== "all") {
        const ms = {
          "7d": 7 * 86400000,
          "30d": 30 * 86400000,
          "90d": 90 * 86400000,
        }[dateFilter] as number;
        if (now - new Date(t.createdAt).getTime() > ms) return false;
      }
      const needle = search.toLowerCase();
      if (
        needle &&
        !t.id.toLowerCase().includes(needle) &&
        !t.orderId.toLowerCase().includes(needle) &&
        !t.providerPaymentId?.toLowerCase().includes(needle) &&
        !t.provider.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, search, statusFilter, providerFilter, dateFilter]);

  /* ── refund handler ── */
  async function handleRefund(txnId: string) {
    setRefundLoading(true);
    setRefundMsg(null);
    try {
      const res = await fetch("/api/payments/cashfree/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txnId, note: refundNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setRefundMsg("✅ Refund initiated successfully.");
        setRefundingId(null);
        setRefundNote("");
      } else {
        setRefundMsg(`❌ ${data.error ?? "Refund failed."}`);
      }
    } catch {
      setRefundMsg("❌ Network error.");
    } finally {
      setRefundLoading(false);
    }
  }

  /* ── providers list for filter dropdown ── */
  const providers = Array.from(new Set(transactions.map((t) => t.provider)));

  return (
    <div className="space-y-6">
      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          sub="from successful payments"
          icon="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14H11v-2h2v2zm0-4H11V7h2v5z"
          color="from-violet-600/20 to-violet-900/10 border-violet-500/20"
          iconColor="text-violet-400"
          spark={<SparkBars points={last7} color="#7c3aed" />}
        />
        <KpiCard
          label="Transactions"
          value={String(kpis.totalTransactions)}
          sub={`${kpis.successRate}% success rate`}
          icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138"
          color="from-sky-600/20 to-sky-900/10 border-sky-500/20"
          iconColor="text-sky-400"
        />
        <KpiCard
          label="Successful"
          value={String(kpis.successCount)}
          sub={formatCurrency(kpis.totalRevenue)}
          icon="M22 11.08V12a10 10 0 1 1-5.93-9.14"
          color="from-emerald-600/20 to-emerald-900/10 border-emerald-500/20"
          iconColor="text-emerald-400"
        />
        <KpiCard
          label="Failed"
          value={String(kpis.failedCount)}
          sub="need attention"
          icon="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          color="from-red-600/20 to-red-900/10 border-red-500/20"
          iconColor="text-red-400"
        />
        <KpiCard
          label="Pending"
          value={String(kpis.pendingCount)}
          sub="awaiting confirmation"
          icon="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          color="from-amber-600/20 to-amber-900/10 border-amber-500/20"
          iconColor="text-amber-400"
        />
        <KpiCard
          label="Refunded"
          value={String(kpis.refundedCount)}
          sub={formatCurrency(kpis.refundedAmount)}
          icon="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6l6-6"
          color="from-rose-600/20 to-rose-900/10 border-rose-500/20"
          iconColor="text-rose-400"
        />
      </div>

      {/* ── analytics row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Status donut */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Payment Status Breakdown
          </h3>
          <DonutChart slices={donutSlices} />
        </div>

        {/* Provider breakdown */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Provider Performance
          </h3>
          <div className="space-y-3">
            {providerMap.length === 0 && (
              <p className="text-slate-500 text-sm">No provider data</p>
            )}
            {providerMap.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="capitalize font-medium text-slate-200">
                    {p.name.replace(/_/g, " ")}
                  </span>
                  <span>{p.count} txns · {formatCurrency(p.revenue)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{
                      width: `${pct(p.count, kpis.totalTransactions)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue trend */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">
            7-Day Revenue Trend
          </h3>
          <p className="text-xs text-slate-500 mb-4">Successful payments only</p>
          <div className="h-24 flex items-end">
            <div className="w-full">
              {/* Bar chart */}
              <div className="flex items-end gap-1 h-16">
                {last7.map((v, i) => {
                  const max = Math.max(...last7, 1);
                  const dayLabel = new Date(
                    Date.now() - (6 - i) * 86400000
                  ).toLocaleDateString("en-IN", { weekday: "short" });
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-0.5"
                    >
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-violet-600 to-fuchsia-500 transition-all duration-500"
                        style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? "4px" : "0" }}
                        title={formatCurrency(v)}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {last7.map((_, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[9px] text-slate-600">
                      {new Date(
                        Date.now() - (6 - i) * 86400000
                      ).toLocaleDateString("en-IN", { weekday: "narrow" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between text-xs">
            <span className="text-slate-500">Avg. order value</span>
            <span className="font-semibold text-slate-200">
              {formatCurrency(kpis.avgOrderValue)}
            </span>
          </div>
        </div>
      </div>

      {/* ── refund message ── */}
      {refundMsg && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
          {refundMsg}
        </div>
      )}

      {/* ── transaction table ── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur overflow-hidden">
        {/* toolbar */}
        <div className="flex flex-wrap gap-2 items-center p-4 border-b border-slate-700/60">
          <div className="relative flex-1 min-w-[180px]">
            <Icon
              d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="payments-search"
              type="search"
              placeholder="Search ID, order, provider…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <select
            id="payments-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="initiated">Pending</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            id="payments-provider-filter"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <select
            id="payments-date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <span className="ml-auto text-xs text-slate-500">
            {filtered.length} / {transactions.length} transactions
          </span>
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                {[
                  "Txn ID",
                  "Order",
                  "Provider",
                  "Amount",
                  "Status",
                  "UPI Proof",
                  "Review",
                  "Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
              {filtered.map((txn) => (
                <>
                  <tr
                    key={txn.id}
                    className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[100px] truncate">
                      {txn.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-violet-400">
                      {txn.orderId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/60 px-2 py-0.5 text-xs font-medium text-slate-300 capitalize">
                        {txn.provider.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={txn.status} />
                    </td>
                    <td className="px-4 py-3">
                      {txn.proofImageUrl ? (
                        <a
                          href={txn.proofImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-violet-400 hover:text-violet-300 hover:underline transition-colors"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {txn.provider === "upi_offline" ? (
                        <UpiProofActions
                          transactionId={txn.id}
                          proofStatus={txn.proofStatus}
                        />
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(txn.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {txn.status === "success" && (
                          <button
                            id={`refund-btn-${txn.id}`}
                            onClick={() =>
                              setRefundingId(
                                refundingId === txn.id ? null : txn.id
                              )
                            }
                            className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-400/60 rounded-md px-2 py-0.5 transition-all"
                          >
                            Refund
                          </button>
                        )}
                        {txn.failureReason && (
                          <span
                            title={txn.failureReason}
                            className="text-xs text-slate-600 cursor-help"
                          >
                            ⚠
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* refund panel */}
                  {refundingId === txn.id && (
                    <tr key={`refund-${txn.id}`} className="bg-slate-800/60">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-rose-300 font-medium">
                            Initiate refund for {formatCurrency(txn.amount)}
                          </span>
                          <input
                            id={`refund-note-${txn.id}`}
                            type="text"
                            placeholder="Reason / note (optional)"
                            value={refundNote}
                            onChange={(e) => setRefundNote(e.target.value)}
                            className="flex-1 min-w-[200px] rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                          />
                          <button
                            id={`refund-confirm-${txn.id}`}
                            disabled={refundLoading}
                            onClick={() => handleRefund(txn.id)}
                            className="rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                          >
                            {refundLoading ? "Processing…" : "Confirm Refund"}
                          </button>
                          <button
                            onClick={() => {
                              setRefundingId(null);
                              setRefundNote("");
                            }}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI card sub-component ─────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
  iconColor,
  spark,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
  iconColor: string;
  spark?: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-gradient-to-br ${color} p-4 backdrop-blur overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 leading-tight">
          {label}
        </span>
        <Icon d={icon} className={`w-4 h-4 shrink-0 ${iconColor}`} />
      </div>
      <p className="text-xl font-bold text-slate-100 leading-none mb-0.5">
        {value}
      </p>
      <p className="text-[10px] text-slate-500 truncate">{sub}</p>
      {spark && <div className="mt-2">{spark}</div>}
    </div>
  );
}
