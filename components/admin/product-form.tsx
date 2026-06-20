"use client";

import { DragEvent, useMemo, useState } from "react";
import {
  GripVertical,
  Upload,
  X,
  Sparkles,
  Info,
  DollarSign,
  Boxes,
  Image as ImageIcon,
  Search,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ProductVariant, SeoMeta } from "@/types";
import { normalizeMediaReference, resolveMediaUrl } from "@/lib/media";
import { createSlug } from "@/lib/utils";

interface ProductFormValues {
  id?: string;
  name: string;
  subtitle?: string;
  shortDescription?: string;
  description: string;
  price: number;
  costPrice?: number;
  taxRate?: number;
  primaryImage?: string;
  images: string[];
  videoUrl?: string;
  category: string;
  subcategory?: string;
  stock: number;
  lowStockThreshold?: number;
  sku?: string;
  brand?: string;
  discountPercent?: number;
  weightGrams?: number;
  dimensions?: {
    widthCm?: number;
    heightCm?: number;
    depthCm?: number;
  };
  tags?: string[];
  badges?: string[];
  deliveryTime?: string;
  shippingInfo?: string;
  trustBadges?: string[];
  benefits?: string[];
  ingredients?: string[];
  usageInstructions?: string[];
  routineProductIds?: string[];
  comboProductIds?: string[];
  frequentlyBoughtTogetherIds?: string[];
  variants?: ProductVariant[];
  featured?: boolean;
  recommended?: boolean;
  popularity?: number;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "private";
  seo?: SeoMeta;
}

function emptyVariant(index: number): ProductVariant {
  return {
    id: `variant-${Date.now()}-${index}`,
    size: "",
    color: "",
    type: "",
    material: "",
    sku: "",
    price: 0,
    stock: 0,
  };
}

