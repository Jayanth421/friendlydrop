
"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingCashfree, setTestingCashfree] = useState(false);
  const [cashfreeTestResult, setCashfreeTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const initialTab = useMemo(() => {
    const requested = searchParams.get("tab");
    const allowed = new Set(["delivery", "payments", "integrations", "sitebuilder", "controls"]);
    return requested && allowed.has(requested) ? requested : "delivery";
  }, [searchParams]);

  const integrationSummary = useMemo(() => {
    const providers = form.integrations.providers;
    return {
      total: providers.length,
      active: providers.filter((item) => item.healthStatus === "active").length,
      failed: providers.filter((item) => item.healthStatus === "failed").length,
    };
  }, [form.integrations.providers]);

  const testCashfreeConnection = async () => {
    setTestingCashfree(true);
    setCashfreeTestResult(null);

    try {
      const response = await fetch("/api/admin/settings/test-cashfree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: form.payments.cashfreeAppId,
          secretKey: form.payments.cashfreeSecretKey,
          isSandbox: form.payments.cashfreeSandboxMode,
        }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        setCashfreeTestResult({ success: true, message: data.message });
        toast.success("Cashfree connection test passed!");
      } else {
        setCashfreeTestResult({ success: false, message: data.error || "Connection test failed." });
        toast.error(data.error || "Cashfree connection test failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown test error";
      setCashfreeTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTestingCashfree(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const apiMessage = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "";
      const fallback = `Could not save settings (HTTP ${response.status})`;
      setError(apiMessage || fallback);
      toast.error(apiMessage || fallback);
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex flex-col gap-1">
          <span className="font-bold">Error Saving Configurations:</span>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <Tabs defaultValue={initialTab} key={initialTab}>
        <TabsList>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="sitebuilder">Site Builder</TabsTrigger>
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
                <Toggle checked={form.payments.methods.cashfree ?? false} label="Cashfree" onChange={(value) => setForm({ ...form, payments: { ...form.payments, methods: { ...form.payments.methods, cashfree: value } } })} />
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
          
          <Card>
            <CardHeader>
              <CardTitle>Cashfree Integration Credentials</CardTitle>
              <CardDescription>
                Set up Cashfree as the sole payment gateway. These credentials take priority over environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-slate-500">Cashfree App ID (Client ID)</p>
                <input 
                  className="h-9 w-full rounded border border-slate-200 px-2 text-sm" 
                  value={form.payments.cashfreeAppId ?? ""} 
                  onChange={(event) => setForm({ ...form, payments: { ...form.payments, cashfreeAppId: event.target.value } })} 
                  placeholder="e.g. TEST12345678"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Cashfree Secret Key</p>
                <input 
                  type="password"
                  className="h-9 w-full rounded border border-slate-200 px-2 text-sm" 
                  value={form.payments.cashfreeSecretKey ?? ""} 
                  onChange={(event) => setForm({ ...form, payments: { ...form.payments, cashfreeSecretKey: event.target.value } })} 
                  placeholder="e.g. cfsecret_..."
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Cashfree Webhook Secret</p>
                <input 
                  type="password"
                  className="h-9 w-full rounded border border-slate-200 px-2 text-sm" 
                  value={form.payments.cashfreeWebhookSecret ?? ""} 
                  onChange={(event) => setForm({ ...form, payments: { ...form.payments, cashfreeWebhookSecret: event.target.value } })} 
                  placeholder="e.g. cfwebhook_..."
                />
              </div>
              <div className="flex items-end">
                <Toggle 
                  checked={form.payments.cashfreeSandboxMode ?? true} 
                  label="Sandbox/Test Mode" 
                  onChange={(value) => setForm({ ...form, payments: { ...form.payments, cashfreeSandboxMode: value } })} 
                />
              </div>
              <div className="md:col-span-2 rounded bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Webhook URL: </span>
                <code>{typeof window !== "undefined" ? `${window.location.origin}/api/payments/cashfree/webhook` : "https://yourdomain.com/api/payments/cashfree/webhook"}</code>
              </div>
              <div className="md:col-span-2 flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={testingCashfree}
                    onClick={testCashfreeConnection}
                  >
                    {testingCashfree ? "Testing Connection..." : "Test Cashfree Credentials"}
                  </Button>
                  {cashfreeTestResult && (
                    <span className={`text-xs font-semibold ${cashfreeTestResult.success ? "text-emerald-600" : "text-rose-600"}`}>
                      {cashfreeTestResult.message}
                    </span>
                  )}
                </div>
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

        <TabsContent value="sitebuilder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Identity</CardTitle>
              <CardDescription>Global store identity fields for header/footer branding.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <input value={form.storeName} onChange={(event) => setForm({ ...form, storeName: event.target.value })} placeholder="Store name" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.brandPrefix ?? ""} onChange={(event) => setForm({ ...form, brandPrefix: event.target.value || undefined })} placeholder="Brand prefix (e.g. Maison)" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.logoUrl ?? ""} onChange={(event) => setForm({ ...form, logoUrl: event.target.value || undefined })} placeholder="Logo URL (https://...)" className="h-9 rounded border border-slate-200 px-2 text-sm" />
              <input value={form.loginLeftImageUrl ?? ""} onChange={(event) => setForm({ ...form, loginLeftImageUrl: event.target.value || undefined })} placeholder="Login left image URL (https://...)" className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" />
              <input value={form.brandTagline ?? ""} onChange={(event) => setForm({ ...form, brandTagline: event.target.value || undefined })} placeholder="Brand tagline" className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" />
              <input value={form.themeColor} onChange={(event) => setForm({ ...form, themeColor: event.target.value })} placeholder="Theme color" className="h-9 rounded border border-slate-200 px-2 text-sm" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu</CardTitle>
              <CardDescription>Path: Settings -&gt; Site Builder -&gt; Menu. Edit categories, popup links, images, and style.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Desktop Top Links</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setForm({
                        ...form,
                        menuEditor: {
                          ...form.menuEditor,
                          desktopLinks: [
                            ...form.menuEditor.desktopLinks,
                            {
                              id: makeId("desktop-link"),
                              label: "NEW",
                              href: "/products",
                              showMegaMenu: false,
                            },
                          ],
                        },
                      })
                    }
                  >
                    Add Link
                  </Button>
                </div>
                {form.menuEditor.desktopLinks.map((item, index) => (
                  <div key={item.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-6">
                    <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={item.label} placeholder="Label" onChange={(event) => {
                      const desktopLinks = [...form.menuEditor.desktopLinks];
                      desktopLinks[index] = { ...item, label: event.target.value };
                      setForm({ ...form, menuEditor: { ...form.menuEditor, desktopLinks } });
                    }} />
                    <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" value={item.href} placeholder="/products?section=..." onChange={(event) => {
                      const desktopLinks = [...form.menuEditor.desktopLinks];
                      desktopLinks[index] = { ...item, href: event.target.value };
                      setForm({ ...form, menuEditor: { ...form.menuEditor, desktopLinks } });
                    }} />
                    <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={item.badge ?? ""} placeholder="Badge" onChange={(event) => {
                      const desktopLinks = [...form.menuEditor.desktopLinks];
                      desktopLinks[index] = { ...item, badge: event.target.value || undefined };
                      setForm({ ...form, menuEditor: { ...form.menuEditor, desktopLinks } });
                    }} />
                    <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={item.megaMenuKey ?? ""} placeholder="Mega key (home)" onChange={(event) => {
                      const desktopLinks = [...form.menuEditor.desktopLinks];
                      desktopLinks[index] = { ...item, megaMenuKey: event.target.value || undefined };
                      setForm({ ...form, menuEditor: { ...form.menuEditor, desktopLinks } });
                    }} />
                    <div className="flex items-center justify-between text-xs">
                      <Toggle checked={Boolean(item.showMegaMenu)} label="popup" onChange={(value) => {
                        const desktopLinks = [...form.menuEditor.desktopLinks];
                        desktopLinks[index] = { ...item, showMegaMenu: value };
                        setForm({ ...form, menuEditor: { ...form.menuEditor, desktopLinks } });
                      }} />
                      <button
                        type="button"
                        className="text-rose-600"
                        onClick={() =>
                          setForm({
                            ...form,
                            menuEditor: {
                              ...form.menuEditor,
                              desktopLinks: form.menuEditor.desktopLinks.filter((row) => row.id !== item.id),
                            },
                          })
                        }
                      >
                        remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Mega Popup Menus</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setForm({
                        ...form,
                        menuEditor: {
                          ...form.menuEditor,
                          megaMenus: [
                            ...form.menuEditor.megaMenus,
                            {
                              id: makeId("mega"),
                              key: "new-menu",
                              title: "New Menu",
                              columns: [
                                {
                                  id: makeId("col"),
                                  heading: "Column",
                                  links: [{ id: makeId("menu-link"), label: "Link 1", href: "/products" }],
                                },
                              ],
                            },
                          ],
                        },
                      })
                    }
                  >
                    Add Mega Menu
                  </Button>
                </div>

                {form.menuEditor.megaMenus.map((menu, menuIndex) => (
                  <div key={menu.id} className="space-y-2 rounded border border-slate-200 p-3">
                    <div className="grid gap-2 md:grid-cols-4">
                      <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={menu.title} placeholder="Title" onChange={(event) => {
                        const megaMenus = [...form.menuEditor.megaMenus];
                        megaMenus[menuIndex] = { ...menu, title: event.target.value };
                        setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                      }} />
                      <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={menu.key} placeholder="Key (home)" onChange={(event) => {
                        const megaMenus = [...form.menuEditor.megaMenus];
                        megaMenus[menuIndex] = { ...menu, key: event.target.value };
                        setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                      }} />
                      <div className="md:col-span-2 flex items-center justify-end">
                        <button
                          type="button"
                          className="text-xs text-rose-600"
                          onClick={() =>
                            setForm({
                              ...form,
                              menuEditor: { ...form.menuEditor, megaMenus: form.menuEditor.megaMenus.filter((item) => item.id !== menu.id) },
                            })
                          }
                        >
                          remove mega menu
                        </button>
                      </div>
                    </div>

                    {menu.columns.map((column, columnIndex) => (
                      <div key={column.id} className="space-y-2 rounded border border-slate-200 p-2">
                        <div className="grid gap-2 md:grid-cols-4">
                          <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={column.heading} placeholder="Column heading" onChange={(event) => {
                            const megaMenus = [...form.menuEditor.megaMenus];
                            const columns = [...menu.columns];
                            columns[columnIndex] = { ...column, heading: event.target.value };
                            megaMenus[menuIndex] = { ...menu, columns };
                            setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                          }} />
                          <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={column.imageUrl ?? ""} placeholder="Category image URL" onChange={(event) => {
                            const megaMenus = [...form.menuEditor.megaMenus];
                            const columns = [...menu.columns];
                            columns[columnIndex] = { ...column, imageUrl: event.target.value || undefined };
                            megaMenus[menuIndex] = { ...menu, columns };
                            setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                          }} />
                          <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={column.ctaLabel ?? ""} placeholder="CTA label" onChange={(event) => {
                            const megaMenus = [...form.menuEditor.megaMenus];
                            const columns = [...menu.columns];
                            columns[columnIndex] = { ...column, ctaLabel: event.target.value || undefined };
                            megaMenus[menuIndex] = { ...menu, columns };
                            setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                          }} />
                          <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={column.ctaHref ?? ""} placeholder="CTA link" onChange={(event) => {
                            const megaMenus = [...form.menuEditor.megaMenus];
                            const columns = [...menu.columns];
                            columns[columnIndex] = { ...column, ctaHref: event.target.value || undefined };
                            megaMenus[menuIndex] = { ...menu, columns };
                            setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                          }} />
                        </div>

                        <div className="space-y-2 rounded border border-slate-200 p-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Column Links</p>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                const megaMenus = [...form.menuEditor.megaMenus];
                                const columns = [...menu.columns];
                                columns[columnIndex] = {
                                  ...column,
                                  links: [...column.links, { id: makeId("menu-link"), label: "New Link", href: "/products" }],
                                };
                                megaMenus[menuIndex] = { ...menu, columns };
                                setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                              }}
                            >
                              Add Link
                            </Button>
                          </div>
                          {column.links.map((menuLink, linkIndex) => (
                            <div key={menuLink.id} className="grid gap-2 md:grid-cols-5">
                              <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={menuLink.label} placeholder="Link label" onChange={(event) => {
                                const megaMenus = [...form.menuEditor.megaMenus];
                                const columns = [...menu.columns];
                                const links = [...column.links];
                                links[linkIndex] = { ...menuLink, label: event.target.value };
                                columns[columnIndex] = { ...column, links };
                                megaMenus[menuIndex] = { ...menu, columns };
                                setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                              }} />
                              <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" value={menuLink.href} placeholder="/products?category=..." onChange={(event) => {
                                const megaMenus = [...form.menuEditor.megaMenus];
                                const columns = [...menu.columns];
                                const links = [...column.links];
                                links[linkIndex] = { ...menuLink, href: event.target.value };
                                columns[columnIndex] = { ...column, links };
                                megaMenus[menuIndex] = { ...menu, columns };
                                setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                              }} />
                              <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={menuLink.badge ?? ""} placeholder="Badge" onChange={(event) => {
                                const megaMenus = [...form.menuEditor.megaMenus];
                                const columns = [...menu.columns];
                                const links = [...column.links];
                                links[linkIndex] = { ...menuLink, badge: event.target.value || undefined };
                                columns[columnIndex] = { ...column, links };
                                megaMenus[menuIndex] = { ...menu, columns };
                                setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                              }} />
                              <button
                                type="button"
                                className="text-xs text-rose-600"
                                onClick={() => {
                                  const megaMenus = [...form.menuEditor.megaMenus];
                                  const columns = [...menu.columns];
                                  columns[columnIndex] = {
                                    ...column,
                                    links: column.links.filter((row) => row.id !== menuLink.id),
                                  };
                                  megaMenus[menuIndex] = { ...menu, columns };
                                  setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                                }}
                              >
                                remove link
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-start justify-end">
                          <button
                            type="button"
                            className="text-xs text-rose-600"
                            onClick={() => {
                              const megaMenus = [...form.menuEditor.megaMenus];
                              const columns = menu.columns.filter((row) => row.id !== column.id);
                              megaMenus[menuIndex] = { ...menu, columns };
                              setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                            }}
                          >
                            remove column
                          </button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const megaMenus = [...form.menuEditor.megaMenus];
                        megaMenus[menuIndex] = {
                          ...menu,
                          columns: [...menu.columns, { id: makeId("col"), heading: "New Column", links: [] }],
                        };
                        setForm({ ...form, menuEditor: { ...form.menuEditor, megaMenus } });
                      }}
                    >
                      Add Column
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Popup Style / Animation / Promo Card</p>
                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs text-slate-500">Popup width px</p>
                    <NumberInput value={form.menuEditor.popupStyle.widthPx} min={480} max={2600} onChange={(value) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, widthPx: value } } })} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-500">Max columns</p>
                    <NumberInput value={form.menuEditor.popupStyle.maxColumns} min={1} max={8} onChange={(value) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, maxColumns: value } } })} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-500">Border radius px</p>
                    <NumberInput value={form.menuEditor.popupStyle.borderRadiusPx} min={0} max={40} onChange={(value) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, borderRadiusPx: value } } })} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-500">Animation</p>
                    <select className="h-9 w-full rounded border border-slate-200 px-2 text-sm" value={form.menuEditor.popupStyle.animation} onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, animation: event.target.value as "none" | "fade" | "slide" } } })}>
                      <option value="none">none</option>
                      <option value="fade">fade</option>
                      <option value="slide">slide</option>
                    </select>
                  </div>
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.menuEditor.popupStyle.backgroundColor} placeholder="Background color" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, backgroundColor: event.target.value } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.menuEditor.popupStyle.textColor} placeholder="Text color" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, textColor: event.target.value } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.menuEditor.popupStyle.headingColor} placeholder="Heading color" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, headingColor: event.target.value } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.menuEditor.popupStyle.cardBackgroundColor} placeholder="Column card background" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, cardBackgroundColor: event.target.value } } })} />
                  <Toggle checked={form.menuEditor.popupStyle.showPromoCard} label="Show promo image card" onChange={(value) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, showPromoCard: value } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" value={form.menuEditor.popupStyle.promoImageUrl ?? ""} placeholder="Promo image URL" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, promoImageUrl: event.target.value } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.menuEditor.popupStyle.promoTitle ?? ""} placeholder="Promo title" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, promoTitle: event.target.value } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" value={form.menuEditor.popupStyle.promoText ?? ""} placeholder="Promo text" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, promoText: event.target.value } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.menuEditor.popupStyle.promoCtaLabel ?? ""} placeholder="Promo CTA label" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, promoCtaLabel: event.target.value || undefined } } })} />
                  <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" value={form.menuEditor.popupStyle.promoCtaHref ?? ""} placeholder="Promo CTA link" onChange={(event) => setForm({ ...form, menuEditor: { ...form.menuEditor, popupStyle: { ...form.menuEditor.popupStyle, promoCtaHref: event.target.value || undefined } } })} />
                </div>
              </div>
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
              <input value={form.loginLeftImageUrl ?? ""} onChange={(event) => setForm({ ...form, loginLeftImageUrl: event.target.value || undefined })} placeholder="Login left image URL (https://...)" className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" />
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
