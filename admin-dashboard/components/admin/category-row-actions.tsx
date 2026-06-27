"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CategoryRowActions({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const remove = async () => {
    if (!confirm("Delete this category?")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Could not delete category");
        return;
      }
      toast.success("Category deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button size="sm" variant="outline" type="button" disabled={saving} onClick={remove}>
      Delete
    </Button>
  );
}
