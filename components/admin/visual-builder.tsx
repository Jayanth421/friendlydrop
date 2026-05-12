"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Copy,
  Eye,
  FolderTree,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Laptop,
  Layers,
  LayoutGrid,
  MonitorPlay,
  MousePointerClick,
  Palette,
  Plus,
  Redo2,
  Rocket,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Undo2,
  WandSparkles,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuilderDevice = "desktop" | "tablet" | "mobile";
type BuilderAlign = "left" | "center" | "right";
type BuilderWidth = "full" | "boxed";
type BuilderPanelTab = "components" | "pages" | "layers" | "navigator" | "assets" | "templates";
type BuilderSettingsTab = "style" | "motion" | "interaction" | "global" | "analytics";
type BuilderSectionKind =
  | "hero"
  | "feature-grid"
  | "product-grid"
  | "collection-grid"
  | "lookbook"
  | "banner"
  | "popup"
  | "mega-menu"
  | "blog-list"
  | "form"
  | "checkout-summary"
  | "custom-code";
type BuilderPageKind = "home" | "landing" | "product" | "collection" | "checkout" | "blog" | "header" | "footer";
type BuilderAnimationPreset = "none" | "fade-up" | "slide-right" | "zoom-in";
type BuilderInteractionAction = "none" | "open-popup" | "scroll-to-next" | "go-to-products" | "add-to-cart";

interface BuilderMotion {
  preset: BuilderAnimationPreset;
  durationMs: number;
  delayMs: number;
  hoverScale: number;
  scrollReveal: boolean;
}

interface BuilderSpacing {
  paddingX: number;
  paddingY: number;
  marginTop: number;
  marginBottom: number;
}

interface BuilderSection {
  id: string;
  kind: BuilderSectionKind;
  name: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  bg: string;
  textColor: string;
  borderColor: string;
  radius: number;
  alignment: BuilderAlign;
  width: BuilderWidth;
  minHeight: number;
  opacity: number;
  blur: number;
  spacing: BuilderSpacing;
  dataSource?: string;
  assetUrl?: string;
  customCode?: string;
  formFields?: string[];
  motion: BuilderMotion;
  interaction: BuilderInteractionAction;
  locked: boolean;
  hidden: boolean;
}

interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  kind: BuilderPageKind;
  menuItems: string[];
  sections: BuilderSection[];
}

interface BuilderGlobalTheme {
  fontFamily: string;
  primary: string;
  secondary: string;
  bgGradient: string;
  glassOpacity: number;
  neoBorderRadius: number;
}

interface BuilderProjectState {
  pages: BuilderPage[];
  activePageId: string;
  selectedSectionId: string | null;
  device: BuilderDevice;
  zoom: number;
  showGrid: boolean;
  snapGrid: boolean;
  rightTab: BuilderSettingsTab;
  leftTab: BuilderPanelTab;
  globalTheme: BuilderGlobalTheme;
  templates: BuilderSection[];
  assets: string[];
  collaborators: string[];
  liveCollabEnabled: boolean;
  lastPublishedAt?: string;
}

const STORAGE_KEY = "friendlydrop-builder-studio-v2";

const COMPONENT_LIBRARY: Array<{ kind: BuilderSectionKind; label: string; details: string }> = [
  { kind: "hero", label: "Hero", details: "Framer-style cinematic hero block." },
  { kind: "feature-grid", label: "Feature Grid", details: "Cards with iconography and quick highlights." },
  { kind: "product-grid", label: "Product Grid", details: "Dynamic catalog listing for eCommerce." },
  { kind: "collection-grid", label: "Collection Grid", details: "Editorial layout for seasonal categories." },
  { kind: "lookbook", label: "Lookbook", details: "Story-based layout with visual narratives." },
  { kind: "banner", label: "Banner", details: "Promo strip with discount messaging." },
  { kind: "popup", label: "Popup Builder", details: "Overlay section for lead capture/offers." },
  { kind: "mega-menu", label: "Mega Menu", details: "Header mega menu with columns and links." },
  { kind: "blog-list", label: "Blog List", details: "CMS-driven article cards." },
  { kind: "form", label: "Form Builder", details: "No-code forms with DB-ready field list." },
  { kind: "checkout-summary", label: "Checkout Block", details: "Cart summary and payment action area." },
  { kind: "custom-code", label: "Custom Code", details: "HTML/CSS/JS injection zone." },
];

const PAGE_TEMPLATES: Record<string, BuilderPage[]> = {
  "Fashion Launch System": [
    {
      id: "tpl-home",
      name: "Home",
      slug: "home",
      kind: "home",
      menuItems: ["Shop", "Collections", "Lookbook", "Contact"],
      sections: [buildSection("hero"), buildSection("feature-grid"), buildSection("product-grid"), buildSection("banner")],
    },
    {
      id: "tpl-collection",
      name: "Collection",
      slug: "collection",
      kind: "collection",
      menuItems: [],
      sections: [buildSection("collection-grid"), buildSection("lookbook")],
    },
    {
      id: "tpl-checkout",
      name: "Checkout",
      slug: "checkout",
      kind: "checkout",
      menuItems: [],
      sections: [buildSection("checkout-summary"), buildSection("form")],
    },
  ],
  "Content Commerce Stack": [
    {
      id: "tpl-blog-home",
      name: "Brand Journal",
      slug: "brand-journal",
      kind: "blog",
      menuItems: ["Stories", "Trends", "Runway"],
      sections: [buildSection("hero"), buildSection("blog-list"), buildSection("banner")],
    },
  ],
};

