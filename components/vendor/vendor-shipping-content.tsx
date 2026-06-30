"use client";

import { useState } from "react";
import { Truck, Package, MapPin, Clock, Plus, Trash2, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VendorProfile } from "@/types";

interface ShippingZone {
  id: string;
  name: string;
  regions: string;
  freeAbove: number | null;
  flatRate: number;
  deliveryDays: string;
  active: boolean;
}

const DEFAULT_ZONES: ShippingZone[] = [
  { id: "z1", name: "Local Delivery", regions: "Mumbai, Delhi, Bangalore, Chennai, Kolkata", freeAbove: 999, flatRate: 49, deliveryDays: "1-2", active: true },
  { id: "z2", name: "Rest of India", regions: "All other pin codes", freeAbove: 1499, flatRate: 99, deliveryDays: "3-5", active: true },
  { id: "z3", name: "Remote Areas", regions: "J&K, Northeast, Andaman", freeAbove: null, flatRate: 199, deliveryDays: "7-10", active: false },
];

type SavingId = string | null;

export function VendorShippingContent({ vendorProfile }: { vendorProfile: VendorProfile | null }) {
  const [zones, setZones] = useState<ShippingZone[]>(vendorProfile?.shippingSettings?.zones || DEFAULT_ZONES);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState<SavingId>(null);
  const [globalSettings, setGlobalSettings] = useState({
    codEnabled: vendorProfile?.shippingSettings?.codEnabled ?? true,
    prepaidEnabled: vendorProfile?.shippingSettings?.prepaidEnabled ?? true,
    expressEnabled: vendorProfile?.shippingSettings?.expressEnabled ?? false,
    processingDays: vendorProfile?.shippingSettings?.processingDays || "1",
    cutoffTime: vendorProfile?.shippingSettings?.cutoffTime || "17:00",
  });

  const [newZone, setNewZone] = useState({
    name: "",
    regions: "",
    flatRate: "49",
    freeAbove: "",
    deliveryDays: "3-5",
  });

  async function saveZone(zoneId: string) {
    setSaving(zoneId);
    
    try {
      await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...vendorProfile?.settings,
            shippingSettings: {
              ...globalSettings,
              zones
            }
          }
        })
      });
      toast.success("Zone settings saved");
    } catch {
      toast.error("Failed to save zone settings");
    }
    setSaving(null);
  }

  async function addZone() {
    if (!newZone.name.trim() || !newZone.regions.trim()) {
      toast.error("Zone name and regions are required");
      return;
    }
    setSaving("new");
    await new Promise((r) => setTimeout(r, 600));
    setZones((prev) => [
      ...prev,
      {
        id: `z${Date.now()}`,
        name: newZone.name,
        regions: newZone.regions,
        flatRate: Number(newZone.flatRate) || 49,
        freeAbove: newZone.freeAbove ? Number(newZone.freeAbove) : null,
        deliveryDays: newZone.deliveryDays,
        active: true,
      },
    ]);
    setNewZone({ name: "", regions: "", flatRate: "49", freeAbove: "", deliveryDays: "3-5" });
    setShowForm(false);
    toast.success("Shipping zone added");
    setSaving(null);
  }

  async function saveGlobal() {
    setSaving("global");
    try {
      await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...vendorProfile?.settings,
            shippingSettings: {
              ...globalSettings,
              zones
            }
          }
        })
      });
      toast.success("Shipping settings saved");
    } catch {
      toast.error("Failed to save shipping settings");
    }
    setSaving(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Shipping</h1>
        <p className="mt-0.5 text-sm text-stone-500">Configure shipping zones, rates, and delivery settings</p>
      </div>

      {/* Global Settings */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
          <Package className="h-5 w-5" /> Order Processing Settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Processing Time (days)</label>
            <Input
              type="number"
              min="0"
              value={globalSettings.processingDays}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, processingDays: e.target.value }))}
              className="rounded-xl border-stone-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Order Cutoff Time</label>
            <Input
              type="time"
              value={globalSettings.cutoffTime}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, cutoffTime: e.target.value }))}
              className="rounded-xl border-stone-200"
            />
          </div>
          <div className="space-y-3 sm:col-span-2">
            <label className="text-xs font-semibold text-stone-700">Payment Methods</label>
            <div className="flex flex-wrap gap-3">
              {([
                { key: "codEnabled", label: "Cash on Delivery" },
                { key: "prepaidEnabled", label: "Prepaid (Online)" },
                { key: "expressEnabled", label: "Express Delivery" },
              ] as { key: keyof typeof globalSettings; label: string }[]).map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 hover:bg-stone-100 transition">
                  <input
                    type="checkbox"
                    checked={Boolean(globalSettings[key])}
                    onChange={(e) => setGlobalSettings((s) => ({ ...s, [key]: e.target.checked }))}
                    className="h-4 w-4 accent-stone-900 rounded"
                  />
                  <span className="text-sm text-stone-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveGlobal} disabled={saving === "global"} className="gap-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800">
            {saving === "global" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Shipping Zones */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
            <MapPin className="h-5 w-5" /> Shipping Zones
          </h2>
          <Button
            onClick={() => setShowForm((v) => !v)}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Add Zone
          </Button>
        </div>

        {/* Add Zone Form */}
        {showForm && (
          <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">New Shipping Zone</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Zone Name *</label>
                <Input value={newZone.name} onChange={(e) => setNewZone((z) => ({ ...z, name: e.target.value }))} className="rounded-xl border-stone-200 bg-white" placeholder="e.g. Metro Cities" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Regions *</label>
                <Input value={newZone.regions} onChange={(e) => setNewZone((z) => ({ ...z, regions: e.target.value }))} className="rounded-xl border-stone-200 bg-white" placeholder="Cities or pin codes" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Flat Rate (₹)</label>
                <Input type="number" min="0" value={newZone.flatRate} onChange={(e) => setNewZone((z) => ({ ...z, flatRate: e.target.value }))} className="rounded-xl border-stone-200 bg-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Free Shipping Above (₹)</label>
                <Input type="number" min="0" value={newZone.freeAbove} onChange={(e) => setNewZone((z) => ({ ...z, freeAbove: e.target.value }))} className="rounded-xl border-stone-200 bg-white" placeholder="Leave blank to disable" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Delivery Days</label>
                <Input value={newZone.deliveryDays} onChange={(e) => setNewZone((z) => ({ ...z, deliveryDays: e.target.value }))} className="rounded-xl border-stone-200 bg-white" placeholder="e.g. 3-5" />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={addZone} disabled={saving === "new"} className="flex-1 gap-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800">
                  {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Zone Cards */}
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className={`rounded-xl border bg-white p-5 shadow-sm ${zone.active ? "border-stone-200" : "border-stone-100 opacity-60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 shrink-0">
                    <Truck className="h-5 w-5 text-stone-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">{zone.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">{zone.regions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${zone.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                    {zone.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-center">
                  <p className="text-xs text-stone-500">Flat Rate</p>
                  <p className="mt-0.5 font-bold text-stone-900">₹{zone.flatRate}</p>
                </div>
                <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-center">
                  <p className="text-xs text-stone-500">Free Above</p>
                  <p className="mt-0.5 font-bold text-stone-900">{zone.freeAbove ? `₹${zone.freeAbove}` : "—"}</p>
                </div>
                <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-center">
                  <p className="text-xs text-stone-500 flex items-center justify-center gap-1"><Clock className="h-3 w-3" />Delivery</p>
                  <p className="mt-0.5 font-bold text-stone-900">{zone.deliveryDays} days</p>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setZones((prev) => prev.filter((z) => z.id !== zone.id))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <Button
                  size="sm"
                  onClick={() => saveZone(zone.id)}
                  disabled={saving === zone.id}
                  className="h-8 rounded-xl bg-stone-900 text-white hover:bg-stone-800 gap-1.5 text-xs"
                >
                  {saving === zone.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
