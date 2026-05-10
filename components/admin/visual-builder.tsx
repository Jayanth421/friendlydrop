"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Laptop, Smartphone, Tablet, Undo2, Redo2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuilderDevice = "desktop" | "tablet" | "mobile";
type BuilderSectionKind = "hero" | "product-grid" | "lookbook" | "offer-banner" | "newsletter" | "custom-code";

interface BuilderSection {
  id: string;
  kind: BuilderSectionKind;
  title: string;
  subtitle: string;
  ctaLabel: string;
  bg: string;
  textColor: string;
  customCode: string;
}

interface BuilderState {
  sections: BuilderSection[];
  selectedId: string | null;
}

const STORAGE_KEY = "friendlydrop-visual-builder-state-v1";

const WIDGETS: Array<{ kind: BuilderSectionKind; label: string; description: string }> = [
  { kind: "hero", label: "Hero Section", description: "Large visual headline with CTA." },
  { kind: "product-grid", label: "Dynamic Product Grid", description: "Auto-pulls products from catalog." },
  { kind: "lookbook", label: "Lookbook Story", description: "Editorial grid for seasonal collections." },
  { kind: "offer-banner", label: "Offer Banner", description: "Flash sale strip with urgency copy." },
  { kind: "newsletter", label: "Newsletter Block", description: "Capture leads for campaigns." },
  { kind: "custom-code", label: "Custom HTML/CSS/JS", description: "Inject bespoke UI snippets." },
];

const TEMPLATE_PRESETS: Record<string, BuilderSection[]> = {
  "Luxury Launch": [
    {
      id: "tpl-hero",
      kind: "hero",
      title: "Runway 2026 Collection",
      subtitle: "Limited release with AI-guided styling.",
      ctaLabel: "Shop the launch",
      bg: "linear-gradient(135deg, #111827 0%, #5b4f3a 100%)",
      textColor: "#ffffff",
      customCode: "",
    },
    {
      id: "tpl-grid",
      kind: "product-grid",
      title: "Signature Picks",
      subtitle: "Dynamic bestsellers auto-synced from product inventory.",
      ctaLabel: "View all",
      bg: "linear-gradient(135deg, #f8f4ea 0%, #f0ede3 100%)",
      textColor: "#111111",
      customCode: "",
    },
  ],
  "Festival Sale": [
    {
      id: "tpl-offer",
      kind: "offer-banner",
      title: "Festival Couture Sale",
      subtitle: "Up to 40% off with instant AI bundle recommendations.",
      ctaLabel: "Claim offer",
      bg: "linear-gradient(135deg, #7f1d1d 0%, #1f2937 100%)",
      textColor: "#ffffff",
      customCode: "",
    },
    {
      id: "tpl-news",
      kind: "newsletter",
      title: "Join the VIP Waitlist",
      subtitle: "Get early access to private drops and launch previews.",
      ctaLabel: "Join now",
      bg: "linear-gradient(135deg, #131a26 0%, #2f3a53 100%)",
      textColor: "#ffffff",
      customCode: "",
    },
  ],
};

const INITIAL_SECTIONS: BuilderSection[] = [
  {
    id: "base-hero",
    kind: "hero",
    title: "Maison FriendlyDrop",
    subtitle: "Luxury fashion commerce with AI concierge experiences.",
    ctaLabel: "Explore now",
    bg: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    textColor: "#ffffff",
    customCode: "",
  },
  {
    id: "base-grid",
    kind: "product-grid",
    title: "Curated Collection Grid",
    subtitle: "Best sellers, seasonal edits, and new arrivals.",
    ctaLabel: "View collection",
    bg: "linear-gradient(135deg, #faf7ef 0%, #ece7dc 100%)",
    textColor: "#111111",
    customCode: "",
  },
];

