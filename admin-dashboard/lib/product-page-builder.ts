import {
  Product,
  ProductPageBuilderGlobalConfig,
  ProductPageSectionConfig,
  ProductPageSectionId,
} from "@/types";

const SECTION_DEFINITIONS: Array<{ id: ProductPageSectionId; label: string; description: string; enabled: boolean }> = [
  { id: "announcement_bar", label: "Announcement Bar", description: "Top product messaging strip", enabled: true },
  { id: "breadcrumbs", label: "Breadcrumbs", description: "Category and navigation breadcrumbs", enabled: true },
  { id: "product_tags", label: "Product Tags", description: "Skin-type or topical tags", enabled: true },
  { id: "ratings", label: "Ratings", description: "Average rating and review count", enabled: true },
  { id: "price", label: "Price", description: "MRP, offer, and discount", enabled: true },
  { id: "product_gallery", label: "Product Gallery", description: "Image/video gallery section", enabled: true },
  { id: "feature_highlights", label: "Feature Highlights", description: "Concise value proposition bullets", enabled: true },
  { id: "benefits", label: "Benefits", description: "Benefit cards or bullet list", enabled: true },
  { id: "ingredients", label: "Ingredients", description: "Ingredients and active ingredients", enabled: true },
  { id: "usage_instructions", label: "Usage Instructions", description: "How to use instructions", enabled: true },
  { id: "product_routine", label: "Product Routine", description: "Complete your routine stack", enabled: true },
  { id: "related_products", label: "Related Products", description: "Contextual related items", enabled: true },
  { id: "combo_products", label: "Combo Products", description: "Bundle and combo offerings", enabled: true },
  { id: "frequently_bought_together", label: "Frequently Bought Together", description: "Co-purchase recommendations", enabled: true },
  { id: "reviews", label: "Reviews", description: "Reviews and rating breakdown", enabled: true },
  { id: "faq", label: "FAQ", description: "Product-level frequently asked questions", enabled: true },
  { id: "delivery_information", label: "Delivery Information", description: "Delivery ETA and shipping summary", enabled: true },
  { id: "icons_features_row", label: "Icons/Features Row", description: "Trust and key-feature icons", enabled: true },
  { id: "sticky_add_to_cart", label: "Sticky Add To Cart", description: "Sticky CTA at viewport bottom", enabled: true },
  { id: "floating_buy_button", label: "Floating Buy Button", description: "Floating quick-buy action", enabled: true },
  { id: "mobile_bottom_navigation", label: "Mobile Bottom Navigation", description: "Mobile utility navigation", enabled: true },
  { id: "trust_badges", label: "Trust Badges", description: "Certification or trust markers", enabled: true },
  { id: "coupon_section", label: "Coupon Section", description: "Coupon and offer application card", enabled: true },
  { id: "subscription_option", label: "Subscription Option", description: "Subscribe & save module", enabled: false },
  { id: "recommended_products", label: "Recommended Products", description: "AI/personalized recommendations", enabled: true },
  { id: "recently_viewed_products", label: "Recently Viewed Products", description: "Recently viewed strip", enabled: true },
];

export function createDefaultProductPageSections(): ProductPageSectionConfig[] {
  return SECTION_DEFINITIONS.map((section, index) => ({
    id: section.id,
    label: section.label,
    description: section.description,
    enabled: section.enabled,
    order: index,
  }));
}

export function createDefaultProductPageBuilderConfig(): ProductPageBuilderGlobalConfig {
  return {
    id: "default",
    sections: createDefaultProductPageSections(),
    reusableTemplateIds: [],
    globalFlags: {
      autoGenerateProductPage: true,
      autoGenerateSeoMetadata: true,
      autoGenerateSlug: true,
      autoRelatedProducts: true,
      autoRecommendations: true,
      autoCategoryAssignment: true,
      autoInventorySync: true,
      autoMobileOptimization: true,
      autoSearchIndexing: true,
      autoSitemapUpdate: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeProductPageSections(
  sections: ProductPageSectionConfig[] | undefined,
): ProductPageSectionConfig[] {
  const defaults = createDefaultProductPageSections();

  if (!sections?.length) {
    return defaults;
  }

  const incoming = new Map(sections.map((section) => [section.id, section]));
  const merged = defaults.map((def) => {
    const current = incoming.get(def.id);
    return current
      ? {
          ...def,
          ...current,
          id: def.id,
          label: current.label || def.label,
        }
      : def;
  });

  return merged.sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index }));
}

export function buildAutoProductSyncDraft(input: Partial<Product>): Partial<Product> {
  const title = input.name?.trim() || "Product";
  const categoryLabel = input.category?.replaceAll("-", " ") ?? "skincare";
  const short = input.shortDescription?.trim() || input.description?.slice(0, 160) || `Premium ${categoryLabel} product`;

  return {
    subtitle: input.subtitle?.trim() || `Dermatologist-inspired ${categoryLabel}`,
    shortDescription: short,
    seo: {
      metaTitle: input.seo?.metaTitle || `${title} | FriendlyDrop`,
      metaDescription: input.seo?.metaDescription || short,
      imageAlt: input.seo?.imageAlt || title,
      canonicalUrl: input.seo?.canonicalUrl,
      keywords: input.seo?.keywords?.length ? input.seo.keywords : [categoryLabel, title],
      nofollow: input.seo?.nofollow,
      noindex: input.seo?.noindex,
    },
    tags: input.tags?.length ? input.tags : [categoryLabel],
    recommended: input.recommended ?? true,
    popularity: typeof input.popularity === "number" ? input.popularity : 60,
  };
}
