"use client";

import { useMemo } from "react";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  TrendingUp,
  Plus,
  Boxes,
  Tag,
  Settings,
  Star,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VendorDashboardSnapshot } from "./vendor-dashboard";

interface VendorDashboardContentProps {
  snapshot: VendorDashboardSnapshot;
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  money,
  color = "blue",
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof Package;
  money?: boolean;
  color?: "blue" | "green" | "amber" | "red" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            {money ? formatCurrency(value) : value.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-stone-500">{helper}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">{title}</h2>
      {children}
    </div>
  );
}

export function VendorDashboardContent({ snapshot }: VendorDashboardContentProps) {
  const orderStats = useMemo(
    () => [
      { label: "New", value: snapshot.pendingOrders, color: "blue" as const },
      { label: "Processing", value: snapshot.processingOrders, color: "amber" as const },
      { label: "Shipped", value: snapshot.shippedOrders, color: "purple" as const },
      { label: "Delivered", value: snapshot.deliveredOrders, color: "green" as const },
      { label: "Cancelled", value: snapshot.cancelledOrders, color: "red" as const },
    ],
    [snapshot]
  );

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={snapshot.productCount}
          helper={`${snapshot.activeProductCount} active`}
          icon={Package}
          color="blue"
        />
        <StatCard
          label="Total Orders"
          value={snapshot.orderCount}
          helper={`${snapshot.pendingOrders} pending`}
          icon={ShoppingCart}
          color="green"
        />
        <StatCard
          label="Total Customers"
          value={snapshot.customerCount}
          helper="Repeat customers"
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Available Balance"
          value={snapshot.availableBalance}
          helper="Ready to withdraw"
          icon={Wallet}
          color="amber"
          money
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Revenue"
          value={snapshot.revenue}
          helper="All-time sales"
          icon={BarChart3}
          money
          color="blue"
        />
        <StatCard
          label="Monthly Revenue"
          value={snapshot.monthlyRevenue}
          helper="Current month"
          icon={TrendingUp}
          money
          color="green"
        />
        <StatCard
          label="Today's Revenue"
          value={snapshot.todayRevenue}
          helper="Since midnight"
          icon={Wallet}
          money
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Revenue Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.revenueByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Order Distribution">
          <div className="space-y-3">
            {orderStats.map((stat) => {
              const total = snapshot.orderCount || 1;
              const percentage = (stat.value / total) * 100;
              return (
                <div key={stat.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">{stat.label}</span>
                    <span className="text-sm font-bold text-stone-900">{stat.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        stat.color === "blue" && "bg-blue-500"
                      } ${stat.color === "amber" && "bg-amber-500"} ${
                        stat.color === "purple" && "bg-purple-500"
                      } ${stat.color === "green" && "bg-emerald-500"} ${
                        stat.color === "red" && "bg-red-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Store Health">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
              <span className="text-stone-700">Products Published</span>
              <span className="font-bold text-stone-900">{snapshot.activeProductCount}/{snapshot.productCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
              <span className="text-stone-700">Avg. Rating</span>
              <span className="flex items-center gap-1 font-bold text-stone-900">
                {snapshot.averageRating.toFixed(1)}/5
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
              <span className="text-stone-700">Low Stock Items</span>
              <span className="font-bold text-stone-900">{snapshot.lowStockProducts}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
              <span className="text-stone-700">Pending Returns</span>
              <span className="font-bold text-stone-900">{snapshot.returnRequests}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Recent Orders */}
      <Panel title="Recent Orders">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-xs font-semibold uppercase text-stone-500">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {snapshot.recentOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-4 font-semibold text-stone-900">#{order.id.slice(0, 8)}</td>
                  <td className="py-3 px-4 text-stone-600">{order.address?.fullName || "N/A"}</td>
                  <td className="py-3 px-4 text-stone-600">{order.items?.length || 0} items</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        ["delivered", "completed"].includes(order.status)
                          ? "default"
                          : ["cancelled"].includes(order.status)
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-stone-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Quick Actions */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button className="rounded-lg h-12 gap-2" variant="outline">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
          <Button className="rounded-lg h-12 gap-2" variant="outline">
            <Boxes className="h-4 w-4" /> Manage Inventory
          </Button>
          <Button className="rounded-lg h-12 gap-2" variant="outline">
            <Tag className="h-4 w-4" /> Create Coupon
          </Button>
          <Button className="rounded-lg h-12 gap-2" variant="outline">
            <Settings className="h-4 w-4" /> Store Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
