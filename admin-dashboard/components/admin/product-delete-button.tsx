"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();

  const remove = async () => {
    const confirmed = window.confirm("Delete this product?");

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Could not delete product");
      return;
    }

    toast.success("Product deleted");
    router.refresh();
  };

  return (
    <Button variant="destructive" onClick={remove}>
      Delete
    </Button>
  );
}
