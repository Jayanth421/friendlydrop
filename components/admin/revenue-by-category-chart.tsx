"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#ff6f3d", "#0f172a", "#16a34a", "#0ea5e9", "#f59e0b"];

export function RevenueByCategoryChart({ data }: { data: Array<{ category: string; value: number }> }) {
  return (
    <div className="h-[320px] rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-stone-700">Revenue by Category</p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="category" outerRadius={110} innerRadius={55} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
