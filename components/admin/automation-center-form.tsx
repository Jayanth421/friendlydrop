"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AutomationCenterConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function makeRuleId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

export function AutomationCenterForm({ initialConfig }: { initialConfig: AutomationCenterConfig }) {
  const [form, setForm] = useState(initialConfig);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/automation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Could not update automation");
      return;
    }

    toast.success("Automation center updated");
  };

  return (
    <Card>
      <CardHeader><CardTitle>AI & Automation Engine</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={save}>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiDemandForecastingEnabled} onChange={(event) => setForm({ ...form, aiDemandForecastingEnabled: event.target.checked })} />AI demand forecasting</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiFraudDetectionEnabled} onChange={(event) => setForm({ ...form, aiFraudDetectionEnabled: event.target.checked })} />AI fraud detection</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiSmartPricingEnabled} onChange={(event) => setForm({ ...form, aiSmartPricingEnabled: event.target.checked })} />Smart pricing</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiRecommendationsEnabled} onChange={(event) => setForm({ ...form, aiRecommendationsEnabled: event.target.checked })} />Product recommendations</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.sandboxMode} onChange={(event) => setForm({ ...form, sandboxMode: event.target.checked })} />Sandbox mode</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.abTestingEnabled} onChange={(event) => setForm({ ...form, abTestingEnabled: event.target.checked })} />A/B testing</label>
          </div>

          <div className="flex justify-between">
            <h3 className="text-sm font-semibold">Automation Rules</h3>
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() =>
                setForm({
                  ...form,
                  automationRules: [
                    ...form.automationRules,
                    {
                      id: makeRuleId(),
                      name: "New Rule",
                      enabled: true,
                      condition: "IF condition",
                      action: "THEN action",
                      priority: form.automationRules.length * 10 + 10,
                    },
                  ],
                })
              }
            >
              Add rule
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.automationRules.map((rule, index) => (
                <TableRow key={rule.id}>
                  <TableCell><input className="h-8 rounded border border-slate-200 px-2 text-xs" value={rule.name} onChange={(event) => {
                    const automationRules = [...form.automationRules];
                    automationRules[index] = { ...rule, name: event.target.value };
                    setForm({ ...form, automationRules });
                  }} /></TableCell>
                  <TableCell><input className="h-8 w-full rounded border border-slate-200 px-2 text-xs" value={rule.condition} onChange={(event) => {
                    const automationRules = [...form.automationRules];
                    automationRules[index] = { ...rule, condition: event.target.value };
                    setForm({ ...form, automationRules });
                  }} /></TableCell>
                  <TableCell><input className="h-8 w-full rounded border border-slate-200 px-2 text-xs" value={rule.action} onChange={(event) => {
                    const automationRules = [...form.automationRules];
                    automationRules[index] = { ...rule, action: event.target.value };
                    setForm({ ...form, automationRules });
                  }} /></TableCell>
                  <TableCell><input type="number" className="h-8 w-20 rounded border border-slate-200 px-2 text-xs" value={rule.priority} onChange={(event) => {
                    const automationRules = [...form.automationRules];
                    automationRules[index] = { ...rule, priority: Number(event.target.value) || 0 };
                    setForm({ ...form, automationRules });
                  }} /></TableCell>
                  <TableCell><input type="checkbox" checked={rule.enabled} onChange={(event) => {
                    const automationRules = [...form.automationRules];
                    automationRules[index] = { ...rule, enabled: event.target.checked };
                    setForm({ ...form, automationRules });
                  }} /></TableCell>
                  <TableCell><button type="button" className="text-xs text-rose-700" onClick={() => setForm({ ...form, automationRules: form.automationRules.filter((item) => item.id !== rule.id) })}>remove</button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button disabled={saving}>{saving ? "Saving..." : "Save Automation Center"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
