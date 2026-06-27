"use client";

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Legend } from "recharts";
import { DashboardTrendPoint } from "@/types";

export function RevenueChart({ points }: { points: DashboardTrendPoint[] }) {
  return (
    <div className="h-[320px] rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-stone-700">Revenue and Orders</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="orders" stroke="#0f172a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="users" stroke="#ff6f3d" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
