"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical, Save, Smartphone, Copy, LayoutTemplate } from "lucide-react";
import { Product, ProductPageSectionConfig, ProductPageTemplate } from "@/types";
import { Button } from "@/components/ui/button";

interface ProductPageBuilderStudioProps {
  products: Array<Pick<Product, "id" | "name">>;
  initialGlobalSections: ProductPageSectionConfig[];
  initialTemplates: ProductPageTemplate[];
}

function reorderSections(
  sections: ProductPageSectionConfig[],
  fromIndex: number,
  toIndex: number,
) {
  const next = [...sections];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((section, index) => ({ ...section, order: index }));
}

function normalizeSections(sections: ProductPageSectionConfig[]) {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index }));
}

export function ProductPageBuilderStudio({
  products,
  initialGlobalSections,
  initialTemplates,
}: ProductPageBuilderStudioProps) {
  const [globalSections, setGlobalSections] = useState<ProductPageSectionConfig[]>(
    normalizeSections(initialGlobalSections),
  );
  const [templates, setTemplates] = useState<ProductPageTemplate[]>(initialTemplates);
  const [templateName, setTemplateName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? "");
  const [productSections, setProductSections] = useState<ProductPageSectionConfig[]>(normalizeSections(initialGlobalSections));
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const enabledCount = useMemo(
    () => productSections.filter((section) => section.enabled).length,
    [productSections],
  );

  useEffect(() => {
    if (!selectedProductId) {
      return;
    }

    setLoadingOverride(true);
    fetch(`/api/admin/product-page-builder/product/${selectedProductId}`)
      .then((res) => res.json())
      .then((payload) => {
        if (Array.isArray(payload?.resolvedSections)) {
          setProductSections(normalizeSections(payload.resolvedSections));
        } else {
          setProductSections(normalizeSections(globalSections));
        }
      })
      .catch(() => setProductSections(normalizeSections(globalSections)))
      .finally(() => setLoadingOverride(false));
  }, [selectedProductId, globalSections]);

  const saveGlobal = async () => {
    setSavingGlobal(true);
    try {
      await fetch("/api/admin/product-page-builder/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: globalSections }),
      });
    } finally {
      setSavingGlobal(false);
    }
  };

  const saveProductOverride = async () => {
    if (!selectedProductId) {
      return;
    }

    setSavingProduct(true);
    try {
      await fetch(`/api/admin/product-page-builder/product/${selectedProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: productSections }),
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      return;
    }

    setSavingTemplate(true);
    try {
      const response = await fetch("/api/admin/product-page-builder/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          sections: productSections,
        }),
      });
      const payload = await response.json();
      if (payload?.template) {
        setTemplates((prev) => [payload.template, ...prev.filter((item) => item.id !== payload.template.id)]);
        setTemplateName("");
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const applyTemplateToProduct = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }
    setProductSections(normalizeSections(template.sections));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Dynamic Product Page Builder</p>
              <h2 className="text-xl font-semibold text-slate-900">Global Section Controls</h2>
            </div>
            <Button type="button" onClick={saveGlobal} disabled={savingGlobal}>
              <Save className="mr-2 h-4 w-4" />
              {savingGlobal ? "Saving..." : "Save Global Layout"}
            </Button>
          </div>

          <div className="space-y-2">
            {globalSections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) {
                    return;
                  }
                  setGlobalSections((prev) => reorderSections(prev, dragIndex, index));
                  setDragIndex(null);
                }}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{section.label}</p>
                  <p className="truncate text-xs text-slate-500">{section.description}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) =>
                      setGlobalSections((prev) =>
                        prev.map((item) =>
                          item.id === section.id ? { ...item, enabled: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Enabled
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Live Preview</p>
              <h3 className="text-lg font-semibold text-slate-900">Mobile-first Product Page</h3>
            </div>
            <Smartphone className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mx-auto w-full max-w-[340px] rounded-[28px] border border-slate-300 bg-slate-100 p-3">
            <div className="h-[560px] overflow-auto rounded-[20px] bg-white p-3">
              {productSections
                .filter((section) => section.enabled)
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={section.id} className="mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{section.id.replaceAll("_", " ")}</p>
                    <p className="text-sm font-medium text-slate-900">{section.label}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Per Product Layout</p>
            <h3 className="text-lg font-semibold text-slate-900">Product Overrides, Templates & Cloning</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <LayoutTemplate className="h-4 w-4" />
            Enabled Sections: {enabledCount}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            onClick={() => setProductSections(normalizeSections(globalSections))}
            disabled={loadingOverride}
          >
            <Copy className="mr-2 h-4 w-4" />
            Clone Global
          </Button>

          <Button type="button" onClick={saveProductOverride} disabled={savingProduct || loadingOverride}>
            {savingProduct ? "Saving..." : "Save Product Override"}
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-2">
            {productSections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) {
                    return;
                  }
                  setProductSections((prev) => reorderSections(prev, dragIndex, index));
                  setDragIndex(null);
                }}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{section.label}</p>
                  <p className="truncate text-xs text-slate-500">{section.description}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) =>
                      setProductSections((prev) =>
                        prev.map((item) =>
                          item.id === section.id ? { ...item, enabled: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Enabled
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">Reusable Templates</p>
            <div className="flex gap-2">
              <input
                className="h-9 flex-1 rounded-md border border-slate-300 px-2 text-sm"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="Template name"
              />
              <Button type="button" variant="secondary" onClick={saveTemplate} disabled={savingTemplate}>
                {savingTemplate ? "..." : "Save"}
              </Button>
            </div>

            <div className="max-h-56 space-y-2 overflow-auto">
              {templates.length ? (
                templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplateToProduct(template.id)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-900">{template.name}</p>
                    <p className="text-xs text-slate-500">{template.sections.filter((item) => item.enabled).length} enabled sections</p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500">No templates yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
