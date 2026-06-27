"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

type DemoSectionId =
  | "announcement_bar"
  | "header"
  | "breadcrumbs"
  | "product_tags"
  | "title_area"
  | "gallery"
  | "trust_strip"
  | "benefits"
  | "variants"
  | "sticky_add_to_cart"
  | "shipping"
  | "feature_icons"
  | "info_tabs"
  | "recommended"
  | "floating_cta";

export interface DemoSectionControl {
  id: DemoSectionId;
  enabled: boolean;
  order: number;
}

const DEFAULT_CONTROLS: DemoSectionControl[] = [
  { id: "announcement_bar", enabled: true, order: 0 },
  { id: "header", enabled: true, order: 1 },
  { id: "breadcrumbs", enabled: true, order: 2 },
  { id: "product_tags", enabled: true, order: 3 },
  { id: "title_area", enabled: true, order: 4 },
  { id: "gallery", enabled: true, order: 5 },
  { id: "trust_strip", enabled: true, order: 6 },
  { id: "benefits", enabled: true, order: 7 },
  { id: "variants", enabled: true, order: 8 },
  { id: "shipping", enabled: true, order: 9 },
  { id: "feature_icons", enabled: true, order: 10 },
  { id: "info_tabs", enabled: true, order: 11 },
  { id: "recommended", enabled: true, order: 12 },
  { id: "sticky_add_to_cart", enabled: true, order: 13 },
  { id: "floating_cta", enabled: true, order: 14 },
];

const DEMO_IMAGES = [
  "https://placehold.co/900x900/e8eef3/2d3c4a?text=Product+Image+01",
  "https://placehold.co/900x900/f4f2ec/2d3c4a?text=Product+Image+02",
  "https://placehold.co/900x900/e7f0eb/2d3c4a?text=Product+Image+03",
  "https://placehold.co/900x900/f6ebef/2d3c4a?text=Product+Image+04",
];

