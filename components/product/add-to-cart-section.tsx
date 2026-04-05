"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase/client";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/use-cart-store";
import { useAuth } from "@/hooks/use-auth";

export function AddToCartSection({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | undefined>();

  const handleUpload = async (file: File) => {
    if (!user) {
      toast.error("Please sign in to upload your custom image.");
      return;
    }

    setUploading(true);

    try {
      const storageRef = ref(firebaseStorage, `uploads/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      setCustomImageUrl(imageUrl);

      await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      toast.success("Custom image uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-sm font-medium text-slate-600">Quantity</p>
        <input
          type="number"
          min={1}
          max={10}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="mt-1 w-24 rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : customImageUrl ? "Custom image uploaded" : "Upload your custom image"}
        <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && handleUpload(event.target.files[0])} />
      </label>

      <Button
        className="w-full"
        onClick={() => {
          addItem({
            productId: product.id,
            name: product.name,
            image: product.images[0],
            price: product.price,
            quantity,
            customImageUrl,
          });
          toast.success("Added to cart");
        }}
      >
        Add To Cart
      </Button>
    </div>
  );
}
