
"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { StoreSettings } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function csvToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToCsv(values?: string[]) {
  return (values ?? []).join(", ");
}

function healthClass(status: string) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-rose-50 text-rose-700";
  if (status === "disabled") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4" />
      {label}
    </label>
  );
}

function NumberInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      onChange={(event) => onChange(Number(event.target.value) || 0)}
      className="h-9 rounded border border-slate-200 px-2 text-sm"
    />
  );
}

export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);

  const integrationSummary = useMemo(() => {
    const providers = form.integrations.providers;
    return {
      total: providers.length,
      active: providers.filter((item) => item.healthStatus === "active").length,
      failed: providers.filter((item) => item.healthStatus === "failed").length,
    };
  }, [form.integrations.providers]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      toast.error(payload.error ?? "Could not save settings");
      return;
    }

    toast.success("Settings saved and synced");
  };

  return (
    <form className="space-y-4" onSubmit={save}>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Admin Management Control Hub</CardTitle>
            <CardDescription>Delivery rules, payment controls, API integrations, and operational toggles with real-time effect.</CardDescription>
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </CardHeader>
      </Card>

      <Tabs defaultValue="delivery">
        <TabsList>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Charges & Free Delivery Rules</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Toggle checked={form.delivery.enabled} label="Delivery enabled" onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, enabled: value } })} />
              <Toggle checked={form.delivery.expressEnabled} label="Express enabled" onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, expressEnabled: value } })} />
              <Toggle checked={form.delivery.sameDayEnabled} label="Same-day enabled" onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, sameDayEnabled: value } })} />
              <div>
                <p className="mb-1 text-xs text-slate-500">Base fee</p>
                <NumberInput value={form.delivery.baseFee} min={0} onChange={(value) => setForm({ ...form, deliveryFee: value, delivery: { ...form.delivery, baseFee: value } })} />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Express surcharge</p>
                <NumberInput value={form.delivery.expressSurcharge} min={0} onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, expressSurcharge: value } })} />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Same-day surcharge</p>
                <NumberInput value={form.delivery.sameDaySurcharge} min={0} onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, sameDaySurcharge: value } })} />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Max radius (km)</p>
                <NumberInput value={form.delivery.maxRadiusKm} min={1} onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, maxRadiusKm: value } })} />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">SLA standard (hours)</p>
                <NumberInput value={form.delivery.slaStandardHours} min={1} onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, slaStandardHours: value } })} />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">SLA express (hours)</p>
                <NumberInput value={form.delivery.slaExpressHours} min={1} onChange={(value) => setForm({ ...form, delivery: { ...form.delivery, slaExpressHours: value } })} />
              </div>
              <label className="md:col-span-3">
                <p className="mb-1 text-xs text-slate-500">Blocked pincodes (comma separated)</p>
                <input className="h-9 w-full rounded border border-slate-200 px-2 text-sm" value={listToCsv(form.delivery.blockedPincodes)} onChange={(event) => setForm({ ...form, delivery: { ...form.delivery, blockedPincodes: csvToList(event.target.value) } })} />
              </label>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle>Zones</CardTitle>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setForm({
                    ...form,
                    delivery: {
                      ...form.delivery,
                      zones: [
                        ...form.delivery.zones,
                        { id: makeId("zone"), name: "New Zone", type: "local", enabled: true, baseFee: 0, expressSurcharge: 0, cities: [], pincodePrefixes: [] },
                      ],
                    },
                  })
                }
              >
                Add Zone
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {form.delivery.zones.map((zone, index) => (
                <div key={zone.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-7">
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={zone.name} onChange={(event) => {
                    const zones = [...form.delivery.zones];
                    zones[index] = { ...zone, name: event.target.value };
                    setForm({ ...form, delivery: { ...form.delivery, zones } });
                  }} />
                  <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={zone.type} onChange={(event) => {
                    const zones = [...form.delivery.zones];
                    zones[index] = { ...zone, type: event.target.value as typeof zone.type };
                    setForm({ ...form, delivery: { ...form.delivery, zones } });
                  }}>
                    <option value="local">local</option>
                    <option value="regional">regional</option>
                    <option value="national">national</option>
                  </select>
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Pincode prefixes" value={listToCsv(zone.pincodePrefixes)} onChange={(event) => {
                    const zones = [...form.delivery.zones];
                    zones[index] = { ...zone, pincodePrefixes: csvToList(event.target.value) };
                    setForm({ ...form, delivery: { ...form.delivery, zones } });
                  }} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Cities" value={listToCsv(zone.cities)} onChange={(event) => {
                    const zones = [...form.delivery.zones];
                    zones[index] = { ...zone, cities: csvToList(event.target.value) };
                    setForm({ ...form, delivery: { ...form.delivery, zones } });
                  }} />
                  <NumberInput value={zone.baseFee} min={0} onChange={(value) => {
                    const zones = [...form.delivery.zones];
                    zones[index] = { ...zone, baseFee: value };
                    setForm({ ...form, delivery: { ...form.delivery, zones } });
                  }} />
                  <NumberInput value={zone.expressSurcharge} min={0} onChange={(value) => {
                    const zones = [...form.delivery.zones];
                    zones[index] = { ...zone, expressSurcharge: value };
                    setForm({ ...form, delivery: { ...form.delivery, zones } });
                  }} />
                  <div className="flex items-center justify-between text-xs">
                    <Toggle checked={zone.enabled} label="enabled" onChange={(value) => {
                      const zones = [...form.delivery.zones];
                      zones[index] = { ...zone, enabled: value };
                      setForm({ ...form, delivery: { ...form.delivery, zones } });
                    }} />
                    <button type="button" className="text-rose-600" onClick={() => setForm({ ...form, delivery: { ...form.delivery, zones: form.delivery.zones.filter((item) => item.id !== zone.id) } })}>remove</button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle>Pricing & Free Delivery Rules</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setForm({ ...form, delivery: { ...form.delivery, pricingRules: [...form.delivery.pricingRules, { id: makeId("rule"), name: "New Rule", enabled: true, priority: 10, speed: "standard", flatFee: 0, perKmFee: 0 }] } })}>Add Pricing Rule</Button>
                <Button type="button" variant="secondary" onClick={() => setForm({ ...form, delivery: { ...form.delivery, freeDeliveryRules: [...form.delivery.freeDeliveryRules, { id: makeId("free"), name: "New Free Rule", enabled: true, minOrderValue: 0 }] } })}>Add Free Rule</Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Pricing Rules</p>
                {form.delivery.pricingRules.map((rule, index) => (
                  <div key={rule.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-3">
                    <input className="h-8 rounded border border-slate-200 px-2 text-xs md:col-span-3" value={rule.name} onChange={(event) => {
                      const pricingRules = [...form.delivery.pricingRules];
                      pricingRules[index] = { ...rule, name: event.target.value };
                      setForm({ ...form, delivery: { ...form.delivery, pricingRules } });
                    }} />
                    <select className="h-8 rounded border border-slate-200 px-2 text-xs" value={rule.speed ?? "standard"} onChange={(event) => {
                      const pricingRules = [...form.delivery.pricingRules];
                      pricingRules[index] = { ...rule, speed: event.target.value as typeof rule.speed };
                      setForm({ ...form, delivery: { ...form.delivery, pricingRules } });
                    }}>
                      <option value="standard">standard</option>
                      <option value="express">express</option>
                      <option value="same_day">same day</option>
                    </select>
                    <NumberInput value={rule.flatFee} min={0} onChange={(value) => {
                      const pricingRules = [...form.delivery.pricingRules];
                      pricingRules[index] = { ...rule, flatFee: value };
                      setForm({ ...form, delivery: { ...form.delivery, pricingRules } });
                    }} />
                    <NumberInput value={rule.perKmFee} min={0} onChange={(value) => {
                      const pricingRules = [...form.delivery.pricingRules];
                      pricingRules[index] = { ...rule, perKmFee: value };
                      setForm({ ...form, delivery: { ...form.delivery, pricingRules } });
                    }} />
                    <div className="md:col-span-3 flex items-center justify-between text-xs">
                      <Toggle checked={rule.enabled} label="enabled" onChange={(value) => {
                        const pricingRules = [...form.delivery.pricingRules];
                        pricingRules[index] = { ...rule, enabled: value };
                        setForm({ ...form, delivery: { ...form.delivery, pricingRules } });
                      }} />
                      <button type="button" className="text-rose-600" onClick={() => setForm({ ...form, delivery: { ...form.delivery, pricingRules: form.delivery.pricingRules.filter((item) => item.id !== rule.id) } })}>remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Free Delivery Rules</p>
                {form.delivery.freeDeliveryRules.map((rule, index) => (
                  <div key={rule.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-2">
                    <input className="h-8 rounded border border-slate-200 px-2 text-xs md:col-span-2" value={rule.name} onChange={(event) => {
                      const freeDeliveryRules = [...form.delivery.freeDeliveryRules];
                      freeDeliveryRules[index] = { ...rule, name: event.target.value };
                      setForm({ ...form, delivery: { ...form.delivery, freeDeliveryRules } });
                    }} />
                    <NumberInput value={rule.minOrderValue ?? 0} min={0} onChange={(value) => {
                      const freeDeliveryRules = [...form.delivery.freeDeliveryRules];
                      freeDeliveryRules[index] = { ...rule, minOrderValue: value };
                      setForm({ ...form, delivery: { ...form.delivery, freeDeliveryRules } });
                    }} />
                    <input className="h-8 rounded border border-slate-200 px-2 text-xs" placeholder="segments: new,vip" value={listToCsv(rule.customerSegments)} onChange={(event) => {
                      const freeDeliveryRules = [...form.delivery.freeDeliveryRules];
                      freeDeliveryRules[index] = { ...rule, customerSegments: csvToList(event.target.value).filter((item): item is "new" | "repeat" | "vip" => ["new", "repeat", "vip"].includes(item)) };
                      setForm({ ...form, delivery: { ...form.delivery, freeDeliveryRules } });
                    }} />
                    <div className="md:col-span-2 flex items-center justify-between text-xs">
                      <div className="flex gap-4">
                        <Toggle checked={rule.enabled} label="enabled" onChange={(value) => {
                          const freeDeliveryRules = [...form.delivery.freeDeliveryRules];
                          freeDeliveryRules[index] = { ...rule, enabled: value };
                          setForm({ ...form, delivery: { ...form.delivery, freeDeliveryRules } });
                        }} />
                        <Toggle checked={rule.firstOrderOnly ?? false} label="first order" onChange={(value) => {
                          const freeDeliveryRules = [...form.delivery.freeDeliveryRules];
                          freeDeliveryRules[index] = { ...rule, firstOrderOnly: value };
                          setForm({ ...form, delivery: { ...form.delivery, freeDeliveryRules } });
                        }} />
                      </div>
                      <button type="button" className="text-rose-600" onClick={() => setForm({ ...form, delivery: { ...form.delivery, freeDeliveryRules: form.delivery.freeDeliveryRules.filter((item) => item.id !== rule.id) } })}>remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Systems & Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-4">
                <Toggle checked={form.payments.systemEnabled} label="Payment system enabled" onChange={(value) => setForm({ ...form, payments: { ...form.payments, systemEnabled: value } })} />
                <Toggle checked={form.payments.methods.razorpay} label="Razorpay" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, razorpay: value } } })} />
                <Toggle checked={form.payments.methods.stripe} label="Stripe" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, stripe: value } } })} />
                <Toggle checked={form.payments.methods.cod} label="COD" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, cod: value } } })} />
                <Toggle checked={form.payments.methods.upi} label="UPI" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, upi: value } } })} />
                <Toggle checked={form.payments.methods.cards} label="Cards" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, cards: value } } })} />
                <Toggle checked={form.payments.methods.netBanking} label="Net banking" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, netBanking: value } } })} />
                <Toggle checked={form.payments.methods.wallet} label="Wallet" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, wallet: value } } })} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div><p className="mb-1 text-xs text-slate-500">Min order value</p><NumberInput value={form.payments.rules.minOrderValue} min={0} onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, minOrderValue: value } } })} /></div>
                <div><p className="mb-1 text-xs text-slate-500">Max order value</p><NumberInput value={form.payments.rules.maxOrderValue} min={0} onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, maxOrderValue: value } } })} /></div>
                <div><p className="mb-1 text-xs text-slate-500">COD max value</p><NumberInput value={form.payments.rules.codMaxOrderValue} min={0} onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, codMaxOrderValue: value } } })} /></div>
                <label className="md:col-span-3"><p className="mb-1 text-xs text-slate-500">COD blocked pincodes</p><input className="h-9 w-full rounded border border-slate-200 px-2 text-sm" value={listToCsv(form.payments.rules.codBlockedPincodes)} onChange={(event) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, codBlockedPincodes: csvToList(event.target.value) } } })} /></label>
                <Toggle checked={form.payments.rules.retryEnabled} label="Retry enabled" onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, retryEnabled: value } } })} />
                <div><p className="mb-1 text-xs text-slate-500">Max retries</p><NumberInput value={form.payments.rules.maxRetries} min={0} max={10} onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, maxRetries: value } } })} /></div>
                <Toggle checked={form.payments.rules.smartFallbackEnabled} label="Smart fallback" onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, smartFallbackEnabled: value } } })} />
                <Toggle checked={form.payments.rules.autoRefundOnReturnApproval} label="Auto refund on approval" onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, autoRefundOnReturnApproval: value } } })} />
                <Toggle checked={form.payments.rules.partialRefundsEnabled} label="Partial refunds" onChange={(value) => setForm({ ...form, payments: { ...form.payments, rules: { ...form.payments.rules, partialRefundsEnabled: value } } })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>API Keys & Provider Health</CardTitle>
                <CardDescription>{integrationSummary.active} active / {integrationSummary.failed} failed / {integrationSummary.total} total</CardDescription>
              </div>
              <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.integrations.defaultMode} onChange={(event) => setForm({ ...form, integrations: { ...form.integrations, defaultMode: event.target.value as "test" | "live" } })}>
                <option value="test">test</option>
                <option value="live">live</option>
              </select>
            </CardHeader>
            <CardContent className="space-y-2">
              {form.integrations.providers.map((provider, index) => (
                <div key={provider.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-8">
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={provider.name} onChange={(event) => {
                    const providers = [...form.integrations.providers];
                    providers[index] = { ...provider, name: event.target.value };
                    setForm({ ...form, integrations: { ...form.integrations, providers } });
                  }} />
                  <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={provider.type} onChange={(event) => {
                    const providers = [...form.integrations.providers];
                    providers[index] = { ...provider, type: event.target.value as typeof provider.type };
                    setForm({ ...form, integrations: { ...form.integrations, providers } });
                  }}>
                    <option value="payment">payment</option>
                    <option value="shipping">shipping</option>
                    <option value="notification">notification</option>
                    <option value="analytics">analytics</option>
                    <option value="other">other</option>
                  </select>
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="KEY ENV" value={provider.keyRef} onChange={(event) => {
                    const providers = [...form.integrations.providers];
                    providers[index] = { ...provider, keyRef: event.target.value };
                    setForm({ ...form, integrations: { ...form.integrations, providers } });
                  }} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="SECRET ENV" value={provider.secretRef ?? ""} onChange={(event) => {
                    const providers = [...form.integrations.providers];
                    providers[index] = { ...provider, secretRef: event.target.value || undefined };
                    setForm({ ...form, integrations: { ...form.integrations, providers } });
                  }} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Endpoint" value={provider.endpoint ?? ""} onChange={(event) => {
                    const providers = [...form.integrations.providers];
                    providers[index] = { ...provider, endpoint: event.target.value || undefined };
                    setForm({ ...form, integrations: { ...form.integrations, providers } });
                  }} />
                  <Toggle checked={provider.enabled} label="enabled" onChange={(value) => {
                    const providers = [...form.integrations.providers];
                    providers[index] = { ...provider, enabled: value };
                    setForm({ ...form, integrations: { ...form.integrations, providers } });
                  }} />
                  <span className={`flex h-9 items-center justify-center rounded text-xs font-medium ${healthClass(provider.healthStatus)}`}>{provider.healthStatus}</span>
                  <button type="button" className="text-xs text-rose-600" onClick={() => setForm({ ...form, integrations: { ...form.integrations, providers: form.integrations.providers.filter((item) => item.id !== provider.id) } })}>remove</button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => setForm({ ...form, integrations: { ...form.integrations, providers: [...form.integrations.providers, { id: makeId("provider"), name: "New Provider", type: "other", enabled: false, mode: form.integrations.defaultMode, keyRef: "", healthStatus: "unknown" }] } })}>Add Provider</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {form.integrations.webhooks.map((webhook, index) => (
                <div key={webhook.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-6">
                  <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={webhook.event} onChange={(event) => {
                    const webhooks = [...form.integrations.webhooks];
                    webhooks[index] = { ...webhook, event: event.target.value as typeof webhook.event };
                    setForm({ ...form, integrations: { ...form.integrations, webhooks } });
                  }}>
                    <option value="payment_success">payment_success</option>
                    <option value="order_updated">order_updated</option>
                    <option value="delivery_updated">delivery_updated</option>
                  </select>
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" value={webhook.url} placeholder="Webhook URL" onChange={(event) => {
                    const webhooks = [...form.integrations.webhooks];
                    webhooks[index] = { ...webhook, url: event.target.value };
                    setForm({ ...form, integrations: { ...form.integrations, webhooks } });
                  }} />
                  <Toggle checked={webhook.enabled} label="enabled" onChange={(value) => {
                    const webhooks = [...form.integrations.webhooks];
                    webhooks[index] = { ...webhook, enabled: value };
                    setForm({ ...form, integrations: { ...form.integrations, webhooks } });
                  }} />
                  <Toggle checked={webhook.retryFailed} label="retry failed" onChange={(value) => {
                    const webhooks = [...form.integrations.webhooks];
                    webhooks[index] = { ...webhook, retryFailed: value };
                    setForm({ ...form, integrations: { ...form.integrations, webhooks } });
                  }} />
                  <div className="flex items-center gap-2">
                    <NumberInput value={webhook.maxRetries} min={0} max={10} onChange={(value) => {
                      const webhooks = [...form.integrations.webhooks];
                      webhooks[index] = { ...webhook, maxRetries: value };
                      setForm({ ...form, integrations: { ...form.integrations, webhooks } });
                    }} />
                    <button type="button" className="text-xs text-rose-600" onClick={() => setForm({ ...form, integrations: { ...form.integrations, webhooks: form.integrations.webhooks.filter((item) => item.id !== webhook.id) } })}>remove</button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => setForm({ ...form, integrations: { ...form.integrations, webhooks: [...form.integrations.webhooks, { id: makeId("webhook"), event: "order_updated", enabled: false, retryFailed: true, maxRetries: 3, lastStatus: "idle", url: "" }] } })}>Add Webhook</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Operational Toggles</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Toggle checked={form.operations.maintenanceMode} label="Maintenance mode" onChange={(value) => setForm({ ...form, operations: { ...form.operations, maintenanceMode: value } })} />
              <Toggle checked={form.operations.checkoutEnabled} label="Checkout enabled" onChange={(value) => setForm({ ...form, operations: { ...form.operations, checkoutEnabled: value } })} />
              <Toggle checked={form.operations.taxEnabled} label="GST enabled" onChange={(value) => setForm({ ...form, operations: { ...form.operations, taxEnabled: value } })} />
              <Toggle checked={form.operations.autoOrderConfirm} label="Auto order confirm" onChange={(value) => setForm({ ...form, operations: { ...form.operations, autoOrderConfirm: value } })} />
              <Toggle checked={form.operations.autoDeliveryAssignment} label="Auto delivery assignment" onChange={(value) => setForm({ ...form, operations: { ...form.operations, autoDeliveryAssignment: value } })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Store Defaults & Alerts</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <input value={form.storeName} onChange={(event) => setForm({ ...form, storeName: event.target.value })} placeholder="Store name" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.brandPrefix ?? ""} onChange={(event) => setForm({ ...form, brandPrefix: event.target.value || undefined })} placeholder="Brand prefix (e.g. Maison)" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.logoUrl ?? ""} onChange={(event) => setForm({ ...form, logoUrl: event.target.value || undefined })} placeholder="Logo URL (https://...)" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.supportEmail} onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} placeholder="Support email" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.supportPhone} onChange={(event) => setForm({ ...form, supportPhone: event.target.value })} placeholder="Support phone" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.brandTagline ?? ""} onChange={(event) => setForm({ ...form, brandTagline: event.target.value || undefined })} placeholder="Brand tagline" className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" />
              <input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} placeholder="Currency" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.themeColor} onChange={(event) => setForm({ ...form, themeColor: event.target.value })} placeholder="Theme color" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <div><p className="mb-1 text-xs text-slate-500">GST rate %</p><NumberInput value={form.taxRate} min={0} max={100} onChange={(value) => setForm({ ...form, taxRate: value })} /></div>
              <div><p className="mb-1 text-xs text-slate-500">Payment failure alert %</p><NumberInput value={form.alerts.paymentFailureRateThreshold} min={1} max={100} onChange={(value) => setForm({ ...form, alerts: { ...form.alerts, paymentFailureRateThreshold: value } })} /></div>
              <div><p className="mb-1 text-xs text-slate-500">Delivery delay alert %</p><NumberInput value={form.alerts.deliveryDelayThreshold} min={1} max={100} onChange={(value) => setForm({ ...form, alerts: { ...form.alerts, deliveryDelayThreshold: value } })} /></div>
              <div><p className="mb-1 text-xs text-slate-500">API latency alert ms</p><NumberInput value={form.alerts.apiLatencyThresholdMs} min={100} max={60000} onChange={(value) => setForm({ ...form, alerts: { ...form.alerts, apiLatencyThresholdMs: value } })} /></div>
              <div><p className="mb-1 text-xs text-slate-500">Refund rate alert %</p><NumberInput value={form.alerts.refundRateThreshold} min={1} max={100} onChange={(value) => setForm({ ...form, alerts: { ...form.alerts, refundRateThreshold: value } })} /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </div>
    </form>
  );
}