function createSection(kind: BuilderSectionKind): BuilderSection {
  return {
    id: `${kind}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    kind,
    title: kind === "custom-code" ? "Custom Block" : "New Section",
    subtitle: "Edit this block from the properties panel.",
    ctaLabel: "Learn more",
    bg: "linear-gradient(135deg, #1f2937 0%, #334155 100%)",
    textColor: "#ffffff",
    customCode: '<div class="rounded-xl border p-4">Custom HTML</div>',
  };
}

export function VisualBuilder() {
  const [device, setDevice] = useState<BuilderDevice>("desktop");
  const [sections, setSections] = useState<BuilderSection[]>(INITIAL_SECTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_SECTIONS[0]?.id ?? null);
  const [past, setPast] = useState<BuilderState[]>([]);
  const [future, setFuture] = useState<BuilderState[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("Luxury Launch");

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedId) ?? null,
    [sections, selectedId],
  );

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as BuilderState;
      if (Array.isArray(parsed.sections) && parsed.sections.length > 0) {
        setSections(parsed.sections);
        setSelectedId(parsed.selectedId ?? parsed.sections[0].id);
      }
    } catch (error) {
      console.error("Builder state parse failed", error);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const payload: BuilderState = { sections, selectedId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedAt(new Date().toLocaleTimeString("en-IN"));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [sections, selectedId]);

  const commit = (nextSections: BuilderSection[], nextSelectedId: string | null = selectedId) => {
    setPast((prev) => [...prev.slice(-49), { sections, selectedId }]);
    setFuture([]);
    setSections(nextSections);
    setSelectedId(nextSelectedId);
  };

  const addSection = (kind: BuilderSectionKind) => {
    const next = createSection(kind);
    commit([...sections, next], next.id);
    toast.success(`${WIDGETS.find((item) => item.kind === kind)?.label ?? "Widget"} added`);
  };

  const removeSection = (id: string) => {
    const nextSections = sections.filter((section) => section.id !== id);
    const nextSelected = nextSections[0]?.id ?? null;
    commit(nextSections, nextSelected);
  };

  const updateSection = (id: string, patch: Partial<BuilderSection>) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const handleUndo = () => {
    if (!past.length) {
      return;
    }
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [{ sections, selectedId }, ...prev]);
    setSections(previous.sections);
    setSelectedId(previous.selectedId);
  };

  const handleRedo = () => {
    if (!future.length) {
      return;
    }
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev.slice(-49), { sections, selectedId }]);
    setSections(next.sections);
    setSelectedId(next.selectedId);
  };

  const applyTemplate = () => {
    const template = TEMPLATE_PRESETS[activeTemplate];
    if (!template) {
      return;
    }
    const stamped = template.map((section) => ({ ...section, id: `${section.id}-${Date.now()}` }));
    commit(stamped, stamped[0]?.id ?? null);
    toast.success(`${activeTemplate} template applied`);
  };

  const generateFromAiPrompt = () => {
    if (!aiPrompt.trim()) {
      toast.error("Add a prompt for AI assisted generation");
      return;
    }
    const prompt = aiPrompt.toLowerCase();
    const generated: BuilderSection[] = [];
    if (prompt.includes("sale")) {
      generated.push(createSection("offer-banner"));
    }
    if (prompt.includes("lookbook") || prompt.includes("editorial")) {
      generated.push(createSection("lookbook"));
    }
    if (prompt.includes("lead") || prompt.includes("newsletter")) {
      generated.push(createSection("newsletter"));
    }
    if (generated.length === 0) {
      generated.push(createSection("hero"), createSection("product-grid"));
    }
    commit([...sections, ...generated], generated[0].id);
    toast.success("AI generated new page blocks");
  };

  const exportState = () => {
    const payload: BuilderState = { sections, selectedId };
    navigator.clipboard
      .writeText(JSON.stringify(payload, null, 2))
      .then(() => toast.success("Builder JSON copied"))
      .catch(() => toast.error("Unable to copy builder JSON"));
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Elementor-style Visual Builder</p>
            <h1 className="font-display text-3xl font-semibold">Live Drag-and-Drop Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="gap-1" onClick={handleUndo} disabled={!past.length}>
              <Undo2 className="h-4 w-4" /> Undo
            </Button>
            <Button type="button" variant="outline" className="gap-1" onClick={handleRedo} disabled={!future.length}>
              <Redo2 className="h-4 w-4" /> Redo
            </Button>
            <Button type="button" className="gap-1" onClick={exportState}>
              <Save className="h-4 w-4" /> Export JSON
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Autosave every 5s {savedAt ? `• last save at ${savedAt}` : ""}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr_320px]">
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Widget Library</h2>
            <div className="mt-3 space-y-2">
              {WIDGETS.map((widget) => (
                <button
                  key={widget.kind}
                  type="button"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("application/x-builder-widget", widget.kind)}
                  onClick={() => addSection(widget.kind)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-black dark:border-slate-700 dark:hover:border-slate-300"
                >
                  <p className="text-sm font-semibold">{widget.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{widget.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Templates</label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={activeTemplate}
              onChange={(event) => setActiveTemplate(event.target.value)}
            >
              {Object.keys(TEMPLATE_PRESETS).map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" className="w-full" onClick={applyTemplate}>
              Apply Template
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">AI Assistant</label>
            <textarea
              className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Example: build a festive luxury sale landing page with newsletter capture"
            />
            <Button type="button" className="w-full gap-1" onClick={generateFromAiPrompt}>
              <Bot className="h-4 w-4" /> Generate Sections
            </Button>
          </div>
        </aside>

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Live Preview</h2>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-700">
              <button
                type="button"
                className={cn(
                  "rounded-lg p-2 transition",
                  device === "desktop" ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-600 dark:text-slate-300",
                )}
                onClick={() => setDevice("desktop")}
                aria-label="Desktop preview"
              >
                <Laptop className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-lg p-2 transition",
                  device === "tablet" ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-600 dark:text-slate-300",
                )}
                onClick={() => setDevice("tablet")}
                aria-label="Tablet preview"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-lg p-2 transition",
                  device === "mobile" ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-600 dark:text-slate-300",
                )}
                onClick={() => setDevice("mobile")}
                aria-label="Mobile preview"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="min-h-[560px] rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 p-4 dark:border-slate-700 dark:bg-slate-950/50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const widgetKind = event.dataTransfer.getData("application/x-builder-widget") as BuilderSectionKind;
              if (widgetKind) {
                addSection(widgetKind);
              }
            }}
          >
            <div
              className={cn(
                "mx-auto space-y-3 transition-all",
                device === "desktop" && "w-full",
                device === "tablet" && "w-[780px] max-w-full",
                device === "mobile" && "w-[390px] max-w-full",
              )}
            >
              {sections.map((section) => {
                const isActive = section.id === selectedId;
                return (
                  <article
                    key={section.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(section.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setSelectedId(section.id);
                      }
                    }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      isActive ? "border-black ring-2 ring-black/20 dark:border-white dark:ring-white/30" : "border-transparent",
                    )}
                    style={{ background: section.bg, color: section.textColor }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.14em] opacity-80">{section.kind.replace("-", " ")}</p>
                    <h3 className="mt-2 font-display text-3xl font-semibold">{section.title}</h3>
                    <p className="mt-1 text-sm opacity-90">{section.subtitle}</p>
                    <button type="button" className="mt-4 rounded-full bg-black/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                      {section.ctaLabel}
                    </button>
                    {section.kind === "custom-code" ? (
                      <div className="mt-4 rounded-xl bg-black/15 p-3 text-xs">
                        <p>Custom block placeholder rendered from admin code settings.</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Properties</h2>
          {selectedSection ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Title</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selectedSection.title}
                onChange={(event) => updateSection(selectedSection.id, { title: event.target.value })}
              />

              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Subtitle</label>
              <textarea
                className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selectedSection.subtitle}
                onChange={(event) => updateSection(selectedSection.id, { subtitle: event.target.value })}
              />

              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">CTA Label</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selectedSection.ctaLabel}
                onChange={(event) => updateSection(selectedSection.id, { ctaLabel: event.target.value })}
              />

              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Background CSS</label>
              <textarea
                className="min-h-16 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selectedSection.bg}
                onChange={(event) => updateSection(selectedSection.id, { bg: event.target.value })}
              />

              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Text Color</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selectedSection.textColor}
                onChange={(event) => updateSection(selectedSection.id, { textColor: event.target.value })}
              />

              {selectedSection.kind === "custom-code" ? (
                <>
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Custom HTML/CSS/JS</label>
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-950"
                    value={selectedSection.customCode}
                    onChange={(event) => updateSection(selectedSection.id, { customCode: event.target.value })}
                  />
                </>
              ) : null}

              <Button type="button" variant="destructive" className="w-full" onClick={() => removeSection(selectedSection.id)}>
                Remove Section
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a section from preview to edit properties.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
