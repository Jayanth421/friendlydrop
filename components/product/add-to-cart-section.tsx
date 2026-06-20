"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "custom-uploads");
      formData.append("record", "true");

      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          "Idempotency-Key": `upload:custom:${file.name}:${file.size}:${file.lastModified}`,
        },
        body: formData,
      });

      const uploadData = (await uploadResponse.json()) as { imageUrl?: string; error?: string };
      if (!uploadResponse.ok || !uploadData.imageUrl) {
        throw new Error(uploadData.error ?? "Upload failed");
      }

      const imageUrl = uploadData.imageUrl;

      setCustomImageUrl(imageUrl);

      toast.success("Custom image uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 border border-[#dddbdc] bg-white p-5 md:p-6">
      {product.variants?.length ? (
        <label className="block text-[12px] uppercase tracking-[0.08em] text-[#737373]">
          Variant
          <select
            className="mt-2 h-11 w-full border border-[#dddbdc] px-3 text-sm text-[#262626] outline-none focus:border-[#262626]"
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

      {colorOptions.length ? (
        <div>
          <p className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">
            Color <span className="ml-2 text-[#262626]">{selectedColor || colorOptions[0]}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={`rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.08em] ${
                  selectedColor === color
                    ? "border-[#262626] bg-[#262626] text-white"
                    : "border-[#dddbdc] text-[#737373] hover:border-[#a7a7a7]"
                }`}
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {sizeOptions.length ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">
              Size <span className="ml-2 text-[#262626]">{selectedSize || "Select"}</span>
            </p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                className={`h-11 border text-sm ${
                  selectedSize === size
                    ? "border-[#262626] bg-[#262626] text-white"
                    : "border-[#dddbdc] text-[#262626] hover:border-[#a7a7a7]"
                }`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">Quantity</p>
        <div className="mt-2 inline-flex items-center border border-[#dddbdc]">
          <button
            type="button"
            className="h-11 w-11 text-xl text-[#262626]"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={Math.max(1, Math.min(10, stock))}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            className="h-11 w-14 border-x border-[#dddbdc] text-center text-sm outline-none"
          />
          <button
            type="button"
            className="h-11 w-11 text-xl text-[#262626]"
            onClick={() => setQuantity((value) => Math.min(Math.max(1, Math.min(10, stock)), value + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-1 border-y border-[#ecebeb] py-4 text-sm">
        <p className="text-[#262626]">Unit Price: Rs. {unitPrice}</p>
        <p className={isOutOfStock ? "text-red-600" : "text-[#737373]"}>
          {isOutOfStock ? "Out of stock" : `${stock} available`}
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 border border-dashed border-[#c8c8c8] px-4 py-3 text-sm text-[#737373] transition hover:bg-[#fafafa]">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : customImageUrl ? "Custom image uploaded" : "Upload your custom image"}
        <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && handleUpload(event.target.files[0])} />
      </label>

      <Button
        disabled={isOutOfStock}
        className="h-12 w-full rounded-none bg-[#262626] text-sm font-medium uppercase tracking-[0.12em] text-white hover:bg-black"
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
