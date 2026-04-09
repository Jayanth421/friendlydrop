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
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(product.variants?.[0]?.id);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  const selectedVariant = selectedVariantId ? product.variants?.find((variant) => variant.id === selectedVariantId) : undefined;
  const colorOptions = (product.attributes?.color ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const sizeOptions = Array.from(new Set((product.variants ?? []).map((variant) => variant.size).filter(Boolean))) as string[];

  const unitPrice = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = stock <= 0;

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
          max={Math.max(1, Math.min(10, stock))}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
          className="mt-1 w-24 rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>

      {product.variants?.length ? (
        <label className="block text-sm font-medium text-slate-600">
          Variant
          <select
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {(variant.size || variant.type || variant.material || variant.sku) ?? variant.id} - Rs. {variant.price}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {sizeOptions.length ? (
        <label className="block text-sm font-medium text-slate-600">
          Size
          <select
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            value={selectedSize}
            onChange={(event) => setSelectedSize(event.target.value)}
          >
            <option value="">Select size</option>
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {colorOptions.length ? (
        <label className="block text-sm font-medium text-slate-600">
          Color
          <select
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            value={selectedColor}
            onChange={(event) => setSelectedColor(event.target.value)}
          >
            <option value="">Select color</option>
            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <p className="text-sm text-slate-600">Unit Price: Rs. {unitPrice}</p>
      <p className={`text-xs ${isOutOfStock ? "text-red-600" : "text-emerald-600"}`}>{isOutOfStock ? "Out of stock" : `${stock} available`}</p>

      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : customImageUrl ? "Custom image uploaded" : "Upload your custom image"}
        <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && handleUpload(event.target.files[0])} />
      </label>

      <Button
        disabled={isOutOfStock}
        className="w-full"
        onClick={() => {
          const quantityToAdd = Math.max(1, Math.min(quantity, stock));
          const optionSuffix = [selectedSize, selectedColor].filter(Boolean).join(" / ");
          addItem({
            productId: product.id,
            name: optionSuffix ? `${product.name} (${optionSuffix})` : product.name,
            image: product.images[0],
            price: unitPrice,
            quantity: quantityToAdd,
            variantId: selectedVariant?.id,
            customImageUrl,
          });
          toast.success("Added to cart");
        }}
      >
        {isOutOfStock ? "Out Of Stock" : "Add To Cart"}
      </Button>
    </div>
  );
}
