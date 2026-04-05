"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ControlTowerSnapshot } from "@/lib/control-tower";
import { SystemEvent } from "@/types";

export function ControlTowerLive({ initialSnapshot }: { initialSnapshot: ControlTowerSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [streamConnected, setStreamConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const response = await fetch("/api/admin/control-tower/summary", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { snapshot?: ControlTowerSnapshot };

        if (!mounted || !data.snapshot) {
          return;
        }

        setSnapshot(data.snapshot);
      } catch {
        // no-op
      }
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/admin/control-tower/stream");

    source.addEventListener("ready", () => {
      setStreamConnected(true);
    });

    source.addEventListener("event", (message) => {
      try {
        const incoming = JSON.parse((message as MessageEvent<string>).data) as SystemEvent;

        setSnapshot((previous) => ({
          ...previous,
          events: [incoming, ...previous.events.filter((event) => event.id !== incoming.id)].slice(0, 60),
        }));
      } catch {
        // no-op
      }
    });

    source.addEventListener("error", () => {
      setStreamConnected(false);
    });

    return () => {
      source.close();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue (24h)" value={formatCurrency(snapshot.kpis.revenue24h)} helper="Live GMV across gateways" />
        <KpiCard label="Orders (24h)" value={String(snapshot.kpis.orders24h)} helper="All confirmed orders" />
        <KpiCard label="Payment Success" value={`${snapshot.kpis.paymentSuccessRate}%`} helper="Gateway blended rate" />
        <KpiCard label="On-Time Delivery" value={`${snapshot.kpis.onTimeDeliveryRate}%`} helper={`${snapshot.kpis.delayedShipments} delayed shipments`} />
        <KpiCard label="Low Stock Alerts" value={String(snapshot.kpis.lowStockProducts)} helper="Auto raised from reservation events" />
        <KpiCard label="Open Support Tickets" value={String(snapshot.kpis.openSupportTickets)} helper="Delivery + payment support queue" />
        <KpiCard label="Automations (24h)" value={String(snapshot.kpis.automationsTriggered24h)} helper="Rules executed end-to-end" />
        <KpiCard label="Live Stream" value={streamConnected ? "Connected" : "Reconnecting"} helper="SSE realtime channel" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Commerce Flow</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-5">
          <div className="rounded border border-slate-200 p-3">Orders</div>
          <div className="rounded border border-slate-200 p-3">Payments</div>
          <div className="rounded border border-slate-200 p-3">Delivery</div>
          <div className="rounded border border-slate-200 p-3">Inventory</div>
          <div className="rounded border border-slate-200 p-3">Customers</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gateway Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {snapshot.gatewayMetrics.map((metric) => (
              <div key={metric.provider} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-ink">{metric.provider}</p>
                  <p className="text-slate-500">
                    {metric.successful} success / {metric.failed} failed
                  </p>
                </div>
                <p className="font-semibold">{metric.successRate}%</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Module Sync Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {snapshot.moduleSync.map((module) => (
              <div key={module.module} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-ink">{module.module}</p>
                  <p className="text-slate-500">{module.lastEventAt ? formatDate(module.lastEventAt) : "No event yet"}</p>
                </div>
                <span
                  className={
                    module.status === "healthy"
                      ? "rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                      : "rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700"
                  }
                >
                  {module.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Automation Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {snapshot.rules.map((rule) => (
              <div key={rule.id} className="rounded border border-slate-200 p-3">
                <p className="font-semibold text-ink">{rule.name}</p>
                <p className="text-slate-500">{rule.description}</p>
                <p className="mt-1 text-xs text-slate-600">Trigger: {rule.triggerEvent}</p>
                <p className="mt-1 text-xs text-slate-600">Actions: {rule.actions.join(", ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Event Feed</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-2 overflow-auto text-sm">
            {snapshot.events.map((event) => (
              <div key={event.id} className="rounded border border-slate-200 p-3">
                <p className="font-medium text-ink">
                  {event.type} <span className="text-xs text-slate-500">({event.module})</span>
                </p>
                <p className="text-xs text-slate-500">{formatDate(event.createdAt)}</p>
                {event.orderId ? <p className="text-xs text-slate-600">Order: {event.orderId}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
