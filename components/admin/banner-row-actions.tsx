"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BannerRowActions({ bannerId, active }: { bannerId: string; active: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const toggleActive = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      if (!response.ok) {
        toast.error("Could not update banner");
        return;
      }

      toast.success(active ? "Banner disabled" : "Banner enabled");
      router.refresh();
    } catch {
      toast.error("Could not update banner");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this banner?")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Could not delete banner");
        return;
      }
      toast.success("Banner deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" type="button" disabled={saving} onClick={toggleActive}>
        {active ? "Disable" : "Enable"}
      </Button>
      <Button size="sm" variant="outline" type="button" disabled={saving} onClick={remove}>
        Delete
      </Button>
    </div>
  );
}