const DEFAULT_PROJECT: BuilderProjectState = {
  pages: [
    {
      id: "page-home",
      name: "Home",
      slug: "home",
      kind: "home",
      menuItems: ["Shop", "AI Stylist", "Lookbook", "Support"],
      sections: [buildSection("hero"), buildSection("feature-grid"), buildSection("product-grid")],
    },
    {
      id: "page-header",
      name: "Global Header",
      slug: "global-header",
      kind: "header",
      menuItems: ["Shop", "Collections", "Membership", "Contact"],
      sections: [buildSection("mega-menu")],
    },
    {
      id: "page-footer",
      name: "Global Footer",
      slug: "global-footer",
      kind: "footer",
      menuItems: [],
      sections: [buildSection("banner")],
    },
  ],
  activePageId: "page-home",
  selectedSectionId: null,
  device: "desktop",
  zoom: 100,
  showGrid: true,
  snapGrid: true,
  leftTab: "components",
  rightTab: "style",
  globalTheme: {
    fontFamily: "Cormorant Garamond",
    primary: "#0f172a",
    secondary: "#b9914f",
    bgGradient: "linear-gradient(135deg, #f8f4ea 0%, #e6dfce 100%)",
    glassOpacity: 72,
    neoBorderRadius: 20,
  },
  templates: [],
  assets: [
    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1200&q=80",
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=80",
  ],
  collaborators: ["Ava", "Milan", "Noah"],
  liveCollabEnabled: true,
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function buildSection(kind: BuilderSectionKind): BuilderSection {
  const base: BuilderSection = {
    id: makeId("section"),
    kind,
    name: kind.replaceAll("-", " "),
    title: "Premium Section",
    subtitle: "Click to edit content directly on canvas.",
    ctaLabel: "Explore",
    bg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    textColor: "#ffffff",
    borderColor: "rgba(255,255,255,0.25)",
    radius: 18,
    alignment: "left",
    width: "full",
    minHeight: 220,
    opacity: 100,
    blur: 0,
    spacing: { paddingX: 24, paddingY: 24, marginTop: 0, marginBottom: 14 },
    motion: {
      preset: "fade-up",
      durationMs: 550,
      delayMs: 0,
      hoverScale: 1.02,
      scrollReveal: true,
    },
    interaction: "none",
    locked: false,
    hidden: false,
  };

  if (kind === "hero") {
    return {
      ...base,
      title: "Design luxury pages in minutes",
      subtitle: "Build high-conversion storefronts with smooth no-code controls.",
      ctaLabel: "Start building",
      minHeight: 320,
      bg: "linear-gradient(135deg, #111827 0%, #5b4f3a 100%)",
    };
  }

  if (kind === "feature-grid") {
    return {
      ...base,
      title: "Builder intelligence",
      subtitle: "Animations, CMS blocks, eCommerce widgets, and responsive controls.",
      ctaLabel: "See capabilities",
      bg: "linear-gradient(135deg, #101828 0%, #1f2937 100%)",
    };
  }

  if (kind === "product-grid") {
    return {
      ...base,
      title: "Dynamic product feed",
      subtitle: "Filter, sort, and personalize collections in real time.",
      ctaLabel: "Shop now",
      dataSource: "products",
      bg: "linear-gradient(135deg, #f8f4ea 0%, #ece6d7 100%)",
      textColor: "#111111",
      borderColor: "rgba(0,0,0,0.14)",
    };
  }

  if (kind === "collection-grid") {
    return {
      ...base,
      title: "Collection story",
      subtitle: "Show trend capsules and seasonal edits with editorial rhythm.",
      dataSource: "collections",
    };
  }

  if (kind === "lookbook") {
    return {
      ...base,
      title: "Runway lookbook",
      subtitle: "Map looks, accessories, and AI style suggestions.",
      ctaLabel: "Open lookbook",
      bg: "linear-gradient(135deg, #111827 0%, #0f766e 100%)",
    };
  }

  if (kind === "banner") {
    return {
      ...base,
      title: "Flash sale ends tonight",
      subtitle: "Use countdown, coupon code, and urgency CTA.",
      ctaLabel: "Claim offer",
      minHeight: 160,
      bg: "linear-gradient(135deg, #7f1d1d 0%, #1f2937 100%)",
      interaction: "go-to-products",
    };
  }

  if (kind === "popup") {
    return {
      ...base,
      title: "VIP popup",
      subtitle: "Capture email and WhatsApp for private launches.",
      ctaLabel: "Join waitlist",
      interaction: "open-popup",
      minHeight: 190,
    };
  }

  if (kind === "mega-menu") {
    return {
      ...base,
      title: "Mega menu layout",
      subtitle: "Men | Women | Kids | New Arrivals | Sale | Designers",
      ctaLabel: "Edit navigation",
      minHeight: 160,
      bg: "linear-gradient(135deg, #020617 0%, #1e293b 100%)",
    };
  }

  if (kind === "blog-list") {
    return {
      ...base,
      title: "Journal feed",
      subtitle: "Connect to CMS and auto-render latest posts.",
      ctaLabel: "Read now",
      dataSource: "blog",
      bg: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    };
  }

  if (kind === "form") {
    return {
      ...base,
      title: "Lead form",
      subtitle: "Name, email, and styling preference fields.",
      ctaLabel: "Submit",
      formFields: ["Full Name", "Email", "Style Preference"],
      minHeight: 180,
      bg: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    };
  }

  if (kind === "checkout-summary") {
    return {
      ...base,
      title: "Checkout custom block",
      subtitle: "Order summary, coupon, shipping estimate, and trust badges.",
      ctaLabel: "Continue to payment",
      interaction: "add-to-cart",
      minHeight: 210,
      bg: "linear-gradient(135deg, #f8f4ea 0%, #ece6d7 100%)",
      textColor: "#111111",
      borderColor: "rgba(0,0,0,0.14)",
    };
  }

  return {
    ...base,
    title: "Custom code region",
    subtitle: "Inject controlled HTML/CSS/JS for advanced needs.",
    ctaLabel: "Validate code",
    customCode: "<div class='my-custom-block'>Custom block</div>",
    minHeight: 180,
  };
}

function getCanvasWidth(device: BuilderDevice) {
  if (device === "mobile") return "w-[390px] max-w-full";
  if (device === "tablet") return "w-[860px] max-w-full";
  return "w-full";
}

export function VisualBuilder() {
  const [project, setProject] = useState<BuilderProjectState>(DEFAULT_PROJECT);
  const [historyPast, setHistoryPast] = useState<BuilderProjectState[]>([]);
  const [historyFuture, setHistoryFuture] = useState<BuilderProjectState[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [templatePreset, setTemplatePreset] = useState(Object.keys(PAGE_TEMPLATES)[0]);

  const activePage = useMemo(
    () => project.pages.find((page) => page.id === project.activePageId) ?? project.pages[0],
    [project.pages, project.activePageId],
  );

  const selectedSection = useMemo(
    () => activePage?.sections.find((section) => section.id === project.selectedSectionId) ?? null,
    [activePage, project.selectedSectionId],
  );

  const stats = useMemo(() => {
    const sectionCount = project.pages.reduce((sum, page) => sum + page.sections.length, 0);
    const hiddenCount = project.pages.reduce((sum, page) => sum + page.sections.filter((section) => section.hidden).length, 0);
    const interactiveCount = project.pages.reduce(
      (sum, page) => sum + page.sections.filter((section) => section.interaction !== "none").length,
      0,
    );
    return {
      pages: project.pages.length,
      sections: sectionCount,
      hidden: hiddenCount,
      interactions: interactiveCount,
      performanceScore: Math.max(72, 100 - sectionCount),
    };
  }, [project.pages]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as BuilderProjectState;
      if (parsed?.pages?.length) {
        setProject(parsed);
      }
    } catch (error) {
      console.error("Could not parse builder state", error);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSavedAt(new Date().toLocaleTimeString("en-IN"));
    }, 4500);

    return () => window.clearInterval(timer);
  }, [project]);

  const commit = (updater: (prev: BuilderProjectState) => BuilderProjectState) => {
    setProject((prev) => {
      const snapshot = deepClone(prev);
      const next = updater(prev);
      if (JSON.stringify(next) === JSON.stringify(prev)) {
        return prev;
      }
      setHistoryPast((old) => [...old.slice(-79), snapshot]);
      setHistoryFuture([]);
      return next;
    });
  };

  const updateActivePage = (updater: (page: BuilderPage) => BuilderPage) => {
    commit((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => (page.id === prev.activePageId ? updater(page) : page)),
    }));
  };

  const addSection = (kind: BuilderSectionKind) => {
    const section = buildSection(kind);
    updateActivePage((page) => ({ ...page, sections: [...page.sections, section] }));
    commit((prev) => ({ ...prev, selectedSectionId: section.id }));
    toast.success(`${kind.replace("-", " ")} added`);
  };

  const updateSection = (sectionId: string, patch: Partial<BuilderSection>) => {
    updateActivePage((page) => ({
      ...page,
      sections: page.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    }));
  };

  const removeSection = (sectionId: string) => {
    updateActivePage((page) => ({
      ...page,
      sections: page.sections.filter((section) => section.id !== sectionId),
    }));
    commit((prev) => ({ ...prev, selectedSectionId: null }));
  };

  const duplicateSection = (sectionId: string) => {
    updateActivePage((page) => {
      const source = page.sections.find((section) => section.id === sectionId);
      if (!source) return page;
      const copy = { ...deepClone(source), id: makeId("section"), name: `${source.name} copy` };
      const index = page.sections.findIndex((section) => section.id === sectionId);
      const next = [...page.sections];
      next.splice(index + 1, 0, copy);
      return { ...page, sections: next };
    });
  };

  const saveSectionAsTemplate = () => {
    if (!selectedSection) {
      toast.error("Select a section first");
      return;
    }
    commit((prev) => ({
      ...prev,
      templates: [...prev.templates, { ...deepClone(selectedSection), id: makeId("template"), name: `${selectedSection.name} template` }],
    }));
    toast.success("Template saved");
  };

  const applyTemplatePreset = () => {
    const preset = PAGE_TEMPLATES[templatePreset];
    if (!preset) return;
    commit((prev) => {
      const pages = preset.map((page) => ({
        ...deepClone(page),
        id: makeId("page"),
        sections: page.sections.map((section) => ({ ...deepClone(section), id: makeId("section") })),
      }));
      return {
        ...prev,
        pages,
        activePageId: pages[0]?.id ?? prev.activePageId,
        selectedSectionId: pages[0]?.sections[0]?.id ?? null,
      };
    });
    toast.success("Template system applied");
  };

  const addPage = (kind: BuilderPageKind) => {
    const page: BuilderPage = {
      id: makeId("page"),
      name: kind.charAt(0).toUpperCase() + kind.slice(1),
      slug: kind === "home" ? "home" : `${kind}-${Math.floor(Math.random() * 90 + 10)}`,
      kind,
      menuItems: kind === "header" ? ["Shop", "Collections", "Offers"] : [],
      sections: [buildSection(kind === "checkout" ? "checkout-summary" : "hero")],
    };
    commit((prev) => ({
      ...prev,
      pages: [...prev.pages, page],
      activePageId: page.id,
      selectedSectionId: page.sections[0]?.id ?? null,
    }));
  };

  const deletePage = (pageId: string) => {
    if (project.pages.length <= 1) {
      toast.error("At least one page is required");
      return;
    }
    commit((prev) => {
      const pages = prev.pages.filter((page) => page.id !== pageId);
      const activePageId = prev.activePageId === pageId ? pages[0].id : prev.activePageId;
      const active = pages.find((page) => page.id === activePageId) ?? pages[0];
      return {
        ...prev,
        pages,
        activePageId,
        selectedSectionId: active.sections[0]?.id ?? null,
      };
    });
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    updateActivePage((page) => {
      const index = page.sections.findIndex((section) => section.id === sectionId);
      if (index < 0) return page;
      if (direction === "up" && index === 0) return page;
      if (direction === "down" && index === page.sections.length - 1) return page;
      const target = direction === "up" ? index - 1 : index + 1;
      const next = [...page.sections];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...page, sections: next };
    });
  };

  const handleUndo = () => {
    const previous = historyPast[historyPast.length - 1];
    if (!previous) return;
    setHistoryPast((prev) => prev.slice(0, -1));
    setHistoryFuture((prev) => [deepClone(project), ...prev]);
    setProject(previous);
  };

  const handleRedo = () => {
    const next = historyFuture[0];
    if (!next) return;
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev.slice(-79), deepClone(project)]);
    setProject(next);
  };

  const publishProject = () => {
    commit((prev) => ({ ...prev, lastPublishedAt: new Date().toISOString() }));
    toast.success("Published. Hosting pipeline queued.");
  };

  const runAiSuggestions = () => {
    if (!aiPrompt.trim()) {
      toast.error("Enter a prompt for AI suggestions");
      return;
    }
    const prompt = aiPrompt.toLowerCase();
    if (prompt.includes("blog")) addSection("blog-list");
    if (prompt.includes("popup") || prompt.includes("banner")) addSection("popup");
    if (prompt.includes("checkout")) addSection("checkout-summary");
    if (!prompt.includes("blog") && !prompt.includes("popup") && !prompt.includes("banner") && !prompt.includes("checkout")) {
      addSection("feature-grid");
      addSection("banner");
    }
    toast.success("AI suggestions inserted");
  };

  const addAsset = (url: string) => {
    if (!url.trim()) return;
    commit((prev) => ({ ...prev, assets: [url.trim(), ...prev.assets] }));
  };

  const exportProject = () => {
    navigator.clipboard
      .writeText(JSON.stringify(project, null, 2))
      .then(() => toast.success("Project JSON copied"))
      .catch(() => toast.error("Unable to copy project"));
  };

  const selectedPresenceColor = ["bg-rose-500", "bg-cyan-500", "bg-amber-500"];

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Next-generation no-code studio</p>
            <h1 className="font-display text-3xl font-semibold">Framer + Elementor Builder Platform</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleUndo} disabled={!historyPast.length}>
              <Undo2 className="mr-1 h-4 w-4" /> Undo
            </Button>
            <Button type="button" variant="outline" onClick={handleRedo} disabled={!historyFuture.length}>
              <Redo2 className="mr-1 h-4 w-4" /> Redo
            </Button>
            <Button type="button" variant="outline" onClick={exportProject}>
              <Save className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button type="button" onClick={publishProject}>
              <Rocket className="mr-1 h-4 w-4" /> One-click Publish
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span>Autosave every 4.5s{savedAt ? ` | last save ${savedAt}` : ""}</span>
          <span>Realtime collaboration: {project.liveCollabEnabled ? "enabled" : "disabled"}</span>
          <span>{project.lastPublishedAt ? `Published at ${new Date(project.lastPublishedAt).toLocaleString("en-IN")}` : "Not published yet"}</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr_340px]">
        <aside className="glass-panel rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1 rounded-xl border border-slate-300/60 p-1 dark:border-slate-700">
            {[
              { key: "components", label: "Components", icon: LayoutGrid },
              { key: "pages", label: "Pages", icon: Globe },
              { key: "layers", label: "Layers", icon: Layers },
              { key: "navigator", label: "Navigator", icon: FolderTree },
              { key: "assets", label: "Assets", icon: ImageIcon },
              { key: "templates", label: "Templates", icon: Copy },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = project.leftTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={cn(
                    "inline-flex flex-1 items-center justify-center rounded-lg px-2 py-1 text-[11px] font-semibold transition",
                    active ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-600 dark:text-slate-300",
                  )}
                  onClick={() => commit((prev) => ({ ...prev, leftTab: tab.key as BuilderPanelTab }))}
                >
                  <Icon className="mr-1 h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {project.leftTab === "components" ? (
            <div className="space-y-2">
              {COMPONENT_LIBRARY.map((item) => (
                <button
                  key={item.kind}
                  type="button"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("application/x-builder-component", item.kind)}
                  onClick={() => addSection(item.kind)}
                  className="w-full rounded-xl border border-slate-300/60 bg-white/70 p-3 text-left transition hover:border-black dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-300"
                >
                  <p className="text-sm font-semibold capitalize">{item.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.details}</p>
                </button>
              ))}

              <div className="rounded-xl border border-slate-300/60 p-3 dark:border-slate-700">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">AI design suggestion</label>
                <textarea
                  className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="Generate a premium festive home page with popup and checkout blocks"
                />
                <Button type="button" className="mt-2 w-full" onClick={runAiSuggestions}>
                  <Bot className="mr-1 h-4 w-4" /> Generate
                </Button>
              </div>
            </div>
          ) : null}

          {project.leftTab === "pages" ? (
            <div className="space-y-2">
              {project.pages.map((page) => (
                <div
                  key={page.id}
                  className={cn(
                    "rounded-xl border p-2",
                    project.activePageId === page.id
                      ? "border-black bg-white dark:border-white dark:bg-slate-900/70"
                      : "border-slate-300/60 bg-white/70 dark:border-slate-700 dark:bg-slate-900/40",
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() =>
                      commit((prev) => ({
                        ...prev,
                        activePageId: page.id,
                        selectedSectionId: page.sections[0]?.id ?? null,
                      }))
                    }
                  >
                    <p className="text-sm font-semibold">{page.name}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">/{page.slug} | {page.kind}</p>
                  </button>
                  <div className="mt-2 flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        commit((prev) => ({
                          ...prev,
                          pages: prev.pages.map((item) =>
                            item.id === page.id ? { ...item, name: `${item.name} Copy`, id: makeId("page"), slug: `${item.slug}-copy` } : item,
                          ),
                        }))
                      }
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" /> Duplicate
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => deletePage(page.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                {(["landing", "product", "collection", "checkout", "blog", "header", "footer"] as BuilderPageKind[]).map((kind) => (
                  <Button key={kind} type="button" size="sm" variant="outline" onClick={() => addPage(kind)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> {kind}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {project.leftTab === "layers" ? (
            <div className="space-y-2">
              {activePage.sections.map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    "rounded-lg border p-2",
                    project.selectedSectionId === section.id ? "border-black dark:border-white" : "border-slate-300/60 dark:border-slate-700",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2 text-left"
                      onClick={() => commit((prev) => ({ ...prev, selectedSectionId: section.id }))}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate text-sm font-semibold capitalize">{section.name}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-1 text-xs dark:border-slate-700"
                        onClick={() => moveSection(section.id, "up")}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-1 text-xs dark:border-slate-700"
                        onClick={() => moveSection(section.id, "down")}
                      >
                        Down
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1 text-[11px]">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-1 py-0.5 dark:border-slate-700"
                      onClick={() => updateSection(section.id, { hidden: !section.hidden })}
                    >
                      {section.hidden ? "Show" : "Hide"}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-1 py-0.5 dark:border-slate-700"
                      onClick={() => updateSection(section.id, { locked: !section.locked })}
                    >
                      {section.locked ? "Unlock" : "Lock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {project.leftTab === "navigator" ? (
            <div className="space-y-2 text-sm">
              {project.pages.map((page) => (
                <div key={page.id} className="rounded-xl border border-slate-300/60 p-2 dark:border-slate-700">
                  <p className="font-semibold">{page.name}</p>
                  <div className="mt-1 space-y-1 pl-3 text-xs text-slate-600 dark:text-slate-300">
                    {page.sections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        className="block text-left capitalize hover:underline"
                        onClick={() =>
                          commit((prev) => ({
                            ...prev,
                            activePageId: page.id,
                            selectedSectionId: section.id,
                          }))
                        }
                      >
                        - {section.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {project.leftTab === "assets" ? (
            <AssetManager assets={project.assets} onAddAsset={addAsset} />
          ) : null}

          {project.leftTab === "templates" ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Preset bundles</label>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={templatePreset}
                  onChange={(event) => setTemplatePreset(event.target.value)}
                >
                  {Object.keys(PAGE_TEMPLATES).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <Button type="button" className="mt-2 w-full" variant="outline" onClick={applyTemplatePreset}>
                  Apply System
                </Button>
              </div>

              <Button type="button" className="w-full" onClick={saveSectionAsTemplate}>
                Save Selected Section as Template
              </Button>

              <div className="space-y-2">
                {project.templates.length ? (
                  project.templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="w-full rounded-xl border border-slate-300/60 p-2 text-left dark:border-slate-700"
                      onClick={() => {
                        const section = { ...deepClone(template), id: makeId("section") };
                        updateActivePage((page) => ({ ...page, sections: [...page.sections, section] }));
                        toast.success("Template inserted");
                      }}
                    >
                      <p className="text-sm font-semibold capitalize">{template.name}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{template.kind}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No saved templates yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-3">
          <section className="glass-panel rounded-2xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{activePage.name}</p>
                <h2 className="text-lg font-semibold">
                  /{activePage.slug} | {activePage.kind}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-slate-300/60 p-1 dark:border-slate-700">
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg p-2",
                      project.device === "desktop" ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-500",
                    )}
                    onClick={() => commit((prev) => ({ ...prev, device: "desktop" }))}
                  >
                    <Laptop className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg p-2",
                      project.device === "tablet" ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-500",
                    )}
                    onClick={() => commit((prev) => ({ ...prev, device: "tablet" }))}
                  >
                    <Tablet className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg p-2",
                      project.device === "mobile" ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-500",
                    )}
                    onClick={() => commit((prev) => ({ ...prev, device: "mobile" }))}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>

                <label className="inline-flex items-center gap-1 text-xs">
                  <ZoomIn className="h-3.5 w-3.5" />
                  <input
                    type="range"
                    min={50}
                    max={140}
                    step={5}
                    value={project.zoom}
                    onChange={(event) => commit((prev) => ({ ...prev, zoom: Number(event.target.value) }))}
                  />
                  <span>{project.zoom}%</span>
                </label>

                <label className="inline-flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={project.showGrid}
                    onChange={(event) => commit((prev) => ({ ...prev, showGrid: event.target.checked }))}
                  />
                  Grid
                </label>
                <label className="inline-flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={project.snapGrid}
                    onChange={(event) => commit((prev) => ({ ...prev, snapGrid: event.target.checked }))}
                  />
                  Snap
                </label>
              </div>
            </div>
          </section>

          <section
            className={cn(
              "relative min-h-[660px] overflow-auto rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700",
              project.showGrid
                ? "bg-[linear-gradient(rgba(148,163,184,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.13)_1px,transparent_1px)] bg-[size:24px_24px]"
                : "bg-slate-100/60 dark:bg-slate-950/45",
            )}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const kind = event.dataTransfer.getData("application/x-builder-component") as BuilderSectionKind;
              if (kind) addSection(kind);
            }}
          >
            <div className="mx-auto origin-top" style={{ transform: `scale(${project.zoom / 100})` }}>
              <div className={cn("mx-auto space-y-3 transition-all", getCanvasWidth(project.device))}>
                {activePage.sections.map((section) => {
                  const active = section.id === project.selectedSectionId;
                  if (section.hidden) return null;

                  return (
                    <article
                      key={section.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "relative rounded-xl border transition",
                        active ? "ring-2 ring-black/25 dark:ring-white/35" : "",
                        section.locked ? "opacity-80" : "hover:-translate-y-0.5",
                        section.width === "boxed" ? "mx-auto max-w-4xl" : "",
                      )}
                      onClick={() => !section.locked && commit((prev) => ({ ...prev, selectedSectionId: section.id }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !section.locked) {
                          commit((prev) => ({ ...prev, selectedSectionId: section.id }));
                        }
                      }}
                      style={{
                        background: section.bg,
                        color: section.textColor,
                        borderColor: section.borderColor,
                        borderRadius: section.radius,
                        minHeight: section.minHeight,
                        opacity: section.opacity / 100,
                        filter: section.blur ? `blur(${section.blur}px)` : "none",
                        padding: `${section.spacing.paddingY}px ${section.spacing.paddingX}px`,
                        marginTop: section.spacing.marginTop,
                        marginBottom: section.spacing.marginBottom,
                        textAlign: section.alignment,
                      }}
                    >
                      <div className="absolute -top-2 left-3 rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white dark:bg-white dark:text-black">
                        {section.kind}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide opacity-80">
                        <span>{section.motion.preset}</span>
                        <span>{section.motion.durationMs}ms</span>
                        <span>{section.interaction}</span>
                        {section.dataSource ? <span>source: {section.dataSource}</span> : null}
                      </div>

                      <h3
                        className="mt-3 font-display text-4xl font-semibold outline-none"
                        contentEditable={!section.locked}
                        suppressContentEditableWarning
                        onBlur={(event) => updateSection(section.id, { title: event.currentTarget.innerText })}
                      >
                        {section.title}
                      </h3>
                      <p
                        className="mt-2 text-sm opacity-90 outline-none"
                        contentEditable={!section.locked}
                        suppressContentEditableWarning
                        onBlur={(event) => updateSection(section.id, { subtitle: event.currentTarget.innerText })}
                      >
                        {section.subtitle}
                      </p>

                      {section.assetUrl ? (
                        <img src={section.assetUrl} alt={section.title} className="mt-3 h-36 w-full rounded-lg object-cover" />
                      ) : null}

                      {section.kind === "form" ? (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {(section.formFields ?? []).map((field) => (
                            <input
                              key={`${section.id}-${field}`}
                              placeholder={field}
                              className="h-9 rounded-md border border-white/30 bg-white/10 px-2 text-sm text-white placeholder:text-white/70"
                              readOnly
                            />
                          ))}
                        </div>
                      ) : null}

                      {section.kind === "custom-code" && section.customCode ? (
                        <pre className="mt-3 overflow-auto rounded-lg bg-black/20 p-2 text-xs">{section.customCode}</pre>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-black/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white dark:bg-white/95 dark:text-black"
                        >
                          {section.ctaLabel}
                        </button>
                        {project.snapGrid ? (
                          <span className="rounded-full border border-white/30 px-2 py-1 text-[10px] uppercase tracking-wide">Snap guides on</span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <aside className="glass-panel rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1 rounded-xl border border-slate-300/60 p-1 dark:border-slate-700">
            {[
              { key: "style", label: "Style", icon: Palette },
              { key: "motion", label: "Motion", icon: Sparkles },
              { key: "interaction", label: "Interaction", icon: MousePointerClick },
              { key: "global", label: "Global", icon: WandSparkles },
              { key: "analytics", label: "Analytics", icon: MonitorPlay },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = project.rightTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={cn(
                    "inline-flex flex-1 items-center justify-center rounded-lg px-2 py-1 text-[11px] font-semibold transition",
                    active ? "bg-black text-white dark:bg-white dark:text-black" : "text-slate-600 dark:text-slate-300",
                  )}
                  onClick={() => commit((prev) => ({ ...prev, rightTab: tab.key as BuilderSettingsTab }))}
                >
                  <Icon className="mr-1 h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {project.rightTab === "style" ? (
            selectedSection ? (
              <StylePanel
                section={selectedSection}
                assets={project.assets}
                onChange={(patch) => updateSection(selectedSection.id, patch)}
                onDelete={() => removeSection(selectedSection.id)}
                onDuplicate={() => duplicateSection(selectedSection.id)}
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a section to edit style controls.</p>
            )
          ) : null}

          {project.rightTab === "motion" ? (
            selectedSection ? (
              <MotionPanel section={selectedSection} onChange={(patch) => updateSection(selectedSection.id, patch)} />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a section to configure animation timeline.</p>
            )
          ) : null}

          {project.rightTab === "interaction" ? (
            selectedSection ? (
              <InteractionPanel
                section={selectedSection}
                onChange={(patch) => updateSection(selectedSection.id, patch)}
                onSaveTemplate={saveSectionAsTemplate}
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a section for interaction builder.</p>
            )
          ) : null}

          {project.rightTab === "global" ? (
            <GlobalPanel project={project} onChange={(next) => commit(() => next)} />
          ) : null}

          {project.rightTab === "analytics" ? (
            <AnalyticsPanel
              stats={stats}
              collaborators={project.collaborators}
              liveCollabEnabled={project.liveCollabEnabled}
              onToggleCollab={(enabled) => commit((prev) => ({ ...prev, liveCollabEnabled: enabled }))}
            />
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function AssetManager({ assets, onAddAsset }: { assets: string[]; onAddAsset: (url: string) => void }) {
  const [url, setUrl] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://image-url"
          className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onAddAsset(url);
            setUrl("");
          }}
        >
          Add
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {assets.map((asset) => (
          <img key={asset} src={asset} alt="asset" className="h-20 w-full rounded-lg object-cover" />
        ))}
      </div>
    </div>
  );
}

function StylePanel({
  section,
  assets,
  onChange,
  onDelete,
  onDuplicate,
}: {
  section: BuilderSection;
  assets: string[];
  onChange: (patch: Partial<BuilderSection>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{section.kind} style controls</p>
      <input className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.name} onChange={(event) => onChange({ name: event.target.value })} />
      <input className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.ctaLabel} onChange={(event) => onChange({ ctaLabel: event.target.value })} placeholder="CTA label" />
      <textarea className="min-h-16 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.bg} onChange={(event) => onChange({ bg: event.target.value })} placeholder="Background CSS" />
      <div className="grid grid-cols-2 gap-2">
        <input className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.textColor} onChange={(event) => onChange({ textColor: event.target.value })} placeholder="Text color" />
        <input className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.borderColor} onChange={(event) => onChange({ borderColor: event.target.value })} placeholder="Border color" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">
          Radius
          <input type="range" min={0} max={50} value={section.radius} onChange={(event) => onChange({ radius: Number(event.target.value) })} className="w-full" />
        </label>
        <label className="text-xs">
          Height
          <input type="range" min={120} max={520} value={section.minHeight} onChange={(event) => onChange({ minHeight: Number(event.target.value) })} className="w-full" />
        </label>
        <label className="text-xs">
          Opacity
          <input type="range" min={30} max={100} value={section.opacity} onChange={(event) => onChange({ opacity: Number(event.target.value) })} className="w-full" />
        </label>
        <label className="text-xs">
          Blur
          <input type="range" min={0} max={8} value={section.blur} onChange={(event) => onChange({ blur: Number(event.target.value) })} className="w-full" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.alignment} onChange={(event) => onChange({ alignment: event.target.value as BuilderAlign })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
        <select className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.width} onChange={(event) => onChange({ width: event.target.value as BuilderWidth })}>
          <option value="full">Full width</option>
          <option value="boxed">Boxed width</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label>
          Pad X
          <input
            type="number"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={section.spacing.paddingX}
            onChange={(event) => onChange({ spacing: { ...section.spacing, paddingX: Number(event.target.value) || 0 } })}
          />
        </label>
        <label>
          Pad Y
          <input
            type="number"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={section.spacing.paddingY}
            onChange={(event) => onChange({ spacing: { ...section.spacing, paddingY: Number(event.target.value) || 0 } })}
          />
        </label>
        <label>
          Margin Top
          <input
            type="number"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={section.spacing.marginTop}
            onChange={(event) => onChange({ spacing: { ...section.spacing, marginTop: Number(event.target.value) || 0 } })}
          />
        </label>
        <label>
          Margin Bottom
          <input
            type="number"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={section.spacing.marginBottom}
            onChange={(event) => onChange({ spacing: { ...section.spacing, marginBottom: Number(event.target.value) || 0 } })}
          />
        </label>
      </div>

      <select className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.assetUrl ?? ""} onChange={(event) => onChange({ assetUrl: event.target.value || undefined })}>
        <option value="">Attach asset (optional)</option>
        {assets.map((asset) => (
          <option key={asset} value={asset}>
            {asset}
          </option>
        ))}
      </select>

      {section.kind === "form" ? (
        <textarea
          className="min-h-16 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          value={(section.formFields ?? []).join(", ")}
          onChange={(event) => onChange({ formFields: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
          placeholder="Form fields comma separated"
        />
      ) : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onDuplicate}>
          Duplicate
        </Button>
        <Button type="button" variant="destructive" className="flex-1" onClick={onDelete}>
          Remove
        </Button>
      </div>
    </div>
  );
}

function MotionPanel({ section, onChange }: { section: BuilderSection; onChange: (patch: Partial<BuilderSection>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Timeline editor</p>
      <select className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.motion.preset} onChange={(event) => onChange({ motion: { ...section.motion, preset: event.target.value as BuilderAnimationPreset } })}>
        <option value="none">No animation</option>
        <option value="fade-up">Fade up</option>
        <option value="slide-right">Slide right</option>
        <option value="zoom-in">Zoom in</option>
      </select>
      <label className="text-xs">
        Duration {section.motion.durationMs}ms
        <input type="range" min={100} max={2000} step={50} value={section.motion.durationMs} onChange={(event) => onChange({ motion: { ...section.motion, durationMs: Number(event.target.value) } })} className="w-full" />
      </label>
      <label className="text-xs">
        Delay {section.motion.delayMs}ms
        <input type="range" min={0} max={1400} step={50} value={section.motion.delayMs} onChange={(event) => onChange({ motion: { ...section.motion, delayMs: Number(event.target.value) } })} className="w-full" />
      </label>
      <label className="text-xs">
        Hover scale {section.motion.hoverScale.toFixed(2)}
        <input type="range" min={1} max={1.2} step={0.01} value={section.motion.hoverScale} onChange={(event) => onChange({ motion: { ...section.motion, hoverScale: Number(event.target.value) } })} className="w-full" />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={section.motion.scrollReveal} onChange={(event) => onChange({ motion: { ...section.motion, scrollReveal: event.target.checked } })} />
        Scroll reveal enabled
      </label>
      <div className="rounded-lg border border-slate-300/60 p-2 text-xs dark:border-slate-700">
        <p className="font-semibold">No-code interaction timeline</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Use preset + delay to orchestrate staged section reveals and hover behavior.</p>
      </div>
    </div>
  );
}

function InteractionPanel({
  section,
  onChange,
  onSaveTemplate,
}: {
  section: BuilderSection;
  onChange: (patch: Partial<BuilderSection>) => void;
  onSaveTemplate: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">No-code interaction builder</p>
      <select className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.interaction} onChange={(event) => onChange({ interaction: event.target.value as BuilderInteractionAction })}>
        <option value="none">None</option>
        <option value="open-popup">Open popup</option>
        <option value="scroll-to-next">Scroll to next section</option>
        <option value="go-to-products">Navigate to products</option>
        <option value="add-to-cart">Add to cart action</option>
      </select>
      <input className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.dataSource ?? ""} onChange={(event) => onChange({ dataSource: event.target.value || undefined })} placeholder="Dynamic source (products, blog, collections)" />
      <textarea className="min-h-20 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={section.customCode ?? ""} onChange={(event) => onChange({ customCode: event.target.value || undefined })} placeholder="Optional custom code injection" />
      <Button type="button" className="w-full" variant="outline" onClick={onSaveTemplate}>
        Save as reusable block
      </Button>
      <div className="rounded-lg border border-slate-300/60 p-2 text-xs dark:border-slate-700">
        <p className="font-semibold">Component states and variants</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Each block supports editable hover scale, scroll reveal, action routing, and dynamic source mapping.</p>
      </div>
    </div>
  );
}

function GlobalPanel({ project, onChange }: { project: BuilderProjectState; onChange: (next: BuilderProjectState) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Global styles and site structure</p>
      <input className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={project.globalTheme.fontFamily} onChange={(event) => onChange({ ...project, globalTheme: { ...project.globalTheme, fontFamily: event.target.value } })} placeholder="Global font family" />
      <div className="grid grid-cols-2 gap-2">
        <input className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={project.globalTheme.primary} onChange={(event) => onChange({ ...project, globalTheme: { ...project.globalTheme, primary: event.target.value } })} placeholder="Primary color" />
        <input className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={project.globalTheme.secondary} onChange={(event) => onChange({ ...project, globalTheme: { ...project.globalTheme, secondary: event.target.value } })} placeholder="Secondary color" />
      </div>
      <textarea className="min-h-16 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={project.globalTheme.bgGradient} onChange={(event) => onChange({ ...project, globalTheme: { ...project.globalTheme, bgGradient: event.target.value } })} placeholder="Background gradient" />
      <label className="text-xs">
        Glass opacity {project.globalTheme.glassOpacity}%
        <input type="range" min={20} max={95} value={project.globalTheme.glassOpacity} onChange={(event) => onChange({ ...project, globalTheme: { ...project.globalTheme, glassOpacity: Number(event.target.value) } })} className="w-full" />
      </label>
      <label className="text-xs">
        Neo border radius {project.globalTheme.neoBorderRadius}px
        <input type="range" min={0} max={34} value={project.globalTheme.neoBorderRadius} onChange={(event) => onChange({ ...project, globalTheme: { ...project.globalTheme, neoBorderRadius: Number(event.target.value) } })} className="w-full" />
      </label>

      <div className="rounded-lg border border-slate-300/60 p-2 text-xs dark:border-slate-700">
        <p className="font-semibold">Header and mega menu structure</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Edit header/footer pages from the Pages panel. Menu items are stored per page and can drive mega-menu sections.</p>
      </div>
    </div>
  );
}

function AnalyticsPanel({
  stats,
  collaborators,
  liveCollabEnabled,
  onToggleCollab,
}: {
  stats: { pages: number; sections: number; hidden: number; interactions: number; performanceScore: number };
  collaborators: string[];
  liveCollabEnabled: boolean;
  onToggleCollab: (enabled: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Live analytics and collaboration</p>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Pages" value={String(stats.pages)} />
        <StatCard label="Sections" value={String(stats.sections)} />
        <StatCard label="Hidden Layers" value={String(stats.hidden)} />
        <StatCard label="Interactions" value={String(stats.interactions)} />
      </div>

      <div className="rounded-lg border border-slate-300/60 p-3 text-sm dark:border-slate-700">
        <p className="font-semibold">Performance score: {stats.performanceScore}/100</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Optimize heavy sections and reduce nested effects for lightning-fast publish output.</p>
      </div>

      <div className="rounded-lg border border-slate-300/60 p-3 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Figma-like collaboration</p>
          <label className="inline-flex items-center gap-1 text-xs">
            <input type="checkbox" checked={liveCollabEnabled} onChange={(event) => onToggleCollab(event.target.checked)} />
            Live
          </label>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {collaborators.map((name, index) => (
            <span key={name} className="inline-flex items-center gap-1 text-xs">
              <span className={cn("h-2.5 w-2.5 rounded-full", index % 3 === 0 ? "bg-rose-500" : index % 3 === 1 ? "bg-cyan-500" : "bg-amber-500")} />
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-300/60 p-3 text-xs dark:border-slate-700">
        <p className="font-semibold">Production modules included in this studio foundation</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Multi-page builder, header/footer system, reusable blocks, CMS-linked sections, eCommerce block support, undo/redo, responsive preview, and publish workflow.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-300/60 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