export function ProductForm({ defaultValues }: { defaultValues?: ProductFormValues }) {
  const [form, setForm] = useState<ProductFormValues>(
    defaultValues ?? {
      name: "",
      subtitle: "",
      shortDescription: "",
      description: "",
      price: 499,
      costPrice: 200,
      taxRate: 18,
      primaryImage: "",
      images: [],
      videoUrl: "",
      category: "photo-prints",
      subcategory: "",
      stock: 20,
      lowStockThreshold: 5,
      sku: "",
      brand: "",
      discountPercent: 0,
      weightGrams: 200,
      dimensions: { widthCm: 10, heightCm: 15, depthCm: 1 },
      tags: [],
      badges: [],
      deliveryTime: "",
      shippingInfo: "",
      trustBadges: [],
      benefits: [],
      ingredients: [],
      usageInstructions: [],
      routineProductIds: [],
      comboProductIds: [],
      frequentlyBoughtTogetherIds: [],
      variants: [],
      featured: true,
      recommended: false,
      popularity: 80,
      status: "published",
      visibility: "public",
      seo: { metaTitle: "", metaDescription: "", imageAlt: "", canonicalUrl: "", keywords: [] },
    },
  );
  const [manualMediaRef, setManualMediaRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [draggingImageIndex, setDraggingImageIndex] = useState<number | null>(null);

  // Dynamic Slug Preview
  const slugPreview = useMemo(() => {
    return createSlug(form.name || "example-product");
  }, [form.name]);

  // Pricing calculations
  const profitMetrics = useMemo(() => {
    const price = Number(form.price || 0);
    const cost = Number(form.costPrice || 0);
    const discount = Number(form.discountPercent || 0);
    
    const salePrice = price * (1 - discount / 100);
    const profit = salePrice - cost;
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

    return {
      salePrice: Math.round(salePrice),
      profit: Math.round(profit),
      margin: Math.round(margin * 100) / 100,
    };
  }, [form.price, form.costPrice, form.discountPercent]);

  const galleryImages = useMemo(() => {
    const normalized = form.images.map((item) => normalizeMediaReference(item)).filter(Boolean) as string[];
    if (!form.primaryImage || !normalized.includes(form.primaryImage)) {
      return normalized;
    }

    const withoutPrimary = normalized.filter((item) => item !== form.primaryImage);
    return [form.primaryImage, ...withoutPrimary];
  }, [form.images, form.primaryImage]);

  const setPrimaryImage = (image: string) => {
    setForm((prev) => ({
      ...prev,
      primaryImage: image,
      images: [image, ...prev.images.filter((item) => item !== image)],
    }));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setForm((prev) => {
      const images = [...galleryImages];
      const [item] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, item);
      return {
        ...prev,
        images,
        primaryImage: images[0],
      };
    });
  };

  const uploadFile = async (file: File, folder: "products" | "cms" | "support-chat", mode: "image" | "video") => {
    if (mode === "image") {
      setUploading(true);
    } else {
      setUploadingVideo(true);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("record", "false");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { imageUrl?: string; path?: string; error?: string };
      if (!response.ok || (!data.path && !data.imageUrl)) {
        throw new Error(data.error ?? "Upload failed");
      }

      const reference = normalizeMediaReference(data.path ?? data.imageUrl);
      if (!reference) {
        throw new Error("Upload returned empty media reference");
      }

      if (mode === "image") {
        setForm((prev) => {
          const images = [...prev.images, reference];
          return {
            ...prev,
            images,
            primaryImage: prev.primaryImage || reference,
          };
        });
        toast.success("Image uploaded successfully");
      } else {
        setForm((prev) => ({ ...prev, videoUrl: reference }));
        toast.success("Video uploaded successfully");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || (mode === "image" ? "Image upload failed" : "Video upload failed"));
    } finally {
      if (mode === "image") {
        setUploading(false);
      } else {
        setUploadingVideo(false);
      }
    }
  };

  const onDropUpload = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    await uploadFile(file, "products", file.type.startsWith("video/") ? "video" : "image");
  };

  const csvToList = (value?: string[]) => (value ?? []).map((item) => item.trim()).filter(Boolean);

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    setForm((prev) => {
      const variants = [...(prev.variants ?? [])];
      variants[index] = { ...variants[index], ...updates };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...(prev.variants ?? []), emptyVariant((prev.variants ?? []).length + 1)],
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Product description is required");
      return;
    }
    if (!galleryImages.length) {
      toast.error("Upload at least one product image");
      return;
    }

    setSaving(true);

    const method = defaultValues?.id ? "PATCH" : "POST";
    const url = defaultValues?.id ? `/api/admin/products/${defaultValues.id}` : "/api/admin/products";

    const normalizedSeo = form.seo
      ? {
          ...form.seo,
          canonicalUrl: form.seo.canonicalUrl?.trim() || undefined,
          keywords: (form.seo.keywords ?? []).map((item) => item.trim()).filter(Boolean),
        }
      : undefined;

    const variants = (form.variants ?? []).map((variant) => ({
      ...variant,
      size: variant.size?.trim() || undefined,
      color: variant.color?.trim() || undefined,
      type: variant.type?.trim() || undefined,
      material: variant.material?.trim() || undefined,
      sku: variant.sku?.trim() || "",
      price: Number(variant.price || 0),
      stock: Number(variant.stock || 0),
    })).filter((variant) => variant.sku && variant.price > 0);

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          primaryImage: normalizeMediaReference(form.primaryImage) || normalizeMediaReference(galleryImages[0]),
          images: galleryImages.map((item) => normalizeMediaReference(item)).filter(Boolean),
          price: Number(form.price),
          costPrice: form.costPrice ? Number(form.costPrice) : undefined,
          taxRate: form.taxRate ? Number(form.taxRate) : undefined,
          stock: Number(form.stock),
          lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
          discountPercent: Number(form.discountPercent ?? 0),
          popularity: Number(form.popularity ?? 0),
          tags: csvToList(form.tags),
          badges: csvToList(form.badges),
          trustBadges: csvToList(form.trustBadges),
          benefits: csvToList(form.benefits),
          ingredients: csvToList(form.ingredients),
          usageInstructions: csvToList(form.usageInstructions),
          routineProductIds: csvToList(form.routineProductIds),
          comboProductIds: csvToList(form.comboProductIds),
          frequentlyBoughtTogetherIds: csvToList(form.frequentlyBoughtTogetherIds),
          videoUrl: normalizeMediaReference(form.videoUrl),
          subtitle: form.subtitle?.trim() || undefined,
          shortDescription: form.shortDescription?.trim() || undefined,
          deliveryTime: form.deliveryTime?.trim() || undefined,
          shippingInfo: form.shippingInfo?.trim() || undefined,
          seo: normalizedSeo,
          variants,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Could not save product");
      }

      toast.success(defaultValues?.id ? "Product updated successfully" : "Product created successfully");
      window.location.href = "/admin/products/all";
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        {/* Modern Nav Tabs list */}
        <TabsList className="flex flex-wrap w-full justify-start h-auto rounded-xl border border-stone-200 bg-stone-50 p-1.5 shadow-sm mb-6 gap-1">
          <TabsTrigger value="general" className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Info className="h-4 w-4" />
            General Info
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Boxes className="h-4 w-4" />
            Stock & Shipping
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ImageIcon className="h-4 w-4" />
            Media Assets
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Search className="h-4 w-4" />
            SEO & Badges
          </TabsTrigger>
          <TabsTrigger value="variants" className="rounded-lg py-2 px-3.5 text-xs sm:text-sm font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sparkles className="h-4 w-4" />
            Variants & Relations
          </TabsTrigger>
        </TabsList>

        {/* 1. General Tab */}
        <TabsContent value="general" className="space-y-4 focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2 mb-4">Basic Information</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Product Title *</label>
                <Input
                  placeholder="e.g. Modern Canvas Photo Print"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Subtitle / Short Description Header</label>
                <Input
                  placeholder="e.g. Premium matte finish print with teak wood frames"
                  value={form.subtitle ?? ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Short Description (Appears on catalog cards)</label>
                <Input
                  placeholder="e.g. Handcrafted print on museum-grade canvas papers..."
                  value={form.shortDescription ?? ""}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Detailed Description *</label>
                <Textarea
                  placeholder="Describe your product here..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-xl border-stone-200 min-h-[160px] focus:border-stone-400 focus:ring-stone-400"
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Categorization Card */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Organization</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Primary Category</label>
                  <select
                    className="w-full h-11 rounded-xl border border-stone-200 px-3 text-sm focus:border-stone-400 focus:ring-stone-400 bg-white"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="photo-prints">Photo Prints</option>
                    <option value="stickers">Stickers</option>
                    <option value="personalized-gifts">Personalized Gifts</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Subcategory</label>
                  <Input
                    placeholder="e.g. Polaroid, Framed"
                    value={form.subcategory ?? ""}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Brand Name</label>
                  <Input
                    placeholder="e.g. FriendlyDrop Custom"
                    value={form.brand ?? ""}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>
              </div>

              {/* SKU & Identification Card */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Catalog Identifiers</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Product SKU (Primary)</label>
                  <Input
                    placeholder="e.g. FD-CANV-PRT-01"
                    value={form.sku ?? ""}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>

                <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-150">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Generated Slug Preview</span>
                  <span className="text-xs font-mono text-stone-700 break-all block mt-1">{slugPreview}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4 focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Pricing Structure</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Regular Price ($) *</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Discount Percent (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    value={form.discountPercent ?? 0}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Cost Price ($) (Confidential)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.costPrice ?? 0}
                    onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400 font-medium text-stone-600"
                  />
                  <p className="text-[10px] text-stone-400">Used to compute profit margins and reports.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Estimated Tax Rate (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.taxRate ?? 0}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Profits Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Profit Breakdown</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <span className="text-sm text-stone-500 font-medium">Estimated Sale Price</span>
                  <span className="text-lg font-bold text-emerald-600">${profitMetrics.salePrice}</span>
                </div>

                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <span className="text-sm text-stone-500 font-medium">Cost of Goods Sold</span>
                  <span className="text-sm font-semibold text-stone-700">${form.costPrice ?? 0}</span>
                </div>

                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <span className="text-sm text-stone-500 font-medium">Net Profit Margin</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-stone-900 block">${profitMetrics.profit}</span>
                    <span className="text-xs font-semibold text-stone-500 block">({profitMetrics.margin}%)</span>
                  </div>
                </div>

                {profitMetrics.margin < 15 && profitMetrics.margin >= 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 text-amber-800 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>Notice:</strong> Profit margin is below 15%. Consider adjustments.</span>
                  </div>
                )}
                {profitMetrics.margin < 0 && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex gap-2 text-rose-800 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>Warning:</strong> Loss margin detected. Increase price or reduce cost.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. Inventory & Shipping Tab */}
        <TabsContent value="inventory" className="space-y-4 focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Inventory Management</h3>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Initial Stock *</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Low Stock Threshold</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.lowStockThreshold ?? 10}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Popularity Score (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.popularity ?? 80}
                    onChange={(e) => setForm({ ...form, popularity: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>
              </div>

              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2 mt-6">Shipping Parameters</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Weight (Grams)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={form.weightGrams ?? 0}
                    onChange={(e) => setForm({ ...form, weightGrams: Number(e.target.value) })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Estimated Delivery Time Description</label>
                  <Input
                    placeholder="e.g. Delivered within 3-5 business days"
                    value={form.deliveryTime ?? ""}
                    onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Shipping Info (Disclaimers/Terms)</label>
                <Input
                  placeholder="e.g. Custom prints are created on order, adding 24-48 hours processing time"
                  value={form.shippingInfo ?? ""}
                  onChange={(e) => setForm({ ...form, shippingInfo: e.target.value })}
                  className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Dimensions (Width × Height × Depth in cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Width"
                    value={form.dimensions?.widthCm ?? ""}
                    onChange={(e) => setForm({ ...form, dimensions: { ...(form.dimensions ?? {}), widthCm: Number(e.target.value) } })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400"
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={form.dimensions?.heightCm ?? ""}
                    onChange={(e) => setForm({ ...form, dimensions: { ...(form.dimensions ?? {}), heightCm: Number(e.target.value) } })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400"
                  />
                  <Input
                    type="number"
                    placeholder="Depth"
                    value={form.dimensions?.depthCm ?? ""}
                    onChange={(e) => setForm({ ...form, dimensions: { ...(form.dimensions ?? {}), depthCm: Number(e.target.value) } })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* Status & Visibility Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Status & Visibility</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Publish Status</label>
                <select
                  className="w-full h-11 rounded-xl border border-stone-200 px-3 text-sm focus:border-stone-400 focus:ring-stone-400 bg-white capitalize"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="published">published</option>
                  <option value="draft">draft</option>
                  <option value="archived">archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Visibility Setting</label>
                <select
                  className="w-full h-11 rounded-xl border border-stone-200 px-3 text-sm focus:border-stone-400 focus:ring-stone-400 bg-white capitalize"
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as any })}
                >
                  <option value="public">public</option>
                  <option value="private">private</option>
                </select>
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(form.featured)}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="h-4.5 w-4.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <div>
                    <span className="text-sm font-semibold text-stone-900">Featured Product</span>
                    <p className="text-[10px] text-stone-500">Showcases in the home featured collections.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(form.recommended)}
                    onChange={(e) => setForm({ ...form, recommended: e.target.checked })}
                    className="h-4.5 w-4.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <div>
                    <span className="text-sm font-semibold text-stone-900">AI Stylist Stylist Pick</span>
                    <p className="text-[10px] text-stone-500">Includes in the Stylist recommendations matching algorithms.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 4. Media Assets Tab */}
        <TabsContent value="media" className="space-y-4 focus-visible:outline-none">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Product Media & Gallery</h3>
                <p className="text-xs text-stone-500">Drag to reorder. The first image will be set as primary.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-stone-800 transition">
                  <Upload className="h-4 w-4" />
                  Upload Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      files.forEach((file) => uploadFile(file, "products", "image"));
                    }}
                  />
                </label>
                {uploading && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>

            {/* Direct reference input */}
            <div className="grid gap-4 sm:grid-cols-4 items-end bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Or Enter Media URL Directly</label>
                <Input
                  placeholder="Paste external link or media path..."
                  value={manualMediaRef}
                  onChange={(event) => setManualMediaRef(event.target.value)}
                  className="rounded-xl border-stone-200 h-10 bg-white"
                />
              </div>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  const normalized = normalizeMediaReference(manualMediaRef);
                  if (!normalized) {
                    toast.error("Invalid media path");
                    return;
                  }
                  setForm((prev) => ({
                    ...prev,
                    images: [...prev.images, normalized],
                    primaryImage: prev.primaryImage || normalized
                  }));
                  setManualMediaRef("");
                  toast.success("Image reference added");
                }}
                className="h-10 rounded-xl font-medium"
              >
                Add Link
              </Button>
            </div>

            {/* Drag Zone */}
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDropUpload}
              className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center text-stone-500 bg-stone-50/20 hover:bg-stone-50/50 hover:border-stone-300 transition cursor-pointer flex flex-col items-center justify-center gap-1"
            >
              <Upload className="h-6 w-6 text-stone-400 mb-1" />
              <span className="text-sm font-semibold text-stone-700">Drag & Drop Files</span>
              <p className="text-xs text-stone-400">Drag images or videos here to upload directly to your store storage.</p>
            </div>

            {/* Images Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pt-2">
              {galleryImages.map((image, index) => {
                const preview = resolveMediaUrl(image, { width: 600, quality: 75, format: "webp" }) || "/file.svg";
                const isPrimary = (form.primaryImage || galleryImages[0]) === image;
                return (
                  <div
                    key={`${image}-${index}`}
                    className={`group relative rounded-xl border p-3 bg-white transition flex flex-col gap-2.5 ${
                      isPrimary ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-stone-200 hover:border-stone-300"
                    }`}
                    draggable
                    onDragStart={() => setDraggingImageIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingImageIndex === null || draggingImageIndex === index) return;
                      reorderImages(draggingImageIndex, index);
                      setDraggingImageIndex(null);
                    }}
                  >
                    {/* Reorder drag handle */}
                    <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-lg bg-white/95 shadow-sm border border-stone-150 flex items-center justify-center cursor-grab text-stone-500">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>

                    {/* Image Preview Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center">
                      <img src={preview} alt="Product media thumbnail" className="h-full w-full object-cover select-none" loading="lazy" />
                      {isPrimary && (
                        <div className="absolute top-2.5 right-2.5 rounded-lg bg-emerald-500 text-[10px] font-bold text-white px-2 py-0.5 shadow-sm border border-emerald-400">
                          Primary
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold shadow-xs transition ${
                          isPrimary 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                        onClick={() => setPrimaryImage(image)}
                      >
                        <Check className="h-3 w-3" />
                        {isPrimary ? "Primary" : "Set Main"}
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100/70 transition"
                        onClick={() => {
                          setForm((prev) => {
                            const images = prev.images.filter((item) => item !== image);
                            return {
                              ...prev,
                              images,
                              primaryImage: prev.primaryImage === image ? images[0] : prev.primaryImage,
                            };
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Video Url Container */}
            <div className="border-t border-stone-100 pt-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-stone-900">Product Video Asset</h4>
                <p className="text-xs text-stone-500">Provide a promotional product video file or link.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 items-start">
                <div className="rounded-xl border border-stone-200 p-4 space-y-3 bg-stone-50/20">
                  <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block">Upload Video File</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          uploadFile(file, "products", "video");
                        }
                      }}
                      className="text-xs text-stone-600 border border-stone-200 rounded-lg p-1.5 bg-white cursor-pointer"
                    />
                    {uploadingVideo && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-stone-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Video URL Reference</label>
                  <Input
                    placeholder="Enter raw video path or external hosting link..."
                    value={form.videoUrl ?? ""}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 bg-white"
                  />
                  {form.videoUrl && (
                    <div className="p-2 bg-stone-50 rounded-lg border border-stone-150 text-[10px] font-mono text-stone-500 break-all">
                      Current reference: {form.videoUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 5. SEO & Badges Tab */}
        <TabsContent value="seo" className="space-y-4 focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Search Engine Optimization (SEO)</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Meta Title Override</label>
                  <Input
                    placeholder="Defaults to product name..."
                    value={form.seo?.metaTitle ?? ""}
                    onChange={(e) => setForm({ ...form, seo: { ...(form.seo ?? {}), metaTitle: e.target.value } })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Canonical URL Link</label>
                  <Input
                    placeholder="https://example.com/products/custom-slug"
                    value={form.seo?.canonicalUrl ?? ""}
                    onChange={(e) => setForm({ ...form, seo: { ...(form.seo ?? {}), canonicalUrl: e.target.value } })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400 focus:ring-stone-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Meta Description Override</label>
                <Textarea
                  placeholder="Summarize product for Google search engine indexing snippets..."
                  value={form.seo?.metaDescription ?? ""}
                  onChange={(e) => setForm({ ...form, seo: { ...(form.seo ?? {}), metaDescription: e.target.value } })}
                  className="rounded-xl border-stone-200 min-h-[90px] focus:border-stone-400 focus:ring-stone-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Image Alt Attribute Text</label>
                  <Input
                    placeholder="Describe main product image contents for screen-readers..."
                    value={form.seo?.imageAlt ?? ""}
                    onChange={(e) => setForm({ ...form, seo: { ...(form.seo ?? {}), imageAlt: e.target.value } })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">SEO Keywords (Comma separated)</label>
                  <Input
                    placeholder="e.g. photo prints, gifts, customized collage"
                    value={(form.seo?.keywords ?? []).join(", ")}
                    onChange={(e) => setForm({ ...form, seo: { ...(form.seo ?? {}), keywords: e.target.value.split(",").map((i) => i.trim()).filter(Boolean) } })}
                    className="rounded-xl border-stone-200 h-11 focus:border-stone-400"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.seo?.noindex)}
                    onChange={(e) => setForm({ ...form, seo: { ...(form.seo ?? {}), noindex: e.target.checked } })}
                    className="h-4.5 w-4.5 rounded border-stone-300"
                  />
                  <span className="text-xs font-semibold text-stone-700">Add No-Index Tag (Hide from Google)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.seo?.nofollow)}
                    onChange={(e) => setForm({ ...form, seo: { ...(form.seo ?? {}), nofollow: e.target.checked } })}
                    className="h-4.5 w-4.5 rounded border-stone-300"
                  />
                  <span className="text-xs font-semibold text-stone-700">Add No-Follow Tag</span>
                </label>
              </div>
            </div>

            {/* Badges and tags */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Badges & Classifications</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Product Badges (Comma separated)</label>
                <Input
                  placeholder="e.g. NEW, BESTSELLER, 20% OFF"
                  value={(form.badges ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, badges: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Product Tags (Comma separated)</label>
                <Input
                  placeholder="e.g. print, glossy, wooden, framing"
                  value={(form.tags ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Trust Badges (Comma separated)</label>
                <Input
                  placeholder="e.g. COD Available, Easy Returns, Free Shipping"
                  value={(form.trustBadges ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, trustBadges: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Key Benefits (Comma separated)</label>
                <Input
                  placeholder="e.g. Water resistant, UV proof, Matte finish"
                  value={(form.benefits ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 6. Variants & Relations Tab */}
        <TabsContent value="variants" className="space-y-4 focus-visible:outline-none">
          {/* Variants section */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Product Variants</h3>
                <p className="text-xs text-stone-500">Provide variants if this product comes in different colors, sizes, types, or materials.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addVariant}
                className="rounded-xl gap-1.5 h-9 font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-3.5">
              {(form.variants ?? []).map((variant, index) => (
                <div key={variant.id} className="grid gap-3 rounded-xl border border-stone-250 bg-stone-50/50 p-4 sm:grid-cols-7 items-end relative group">
                  <div className="space-y-1 sm:col-span-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Size</span>
                    <Input
                      placeholder="e.g. A4, 4x6"
                      value={variant.size ?? ""}
                      onChange={(event) => updateVariant(index, { size: event.target.value })}
                      className="rounded-xl border-stone-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Color</span>
                    <Input
                      placeholder="e.g. Matte Black"
                      value={variant.color ?? ""}
                      onChange={(event) => updateVariant(index, { color: event.target.value })}
                      className="rounded-xl border-stone-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Type / Material</span>
                    <Input
                      placeholder="e.g. Canvas"
                      value={variant.type ?? ""}
                      onChange={(event) => updateVariant(index, { type: event.target.value })}
                      className="rounded-xl border-stone-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">SKU Code *</span>
                    <Input
                      placeholder="e.g. CANV-A4-BLK-01"
                      value={variant.sku}
                      onChange={(event) => updateVariant(index, { sku: event.target.value })}
                      className="rounded-xl border-stone-200 bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Price ($) *</span>
                    <Input
                      type="number"
                      placeholder="Price"
                      value={variant.price}
                      onChange={(event) => updateVariant(index, { price: Number(event.target.value) })}
                      className="rounded-xl border-stone-200 bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1 flex gap-2 items-center">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Stock *</span>
                      <Input
                        type="number"
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })}
                        className="rounded-xl border-stone-200 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="h-9 w-9 text-rose-500 border border-rose-100 hover:border-rose-200 hover:bg-rose-50 rounded-xl flex items-center justify-center transition mt-4"
                      title="Remove variant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {!form.variants?.length && (
                <div className="text-center py-6 text-stone-500 text-sm bg-stone-50/50 rounded-xl border border-stone-200 border-dashed">
                  No variants added. Product will use the base price and stock parameters.
                </div>
              )}
            </div>
          </div>

          {/* Relations section */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Related Products Relationships</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Routine Product IDs (Comma separated)</label>
                <Input
                  placeholder="e.g. prod-id1, prod-id2"
                  value={(form.routineProductIds ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, routineProductIds: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Combo Pack Product IDs (Comma separated)</label>
                <Input
                  placeholder="e.g. prod-id3, prod-id4"
                  value={(form.comboProductIds ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, comboProductIds: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Frequently Bought Together IDs</label>
                <Input
                  placeholder="e.g. prod-id5, prod-id6"
                  value={(form.frequentlyBoughtTogetherIds ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, frequentlyBoughtTogetherIds: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>
            </div>

            {/* Extra details (Ingredients, Usage) */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">Custom Detail Blocks</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Material Ingredients (Comma separated)</label>
                <Input
                  placeholder="e.g. Canvas wood, ink, matte coat"
                  value={(form.ingredients ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Usage Instructions (Comma separated)</label>
                <Input
                  placeholder="e.g. Do not place in direct wet area, Clean with dry cloth"
                  value={(form.usageInstructions ?? []).join(", ")}
                  onChange={(e) => setForm({ ...form, usageInstructions: e.target.value.split(",").map((i) => i.trim()) })}
                  className="rounded-xl border-stone-200 h-10"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-stone-200 p-4 -mx-6 md:-mx-8 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] backdrop-blur flex justify-between gap-4 items-center rounded-b-2xl">
        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium hidden sm:flex">
          <Clock className="h-3.5 w-3.5" />
          <span>Last modified today. Review fields before saving.</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Discard unsaved changes?")) {
                window.location.href = "/admin/products/all";
              }
            }}
            className="rounded-xl border-stone-200 font-semibold h-11 px-5"
          >
            Cancel
          </Button>

          <Button
            disabled={saving}
            onClick={save}
            className="rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold h-11 px-6 shadow-sm flex gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {defaultValues?.id ? "Update Product" : "Publish Product"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
