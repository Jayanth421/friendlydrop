"use client";

import { useState } from "react";
import {
  Wallet,
  CreditCard,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download,
  IndianRupee,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Order as DBOrder, VendorPayout } from "@/types";

interface Payout {
  id: string;
  period: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  date: string;
  method: string;
}



function payoutStatusBadge(status: Payout["status"]) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs gap-1">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs gap-1">
          <XCircle className="h-3 w-3" /> Failed
        </Badge>
      );
  }
}

export function VendorWalletContent({ initialPayouts, initialOrders }: { initialPayouts: VendorPayout[], initialOrders: DBOrder[] }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>(initialPayouts.map(p => ({
    id: p.id,
    period: "Requested Payout",
    amount: p.amount,
    status: p.status,
    date: p.createdAt,
    method: "Bank Transfer"
  })));

  async function handleWithdraw() {
    setWithdrawing(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Withdrawal request submitted! Funds will arrive in 2-3 business days.");
    setWithdrawing(false);
  }

  const completed = payouts.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalEarned = initialOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  const available = totalEarned - completed - pending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Wallet & Payouts</h1>
        <p className="mt-0.5 text-sm text-stone-500">Track your earnings and manage payouts</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Available Balance */}
        <div className="rounded-xl border-2 border-stone-900 bg-stone-900 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Available Balance</p>
              <p className="mt-2 text-3xl font-bold">₹{available.toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-stone-400">Ready to withdraw</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
          <Button
            className="mt-5 h-9 w-full rounded-xl bg-white text-stone-900 text-sm font-semibold hover:bg-stone-100 transition"
            onClick={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4" />
                Withdraw Funds
              </span>
            )}
          </Button>
        </div>

        {/* Pending */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Pending Payouts</p>
              <p className="mt-2 text-2xl font-bold text-amber-900">₹{pending.toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-amber-600">Settlement in progress</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-white">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Total Earned</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">₹{totalEarned.toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-stone-500">All-time earnings</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
              <TrendingUp className="h-5 w-5 text-stone-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Bank Info Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900">Bank Account: •••• •••• •••• 4321 — HDFC Bank</p>
            <p className="text-xs text-blue-600">Payouts are processed every Monday and Thursday</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto shrink-0 rounded-xl border-blue-300 text-blue-700 hover:bg-blue-100">
            Update
          </Button>
        </div>
      </div>

      {/* Payout History */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">Payout History</h2>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Period</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Date</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Method</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Amount</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {payouts.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50 transition">
                <td className="px-5 py-3 font-medium text-stone-900">{p.period}</td>
                <td className="px-5 py-3 text-stone-600">{new Date(p.date).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3 text-stone-600">{p.method}</td>
                <td className="px-5 py-3 font-semibold text-stone-900">₹{p.amount.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3">{payoutStatusBadge(p.status)}</td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-stone-500">No payouts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