export function DemoMobileProductPage({ sectionControls }: { sectionControls?: DemoSectionControl[] }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("120 ml");
  const [activeTab, setActiveTab] = useState<"description" | "ingredients" | "usage" | "faq">("description");

  const controls = useMemo(() => {
    const incoming = new Map((sectionControls ?? []).map((item) => [item.id, item]));
    return DEFAULT_CONTROLS.map((base) => {
      const override = incoming.get(base.id);
      return override
        ? { ...base, ...override, id: base.id }
        : base;
    }).sort((a, b) => a.order - b.order);
  }, [sectionControls]);

  const isEnabled = (id: DemoSectionId) => controls.find((item) => item.id === id)?.enabled ?? false;

  const variants = [
    { id: "120 ml", price: "₹399", off: "" },
    { id: "240 ml", price: "₹699", off: "10% OFF" },
    { id: "360 ml", price: "₹899", off: "15% OFF" },
  ];

  const sectionUi: Record<DemoSectionId, JSX.Element> = {
    announcement_bar: (
      <div className="rounded-2xl bg-gradient-to-r from-[#edf7ff] via-[#f6f9ff] to-[#eefaf3] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#394653] shadow-sm">
        Placeholder notice: Free shipping on demo orders above ₹999
      </div>
    ),
    header: (
      <header className="sticky top-0 z-30 rounded-2xl border border-[#dbe4ec] bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center justify-between">
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e2ea] text-[#364655]">
            <Menu className="h-5 w-5" />
          </button>
          <div className="h-8 w-28 rounded-full border border-dashed border-[#b7c3cf] bg-[#f8fbfd] text-center text-[10px] leading-8 uppercase tracking-[0.14em] text-[#5d6c7a]">
            Logo
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e2ea] text-[#364655]">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e2ea] text-[#364655]">
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
    ),
    breadcrumbs: (
      <nav className="flex flex-wrap items-center gap-1 text-xs text-[#6a7886]">
        <span>Category</span>
        <ChevronRight className="h-3 w-3" />
        <span>Subcategory</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[#2e3e4d]">Demo Product</span>
      </nav>
    ),
    product_tags: (
      <div className="flex flex-wrap gap-2">
        {["Tag One", "Tag Two", "Tag Three"].map((tag) => (
          <span key={tag} className="rounded-full border border-[#d5e0ea] bg-white px-3 py-1 text-[11px] font-medium text-[#3a4a59]">
            {tag}
          </span>
        ))}
      </div>
    ),
    title_area: (
      <section className="space-y-2 rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-tight text-[#1d2b38]">Demo Product Title</h1>
        <p className="text-sm text-[#5f6f7d]">Short placeholder subtitle explaining the product benefit in one line.</p>
        <div className="flex items-center gap-3 text-sm text-[#4f6070]">
          <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current text-[#9ad17b]" /> 4.8</span>
          <span>• 200 Placeholder Reviews</span>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-semibold text-[#14202d]">₹399</p>
          <p className="text-sm text-[#8b99a6] line-through">₹499</p>
        </div>
      </section>
    ),
    gallery: (
      <section className="space-y-3 rounded-2xl border border-[#dce5ec] bg-white p-3 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-[#e3ebf2] bg-[#f8fbfd]">
          <img src={DEMO_IMAGES[selectedImageIndex]} alt="Demo product visual" className="h-auto w-full object-cover" />
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          {DEMO_IMAGES.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={`min-w-[72px] snap-start overflow-hidden rounded-xl border ${
                selectedImageIndex === index ? "border-[#88c57c] ring-2 ring-[#d6f0cf]" : "border-[#d9e4ec]"
              }`}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} className="h-16 w-full object-cover" />
            </button>
          ))}
        </div>
      </section>
    ),
    trust_strip: (
      <div className="rounded-full border border-[#cfe7c7] bg-[#effbe8] px-4 py-2 text-center text-xs font-medium text-[#32523b]">
        Placeholder trust strip: 94% users reported a positive demo experience.
      </div>
    ),
    benefits: (
      <section className="space-y-3 rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#415261]">Product Benefits</h2>
        {[
          "Placeholder benefit point one.",
          "Placeholder benefit point two.",
          "Placeholder benefit point three.",
        ].map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-[#4f6070]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7ebf72]" />
            <p>{item}</p>
          </div>
        ))}
      </section>
    ),
    variants: (
      <section className="space-y-3 rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#415261]">Select Variant</h2>
        <div className="grid grid-cols-2 gap-2">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedVariant(variant.id)}
              className={`rounded-xl border p-3 text-left transition ${
                selectedVariant === variant.id
                  ? "border-[#7fbe72] bg-[#f2fceb] shadow-sm"
                  : "border-[#d7e2ea] bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-[#213142]">{variant.id}</p>
              <p className="text-sm text-[#3f5264]">{variant.price}</p>
              {variant.off ? <p className="mt-1 inline-block rounded-full bg-[#eaf8e3] px-2 py-0.5 text-[10px] font-semibold text-[#3f7440]">{variant.off}</p> : null}
            </button>
          ))}
        </div>
      </section>
    ),
   sticky_add_to_cart: (
      <div className="sticky bottom-3 z-20 rounded-2xl border border-[#d1e6cb] bg-white/95 p-2 shadow-[0_16px_40px_-22px_rgba(25,44,33,0.45)] backdrop-blur">
        <button type="button" className="w-full rounded-xl bg-gradient-to-r from-[#1e4f82] to-[#8bcf66] py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white">
          Add To Cart
        </button>
      </div>
    ),
    shipping: (
      <section className="space-y-2 rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-[#304355]">
          <Truck className="h-4 w-4" />
          Delivery & Shipping
        </div>
        <p className="text-sm text-[#5f6f7d]">Delivers in 24-48 hrs • Shipping availability shown at checkout.</p>
      </section>
    ),
    feature_icons: (
      <section className="grid grid-cols-4 gap-2 rounded-2xl border border-[#dce5ec] bg-white p-3 shadow-sm">
        {[
          { icon: ShieldCheck, label: "Safe" },
          { icon: Sparkles, label: "Clean" },
          { icon: CheckCircle2, label: "Tested" },
          { icon: Truck, label: "Fast" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 rounded-xl border border-[#e3ebf2] p-2 text-center">
            <item.icon className="h-4 w-4 text-[#4a6073]" />
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#4d6172]">{item.label}</p>
          </div>
        ))}
      </section>
    ),
    info_tabs: (
      <section className="space-y-3 rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#f4f8fb] p-1">
          {[
            { key: "description", label: "Description" },
            { key: "ingredients", label: "Ingredients" },
            { key: "usage", label: "Usage" },
            { key: "faq", label: "FAQ" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-lg px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                activeTab === tab.key ? "bg-white text-[#1f3345] shadow-sm" : "text-[#617485]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-sm leading-6 text-[#506273]">
          {activeTab === "description" ? "Placeholder description content for demo layout system." : null}
          {activeTab === "ingredients" ? "Placeholder ingredients content for demo layout system." : null}
          {activeTab === "usage" ? "Placeholder usage instructions for demo layout system." : null}
          {activeTab === "faq" ? "Placeholder FAQ content for demo layout system." : null}
        </div>
      </section>
    ),
    recommended: (
      <section className="space-y-3 rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#415261]">Recommended Bundle</h2>
          <p className="text-xs text-[#667888]">Multi-add Demo</p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-[#dce5ec] bg-[#fbfdff] p-2">
              <img src={`https://placehold.co/120x120/f0f4f8/2d3c4a?text=Item+${index}`} alt={`Recommended item ${index}`} className="h-16 w-16 rounded-lg border border-[#e2eaf1] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#223648]">Demo Recommended Item {index}</p>
                <p className="text-xs text-[#5e6f7d]">Placeholder supporting copy</p>
                <p className="text-sm font-semibold text-[#1f3142]">₹{199 + index * 100}</p>
              </div>
              <input type="checkbox" className="h-4 w-4 accent-[#84c96f]" />
            </div>
          ))}
        </div>
        <button type="button" className="w-full rounded-xl bg-[#193d66] py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white">
          Add Selected Bundle
        </button>
      </section>
    ),
    floating_cta: (
      <button
        type="button"
        className="fixed bottom-20 right-4 z-30 inline-flex h-12 items-center justify-center rounded-full bg-[#1f3550] px-4 text-xs font-semibold uppercase tracking-[0.09em] text-white shadow-lg md:hidden"
      >
        Quick Buy
      </button>
    ),
  };

  return (
    <div className="mx-auto w-full max-w-[420px] space-y-3 rounded-[28px] bg-gradient-to-b from-[#eef5fb] to-[#f7fbfd] p-3 pb-24 md:max-w-[520px] md:rounded-[32px] md:p-5">
      {controls
        .filter((item) => item.enabled)
        .map((item) => (
          <div key={item.id}>{sectionUi[item.id]}</div>
        ))}
    </div>
  );
}
